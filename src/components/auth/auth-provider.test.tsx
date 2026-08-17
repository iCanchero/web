import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider, useAuth } from './auth-provider'

const {
  observeAuthStateMock,
  signInWithEmailMock,
  signInWithCustomTokenMock,
  signOutMock,
  loginWithUsernameMock,
} = vi.hoisted(() => ({
  observeAuthStateMock: vi.fn(),
  signInWithEmailMock: vi.fn(),
  signInWithCustomTokenMock: vi.fn(),
  signOutMock: vi.fn(),
  loginWithUsernameMock: vi.fn(),
}))

vi.mock('@/lib/auth/firebase-auth', () => ({
  observeAuthState: observeAuthStateMock,
  signInWithEmail: signInWithEmailMock,
  signInWithCustomToken: signInWithCustomTokenMock,
  signOut: signOutMock,
}))

vi.mock('@/lib/players-api', () => ({
  playersApi: {
    loginWithUsername: loginWithUsernameMock,
  },
}))

const restoredUser = {
  uid: 'uid-1',
  email: 'person@example.com',
  displayName: null,
}

function Consumer({ identifier = '  USERNAME  ' }: { identifier?: string }) {
  const auth = useAuth()
  return (
    <div>
      <output data-testid="status">{auth.status}</output>
      <output data-testid="email">{auth.user?.email ?? ''}</output>
      <button
        onClick={() =>
          void auth
            .loginWithPassword(identifier, 'secret')
            .catch(() => undefined)
        }
      >
        login
      </button>
      <button onClick={() => void auth.logout()}>logout</button>
      <button onClick={() => void auth.finishAccountDeletion()}>delete</button>
    </div>
  )
}

describe('AuthProvider', () => {
  let listener: ((user: typeof restoredUser | null) => void) | undefined
  let unsubscribe: ReturnType<typeof vi.fn>

  beforeEach(() => {
    listener = undefined
    unsubscribe = vi.fn()
    observeAuthStateMock
      .mockReset()
      .mockImplementation(async (nextListener) => {
        listener = nextListener
        return unsubscribe
      })
    signInWithEmailMock.mockReset()
    signInWithCustomTokenMock.mockReset()
    signOutMock.mockReset().mockResolvedValue(undefined)
    loginWithUsernameMock
      .mockReset()
      .mockResolvedValue({ customToken: 'custom-token' })
  })

  it('restores a session and cleans up its observer', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(listener).toBeDefined())
    act(() => listener?.(restoredUser))

    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    )
    expect(screen.getByTestId('email')).toHaveTextContent('person@example.com')
  })

  it('uses Firebase email sign-in for email identifiers', async () => {
    signInWithEmailMock.mockImplementation(async () => {
      act(() => listener?.(restoredUser))
      return restoredUser
    })
    render(
      <AuthProvider>
        <Consumer identifier="  Person@Example.com " />
      </AuthProvider>,
    )

    await waitFor(() => expect(listener).toBeDefined())
    fireEvent.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() =>
      expect(signInWithEmailMock).toHaveBeenCalledWith(
        'person@example.com',
        'secret',
      ),
    )
    expect(loginWithUsernameMock).not.toHaveBeenCalled()
  })

  it('uses the username custom-token exchange without session bootstrap', async () => {
    signInWithCustomTokenMock.mockImplementation(async () => {
      act(() => listener?.(restoredUser))
      return restoredUser
    })
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(listener).toBeDefined())
    fireEvent.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() =>
      expect(loginWithUsernameMock).toHaveBeenCalledWith('username', 'secret'),
    )
    expect(signInWithCustomTokenMock).toHaveBeenCalledWith('custom-token')
  })

  it('propagates rejected credentials and logs out through Firebase', async () => {
    signInWithEmailMock.mockRejectedValue(new Error('invalid'))
    render(
      <AuthProvider>
        <Consumer identifier="person@example.com" />
      </AuthProvider>,
    )

    await waitFor(() => expect(listener).toBeDefined())
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'login' }))
    })
    expect(signInWithEmailMock).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'logout' }))
    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1))
  })

  it('unsubscribes if the async observer resolves after unmount', async () => {
    let resolveObserver: ((value: () => void) => void) | undefined
    observeAuthStateMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveObserver = resolve
        }),
    )

    const view = render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )
    view.unmount()

    const lateUnsubscribe = vi.fn()
    await act(async () => {
      resolveObserver?.(lateUnsubscribe)
    })
    expect(lateUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('clears deletion UI immediately and shares concurrent cleanup', async () => {
    let resolveSignOut: (() => void) | undefined
    signOutMock.mockImplementation(
      () => new Promise<void>((resolve) => (resolveSignOut = resolve)),
    )
    let deletionPromises: Array<Promise<void>> = []

    function DeletionConsumer() {
      const auth = useAuth()
      return (
        <div>
          <output data-testid="deletion-status">{auth.status}</output>
          <button
            onClick={() => {
              deletionPromises = [
                auth.finishAccountDeletion(),
                auth.finishAccountDeletion(),
              ]
            }}
          >
            finish deletion
          </button>
        </div>
      )
    }

    render(
      <AuthProvider>
        <DeletionConsumer />
      </AuthProvider>,
    )
    await waitFor(() => expect(listener).toBeDefined())
    act(() => listener?.(restoredUser))

    fireEvent.click(screen.getByRole('button', { name: 'finish deletion' }))

    expect(screen.getByTestId('deletion-status')).toHaveTextContent(
      'unauthenticated',
    )
    expect(deletionPromises[0]).toBe(deletionPromises[1])
    expect(signOutMock).toHaveBeenCalledTimes(1)
    resolveSignOut?.()
    await Promise.all(deletionPromises)
  })

  it('keeps deletion UI cleared if Firebase sign-out fails', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    signOutMock.mockRejectedValue(new Error('firebase unavailable'))
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )
    await waitFor(() => expect(listener).toBeDefined())
    act(() => listener?.(restoredUser))

    fireEvent.click(screen.getByRole('button', { name: 'delete' }))

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    )
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('allows a later login after deletion cleanup completes', async () => {
    signInWithEmailMock.mockImplementation(async () => {
      act(() => listener?.(restoredUser))
      return restoredUser
    })
    render(
      <AuthProvider>
        <Consumer identifier="person@example.com" />
      </AuthProvider>,
    )
    await waitFor(() => expect(listener).toBeDefined())
    act(() => listener?.(restoredUser))
    fireEvent.click(screen.getByRole('button', { name: 'delete' }))
    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: 'login' }))
    await waitFor(() => expect(signInWithEmailMock).toHaveBeenCalledTimes(1))
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
  })
})
