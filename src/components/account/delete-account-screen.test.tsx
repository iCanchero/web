import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DELETION_CONFIRMATION_PENDING_KEY } from '@/lib/account-deletion'
import { PlayersApiError } from '@/lib/players-api'
import type * as PlayersApiModule from '@/lib/players-api'
import { TestProviders } from '@/test/test-providers'

import { DeleteAccountScreen } from './delete-account-screen'
import { Route as DeleteAccountRoute } from '@/routes/delete-account'

const {
  confirmAccountDeletionMock,
  finishAccountDeletionMock,
  getDeletionStatusMock,
  logoutMock,
  navigateMock,
  requestAccountDeletionMock,
  useAuthMock,
  useBlockerMock,
} = vi.hoisted(() => ({
  confirmAccountDeletionMock: vi.fn(),
  finishAccountDeletionMock: vi.fn(),
  getDeletionStatusMock: vi.fn(),
  logoutMock: vi.fn(),
  navigateMock: vi.fn(),
  requestAccountDeletionMock: vi.fn(),
  useAuthMock: vi.fn(),
  useBlockerMock: vi.fn(),
}))

vi.mock('@/lib/players-api', async (importOriginal) => {
  const original = await importOriginal<typeof PlayersApiModule>()
  return {
    ...original,
    playersApi: {
      ...original.playersApi,
      getDeletionStatus: getDeletionStatusMock,
      requestAccountDeletion: requestAccountDeletionMock,
      confirmAccountDeletion: confirmAccountDeletionMock,
    },
  }
})

vi.mock('@/components/auth/auth-provider', () => ({ useAuth: useAuthMock }))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  Link: ({
    children,
    search,
    to,
  }: {
    children: React.ReactNode
    search?: { redirect?: string }
    to: string
  }) => (
    <a
      href={
        search?.redirect
          ? `${to}?redirect=${encodeURIComponent(search.redirect)}`
          : to
      }
    >
      {children}
    </a>
  ),
  useBlocker: useBlockerMock,
  useNavigate: () => navigateMock,
}))

const blocker = {
  type: 'booking',
  bookingPublicId: 'booking-1',
  matchPublicId: null,
  clubPublicId: 'club-1',
  clubName: 'Club Centro',
  courtName: 'Cancha 1',
  eventStart: '2026-08-17T18:00:00Z',
  eventEnd: '2026-08-17T19:00:00Z',
  deletionEligibleAt: '2026-08-17T21:00:00Z',
  timeZone: 'America/Mexico_City',
  isRefundable: true,
  subjectRole: 'booking_owner',
  links: { appPath: '/bookings/booking-1', consolePath: '/bookings/booking-1' },
} as const

const readyStatus = {
  deletionRequested: false,
  expiresAt: null,
  blockers: [],
}

const DeleteAccountResource = DeleteAccountRoute.options.component!

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  queryClient.setQueryData(['account', 'profile'], { id: 'user-1' })
  return {
    queryClient,
    ...render(
      <TestProviders>
        <QueryClientProvider client={queryClient}>
          <DeleteAccountScreen />
        </QueryClientProvider>
      </TestProviders>,
    ),
  }
}

async function enterCodeAndOpenDialog(code = '123456') {
  fireEvent.change(screen.getByLabelText('Código de verificación'), {
    target: { value: code },
  })
  fireEvent.click(
    screen.getByRole('button', { name: /Continuar|Reintentar eliminación/ }),
  )
  expect(
    await screen.findByRole('heading', {
      name: '¿Eliminar tu cuenta definitivamente?',
    }),
  ).toBeInTheDocument()
}

