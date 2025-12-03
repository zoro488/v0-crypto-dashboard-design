'use client'

import { motion } from 'framer-motion'
import { memo, useMemo } from 'react'

/**
 * 🌌 AtmosphericBackground
 * 
 * Fondo cinematográfico con nebulosas volumétricas animadas.
 * Inspirado en Blade Runner 2049, Apple Vision Pro y Tesla Cybertruck UI.
 * 
 * Características:
 * - Nebulosas con movimiento orgánico lento
 * - Colores profundos: Zafiro, Amatista, Esmeralda
 * - Grid sutil de perspectiva
 * - Viñeta cinematográfica
 * - Optimizado para GPU (will-change, translateZ)
 */

interface NebulaConfig {
  id: string
  color: string
  size: number
  position: { top?: string; bottom?: string; left?: string; right?: string }
  opacity: number
  blur: number
  animation: {
    duration: number
    delay: number
    scale: [number, number, number]
    x: [number, number, number]
    y: [number, number, number]
  }
}

const defaultNebulae: NebulaConfig[] = [
  {
    id: 'nebula-sapphire',
    color: '#1e40af',
    size: 800,
    position: { top: '-10%', left: '-5%' },
    opacity: 0.12,
    blur: 150,
    animation: {
      duration: 40,
      delay: 0,
      scale: [1, 1.15, 1],
      x: [0, 60, 0],
      y: [0, 40, 0],
    },
  },
  {
    id: 'nebula-amethyst',
    color: '#6d28d9',
    size: 650,
    position: { bottom: '-10%', right: '-5%' },
    opacity: 0.14,
    blur: 140,
    animation: {
      duration: 35,
      delay: 2,
      scale: [1, 1.2, 1],
      x: [0, -50, 0],
      y: [0, -60, 0],
    },
  },
  {
    id: 'nebula-emerald',
    color: '#065f46',
    size: 500,
    position: { top: '35%', left: '45%' },
    opacity: 0.08,
    blur: 130,
    animation: {
      duration: 45,
      delay: 4,
      scale: [1, 1.1, 1],
      x: [0, 30, 0],
      y: [0, 50, 0],
    },
  },
  {
    id: 'nebula-cyan',
    color: '#0e7490',
    size: 400,
    position: { top: '20%', right: '20%' },
    opacity: 0.1,
    blur: 120,
    animation: {
      duration: 50,
      delay: 6,
      scale: [1, 1.08, 1],
      x: [0, -40, 0],
      y: [0, 30, 0],
    },
  },
  {
    id: 'nebula-rose',
    color: '#9f1239',
    size: 350,
    position: { bottom: '30%', left: '15%' },
    opacity: 0.06,
    blur: 110,
    animation: {
      duration: 55,
      delay: 8,
      scale: [1, 1.12, 1],
      x: [0, 50, 0],
      y: [0, -40, 0],
    },
  },
]

interface AtmosphericBackgroundProps {
  /** Configuración personalizada de nebulosas */
  nebulae?: NebulaConfig[]
  /** Mostrar grid de perspectiva */
  showGrid?: boolean
  /** Intensidad de la viñeta (0-1) */
  vignetteIntensity?: number
  /** Mostrar partículas flotantes */
  showParticles?: boolean
  /** Color base del fondo */
  baseColor?: string
  /** Reducir animaciones para performance */
  reducedMotion?: boolean
}

// Componente de nebulosa individual
const Nebula = memo(({ config, reducedMotion }: { config: NebulaConfig; reducedMotion: boolean }) => {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: config.size,
        height: config.size,
        background: `radial-gradient(circle, ${config.color} 0%, transparent 70%)`,
        filter: `blur(${config.blur}px)`,
        opacity: config.opacity,
        ...config.position,
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
      animate={
        reducedMotion
          ? {}
          : {
              scale: config.animation.scale,
              x: config.animation.x,
              y: config.animation.y,
            }
      }
      transition={{
        duration: config.animation.duration,
        delay: config.animation.delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
})

Nebula.displayName = 'Nebula'

// Partículas flotantes
const FloatingParticles = memo(() => {
  const particles = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * 10,
    })),
    []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
})

FloatingParticles.displayName = 'FloatingParticles'

export const AtmosphericBackground = memo(({
  nebulae = defaultNebulae,
  showGrid = true,
  vignetteIntensity = 0.4,
  showParticles = false,
  baseColor = '#020204',
  reducedMotion = false,
}: AtmosphericBackgroundProps) => {
  return (
    <div 
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ background: baseColor }}
      aria-hidden="true"
    >
      {/* Capa de nebulosas */}
      <div className="absolute inset-0">
        {nebulae.map((nebula) => (
          <Nebula key={nebula.id} config={nebula} reducedMotion={reducedMotion} />
        ))}
      </div>

      {/* Partículas flotantes opcionales */}
      {showParticles && <FloatingParticles />}

      {/* Grid de perspectiva sutil */}
      {showGrid && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(ellipse 100% 80% at 50% 50%, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 100% 80% at 50% 50%, black 30%, transparent 80%)',
          }}
        />
      )}

      {/* Viñeta cinematográfica */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, rgba(0, 0, 0, ${vignetteIntensity}) 100%)`,
        }}
      />

      {/* Gradientes de borde para profundidad */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

      {/* Reflejo superior sutil (luz ambiental) */}
      <div
        className="absolute top-0 left-0 right-0 h-[30vh]"
        style={{
          background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.03) 0%, transparent 100%)',
        }}
      />
    </div>
  )
})

AtmosphericBackground.displayName = 'AtmosphericBackground'

export default AtmosphericBackground
