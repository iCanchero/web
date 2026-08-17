import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

import { PasswordResetForm } from './password-reset-form'

const {
  requestPasswordResetMock,
  verifyPasswordResetCodeMock,
  resetPasswordMock,
} = vi.hoisted(() => ({
  requestPasswordResetMock: vi.fn(),
  verifyPasswordResetCodeMock: vi.fn(),
  resetPasswordMock: vi.fn(),
}))

vi.mock('@/lib/players-api', () => ({
  playersApi: {
    requestPasswordReset: requestPasswordResetMock,
    verifyPasswordResetCode: verifyPasswordResetCodeMock,
    resetPassword: resetPasswordMock,
  },
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

describe('PasswordResetForm', () => {
  beforeEach(() => {
    requestPasswordResetMock.mockReset().mockResolvedValue(undefined)
    verifyPasswordResetCodeMock
      .mockReset()
      .mockResolvedValue({ token: 'reset-token' })
    resetPasswordMock.mockReset().mockResolvedValue(undefined)
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function requestCode() {
    render(<PasswordResetForm />)
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: ' Person@Example.com ' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar código' }))
    await screen.findByText('Escribe tu código')
  }

  it('shows anti-enumeration copy after an accepted request', async () => {
    await requestCode()

    expect(
      screen.getByText(
        'Si existe una cuenta con ese correo, recibirás un código.',
      ),
    ).toBeInTheDocument()
    expect(requestPasswordResetMock).toHaveBeenCalledWith('person@example.com')
  })

  it('validates email and code before calling the API', async () => {
    render(<PasswordResetForm />)
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'not-an-email' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar código' }))
    expect(
      await screen.findByText('Escribe un correo electrónico válido.'),
    ).toBeInTheDocument()
    expect(requestPasswordResetMock).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'person@example.com' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar código' }))
    await screen.findByText('Escribe tu código')
    fireEvent.submit(screen.getByRole('button', { name: 'Continuar' }))
    expect(
      await screen.findByText(
        'Escribe el código de seis dígitos que recibiste.',
      ),
    ).toBeInTheDocument()
    expect(verifyPasswordResetCodeMock).not.toHaveBeenCalled()
  })

  it('transitions through verification and updates the password', async () => {
    await requestCode()
    const codeInput = screen.getByRole('textbox', {
      name: 'Código de verificación de seis dígitos',
    })
    fireEvent.change(codeInput, { target: { value: '123456' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText('Crea una contraseña nueva')

    fireEvent.change(screen.getByLabelText('Contraseña nueva'), {
      target: { value: 'new-password' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar contraseña' }))
    await screen.findByText('Contraseña actualizada')

    expect(verifyPasswordResetCodeMock).toHaveBeenCalledWith(
      'person@example.com',
      '123456',
    )
    expect(resetPasswordMock).toHaveBeenCalledWith(
      'reset-token',
      'new-password',
    )
    expect(
      screen.getByRole('link', { name: 'Ir a iniciar sesión' }),
    ).toHaveAttribute('href', '/login')
    expect(screen.queryByText('reset-token')).not.toBeInTheDocument()
    expect(window.localStorage.length).toBe(0)
  })

  it('enforces a 30-second resend deadline based on an absolute clock', async () => {
    vi.useFakeTimers()
    render(<PasswordResetForm />)
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'person@example.com' },
    })
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: 'Enviar código' }))
      await Promise.resolve()
    })
    expect(screen.getByText('Escribe tu código')).toBeInTheDocument()
    const resend = screen.getByRole('button', { name: 'Solicitar otro código' })
    expect(resend).toBeDisabled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000)
    })
    expect(resend).toBeEnabled()
    fireEvent.click(resend)
    await act(async () => {
      await Promise.resolve()
    })
    expect(requestPasswordResetMock).toHaveBeenCalledTimes(2)
  })

  it('does not persist recovery secrets in browser storage or route state', async () => {
    await requestCode()
    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'Código de verificación de seis dígitos',
      }),
      { target: { value: '123456' } },
    )
    fireEvent.submit(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText('Crea una contraseña nueva')
    fireEvent.change(screen.getByLabelText('Contraseña nueva'), {
      target: { value: 'secret-password' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar contraseña' }))
    await screen.findByText('Contraseña actualizada')

    expect(window.localStorage.length).toBe(0)
    expect(document.body.textContent).not.toContain('reset-token')
    expect(document.body.textContent).not.toContain('secret-password')
  })
})
