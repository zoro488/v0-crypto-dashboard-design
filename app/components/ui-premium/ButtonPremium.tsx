'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 🎨 BUTTON PREMIUM - Estilo Apple/Tesla
 * 
 * Variantes:
 * - primary: Accent color (Apple Blue)
 * - secondary: Glassmorphism
 * - tertiary: Transparent con border
 * - destructive: Red accent
 * - ghost: Solo hover effect
 * 
 * Sizes: xs, sm, md (default 44px), lg, xl
 */

export interface ButtonPremiumProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  loading?: boolean // Alias para isLoading
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  iconLeft?: ReactNode // Alias para leftIcon
  iconRight?: ReactNode // Alias para rightIcon
  fullWidth?: boolean
  animate?: boolean
}

const ButtonPremium = forwardRef<HTMLButtonElement, ButtonPremiumProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading, // Alias
      leftIcon,
      rightIcon,
      iconLeft, // Alias
      iconRight, // Alias
      fullWidth = false,
      animate = true,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    // Unificar aliases
    const actualLoading = loading ?? isLoading
    const actualLeftIcon = iconLeft ?? leftIcon
    const actualRightIcon = iconRight ?? rightIcon
    
    // Variantes de estilo (Apple/Tesla)
    const variants = {
      primary: 'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90 shadow-[0_0_20px_rgba(10,132,255,0.3)]',
      secondary: 'bg-white/5 text-white hover:bg-white/10 backdrop-blur-xl border border-white/10',
      tertiary: 'bg-transparent text-white hover:bg-white/5 border border-white/20',
      destructive: 'bg-[#FF453A] text-white hover:bg-[#FF453A]/90 shadow-[0_0_20px_rgba(255,69,58,0.3)]',
      ghost: 'bg-transparent text-white hover:bg-white/5',
    }

    // Tamaños (Apple: 44px estándar)
    const sizes = {
      xs: 'h-7 px-3 text-xs rounded-lg',
      sm: 'h-9 px-4 text-sm rounded-xl',
      md: 'h-11 px-6 text-base rounded-xl', // 44px Apple estándar
      lg: 'h-13 px-8 text-lg rounded-2xl',
      xl: 'h-15 px-10 text-xl rounded-2xl',
    }

    const ButtonComponent = animate ? motion.button : 'button'
    const motionProps: HTMLMotionProps<'button'> = animate
      ? {
          whileHover: { scale: disabled || actualLoading ? 1 : 1.02 },
          whileTap: { scale: disabled || actualLoading ? 1 : 0.98 },
          transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }, // Apple easing
        }
      : {}

    return (
      <ButtonComponent
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2',
          'font-semibold tracking-tight',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'apple-font-smoothing',
          
          // Variant y size
          variants[variant],
          sizes[size],
          
          // Full width
          fullWidth && 'w-full',
          
          className,
        )}
        disabled={disabled || actualLoading}
        {...(motionProps as any)}
        {...props}
      >
        {/* Loading spinner */}
        {actualLoading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        
        {/* Left icon */}
        {!actualLoading && actualLeftIcon && (
          <span className="flex-shrink-0">{actualLeftIcon}</span>
        )}
        
        {/* Content */}
        <span>{children}</span>
        
        {/* Right icon */}
        {!actualLoading && actualRightIcon && (
          <span className="flex-shrink-0">{actualRightIcon}</span>
        )}
      </ButtonComponent>
    )
  },
)

ButtonPremium.displayName = 'ButtonPremium'

export { ButtonPremium }
