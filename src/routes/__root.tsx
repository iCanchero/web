import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { AuthProvider } from '@/components/auth/auth-provider'
import { AuthRouterSync } from '@/components/auth/auth-router-sync'
import {
  THEME_BOOTSTRAP_SCRIPT,
  ThemeProvider,
} from '@/components/theme-provider'
import type { RouterAuthState } from '@/lib/auth/router-auth'
import { createSeoHead } from '@/lib/seo'
import { TooltipProvider } from '#/components/ui/tooltip'

interface MyRouterContext {
  queryClient: QueryClient
  auth: RouterAuthState
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => {
    const seo = createSeoHead()

    return {
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        ...seo.meta,
      ],
      links: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'stylesheet', href: appCss },
      ],
    }
  },
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AuthRouterSync />
            <TooltipProvider>{children}</TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
