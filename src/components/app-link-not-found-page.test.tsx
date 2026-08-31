import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TestProviders } from '@/test/test-providers'
import { AppLinkNotFoundPage } from './app-link-not-found-page'
import { APP_STORE_URL, GOOGLE_PLAY_URL } from './app-download-links'

function renderPage() {
  return render(
    <TestProviders>
      <AppLinkNotFoundPage />
    </TestProviders>,
  )
}

describe('AppLinkNotFoundPage', () => {
  const writeText = vi.fn()

  beforeEach(() => {
    writeText.mockReset()
    writeText.mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    window.history.replaceState({}, '', '/activities/missing')
  })

  it('explains the app-only link and shows the account download links', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Descarga la app!' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: 'Descargar iCanchero en App Store',
      }),
    ).toHaveAttribute('href', APP_STORE_URL)
    expect(
      screen.getByRole('link', {
        name: 'Descargar iCanchero en Google Play',
      }),
    ).toHaveAttribute('href', GOOGLE_PLAY_URL)
  })

  it('copies the complete browser URL for reopening later', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Copiar enlace' }))

    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(
      await screen.findByRole('button', { name: 'Enlace copiado' }),
    ).toBeInTheDocument()
  })
})
