"use client"

/**
 * 🎭 ADVANCED TRANSITIONS - Sistema de Animaciones Premium
 * 
 * Este módulo provee:
 * - Variantes de animación reutilizables
 * - Componentes de transición wrapper
 * - Efectos de aparición y salida elegantes
 * - Animaciones de scroll y viewport
 * - Presets de hover effects premium
 */

import { motion, Variants, HTMLMotionProps, useInView, useScroll, useTransform } from 'framer-motion'
import { forwardRef, useRef, ReactNode } from 'react'

// ============================================================================
// VARIANTES DE ANIMACIÓN PREDEFINIDAS
// ============================================================================

/** Animación fade simple */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
}

/** Animación slide desde abajo */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.16, 1, 0.3, 1] 
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 }
  }
}

/** Animación slide desde la derecha */
export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.16, 1, 0.3, 1] 
    }
  },
  exit: { 
    opacity: 0, 
    x: 30,
    transition: { duration: 0.3 }
  }
}

/** Animación scale con blur */
export const scaleBlurVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
    filter: 'blur(10px)'
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    filter: 'blur(0px)',
    transition: { 
      duration: 0.5, 
      ease: [0.16, 1, 0.3, 1] 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    filter: 'blur(5px)',
    transition: { duration: 0.2 }
  }
}

/** Animación spring bouncy */
export const springVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scale: 0.98,
    transition: { duration: 0.2 }
  }
}

/** Animación de revelación desde un lado */
export const revealVariants: Variants = {
  hidden: { 
    opacity: 0,
    clipPath: 'inset(0 100% 0 0)'
  },
  visible: { 
    opacity: 1,
    clipPath: 'inset(0 0% 0 0)',
    transition: { 
      duration: 0.8, 
      ease: [0.16, 1, 0.3, 1] 
    }
  },
  exit: { 
    opacity: 0,
    clipPath: 'inset(0 0 0 100%)',
    transition: { duration: 0.4 }
  }
}

/** Animación de lista stagger */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
}

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 }
  }
}

/** Animación de rotación 3D */
export const flip3DVariants: Variants = {
  hidden: { 
    opacity: 0, 
    rotateX: -90,
    transformPerspective: 1000
  },
  visible: { 
    opacity: 1, 
    rotateX: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.16, 1, 0.3, 1] 
    }
  },
  exit: { 
    opacity: 0, 
    rotateX: 90,
    transition: { duration: 0.3 }
  }
}

/** Animación de glow pulse */
export const glowPulseVariants: Variants = {
  hidden: { 
    opacity: 0,
    boxShadow: '0 0 0 rgba(59, 130, 246, 0)'
  },
  visible: { 
    opacity: 1,
    boxShadow: [
      '0 0 0 rgba(59, 130, 246, 0)',
      '0 0 30px rgba(59, 130, 246, 0.4)',
      '0 0 0 rgba(59, 130, 246, 0)'
    ],
    transition: { 
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// ============================================================================
// COMPONENTES WRAPPER DE TRANSICIÓN
// ============================================================================

interface TransitionWrapperProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  variant?: 'fade' | 'slideUp' | 'slideRight' | 'scaleBlur' | 'spring' | 'reveal' | 'flip3D'
  delay?: number
  duration?: number
  className?: string
}

/** Wrapper de transición con variantes predefinidas */
export const TransitionWrapper = forwardRef<HTMLDivElement, TransitionWrapperProps>(
  ({ children, variant = 'slideUp', delay = 0, duration, className = '', ...props }, ref) => {
    const variantsMap: Record<string, Variants> = {
      fade: fadeVariants,
      slideUp: slideUpVariants,
      slideRight: slideRightVariants,
      scaleBlur: scaleBlurVariants,
      spring: springVariants,
      reveal: revealVariants,
      flip3D: flip3DVariants
    }
    
    const selectedVariants = variantsMap[variant]
    
    // Modificar transición si se especifica delay o duration
    const customVariants = delay || duration ? {
      ...selectedVariants,
      visible: {
        ...selectedVariants.visible,
        transition: {
          ...((selectedVariants.visible as { transition?: object }).transition || {}),
          delay,
          ...(duration && { duration })
        }
      }
    } : selectedVariants
    
    return (
      <motion.div
        ref={ref}
        variants={customVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
TransitionWrapper.displayName = 'TransitionWrapper'

// ============================================================================
// COMPONENTE DE APARICIÓN EN VIEWPORT
// ============================================================================

interface ViewportRevealProps {
  children: ReactNode
  variant?: 'fade' | 'slideUp' | 'slideRight' | 'scaleBlur' | 'spring'
  threshold?: number
  once?: boolean
  delay?: number
  className?: string
}

/** Componente que anima cuando entra en viewport */
export function ViewportReveal({
  children,
  variant = 'slideUp',
  threshold = 0.2,
  once = true,
  delay = 0,
  className = ''
}: ViewportRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { 
    amount: threshold,
    once 
  })
  
  const variantsMap: Record<string, Variants> = {
    fade: fadeVariants,
    slideUp: slideUpVariants,
    slideRight: slideRightVariants,
    scaleBlur: scaleBlurVariants,
    spring: springVariants
  }
  
  return (
    <motion.div
      ref={ref}
      variants={variantsMap[variant]}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      style={{ transitionDelay: `${delay}s` }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================================================
// COMPONENTE DE PARALLAX SCROLL
// ============================================================================

interface ParallaxScrollProps {
  children: ReactNode
  speed?: number
  className?: string
}

/** Componente con efecto parallax en scroll */
export function ParallaxScroll({
  children,
  speed = 0.5,
  className = ''
}: ParallaxScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })
  
  const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed])
  
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  )
}

// ============================================================================
// COMPONENTE STAGGER LIST
// ============================================================================

interface StaggerListProps {
  children: ReactNode
  className?: string
  itemClassName?: string
}

/** Lista con animación stagger automática */
export function StaggerList({ children, className = '', itemClassName = '' }: StaggerListProps) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {Array.isArray(children) ? children.map((child, index) => (
        <motion.div
          key={index}
          variants={staggerItemVariants}
          className={itemClassName}
        >
          {child}
        </motion.div>
      )) : (
        <motion.div variants={staggerItemVariants} className={itemClassName}>
          {children}
        </motion.div>
      )}
    </motion.div>
  )
}

// ============================================================================
// HOVER EFFECTS PREMIUM
// ============================================================================

interface HoverLiftProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  intensity?: 'subtle' | 'medium' | 'strong'
  className?: string
}

