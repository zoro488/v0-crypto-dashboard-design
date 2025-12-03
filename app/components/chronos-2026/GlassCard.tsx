'use client'

/**
 * CHRONOS 2026 - Glass Card Premium
 * Tarjeta con efecto glassmorphism ultra-refinado
 * 
 * Features:
 * - Glassmorphism sutil (backdrop-blur)
 * - Bordes animados
 * - Hover effects
 * - Multiple variants
 * - Accessible
 */

import { memo, ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CHRONOS_COLORS, CHRONOS_ANIMATIONS } from '@/app/lib/constants/chronos-2026'

interface GlassCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'subtle' | 'strong' | 'gradient'
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variantStyles = {
  default: {
    bg: 'bg-white/[0.03]',
    border: 'border-white/[0.08]',
    hoverBorder: 'hover:border-white/[0.15]',
    blur: 'backdrop-blur-xl',
  },
  subtle: {
    bg: 'bg-white/[0.02]',
    border: 'border-white/[0.05]',
    hoverBorder: 'hover:border-white/[0.1]',
    blur: 'backdrop-blur-lg',
  },
  strong: {
    bg: 'bg-white/[0.06]',
    border: 'border-white/[0.12]',
    hoverBorder: 'hover:border-white/[0.2]',
    blur: 'backdrop-blur-2xl',
  },
  gradient: {
    bg: 'bg-gradient-to-br from-white/[0.05] to-white/[0.02]',
    border: 'border-white/[0.1]',
    hoverBorder: 'hover:border-white/[0.18]',
    blur: 'backdrop-blur-xl',
  },
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3 md:p-4',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
}

function GlassCard({
  children,
  className = '',
  variant = 'default',
  hover = true,
  onClick,
  padding = 'md',
}: GlassCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const styles = variantStyles[variant]
  
  return (
    <motion.div
      whileHover={hover && !prefersReducedMotion ? { 
        y: -2,
        scale: 1.01,
      } : {}}
      whileTap={onClick && !prefersReducedMotion ? { scale: 0.99 } : {}}
      transition={{
        type: 'spring',
        ...CHRONOS_ANIMATIONS.spring.snappy,
      }}
      onClick={onClick}
      className={cn(
        // Base
        'relative overflow-hidden rounded-2xl',
        // Glass effect
        styles.bg,
        styles.blur,
        // Border
        'border',
        styles.border,
        hover && styles.hoverBorder,
        // Padding
        paddingStyles[padding],
        // Interactive
        onClick && 'cursor-pointer',
        // Transitions
        'transition-all duration-300',
        // GPU acceleration
        'will-change-transform',
        className,
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Gradient overlay on hover */}
      {hover && (
        <motion.div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${CHRONOS_COLORS.primary}05 0%, ${CHRONOS_COLORS.accent}05 100%)`,
          }}
        />
      )}
      
      {/* Inner glow on hover */}
      {hover && (
        <div 
          className="absolute inset-0 opacity-0 hover:opacity-100 pointer-events-none transition-opacity duration-500"
          style={{
            boxShadow: `inset 0 0 60px ${CHRONOS_COLORS.primary}10`,
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Subtle top highlight */}
      <div 
        className="absolute top-0 left-0 right-0 h-px opacity-50"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        }}
      />
    </motion.div>
  )
}

export default memo(GlassCard)
