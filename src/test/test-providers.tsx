import type { ReactNode } from 'react'

import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

export function TestProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="icanchero-test-theme">
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  )
}
