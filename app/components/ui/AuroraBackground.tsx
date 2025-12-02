'use client'

/**
 * 🌌 AuroraBackground - Fondo Aurora Premium 2025
 * 
 * Componente reutilizable para agregar el efecto aurora
 * a cualquier panel o sección del sistema.
 * 
 * Inspirado en:
 * - Apple Vision Pro: Gradientes suaves y blur intenso
 * - Grok.com 2025: Orbes animados con movimiento fluido
 * - Tesla: Fondo negro puro con acentos de color
 */

import { motion } from 'framer-motion'

interface AuroraBackgroundProps {
  /** Variante de color del aurora */
  variant?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'multi'
  /** Intensidad del efecto (0-1) */
  intensity?: number
  /** Si los orbes deben animarse */
  animated?: boolean
  /** Clase CSS adicional */
  className?: string
}

const VARIANTS = {
  blue: {
    orb1: 'from-blue-600/15 via-cyan-500/10',
    orb2: 'from-indigo-600/15 via-blue-500/10',
    orb3: 'from-sky-500/8 via-cyan-500/5',
  },
  purple: {
    orb1: 'from-purple-600/15 via-pink-500/10',
    orb2: 'from-violet-600/15 via-purple-500/10',
    orb3: 'from-fuchsia-500/8 via-pink-500/5',
  },
  emerald: {
    orb1: 'from-emerald-600/15 via-green-500/10',
    orb2: 'from-teal-600/15 via-emerald-500/10',
    orb3: 'from-green-500/8 via-lime-500/5',
  },
  amber: {
    orb1: 'from-amber-600/15 via-yellow-500/10',
    orb2: 'from-orange-600/15 via-amber-500/10',
    orb3: 'from-yellow-500/8 via-orange-500/5',
  },
  rose: {
    orb1: 'from-rose-600/15 via-pink-500/10',
    orb2: 'from-red-600/15 via-rose-500/10',
    orb3: 'from-pink-500/8 via-rose-500/5',
  },
  multi: {
    orb1: 'from-blue-600/15 via-cyan-500/10',
    orb2: 'from-purple-600/15 via-pink-500/10',
    orb3: 'from-emerald-500/8 via-teal-500/5',
  },
}

export function AuroraBackground({
  variant = 'multi',
  intensity = 1,
  animated = true,
  className = '',
}: AuroraBackgroundProps) {
  const colors = VARIANTS[variant]
  const opacityMultiplier = intensity

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden -z-10 ${className}`}>
      {/* Orbe 1 - Superior Izquierdo */}
      <motion.div
        className={`absolute top-[-30%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-br ${colors.orb1} to-transparent blur-[180px]`}
        style={{ opacity: 0.15 * opacityMultiplier }}
        animate={animated ? {
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        } : undefined}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Orbe 2 - Inferior Derecho */}
      <motion.div
        className={`absolute bottom-[-20%] right-[-20%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-tl ${colors.orb2} to-transparent blur-[180px]`}
        style={{ opacity: 0.15 * opacityMultiplier }}
        animate={animated ? {
          x: [0, -40, 0],
          y: [0, -20, 0],
          scale: [1, 1.15, 1],
        } : undefined}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Orbe 3 - Centro */}
      <motion.div
        className={`absolute top-[40%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-r ${colors.orb3} to-transparent blur-[150px]`}
        style={{ opacity: 0.1 * opacityMultiplier }}
        animate={animated ? {
          x: [0, 60, 0],
          y: [0, -40, 0],
        } : undefined}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/**
 * Panel con Glassmorphism Premium
 * Contenedor con el estilo Apple Vision Pro / Tesla 2025
 */
interface GlassPanelProps {
  children: React.ReactNode
  /** Color del borde superior brillante */
  glowColor?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'white'
  /** Si muestra el borde superior */
  showGlow?: boolean
  className?: string
  /** Callback de hover */
  onHover?: () => void
}

const GLOW_COLORS = {
  blue: 'via-blue-500/50',
  purple: 'via-purple-500/50',
  emerald: 'via-emerald-500/50',
  amber: 'via-amber-500/50',
  rose: 'via-rose-500/50',
  white: 'via-white/30',
}

export function GlassPanel({
  children,
  glowColor = 'white',
  showGlow = true,
  className = '',
}: GlassPanelProps) {
  return (
    <motion.div
      className={`
        relative 
        bg-white/[0.03] 
        backdrop-blur-[24px] 
        border border-white/[0.08] 
        rounded-[28px] 
        overflow-hidden
        ${className}
      `}
      whileHover={{ borderColor: 'rgba(255,255,255,0.12)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Línea de brillo superior */}
      {showGlow && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent ${GLOW_COLORS[glowColor]} to-transparent`} />
      )}
      {children}
    </motion.div>
  )
}

/**
 * Constantes de diseño premium para uso en todo el sistema
 */
export const PREMIUM_DESIGN = {
  // Animaciones Spring (como en iOS/macOS)
  spring: {
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },
  // Transición premium
  transition: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },
  // Colores de gradiente
  gradients: {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    emerald: 'from-emerald-500 to-green-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
  },
  // Sombras con glow
  shadows: {
    blue: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
    purple: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
    emerald: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    amber: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
    rose: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]',
  },
  // Glassmorphism
  glass: {
    background: 'bg-white/[0.03]',
    border: 'border-white/[0.08]',
    blur: 'backdrop-blur-[24px]',
    radius: 'rounded-[28px]',
  },
}

export default AuroraBackground
