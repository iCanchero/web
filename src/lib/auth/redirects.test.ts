import { describe, expect, it } from 'vitest'

import {
  DEFAULT_AUTH_REDIRECT,
  sanitizeIdentifier,
  sanitizeRedirect,
} from './redirects'

describe('sanitizeRedirect', () => {
  it.each([
    '/login',
    '/login?redirect=%2Faccount',
    '/reset-password',
    '/reset-password?email=player%40example.com',
  ])('rejects an auth entry route as a post-login destination: %s', (value) => {
    expect(sanitizeRedirect(value)).toBe(DEFAULT_AUTH_REDIRECT)
  })

  it('keeps a relative protected destination intact', () => {
    expect(sanitizeRedirect('/account?from=home#profile')).toBe(
      '/account?from=home#profile',
    )
  })
})

describe('sanitizeIdentifier', () => {
  it.each([
    [' Person@Example.com ', 'person@example.com'],
    ['@Jugador_1', 'jugador_1'],
    ['Jugador_1', 'jugador_1'],
  ])('normalizes %s', (value, expected) => {
    expect(sanitizeIdentifier(value)).toBe(expected)
  })

  it.each(['not-an-identifier', '@person@example.com', 'ab'])(
    'rejects %s',
    (value) => {
      expect(sanitizeIdentifier(value)).toBeUndefined()
    },
  )
})
