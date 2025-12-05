'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * ✨ CHRONOS INFINITY - MICRO INTERACTIONS LIBRARY
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Biblioteca de micro-interacciones ultra-premium:
 * - Ripple Effect
 * - Magnetic Hover
 * - Tilt Card
 * - Glow Pulse
 * - Success Confetti
 * - Loading Shimmer
 * 
 * Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useRef, memo, ReactNode, MouseEvent as ReactMouseEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { springSnappy, springQuick } from '@/app/lib/motion/easings'
import { INFINITY_COLORS } from '@/app/lib/constants/infinity-design-system'

// ════════════════════════════════════════════════════════════════════════════════════════
// 1. RIPPLE EFFECT
// ════════════════════════════════════════════════════════════════════════════════════════

interface RippleProps {
  color?: string
  duration?: number
  children: ReactNode
  className?: string
  onClick?: (e: ReactMouseEvent<HTMLDivElement>) => void
}

interface RippleInstance {
  id: number
  x: number
  y: number
  size: number
}

export const RippleContainer = memo(function RippleContainer({
  color = INFINITY_COLORS.violetGlow,
  duration = 600,
  children,
  className = '',
  onClick,
}: RippleProps) {
  const [ripples, setRipples] = useState<RippleInstance[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  
  const createRipple = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    
    const id = Date.now()
    setRipples(prev => [...prev, { id, x, y, size }])
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, duration)
    
    onClick?.(e)
  }, [duration, onClick])
  
  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onClick={createRipple}
    >
      {children}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              background: color,
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration / 1000, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 2. TILT CARD 3D
// ════════════════════════════════════════════════════════════════════════════════════════

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  glare?: boolean
  scale?: number
}

