'use client'

/**
 * 🌊 FLUID GRADIENT BACKGROUND - Fondo animado con gradientes fluidos
 * 
 * Características:
 * - Animación WebGL-like con CSS puro
 * - Múltiples orbes con movimiento orgánico
 * - Bajo consumo de recursos (usa transform y opacity)
 * - Configurable: colores, velocidad, intensidad
 */

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/app/lib/utils'

interface FluidGradientBackgroundProps {
  colors?: string[]
  intensity?: 'low' | 'medium' | 'high'
  speed?: 'slow' | 'medium' | 'fast'
  blur?: number
  className?: string
  children?: React.ReactNode
}

const intensityConfig = {
  low: { opacity: 0.15, count: 3 },
  medium: { opacity: 0.25, count: 4 },
  high: { opacity: 0.35, count: 5 },
}

const speedConfig = {
  slow: { duration: 30, scale: 20 },
  medium: { duration: 20, scale: 15 },
  fast: { duration: 12, scale: 10 },
}

interface OrbConfig {
  color: string
  size: number
  x: number
  y: number
  duration: number
  delay: number
}

export function FluidGradientBackground({
  colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899'],
  intensity = 'medium',
  speed = 'medium',
  blur = 150,
  className,
  children,
}: FluidGradientBackgroundProps) {
  const { opacity, count } = intensityConfig[intensity]
  const { duration, scale } = speedConfig[speed]

  // Generar configuración de orbes
  const orbs = useMemo<OrbConfig[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      color: colors[i % colors.length],
      size: 400 + Math.random() * 300,
      x: 10 + (i * 25) + Math.random() * 15,
      y: 10 + (i * 20) + Math.random() * 20,
      duration: duration + Math.random() * 10,
      delay: i * 2,
    }))
  }, [colors, count, duration])

  return (
    <div className={cn('fixed inset-0 overflow-hidden pointer-events-none', className)}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950" />
      
      {/* Animated orbs */}
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full will-change-transform"
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            background: `radial-gradient(circle, ${orb.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
            filter: `blur(${blur}px)`,
          }}
          animate={{
            x: [0, scale * 5, -scale * 3, scale * 4, 0],
            y: [0, -scale * 4, scale * 3, -scale * 2, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      {/* Content */}
      {children}
    </div>
  )
}

// Variante con efecto aurora
export function AuroraBackground({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn('fixed inset-0 overflow-hidden pointer-events-none', className)}>
      <div className="absolute inset-0 bg-black" />
      
      {/* Aurora waves */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, 
              transparent 0%, 
              rgba(16, 185, 129, 0.1) 20%, 
              rgba(59, 130, 246, 0.15) 40%, 
              rgba(139, 92, 246, 0.1) 60%, 
              transparent 100%
            )
          `,
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Moving aurora bands */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          style={{
            background: `linear-gradient(${90 + i * 30}deg, 
              transparent 0%, 
              rgba(${i === 0 ? '16, 185, 129' : i === 1 ? '59, 130, 246' : '139, 92, 246'}, 0.15) 50%, 
              transparent 100%
            )`,
            filter: 'blur(80px)',
          }}
          animate={{
            x: ['-50%', '50%', '-50%'],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 2,
          }}
        />
      ))}

      {/* Star field */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(1px 1px at 10px 10px, white, transparent),
            radial-gradient(1px 1px at 150px 50px, white, transparent),
            radial-gradient(1px 1px at 100px 120px, white, transparent),
            radial-gradient(1px 1px at 250px 200px, white, transparent),
            radial-gradient(1px 1px at 50px 250px, white, transparent),
            radial-gradient(1px 1px at 300px 100px, white, transparent)`,
          backgroundSize: '400px 400px',
        }}
      />

      {children}
    </div>
  )
}

export default FluidGradientBackground
