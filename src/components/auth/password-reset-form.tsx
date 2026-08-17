import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  AuthPanel,
  AuthPanelContent,
  AuthPanelDescription,
  AuthPanelFooter,
  AuthPanelHeader,
  AuthPanelTitle,
} from '@/components/auth/auth-panel'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { getPasswordResetErrorMessage } from '@/lib/auth/auth-errors'
import { playersApi } from '@/lib/players-api'
import { sanitizeEmail } from '@/lib/auth/redirects'
import { Link } from '@tanstack/react-router'

type ResetStep = 'email' | 'code' | 'password' | 'success'

const GENERIC_REQUEST_MESSAGE =
  'Si existe una cuenta con ese correo, recibirás un código.'

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function PasswordResetForm({
  initialEmail = '',
}: {
  initialEmail?: string
}) {
  const [step, setStep] = useState<ResetStep>('email')
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [resendDeadline, setResendDeadline] = useState<number | null>(null)
  const [resendSeconds, setResendSeconds] = useState(0)

  useEffect(() => {
    if (resendDeadline === null) {
      setResendSeconds(0)
      return
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, resendDeadline - Date.now())
      setResendSeconds(Math.ceil(remaining / 1000))
      if (remaining === 0) {
        setResendDeadline(null)
      }
    }

    updateRemaining()
    const timer = window.setInterval(updateRemaining, 250)
    return () => window.clearInterval(timer)
  }, [resendDeadline])

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = normalizeEmail(email)
    if (!sanitizeEmail(normalizedEmail)) {
      setError('Escribe un correo electrónico válido.')
      return
    }

    setEmail(normalizedEmail)
    setError(null)
    setNotice(null)
    setPending(true)
    try {
      await playersApi.requestPasswordReset(normalizedEmail)
      setNotice(GENERIC_REQUEST_MESSAGE)
      setCode('')
      setResendDeadline(Date.now() + 30_000)
      setStep('code')
    } catch (requestError) {
      setError(getPasswordResetErrorMessage(requestError))
    } finally {
      setPending(false)
    }
  }

  const resendCode = async () => {
    if (resendSeconds > 0 || pending) {
      return
    }

    setError(null)
    setPending(true)
    try {
      await playersApi.requestPasswordReset(email)
      setCode('')
      setNotice(GENERIC_REQUEST_MESSAGE)
      setResendDeadline(Date.now() + 30_000)
    } catch (requestError) {
      setError(getPasswordResetErrorMessage(requestError))
    } finally {
      setPending(false)
    }
  }

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setError('Escribe el código de seis dígitos que recibiste.')
      return
    }

    setError(null)
    setPending(true)
    try {
      const response = await playersApi.verifyPasswordResetCode(email, code)
      setToken(response.token)
      setCode('')
      setStep('password')
    } catch (verifyError) {
      setError(getPasswordResetErrorMessage(verifyError))
    } finally {
      setPending(false)
    }
  }

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos seis caracteres.')
      return
    }
    if (!token) {
      setError('El enlace de recuperación ya no es válido. Solicita uno nuevo.')
      setStep('email')
      return
    }

    setError(null)
    setPending(true)
    try {
      await playersApi.resetPassword(token, newPassword)
      setToken(null)
      setNewPassword('')
      setCode('')
      setStep('success')
    } catch (resetError) {
      setError(getPasswordResetErrorMessage(resetError))
    } finally {
      setPending(false)
    }
  }

  if (step === 'email') {
    return (
      <AuthPanel>
        <AuthPanelHeader>
          <AuthPanelTitle>Recupera tu contraseña</AuthPanelTitle>
          <AuthPanelDescription>
            Te enviaremos un código al correo de tu cuenta.
          </AuthPanelDescription>
        </AuthPanelHeader>
        <form onSubmit={submitEmail} noValidate>
          <AuthPanelContent className="flex flex-col gap-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FieldGroup>
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="reset-email">
                  Correo electrónico
                </FieldLabel>
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(error)}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError(null)
                  }}
                />
              </Field>
            </FieldGroup>
          </AuthPanelContent>
          <AuthPanelFooter className="mt-6 flex-col items-stretch gap-4">
            <Button className="w-full" type="submit" disabled={pending}>
              {pending && (
                <Spinner aria-label="Cargando" data-icon="inline-start" />
              )}
              {pending ? 'Enviando…' : 'Enviar código'}
            </Button>
            <Link
              className="text-muted-foreground text-center text-sm underline-offset-4 hover:underline"
              to="/login"
              search={{ redirect: '/account' }}
            >
              Volver a iniciar sesión
            </Link>
          </AuthPanelFooter>
        </form>
      </AuthPanel>
    )
  }

  if (step === 'code') {
    return (
      <AuthPanel>
        <AuthPanelHeader>
          <AuthPanelTitle>Escribe tu código</AuthPanelTitle>
          <AuthPanelDescription>
            Revisa {email} y escribe el código de seis dígitos.
          </AuthPanelDescription>
        </AuthPanelHeader>
        <form onSubmit={submitCode} noValidate>
          <AuthPanelContent className="flex flex-col gap-6">
            {notice && (
              <Alert>
                <AlertDescription>{notice}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FieldGroup>
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="reset-code">
                  Código de verificación
                </FieldLabel>
                <InputOTP
                  id="reset-code"
                  maxLength={6}
                  value={code}
                  onChange={(value) => {
                    setCode(value.replace(/\D/g, '').slice(0, 6))
                    setError(null)
                  }}
                  inputMode="numeric"
                  pattern="^\d+$"
                  aria-label="Código de verificación de seis dígitos"
                  aria-invalid={Boolean(error)}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription>
                  {resendSeconds > 0
                    ? `Puedes solicitar otro código en ${resendSeconds}s.`
                    : 'Si no llegó, puedes solicitar otro código.'}
                </FieldDescription>
              </Field>
            </FieldGroup>
          </AuthPanelContent>
          <AuthPanelFooter className="mt-6 flex-col items-stretch gap-4">
            <Button className="w-full" type="submit" disabled={pending}>
              {pending && (
                <Spinner aria-label="Cargando" data-icon="inline-start" />
              )}
              {pending ? 'Verificando…' : 'Continuar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={pending || resendSeconds > 0}
              onClick={() => void resendCode()}
            >
              {pending && (
                <Spinner aria-label="Cargando" data-icon="inline-start" />
              )}
              Solicitar otro código
            </Button>
          </AuthPanelFooter>
        </form>
      </AuthPanel>
    )
  }

  if (step === 'password') {
    return (
      <AuthPanel>
        <AuthPanelHeader>
          <AuthPanelTitle>Crea una contraseña nueva</AuthPanelTitle>
          <AuthPanelDescription>
            Usa al menos seis caracteres para proteger tu cuenta.
          </AuthPanelDescription>
        </AuthPanelHeader>
        <form onSubmit={submitPassword} noValidate>
          <AuthPanelContent className="flex flex-col gap-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FieldGroup>
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="reset-new-password">
                  Contraseña nueva
                </FieldLabel>
                <Input
                  id="reset-new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(error)}
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value)
                    setError(null)
                  }}
                />
                <FieldDescription>
                  La contraseña debe tener al menos seis caracteres.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </AuthPanelContent>
          <AuthPanelFooter className="mt-6">
            <Button className="w-full" type="submit" disabled={pending}>
              {pending && (
                <Spinner aria-label="Cargando" data-icon="inline-start" />
              )}
              {pending ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
          </AuthPanelFooter>
        </form>
      </AuthPanel>
    )
  }

  return (
    <AuthPanel>
      <AuthPanelHeader>
        <AuthPanelTitle>Contraseña actualizada</AuthPanelTitle>
        <AuthPanelDescription>
          Ya puedes iniciar sesión con tu nueva contraseña.
        </AuthPanelDescription>
      </AuthPanelHeader>
      <AuthPanelContent>
        <Alert>
          <AlertDescription>
            Tu contraseña se actualizó correctamente.
          </AlertDescription>
        </Alert>
      </AuthPanelContent>
      <AuthPanelFooter>
        <Button
          className="w-full"
          render={
            <Link
              to="/login"
              search={{ redirect: '/account', email: sanitizeEmail(email) }}
            />
          }
        >
          Ir a iniciar sesión
        </Button>
      </AuthPanelFooter>
    </AuthPanel>
  )
}
