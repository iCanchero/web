import { Link, createFileRoute } from '@tanstack/react-router'
import { CheckCircle2Icon } from 'lucide-react'

import {
  AuthPanel,
  AuthPanelContent,
  AuthPanelDescription,
  AuthPanelFooter,
  AuthPanelHeader,
  AuthPanelTitle,
} from '@/components/auth/auth-panel'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { createSeoHead } from '@/lib/seo'

export const Route = createFileRoute('/account-deleted')({
  head: () =>
    createSeoHead({
      title: 'Cuenta eliminada | iCanchero',
      description: 'Confirmación de eliminación de una cuenta de iCanchero.',
      path: '/account-deleted',
      noIndex: true,
    }),
  component: AccountDeletedPage,
})

function AccountDeletedPage() {
  return (
    <AuthShell>
      <AuthPanel>
        <AuthPanelHeader>
          <CheckCircle2Icon className="text-primary" />
          <AuthPanelTitle>Tu eliminación fue aceptada</AuthPanelTitle>
          <AuthPanelDescription>
            Cerramos la sesión de este navegador y completaremos cualquier
            limpieza pendiente de los proveedores.
          </AuthPanelDescription>
        </AuthPanelHeader>
        <AuthPanelContent>
          <p className="text-muted-foreground text-sm">
            Los registros operativos que deban conservarse seguirán la política
            informada y permanecerán anonimizados, sin asociación con tu perfil.
          </p>
        </AuthPanelContent>
        <AuthPanelFooter className="flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link to="/" />}>
            Ir a iCanchero
          </Button>
          <Button
            nativeButton={false}
            render={<a href="https://icanchero.com/privacy" />}
            variant="outline"
          >
            Aviso de privacidad
          </Button>
        </AuthPanelFooter>
      </AuthPanel>
    </AuthShell>
  )
}
