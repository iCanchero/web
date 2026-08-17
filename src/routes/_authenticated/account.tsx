import { createFileRoute } from '@tanstack/react-router'

import { AccountPage } from '@/components/account/account-page'

export const Route = createFileRoute('/_authenticated/account')({
  head: () => ({ meta: [{ title: 'Tu cuenta | iCanchero' }] }),
  component: AccountRoute,
})

function AccountRoute() {
  return <AccountPage />
}
