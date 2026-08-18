import { createFileRoute } from '@tanstack/react-router'

import { AuthShell } from '@/components/auth/auth-shell'
import { PasswordResetForm } from '@/components/auth/password-reset-form'
import { sanitizeEmail, sanitizeIdentifier } from '@/lib/auth/redirects'
import { createSeoHead } from '@/lib/seo'

type ResetSearch = {
  email?: string
  identifier?: string
}

export const Route = createFileRoute('/reset-password')({
  head: () =>
    createSeoHead({
      title: 'Restablecer contraseña | iCanchero',
      description: 'Recupera el acceso a tu cuenta de iCanchero.',
      path: '/reset-password',
      noIndex: true,
    }),
  validateSearch: (search: Record<string, unknown>): ResetSearch => ({
    email: sanitizeEmail(search.email),
    identifier: sanitizeIdentifier(search.identifier),
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const search = Route.useSearch()

  return (
    <AuthShell>
      <PasswordResetForm
        initialIdentifier={search.identifier ?? search.email}
      />
    </AuthShell>
  )
}
