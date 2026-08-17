import { Navigate, createFileRoute } from '@tanstack/react-router'

import { useAuth } from '@/components/auth/auth-provider'
import { AuthLoadingState } from '@/components/auth/auth-shell'
import { createSeoHead } from '@/lib/seo'

export const Route = createFileRoute('/')({
  head: () => createSeoHead(),
  component: HomePage,
})

function HomePage() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <AuthLoadingState />
  }

  return <Navigate to={status === 'authenticated' ? '/account' : '/login'} />
}
