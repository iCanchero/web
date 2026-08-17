import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PlayersApiError, playersApi } from './players-api'

const fetchMock = vi.fn()

function response(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
  })
}

describe('playersApi', () => {
  beforeEach(() => {
    vi.stubEnv('ICAN_API_URL', 'https://api.example.test///')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('joins the gateway and normalizes username login input', async () => {
    fetchMock.mockResolvedValue(response(200, { customToken: 'token' }))

    await expect(playersApi.loginWithUsername('  @Jugador  ', 'secret')).resolves.toEqual({
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

    await expect(playersApi.requestPasswordReset(' Person@Example.com ')).resolves.toBeUndefined()

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
    await expect(playersApi.resetPassword('reset-token', 'new-password')).resolves.toBeUndefined()

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
        body: JSON.stringify({ token: 'reset-token', newPassword: 'new-password' }),
      }),
    )
  })

  it('preserves structured backend errors without requiring every field', async () => {
    fetchMock.mockResolvedValue(
      response(422, { title: 'Solicitud inválida', detail: 'Código incorrecto', code: 'invalid_code' }),
    )

    const error = await playersApi.verifyPasswordResetCode('person@example.com', '123456').catch(
      (value: unknown) => value,
    )

    expect(error).toBeInstanceOf(PlayersApiError)
    expect(error).toMatchObject({ message: 'Código incorrecto', status: 422, code: 'invalid_code' })
  })

  it('falls back for malformed responses and network failures', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not-json', { status: 500 }))
    await expect(playersApi.requestPasswordReset('person@example.com')).rejects.toMatchObject({
      message: expect.stringContaining('No pudimos conectar'),
      status: 500,
    })

    fetchMock.mockRejectedValueOnce(new Error('offline'))
    await expect(playersApi.requestPasswordReset('person@example.com')).rejects.toMatchObject({
      message: expect.stringContaining('No pudimos conectar'),
    })
  })
})
