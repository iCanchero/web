import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PlayersApiError } from '@/lib/players-api'
import type * as PlayersApiModule from '@/lib/players-api'
import { TestProviders } from '@/test/test-providers'

import { AccountPage } from './account-page'

const { getCurrentUserMock, navigateMock, useAuthMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  navigateMock: vi.fn(),
  useAuthMock: vi.fn(),
}))

vi.mock('@/lib/players-api', async (importOriginal) => {
  const original = await importOriginal<typeof PlayersApiModule>()
  return {
    ...original,
    playersApi: { ...original.playersApi, getCurrentUser: getCurrentUserMock },
  }
})

vi.mock('@/components/auth/auth-provider', () => ({ useAuth: useAuthMock }))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => navigateMock,
}))

const fullProfile = {
  id: 'user-1',
  displayName: 'Ana Canchera',
  username: 'ana',
  email: 'ana@example.com',
  phone: '+52 55 1234 5678',
  createdAt: '2026-01-15T12:00:00Z',
  isVerified: true,
  currentSport: 'padel',
  isEnabled: true,
  photoUrl: 'https://images.example.test/ana.jpg',
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <TestProviders>
      <QueryClientProvider client={queryClient}>
        <AccountPage />
      </QueryClientProvider>
    </TestProviders>,
  )
}

describe('AccountPage', () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset()
    navigateMock.mockReset()
    useAuthMock.mockReset().mockReturnValue({ logout: vi.fn() })
  })

  it('renders a complete read-only profile', async () => {
    getCurrentUserMock.mockResolvedValue(fullProfile)
    renderPage()

    expect(await screen.findByText('Ana Canchera')).toBeInTheDocument()
    expect(screen.getByText('@ana')).toBeInTheDocument()
    expect(screen.getByText('Verificado')).toBeInTheDocument()
    expect(screen.getByText('+52 55 1234 5678')).toBeInTheDocument()
    expect(screen.getByText('Pádel')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Eliminar cuenta' }),
    ).toHaveAttribute('href', '/delete-account')
  })

  it('renders safe fallback values for missing optional fields', async () => {
    getCurrentUserMock.mockResolvedValue({
      ...fullProfile,
      displayName: null,
      username: null,
      email: null,
      phone: null,
      currentSport: null,
      photoUrl: null,
      isVerified: false,
    })
    renderPage()

    expect(
      (await screen.findAllByText('No configurado')).length,
    ).toBeGreaterThan(3)
    expect(screen.queryByText('Verificado')).not.toBeInTheDocument()
  })

  it('shows stable loading skeletons', () => {
    getCurrentUserMock.mockReturnValue(new Promise(() => undefined))
    renderPage()

    expect(
      screen.getByRole('status', { name: 'Cargando perfil' }),
    ).toBeInTheDocument()
  })

  it('keeps deletion visible and retries a profile error', async () => {
    getCurrentUserMock
      .mockRejectedValueOnce(
        new PlayersApiError('No encontramos tu perfil', { status: 404 }),
      )
      .mockResolvedValueOnce(fullProfile)
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar tu perfil',
    )
    expect(
      screen.getByRole('link', { name: 'Eliminar cuenta' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Ana Canchera')).toBeInTheDocument()
  })

  it('disables logout while it is pending', async () => {
    let resolveLogout: (() => void) | undefined
    const logout = vi.fn(
      () => new Promise<void>((resolve) => (resolveLogout = resolve)),
    )
    useAuthMock.mockReturnValue({ logout })
    getCurrentUserMock.mockResolvedValue(fullProfile)
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Cerrando sesión/ }),
      ).toBeDisabled(),
    )
    resolveLogout?.()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Cerrar sesión' }),
      ).toBeEnabled(),
    )
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/login',
      search: { redirect: '/account' },
      replace: true,
    })
  })
})
