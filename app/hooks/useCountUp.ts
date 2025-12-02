'use client'

/**
 * 🔢 useCountUp - Hook de Animación Count-Up Premium
 * 
 * Anima valores numéricos con easing suave estilo Grok.com 2025
 * 
 * @example
 * const displayValue = useCountUp(1234567, { duration: 2000, prefix: '$' })
 * // Renderiza: "$1,234,567" con animación
 */

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseCountUpOptions {
  /** Duración de la animación en ms */
  duration?: number
  /** Retraso antes de iniciar en ms */
  delay?: number
  /** Función de easing */
  easing?: 'linear' | 'easeOut' | 'easeInOut' | 'easeOutQuart' | 'easeOutExpo'
  /** Número de decimales */
  decimals?: number
  /** Separador de miles */
  separator?: string
  /** Prefijo (ej: '$') */
  prefix?: string
  /** Sufijo (ej: '%', ' uds') */
  suffix?: string
  /** Si debe iniciar la animación automáticamente */
  autoStart?: boolean
  /** Callback al completar */
  onComplete?: () => void
}

// Funciones de easing
const easingFunctions = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
}

/**
 * Hook para animar valores numéricos
 */
export function useCountUp(
  endValue: number,
  options: UseCountUpOptions = {},
): string {
  const {
    duration = 1500,
    delay = 0,
    easing = 'easeOutQuart',
    decimals = 0,
    separator = ',',
    prefix = '',
    suffix = '',
    autoStart = true,
    onComplete,
  } = options

  const [displayValue, setDisplayValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const startValueRef = useRef(0)

  const formatNumber = useCallback((num: number): string => {
    const fixed = num.toFixed(decimals)
    const parts = fixed.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    return `${prefix}${parts.join('.')}${suffix}`
  }, [decimals, separator, prefix, suffix])

  const animate = useCallback((timestamp: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp
    }

    const elapsed = timestamp - startTimeRef.current
    const progress = Math.min(elapsed / duration, 1)
    const easedProgress = easingFunctions[easing](progress)
    
    const currentValue = startValueRef.current + (endValue - startValueRef.current) * easedProgress
    setDisplayValue(currentValue)

    if (progress < 1) {
      rafRef.current = requestAnimationFrame(animate)
    } else {
      setDisplayValue(endValue)
      onComplete?.()
    }
  }, [endValue, duration, easing, onComplete])

  const start = useCallback(() => {
    startValueRef.current = displayValue
    startTimeRef.current = null
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    
    rafRef.current = requestAnimationFrame(animate)
  }, [animate, displayValue])

  const reset = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    setDisplayValue(0)
    startValueRef.current = 0
    startTimeRef.current = null
  }, [])

  useEffect(() => {
    if (!autoStart) return

    const timer = setTimeout(() => {
      start()
    }, delay)

    return () => {
      clearTimeout(timer)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [endValue, delay, autoStart, start])

  // Actualizar cuando cambia el valor final
  useEffect(() => {
    if (autoStart && displayValue !== 0) {
      start()
    }
  }, [endValue]) // eslint-disable-line react-hooks/exhaustive-deps

  return formatNumber(displayValue)
}

/**
 * Hook para múltiples count-ups sincronizados
 */
export function useMultiCountUp(
  values: number[],
  options: UseCountUpOptions = {},
): string[] {
  const { delay = 0, ...restOptions } = options
  
  return values.map((value, index) => 
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useCountUp(value, { 
      ...restOptions, 
      delay: delay + index * 100, // Stagger de 100ms entre valores
    }),
  )
}

export default useCountUp
