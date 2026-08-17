import { MoonIcon, SunIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTheme } from '@/components/theme-provider'

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const label = dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-keyshortcuts="D"
            aria-label={label}
            aria-pressed={dark}
            onClick={toggleTheme}
            size="icon"
            type="button"
            variant="outline"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </Button>
        }
      />
      <TooltipContent side="right">
        {label}
        <Kbd>D</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}
