import type React from 'react'
import { cn } from '@/app/lib/utils'

function Skeleton({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & {
  variant?: 'default' | 'card' | 'text' | 'circle' | 'stat' | 'table'
}) {
  const variants = {
    default: 'h-4 w-full',
    card: 'h-48 w-full rounded-xl',
    text: 'h-4 w-3/4',
    circle: 'h-12 w-12 rounded-full',
    stat: 'h-24 w-full rounded-lg',
    table: 'h-12 w-full',
  }

  return (
    <div
      data-slot="skeleton"
      className={cn(
        'bg-white/10 animate-pulse rounded-md relative overflow-hidden',
        'before:absolute before:inset-0',
        'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
        'before:-translate-x-full before:animate-[shimmer_2s_infinite]',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
