'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 CHRONOS 2026 ULTRA - COMPONENTES UI PREMIUM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Botones, inputs, badges y otros componentes con diseño ultra premium
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo, forwardRef, ReactNode, InputHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { motion, useReducedMotion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { C26_COLORS, C26_GRADIENTS, C26_SHADOWS } from '@/app/lib/constants/chronos-2026-ultra'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON ULTRA
// ═══════════════════════════════════════════════════════════════════════════

interface UltraButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children?: ReactNode
}

export const UltraButton = memo(forwardRef<HTMLButtonElement, UltraButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}, ref) => {
  const prefersReducedMotion = useReducedMotion()
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  }
  
  const variantStyles = {
    primary: {
      background: C26_GRADIENTS.primary,
      color: C26_COLORS.void,
      boxShadow: C26_SHADOWS.glowCyan,
    },
    secondary: {
      background: C26_COLORS.glassBg,
      color: C26_COLORS.textPrimary,
      border: `1px solid ${C26_COLORS.glassBorder}`,
    },
    ghost: {
      background: 'transparent',
      color: C26_COLORS.textSecondary,
    },
    danger: {
      background: `linear-gradient(135deg, ${C26_COLORS.error} 0%, #CC0033 100%)`,
      color: '#FFFFFF',
      boxShadow: '0 0 30px rgba(255, 51, 102, 0.3)',
    },
  }
  
  const style = variantStyles[variant]
  
  return (
    <motion.button
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center font-semibold rounded-xl',
        'transition-all duration-200 outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        className,
      )}
      style={style as React.CSSProperties}
      whileHover={prefersReducedMotion || disabled ? {} : { 
        y: -2, 
        scale: 1.02,
      }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Shimmer effect */}
      {variant === 'primary' && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        >
          <div 
            className="w-full h-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            }}
          />
        </motion.div>
      )}
      
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon}
      
      <span className="relative">{children}</span>
      
      {!isLoading && rightIcon}
    </motion.button>
  )
}))
UltraButton.displayName = 'UltraButton'

// ═══════════════════════════════════════════════════════════════════════════
// INPUT ULTRA
// ═══════════════════════════════════════════════════════════════════════════

interface UltraInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const UltraInput = memo(forwardRef<HTMLInputElement, UltraInputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-sm font-medium mb-2"
          style={{ color: C26_COLORS.textSecondary }}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div 
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: C26_COLORS.textMuted }}
          >
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-xl text-sm',
            'transition-all duration-200 outline-none',
            leftIcon && 'pl-12',
            rightIcon && 'pr-12',
            error && 'border-red-500',
            className,
          )}
          style={{
            background: C26_COLORS.glassBg,
            border: `1px solid ${error ? C26_COLORS.error : C26_COLORS.glassBorder}`,
            color: C26_COLORS.textPrimary,
          }}
          {...props}
        />
        
        {rightIcon && (
          <div 
            className="absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: C26_COLORS.textMuted }}
          >
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p 
          className="mt-2 text-xs"
          style={{ color: C26_COLORS.error }}
        >
          {error}
        </p>
      )}
    </div>
  )
}))
UltraInput.displayName = 'UltraInput'

// ═══════════════════════════════════════════════════════════════════════════
// BADGE ULTRA
// ═══════════════════════════════════════════════════════════════════════════

interface UltraBadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  children: ReactNode
  size?: 'sm' | 'md'
  dot?: boolean
}

export const UltraBadge = memo(({ 
  variant = 'neutral', 
  children, 
  size = 'sm',
  dot = false,
}: UltraBadgeProps) => {
  const variantStyles = {
    success: {
      background: 'rgba(0, 255, 159, 0.12)',
      color: C26_COLORS.success,
      border: '1px solid rgba(0, 255, 159, 0.3)',
    },
    warning: {
      background: 'rgba(255, 184, 0, 0.12)',
      color: C26_COLORS.warning,
      border: '1px solid rgba(255, 184, 0, 0.3)',
    },
    error: {
      background: 'rgba(255, 51, 102, 0.12)',
      color: C26_COLORS.error,
      border: '1px solid rgba(255, 51, 102, 0.3)',
    },
    info: {
      background: C26_COLORS.cyanMuted,
      color: C26_COLORS.cyan,
      border: '1px solid rgba(0, 245, 255, 0.3)',
    },
    neutral: {
      background: C26_COLORS.glassBg,
      color: C26_COLORS.textSecondary,
      border: `1px solid ${C26_COLORS.glassBorder}`,
    },
  }
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }
  
  const style = variantStyles[variant]
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full uppercase tracking-wide',
        sizeClasses[size],
      )}
      style={style as React.CSSProperties}
    >
      {dot && (
        <span 
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: style.color }}
        />
      )}
      {children}
    </span>
  )
})
UltraBadge.displayName = 'UltraBadge'

// ═══════════════════════════════════════════════════════════════════════════
// CARD ULTRA
// ═══════════════════════════════════════════════════════════════════════════

interface UltraCardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  glow?: 'cyan' | 'magenta' | 'violet' | 'none'
}

export const UltraCard = memo(({ 
  children, 
  className,
  padding = 'md',
  hover = true,
  glow = 'none',
}: UltraCardProps) => {
  const prefersReducedMotion = useReducedMotion()
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  const glowShadows = {
    none: 'none',
    cyan: C26_SHADOWS.glowCyan,
    magenta: C26_SHADOWS.glowMagenta,
    violet: C26_SHADOWS.glowViolet,
  }
  
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        paddingClasses[padding],
        className,
      )}
      style={{
        background: C26_COLORS.glassBg,
        backdropFilter: 'blur(60px) saturate(180%)',
        WebkitBackdropFilter: 'blur(60px) saturate(180%)',
        border: `1px solid ${C26_COLORS.glassBorder}`,
      }}
      whileHover={hover && !prefersReducedMotion ? {
        y: -4,
        borderColor: C26_COLORS.glassBorderHover,
        boxShadow: glowShadows[glow],
      } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Top highlight */}
      <div 
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${C26_COLORS.glassBorderHover}, transparent)`,
        }}
      />
      
      {children}
    </motion.div>
  )
})
UltraCard.displayName = 'UltraCard'

// ═══════════════════════════════════════════════════════════════════════════
// DIVIDER ULTRA
// ═══════════════════════════════════════════════════════════════════════════

interface UltraDividerProps {
  className?: string
  glow?: boolean
}

export const UltraDivider = memo(({ className, glow = false }: UltraDividerProps) => (
  <div 
    className={cn('h-px w-full', className)}
    style={{
      background: glow 
        ? `linear-gradient(90deg, transparent, ${C26_COLORS.cyan}50, transparent)`
        : C26_COLORS.glassBorder,
    }}
  />
))
UltraDivider.displayName = 'UltraDivider'

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON ULTRA
// ═══════════════════════════════════════════════════════════════════════════

interface UltraSkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export const UltraSkeleton = memo(({ className, variant = 'rectangular' }: UltraSkeletonProps) => (
  <motion.div
    className={cn(
      'animate-pulse',
      variant === 'circular' && 'rounded-full',
      variant === 'text' && 'rounded h-4',
      variant === 'rectangular' && 'rounded-xl',
      className,
    )}
    style={{
      background: `linear-gradient(90deg, ${C26_COLORS.glassBg} 25%, ${C26_COLORS.glassBgHover} 50%, ${C26_COLORS.glassBg} 75%)`,
      backgroundSize: '200% 100%',
    }}
    animate={{
      backgroundPosition: ['200% 0', '-200% 0'],
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    }}
  />
))
UltraSkeleton.displayName = 'UltraSkeleton'
