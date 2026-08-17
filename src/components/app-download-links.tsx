import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export const APP_STORE_URL =
  'https://apps.apple.com/mx/app/icanchero-book-sport-courts/id1534073223'
export const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=com.icanchero.app'

const APP_STORE_BADGE_URL =
  'https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/es-mx?size=250x83'
const GOOGLE_PLAY_BADGE_URL =
  'https://play.google.com/intl/en_us/badges/static/images/badges/es_badge_web_generic.png'

export function AppDownloadLinks({
  className,
  inverse = false,
  ...props
}: ComponentProps<'section'> & { inverse?: boolean }) {
  return (
    <section
      aria-label="Descarga la app de iCanchero"
      className={cn('flex flex-col gap-3', className)}
      {...props}
    >
      {/* <div className="flex flex-col gap-1">
        <p className="font-heading text-sm font-semibold text-foreground">
          Lleva iCanchero contigo
        </p>
        <p className="text-xs text-muted-foreground">
          Reserva canchas y organiza tus partidos desde la app.
        </p>
      </div> */}
      <h3
        className={cn(
          'font-heading text-xl font-medium',
          inverse ? 'text-primary-foreground' : 'not-dark:text-brand-dark',
        )}
      >
        Descarga la app
      </h3>
      <div className="flex flex-wrap items-center gap-3">
        <a
          aria-label="Descargar iCanchero en App Store"
          className="focus-visible:ring-ring rounded-md transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2"
          href={APP_STORE_URL}
          rel="noreferrer"
          target="_blank"
        >
          <img
            alt=""
            aria-hidden="true"
            className="h-10 w-auto"
            height="83"
            src={APP_STORE_BADGE_URL}
            width="250"
          />
        </a>
        <a
          aria-label="Descargar iCanchero en Google Play"
          className="focus-visible:ring-ring rounded-md transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2"
          href={GOOGLE_PLAY_URL}
          rel="noreferrer"
          target="_blank"
        >
          <img
            alt=""
            aria-hidden="true"
            className="h-12 w-auto"
            height="250"
            src={GOOGLE_PLAY_BADGE_URL}
            width="646"
          />
        </a>
      </div>
    </section>
  )
}
