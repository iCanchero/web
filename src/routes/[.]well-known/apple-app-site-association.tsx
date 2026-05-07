import { createFileRoute } from '@tanstack/react-router'

interface DeepLinkConfig {
  iosAppId: string
  paths: string[]
}

const DEFAULT_PATHS = ['*']

function readConfigFromEnv(): DeepLinkConfig {
  const teamId = process.env.APPLE_TEAM_ID?.trim() ?? ''
  const bundleId = process.env.IOS_BUNDLE_ID?.trim() ?? 'com.icanchero.app'
  const appId = process.env.IOS_APP_ID?.trim() ?? ''

  const iosAppId = appId || (teamId ? `${teamId}.${bundleId}` : bundleId)

  return {
    iosAppId,
    paths: DEFAULT_PATHS,
  }
}

export const Route = createFileRoute(
  '/.well-known/apple-app-site-association',
)({
  server: {
    handlers: {
      GET: async () => {
        const config = readConfigFromEnv()

        const body = {
          applinks: {
            apps: [],
            details: [
              {
                appID: config.iosAppId,
                paths: config.paths,
              },
            ],
          },
        }

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
