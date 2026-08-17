import type { AuthStatus } from '@/components/auth/auth-provider'

export type RouterAuthState = {
  status: AuthStatus
}

export function createRouterAuthState(): RouterAuthState {
  return { status: 'loading' }
}
