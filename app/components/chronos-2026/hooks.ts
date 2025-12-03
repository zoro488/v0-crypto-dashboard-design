'use client'

/**
 * CHRONOS 2026 - Hooks de utilidad
 * Hooks personalizados optimizados para el sistema
 */

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook para detectar preferencia de reduced motion
 * Más confiable que useReducedMotion de framer-motion
 */
export function useReducedMotionSafe(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])
  
  return prefersReduced
}

/**
 * Hook para detectar soporte de WebGL
 */
export function useWebGLSupport(): boolean {
  const [hasWebGL, setHasWebGL] = useState(true)
  
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      setHasWebGL(!!gl)
    } catch {
      setHasWebGL(false)
    }
  }, [])
  
  return hasWebGL
}

/**
 * Hook para detectar si el componente está montado
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return mounted
}

/**
 * Hook para throttle de funciones
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
): T {
  const lastRan = useRef(Date.now())
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      
      if (now - lastRan.current >= delay) {
        callback(...args)
        lastRan.current = now
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          callback(...args)
          lastRan.current = Date.now()
        }, delay - (now - lastRan.current))
      }
    }) as T,
    [callback, delay],
  )
}

/**
 * Hook para detectar intersección (visibility)
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element | null>,
  options?: IntersectionObserverInit,
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)
    
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, options])
  
  return isIntersecting
}

/**
 * Hook para detectar tamaño del viewport
 */
export function useViewportSize(): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 })
  
  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    
    handleResize()
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return size
}

/**
 * Hook para detectar si es móvil
 */
export function useIsMobile(breakpoint = 768): boolean {
  const { width } = useViewportSize()
  return width > 0 && width < breakpoint
}

/**
 * Hook para posición del mouse
 */
export function useMousePosition(): { x: number; y: number } {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])
  
  return position
}
