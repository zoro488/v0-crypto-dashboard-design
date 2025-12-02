'use client'

import { useEffect, useCallback, useRef } from 'react'
import { logger } from '@/app/lib/utils/logger'

interface PerformanceMetrics {
  fps: number
  memoryUsage?: number
  domNodes: number
  layoutShift: number
}

/**
 * 🚀 HOOK DE RENDIMIENTO OPTIMIZADO
 * 
 * Características:
 * - Aceleración GPU automática
 * - Optimización de scroll pasivo
 * - Precarga de recursos críticos
 * - Monitoreo de FPS
 * - Limpieza automática de elementos will-change
 * - Lazy loading de imágenes
 */
export function useOptimizedPerformance() {
  const rafIdRef = useRef<number | undefined>(undefined)
  const metricsRef = useRef<PerformanceMetrics>({
    fps: 60,
    domNodes: 0,
    layoutShift: 0,
  })

  useEffect(() => {
    // 1. Habilitar aceleración GPU en el body
    const enableGPUAcceleration = () => {
      document.body.style.transform = 'translateZ(0)'
      document.body.style.backfaceVisibility = 'hidden'
      document.body.style.perspective = '1000px'
      document.documentElement.style.scrollBehavior = 'smooth'
    }

    // 2. Optimizar scroll con throttle pasivo
    const optimizeScrolling = () => {
      let ticking = false
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            ticking = false
          })
          ticking = true
        }
      }
      window.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('touchmove', handleScroll, { passive: true })
      return () => {
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('touchmove', handleScroll)
      }
    }

    // 3. Precargar recursos críticos
    const preloadCriticalResources = () => {
      // Preconectar a servicios externos
      const preconnects = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://firestore.googleapis.com',
      ]
      
      preconnects.forEach(href => {
        const link = document.createElement('link')
        link.rel = 'preconnect'
        link.href = href
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      })

      // Precargar fuentes críticas
      if ('fonts' in document) {
        document.fonts.load('600 1em Inter')
        document.fonts.load('700 1em Inter')
      }
    }

    // 4. Habilitar hardware acceleration para elementos animados
    const enableHardwareAcceleration = () => {
      // Usar Intersection Observer para optimizar will-change
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.target instanceof HTMLElement) {
              if (entry.isIntersecting) {
                entry.target.style.willChange = 'transform, opacity'
              } else {
                entry.target.style.willChange = 'auto'
              }
            }
          })
        },
        { rootMargin: '50px' },
      )

      // Observar elementos con animaciones
      const animatedElements = document.querySelectorAll(
        '[class*="animate"], [class*="motion"], [class*="transition"]',
      )
      animatedElements.forEach((el) => observer.observe(el))

      return () => observer.disconnect()
    }

    // 5. Optimizar imágenes con lazy loading
    const optimizeImages = () => {
      const images = document.querySelectorAll('img:not([loading])')
      images.forEach((img) => {
        img.setAttribute('loading', 'lazy')
        img.setAttribute('decoding', 'async')
      })
    }

    // 6. Monitorear rendimiento (solo en desarrollo)
    const monitorPerformance = () => {
      if (process.env.NODE_ENV !== 'development') return () => {}

      let frameCount = 0
      let lastTime = performance.now()

      const measureFPS = () => {
        frameCount++
        const currentTime = performance.now()
        
        if (currentTime - lastTime >= 1000) {
          metricsRef.current.fps = frameCount
          metricsRef.current.domNodes = document.querySelectorAll('*').length
          
          // Log solo si FPS es bajo
          if (frameCount < 30) {
            logger.warn('Low FPS detected', { 
              context: 'Performance',
              data: { fps: frameCount, domNodes: metricsRef.current.domNodes },
            })
          }
          
          frameCount = 0
          lastTime = currentTime
        }
        
        rafIdRef.current = requestAnimationFrame(measureFPS)
      }

      rafIdRef.current = requestAnimationFrame(measureFPS)

      return () => {
        if (rafIdRef.current !== undefined) {
          cancelAnimationFrame(rafIdRef.current)
        }
      }
    }

    // 7. Reducir motion para usuarios con preferencias
    const respectMotionPreferences = () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        if (e.matches) {
          document.documentElement.classList.add('reduce-motion')
        } else {
          document.documentElement.classList.remove('reduce-motion')
        }
      }

      handleChange(mediaQuery)
      mediaQuery.addEventListener('change', handleChange)
      
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    // Ejecutar todas las optimizaciones
    enableGPUAcceleration()
    const cleanupScroll = optimizeScrolling()
    preloadCriticalResources()
    const cleanupHardwareAccel = enableHardwareAcceleration()
    optimizeImages()
    const cleanupPerformance = monitorPerformance()
    const cleanupMotion = respectMotionPreferences()

    logger.info('Performance optimizations enabled', { context: 'Performance' })

    return () => {
      cleanupScroll()
      cleanupHardwareAccel()
      cleanupPerformance()
      cleanupMotion()
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])
}

/**
 * Hook para obtener métricas de rendimiento en tiempo real
 */
export function usePerformanceMetrics() {
  const metricsRef = useRef<PerformanceMetrics>({
    fps: 60,
    domNodes: 0,
    layoutShift: 0,
  })

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let rafId: number | undefined

    const measure = () => {
      frameCount++
      const now = performance.now()
      
      if (now - lastTime >= 1000) {
        metricsRef.current = {
          fps: frameCount,
          domNodes: document.querySelectorAll('*').length,
          memoryUsage: (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize,
          layoutShift: 0,
        }
        frameCount = 0
        lastTime = now
      }
      
      rafId = requestAnimationFrame(measure)
    }

    rafId = requestAnimationFrame(measure)

    return () => {
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return metricsRef.current
}

/**
 * Hook para debounce optimizado
 */
export function useDebounce<T>(value: T, delay: number): T {
  const valueRef = useRef(value)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      valueRef.current = value
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return valueRef.current
}

/**
 * Hook para throttle optimizado
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
): T {
  const lastCall = useRef(0)
  const lastCallTimer = useRef<NodeJS.Timeout | undefined>(undefined)

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      
      if (now - lastCall.current >= delay) {
        lastCall.current = now
        callback(...args)
      } else {
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current)
        }
        lastCallTimer.current = setTimeout(() => {
          lastCall.current = Date.now()
          callback(...args)
        }, delay - (now - lastCall.current))
      }
    },
    [callback, delay],
  ) as T

  return throttledCallback
}
