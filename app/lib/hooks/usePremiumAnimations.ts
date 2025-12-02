'use client'

/**
 * 🎬 PREMIUM ANIMATIONS HOOKS - CHRONOS
 * 
 * Hooks avanzados para animaciones:
 * - Scroll-triggered reveals
 * - Parallax effects
 * - Mouse tracking
 * - Stagger animations
 * - Performance optimized
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { 
  useMotionValue, 
  useSpring, 
  useTransform, 
  useInView,
  animate,
  MotionValue,
} from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════════
// SCROLL PROGRESS HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export const useScrollProgress = () => {
  const scrollY = useMotionValue(0)
  const scrollProgress = useMotionValue(0)
  
  useEffect(() => {
    const updateScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      scrollY.set(scrollTop)
      scrollProgress.set(docHeight > 0 ? scrollTop / docHeight : 0)
    }
    
    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => window.removeEventListener('scroll', updateScroll)
  }, [scrollY, scrollProgress])
  
  return { scrollY, scrollProgress }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARALLAX HOOK
// ═══════════════════════════════════════════════════════════════════════════════

interface ParallaxConfig {
  speed?: number
  direction?: 'up' | 'down'
  easing?: boolean
}

export const useParallax = (config: ParallaxConfig = {}) => {
  const { speed = 0.5, direction = 'up', easing = true } = config
  const { scrollY } = useScrollProgress()
  
  const multiplier = direction === 'up' ? -speed : speed
  const rawY = useTransform(scrollY, (v) => v * multiplier)
  
  // useSpring SIEMPRE se llama (regla de hooks) - usamos config para desactivar easing
  const springY = useSpring(rawY, { 
    stiffness: easing ? 100 : 10000, 
    damping: easing ? 30 : 10000,
  })
  
  // Si easing está desactivado, springY seguirá el valor inmediatamente
  // debido a la alta rigidez/amortiguación
  return { y: springY }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOUSE POSITION HOOK - Window Level
// ═══════════════════════════════════════════════════════════════════════════════

export const useMousePosition = () => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const normalizedX = useMotionValue(0)
  const normalizedY = useMotionValue(0)
  
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      normalizedX.set((e.clientX / window.innerWidth) * 2 - 1)
      normalizedY.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    
    window.addEventListener('mousemove', updateMousePosition, { passive: true })
    return () => window.removeEventListener('mousemove', updateMousePosition)
  }, [mouseX, mouseY, normalizedX, normalizedY])
  
  const smoothX = useSpring(mouseX, { stiffness: 100, damping: 20 })
  const smoothY = useSpring(mouseY, { stiffness: 100, damping: 20 })
  
  return { 
    mouseX, 
    mouseY, 
    smoothX, 
    smoothY,
    normalizedX,
    normalizedY, 
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ELEMENT MOUSE TRACKING HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export const useElementMouseTracking = <T extends HTMLElement>() => {
  const ref = useRef<T>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const centerX = useMotionValue(0)
  const centerY = useMotionValue(0)
  
  const handleMouseMove = useCallback((e: React.MouseEvent<T>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    
    // Position relative to element
    x.set(e.clientX - rect.left)
    y.set(e.clientY - rect.top)
    
    // Position relative to center (-1 to 1)
    centerX.set(((e.clientX - rect.left) / rect.width) * 2 - 1)
    centerY.set(((e.clientY - rect.top) / rect.height) * 2 - 1)
  }, [x, y, centerX, centerY])
  
  const handleMouseLeave = useCallback(() => {
    animate(centerX, 0, { duration: 0.3 })
    animate(centerY, 0, { duration: 0.3 })
  }, [centerX, centerY])
  
  return {
    ref,
    x,
    y,
    centerX,
    centerY,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGGER ANIMATION HOOK
// ═══════════════════════════════════════════════════════════════════════════════

interface StaggerConfig {
  stagger?: number
  duration?: number
  delay?: number
}

export const useStaggerAnimation = (
  itemCount: number, 
  config: StaggerConfig = {},
) => {
  const { stagger = 0.1, duration = 0.5, delay = 0 } = config
  
  const getItemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: delay + i * stagger,
        duration,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  }), [stagger, duration, delay])
  
  const containerVariants = useMemo(() => ({
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  }), [stagger, delay])
  
  return { 
    getItemVariants, 
    containerVariants,
    itemCount, 
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERSECTION REVEAL HOOK
// ═══════════════════════════════════════════════════════════════════════════════

interface RevealConfig {
  threshold?: number
  once?: boolean
  rootMargin?: string
}

export const useRevealOnScroll = (config: RevealConfig = {}) => {
  const { threshold = 0.1, once = true, rootMargin = '-50px' } = config
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { 
    once, 
    margin: rootMargin as `${number}px ${number}px ${number}px ${number}px` | `${number}px ${number}px ${number}px` | `${number}px ${number}px` | `${number}px`,
    amount: threshold, 
  })
  
  const variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }
  
  return { ref, isInView, variants }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPRING VALUES HOOK
// ═══════════════════════════════════════════════════════════════════════════════

interface SpringConfig {
  stiffness?: number
  damping?: number
  mass?: number
}

export const useSpringValue = (
  value: number, 
  config: SpringConfig = {},
) => {
  const { stiffness = 300, damping = 30, mass = 1 } = config
  const motionValue = useMotionValue(value)
  const springValue = useSpring(motionValue, { stiffness, damping, mass })
  
  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])
  
  return springValue
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER HOOK
// ═══════════════════════════════════════════════════════════════════════════════

interface CounterConfig {
  duration?: number
  delay?: number
  decimals?: number
}

export const useAnimatedCounter = (
  targetValue: number,
  config: CounterConfig = {},
) => {
  const { duration = 2, delay = 0, decimals = 0 } = config
  const [value, setValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAnimating(true)
      const controls = animate(0, targetValue, {
        duration,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (v) => setValue(Number(v.toFixed(decimals))),
        onComplete: () => setIsAnimating(false),
      })
      
      return () => controls.stop()
    }, delay * 1000)
    
    return () => clearTimeout(timeout)
  }, [targetValue, duration, delay, decimals])
  
  return { value, isAnimating }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3D TILT HOOK
// ═══════════════════════════════════════════════════════════════════════════════

interface TiltConfig {
  maxTilt?: number
  perspective?: number
  scale?: number
}

export const useTilt = <T extends HTMLElement>(config: TiltConfig = {}) => {
  const { maxTilt = 15, perspective = 1000, scale = 1.02 } = config
  const ref = useRef<T>(null)
  
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const scaleValue = useMotionValue(1)
  
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 })
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 })
  const springScale = useSpring(scaleValue, { stiffness: 300, damping: 30 })
  
  const handleMouseMove = useCallback((e: React.MouseEvent<T>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const percentX = (e.clientX - centerX) / (rect.width / 2)
    const percentY = (e.clientY - centerY) / (rect.height / 2)
    
    rotateY.set(percentX * maxTilt)
    rotateX.set(-percentY * maxTilt)
    scaleValue.set(scale)
  }, [rotateX, rotateY, scaleValue, maxTilt, scale])
  
  const handleMouseLeave = useCallback(() => {
    rotateX.set(0)
    rotateY.set(0)
    scaleValue.set(1)
  }, [rotateX, rotateY, scaleValue])
  
  const style = {
    rotateX: springRotateX,
    rotateY: springRotateY,
    scale: springScale,
    perspective,
    transformStyle: 'preserve-3d' as const,
  }
  
  return {
    ref,
    style,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAGNETIC BUTTON HOOK
// ═══════════════════════════════════════════════════════════════════════════════

interface MagneticConfig {
  strength?: number
  radius?: number
}

export const useMagnetic = <T extends HTMLElement>(config: MagneticConfig = {}) => {
  const { strength = 0.3, radius = 150 } = config
  const ref = useRef<T>(null)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springX = useSpring(x, { stiffness: 150, damping: 15 })
  const springY = useSpring(y, { stiffness: 150, damping: 15 })
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const distanceX = e.clientX - centerX
      const distanceY = e.clientY - centerY
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)
      
      if (distance < radius) {
        const factor = 1 - distance / radius
        x.set(distanceX * strength * factor)
        y.set(distanceY * strength * factor)
      } else {
        x.set(0)
        y.set(0)
      }
    }
    
    const handleMouseLeave = () => {
      x.set(0)
      y.set(0)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [x, y, strength, radius])
  
  return {
    ref,
    style: {
      x: springX,
      y: springY,
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MORPH TRANSITION HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export const useMorphTransition = (layoutId: string) => {
  return {
    layoutId,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REDUCED MOTION HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  return prefersReducedMotion
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESETS FOR COMMON ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const animationPresets = {
  // Fade variants
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  },
  
  // Slide variants
  slideUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }, 
    },
  },
  
  slideDown: {
    hidden: { opacity: 0, y: -30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }, 
    },
  },
  
  slideLeft: {
    hidden: { opacity: 0, x: 30 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }, 
    },
  },
  
  slideRight: {
    hidden: { opacity: 0, x: -30 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }, 
    },
  },
  
  // Scale variants
  scaleUp: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }, 
    },
  },
  
  // Blur variants
  blurIn: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      filter: 'blur(0px)', 
      transition: { duration: 0.6 }, 
    },
  },
  
  // Pop variants
  pop: {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 20, 
      }, 
    },
  },
  
  // Rotate variants
  rotateIn: {
    hidden: { opacity: 0, rotate: -10, scale: 0.9 },
    visible: { 
      opacity: 1, 
      rotate: 0, 
      scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }, 
    },
  },
} as const

export type AnimationPreset = keyof typeof animationPresets
