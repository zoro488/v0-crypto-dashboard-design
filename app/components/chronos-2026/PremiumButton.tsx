'use client'

/**
 * CHRONOS 2026 - Premium Button
 * Botón con efectos de hover, glow y ripple
 * 
 * Features:
 * - Múltiples variantes
 * - Ripple effect
 * - Glow on hover
 * - Loading state
 * - Icon support
 */

import { memo, useState, ReactNode, ButtonHTMLAttributes, MouseEvent } from 'react'
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHRONOS_COLORS } from '@/app/lib/constants/chronos-2026'
import { useReducedMotionSafe } from './hooks'

// Omit conflicting properties between React and Framer Motion
type ButtonBaseProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart'>

interface PremiumButtonProps extends ButtonBaseProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const variantStyles = {
  primary: {
    bg: CHRONOS_COLORS.gradientPrimary,
    text: 'text-white',
    hover: 'hover:shadow-lg',
    glow: CHRONOS_COLORS.primary,
  },
  secondary: {
    bg: 'bg-white/5',
    text: 'text-white',
    hover: 'hover:bg-white/10',
    glow: 'rgba(255,255,255,0.3)',
  },
  ghost: {
    bg: 'bg-transparent',
    text: 'text-white/70 hover:text-white',
    hover: 'hover:bg-white/5',
    glow: 'transparent',
  },
  danger: {
    bg: `linear-gradient(135deg, ${CHRONOS_COLORS.danger}, #cc0029)`,
    text: 'text-white',
    hover: 'hover:shadow-lg',
    glow: CHRONOS_COLORS.danger,
  },
  success: {
    bg: `linear-gradient(135deg, ${CHRONOS_COLORS.success}, #00cc46)`,
    text: 'text-white',
    hover: 'hover:shadow-lg',
    glow: CHRONOS_COLORS.success,
  },
}

const sizeStyles = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

function PremiumButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  onClick,
  type = 'button',
  ...props
}: PremiumButtonProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const prefersReducedMotion = useReducedMotionSafe()
  const styles = variantStyles[variant]
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!prefersReducedMotion && !disabled && !loading) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now()
      
      setRipples(prev => [...prev, { x, y, id }])
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id))
      }, 600)
    }
    
    onClick?.(e)
  }
  
  const isGradient = styles.bg.includes('gradient')
  
  return (
    <motion.button
      whileHover={prefersReducedMotion || disabled ? undefined : { scale: 1.02 }}
      whileTap={prefersReducedMotion || disabled ? undefined : { scale: 0.98 }}
      disabled={disabled || loading}
      onClick={handleClick}
      type={type}
      aria-disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center',
        'font-medium rounded-xl',
        'border border-white/10',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-white/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'overflow-hidden',
        sizeStyles[size],
        styles.text,
        styles.hover,
        fullWidth && 'w-full',
        className,
      )}
      style={{
        background: isGradient ? styles.bg : undefined,
        boxShadow: `0 0 20px ${styles.glow}20`,
      }}
    >
      {/* Non-gradient background */}
      {!isGradient && (
        <div 
          className={cn('absolute inset-0', styles.bg)} 
        />
      )}
      
      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at center, ${styles.glow}30 0%, transparent 70%)`,
        }}
      />
      
      {/* Ripples */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 20,
              height: 20,
              marginLeft: -10,
              marginTop: -10,
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="flex-shrink-0">{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="flex-shrink-0">{icon}</span>
            )}
          </>
        )}
      </span>
      
      {/* Top highlight */}
      <div 
        className="absolute top-0 left-0 right-0 h-px opacity-30"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
        }}
      />
    </motion.button>
  )
}

export default memo(PremiumButton)
