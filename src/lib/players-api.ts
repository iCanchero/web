const GENERIC_CONNECTION_ERROR =
  'No pudimos conectar con el servicio. Intenta de nuevo más tarde.'

export type UsernameLoginResponse = {
  customToken: string
}

export type VerifyPasswordResetResponse = {
  token: string
}

type BackendApiError = {
  title?: unknown
  detail?: unknown
  code?: unknown
  status?: unknown
}

export class PlayersApiError extends Error {
  readonly status?: number
  readonly code?: string

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message)
    this.name = 'PlayersApiError'
    this.status = options?.status
    this.code = options?.code
  }
}

let normalizedBaseUrl: string | undefined

function getBaseUrl(): string {
  if (normalizedBaseUrl) {
    return normalizedBaseUrl
  }

  const configuredUrl = import.meta.env.ICAN_API_URL
  if (!configuredUrl?.trim()) {
    throw new PlayersApiError(GENERIC_CONNECTION_ERROR)
  }

  const baseUrl = configuredUrl.trim().replace(/\/+$/, '')
  normalizedBaseUrl = baseUrl
  return baseUrl
}

function playersUrl(path: string): string {
  return `${getBaseUrl()}/players/${path.replace(/^\/+/, '')}`
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function asStatus(value: unknown, fallback: number): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  return fallback > 0 ? fallback : undefined
}

async function parseResponseError(
  response: Response,
): Promise<PlayersApiError> {
  let body: BackendApiError | undefined
  try {
    const parsed: unknown = await response.json()
    if (parsed && typeof parsed === 'object') {
      body = parsed
    }
  } catch {
    body = undefined
  }

  const code = asString(body?.code)
  const detail = asString(body?.detail)
  const title = asString(body?.title)
  const message = detail ?? title ?? code ?? GENERIC_CONNECTION_ERROR

  return new PlayersApiError(message, {
    code,
    status: asStatus(body?.status, response.status),
  })
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(playersUrl(path), {
      method: 'POST',
      headers:
        body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new PlayersApiError(GENERIC_CONNECTION_ERROR)
  }

  if (!response.ok) {
    throw await parseResponseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new PlayersApiError(GENERIC_CONNECTION_ERROR, {
      status: response.status,
    })
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizeUsername(username: string): string {
  const normalized = username.trim().toLowerCase()
  return normalized.startsWith('@') ? normalized.slice(1) : normalized
}

export const playersApi = {
  loginWithUsername(username: string, password: string) {
    return request<UsernameLoginResponse>('users/custom-tokens/username', {
      username: normalizeUsername(username),
      password,
    })
  },

  requestPasswordReset(email: string) {
    return request<void>('users/verifications/password-reset', {
      email: normalizeEmail(email),
    })
  },

  verifyPasswordResetCode(email: string, code: string) {
    return request<VerifyPasswordResetResponse>('users/verifications/verify', {
      email: normalizeEmail(email),
      code: code.trim(),
    })
  },

  resetPassword(token: string, newPassword: string) {
    return request<void>('users/reset-password', { token, newPassword })
  },
}

export const loginWithUsername = playersApi.loginWithUsername
export const requestPasswordReset = playersApi.requestPasswordReset
export const verifyPasswordResetCode = playersApi.verifyPasswordResetCode
export const resetPassword = playersApi.resetPassword

export const genericPlayersApiError = GENERIC_CONNECTION_ERROR
