import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'
import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from './theme-provider'
import { ThemeToggle } from './theme-toggle'

const mediaListeners = new Set<(event: MediaQueryListEvent) => void>()

function ThemeState() {
  const { resolvedTheme, setTheme, theme } = useTheme()
  return (
    <div>
      <output data-testid="theme">{theme}</output>
      <output data-testid="resolved-theme">{resolvedTheme}</output>
      <button onClick={() => setTheme('system')} type="button">
        system
      </button>
      <input aria-label="Nombre" />
    </div>
  )
}

function renderTheme() {
  return render(
    <ThemeProvider>
      <TooltipProvider>
        <ThemeToggle />
        <ThemeState />
      </TooltipProvider>
    </ThemeProvider>,
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.style.colorScheme = ''
    mediaListeners.clear()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => mediaListeners.add(listener),
        removeEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => mediaListeners.delete(listener),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
  })

  it('restores a stored theme and toggles it from the shared control', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    renderTheme()

    await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
    const toggle = screen.getByRole('button', {
      name: 'Cambiar a modo claro',
    })
    expect(toggle).toHaveAttribute('aria-keyshortcuts', 'D')

    fireEvent.click(toggle)

    await waitFor(() => expect(document.documentElement).toHaveClass('light'))
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('toggles with D but ignores the shortcut while typing', async () => {
    renderTheme()
    await waitFor(() => expect(document.documentElement).toHaveClass('light'))

    fireEvent.keyDown(window, { key: 'd' })
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'))

    fireEvent.keyDown(screen.getByLabelText('Nombre'), { key: 'd' })
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('tracks system changes while the system theme is selected', async () => {
    renderTheme()
    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('system'),
    )

    for (const listener of mediaListeners) {
      listener({ matches: true } as MediaQueryListEvent)
    }

    await waitFor(() => {
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
      expect(document.documentElement).toHaveClass('dark')
    })
  })
})