describe('DeleteAccountScreen', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => null),
    })
    window.sessionStorage.clear()
    getDeletionStatusMock.mockReset().mockResolvedValue(readyStatus)
    requestAccountDeletionMock
      .mockReset()
      .mockResolvedValue({ message: 'Código enviado', expiresIn: 600 })
    confirmAccountDeletionMock
      .mockReset()
      .mockResolvedValue({ message: 'Cuenta eliminada' })
    finishAccountDeletionMock.mockReset().mockResolvedValue(undefined)
    logoutMock.mockReset().mockResolvedValue(undefined)
    navigateMock.mockReset().mockResolvedValue(undefined)
    useBlockerMock.mockReset()
    useAuthMock.mockReset().mockReturnValue({
      status: 'authenticated',
      finishAccountDeletion: finishAccountDeletionMock,
      logout: logoutMock,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads status without automatically requesting a challenge', async () => {
    renderScreen()

    expect(
      await screen.findByRole('button', {
        name: 'Enviar código de verificación',
      }),
    ).toBeInTheDocument()
    expect(getDeletionStatusMock).toHaveBeenCalledTimes(1)
    expect(requestAccountDeletionMock).not.toHaveBeenCalled()
  })

  it('requests once and derives an absolute code deadline', async () => {
    renderScreen()
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Enviar código de verificación',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: /Enviando código/ }))

    expect(await screen.findByText(/Vigencia restante/)).toHaveTextContent(
      '10:00',
    )
    expect(requestAccountDeletionMock).toHaveBeenCalledTimes(1)
  })

  it('resumes an active challenge from expiresAt', async () => {
    getDeletionStatusMock.mockResolvedValue({
      deletionRequested: true,
      expiresAt: new Date(Date.now() + 120_000).toISOString(),
      blockers: [],
    })
    renderScreen()

    expect(await screen.findByText(/Vigencia restante/)).toHaveTextContent(
      '02:00',
    )
    expect(requestAccountDeletionMock).not.toHaveBeenCalled()
  })

  it('renders blockers without app or console links and refreshes status', async () => {
    getDeletionStatusMock
      .mockResolvedValueOnce({ ...readyStatus, blockers: [blocker] })
      .mockResolvedValueOnce(readyStatus)
    renderScreen()

    expect(await screen.findByText('Club Centro')).toBeInTheDocument()
    expect(screen.getByText('Cancha 1')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /booking/i }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar estado' }))
    expect(
      await screen.findByRole('button', {
        name: 'Enviar código de verificación',
      }),
    ).toBeInTheDocument()
    expect(getDeletionStatusMock).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['club_ownership_transfer_required', 'Transfiere la propiedad del club'],
    [
      'admin_account_deletion_forbidden',
      'Esta cuenta requiere atención del equipo',
    ],
  ])('renders terminal policy error %s', async (code, title) => {
    requestAccountDeletionMock.mockRejectedValue(
      new PlayersApiError('Contacta soporte', { status: 409, code }),
    )
    renderScreen()
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Enviar código de verificación',
      }),
    )

    expect(await screen.findByText(title)).toBeInTheDocument()
    expect(screen.getByText('Contacta soporte')).toBeInTheDocument()
  })

  it('clears an invalid code, closes the dialog, and keeps the challenge', async () => {
    confirmAccountDeletionMock.mockRejectedValue(
      new PlayersApiError('Código incorrecto', {
        status: 400,
        code: 'deletion_challenge_invalid',
      }),
    )
    renderScreen()
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Enviar código de verificación',
      }),
    )
    await screen.findByText(/Vigencia restante/)
    await enterCodeAndOpenDialog()
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' }),
    )

    expect(await screen.findByText('Código incorrecto')).toBeInTheDocument()
    expect(screen.getByLabelText('Código de verificación')).toHaveValue('')
    expect(
      screen.queryByRole('heading', {
        name: '¿Eliminar tu cuenta definitivamente?',
      }),
    ).not.toBeInTheDocument()
  })

  it.each([
    ['deletion_challenge_expired', 'El código venció'],
    ['deletion_challenge_attempts_exceeded', 'Demasiados intentos'],
  ])('returns %s to explicit request state', async (errorCode, detail) => {
    confirmAccountDeletionMock.mockRejectedValue(
      new PlayersApiError(detail, { status: 400, code: errorCode }),
    )
    renderScreen()
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Enviar código de verificación',
      }),
    )
    await screen.findByText(/Vigencia restante/)
    await enterCodeAndOpenDialog()
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' }),
    )

    expect(
      await screen.findByRole('button', {
        name: 'Enviar código de verificación',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(detail)).toBeInTheDocument()
    expect(sessionStorage.getItem(DELETION_CONFIRMATION_PENDING_KEY)).toBeNull()
  })

  it('preserves code and marker after an ambiguous failure and retries', async () => {
    confirmAccountDeletionMock
      .mockRejectedValueOnce(new PlayersApiError('Servidor', { status: 503 }))
      .mockResolvedValueOnce({ message: 'Cuenta eliminada' })
    renderScreen()
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Enviar código de verificación',
      }),
    )
    await screen.findByText(/Vigencia restante/)
    await enterCodeAndOpenDialog()
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' }),
    )

    expect((await screen.findAllByText('Reintentar eliminación')).length).toBe(
      2,
    )
    expect(screen.getByLabelText('Código de verificación')).toHaveValue(
      '123456',
    )
    expect(sessionStorage.getItem(DELETION_CONFIRMATION_PENDING_KEY)).toBe(
      'true',
    )
    await enterCodeAndOpenDialog()
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' }),
    )
    await waitFor(() =>
      expect(confirmAccountDeletionMock).toHaveBeenCalledTimes(2),
    )
  })

  it('allows direct idempotent retry after ambiguous reload without a profile', async () => {
    sessionStorage.setItem(DELETION_CONFIRMATION_PENDING_KEY, 'true')
    getDeletionStatusMock.mockRejectedValue(
      new PlayersApiError('Sin perfil', {
        status: 404,
        code: 'profile_not_provisioned',
      }),
    )
    renderScreen()

    expect((await screen.findAllByText('Reintentar eliminación')).length).toBe(
      2,
    )
    await enterCodeAndOpenDialog()
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' }),
    )

    await waitFor(() =>
      expect(confirmAccountDeletionMock).toHaveBeenCalledWith('123456'),
    )
    expect(requestAccountDeletionMock).not.toHaveBeenCalled()
  })

  it('keeps the destructive dialog open and runs successful cleanup once', async () => {
    let resolveConfirmation: (() => void) | undefined
    confirmAccountDeletionMock.mockImplementation(
      () => new Promise<void>((resolve) => (resolveConfirmation = resolve)),
    )
    const { queryClient } = renderScreen()
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Enviar código de verificación',
      }),
    )
    await screen.findByText(/Vigencia restante/)
    await enterCodeAndOpenDialog()
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' }),
    )
    fireEvent.click(screen.getByRole('button', { name: /Eliminando cuenta/ }))

    expect(
      screen.getByRole('button', { name: /Eliminando cuenta/ }),
    ).toBeDisabled()
    expect(
      screen.getByRole('heading', {
        name: '¿Eliminar tu cuenta definitivamente?',
      }),
    ).toBeInTheDocument()
    expect(confirmAccountDeletionMock).toHaveBeenCalledTimes(1)

    resolveConfirmation?.()
    await waitFor(() =>
      expect(finishAccountDeletionMock).toHaveBeenCalledTimes(1),
    )
    expect(queryClient.getQueryData(['account', 'profile'])).toBeUndefined()
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/account-deleted',
      replace: true,
    })
    expect(sessionStorage.getItem(DELETION_CONFIRMATION_PENDING_KEY)).toBeNull()
  })

  it('recomputes expiry after a focus clock jump', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const start = Date.now()
    getDeletionStatusMock.mockResolvedValue({
      deletionRequested: true,
      expiresAt: new Date(start + 30_000).toISOString(),
      blockers: [],
    })
    renderScreen()
    await vi.waitFor(() =>
      expect(screen.getByText(/Vigencia restante/)).toBeInTheDocument(),
    )

    vi.setSystemTime(start + 31_000)
    act(() => window.dispatchEvent(new Event('focus')))

    expect(
      await screen.findByText('El código venció. Solicita uno nuevo.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Enviar código nuevo' }),
    ).toBeInTheDocument()
  })
})

describe('DeleteAccountResource', () => {
  beforeEach(() => {
    useAuthMock.mockReset().mockReturnValue({
      status: 'unauthenticated',
      logout: logoutMock,
    })
  })

  it('renders the public resource and safe login redirect while logged out', () => {
    render(
      <TestProviders>
        <DeleteAccountResource />
      </TestProviders>,
    )

    expect(
      screen.getByText('Eliminar tu cuenta de iCanchero'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Abrir esta página no envía correos/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: /Iniciar sesión para eliminar mi cuenta/,
      }),
    ).toHaveAttribute('href', '/login?redirect=%2Fdelete-account')
  })
})
