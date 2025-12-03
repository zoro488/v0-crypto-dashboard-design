'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef, ReactNode } from 'react'
import { cn } from '@/app/lib/utils'

/**
 * 🪨 ObsidianCard
 * 
 * Tarjeta premium con efecto "Obsidian Glass" - vidrio oscuro pulido con profundidad.
 * 
 * Características:
 * - Borde biselado que simula luz golpeando cristal pulido
 * - Textura de ruido sutil (anti-plástico)
 * - Glow indirecto en hover con variantes de color
 * - Reflejo especular animado en hover
 * - Elevación física con sombra volumétrica
 */

type GlowVariant = 'none' | 'sapphire' | 'emerald' | 'amethyst' | 'amber' | 'ruby' | 'cyan'

interface ObsidianCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  /** Variante de glow en hover */
  glowVariant?: GlowVariant
  /** Intensidad del blur de fondo */
  blurIntensity?: 'low' | 'medium' | 'high'
  /** Mostrar reflejo especular animado */
  showSpecularReflection?: boolean
  /** Mostrar borde biselado superior */
  showBeveledEdge?: boolean
  /** Mostrar textura de ruido */
  showNoiseTexture?: boolean
  /** Padding personalizado */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  /** Radio de borde */
  radius?: 'sm' | 'md' | 'lg' | 'xl'
  /** Elevación en hover */
  hoverElevation?: number
  /** Escala en hover */
  hoverScale?: number
  /** Desactivar animaciones */
  disableAnimations?: boolean
  /** Clase adicional */
  className?: string
  /** Es interactivo (clickeable) */
  interactive?: boolean
}

const glowStyles: Record<GlowVariant, string> = {
  none: '',
  sapphire: `
    hover:shadow-[0_20px_50px_-15px_rgba(37,99,235,0.35),inset_0_0_30px_-10px_rgba(37,99,235,0.2)]
  `,
  emerald: `
    hover:shadow-[0_20px_50px_-15px_rgba(4,120,87,0.35),inset_0_0_30px_-10px_rgba(4,120,87,0.2)]
  `,
  amethyst: `
    hover:shadow-[0_20px_50px_-15px_rgba(124,58,237,0.35),inset_0_0_30px_-10px_rgba(124,58,237,0.2)]
  `,
  amber: `
    hover:shadow-[0_20px_50px_-15px_rgba(217,119,6,0.35),inset_0_0_30px_-10px_rgba(217,119,6,0.2)]
  `,
  ruby: `
    hover:shadow-[0_20px_50px_-15px_rgba(190,18,60,0.35),inset_0_0_30px_-10px_rgba(190,18,60,0.2)]
  `,
  cyan: `
    hover:shadow-[0_20px_50px_-15px_rgba(8,145,178,0.35),inset_0_0_30px_-10px_rgba(8,145,178,0.2)]
  `,
}

const blurStyles = {
  low: 'backdrop-blur-xl',
  medium: 'backdrop-blur-2xl',
  high: 'backdrop-blur-3xl',
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
}

const radiusStyles = {
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-3xl',
  xl: 'rounded-[32px]',
}

export const ObsidianCard = forwardRef<HTMLDivElement, ObsidianCardProps>(
  (
    {
      children,
      glowVariant = 'sapphire',
      blurIntensity = 'medium',
      showSpecularReflection = true,
      showBeveledEdge = true,
      showNoiseTexture = true,
      padding = 'md',
      radius = 'lg',
      hoverElevation = -4,
      hoverScale = 1.005,
      disableAnimations = false,
      className,
      interactive = true,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          // Base styles
          'relative overflow-hidden',
          'bg-[rgba(10,10,15,0.7)]',
          blurStyles[blurIntensity],
          'saturate-[180%]',
          radiusStyles[radius],
          paddingStyles[padding],
          
          // Border
          'border border-white/[0.06]',
          
          // Shadow
          'shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_20px_-10px_rgba(255,255,255,0.1)]',
          
          // Hover glow
          interactive && glowStyles[glowVariant],
          
          // Transition
          !disableAnimations && 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          
          // Cursor
          interactive && 'cursor-pointer',
          
          // GPU acceleration
          'will-change-transform transform-gpu',
          
          className
        )}
        whileHover={
          interactive && !disableAnimations
            ? {
                y: hoverElevation,
                scale: hoverScale,
                borderColor: 'rgba(255, 255, 255, 0.12)',
              }
            : undefined
        }
        transition={{
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
        {...props}
      >
        {/* Borde biselado superior (efecto luz) */}
        {showBeveledEdge && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: 'inherit',
              padding: '1px',
              background: `linear-gradient(
                180deg,
                rgba(255, 255, 255, 0.12) 0%,
                rgba(255, 255, 255, 0.06) 20%,
                rgba(255, 255, 255, 0.02) 50%,
                rgba(0, 0, 0, 0.05) 80%,
                rgba(0, 0, 0, 0.1) 100%
              )`,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
        )}

        {/* Reflejo especular animado */}
        {showSpecularReflection && interactive && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: 'inherit',
              background: `linear-gradient(
                105deg,
                transparent 40%,
                rgba(255, 255, 255, 0.03) 45%,
                rgba(255, 255, 255, 0.07) 50%,
                rgba(255, 255, 255, 0.03) 55%,
                transparent 60%
              )`,
              transform: 'translateX(-100%)',
            }}
            whileHover={{
              transform: 'translateX(100%)',
            }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        )}

        {/* Línea de luz superior */}
        <div
          className="absolute top-0 left-[10%] right-[10%] h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent)',
          }}
        />

        {/* Textura de ruido sutil */}
        {showNoiseTexture && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay"
            style={{
              borderRadius: 'inherit',
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        )}

        {/* Contenido */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    )
  }
)

ObsidianCard.displayName = 'ObsidianCard'

/**
 * 🎴 ObsidianCardHeader
 * Header para ObsidianCard con icono luminoso opcional
 */
interface ObsidianCardHeaderProps {
  children: ReactNode
  className?: string
}

export const ObsidianCardHeader = ({ children, className }: ObsidianCardHeaderProps) => (
  <div className={cn('flex items-center gap-4 mb-4', className)}>{children}</div>
)

/**
 * 📊 ObsidianCardContent
 * Contenido principal de ObsidianCard
 */
interface ObsidianCardContentProps {
  children: ReactNode
  className?: string
}

export const ObsidianCardContent = ({ children, className }: ObsidianCardContentProps) => (
  <div className={cn('relative', className)}>{children}</div>
)

/**
 * 📝 ObsidianCardFooter
 * Footer para ObsidianCard
 */
interface ObsidianCardFooterProps {
  children: ReactNode
  className?: string
}

export const ObsidianCardFooter = ({ children, className }: ObsidianCardFooterProps) => (
  <div className={cn('mt-4 pt-4 border-t border-white/[0.06]', className)}>{children}</div>
)

export default ObsidianCard
