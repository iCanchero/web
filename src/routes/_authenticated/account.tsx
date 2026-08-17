import { createFileRoute } from '@tanstack/react-router'

import { AccountPage } from '@/components/account/account-page'
import { createSeoHead } from '@/lib/seo'

export const Route = createFileRoute('/_authenticated/account')({
  head: () =>
    createSeoHead({
      title: 'Tu cuenta | iCanchero',
      description: 'Administra tu cuenta de iCanchero.',
      path: '/account',
      noIndex: true,
    }),
  component: AccountRoute,
})

function AccountRoute() {
  return <AccountPage />
}