export const TiltCard = memo(function TiltCard({
  children,
  className = '',
  maxTilt = 15,
  glare = true,
  scale = 1.02,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const glareX = useMotionValue(50)
  const glareY = useMotionValue(50)
  
  const springRotateX = useSpring(rotateX, springQuick)
  const springRotateY = useSpring(rotateY, springQuick)
  
  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    
    const rect = card.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const percentX = (e.clientX - centerX) / (rect.width / 2)
    const percentY = (e.clientY - centerY) / (rect.height / 2)
    
    rotateX.set(-percentY * maxTilt)
    rotateY.set(percentX * maxTilt)
    
    if (glare) {
      glareX.set(50 + percentX * 30)
      glareY.set(50 + percentY * 30)
    }
  }, [maxTilt, glare, rotateX, rotateY, glareX, glareY])
  
  const handleMouseLeave = useCallback(() => {
    rotateX.set(0)
    rotateY.set(0)
    glareX.set(50)
    glareY.set(50)
  }, [rotateX, rotateY, glareX, glareY])
  
  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale }}
    >
      {children}
      {glare && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.15), transparent 50%)`
            ),
          }}
        />
      )}
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 3. GLOW PULSE
// ════════════════════════════════════════════════════════════════════════════════════════

interface GlowPulseProps {
  children: ReactNode
  color?: string
  intensity?: 'low' | 'medium' | 'high'
  className?: string
}

export const GlowPulse = memo(function GlowPulse({
  children,
  color = INFINITY_COLORS.violet,
  intensity = 'medium',
  className = '',
}: GlowPulseProps) {
  const intensityMap = {
    low: { blur: 20, opacity: 0.3 },
    medium: { blur: 30, opacity: 0.5 },
    high: { blur: 40, opacity: 0.7 },
  }
  
  const config = intensityMap[intensity]
  
  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="absolute inset-0 -z-10 rounded-[inherit]"
        style={{
          background: color,
          filter: `blur(${config.blur}px)`,
        }}
        animate={{
          opacity: [config.opacity * 0.5, config.opacity, config.opacity * 0.5],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {children}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 4. SUCCESS CONFETTI
// ════════════════════════════════════════════════════════════════════════════════════════

interface ConfettiPiece {
  id: number
  x: number
  y: number
  rotation: number
  color: string
  delay: number
}

interface SuccessConfettiProps {
  trigger: boolean
  colors?: string[]
  count?: number
}

export const SuccessConfetti = memo(function SuccessConfetti({
  trigger,
  colors = [INFINITY_COLORS.violet, INFINITY_COLORS.gold, INFINITY_COLORS.pink],
  count = 30,
}: SuccessConfettiProps) {
  const pieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 20,
    rotation: Math.random() * 360,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.3,
  }))
  
  return (
    <AnimatePresence>
      {trigger && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {pieces.map(piece => (
            <motion.div
              key={piece.id}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                backgroundColor: piece.color,
                rotate: piece.rotation,
              }}
              initial={{ y: -50, opacity: 1, scale: 1 }}
              animate={{
                y: window.innerHeight + 100,
                x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50],
                rotate: piece.rotation + Math.random() * 720,
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2 + Math.random(),
                delay: piece.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 5. LOADING SHIMMER
// ════════════════════════════════════════════════════════════════════════════════════════

interface ShimmerProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
}

export const LoadingShimmer = memo(function LoadingShimmer({
  width = '100%',
  height = 20,
  borderRadius = '8px',
  className = '',
}: ShimmerProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width, height, borderRadius, background: INFINITY_COLORS.glassBg }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            90deg,
            transparent 0%,
            ${INFINITY_COLORS.violetGlow} 50%,
            transparent 100%
          )`,
        }}
        animate={{ x: ['-100%', '200%'] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 6. HOVER MAGNETIC
// ════════════════════════════════════════════════════════════════════════════════════════

interface MagneticHoverProps {
  children: ReactNode
  strength?: number
  className?: string
}

export const MagneticHover = memo(function MagneticHover({
  children,
  strength = 0.2,
  className = '',
}: MagneticHoverProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springX = useSpring(x, springSnappy)
  const springY = useSpring(y, springSnappy)
  
  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    x.set((e.clientX - centerX) * strength)
    y.set((e.clientY - centerY) * strength)
  }, [strength, x, y])
  
  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])
  
  return (
    <motion.div
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 7. STAGGER CHILDREN
// ════════════════════════════════════════════════════════════════════════════════════════

interface StaggerChildrenProps {
  children: ReactNode[]
  staggerDelay?: number
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right'
}

export const StaggerChildren = memo(function StaggerChildren({
  children,
  staggerDelay = 0.05,
  className = '',
  direction = 'up',
}: StaggerChildrenProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: 20, x: 0 }
      case 'down': return { y: -20, x: 0 }
      case 'left': return { x: 20, y: 0 }
      case 'right': return { x: -20, y: 0 }
    }
  }
  
  const initial = getInitialPosition()
  
  return (
    <div className={className}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, ...initial }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{
            delay: i * staggerDelay,
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 8. FLOATING ELEMENT
// ════════════════════════════════════════════════════════════════════════════════════════

interface FloatingElementProps {
  children: ReactNode
  amplitude?: number
  duration?: number
  className?: string
}

export const FloatingElement = memo(function FloatingElement({
  children,
  amplitude = 10,
  duration = 3,
  className = '',
}: FloatingElementProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-amplitude, amplitude, -amplitude],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 9. SCALE ON TAP
// ════════════════════════════════════════════════════════════════════════════════════════

interface ScaleOnTapProps {
  children: ReactNode
  scale?: number
  className?: string
  onClick?: () => void
}

export const ScaleOnTap = memo(function ScaleOnTap({
  children,
  scale = 0.95,
  className = '',
  onClick,
}: ScaleOnTapProps) {
  return (
    <motion.div
      className={className}
      whileTap={{ scale }}
      onClick={onClick}
      transition={springSnappy}
    >
      {children}
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 10. ROTATING BORDER
// ════════════════════════════════════════════════════════════════════════════════════════

interface RotatingBorderProps {
  children: ReactNode
  colors?: string[]
  speed?: number
  borderWidth?: number
  className?: string
}

export const RotatingBorder = memo(function RotatingBorder({
  children,
  colors = [INFINITY_COLORS.violet, INFINITY_COLORS.gold, INFINITY_COLORS.pink],
  speed = 3,
  borderWidth = 2,
  className = '',
}: RotatingBorderProps) {
  const gradient = `conic-gradient(from 0deg, ${colors.join(', ')}, ${colors[0]})`
  
  return (
    <div className={`relative p-[${borderWidth}px] rounded-[inherit] ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background: gradient,
          padding: borderWidth,
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className="relative rounded-[inherit] bg-black">
        {children}
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ════════════════════════════════════════════════════════════════════════════════════════

export const MicroInteractions = {
  RippleContainer,
  TiltCard,
  GlowPulse,
  SuccessConfetti,
  LoadingShimmer,
  MagneticHover,
  StaggerChildren,
  FloatingElement,
  ScaleOnTap,
  RotatingBorder,
}

export default MicroInteractions
