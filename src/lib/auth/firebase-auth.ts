import type { Auth, User } from 'firebase/auth'

export type AuthStateListener = (user: User | null) => void
export type AuthUnsubscribe = () => void

export class FirebaseAuthError extends Error {
  readonly code: 'configuration' | 'unavailable'

  constructor(code: 'configuration' | 'unavailable', message: string) {
    super(message)
    this.name = 'FirebaseAuthError'
    this.code = code
  }
}

let authPromise: Promise<Auth> | undefined

function getFirebaseConfig() {
  const values = {
    apiKey: import.meta.env.ICAN_FIREBASE_API_KEY,
    projectId: import.meta.env.ICAN_FIREBASE_PROJECT_ID,
    appId: import.meta.env.ICAN_FIREBASE_APP_ID,
  }

  if (Object.values(values).some((value) => !value?.trim())) {
    throw new FirebaseAuthError(
      'configuration',
      'La autenticación no está configurada en este entorno.',
    )
  }

  return values
}

async function initializeFirebaseAuth(): Promise<Auth> {
  if (typeof window === 'undefined') {
    throw new FirebaseAuthError(
      'unavailable',
      'La autenticación solo está disponible en el navegador.',
    )
  }

  const config = getFirebaseConfig()
  const [{ getApp, getApps, initializeApp }, authModule] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ])

  const app = getApps().length > 0 ? getApp() : initializeApp(config)
  const auth = authModule.getAuth(app)

  await authModule.setPersistence(auth, authModule.browserLocalPersistence)

  return auth
}

export function getFirebaseAuth(): Promise<Auth> {
  authPromise ??= initializeFirebaseAuth().catch((error: unknown) => {
    authPromise = undefined
    if (error instanceof FirebaseAuthError) {
      throw error
    }
    throw new FirebaseAuthError(
      'unavailable',
      'No pudimos preparar la autenticación. Intenta de nuevo más tarde.',
    )
  })

  return authPromise
}

export async function observeAuthState(
  listener: AuthStateListener,
): Promise<AuthUnsubscribe> {
  const [auth, authModule] = await Promise.all([
    getFirebaseAuth(),
    import('firebase/auth'),
  ])

  return authModule.onAuthStateChanged(auth, listener)
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const [auth, authModule] = await Promise.all([
    getFirebaseAuth(),
    import('firebase/auth'),
  ])

  const credentials = await authModule.signInWithEmailAndPassword(
    auth,
    email,
    password,
  )
  return credentials.user
}

export async function signInWithCustomToken(token: string): Promise<User> {
  const [auth, authModule] = await Promise.all([
    getFirebaseAuth(),
    import('firebase/auth'),
  ])

  const credentials = await authModule.signInWithCustomToken(auth, token)
  return credentials.user
}

export async function signOut(): Promise<void> {
  const [auth, authModule] = await Promise.all([
    getFirebaseAuth(),
    import('firebase/auth'),
  ])

  await authModule.signOut(auth)
}
