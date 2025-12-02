'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 🎨 BADGE PREMIUM - Estilo Apple/Tesla
 * 
 * Variantes:
 * - solid: Background sólido
 * - outline: Border con transparencia
 * - ghost: Solo texto
 * - gradient: Gradiente
 * - glow: Efecto neón
 * 
 * Colores: blue, green, red, orange, purple, gray
 */

export interface BadgePremiumProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'solid' | 'outline' | 'ghost' | 'gradient' | 'glow'
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  removable?: boolean
  onRemove?: () => void
  animate?: boolean
  children: ReactNode
}

const BadgePremium = forwardRef<HTMLDivElement, BadgePremiumProps>(
  (
    {
      variant = 'solid',
      color = 'blue',
      size = 'md',
      icon: Icon,
      removable = false,
      onRemove,
      animate = true,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    // Colores por variante
    const colors = {
      solid: {
        blue: 'bg-[#0A84FF]/20 text-[#0A84FF] border-[#0A84FF]/30',
        green: 'bg-[#30D158]/20 text-[#30D158] border-[#30D158]/30',
        red: 'bg-[#FF453A]/20 text-[#FF453A] border-[#FF453A]/30',
        orange: 'bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]/30',
        purple: 'bg-[#5E5CE6]/20 text-[#5E5CE6] border-[#5E5CE6]/30',
        gray: 'bg-white/10 text-white/85 border-white/20',
      },
      outline: {
        blue: 'bg-transparent text-[#0A84FF] border-[#0A84FF]/50',
        green: 'bg-transparent text-[#30D158] border-[#30D158]/50',
        red: 'bg-transparent text-[#FF453A] border-[#FF453A]/50',
        orange: 'bg-transparent text-[#FF9F0A] border-[#FF9F0A]/50',
        purple: 'bg-transparent text-[#5E5CE6] border-[#5E5CE6]/50',
        gray: 'bg-transparent text-white/85 border-white/30',
      },
      ghost: {
        blue: 'bg-transparent text-[#0A84FF] border-transparent hover:bg-[#0A84FF]/10',
        green: 'bg-transparent text-[#30D158] border-transparent hover:bg-[#30D158]/10',
        red: 'bg-transparent text-[#FF453A] border-transparent hover:bg-[#FF453A]/10',
        orange: 'bg-transparent text-[#FF9F0A] border-transparent hover:bg-[#FF9F0A]/10',
        purple: 'bg-transparent text-[#5E5CE6] border-transparent hover:bg-[#5E5CE6]/10',
        gray: 'bg-transparent text-white/85 border-transparent hover:bg-white/10',
      },
      gradient: {
        blue: 'bg-gradient-to-r from-[#0A84FF]/20 to-[#5E5CE6]/20 text-white border-[#0A84FF]/30',
        green: 'bg-gradient-to-r from-[#30D158]/20 to-[#0A84FF]/20 text-white border-[#30D158]/30',
        red: 'bg-gradient-to-r from-[#FF453A]/20 to-[#FF9F0A]/20 text-white border-[#FF453A]/30',
        orange: 'bg-gradient-to-r from-[#FF9F0A]/20 to-[#FF453A]/20 text-white border-[#FF9F0A]/30',
        purple: 'bg-gradient-to-r from-[#5E5CE6]/20 to-[#0A84FF]/20 text-white border-[#5E5CE6]/30',
        gray: 'bg-gradient-to-r from-white/10 to-white/5 text-white border-white/20',
      },
      glow: {
        blue: 'bg-[#0A84FF]/10 text-[#0A84FF] border-[#0A84FF] shadow-[0_0_20px_rgba(10,132,255,0.4)]',
        green: 'bg-[#30D158]/10 text-[#30D158] border-[#30D158] shadow-[0_0_20px_rgba(48,209,88,0.4)]',
        red: 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A] shadow-[0_0_20px_rgba(255,69,58,0.4)]',
        orange: 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A] shadow-[0_0_20px_rgba(255,159,10,0.4)]',
        purple: 'bg-[#5E5CE6]/10 text-[#5E5CE6] border-[#5E5CE6] shadow-[0_0_20px_rgba(94,92,230,0.4)]',
        gray: 'bg-white/5 text-white border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)]',
      },
    }

    // Tamaños
    const sizes = {
      sm: 'h-5 px-2 text-xs gap-1',
      md: 'h-6 px-3 text-sm gap-1.5',
      lg: 'h-7 px-4 text-base gap-2',
    }

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-3.5 h-3.5',
      lg: 'w-4 h-4',
    }

    const BadgeComponent = animate ? motion.div : 'div'
    const motionProps = animate
      ? {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
        }
      : {}

    return (
      <BadgeComponent
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'font-semibold tracking-tight',
          'rounded-full',
          'border',
          'backdrop-blur-sm',
          'transition-all duration-200',
          'apple-font-smoothing',
          
          // Size, variant, color
          sizes[size],
          colors[variant][color],
          
          className,
        )}
        {...(motionProps as any)}
        {...props}
      >
        {/* Icon */}
        {Icon && (
          <Icon className={iconSizes[size]} />
        )}
        
        {/* Content */}
        <span>{children}</span>
        
        {/* Remove button */}
        {removable && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="ml-1 hover:opacity-70 transition-opacity"
            aria-label="Remove badge"
          >
            <X className={iconSizes[size]} />
          </button>
        )}
      </BadgeComponent>
    )
  },
)

BadgePremium.displayName = 'BadgePremium'

// Dot Badge variant (status indicator)
export interface DotBadgePremiumProps extends HTMLAttributes<HTMLDivElement> {
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  children: ReactNode
}

const DotBadgePremium = forwardRef<HTMLDivElement, DotBadgePremiumProps>(
  (
    {
      color = 'blue',
      size = 'md',
      pulse = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const dotColors = {
      blue: 'bg-[#0A84FF]',
      green: 'bg-[#30D158]',
      red: 'bg-[#FF453A]',
      orange: 'bg-[#FF9F0A]',
      purple: 'bg-[#5E5CE6]',
      gray: 'bg-white/60',
    }

    const sizes = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 text-sm text-white/85',
          className,
        )}
        {...props}
      >
        <span className="relative">
          <span className={cn('block rounded-full', sizes[size], dotColors[color])} />
          {pulse && (
            <span
              className={cn(
                'absolute inset-0 rounded-full animate-ping',
                sizes[size],
                dotColors[color],
                'opacity-75',
              )}
            />
          )}
        </span>
        <span>{children}</span>
      </div>
    )
  },
)

DotBadgePremium.displayName = 'DotBadgePremium'

export { BadgePremium, DotBadgePremium }
