/**
 * 🚀 Performance Optimization Utilities
 * Optimizaciones avanzadas para frontend CHRONOS
 * 
 * Incluye:
 * - Lazy loading inteligente
 * - Image optimization
 * - Code splitting
 * - Memory management
 * - Animation optimizations
 */

import { useEffect, useCallback, useRef, useState } from 'react'

// ===================================================================
// INTERSECTION OBSERVER HOOK - Lazy Loading
// ===================================================================

interface UseIntersectionOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionOptions = {},
) {
  const { threshold = 0, rootMargin = '50px', triggerOnce = true } = options
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting
        setIsIntersecting(intersecting)
        
        if (intersecting && triggerOnce) {
          setHasIntersected(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce])

  return { ref, isIntersecting: triggerOnce ? hasIntersected : isIntersecting }
}

// ===================================================================
// DEBOUNCE & THROTTLE HOOKS
// ===================================================================

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
): T {
  const lastRan = useRef(Date.now())
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    ((...args: unknown[]) => {
      const now = Date.now()
      
      if (now - lastRan.current >= delay) {
        lastRan.current = now
        return callback(...args)
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        lastRan.current = Date.now()
        callback(...args)
      }, delay - (now - lastRan.current))
    }) as T,
    [callback, delay],
  )
}

// ===================================================================
// REQUEST ANIMATION FRAME HOOK - 60fps Animations
// ===================================================================

export function useAnimationFrame(callback: (deltaTime: number) => void) {
  const requestRef = useRef<number | null>(null)
  const previousTimeRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current
        callback(deltaTime)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [callback])
}

// ===================================================================
// MEMORY MANAGEMENT
// ===================================================================

/**
 * Hook para limpiar recursos automáticamente
 */
export function useCleanup(cleanup: () => void) {
  useEffect(() => {
    return cleanup
  }, [cleanup])
}

/**
 * Pool de objetos reutilizables para reducir garbage collection
 */
export class ObjectPool<T> {
  private pool: T[] = []
  private factory: () => T
  private reset: (obj: T) => T
  private maxSize: number

  constructor(
    factory: () => T,
    reset: (obj: T) => T,
    maxSize = 100,
  ) {
    this.factory = factory
    this.reset = reset
    this.maxSize = maxSize
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.factory()
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(this.reset(obj))
    }
  }

  clear(): void {
    this.pool = []
  }
}

// ===================================================================
// IMAGE OPTIMIZATION
// ===================================================================

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
}

/**
 * Generar URLs de imagen optimizadas para diferentes resoluciones
 */
export function generateResponsiveImageUrls(
  baseSrc: string,
  widths: number[] = [320, 640, 1024, 1920],
): { srcSet: string; sizes: string } {
  // Para imágenes de Firebase Storage o Spline
  if (baseSrc.includes('firebasestorage') || baseSrc.includes('spline')) {
    return {
      srcSet: widths.map(w => `${baseSrc} ${w}w`).join(', '),
      sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    }
  }

  // Para imágenes locales, usar el Image Optimization de Next.js
  return {
    srcSet: widths.map(w => `/_next/image?url=${encodeURIComponent(baseSrc)}&w=${w}&q=75 ${w}w`).join(', '),
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  }
}

// ===================================================================
// PRELOADING & PREFETCHING
// ===================================================================

/**
 * Precargar recursos críticos
 */
export function preloadCriticalAssets(assets: {
  scripts?: string[];
  styles?: string[];
  images?: string[];
  fonts?: string[];
}) {
  if (typeof window === 'undefined') return

  const head = document.head

  // Preload fonts
  assets.fonts?.forEach(font => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    link.href = font
    head.appendChild(link)
  })

  // Preload images
  assets.images?.forEach(img => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = img
    head.appendChild(link)
  })

  // Prefetch scripts
  assets.scripts?.forEach(script => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'script'
    link.href = script
    head.appendChild(link)
  })
}

/**
 * DNS Prefetch para dominios externos
 */
export function dnsPrefetch(domains: string[]) {
  if (typeof window === 'undefined') return

  domains.forEach(domain => {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = domain
    document.head.appendChild(link)
  })
}

// Dominios comunes para CHRONOS
export const CHRONOS_EXTERNAL_DOMAINS = [
  'https://firebasestorage.googleapis.com',
  'https://prod.spline.design',
  'https://models.github.ai',
  'https://api.openai.com',
  'https://mockend.com',
]

// ===================================================================
// CANVAS/WEBGL OPTIMIZATIONS
// ===================================================================

/**
 * Detectar capacidades del dispositivo
 */
export function getDeviceCapabilities() {
  if (typeof window === 'undefined') {
    return { isLowEnd: false, supportsWebGL2: true, maxTextureSize: 4096 }
  }

  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  
  let maxTextureSize = 4096
  let supportsWebGL2 = false

  if (gl) {
    maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    supportsWebGL2 = !!(canvas.getContext('webgl2'))
  }

  // Detectar dispositivo de gama baja
  const isLowEnd = 
    navigator.hardwareConcurrency <= 4 ||
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4 ||
    maxTextureSize < 4096

  return { isLowEnd, supportsWebGL2, maxTextureSize }
}

/**
 * Configuración adaptativa para Three.js/Spline
 */
export function getAdaptive3DConfig() {
  const { isLowEnd, supportsWebGL2, maxTextureSize } = getDeviceCapabilities()

  return {
    // Reducir calidad en dispositivos de gama baja
    pixelRatio: isLowEnd ? 1 : Math.min(window.devicePixelRatio, 2),
    antialias: !isLowEnd,
    shadows: !isLowEnd,
    maxTextureSize: Math.min(maxTextureSize, isLowEnd ? 2048 : 4096),
    
    // Post-processing
    bloom: !isLowEnd,
    ambientOcclusion: !isLowEnd && supportsWebGL2,
    
    // Animation
    targetFPS: isLowEnd ? 30 : 60,
  }
}

// ===================================================================
// VIRTUAL LIST UTILITIES
// ===================================================================

export interface VirtualListConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

/**
 * Calcular items visibles para virtualización
 */
export function calculateVisibleRange(
  scrollTop: number,
  totalItems: number,
  config: VirtualListConfig,
) {
  const { itemHeight, containerHeight, overscan = 3 } = config

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2)

  return {
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight,
    visibleItems: endIndex - startIndex + 1,
  }
}

export default {
  useIntersectionObserver,
  useDebounce,
  useThrottle,
  useAnimationFrame,
  useCleanup,
  ObjectPool,
  generateResponsiveImageUrls,
  preloadCriticalAssets,
  dnsPrefetch,
  getDeviceCapabilities,
  getAdaptive3DConfig,
  calculateVisibleRange,
  CHRONOS_EXTERNAL_DOMAINS,
}
