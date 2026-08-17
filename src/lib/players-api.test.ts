import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PlayersApiError, playersApi } from './players-api'

const fetchMock = vi.fn()
const getFirebaseIdTokenMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/auth/firebase-auth', () => ({
  getFirebaseIdToken: getFirebaseIdTokenMock,
}))

const blocker = {
  type: 'booking',
  bookingPublicId: 'booking-1',
  matchPublicId: null,
  clubPublicId: 'club-1',
  clubName: 'Club Centro',
  courtName: 'Cancha 1',
  eventStart: '2026-08-17T18:00:00Z',
  eventEnd: '2026-08-17T19:00:00Z',
  deletionEligibleAt: '2026-08-17T21:00:00Z',
  timeZone: 'America/Mexico_City',
  isRefundable: true,
  subjectRole: 'booking_owner',
  links: { appPath: '/bookings/booking-1', consolePath: '/bookings/booking-1' },
} as const

function response(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
  })
}

describe('playersApi', () => {
  beforeEach(() => {
    vi.stubEnv('ICAN_API_URL', 'https://api.example.test///')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    getFirebaseIdTokenMock.mockReset().mockResolvedValue('firebase-id-token')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('joins the gateway and normalizes username login input', async () => {
    fetchMock.mockResolvedValue(response(200, { customToken: 'token' }))

    await expect(
      playersApi.loginWithUsername('  @Jugador  ', 'secret'),
    ).resolves.toEqual({
      customToken: 'token',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/players/users/custom-tokens/username',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'jugador', password: 'secret' }),
      }),
    )
  })

  it('sends the password recovery request and accepts 204', async () => {
    fetchMock.mockResolvedValue(response(204))

    await expect(
      playersApi.requestPasswordReset(' Person@Example.com '),
    ).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/players/users/verifications/password-reset',
      expect.objectContaining({
        body: JSON.stringify({ email: 'person@example.com' }),
      }),
    )
  })

  it('sends code verification and reset password payloads', async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, { token: 'reset-token' }))
      .mockResolvedValueOnce(response(204))

    await expect(
      playersApi.verifyPasswordResetCode('person@example.com', ' 123456 '),
    ).resolves.toEqual({ token: 'reset-token' })
    await expect(
      playersApi.resetPassword('reset-token', 'new-password'),
    ).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.test/players/users/verifications/verify',
      expect.objectContaining({
        body: JSON.stringify({ email: 'person@example.com', code: '123456' }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.test/players/users/reset-password',
      expect.objectContaining({
        body: JSON.stringify({
          token: 'reset-token',
          newPassword: 'new-password',
        }),
      }),
    )
  })

  it('preserves structured backend errors without requiring every field', async () => {
    fetchMock.mockResolvedValue(
      response(422, {
        title: 'Solicitud inválida',
        detail: 'Código incorrecto',
        code: 'invalid_code',
      }),
    )

    const error = await playersApi
      .verifyPasswordResetCode('person@example.com', '123456')
      .catch((value: unknown) => value)

    expect(error).toBeInstanceOf(PlayersApiError)
    expect(error).toMatchObject({
      message: 'Código incorrecto',
      status: 422,
      code: 'invalid_code',
    })
  })

  it('falls back for malformed responses and network failures', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not-json', { status: 500 }))
    await expect(
      playersApi.requestPasswordReset('person@example.com'),
    ).rejects.toMatchObject({
      message: expect.stringContaining('No pudimos conectar'),
      status: 500,
    })

    fetchMock.mockRejectedValueOnce(new Error('offline'))
    await expect(
      playersApi.requestPasswordReset('person@example.com'),
    ).rejects.toMatchObject({
      message: expect.stringContaining('No pudimos conectar'),
    })
  })

  it('uses fresh bearer auth and exact methods for account endpoints', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(200, {
          id: 'user-1',
          displayName: 'Persona',
          username: 'persona',
          email: 'person@example.com',
          phone: null,
          createdAt: '2026-01-01T00:00:00Z',
          isVerified: true,
          currentSport: null,
          isEnabled: true,
          photoUrl: null,
        }),
      )
      .mockResolvedValueOnce(
        response(200, {
          deletionRequested: false,
          expiresAt: null,
          blockers: [],
        }),
      )
      .mockResolvedValueOnce(
        response(200, { message: 'Código enviado', expiresIn: 600 }),
      )
      .mockResolvedValueOnce(response(200, { message: 'Cuenta eliminada' }))

    await playersApi.getCurrentUser()
    await playersApi.getDeletionStatus()
    await playersApi.requestAccountDeletion()
    await playersApi.confirmAccountDeletion(' 123456 ')

    expect(getFirebaseIdTokenMock).toHaveBeenCalledTimes(4)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.test/players/users/me',
      {
        method: 'GET',
        headers: { Authorization: 'Bearer firebase-id-token' },
        body: undefined,
      },
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.test/players/users/me/deletion/status',
      {
        method: 'GET',
        headers: { Authorization: 'Bearer firebase-id-token' },
        body: undefined,
      },
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://api.example.test/players/users/me/deletion/request',
      {
        method: 'DELETE',
        headers: { Authorization: 'Bearer firebase-id-token' },
        body: undefined,
      },
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'https://api.example.test/players/users/me/deletion/confirm',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer firebase-id-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: '123456' }),
      },
    )
  })

  it('preserves only valid structured deletion blockers', async () => {
    fetchMock.mockResolvedValueOnce(
      response(409, {
        detail: 'Hay reservaciones activas',
        code: 'account_deletion_blocked_by_active_bookings',
        blockers: [blocker, { ...blocker, subjectRole: 'owner' }, null],
      }),
    )

    const error = await playersApi
      .requestAccountDeletion()
      .catch((value: unknown) => value)

    expect(error).toBeInstanceOf(PlayersApiError)
    expect(error).toMatchObject({ status: 409, blockers: [blocker] })

    fetchMock.mockResolvedValueOnce(
      response(200, {
        deletionRequested: false,
        expiresAt: null,
        blockers: [blocker, { invalid: true }],
      }),
    )
    await expect(playersApi.getDeletionStatus()).resolves.toMatchObject({
      blockers: [blocker],
    })
  })

  it('keeps unauthenticated password calls free of bearer headers', async () => {
    fetchMock.mockResolvedValue(response(204))

    await playersApi.requestPasswordReset('person@example.com')

    expect(getFirebaseIdTokenMock).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })
})
