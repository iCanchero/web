import type { ReactNode } from 'react'

import { AppDownloadLinks } from '@/components/app-download-links'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { AuthPanel, AuthPanelContent } from './auth-panel'

export function AuthShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <main className="bg-muted/40 relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="bg-brand-light/20 dark:bg-brand-dark/20 absolute top-8 -left-32 size-80 rounded-full blur-3xl" />
        <div className="bg-brand-light/20 dark:bg-brand-dark/20 absolute -right-32 bottom-0 size-96 rounded-full blur-3xl" />
      </div>

      <div className="border-border/80 bg-card/90 shadow-primary/10 relative grid w-full max-w-6xl overflow-hidden rounded-4xl border shadow-2xl backdrop-blur-sm lg:grid-cols-[minmax(23rem,0.78fr)_minmax(30rem,1.22fr)]">
        <section className="flex min-h-152 flex-col p-6 sm:p-10">
          <BrandHeader />
          <BrandMobileBanner />
          <div
            className={cn(
              'flex w-full flex-1 items-center py-8 sm:py-10',
              className,
            )}
          >
            <div className="_max-w-md w-full">{children}</div>
          </div>
          <AppDownloadLinks className="mb-5 items-center lg:hidden" />
          <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:justify-start">
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
        </section>
        <BrandVisual />
      </div>
    </main>
  )
}

function BrandHeader() {
  return (
    <header className="flex items-center justify-between gap-4">
      <a
        aria-label="iCanchero, ir al inicio"
        className="ring-offset-background focus-visible:ring-ring shrink-0 rounded-md transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2"
        href="/"
      >
        <BrandLogo
          alt="iCanchero"
          className="h-7 w-auto sm:h-8"
          height="153"
          width="843"
        />
      </a>
      <ThemeToggle />
    </header>
  )
}

function BrandMobileBanner() {
  return (
    <div
      aria-hidden="true"
      className="mt-6 grid h-20 grid-cols-3 gap-2 overflow-hidden rounded-2xl lg:hidden"
    >
      <img
        alt=""
        className="h-full w-full object-cover object-center"
        src="/images/posters/de-tu-cel-a-la-cancha.jpg"
      />
      <img
        alt=""
        className="h-full w-full object-cover object-center"
        src="/images/posters/friends.jpg"
      />
      <img
        alt=""
        className="h-full w-full object-cover object-center"
        src="/images/posters/tennis.jpg"
      />
    </div>
  )
}

function BrandVisual() {
  return (
    <aside
      aria-label="iCanchero, hecho para moverse"
      className="bg-brand-dark relative hidden min-h-152 overflow-hidden lg:block"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-[1.35fr_0.65fr] gap-3 p-4"
      >
        <img
          alt=""
          className="h-full w-full rounded-3xl object-cover"
          src="/images/posters/gol.jpg"
        />
        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-3">
          <img
            alt=""
            className="h-full min-h-0 w-full rounded-3xl object-cover"
            src="/images/posters/friends.jpg"
          />
          <img
            alt=""
            className="h-full min-h-0 w-full rounded-3xl object-cover"
            src="/images/posters/de-tu-cel-a-la-cancha.jpg"
          />
          <img
            alt=""
            className="h-full min-h-0 w-full rounded-3xl object-cover"
            src="/images/posters/ohana.jpg"
          />
          <img
            alt=""
            className="h-full min-h-0 w-full rounded-3xl object-cover"
            src="/images/posters/tennis.jpg"
          />
        </div>
      </div>
      <div className="from-brand-dark _via-brand-dark/20 absolute inset-0 bg-linear-to-t to-transparent" />
      <div className="text-primary-foreground relative flex min-h-152 flex-col justify-between p-8 xl:p-10">
        <div className="flex items-start justify-between gap-4">
          <img
            alt="iCanchero"
            className="h-7 w-auto brightness-0 invert"
            height="153"
            src="/images/logo-horizontal-light.svg"
            width="843"
          />
          <img
            alt=""
            aria-hidden="true"
            className="size-10 brightness-0 invert"
            src="/images/logo-only-dark.svg"
          />
        </div>
        <div className="_max-w-sm">
          <p className="text-primary-foreground/90 mb-3 text-xs font-semibold tracking-[0.25em] uppercase">
            El deporte nos une
          </p>
          <p className="font-heading text-4xl leading-[0.95] font-semibold tracking-tight xl:text-5xl">
            iCanchero Nos Conecta
          </p>
          <p className="text-primary-foreground/80 mt-5 max-w-xs text-sm leading-6">
            Encuentra a tu gente, reserva tu espacio y vuelve a jugar.
          </p>
          <AppDownloadLinks className="mt-6" inverse />
        </div>
      </div>
    </aside>
  )
}

export function AuthLoadingState() {
  return (
    <AuthShell>
      <AuthPanel aria-label="Cargando" role="status">
        <AuthPanelContent className="text-muted-foreground flex min-h-48 items-center justify-center gap-3 text-sm">
          <Spinner aria-label="Cargando" />
          Cargando tu cuenta…
        </AuthPanelContent>
      </AuthPanel>
    </AuthShell>
  )
}
