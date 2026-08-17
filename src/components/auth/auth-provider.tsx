import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { playersApi } from '@/lib/players-api'
import {
  observeAuthState,
  signInWithCustomToken,
  signInWithEmail,
  signOut,
} from '@/lib/auth/firebase-auth'
import type { AuthUnsubscribe } from '@/lib/auth/firebase-auth'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthUser = {
  uid: string
  email: string | null
  displayName: string | null
}

export type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  loginWithPassword: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function toAuthUser(user: {
  uid: string
  email: string | null
  displayName: string | null
}): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const statusRef = useRef<AuthStatus>('loading')
  const waitersRef = useRef<Array<() => void>>([])

  const setAuthState = useCallback((nextUser: AuthUser | null) => {
    const nextStatus: AuthStatus = nextUser
      ? 'authenticated'
      : 'unauthenticated'
    statusRef.current = nextStatus
    setUser(nextUser)
    setStatus(nextStatus)

    if (nextUser) {
      const waiters = waitersRef.current
      waitersRef.current = []
      waiters.forEach((resolve) => resolve())
    }
  }, [])

  useEffect(() => {
    let active = true
    let unsubscribe: AuthUnsubscribe | undefined

    void observeAuthState((firebaseUser) => {
      if (active) {
        setAuthState(firebaseUser ? toAuthUser(firebaseUser) : null)
      }
    })
      .then((nextUnsubscribe) => {
        if (active) {
          unsubscribe = nextUnsubscribe
        } else {
          nextUnsubscribe()
        }
      })
      .catch(() => {
        if (active) {
          setAuthState(null)
        }
      })

    return () => {
      active = false
      unsubscribe?.()
      waitersRef.current = []
    }
  }, [setAuthState])

  const loginWithPassword = useCallback(
    async (identifier: string, password: string) => {
      const normalizedIdentifier = identifier.trim().toLowerCase()

      try {
        if (normalizedIdentifier.includes('@')) {
          await signInWithEmail(normalizedIdentifier, password)
        } else {
          const username = normalizedIdentifier.startsWith('@')
            ? normalizedIdentifier.slice(1)
            : normalizedIdentifier
          const { customToken } = await playersApi.loginWithUsername(
            username,
            password,
          )
          await signInWithCustomToken(customToken)
        }

        if (statusRef.current !== 'authenticated') {
          await new Promise<void>((resolve) => {
            waitersRef.current.push(resolve)
          })
        }
      } catch (error) {
        waitersRef.current = []
        throw error
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    await signOut()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, loginWithPassword, logout }),
    [loginWithPassword, logout, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
  }
  return context
}
