'use client'

/**
 * 🔮 GLASS CARD - Componente de tarjeta glassmorphism ultra premium
 * 
 * Características:
 * - Efecto glassmorphism con blur adaptivo
 * - Borde con gradiente animado
 * - Hover con efecto de elevación 3D
 * - Glow dinámico basado en el color
 * - Animaciones de entrada configurables
 */

import React, { forwardRef, useMemo } from 'react'
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion'
import { cn } from '@/app/lib/utils'

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode
  variant?: 'default' | 'elevated' | 'subtle' | 'neon' | 'holographic'
  glowColor?: string
  borderGradient?: boolean
  hoverScale?: number
  hoverY?: number
  intensity?: 'low' | 'medium' | 'high'
  animated?: boolean
  delay?: number
  className?: string
}

const intensityConfig = {
  low: {
    blur: 'backdrop-blur-sm',
    bg: 'bg-white/[0.02]',
    border: 'border-white/[0.05]',
  },
  medium: {
    blur: 'backdrop-blur-xl',
    bg: 'bg-white/[0.05]',
    border: 'border-white/[0.08]',
  },
  high: {
    blur: 'backdrop-blur-2xl',
    bg: 'bg-white/[0.08]',
    border: 'border-white/[0.12]',
  },
}

const variantStyles = {
  default: '',
  elevated: 'shadow-2xl shadow-black/20',
  subtle: 'opacity-90',
  neon: '',
  holographic: '',
}

const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95,
    filter: 'blur(10px)',
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  hover: {
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      variant = 'default',
      glowColor = 'rgba(59, 130, 246, 0.4)',
      borderGradient = false,
      hoverScale = 1.02,
      hoverY = -4,
      intensity = 'medium',
      animated = true,
      delay = 0,
      className,
      ...props
    },
    ref,
  ) => {
    const config = intensityConfig[intensity]

    const glowStyle = useMemo(() => {
      if (variant === 'neon') {
        return {
          boxShadow: `0 0 30px ${glowColor}, inset 0 0 30px ${glowColor}20`,
        }
      }
      if (variant === 'holographic') {
        return {
          background: `linear-gradient(135deg, 
            rgba(255,255,255,0.1) 0%, 
            rgba(255,255,255,0.05) 25%, 
            rgba(255,255,255,0.1) 50%, 
            rgba(255,255,255,0.05) 75%, 
            rgba(255,255,255,0.1) 100%)`,
        }
      }
      return {}
    }, [variant, glowColor])

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-2xl md:rounded-3xl',
          config.blur,
          config.bg,
          'border',
          config.border,
          variantStyles[variant],
          'transition-shadow duration-300',
          className,
        )}
        style={glowStyle}
        variants={animated ? cardVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        whileHover={animated ? { 
          scale: hoverScale, 
          y: hoverY,
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px ${glowColor}30`,
        } : undefined}
        transition={{ delay }}
        {...props}
      >
        {/* Gradient border overlay */}
        {borderGradient && (
          <motion.div
            className="absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${glowColor}40 0%, transparent 50%, ${glowColor}20 100%)`,
              padding: '1px',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'xor',
              WebkitMaskComposite: 'xor',
            }}
          />
        )}

        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full"
          whileHover={{ translateX: '100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    )
  },
)

GlassCard.displayName = 'GlassCard'

// Variante con glow animado
export const GlowingGlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ glowColor = 'rgba(59, 130, 246, 0.5)', children, className, ...props }, ref) => {
    return (
      <div className="relative group">
        {/* Animated glow background */}
        <motion.div
          className="absolute -inset-0.5 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
          style={{ background: `linear-gradient(135deg, ${glowColor}, transparent, ${glowColor})` }}
          animate={{
            background: [
              `linear-gradient(0deg, ${glowColor}, transparent, ${glowColor})`,
              `linear-gradient(180deg, ${glowColor}, transparent, ${glowColor})`,
              `linear-gradient(360deg, ${glowColor}, transparent, ${glowColor})`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <GlassCard ref={ref} className={className} {...props}>
          {children}
        </GlassCard>
      </div>
    )
  },
)

GlowingGlassCard.displayName = 'GlowingGlassCard'

export default GlassCard
