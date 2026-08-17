import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { AuthLoadingState, AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'
import { useAuth } from '@/components/auth/auth-provider'
import {
  DEFAULT_AUTH_REDIRECT,
  sanitizeEmail,
  sanitizeRedirect,
} from '@/lib/auth/redirects'

type LoginSearch = {
  redirect: string
  email?: string
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: sanitizeRedirect(search.redirect),
    email: sanitizeEmail(search.email),
  }),
  component: LoginPage,
})

function LoginPage() {
  const { status } = useAuth()
  const navigate = useNavigate()
  const search = Route.useSearch()

  useEffect(() => {
    if (status === 'authenticated') {
      void navigate({ to: search.redirect, replace: true })
    }
  }, [navigate, search.redirect, status])

  if (status === 'loading' || status === 'authenticated') {
    return <AuthLoadingState />
  }

  return (
    <AuthShell>
      <LoginForm
        redirect={search.redirect || DEFAULT_AUTH_REDIRECT}
        initialIdentifier={search.email}
      />
    </AuthShell>
  )
}
