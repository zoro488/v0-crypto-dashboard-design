import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

import { cn } from '@/app/lib/utils'

/**
 * 🎨 BUTTON OBSIDIAN - Sistema Premium Unificado
 * 
 * Migrado a Obsidian Glass Design System con:
 * - Glassmorphism avanzado
 * - Animaciones Apple-style
 * - Variantes premium actualizadas
 * - Compatibilidad hacia atrás con API legacy
 */

const buttonVariants = cva(
  // Base: Obsidian Glass Foundation
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none will-change-transform apple-font-smoothing",
  {
    variants: {
      variant: {
        // 🔵 Primary - Apple Blue con glow
        default: 
          'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90 shadow-[0_4px_20px_-4px_rgba(10,132,255,0.5)] hover:shadow-[0_8px_30px_-4px_rgba(10,132,255,0.6)] focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-xl active:scale-[0.98]',
        
        // 🟣 Premium - Gradient con animación
        premium:
          'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white shadow-[0_4px_20px_-4px_rgba(168,85,247,0.5)] hover:shadow-[0_8px_30px_-4px_rgba(168,85,247,0.6)] rounded-xl active:scale-[0.98]',
        
        // 🔮 Glass - Obsidian Glassmorphism
        glass:
          'bg-[rgba(10,10,15,0.6)] backdrop-blur-2xl border border-white/[0.08] hover:border-white/[0.15] hover:bg-[rgba(20,20,30,0.7)] text-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] rounded-xl active:scale-[0.98]',
        
        // 🔴 Destructive - Error state
        destructive:
          'bg-[#FF453A] text-white hover:bg-[#FF453A]/90 shadow-[0_4px_20px_-4px_rgba(255,69,58,0.5)] hover:shadow-[0_8px_30px_-4px_rgba(255,69,58,0.6)] focus-visible:ring-2 focus-visible:ring-[#FF453A]/50 rounded-xl active:scale-[0.98]',
        
        // ⬜ Outline - Border with glow on hover
        outline:
          'border border-white/[0.15] hover:border-white/[0.25] bg-transparent hover:bg-white/[0.05] text-white/90 hover:text-white shadow-[0_0_0_0_rgba(255,255,255,0)] hover:shadow-[0_4px_20px_-8px_rgba(255,255,255,0.15)] rounded-xl active:scale-[0.98]',
        
        // ⚫ Secondary - Subtle background
        secondary:
          'bg-white/[0.08] hover:bg-white/[0.12] text-white/90 backdrop-blur-xl border border-white/[0.06] hover:border-white/[0.1] rounded-xl active:scale-[0.98]',
        
        // 👻 Ghost - Invisible until hover
        ghost:
          'hover:bg-white/[0.08] text-white/70 hover:text-white rounded-xl active:scale-[0.98]',
        
        // 🔗 Link - Text only
        link: 
          'text-[#0A84FF] hover:text-[#0A84FF]/80 underline-offset-4 hover:underline',
        
        // ✅ Success - Green accent
        success:
          'bg-[#30D158] text-white hover:bg-[#30D158]/90 shadow-[0_4px_20px_-4px_rgba(48,209,88,0.5)] hover:shadow-[0_8px_30px_-4px_rgba(48,209,88,0.6)] rounded-xl active:scale-[0.98]',
        
        // 🟠 Warning - Amber accent
        warning:
          'bg-[#FF9F0A] text-black hover:bg-[#FF9F0A]/90 shadow-[0_4px_20px_-4px_rgba(255,159,10,0.5)] hover:shadow-[0_8px_30px_-4px_rgba(255,159,10,0.6)] rounded-xl active:scale-[0.98]',
      },
      size: {
        default: 'h-11 px-6 py-2.5 has-[>svg]:px-5', // 44px Apple standard
        sm: 'h-9 rounded-lg gap-1.5 px-4 text-xs has-[>svg]:px-3',
        lg: 'h-13 rounded-2xl px-8 text-base has-[>svg]:px-6',
        xl: 'h-15 rounded-2xl px-10 text-lg has-[>svg]:px-8',
        icon: 'size-11 rounded-xl p-0',
        'icon-sm': 'size-9 rounded-lg p-0',
        'icon-lg': 'size-13 rounded-xl p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading,
  isLoading,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  const actualLoading = loading ?? isLoading

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || actualLoading}
      {...props}
    >
      {/* Loading spinner */}
      {actualLoading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      
      {/* Left icon */}
      {!actualLoading && leftIcon && (
        <span className="flex-shrink-0">{leftIcon}</span>
      )}
      
      {/* Content */}
      {children}
      
      {/* Right icon */}
      {!actualLoading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
