import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const app = { name: '[DEFAULT]' }
const getIdToken = vi.fn()
const auth: { currentUser: null | { getIdToken: typeof getIdToken } } = {
  currentUser: null,
}
const getApps = vi.fn(() => [])
const getApp = vi.fn(() => app)
const initializeApp = vi.fn(() => app)
const getAuth = vi.fn(() => auth)
const setPersistence = vi.fn(() => Promise.resolve())
const browserLocalPersistence = { type: 'LOCAL' }

vi.mock('firebase/app', () => ({ getApp, getApps, initializeApp }))
vi.mock('firebase/auth', () => ({
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged: vi.fn(),
  setPersistence,
  signInWithCustomToken: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}))

describe('firebase-auth', () => {
  beforeEach(() => {
    vi.stubEnv('ICAN_FIREBASE_API_KEY', 'test-api-key')
    vi.stubEnv('ICAN_FIREBASE_PROJECT_ID', 'test-project')
    vi.stubEnv('ICAN_FIREBASE_APP_ID', 'test-app')
    getApps.mockReturnValue([])
    getApp.mockClear()
    initializeApp.mockClear()
    getAuth.mockClear()
    setPersistence.mockClear()
    auth.currentUser = null
    getIdToken.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('validates configuration without exposing a missing value', async () => {
    vi.stubEnv('ICAN_FIREBASE_API_KEY', '')
    const firebaseAuth = await import('./firebase-auth')

    await expect(firebaseAuth.getFirebaseAuth()).rejects.toMatchObject({
      code: 'configuration',
      message: expect.not.stringContaining('test-project'),
    })
    expect(initializeApp).not.toHaveBeenCalled()
  })

  it('initializes one app and auth instance with local persistence', async () => {
    vi.resetModules()
    const firebaseAuth = await import('./firebase-auth')

    const first = await firebaseAuth.getFirebaseAuth()
    const second = await firebaseAuth.getFirebaseAuth()

    expect(first).toBe(auth)
    expect(second).toBe(first)
    expect(initializeApp).toHaveBeenCalledTimes(1)
    expect(getAuth).toHaveBeenCalledTimes(1)
    expect(setPersistence).toHaveBeenCalledWith(auth, browserLocalPersistence)
  })

  it('does not initialize Firebase when imported or called during SSR', async () => {
    vi.resetModules()
    const firebaseAuth = await import('./firebase-auth')
    const browserWindow = globalThis.window
    vi.stubGlobal('window', undefined)

    await expect(firebaseAuth.getFirebaseAuth()).rejects.toMatchObject({
      code: 'unavailable',
    })
    expect(initializeApp).not.toHaveBeenCalled()

    vi.stubGlobal('window', browserWindow)
  })

  it('gets a fresh token from the current Firebase user', async () => {
    vi.resetModules()
    getIdToken.mockResolvedValue('id-token')
    auth.currentUser = { getIdToken }
    const firebaseAuth = await import('./firebase-auth')

    await expect(firebaseAuth.getFirebaseIdToken()).resolves.toBe('id-token')
    expect(getIdToken).toHaveBeenCalledTimes(1)
  })

  it('rejects token access when the Firebase session is missing', async () => {
    vi.resetModules()
    const firebaseAuth = await import('./firebase-auth')

    await expect(firebaseAuth.getFirebaseIdToken()).rejects.toMatchObject({
      code: 'unavailable',
      message: expect.stringContaining('sesión'),
    })
  })
})
