/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly ICAN_FIREBASE_API_KEY: string
  readonly ICAN_FIREBASE_PROJECT_ID: string
  readonly ICAN_FIREBASE_APP_ID: string
  readonly ICAN_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {}
