'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — CURSOR EFFECTS
// Sistema de cursor magnético con trail de partículas y ripple
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface CursorPosition {
  x: number
  y: number
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  color: string
}

interface Ripple {
  id: number
  x: number
  y: number
  startTime: number
}

export function CursorEffects() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [isPointer, setIsPointer] = useState(false)
  
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  
  // Spring suave para el cursor
  const springConfig = { damping: 30, stiffness: 800, mass: 0.5 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)
  
  const lastPosRef = useRef<CursorPosition>({ x: 0, y: 0 })
  const particleIdRef = useRef<number>(0)
  const rippleIdRef = useRef<number>(0)
  const animationFrameRef = useRef<number | undefined>(undefined)
  
  // Crear partículas en el trail
  const createParticle = useCallback((x: number, y: number) => {
    const colors = ['#8B00FF', '#FFD700', '#FF1493']
    const color = colors[Math.floor(Math.random() * colors.length)]
    
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 2 + 1
    
    return {
      id: particleIdRef.current++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: Math.random() * 4 + 2,
      color,
    }
  }, [])
  
  // Crear ripple al click
  const createRipple = useCallback((x: number, y: number) => {
    return {
      id: rippleIdRef.current++,
      x,
      y,
      startTime: Date.now(),
    }
  }, [])
  
  // Actualizar partículas
  const updateParticles = useCallback(() => {
    setParticles(prev => {
      return prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02,
          size: p.size * 0.97,
        }))
        .filter(p => p.life > 0)
    })
    
    // Limpiar ripples viejos
    setRipples(prev => prev.filter(r => Date.now() - r.startTime < 1000))
  }, [])
  
  // Loop de animación
  useEffect(() => {
    const animate = () => {
      updateParticles()
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [updateParticles])
  
  // Tracking del mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      
      // Crear partículas si el mouse se movió lo suficiente
      const dx = e.clientX - lastPosRef.current.x
      const dy = e.clientY - lastPosRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > 10) {
        setParticles(prev => {
          const newParticles = [
            ...prev,
            createParticle(e.clientX, e.clientY),
          ]
          // Limitar a 50 partículas
          return newParticles.slice(-50)
        })
        
        lastPosRef.current = { x: e.clientX, y: e.clientY }
      }
      
      // Detectar si está sobre un elemento clickeable
      const target = e.target as HTMLElement
      const isClickable = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.onclick !== null ||
        target.closest('button, a, [role="button"]') !== null
      
      setIsPointer(isClickable)
    }
    
    const handleClick = (e: MouseEvent) => {
      setRipples(prev => [...prev, createRipple(e.clientX, e.clientY)])
      
      // Burst de partículas al click
      const burstParticles = Array.from({ length: 15 }, () =>
        createParticle(e.clientX, e.clientY)
      )
      setParticles(prev => [...prev, ...burstParticles].slice(-50))
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
    }
  }, [cursorX, cursorY, createParticle, createRipple])

  return (
    <>
      {/* Cursor principal */}
      <motion.div
        className="fixed pointer-events-none z-[9999] mix-blend-screen"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <motion.div
          animate={{
            scale: isPointer ? 1.5 : 1,
            opacity: isPointer ? 0.8 : 0.6,
          }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          {/* Núcleo del cursor */}
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-gold-500" />
          
          {/* Anillo exterior */}
          <motion.div
            animate={{
              scale: isPointer ? [1, 1.2, 1] : 1,
              rotate: 360,
            }}
            transition={{
              scale: {
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              },
              rotate: {
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              },
            }}
            className="absolute inset-0 -m-2"
          >
            <div className="w-7 h-7 rounded-full border-2 border-violet-500/50" />
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Partículas trail */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="fixed pointer-events-none z-[9998]"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.life,
            borderRadius: '50%',
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            transform: 'translate(-50%, -50%)',
            mixBlendMode: 'screen',
          }}
        />
      ))}
      
      {/* Ripples al click */}
      {ripples.map(ripple => {
        const age = Date.now() - ripple.startTime
        const progress = age / 1000
        const scale = 1 + progress * 50
        const opacity = 1 - progress
        
        return (
          <div
            key={ripple.id}
            className="fixed pointer-events-none z-[9997]"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 20,
              height: 20,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-violet-500" />
            <div className="absolute inset-0 w-full h-full rounded-full border border-gold-500" />
          </div>
        )
      })}
    </>
  )
}

// Hook para efectos magnéticos en elementos
export function useMagneticCursor(ref: React.RefObject<HTMLElement | null>, strength = 0.3) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springConfig = { damping: 20, stiffness: 300 }
  const xSpring = useSpring(x, springConfig)
  const ySpring = useSpring(y, springConfig)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const maxDistance = Math.max(rect.width, rect.height)
      
      if (distance < maxDistance) {
        x.set(deltaX * strength)
        y.set(deltaY * strength)
      } else {
        x.set(0)
        y.set(0)
      }
    }
    
    const handleMouseLeave = () => {
      x.set(0)
      y.set(0)
    }
    
    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [ref, x, y, strength])
  
  return { x: xSpring, y: ySpring }
}
