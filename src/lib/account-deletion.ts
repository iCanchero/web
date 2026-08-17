import { PlayersApiError } from '@/lib/players-api'

export const DELETION_CONFIRMATION_PENDING_KEY =
  'icanchero:deletion-confirmation-pending'

export function sanitizeDeletionCode(value: string): string {
  return value.replace(/[^0-9]/g, '').slice(0, 6)
}

export function isDeletionCodeComplete(value: string): boolean {
  return /^[0-9]{6}$/.test(value)
}

export function createDeletionDeadline(
  expiresIn: number,
  now = Date.now(),
): number | null {
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
    return null
  }
  return now + expiresIn * 1000
}

export function parseDeletionDeadline(expiresAt: string | null): number | null {
  if (!expiresAt) {
    return null
  }
  const deadline = Date.parse(expiresAt)
  return Number.isFinite(deadline) ? deadline : null
}

export function getRemainingDeletionSeconds(
  deadline: number,
  now = Date.now(),
): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000))
}

export function formatDeletionRemaining(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export function isAmbiguousDeletionError(error: unknown): boolean {
  if (!(error instanceof PlayersApiError)) {
    return false
  }
  return (
    error.status === undefined ||
    error.code === 'ERR1001' ||
    error.status >= 500
  )
}

export function formatBlockerDate(value: string, timeZone: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  try {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }
}
