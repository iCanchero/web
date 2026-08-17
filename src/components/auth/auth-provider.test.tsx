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
})
