import { createFileRoute } from '@tanstack/react-router'
import { appleAppAssociation } from '@/server/app-associations'

export const Route = createFileRoute('/.well-known/apple-app-site-association')(
  {
    server: {
      handlers: {
        GET: () => appleAppAssociation(),
      },
    },
  },
)
