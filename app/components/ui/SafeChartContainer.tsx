"use client"

/**
 * 🛡️ SAFE CHART CONTAINER - Wrapper seguro para Recharts
 * 
 * Soluciona los siguientes problemas:
 * 1. width(-1) and height(-1) errors cuando el contenedor no tiene dimensiones
 * 2. Maximum update depth exceeded por animaciones infinitas
 * 3. Renderizado antes de que el DOM esté listo
 * 
 * Uso:
 * <SafeChartContainer height={300}>
 *   <AreaChart data={data}>...</AreaChart>
 * </SafeChartContainer>
 */

import { useState, useEffect, useRef, useCallback, type ReactNode, type ReactElement, isValidElement } from "react"
import { ResponsiveContainer } from "recharts"

interface SafeChartContainerProps {
  /** Contenido del chart (AreaChart, BarChart, etc.) */
  children: ReactNode
  /** Altura del contenedor - OBLIGATORIO para evitar errores */
  height?: number | string
  /** Ancho del contenedor */
  width?: number | string
  /** Altura mínima en pixels */
  minHeight?: number
  /** Ancho mínimo en pixels */
  minWidth?: number
  /** Clases CSS adicionales */
  className?: string
  /** Debounce en ms para resize (previene re-renders excesivos) */
  debounceMs?: number
  /** Mostrar skeleton mientras se monta */
  showSkeleton?: boolean
  /** Aspect ratio (alternativa a height fijo) */
  aspect?: number
}

/**
 * Wrapper seguro para ResponsiveContainer de Recharts
 * Previene errores de dimensiones negativas y loops de animación
 */
export function SafeChartContainer({
  children,
  height = 300,
  width = "100%",
  minHeight = 100,
  minWidth = 100,
  className = "",
  debounceMs = 150,
  showSkeleton = true,
  aspect,
}: SafeChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 200, height: 200 })
  const mountedRef = useRef(true)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Función para medir dimensiones de forma segura
  const measureDimensions = useCallback(() => {
    if (!containerRef.current || !mountedRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const w = Math.max(rect.width, minWidth)
    const h = Math.max(rect.height, minHeight)
    
    if (w > 0 && h > 0) {
      setDimensions(prev => {
        // Solo actualizar si cambió significativamente (evita loops)
        if (Math.abs(prev.width - w) > 5 || Math.abs(prev.height - h) > 5) {
          return { width: w, height: h }
        }
        return prev
      })
      if (!isReady) setIsReady(true)
    }
  }, [minWidth, minHeight, isReady])

  // Efecto de inicialización
  useEffect(() => {
    mountedRef.current = true
    
    // Múltiples intentos para asegurar medición correcta
    const checkDimensions = () => {
      if (!mountedRef.current) return
      measureDimensions()
    }

    // Intento inmediato
    checkDimensions()
    
    // Intento después de un frame
    const frame1 = requestAnimationFrame(checkDimensions)
    
    // Intento después de 100ms (para layouts complejos)
    const timeout1 = setTimeout(checkDimensions, 100)
    
    // Intento después de 300ms (para contenedores con animación)
    const timeout2 = setTimeout(checkDimensions, 300)

    return () => {
      mountedRef.current = false
      cancelAnimationFrame(frame1)
      clearTimeout(timeout1)
      clearTimeout(timeout2)
    }
  }, [measureDimensions])

  // ResizeObserver con debounce mejorado
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (!mountedRef.current) return
      
      // Cancelar timeout anterior
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      
      // Debounce la actualización
      resizeTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return
        
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect
          if (w > minWidth && h > minHeight) {
            setDimensions(prev => {
              if (Math.abs(prev.width - w) > 5 || Math.abs(prev.height - h) > 5) {
                return { width: w, height: h }
              }
              return prev
            })
            if (!isReady) setIsReady(true)
          }
        }
      }, debounceMs)
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      resizeObserver.disconnect()
    }
  }, [debounceMs, isReady, minWidth, minHeight])

  // Calcular altura efectiva
  const effectiveHeight = typeof height === "number" 
    ? Math.max(height, minHeight) 
    : height

  // Skeleton de carga mejorado
  const Skeleton = () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-900/30 rounded-lg">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-pulse bg-white/5 rounded-lg w-3/4 h-2/3" />
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div 
              key={i}
              className="w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )

  // Verificar si las dimensiones son válidas
  const hasValidDimensions = dimensions.width >= minWidth && dimensions.height >= minHeight

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width,
        height: effectiveHeight,
        minHeight,
        minWidth,
      }}
    >
      {!isReady && showSkeleton ? (
        <Skeleton />
      ) : hasValidDimensions ? (
        <ResponsiveContainer 
          width={dimensions.width}
          height={dimensions.height}
          minWidth={minWidth}
          minHeight={minHeight}
          aspect={aspect}
          debounce={debounceMs}
        >
          {isValidElement(children) ? children : <></>}
        </ResponsiveContainer>
      ) : (
        <Skeleton />
      )}
    </div>
  )
}

/**
 * Hook para deshabilitar animaciones de Recharts
 * Retorna props seguras para componentes de Recharts
 */
export function useSafeChartProps() {
  return {
    // Deshabilitar animaciones para prevenir loops infinitos
    isAnimationActive: false,
    // Alternativa: usar animationDuration muy corto
    // animationDuration: 0,
    // animationEasing: "linear" as const,
  }
}

/**
 * Props seguras para Area, Bar, Line, etc.
 * Usar spread: <Area {...SAFE_ANIMATION_PROPS} ... />
 */
export const SAFE_ANIMATION_PROPS = {
  isAnimationActive: false,
  animationDuration: 0,
} as const

/**
 * Props seguras para Pie charts
 */
export const SAFE_PIE_PROPS = {
  isAnimationActive: false,
  animationDuration: 0,
  animationBegin: 0,
} as const

export default SafeChartContainer