/** Efecto de elevación en hover */
export function HoverLift({ 
  children, 
  intensity = 'medium', 
  className = '',
  ...props 
}: HoverLiftProps) {
  const intensityMap = {
    subtle: { y: -2, scale: 1.01 },
    medium: { y: -4, scale: 1.02 },
    strong: { y: -8, scale: 1.03 }
  }
  
  return (
    <motion.div
      whileHover={intensityMap[intensity]}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface HoverGlowProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  color?: string
  intensity?: number
  className?: string
}

/** Efecto de glow en hover */
export function HoverGlow({ 
  children, 
  color = 'rgba(59, 130, 246, 0.4)',
  intensity = 1,
  className = '',
  ...props 
}: HoverGlowProps) {
  return (
    <motion.div
      whileHover={{
        boxShadow: `0 0 ${30 * intensity}px ${color}, 0 0 ${60 * intensity}px ${color}40`
      }}
      transition={{ duration: 0.3 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface HoverTiltProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  maxTilt?: number
  perspective?: number
  className?: string
}

/** Efecto de tilt 3D en hover */
export function HoverTilt({ 
  children, 
  maxTilt = 10,
  perspective = 1000,
  className = '',
  ...props 
}: HoverTiltProps) {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    
    e.currentTarget.style.transform = `
      perspective(${perspective}px) 
      rotateX(${-y * maxTilt}deg) 
      rotateY(${x * maxTilt}deg)
    `
  }
  
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)'
  }
  
  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out'
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ============================================================================
// UTILIDADES DE TRANSICIÓN
// ============================================================================

/** Genera una configuración de transición con delay escalonado */
export function generateStaggerDelay(index: number, baseDelay = 0, increment = 0.1): number {
  return baseDelay + index * increment
}

/** Preset de transiciones para diferentes contextos */
export const transitionPresets = {
  instant: { duration: 0.1 },
  fast: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  normal: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  slow: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  spring: { type: 'spring', stiffness: 300, damping: 25 },
  springBouncy: { type: 'spring', stiffness: 400, damping: 15 },
  springStiff: { type: 'spring', stiffness: 500, damping: 30 }
}

export default {
  TransitionWrapper,
  ViewportReveal,
  ParallaxScroll,
  StaggerList,
  HoverLift,
  HoverGlow,
  HoverTilt,
  fadeVariants,
  slideUpVariants,
  slideRightVariants,
  scaleBlurVariants,
  springVariants,
  revealVariants,
  staggerContainerVariants,
  staggerItemVariants,
  flip3DVariants,
  glowPulseVariants,
  generateStaggerDelay,
  transitionPresets
}
