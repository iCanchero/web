import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthGate } from '@/components/auth/auth-gate'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (context.auth.status === 'unauthenticated') {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
        replace: true,
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <AuthGate />
}
