import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  APP_STORE_URL,
  AppDownloadLinks,
  GOOGLE_PLAY_URL,
} from './app-download-links'

describe('AppDownloadLinks', () => {
  it('links the official store badges to the iCanchero listings', () => {
    render(<AppDownloadLinks />)

    const appStore = screen.getByRole('link', {
      name: 'Descargar iCanchero en App Store',
    })
    const googlePlay = screen.getByRole('link', {
      name: 'Descargar iCanchero en Google Play',
    })

    expect(appStore).toHaveAttribute('href', APP_STORE_URL)
    expect(googlePlay).toHaveAttribute('href', GOOGLE_PLAY_URL)
    expect(appStore.compareDocumentPosition(googlePlay)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })
})
