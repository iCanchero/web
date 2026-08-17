import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginForm } from './login-form'

const { useAuthMock, navigateMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  navigateMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => navigateMock,
}))

describe('LoginForm', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    navigateMock.mockReset().mockResolvedValue(undefined)
  })

  it('renders both login inputs with decorative icon addons', () => {
    useAuthMock.mockReturnValue({ loginWithPassword: vi.fn() })

    render(<LoginForm />)

    for (const label of ['Correo o usuario', 'Contraseña']) {
      const group = screen
        .getByLabelText(label)
        .closest('[data-slot="input-group"]')
      expect(group).not.toBeNull()
      expect(
        group?.querySelector('[data-slot="input-group-addon"] svg'),
      ).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('supports keyboard form submission and safe redirect navigation', async () => {
    const loginWithPassword = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({ loginWithPassword })

    render(<LoginForm redirect="/account?tab=profile" />)
    fireEvent.change(screen.getByLabelText('Correo o usuario'), {
      target: { value: ' Person@Example.com ' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'secret' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await waitFor(() =>
      expect(loginWithPassword).toHaveBeenCalledWith(
        ' Person@Example.com ',
        'secret',
      ),
    )
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/account?tab=profile',
      replace: true,
    })
  })

  it('maps credential failures to stable Spanish copy and clears it while editing', async () => {
    const loginWithPassword = vi
      .fn()
      .mockRejectedValue({ code: 'auth/invalid-credential' })
    useAuthMock.mockReturnValue({ loginWithPassword })

    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText('Correo o usuario'), {
      target: { value: 'person@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'secret' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(
      await screen.findByText(
        'El correo, usuario o contraseña no son correctos.',
      ),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'changed' },
    })
    expect(
      screen.queryByText('El correo, usuario o contraseña no son correctos.'),
    ).not.toBeInTheDocument()
  })

  it('keeps the submit button disabled while login is pending', async () => {
    let resolveLogin: (() => void) | undefined
    const loginWithPassword = vi.fn(
      () => new Promise<void>((resolve) => (resolveLogin = resolve)),
    )
    useAuthMock.mockReturnValue({ loginWithPassword })

    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText('Correo o usuario'), {
      target: { value: 'person@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'secret' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Iniciando sesión/ }),
      ).toBeDisabled(),
    )
    resolveLogin?.()
    await waitFor(() => expect(navigateMock).toHaveBeenCalled())
  })
})
