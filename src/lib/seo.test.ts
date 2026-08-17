import { describe, expect, it } from 'vitest'

import { createSeoHead } from '@/lib/seo'

describe('createSeoHead', () => {
  it('creates absolute canonical and social image URLs', () => {
    const head = createSeoHead({ path: '/delete-account' })

    expect(head.links).toContainEqual({
      rel: 'canonical',
      href: 'https://app.icanchero.com/delete-account',
    })
    expect(head.meta).toContainEqual({
      property: 'og:image',
      content: 'https://app.icanchero.com/images/posters/gol.jpg',
    })
    expect(head.meta).toContainEqual({
      name: 'twitter:card',
      content: 'summary_large_image',
    })
  })

  it('marks private utility routes as non-indexable', () => {
    const head = createSeoHead({ path: '/account', noIndex: true })

    expect(head.meta).toContainEqual({
      name: 'robots',
      content: 'noindex, nofollow',
    })
  })
})
