import type { ReactNode } from 'react'

import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export function AuthShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/40 px-4 py-6 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 top-8 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-32 bottom-0 size-96 rounded-full bg-accent/80 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-4xl border border-border/80 bg-card/90 shadow-2xl shadow-primary/10 backdrop-blur-sm lg:grid-cols-[minmax(25rem,0.82fr)_minmax(28rem,1.18fr)]">
        <section className="flex min-h-[38rem] flex-col p-6 sm:p-10">
          <BrandHeader />
          <BrandMobileBanner />
          <div
            className={cn(
              'flex w-full flex-1 items-center py-8 sm:py-10',
              className,
            )}
          >
            <div className="w-full max-w-md">{children}</div>
          </div>
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            Hecho para encontrar tu próxima cancha.
          </p>
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
        className="shrink-0 rounded-md outline-none ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        href="/"
      >
        <img
          alt="iCanchero"
          className="h-7 w-auto sm:h-8"
          height="153"
          src="/images/logo-horizontal-dark.svg"
          width="843"
        />
      </a>
      <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary">
        Tu juego, aquí
      </span>
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
      className="relative hidden min-h-[38rem] overflow-hidden bg-primary lg:block"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-[1.35fr_0.65fr] gap-3 p-4"
      >
        <img
          alt=""
          className="h-full w-full rounded-3xl object-cover"
          src="/images/posters/de-tu-cel-a-la-cancha.jpg"
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
            src="/images/posters/gol.jpg"
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
      <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/20 to-transparent" />
      <div className="relative flex min-h-[38rem] flex-col justify-between p-8 text-primary-foreground xl:p-10">
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
        <div className="max-w-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/70">
            De tu cel a la cancha
          </p>
          <p className="font-heading text-4xl font-semibold leading-[0.95] tracking-tight xl:text-5xl">
            La mejor jugada empieza contigo.
          </p>
          <p className="mt-5 max-w-xs text-sm leading-6 text-primary-foreground/80">
            Encuentra a tu gente, reserva tu espacio y vuelve a jugar.
          </p>
        </div>
      </div>
    </aside>
  )
}

export function AuthLoadingState() {
  return (
    <AuthShell>
      <div
        aria-label="Cargando"
        className="flex min-h-48 items-center justify-center rounded-4xl border bg-card p-8 shadow-md"
        role="status"
      >
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner aria-label="Cargando" />
          Cargando tu cuenta…
        </div>
      </div>
    </AuthShell>
  )
}
