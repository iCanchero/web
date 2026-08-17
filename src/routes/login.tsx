import { createFileRoute, redirect } from '@tanstack/react-router'

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
  beforeLoad: ({ context, search }) => {
    if (context.auth.status === 'authenticated') {
      throw redirect({ to: search.redirect, replace: true })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { status } = useAuth()
  const search = Route.useSearch()

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
