'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 CHRONOS 2026 ULTRA - ORB INTELIGENTE CON IA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Orbe 3D que sigue el mouse con efectos líquidos
 * Reacciona a estados de IA: idle, thinking, success, error
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { C26_COLORS, C26_AI_STATES } from '@/app/lib/constants/chronos-2026-ultra'

interface UltraOrbProps {
  state?: 'idle' | 'thinking' | 'success' | 'error' | 'listening'
}

function UltraOrb({ state = 'idle' }: UltraOrbProps) {
  const prefersReducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const orbRef = useRef<HTMLDivElement>(null)
  
  // Mouse position with spring physics
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springConfig = { damping: 25, stiffness: 200 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)
  
  // Track mouse position
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (prefersReducedMotion) return
    
    // Offset from mouse position (follows at a distance)
    const offsetX = (e.clientX - window.innerWidth / 2) * 0.1
    const offsetY = (e.clientY - window.innerHeight / 2) * 0.1
    
    mouseX.set(offsetX)
    mouseY.set(offsetY)
  }, [mouseX, mouseY, prefersReducedMotion])
  
  useEffect(() => {
    setMounted(true)
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])
  
  if (!mounted) return null
  
  const stateConfig = C26_AI_STATES[state]
  
  return (
    <motion.div
      ref={orbRef}
      className="fixed pointer-events-none"
      style={{
        bottom: 120,
        right: 120,
        x,
        y,
        zIndex: 40,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: 1,
        type: 'spring',
        stiffness: 200,
      }}
    >
      {/* Main Orb */}
      <motion.div
        className="relative w-24 h-24 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${stateConfig.color}60 0%, ${stateConfig.color} 50%, ${stateConfig.color}80 100%)`,
          boxShadow: `
            0 0 60px ${stateConfig.glow},
            0 0 120px ${stateConfig.glow},
            inset 0 0 40px rgba(255, 255, 255, 0.1)
          `,
        }}
        animate={prefersReducedMotion ? {} : {
          scale: state === 'thinking' ? [1, 1.1, 1] : [1, 1.05, 1],
          rotate: state === 'thinking' ? [0, 360] : 0,
        }}
        transition={{
          duration: state === 'thinking' ? 2 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Inner glow */}
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            background: `radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.3) 0%, transparent 60%)`,
          }}
        />
        
        {/* Liquid morph effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(135deg, transparent 40%, ${stateConfig.color}40 100%)`,
          }}
          animate={prefersReducedMotion ? {} : {
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Pulse rings */}
        {!prefersReducedMotion && (
          <>
            <motion.div
              className="absolute -inset-4 rounded-full border"
              style={{ borderColor: `${stateConfig.color}30` }}
              animate={{
                scale: [1, 1.5],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
            <motion.div
              className="absolute -inset-4 rounded-full border"
              style={{ borderColor: `${stateConfig.color}20` }}
              animate={{
                scale: [1, 1.8],
                opacity: [0.3, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
                delay: 0.5,
              }}
            />
          </>
        )}
      </motion.div>
      
      {/* State indicator */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider"
        style={{
          background: C26_COLORS.glassBg,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${C26_COLORS.glassBorder}`,
          color: stateConfig.color,
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        {state === 'idle' && 'AI Ready'}
        {state === 'thinking' && 'Procesando...'}
        {state === 'success' && '¡Listo!'}
        {state === 'error' && 'Error'}
        {state === 'listening' && 'Escuchando...'}
      </motion.div>
    </motion.div>
  )
}

export default memo(UltraOrb)
