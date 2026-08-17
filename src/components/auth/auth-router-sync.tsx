import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'

import { useAuth } from '@/components/auth/auth-provider'

export function AuthRouterSync() {
  const { status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    router.update({
      ...router.options,
      context: {
        ...router.options.context,
        auth: { status },
      },
    })
    void router.invalidate()
  }, [router, status])

  return null
}
