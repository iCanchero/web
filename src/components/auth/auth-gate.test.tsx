import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TestProviders } from '@/test/test-providers'

import { AuthGate } from './auth-gate'

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}))

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@tanstack/react-router', () => ({
  Outlet: () => <div data-testid="protected-content">Contenido protegido</div>,
}))

describe('AuthGate', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
  })

  it('keeps protected content out of the loading render', () => {
    useAuthMock.mockReturnValue({ status: 'loading' })

    render(
      <TestProviders>
        <AuthGate />
      </TestProviders>,
    )

    expect(screen.getByText('Cargando tu cuenta…')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('renders the outlet only when authenticated', () => {
    useAuthMock.mockReturnValue({ status: 'authenticated' })

    render(
      <TestProviders>
        <AuthGate />
      </TestProviders>,
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('keeps protected content out while the route guard redirects', () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated' })

    render(
      <TestProviders>
        <AuthGate />
      </TestProviders>,
    )

    expect(screen.getByText('Cargando tu cuenta…')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})
