import { createFileRoute } from '@tanstack/react-router'
import { androidAppAssociation } from '@/server/app-associations'

export const Route = createFileRoute('/.well-known/assetlinks.json')({
  server: {
    handlers: {
      GET: () => androidAppAssociation(),
    },
  },
})
