import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { useAuth } from '@/components/auth/auth-provider'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/_authenticated/account')({
  component: AccountPage,
})

function AccountPage() {
  const { user, logout } = useAuth()
  const [pending, setPending] = useState(false)

  const handleLogout = async () => {
    setPending(true)
    try {
      await logout()
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle>Tu cuenta</CardTitle>
          <CardDescription>
            {user?.email ?? 'Tu sesión de iCanchero está activa.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Estamos preparando las herramientas de administración de cuenta para
            la web.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            variant="outline"
            type="button"
            disabled={pending}
            onClick={() => void handleLogout()}
          >
            {pending && (
              <Spinner aria-label="Cargando" data-icon="inline-start" />
            )}
            {pending ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Button>
        </CardFooter>
      </Card>
    </AuthShell>
  )
}
