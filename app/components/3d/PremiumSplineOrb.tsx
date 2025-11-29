"use client"

/**
 * 🔮 PREMIUM SPLINE ORB - Orbe 3D Animado Premium
 * 
 * Componente de visualización 3D con:
 * - Orbe flotante con efectos de partículas
 * - Anillos orbitales animados
 * - Efectos de glow dinámicos
 * - Interactividad con hover y click
 * - Estados visuales múltiples
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'

// ============================================================================
// TIPOS
// ============================================================================
export type OrbState = 'idle' | 'active' | 'processing' | 'success' | 'error' | 'pulse'

interface PremiumSplineOrbProps {
  state?: OrbState
  size?: number
  primaryColor?: string
  secondaryColor?: string
  glowIntensity?: number
  showParticles?: boolean
  showRings?: boolean
  interactive?: boolean
  onClick?: () => void
  onHover?: (isHovering: boolean) => void
  label?: string
  value?: string | number
  className?: string
}

// ============================================================================
// CONFIGURACIÓN DE COLORES POR ESTADO
// ============================================================================
const stateColors: Record<OrbState, { primary: string; secondary: string; glow: string }> = {
  idle: { primary: '#3b82f6', secondary: '#8b5cf6', glow: 'rgba(59, 130, 246, 0.4)' },
  active: { primary: '#06b6d4', secondary: '#3b82f6', glow: 'rgba(6, 182, 212, 0.5)' },
  processing: { primary: '#8b5cf6', secondary: '#ec4899', glow: 'rgba(139, 92, 246, 0.5)' },
  success: { primary: '#10b981', secondary: '#06b6d4', glow: 'rgba(16, 185, 129, 0.5)' },
  error: { primary: '#ef4444', secondary: '#f97316', glow: 'rgba(239, 68, 68, 0.5)' },
  pulse: { primary: '#f59e0b', secondary: '#ec4899', glow: 'rgba(245, 158, 11, 0.5)' }
}

// ============================================================================
// COMPONENTE DE PARTÍCULAS
// ============================================================================
function OrbParticles({ size, color, count = 12 }: { size: number; color: string; count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2
        const radius = size * 0.4
        const delay = i * 0.1
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              backgroundColor: color,
              left: '50%',
              top: '50%',
              boxShadow: `0 0 ${Math.random() * 10 + 5}px ${color}`
            }}
            animate={{
              x: [
                Math.cos(angle) * radius * 0.8,
                Math.cos(angle + Math.PI) * radius * 1.2,
                Math.cos(angle) * radius * 0.8
              ],
              y: [
                Math.sin(angle) * radius * 0.8,
                Math.sin(angle + Math.PI) * radius * 1.2,
                Math.sin(angle) * radius * 0.8
              ],
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )
      })}
    </div>
  )
}

// ============================================================================
// COMPONENTE DE ANILLOS ORBITALES
// ============================================================================
function OrbitalRings({ size, color, isActive }: { size: number; color: string; isActive: boolean }) {
  return (
    <>
      {/* Anillo horizontal */}
      <motion.div
        className="absolute rounded-full border-2 pointer-events-none"
        style={{
          width: size * 1.3,
          height: size * 0.3,
          borderColor: `${color}40`,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%) rotateX(75deg)'
        }}
        animate={{
          rotateZ: isActive ? 360 : 0
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      {/* Anillo vertical */}
      <motion.div
        className="absolute rounded-full border pointer-events-none"
        style={{
          width: size * 1.1,
          height: size * 1.1,
          borderColor: `${color}30`,
          borderWidth: 1,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
        animate={{
          rotateY: isActive ? 360 : 0,
          rotateX: 15
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      {/* Anillo diagonal */}
      <motion.div
        className="absolute rounded-full border pointer-events-none"
        style={{
          width: size * 1.2,
          height: size * 1.2,
          borderColor: `${color}20`,
          borderWidth: 1,
          borderStyle: 'dashed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%) rotateX(45deg) rotateZ(45deg)'
        }}
        animate={{
          rotateZ: isActive ? [45, 405] : 45
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export function PremiumSplineOrb({
  state = 'idle',
  size = 120,
  primaryColor,
  secondaryColor,
  glowIntensity = 1,
  showParticles = true,
  showRings = true,
  interactive = true,
  onClick,
  onHover,
  label,
  value,
  className = ''
}: PremiumSplineOrbProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Colores basados en estado o props
  const colors = useMemo(() => {
    const stateConfig = stateColors[state]
    return {
      primary: primaryColor || stateConfig.primary,
      secondary: secondaryColor || stateConfig.secondary,
      glow: stateConfig.glow
    }
  }, [state, primaryColor, secondaryColor])
  
  // Motion values para efectos interactivos
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15])
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 })
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 })
  
  // Manejadores de interacción
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!interactive || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }, [interactive, mouseX, mouseY])
  
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    onHover?.(true)
  }, [onHover])
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    onHover?.(false)
    mouseX.set(0)
    mouseY.set(0)
  }, [onHover, mouseX, mouseY])
  
  // Determinar si está activo
  const isActive = isHovered || state !== 'idle'
  
  return (
    <motion.div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center ${className}`}
      style={{
        width: size * 1.5,
        height: size * 1.5,
        perspective: 1000
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={interactive ? { scale: 1.05 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
    >
      {/* Capa de fondo con glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 1.4,
          height: size * 1.4,
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          filter: `blur(${size * 0.15}px)`,
          opacity: 0.6 * glowIntensity
        }}
        animate={{
          scale: isActive ? [1, 1.2, 1] : 1,
          opacity: isActive ? [0.4 * glowIntensity, 0.7 * glowIntensity, 0.4 * glowIntensity] : 0.4 * glowIntensity
        }}
        transition={{
          duration: 2,
          repeat: isActive ? Infinity : 0,
          ease: 'easeInOut'
        }}
      />
      
      {/* Anillos orbitales */}
      {showRings && (
        <OrbitalRings size={size} color={colors.primary} isActive={isActive} />
      )}
      
      {/* Partículas */}
      {showParticles && (
        <OrbParticles size={size} color={colors.primary} count={isActive ? 16 : 8} />
      )}
      
      {/* Orbe principal */}
      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{
          width: size,
          height: size,
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Gradiente de fondo del orbe */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, ${colors.primary}80 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, ${colors.secondary}60 0%, transparent 50%),
              linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)
            `
          }}
          animate={{
            rotate: state === 'processing' ? 360 : 0
          }}
          transition={{
            duration: 3,
            repeat: state === 'processing' ? Infinity : 0,
            ease: 'linear'
          }}
        />
        
        {/* Capa de reflexión superior */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)'
          }}
        />
        
        {/* Capa de brillo interior */}
        <motion.div
          className="absolute inset-2 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
            filter: 'blur(2px)'
          }}
          animate={{
            opacity: isActive ? [0.3, 0.6, 0.3] : 0.3
          }}
          transition={{
            duration: 1.5,
            repeat: isActive ? Infinity : 0,
            ease: 'easeInOut'
          }}
        />
        
        {/* Núcleo central brillante */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: size * 0.3,
            height: size * 0.3,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, white 0%, ${colors.primary}80 50%, transparent 100%)`,
            filter: 'blur(3px)'
          }}
          animate={{
            scale: isActive ? [1, 1.3, 1] : 1,
            opacity: isActive ? [0.8, 1, 0.8] : 0.8
          }}
          transition={{
            duration: 1,
            repeat: isActive ? Infinity : 0,
            ease: 'easeInOut'
          }}
        />
        
        {/* Borde con glow */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: `
              inset 0 0 ${size * 0.1}px rgba(255,255,255,0.1),
              0 0 ${size * 0.2 * glowIntensity}px ${colors.glow},
              0 0 ${size * 0.4 * glowIntensity}px ${colors.glow}
            `
          }}
        />
      </motion.div>
      
      {/* Etiqueta y valor */}
      <AnimatePresence>
        {(label || value) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -bottom-8 text-center"
          >
            {label && (
              <p className="text-xs text-white/60 uppercase tracking-wider font-medium">
                {label}
              </p>
            )}
            {value && (
              <p className="text-sm font-bold text-white mt-0.5">
                {value}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Indicador de estado */}
      {state !== 'idle' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: colors.primary,
            boxShadow: `0 0 10px ${colors.glow}`
          }}
        >
          {state === 'processing' && (
            <motion.div
              className="w-2 h-2 border border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          )}
          {state === 'success' && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {state === 'error' && (
            <span className="text-white text-xs font-bold">!</span>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

export default PremiumSplineOrb
