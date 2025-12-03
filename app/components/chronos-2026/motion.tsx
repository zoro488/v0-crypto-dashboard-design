'use client'

/**
 * CHRONOS 2026 - Componentes de Animación Ultra-Optimizados
 * Nivel Apple Vision Pro + Linear + Arc Browser
 * 
 * Features:
 * - Lazy loading con Suspense
 * - Reduced motion respect
 * - Physics-based animations
 * - GPU acceleration
 */

import { motion, AnimatePresence, useReducedMotion, LazyMotion, domAnimation, m } from 'framer-motion'
import { useSpring, animated } from '@react-spring/web'
import { ReactNode, memo, useRef, useEffect, useState } from 'react'
import { CHRONOS_ANIMATIONS } from '@/app/lib/constants/chronos-2026'

// ============================================
// PAGE TRANSITION - Como Arc Browser
// ============================================
export const PageTransition = memo(({ children }: { children: ReactNode }) => {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <>{children}</>
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
      transition={{ 
        duration: CHRONOS_ANIMATIONS.duration.normal, 
        ease: CHRONOS_ANIMATIONS.ease.smooth, 
      }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  )
})
PageTransition.displayName = 'PageTransition'

// ============================================
// STAGGER CONTAINER - Para grids y listas
// ============================================
export const StaggerContainer = memo(({ 
  children, 
  delay = 0.2,
  stagger = 0.08, 
}: { 
  children: ReactNode
  delay?: number
  stagger?: number 
}) => {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <>{children}</>
  }
  
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: stagger,
              delayChildren: delay,
            },
          },
        }}
        initial="hidden"
        animate="show"
      >
        {children}
      </m.div>
    </LazyMotion>
  )
})
StaggerContainer.displayName = 'StaggerContainer'

// ============================================
// STAGGER ITEM - Elemento individual animado
// ============================================
export const StaggerItem = memo(({ children }: { children: ReactNode }) => (
  <m.div
    variants={{
      hidden: { opacity: 0, y: 30, scale: 0.95 },
      show: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { 
          duration: CHRONOS_ANIMATIONS.duration.slow,
          ease: CHRONOS_ANIMATIONS.ease.smooth, 
        },
      },
    }}
    className="will-change-transform"
  >
    {children}
  </m.div>
))
StaggerItem.displayName = 'StaggerItem'

// ============================================
// HOVER SCALE - Escala sutil al hover (Linear style)
// ============================================
export const HoverScale = memo(({ 
  children, 
  scale = 1.02,
  className = '',
}: { 
  children: ReactNode
  scale?: number
  className?: string 
}) => {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }
  
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: scale - 0.04 }}
      transition={{ 
        type: 'spring', 
        ...CHRONOS_ANIMATIONS.spring.snappy, 
      }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  )
})
HoverScale.displayName = 'HoverScale'

// ============================================
// FAB MOTION - Botón flotante con entrada épica
// ============================================
export const FABMotion = memo(({ children }: { children: ReactNode }) => {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <>{children}</>
  }
  
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: 0.5,
      }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  )
})
FABMotion.displayName = 'FABMotion'

// ============================================
// FLOAT ANIMATION - Efecto flotante suave
// ============================================
export const FloatAnimation = memo(({ 
  children,
  amplitude = 10,
  duration = 6,
}: { 
  children: ReactNode
  amplitude?: number
  duration?: number
}) => {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <>{children}</>
  }
  
  return (
    <motion.div
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ 
        repeat: Infinity, 
        duration, 
        ease: 'easeInOut', 
      }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  )
})
FloatAnimation.displayName = 'FloatAnimation'

// ============================================
// TEXT REVEAL - Revelación letra por letra (iPhone style)
// ============================================
export const TextReveal = memo(({ 
  text, 
  className = '',
  delay = 0.03,
}: { 
  text: string
  className?: string
  delay?: number
}) => {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>
  }
  
  return (
    <motion.span 
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: i * delay, 
            duration: CHRONOS_ANIMATIONS.duration.slow,
            ease: CHRONOS_ANIMATIONS.ease.smooth,
          }}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  )
})
TextReveal.displayName = 'TextReveal'

// ============================================
// TILT CARD - Tarjeta con inclinación 3D (MacBook Pro ads style)
// ============================================
export const TiltCard = memo(({ 
  children,
  className = '',
  maxTilt = 15,
}: { 
  children: ReactNode
  className?: string
  maxTilt?: number
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  
  const [{ rotateX, rotateY }, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    config: { mass: 1, tension: 170, friction: 26 },
  }))
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const x = (e.clientX - centerX) / (rect.width / 2)
    const y = (e.clientY - centerY) / (rect.height / 2)
    
    api.start({
      rotateX: -y * maxTilt,
      rotateY: x * maxTilt,
    })
  }
  
  const handleMouseLeave = () => {
    api.start({ rotateX: 0, rotateY: 0 })
  }
  
  if (!mounted || prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }
  
  return (
    <animated.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </animated.div>
  )
})
TiltCard.displayName = 'TiltCard'

// ============================================
// PULSE GLOW - Efecto de pulso con glow
// ============================================
export const PulseGlow = memo(({ 
  children,
  color = '#0067FF',
  className = '',
}: { 
  children: ReactNode
  color?: string
  className?: string
}) => {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }
  
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        boxShadow: [
          `0 0 20px ${color}40`,
          `0 0 40px ${color}60`,
          `0 0 20px ${color}40`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
})
PulseGlow.displayName = 'PulseGlow'

// ============================================
// ANIMATE PRESENCE WRAPPER - Para transiciones de salida
// ============================================
export const AnimatedPresence = memo(({ 
  children,
  mode = 'wait',
}: { 
  children: ReactNode
  mode?: 'wait' | 'sync' | 'popLayout'
}) => (
  <AnimatePresence mode={mode}>
    {children}
  </AnimatePresence>
))
AnimatedPresence.displayName = 'AnimatedPresence'

// ============================================
// MORPH NUMBER - Número que se transforma suavemente
// ============================================
export const MorphNumber = memo(({ 
  value,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
}: { 
  value: number
  className?: string
  prefix?: string
  suffix?: string
  decimals?: number
}) => {
  const [{ number }] = useSpring(() => ({
    from: { number: 0 },
    number: value,
    config: { mass: 1, tension: 20, friction: 10 },
  }), [value])
  
  return (
    <animated.span className={className}>
      {number.to(n => `${prefix}${n.toFixed(decimals)}${suffix}`)}
    </animated.span>
  )
})
MorphNumber.displayName = 'MorphNumber'

// Re-export motion for direct use
export { motion, AnimatePresence as FramerAnimatePresence }
