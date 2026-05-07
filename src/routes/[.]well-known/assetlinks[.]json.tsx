import { createFileRoute } from '@tanstack/react-router'

interface DeepLinkConfig {
  androidPackageName: string
  sha256Fingerprints: string[]
}

function parseFingerprints(value: string | undefined): string[] {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function readConfigFromEnv(): DeepLinkConfig {
  return {
    androidPackageName: process.env.ANDROID_PACKAGE_NAME?.trim() ?? 'com.icanchero.app',
    sha256Fingerprints: parseFingerprints(process.env.ANDROID_SHA256_FINGERPRINTS),
  }
}

export const Route = createFileRoute('/.well-known/assetlinks.json')({
  server: {
    handlers: {
      GET: async () => {
        const config = readConfigFromEnv()

        const body = [
          {
            relation: ['delegate_permission/common.handle_all_urls'],
            target: {
              namespace: 'android_app',
              package_name: config.androidPackageName,
              sha256_cert_fingerprints: config.sha256Fingerprints,
            },
          },
        ]

        return new Response(JSON.stringify(body), {
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'public, max-age=300',
          },
        })
      },
    },
  },
})
