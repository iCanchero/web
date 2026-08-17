import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'

import { AuthLoadingState } from '@/components/auth/auth-shell'
import { useAuth } from '@/components/auth/auth-provider'
import { sanitizeRedirect } from '@/lib/auth/redirects'

export function AuthGate() {
  const { status } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const redirect = sanitizeRedirect(location.href)

  useEffect(() => {
    if (status === 'unauthenticated') {
      void navigate({
        to: '/login',
        search: { redirect },
        replace: true,
      })
    }
  }, [navigate, redirect, status])

  if (status !== 'authenticated') {
    return <AuthLoadingState />
  }

  return <Outlet />
}
