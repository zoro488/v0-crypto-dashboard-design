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

import { useState, useEffect, useRef, type ReactNode } from "react"
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
  debounceMs = 100,
  showSkeleton = true,
  aspect,
}: SafeChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    // Esperar al siguiente frame para asegurar que el DOM está listo
    const frame = requestAnimationFrame(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({ width: rect.width, height: rect.height })
          setIsReady(true)
        }
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    let debounceTimer: NodeJS.Timeout

    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect
          if (w > 0 && h > 0) {
            setDimensions({ width: w, height: h })
            if (!isReady) setIsReady(true)
          }
        }
      }, debounceMs)
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      clearTimeout(debounceTimer)
      resizeObserver.disconnect()
    }
  }, [debounceMs, isReady])

  // Calcular altura efectiva
  const effectiveHeight = typeof height === "number" 
    ? Math.max(height, minHeight) 
    : height

  // Skeleton de carga
  const Skeleton = () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse bg-white/5 rounded-lg w-full h-full" />
    </div>
  )

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
      ) : dimensions.width > minWidth && dimensions.height > minHeight ? (
        <ResponsiveContainer 
          width="100%" 
          height="100%"
          minWidth={minWidth}
          minHeight={minHeight}
          aspect={aspect}
          debounce={debounceMs}
        >
          {children}
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
