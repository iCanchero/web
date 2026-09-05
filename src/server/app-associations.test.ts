// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { androidAppAssociation, appleAppAssociation } from './app-associations'

const fingerprint =
  '38:AC:21:75:88:9C:4D:C0:20:72:69:43:DF:CF:EF:6B:A8:DC:AD:2D:2B:B5:FF:AB:B8:50:B9:C6:5F:DB:58:D1'

afterEach(() => vi.unstubAllEnvs())

describe('website app associations', () => {
  it.each(['com.icanchero.app', 'com.icanchero.app.dev'])(
    'serves an iOS association for %s',
    async (bundleId) => {
      vi.stubEnv('APPLE_TEAM_ID', '3V782SQX2A')
      vi.stubEnv('IOS_BUNDLE_ID', bundleId)
      vi.stubEnv('IOS_APP_ID', '')
      const response = appleAppAssociation()
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
      expect(await response.json()).toEqual({
        applinks: {
          apps: [],
          details: [{ appID: `3V782SQX2A.${bundleId}`, paths: ['*'] }],
        },
      })
    },
  )

  it('supports a verified App ID prefix distinct from the team ID', async () => {
    vi.stubEnv('APPLE_TEAM_ID', '3V782SQX2A')
    vi.stubEnv('IOS_BUNDLE_ID', 'com.icanchero.app')
    vi.stubEnv('IOS_APP_ID', 'ABCDEFGHIJ.com.icanchero.app')
    expect((await appleAppAssociation().json()).applinks.details[0].appID).toBe(
      'ABCDEFGHIJ.com.icanchero.app',
    )
  })

  it.each([
    '',
    'com.icanchero.app',
    'YOUR_APPLE_TEAM_ID.com.icanchero.app',
    '3V782SQX2A.com.icanchero.app.dev',
  ])(
    'does not publish an incomplete or mismatched iOS association: %s',
    (appId) => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.stubEnv('APPLE_TEAM_ID', '')
      vi.stubEnv('IOS_BUNDLE_ID', 'com.icanchero.app')
      vi.stubEnv('IOS_APP_ID', appId)
      const response = appleAppAssociation()
      expect(response.status).toBe(503)
      expect(response.headers.get('cache-control')).toBe('no-store')
    },
  )

  it('supports multiple signing certificates and removes duplicate fingerprints', async () => {
    const second = 'AB:'.repeat(31) + 'AB'
    vi.stubEnv('ANDROID_PACKAGE_NAME', 'com.icanchero.app')
    vi.stubEnv(
      'ANDROID_SHA256_FINGERPRINTS',
      ` ${fingerprint.toLowerCase()}, ${second},${fingerprint}`,
    )
    const response = androidAppAssociation()
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.icanchero.app',
          sha256_cert_fingerprints: [fingerprint, second],
        },
      },
    ])
  })

  it.each([
    '',
    '77:35:F6:4D:D6:70:F3:7A:65:DC:6A:F9:DC:4E:BD:E2:B2:BD:CF:D4',
    'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99',
  ])('rejects missing, SHA-1, or placeholder Android fingerprints', (value) => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv('ANDROID_PACKAGE_NAME', 'com.icanchero.app')
    vi.stubEnv('ANDROID_SHA256_FINGERPRINTS', value)
    const response = androidAppAssociation()
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})
