'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * ✨ CHRONOS INFINITY - CURSOR TRAIL MAGNÉTICO
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Trail de partículas violeta/oro que siguen al cursor
 * 30 partículas con delay delicioso (spring damping 40)
 * Solo visible cuando el mouse se mueve
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useRef, useEffect, useState, memo, useCallback } from 'react'
import { motion, useSpring, useMotionValue, useReducedMotion, AnimatePresence } from 'framer-motion'
import { springCursor } from '@/app/lib/motion/easings'

// ════════════════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════════════════════════════

const TRAIL_LENGTH = 20
const TRAIL_DECAY_MS = 1200
const COLORS = ['#8B00FF', '#9B10FF', '#FFD700', '#FFE44D', '#FF1493']

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE PARTÍCULA
// ════════════════════════════════════════════════════════════════════════════════════════

interface TrailParticle {
  id: number
  x: number
  y: number
  color: string
  size: number
}

const Particle = memo(function Particle({ 
  x, 
  y, 
  color, 
  size, 
  index 
}: TrailParticle & { index: number }) {
  return (
    <motion.div
      className="fixed pointer-events-none rounded-full"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
      initial={{ opacity: 0.8, scale: 1 }}
      animate={{ opacity: 0, scale: 0.5 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{
        duration: TRAIL_DECAY_MS / 1000,
        delay: index * 0.02,
        ease: [0.22, 1, 0.36, 1],
      }}
    />
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// CURSOR GLOW
// ════════════════════════════════════════════════════════════════════════════════════════

const CursorGlow = memo(function CursorGlow() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springX = useSpring(mouseX, { stiffness: 200, damping: 30, mass: 0.5 })
  const springY = useSpring(mouseY, { stiffness: 200, damping: 30, mass: 0.5 })
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])
  
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{
        x: springX,
        y: springY,
        width: 600,
        height: 600,
        marginLeft: -300,
        marginTop: -300,
        background: 'radial-gradient(circle, rgba(139,0,255,0.12) 0%, rgba(255,215,0,0.06) 30%, transparent 70%)',
        filter: 'blur(30px)',
      }}
    />
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════

function CursorTrail() {
  const prefersReducedMotion = useReducedMotion()
  const [particles, setParticles] = useState<TrailParticle[]>([])
  const [isMoving, setIsMoving] = useState(false)
  const lastMoveRef = useRef<number>(0)
  const particleIdRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const addParticle = useCallback((x: number, y: number) => {
    const colorIndex = Math.floor(Math.random() * COLORS.length)
    const newParticle: TrailParticle = {
      id: particleIdRef.current++,
      x: x - 3,
      y: y - 3,
      color: COLORS[colorIndex],
      size: 4 + Math.random() * 4,
    }
    
    setParticles(prev => {
      const newParticles = [...prev, newParticle]
      // Limitar cantidad
      if (newParticles.length > TRAIL_LENGTH) {
        return newParticles.slice(-TRAIL_LENGTH)
      }
      return newParticles
    })
    
    // Remover después de decaer
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id))
    }, TRAIL_DECAY_MS)
  }, [])
  
  useEffect(() => {
    if (prefersReducedMotion) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      
      // Throttle a ~30fps para performance
      if (now - lastMoveRef.current < 33) return
      lastMoveRef.current = now
      
      setIsMoving(true)
      addParticle(e.clientX, e.clientY)
      
      // Reset timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setIsMoving(false)
      }, 150)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [addParticle, prefersReducedMotion])
  
  if (prefersReducedMotion) {
    return null
  }
  
  return (
    <>
      <CursorGlow />
      <div className="fixed inset-0 pointer-events-none z-40">
        <AnimatePresence>
          {particles.map((particle, index) => (
            <Particle key={particle.id} {...particle} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

export default memo(CursorTrail)
