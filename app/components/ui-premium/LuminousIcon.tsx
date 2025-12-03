'use client'

import { motion } from 'framer-motion'
import { ReactNode, memo } from 'react'
import { cn } from '@/app/lib/utils'
import { LucideIcon } from 'lucide-react'

/**
 * 🌟 LuminousIcon
 * 
 * Icono con glow volumétrico que parece emitir luz desde detrás.
 * El glow es "indirecto" - no emana del icono sino que lo rodea.
 */

type IconVariant = 'sapphire' | 'emerald' | 'amethyst' | 'amber' | 'ruby' | 'cyan' | 'rose'
type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface LuminousIconProps {
  /** Componente de icono de Lucide */
  icon: LucideIcon
  /** Variante de color */
  variant?: IconVariant
  /** Tamaño del icono */
  size?: IconSize
  /** Intensidad del glow (0-1) */
  glowIntensity?: number
  /** Mostrar animación de pulso */
  pulse?: boolean
  /** Mostrar animación de flotación */
  float?: boolean
  /** Clase adicional */
  className?: string
}

const variantStyles: Record<IconVariant, { gradient: string; glow: string }> = {
  sapphire: {
    gradient: 'from-[#2563eb] to-[#1e40af]',
    glow: 'rgba(37, 99, 235, 0.5)',
  },
  emerald: {
    gradient: 'from-[#047857] to-[#065f46]',
    glow: 'rgba(4, 120, 87, 0.5)',
  },
  amethyst: {
    gradient: 'from-[#7c3aed] to-[#6d28d9]',
    glow: 'rgba(124, 58, 237, 0.5)',
  },
  amber: {
    gradient: 'from-[#d97706] to-[#b45309]',
    glow: 'rgba(217, 119, 6, 0.5)',
  },
  ruby: {
    gradient: 'from-[#be123c] to-[#9f1239]',
    glow: 'rgba(190, 18, 60, 0.5)',
  },
  cyan: {
    gradient: 'from-[#0891b2] to-[#0e7490]',
    glow: 'rgba(8, 145, 178, 0.5)',
  },
  rose: {
    gradient: 'from-[#e11d48] to-[#be123c]',
    glow: 'rgba(225, 29, 72, 0.5)',
  },
}

const sizeStyles: Record<IconSize, { container: string; icon: string; glowSize: number }> = {
  xs: { container: 'w-8 h-8', icon: 'w-4 h-4', glowSize: 12 },
  sm: { container: 'w-10 h-10', icon: 'w-5 h-5', glowSize: 14 },
  md: { container: 'w-12 h-12', icon: 'w-6 h-6', glowSize: 16 },
  lg: { container: 'w-14 h-14', icon: 'w-7 h-7', glowSize: 20 },
  xl: { container: 'w-16 h-16', icon: 'w-8 h-8', glowSize: 24 },
}

export const LuminousIcon = memo(({
  icon: Icon,
  variant = 'sapphire',
  size = 'md',
  glowIntensity = 0.6,
  pulse = false,
  float = false,
  className,
}: LuminousIconProps) => {
  const { gradient, glow } = variantStyles[variant]
  const { container, icon, glowSize } = sizeStyles[size]

  return (
    <motion.div
      className={cn('relative flex items-center justify-center', className)}
      animate={float ? { y: [0, -4, 0] } : undefined}
      transition={float ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      {/* Glow volumétrico detrás */}
      <motion.div
        className="absolute rounded-2xl"
        style={{
          inset: -glowSize,
          background: glow,
          filter: `blur(${glowSize}px)`,
          opacity: glowIntensity,
        }}
        animate={pulse ? { opacity: [glowIntensity * 0.6, glowIntensity, glowIntensity * 0.6] } : undefined}
        transition={pulse ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />

      {/* Contenedor del icono con gradiente */}
      <div
        className={cn(
          container,
          'relative rounded-xl flex items-center justify-center',
          `bg-gradient-to-br ${gradient}`,
          'shadow-lg',
        )}
      >
        {/* Reflejo superior sutil */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
          }}
        />

        {/* Icono */}
        <Icon className={cn(icon, 'text-white relative z-10')} strokeWidth={2} />
      </div>
    </motion.div>
  )
})

LuminousIcon.displayName = 'LuminousIcon'

/**
 * 🏷️ BadgeLuminous
 * 
 * Badge con glow sutil para estados y etiquetas
 */

interface BadgeLuminousProps {
  children: ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
}

const badgeVariants = {
  success: {
    bg: 'bg-[rgba(4,120,87,0.15)]',
    text: 'text-[#10b981]',
    border: 'border-[rgba(4,120,87,0.3)]',
    glow: '0 0 20px -5px rgba(4, 120, 87, 0.4)',
  },
  warning: {
    bg: 'bg-[rgba(217,119,6,0.15)]',
    text: 'text-[#f59e0b]',
    border: 'border-[rgba(217,119,6,0.3)]',
    glow: '0 0 20px -5px rgba(217, 119, 6, 0.4)',
  },
  danger: {
    bg: 'bg-[rgba(190,18,60,0.15)]',
    text: 'text-[#f43f5e]',
    border: 'border-[rgba(190,18,60,0.3)]',
    glow: '0 0 20px -5px rgba(190, 18, 60, 0.4)',
  },
  info: {
    bg: 'bg-[rgba(37,99,235,0.15)]',
    text: 'text-[#3b82f6]',
    border: 'border-[rgba(37,99,235,0.3)]',
    glow: '0 0 20px -5px rgba(37, 99, 235, 0.4)',
  },
  neutral: {
    bg: 'bg-white/5',
    text: 'text-white/70',
    border: 'border-white/10',
    glow: 'none',
  },
}

const badgeSizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
}

export const BadgeLuminous = memo(({
  children,
  variant = 'info',
  size = 'md',
  className,
}: BadgeLuminousProps) => {
  const { bg, text, border, glow } = badgeVariants[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide border',
        bg,
        text,
        border,
        badgeSizes[size],
        className,
      )}
      style={{ boxShadow: glow }}
    >
      {children}
    </span>
  )
})

BadgeLuminous.displayName = 'BadgeLuminous'

export default LuminousIcon
