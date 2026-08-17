import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthRouterSync } from './auth-router-sync'

const { useAuthMock, invalidateMock, updateMock, routerOptions } = vi.hoisted(
  () => ({
    useAuthMock: vi.fn(),
    invalidateMock: vi.fn().mockResolvedValue(undefined),
    updateMock: vi.fn(),
    routerOptions: { context: { auth: { status: 'loading' } } },
  }),
)

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    options: routerOptions,
    update: updateMock,
    invalidate: invalidateMock,
  }),
}))

describe('AuthRouterSync', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    invalidateMock.mockReset().mockResolvedValue(undefined)
    updateMock.mockReset()
  })

  it('updates router context and invalidates routes when auth changes', () => {
    useAuthMock.mockReturnValue({ status: 'authenticated' })
    const view = render(<AuthRouterSync />)

    expect(updateMock).toHaveBeenLastCalledWith({
      context: { auth: { status: 'authenticated' } },
    })
    expect(invalidateMock).toHaveBeenCalledTimes(1)

    useAuthMock.mockReturnValue({ status: 'unauthenticated' })
    view.rerender(<AuthRouterSync />)

    expect(updateMock).toHaveBeenLastCalledWith({
      context: { auth: { status: 'unauthenticated' } },
    })
    expect(invalidateMock).toHaveBeenCalledTimes(2)
  })
})
