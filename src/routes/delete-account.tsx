import { Link, createFileRoute } from '@tanstack/react-router'
import { MailIcon, ShieldCheckIcon } from 'lucide-react'

import { AccountShell } from '@/components/account/account-shell'
import { DeleteAccountScreen } from '@/components/account/delete-account-screen'
import {
  AuthPanel,
  AuthPanelContent,
  AuthPanelDescription,
  AuthPanelFooter,
  AuthPanelHeader,
  AuthPanelTitle,
} from '@/components/auth/auth-panel'
import { useAuth } from '@/components/auth/auth-provider'
import { AuthLoadingState, AuthShell } from '@/components/auth/auth-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { createSeoHead } from '@/lib/seo'

export const Route = createFileRoute('/delete-account')({
  head: () =>
    createSeoHead({
      title: 'Eliminar cuenta | iCanchero',
      description:
        'Recurso oficial para solicitar la eliminación de tu cuenta de iCanchero y los datos asociados.',
      path: '/delete-account',
    }),
  component: DeleteAccountResource,
})

function DeleteAccountResource() {
  const { status } = useAuth()

  if (status === 'loading') return <AuthLoadingState />
  if (status === 'authenticated') {
    return (
      <AccountShell>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-primary text-sm font-medium">Privacidad</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Eliminar cuenta
            </h1>
          </div>
          <DeleteAccountScreen />
        </div>
      </AccountShell>
    )
  }

  return (
    <AuthShell>
      <AuthPanel>
        <AuthPanelHeader>
          <AuthPanelTitle>Eliminar tu cuenta de iCanchero</AuthPanelTitle>
          <AuthPanelDescription>
            Este es el recurso oficial para solicitar la eliminación de tu
            cuenta y los datos asociados.
          </AuthPanelDescription>
        </AuthPanelHeader>
        <AuthPanelContent className="flex flex-col gap-4">
          <Alert>
            <ShieldCheckIcon />
            <AlertTitle>Proceso protegido por correo</AlertTitle>
            <AlertDescription>
              Inicia sesión, solicita un código de seis dígitos y confirma la
              eliminación. Abrir esta página no envía correos ni modifica tu
              cuenta.
            </AlertDescription>
          </Alert>
          <p className="text-muted-foreground text-sm">
            Se eliminarán tu cuenta, perfil e identificadores directos. Las
            reservas y pagos necesarios para la operación pueden conservarse
            anonimizados y sin asociación a tu perfil. Esta acción no se puede
            deshacer.
          </p>
          <p className="text-muted-foreground text-sm">
            Si necesitas ayuda, escribe a{' '}
            <a
              className="underline underline-offset-4"
              href="mailto:icancheroapp@gmail.com"
            >
              icancheroapp@gmail.com
            </a>
            . También puedes consultar nuestro{' '}
            <a
              className="underline underline-offset-4"
              href="https://icanchero.com/privacy"
            >
              aviso de privacidad
            </a>
            .
          </p>
        </AuthPanelContent>
        <AuthPanelFooter>
          <Button
            nativeButton={false}
            render={
              <Link search={{ redirect: '/delete-account' }} to="/login" />
            }
          >
            <MailIcon data-icon="inline-start" />
            Iniciar sesión para eliminar mi cuenta
          </Button>
        </AuthPanelFooter>
      </AuthPanel>
    </AuthShell>
  )
}
