export const DEFAULT_AUTH_REDIRECT = '/account'

export function sanitizeRedirect(value: unknown): string {
  if (typeof value !== 'string') {
    return DEFAULT_AUTH_REDIRECT
  }

  const candidate = value.trim()
  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    /^[a-z][a-z\d+.-]*:/i.test(candidate)
  ) {
    return DEFAULT_AUTH_REDIRECT
  }

  const pathname = candidate.split(/[?#]/, 1)[0]
  if (pathname === '/login' || pathname === '/reset-password') {
    return DEFAULT_AUTH_REDIRECT
  }

  return candidate
}

export function sanitizeEmail(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const email = value.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined
}

export function sanitizeIdentifier(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  const email = sanitizeEmail(normalized)
  if (email) {
    return email
  }

  const username =
    normalized.startsWith('@') && normalized.indexOf('@', 1) < 0
      ? normalized.slice(1)
      : normalized
  return /^[a-z0-9][a-z0-9_]{2,23}$/.test(username) ? username : undefined
}
