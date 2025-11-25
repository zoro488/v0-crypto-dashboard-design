import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/frontend/app/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.98] will-change-transform",
  {
    variants: {
      variant: {
        default: 
          'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25 focus-visible:ring-blue-500/50',
        premium:
          'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/30 focus-visible:ring-purple-500/50 animate-gradient',
        glass:
          'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 text-white shadow-lg hover:shadow-xl focus-visible:ring-white/30',
        destructive:
          'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25 focus-visible:ring-red-500/50',
        outline:
          'border-2 border-white/20 hover:border-white/40 bg-transparent hover:bg-white/5 text-white shadow-sm hover:shadow-lg focus-visible:ring-white/30',
        secondary:
          'bg-white/10 hover:bg-white/15 text-white backdrop-blur-sm border border-white/10 hover:border-white/20 focus-visible:ring-white/30',
        ghost:
          'hover:bg-white/10 text-white/80 hover:text-white focus-visible:ring-white/20',
        link: 
          'text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline',
        success:
          'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 focus-visible:ring-emerald-500/50',
      },
      size: {
        default: 'h-10 px-5 py-2.5 has-[>svg]:px-4',
        sm: 'h-9 rounded-lg gap-1.5 px-3.5 text-xs has-[>svg]:px-3',
        lg: 'h-12 rounded-xl px-7 text-base has-[>svg]:px-5',
        xl: 'h-14 rounded-2xl px-8 text-lg has-[>svg]:px-6',
        icon: 'size-10 rounded-xl',
        'icon-sm': 'size-9 rounded-lg',
        'icon-lg': 'size-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
