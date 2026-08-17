import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type BrandLogoProps = Omit<ComponentProps<'img'>, 'src'>

export function BrandLogo({ className, ...props }: BrandLogoProps) {
  return (
    <>
      <img
        className={cn('dark:hidden', className)}
        src="/images/logo-horizontal-dark.svg"
        {...props}
      />
      <img
        className={cn('hidden dark:block', className)}
        src="/images/logo-horizontal-light.svg"
        {...props}
      />
    </>
  )
}
