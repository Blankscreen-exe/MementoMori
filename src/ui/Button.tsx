import type { ComponentProps } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'ghost'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink',
  ghost: 'text-muted',
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        'rounded-full px-6 py-3.5 text-sm tracking-[0.14em] uppercase transition-opacity',
        'focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
