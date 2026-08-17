import { describe, expect, it } from 'vitest'

import { DEFAULT_AUTH_REDIRECT, sanitizeRedirect } from './redirects'

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
