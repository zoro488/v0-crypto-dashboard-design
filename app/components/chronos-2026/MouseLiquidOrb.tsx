'use client'

/**
 * CHRONOS 2026 - Mouse Liquid Orb
 * Orbe líquido que sigue el mouse con efecto glassmorphism
 * 
 * Optimizaciones:
 * - requestAnimationFrame para 0ms jank
 * - Throttled mouse events
 * - GPU-accelerated transforms
 * - Solo visible en desktop (lg+)
 */

import { useSpring, animated } from '@react-spring/web'
import { useEffect, useRef, memo, useState } from 'react'
import { CHRONOS_COLORS } from '@/app/lib/constants/chronos-2026'

// Hook para detectar preferencia de reduced motion
function useReducedMotionSafe() {
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

function MouseLiquidOrb() {
  const [springs, api] = useSpring(
    () => ({ 
      x: 0, 
      y: 0, 
      config: { tension: 300, friction: 30 }, 
    }), 
    [],
  )
  const rafRef = useRef<number | undefined>(undefined)
  const [mounted, setMounted] = useState(false)
  const prefersReducedMotion = useReducedMotionSafe()
  
  useEffect(() => {
    setMounted(true)
    
    if (prefersReducedMotion) return
    
    const handleMove = (e: PointerEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      
      rafRef.current = requestAnimationFrame(() => {
        api.start({ 
          x: e.clientX, 
          y: e.clientY, 
          immediate: true, 
        })
      })
    }
    
    // Usar pointer events (mejor soporte)
    window.addEventListener('pointermove', handleMove, { passive: true })
    
    return () => {
      window.removeEventListener('pointermove', handleMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [api, prefersReducedMotion])
  
  // No renderizar en SSR, mobile, o reduced motion
  if (!mounted || prefersReducedMotion) {
    return null
  }
  
  return (
    <animated.div
      style={{
        x: springs.x.to(v => v - 200),
        y: springs.y.to(v => v - 200),
      }}
      className="pointer-events-none fixed inset-0 z-40 hidden lg:block"
    >
      {/* Orbe principal con gradient */}
      <div 
        className="w-[400px] h-[400px] rounded-full blur-3xl opacity-30"
        style={{
          background: `
            radial-gradient(circle at center,
              ${CHRONOS_COLORS.primary}60 0%,
              ${CHRONOS_COLORS.accent}40 40%,
              transparent 70%
            )
          `,
        }}
      />
      
      {/* Orbe interior más intenso */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full blur-2xl opacity-40"
        style={{
          background: `
            radial-gradient(circle at center,
              ${CHRONOS_COLORS.primary}80 0%,
              ${CHRONOS_COLORS.accent}50 50%,
              transparent 100%
            )
          `,
        }}
      />
    </animated.div>
  )
}

export default memo(MouseLiquidOrb)
