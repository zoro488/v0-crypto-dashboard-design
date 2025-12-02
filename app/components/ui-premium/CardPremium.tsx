'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * 🎨 CARD PREMIUM - Estilo Apple/Tesla
 * 
 * Variantes:
 * - glass: Glassmorphism translúcido
 * - solid: Superficie sólida
 * - elevated: Con sombra profunda
 * - gradient: Gradiente de fondo
 * - neon: Borde neón con glow
 * 
 * Características:
 * - Border-radius: 24px (Tesla) / 12px (Apple)
 * - Backdrop-blur: 40px
 * - Hover: Lift + glow effect
 */

export interface CardPremiumProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'elevated' | 'gradient' | 'neon'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: 'apple' | 'tesla' | 'sm' | 'md' | 'lg'
  animate?: boolean
  glowColor?: string
}

const CardPremium = forwardRef<HTMLDivElement, CardPremiumProps>(
  (
    {
      variant = 'glass',
      hover = false,
      padding = 'md',
      rounded = 'tesla',
      animate = true,
      glowColor = '10, 132, 255',
      className,
      children,
      ...props
    },
    ref,
  ) => {
    // Variantes de estilo
    const variants = {
      glass: `
        bg-white/[0.03] 
        backdrop-blur-[40px] 
        border border-white/[0.08]
        shadow-[0_0_80px_rgba(0,0,0,0.5)]
      `,
      solid: `
        bg-[#1a1a1a] 
        border border-white/[0.08]
        shadow-lg
      `,
      elevated: `
        bg-[#1a1a1a] 
        border border-white/[0.12]
        shadow-[0_20px_60px_rgba(0,0,0,0.8)]
      `,
      gradient: `
        bg-gradient-to-br from-white/[0.05] to-white/[0.02]
        backdrop-blur-[40px]
        border border-white/[0.08]
        shadow-[0_0_80px_rgba(0,0,0,0.5)]
      `,
      neon: `
        bg-black/50
        backdrop-blur-[40px]
        border border-[rgba(${glowColor},0.5)]
        shadow-[0_0_40px_rgba(${glowColor},0.3),inset_0_0_20px_rgba(${glowColor},0.1)]
      `,
    }

    // Padding
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-12',
    }

    // Border radius
    const roundeds = {
      apple: 'rounded-xl', // 12px
      tesla: 'rounded-[24px]', // 24px
      sm: 'rounded-lg',
      md: 'rounded-xl',
      lg: 'rounded-2xl',
    }

    const CardComponent = animate ? motion.div : 'div'
    const motionProps: HTMLMotionProps<'div'> = animate && hover
      ? {
          whileHover: {
            y: -4,
            boxShadow: variant === 'neon' 
              ? `0 0 60px rgba(${glowColor}, 0.5), inset 0 0 30px rgba(${glowColor}, 0.15)`
              : '0 20px 80px rgba(0, 0, 0, 0.9)',
          },
          transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
        }
      : {}

    return (
      <CardComponent
        ref={ref}
        className={cn(
          // Base styles
          'relative overflow-hidden',
          'transition-all duration-300',
          
          // Variant, padding, rounded
          variants[variant],
          paddings[padding],
          roundeds[rounded],
          
          // Focus
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
          
          className,
        )}
        {...(motionProps as any)}
        {...props}
      >
        {children}
      </CardComponent>
    )
  },
)

CardPremium.displayName = 'CardPremium'

// Sub-componentes
export interface CardHeaderPremiumProps extends HTMLAttributes<HTMLDivElement> {
  spacing?: 'sm' | 'md' | 'lg'
}

const CardHeaderPremium = forwardRef<HTMLDivElement, CardHeaderPremiumProps>(
  ({ spacing = 'md', className, children, ...props }, ref) => {
    const spacings = {
      sm: 'mb-3',
      md: 'mb-4',
      lg: 'mb-6',
    }

    return (
      <div
        ref={ref}
        className={cn('flex flex-col', spacings[spacing], className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

CardHeaderPremium.displayName = 'CardHeaderPremium'

export interface CardTitlePremiumProps extends HTMLAttributes<HTMLHeadingElement> {
  size?: 'sm' | 'md' | 'lg'
}

const CardTitlePremium = forwardRef<HTMLHeadingElement, CardTitlePremiumProps>(
  ({ size = 'md', className, children, ...props }, ref) => {
    const sizes = {
      sm: 'text-lg font-semibold',
      md: 'text-xl font-semibold',
      lg: 'text-2xl font-bold',
    }

    return (
      <h3
        ref={ref}
        className={cn(
          'text-white tracking-tight',
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </h3>
    )
  },
)

CardTitlePremium.displayName = 'CardTitlePremium'

export interface CardDescriptionPremiumProps extends HTMLAttributes<HTMLParagraphElement> {}

const CardDescriptionPremium = forwardRef<HTMLParagraphElement, CardDescriptionPremiumProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          'text-sm text-white/55 leading-relaxed',
          className,
        )}
        {...props}
      >
        {children}
      </p>
    )
  },
)

CardDescriptionPremium.displayName = 'CardDescriptionPremium'

export interface CardContentPremiumProps extends HTMLAttributes<HTMLDivElement> {}

const CardContentPremium = forwardRef<HTMLDivElement, CardContentPremiumProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

CardContentPremium.displayName = 'CardContentPremium'

export interface CardFooterPremiumProps extends HTMLAttributes<HTMLDivElement> {
  spacing?: 'sm' | 'md' | 'lg'
}

const CardFooterPremium = forwardRef<HTMLDivElement, CardFooterPremiumProps>(
  ({ spacing = 'md', className, children, ...props }, ref) => {
    const spacings = {
      sm: 'mt-3 pt-3',
      md: 'mt-4 pt-4',
      lg: 'mt-6 pt-6',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center border-t border-white/10',
          spacings[spacing],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

CardFooterPremium.displayName = 'CardFooterPremium'

export {
  CardPremium,
  CardHeaderPremium,
  CardTitlePremium,
  CardDescriptionPremium,
  CardContentPremium,
  CardFooterPremium,
}
