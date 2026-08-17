import { createFileRoute } from '@tanstack/react-router'

import { AuthGate } from '@/components/auth/auth-gate'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <AuthGate />
}
