import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthGate } from './auth-gate'

const { useAuthMock, navigateMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@tanstack/react-router', () => ({
  Outlet: () => <div data-testid="protected-content">Contenido protegido</div>,
  useLocation: () => ({
    href: '/account?from=home#section',
    pathname: '/account',
    search: '?from=home',
    hash: '#section',
  }),
  useNavigate: () => navigateMock,
}))

describe('AuthGate', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    navigateMock.mockReset()
  })

  it('keeps protected content out of the loading render', () => {
    useAuthMock.mockReturnValue({ status: 'loading' })

    render(<AuthGate />)

    expect(screen.getByText('Cargando tu cuenta…')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('renders the outlet only when authenticated', () => {
    useAuthMock.mockReturnValue({ status: 'authenticated' })

    render(<AuthGate />)

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('redirects anonymous users with a relative sanitized target', async () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated' })

    render(<AuthGate />)

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith({
        to: '/login',
        search: { redirect: '/account?from=home#section' },
        replace: true,
      }),
    )
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})
