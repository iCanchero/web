import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { AppDownloadLinks } from '@/components/app-download-links'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'

export function AccountShell({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [logoutPending, setLogoutPending] = useState(false)

  const handleLogout = async () => {
    if (logoutPending) return
    setLogoutPending(true)
    try {
      await logout()
      await navigate({
        to: '/login',
        search: { redirect: '/account' },
        replace: true,
      })
    } finally {
      setLogoutPending(false)
    }
  }

  return (
    <main className="bg-muted/40 min-h-svh">
      <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            aria-label="iCanchero, ir a mi cuenta"
            className="ring-offset-background focus-visible:ring-ring rounded-md transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2"
            to="/account"
          >
            <BrandLogo
              alt="iCanchero"
              className="h-8 w-auto"
              height="153"
              width="843"
            />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              disabled={logoutPending}
              onClick={() => void handleLogout()}
              type="button"
              variant="outline"
            >
              {logoutPending && (
                <Spinner
                  aria-label="Cerrando sesión"
                  data-icon="inline-start"
                />
              )}
              {logoutPending ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col py-8 sm:py-12">{children}</div>

        <footer className="text-muted-foreground flex flex-col gap-4 text-sm">
          <AppDownloadLinks className="items-center" />
          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>© {new Date().getFullYear()} iCanchero</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                className="text-muted-foreground underline-offset-4 hover:underline"
                href="https://icanchero.com/privacy"
              >
                Aviso de privacidad
              </a>
              <a
                className="text-muted-foreground underline-offset-4 hover:underline"
                href="https://icanchero.com/terms"
              >
                Términos y condiciones
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
