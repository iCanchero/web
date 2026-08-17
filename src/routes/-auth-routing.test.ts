import { isRedirect } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import { Route as AuthenticatedRoute } from './_authenticated'
import { Route as LoginRoute } from './login'

function captureRedirect(runBeforeLoad: () => unknown) {
  try {
    runBeforeLoad()
  } catch (error) {
    expect(isRedirect(error)).toBe(true)
    if (isRedirect(error)) {
      return error.options
    }
  }

  throw new Error('Se esperaba una redirección de TanStack Router.')
}

describe('auth route lifecycle', () => {
  it('redirects an unauthenticated protected match from beforeLoad', () => {
    const options = captureRedirect(() =>
      AuthenticatedRoute.options.beforeLoad?.({
        context: { auth: { status: 'unauthenticated' } },
        location: { href: '/account?tab=profile' },
      } as never),
    )

    expect(options).toMatchObject({
      to: '/login',
      search: { redirect: '/account?tab=profile' },
      replace: true,
    })
  })

  it('allows loading and authenticated protected matches', () => {
    for (const status of ['loading', 'authenticated'] as const) {
      expect(() =>
        AuthenticatedRoute.options.beforeLoad?.({
          context: { auth: { status } },
          location: { href: '/account' },
        } as never),
      ).not.toThrow()
    }
  })

  it('redirects an authenticated login match from beforeLoad', () => {
    const options = captureRedirect(() =>
      LoginRoute.options.beforeLoad?.({
        context: { auth: { status: 'authenticated' } },
        search: { redirect: '/account?tab=profile' },
      } as never),
    )

    expect(options).toMatchObject({
      to: '/account?tab=profile',
      replace: true,
    })
  })
})
