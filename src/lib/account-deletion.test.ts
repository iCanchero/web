import { describe, expect, it } from 'vitest'

import { PlayersApiError } from '@/lib/players-api'

import {
  createDeletionDeadline,
  formatBlockerDate,
  formatDeletionRemaining,
  getRemainingDeletionSeconds,
  isAmbiguousDeletionError,
  isDeletionCodeComplete,
  parseDeletionDeadline,
  sanitizeDeletionCode,
} from './account-deletion'

describe('account deletion utilities', () => {
  it('sanitizes pasted codes and requires six ASCII digits', () => {
    expect(sanitizeDeletionCode(' 12a٣-34567 ')).toBe('123456')
    expect(isDeletionCodeComplete('123456')).toBe(true)
    expect(isDeletionCodeComplete('12345')).toBe(false)
    expect(isDeletionCodeComplete('１２３４５６')).toBe(false)
  })

  it('creates only positive finite absolute deadlines', () => {
    expect(createDeletionDeadline(90, 1_000)).toBe(91_000)
    expect(createDeletionDeadline(0, 1_000)).toBeNull()
    expect(createDeletionDeadline(-1, 1_000)).toBeNull()
    expect(createDeletionDeadline(Number.NaN, 1_000)).toBeNull()
    expect(createDeletionDeadline(Number.POSITIVE_INFINITY, 1_000)).toBeNull()
  })

  it('parses valid ISO deadlines and rejects invalid values', () => {
    expect(parseDeletionDeadline('2026-08-17T12:00:00.000Z')).toBe(
      Date.parse('2026-08-17T12:00:00.000Z'),
    )
    expect(parseDeletionDeadline('not-a-date')).toBeNull()
    expect(parseDeletionDeadline(null)).toBeNull()
  })

  it('rounds remaining sub-seconds up and clamps clock jumps at zero', () => {
    expect(getRemainingDeletionSeconds(2_001, 1_002)).toBe(1)
    expect(getRemainingDeletionSeconds(1_000, 9_000)).toBe(0)
    expect(formatDeletionRemaining(125)).toBe('02:05')
    expect(formatDeletionRemaining(-1)).toBe('00:00')
  })

  it('classifies only transport, ERR1001, and server failures as ambiguous', () => {
    expect(isAmbiguousDeletionError(new PlayersApiError('offline'))).toBe(true)
    expect(
      isAmbiguousDeletionError(
        new PlayersApiError('unknown', { status: 400, code: 'ERR1001' }),
      ),
    ).toBe(true)
    expect(
      isAmbiguousDeletionError(new PlayersApiError('server', { status: 503 })),
    ).toBe(true)
    expect(
      isAmbiguousDeletionError(new PlayersApiError('invalid', { status: 400 })),
    ).toBe(false)
    expect(isAmbiguousDeletionError(new Error('offline'))).toBe(false)
  })

  it('formats blocker dates and safely falls back for bad timezones', () => {
    expect(
      formatBlockerDate('2026-08-17T18:00:00.000Z', 'America/Mexico_City'),
    ).toContain('2026')
    expect(formatBlockerDate('2026-08-17T18:00:00.000Z', 'Bad/Zone')).toContain(
      '2026',
    )
    expect(formatBlockerDate('not-a-date', 'UTC')).toBe('not-a-date')
  })
})
