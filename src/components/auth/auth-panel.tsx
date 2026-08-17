import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function AuthPanel({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('flex flex-col gap-6', className)} {...props} />
}

export function AuthPanelHeader({
  className,
  ...props
}: ComponentProps<'header'>) {
  return <header className={cn('flex flex-col gap-2', className)} {...props} />
}

export function AuthPanelTitle({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      className={cn(
        'font-heading text-2xl font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  )
}

export function AuthPanelDescription({
  className,
  ...props
}: ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-muted-foreground text-sm leading-6', className)}
      {...props}
    />
  )
}

export function AuthPanelContent({
  className,
  ...props
}: ComponentProps<'div'>) {
  return <div className={className} {...props} />
}

export function AuthPanelFooter({
  className,
  ...props
}: ComponentProps<'footer'>) {
  return <footer className={cn('flex items-center', className)} {...props} />
}
