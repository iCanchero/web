import { getFirebaseIdToken } from '@/lib/auth/firebase-auth'

const GENERIC_CONNECTION_ERROR =
  'No pudimos conectar con el servicio. Intenta de nuevo más tarde.'

export type UsernameLoginResponse = {
  customToken: string
}

export type VerifyPasswordResetResponse = {
  token: string
}

export type AccountProfile = {
  id: string
  displayName: string | null
  username: string | null
  email: string | null
  phone: string | null
  createdAt: string
  isVerified: boolean
  currentSport: string | null
  isEnabled: boolean
  photoUrl: string | null
}

export type AccountDeletionBlocker = {
  type: 'booking' | 'open_match'
  bookingPublicId: string
  matchPublicId: string | null
  clubPublicId: string
  clubName: string
  courtName: string
  eventStart: string
  eventEnd: string
  deletionEligibleAt: string
  timeZone: string
  isRefundable: boolean
  subjectRole: 'booking_owner' | 'match_participant'
  links: { appPath: string | null; consolePath: string }
}

export type DeletionStatusResponse = {
  deletionRequested: boolean
  expiresAt: string | null
  blockers: AccountDeletionBlocker[]
}

export type DeletionRequestResponse = {
  message: string
  expiresIn: number
}

export type DeletionConfirmedResponse = {
  message: string
}

type BackendApiError = {
  title?: unknown
  detail?: unknown
  code?: unknown
  status?: unknown
  blockers?: unknown
}

export class PlayersApiError extends Error {
  readonly status?: number
  readonly code?: string
  readonly blockers: AccountDeletionBlocker[]

  constructor(
    message: string,
    options?: {
      status?: number
      code?: string
      blockers?: AccountDeletionBlocker[]
    },
  ) {
    super(message)
    this.name = 'PlayersApiError'
    this.status = options?.status
    this.code = options?.code
    this.blockers = options?.blockers ?? []
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function parseBlocker(value: unknown): AccountDeletionBlocker | null {
  if (!isRecord(value) || !isRecord(value.links)) {
    return null
  }

  if (
    (value.type !== 'booking' && value.type !== 'open_match') ||
    typeof value.bookingPublicId !== 'string' ||
    !isNullableString(value.matchPublicId) ||
    typeof value.clubPublicId !== 'string' ||
    typeof value.clubName !== 'string' ||
    typeof value.courtName !== 'string' ||
    typeof value.eventStart !== 'string' ||
    typeof value.eventEnd !== 'string' ||
    typeof value.deletionEligibleAt !== 'string' ||
    typeof value.timeZone !== 'string' ||
    typeof value.isRefundable !== 'boolean' ||
    (value.subjectRole !== 'booking_owner' &&
      value.subjectRole !== 'match_participant') ||
    !isNullableString(value.links.appPath) ||
    typeof value.links.consolePath !== 'string'
  ) {
    return null
  }

  return {
    type: value.type,
    bookingPublicId: value.bookingPublicId,
    matchPublicId: value.matchPublicId,
    clubPublicId: value.clubPublicId,
    clubName: value.clubName,
    courtName: value.courtName,
    eventStart: value.eventStart,
    eventEnd: value.eventEnd,
    deletionEligibleAt: value.deletionEligibleAt,
    timeZone: value.timeZone,
    isRefundable: value.isRefundable,
    subjectRole: value.subjectRole,
    links: {
      appPath: value.links.appPath,
      consolePath: value.links.consolePath,
    },
  }
}

export function parseAccountDeletionBlockers(
  value: unknown,
): AccountDeletionBlocker[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map(parseBlocker)
    .filter((blocker): blocker is AccountDeletionBlocker => blocker !== null)
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
    blockers: parseAccountDeletionBlockers(body?.blockers),
  })
}

type RequestOptions = {
  method: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  authenticated?: boolean
}

async function request<T>(
  path: string,
  { method, body, authenticated = false }: RequestOptions,
): Promise<T> {
  let response: Response
  try {
    const headers: Record<string, string> = {}
    if (authenticated) {
      headers.Authorization = `Bearer ${await getFirebaseIdToken()}`
    }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    response = await fetch(playersUrl(path), {
      method,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
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

export type PlayersApi = {
  loginWithUsername: (
    username: string,
    password: string,
  ) => Promise<UsernameLoginResponse>
  requestPasswordReset: (email: string) => Promise<void>
  verifyPasswordResetCode: (
    email: string,
    code: string,
  ) => Promise<VerifyPasswordResetResponse>
  resetPassword: (token: string, newPassword: string) => Promise<void>
  getCurrentUser: () => Promise<AccountProfile>
  getDeletionStatus: () => Promise<DeletionStatusResponse>
  requestAccountDeletion: () => Promise<DeletionRequestResponse>
  confirmAccountDeletion: (code: string) => Promise<DeletionConfirmedResponse>
}

export const playersApi: PlayersApi = {
  loginWithUsername(username: string, password: string) {
    return request<UsernameLoginResponse>('users/custom-tokens/username', {
      method: 'POST',
      body: {
        username: normalizeUsername(username),
        password,
      },
    })
  },

  requestPasswordReset(email: string) {
    return request<void>('users/verifications/password-reset', {
      method: 'POST',
      body: { email: normalizeEmail(email) },
    })
  },

  verifyPasswordResetCode(email: string, code: string) {
    return request<VerifyPasswordResetResponse>('users/verifications/verify', {
      method: 'POST',
      body: { email: normalizeEmail(email), code: code.trim() },
    })
  },

  resetPassword(token: string, newPassword: string) {
    return request<void>('users/reset-password', {
      method: 'POST',
      body: { token, newPassword },
    })
  },

  getCurrentUser() {
    return request<AccountProfile>('users/me', {
      method: 'GET',
      authenticated: true,
    })
  },

  async getDeletionStatus() {
    const result = await request<DeletionStatusResponse>(
      'users/me/deletion/status',
      { method: 'GET', authenticated: true },
    )
    return {
      ...result,
      blockers: parseAccountDeletionBlockers(result.blockers),
    }
  },

  requestAccountDeletion() {
    return request<DeletionRequestResponse>('users/me/deletion/request', {
      method: 'DELETE',
      authenticated: true,
    })
  },

  confirmAccountDeletion(code: string) {
    return request<DeletionConfirmedResponse>('users/me/deletion/confirm', {
      method: 'POST',
      authenticated: true,
      body: { code: code.trim() },
    })
  },
}

export const loginWithUsername = playersApi.loginWithUsername
export const requestPasswordReset = playersApi.requestPasswordReset
export const verifyPasswordResetCode = playersApi.verifyPasswordResetCode
export const resetPassword = playersApi.resetPassword

export const genericPlayersApiError = GENERIC_CONNECTION_ERROR
