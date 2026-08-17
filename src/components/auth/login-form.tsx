import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/components/auth/auth-provider'
import { getAuthErrorMessage } from '@/lib/auth/auth-errors'
import { sanitizeRedirect } from '@/lib/auth/redirects'

export function LoginForm({
  redirect = '/account',
  initialIdentifier = '',
}: {
  redirect?: string
  initialIdentifier?: string
}) {
  const auth = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState(initialIdentifier)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [identifierError, setIdentifierError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const hasIdentifier = identifier.trim().length > 0
    const hasPassword = password.length > 0
    setIdentifierError(!hasIdentifier)
    setPasswordError(!hasPassword)

    if (!hasIdentifier || !hasPassword) {
      setError('Escribe tu correo o usuario y tu contraseña.')
      return
    }

    setError(null)
    setPending(true)
    try {
      await auth.loginWithPassword(identifier, password)
      await navigate({
        to: sanitizeRedirect(redirect),
        replace: true,
      })
    } catch (loginError) {
      setPending(false)
      setError(getAuthErrorMessage(loginError))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inicia sesión</CardTitle>
        <CardDescription>
          Entra con el correo o usuario de tu cuenta de iCanchero.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="flex flex-col gap-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field data-invalid={identifierError}>
              <FieldLabel htmlFor="login-identifier">
                Correo o usuario
              </FieldLabel>
              <Input
                id="login-identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                aria-invalid={identifierError}
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value)
                  setIdentifierError(false)
                  setError(null)
                }}
              />
              <FieldDescription>
                Puedes escribir tu usuario con o sin @.
              </FieldDescription>
            </Field>
            <Field data-invalid={passwordError}>
              <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={passwordError}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setPasswordError(false)
                  setError(null)
                }}
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          <Button className="w-full" type="submit" disabled={pending}>
            {pending && (
              <Spinner aria-label="Cargando" data-icon="inline-start" />
            )}
            {pending ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </Button>
          <Link
            className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            to="/reset-password"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
