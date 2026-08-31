import { useState } from 'react'
import { AppDownloadLinks } from '@/components/app-download-links'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'

export function AppLinkNotFoundPage() {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="bg-muted/40 relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="bg-brand-light/20 dark:bg-brand-dark/20 absolute top-8 -left-32 size-80 rounded-full blur-3xl" />
        <div className="bg-brand-light/20 dark:bg-brand-dark/20 absolute -right-32 bottom-0 size-96 rounded-full blur-3xl" />
      </div>

      <section className="border-border/80 bg-card/90 shadow-primary/10 relative flex w-full max-w-2xl flex-col overflow-hidden rounded-4xl border shadow-2xl backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-0">
          <img
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            src="/images/posters/gol.jpg"
          />
          <img
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            src="/images/posters/de-tu-cel-a-la-cancha.jpg"
          />
          <img
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            src="/images/posters/friends.jpg"
          />
          <img
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            src="/images/posters/tennis.jpg"
          />
        </div>

        <div className="flex flex-col gap-8 p-6 sm:p-10">
          <div className="flex flex-col gap-2">
            <header className="flex items-center justify-between gap-4">
              <a
                aria-label="iCanchero, conocer más"
                className="ring-offset-background focus-visible:ring-ring rounded-md transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2"
                href="https://icanchero.com"
              >
                <BrandLogo
                  alt="iCanchero"
                  className="h-8 w-auto"
                  height="153"
                  width="843"
                />
              </a>
              <ThemeToggle />
            </header>
            <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">
              Aplicación móvil
            </p>
            <h1 className="font-heading text-foreground text-3xl leading-tight font-semibold sm:text-5xl">
              Descarga la app!
            </h1>
            <p className="text-muted-foreground max-w-xl text-base leading-7 sm:text-lg">
              Descarga iCanchero y vuelve a abrir este mismo enlace para ir
              directamente a la actividad, club o reserva correspondiente.
            </p>
            <button
              className="border-border bg-background hover:bg-muted focus-visible:ring-ring w-fit rounded-xl border px-4 py-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              onClick={() => void copyLink()}
              type="button"
            >
              {copied ? 'Enlace copiado' : 'Copiar enlace'}
            </button>
          </div>

          <AppDownloadLinks />

          <footer className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 border-t pt-5 text-xs">
            <a
              className="underline-offset-4 hover:underline"
              href="https://icanchero.com/privacy"
            >
              Aviso de privacidad
            </a>
            <a
              className="underline-offset-4 hover:underline"
              href="https://icanchero.com/terms"
            >
              Términos y condiciones
            </a>
          </footer>
        </div>
      </section>
    </main>
  )
}
