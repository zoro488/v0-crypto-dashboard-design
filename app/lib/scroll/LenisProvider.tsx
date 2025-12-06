'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🧈 CHRONOS INFINITY - LENIS BUTTER SMOOTH SCROLL
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * El scroll más suave del planeta
 * Integración con GSAP ScrollTrigger
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, createContext, useContext, ReactNode } from 'react'
import Lenis from 'lenis'

// ════════════════════════════════════════════════════════════════════════════════════════
// CONTEXTO
// ════════════════════════════════════════════════════════════════════════════════════════

interface LenisContextValue {
  lenis: Lenis | null
  scrollTo: (target: string | number | HTMLElement, options?: ScrollToOptions) => void
}

interface ScrollToOptions {
  offset?: number
  duration?: number
  immediate?: boolean
}

const LenisContext = createContext<LenisContextValue>({
  lenis: null,
  scrollTo: () => {},
})

export const useLenis = () => useContext(LenisContext)

// ════════════════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN ULTRA-SUAVE
// ════════════════════════════════════════════════════════════════════════════════════════

const LENIS_CONFIG = {
  // Duración del scroll suave (más alto = más suave)
  duration: 1.8,
  
  // Easing personalizado ultra-suave
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  
  // Suavizar rueda del mouse
  smoothWheel: true,
  
  // No suavizar touch (mejor UX móvil)
  smoothTouch: false,
  
  // Normalizar valores de rueda entre navegadores
  wheelMultiplier: 1,
  
  // Multiplicador para touch
  touchMultiplier: 2,
  
  // Detección de scroll infinito
  infinite: false,
}

// ════════════════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ════════════════════════════════════════════════════════════════════════════════════════

interface LenisProviderProps {
  children: ReactNode
  options?: Partial<typeof LENIS_CONFIG>
}

export function LenisProvider({ children, options = {} }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null)
  const rafRef = useRef<number | null>(null)
  
  useEffect(() => {
    // Verificar reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return
    
    // Crear instancia de Lenis
    const lenis = new Lenis({
      ...LENIS_CONFIG,
      ...options,
    })
    
    lenisRef.current = lenis
    
    // RAF loop
    function raf(time: number) {
      lenis.raf(time)
      rafRef.current = requestAnimationFrame(raf)
    }
    
    rafRef.current = requestAnimationFrame(raf)
    
    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      lenis.destroy()
      lenisRef.current = null
    }
  }, [options])
  
  const scrollTo = (
    target: string | number | HTMLElement, 
    options: ScrollToOptions = {}
  ) => {
    if (!lenisRef.current) return
    
    lenisRef.current.scrollTo(target, {
      offset: options.offset ?? 0,
      duration: options.duration ?? 1.2,
      immediate: options.immediate ?? false,
    })
  }
  
  return (
    <LenisContext.Provider value={{ lenis: lenisRef.current, scrollTo }}>
      {children}
    </LenisContext.Provider>
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// HOOKS
// ════════════════════════════════════════════════════════════════════════════════════════

/** Hook para detectar dirección del scroll */
export function useScrollDirection() {
  const { lenis } = useLenis()
  const directionRef = useRef<'up' | 'down'>('down')
  const lastScrollRef = useRef(0)
  
  useEffect(() => {
    if (!lenis) return
    
    const handleScroll = () => {
      const currentScroll = lenis.scroll
      directionRef.current = currentScroll > lastScrollRef.current ? 'down' : 'up'
      lastScrollRef.current = currentScroll
    }
    
    lenis.on('scroll', handleScroll)
    return () => lenis.off('scroll', handleScroll)
  }, [lenis])
  
  return directionRef.current
}

/** Hook para detectar velocidad del scroll */
export function useScrollVelocity() {
  const { lenis } = useLenis()
  const velocityRef = useRef(0)
  
  useEffect(() => {
    if (!lenis) return
    
    const handleScroll = () => {
      velocityRef.current = lenis.velocity
    }
    
    lenis.on('scroll', handleScroll)
    return () => lenis.off('scroll', handleScroll)
  }, [lenis])
  
  return velocityRef.current
}

/** Hook para scroll progress (0-1) */
export function useScrollProgress() {
  const { lenis } = useLenis()
  const progressRef = useRef(0)
  
  useEffect(() => {
    if (!lenis) return
    
    const handleScroll = () => {
      progressRef.current = lenis.progress
    }
    
    lenis.on('scroll', handleScroll)
    return () => lenis.off('scroll', handleScroll)
  }, [lenis])
  
  return progressRef.current
}

export default LenisProvider
