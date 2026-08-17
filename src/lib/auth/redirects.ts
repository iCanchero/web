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
