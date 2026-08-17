import { Outlet } from '@tanstack/react-router'

import { AuthLoadingState } from '@/components/auth/auth-shell'
import { useAuth } from '@/components/auth/auth-provider'

export function AuthGate() {
  const { status } = useAuth()

  if (status !== 'authenticated') {
    return <AuthLoadingState />
  }

  return <Outlet />
}
