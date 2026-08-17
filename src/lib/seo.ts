const SITE_ORIGIN = import.meta.env.ICAN_SITE_URL || 'https://app.icanchero.com'
const DEFAULT_TITLE = 'iCanchero | Listo para ganar'
const DEFAULT_DESCRIPTION = 'El deporte nos une, iCanchero ¡nos conecta!'
const DEFAULT_SOCIAL_IMAGE = `${SITE_ORIGIN}/images/posters/gol.jpg`

type SeoHeadOptions = {
  title?: string
  description?: string
  path?: `/${string}` | '/'
  noIndex?: boolean
}

export function createSeoHead({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  noIndex = false,
}: SeoHeadOptions = {}) {
  const canonicalUrl = new URL(path, SITE_ORIGIN).toString()

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      ...(noIndex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'iCanchero' },
      { property: 'og:locale', content: 'es_MX' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: DEFAULT_SOCIAL_IMAGE },
      { property: 'og:image:type', content: 'image/jpeg' },
      { property: 'og:image:width', content: '1080' },
      { property: 'og:image:height', content: '1350' },
      {
        property: 'og:image:alt',
        content: 'Jugador celebrando un gol con la marca iCanchero',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: DEFAULT_SOCIAL_IMAGE },
      {
        name: 'twitter:image:alt',
        content: 'Jugador celebrando un gol con la marca iCanchero',
      },
    ],
    links: [{ rel: 'canonical', href: canonicalUrl }],
  }
}
