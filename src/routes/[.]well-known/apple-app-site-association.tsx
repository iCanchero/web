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
      GET: async ({ request }) => {
        const config = readConfigFromEnv()
        const url = new URL(request.url)
        const host = request.headers.get('host') ?? ''
        const userAgent = request.headers.get('user-agent') ?? ''
        const forwardedFor = request.headers.get('x-forwarded-for') ?? ''
        const forwardedHost = request.headers.get('x-forwarded-host') ?? ''

        console.info(
          `[well-known][aasa] method=${request.method} host=${host} forwarded_host=${forwardedHost} path=${url.pathname} ua="${userAgent}" xff="${forwardedFor}" app_id="${config.iosAppId}"`,
        )

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
