'use client'

import { Suspense, lazy, useState, useEffect, memo, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { logger } from '@/app/lib/utils/logger'

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export type Component3DType = 
  | 'PremiumSplineOrb' 
  | 'AnalyticsGlobe3D' 
  | 'WorkflowVisualizer3D'
  | 'SingularityLogo'
  | 'AIAgentScene'
  | 'NavIcons3D'

interface Panel3DWrapperProps {
  /** Tipo de componente 3D a renderizar */
  componentType: Component3DType
  /** Componente fallback a mostrar si 3D falla */
  fallback?: ReactNode
  /** Altura del contenedor */
  height?: string | number
  /** Clases adicionales */
  className?: string
  /** Props adicionales para el componente 3D */
  componentProps?: Record<string, unknown>
  /** Si es true, muestra indicador de carga mientras se carga el 3D */
  showLoadingIndicator?: boolean
  /** Desactivar 3D y mostrar solo fallback */
  disable3D?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAZY IMPORTS
// ═══════════════════════════════════════════════════════════════════════════════

const PremiumSplineOrb = lazy(() => 
  import('@/app/components/3d/PremiumSplineOrb').then(m => ({ default: m.PremiumSplineOrb }))
)

const AnalyticsGlobe3D = lazy(() => 
  import('@/app/components/3d/AnalyticsGlobe3D').then(m => ({ default: m.AnalyticsGlobe3D }))
)

const WorkflowVisualizer3D = lazy(() => 
  import('@/app/components/3d/WorkflowVisualizer3D').then(m => ({ default: m.WorkflowVisualizer3D }))
)

const SingularityLogo = lazy(() => 
  import('@/app/components/3d/SingularityLogo').then(m => ({ default: m.SingularityLogo }))
)

const AIAgentScene = lazy(() => 
  import('@/app/components/3d/AIAgentScene').then(m => ({ default: m.AIAgentScene }))
)

const NavIcons3D = lazy(() => 
  import('@/app/components/3d/NavIcons3D').then(m => ({ default: m.NavIcons3D }))
)

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE CARGA
// ═══════════════════════════════════════════════════════════════════════════════

const LoadingState = memo(function LoadingState() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-cyan-500/10"
    >
      <div className="flex flex-col items-center gap-3">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1, repeat: Infinity },
          }}
        >
          <Sparkles className="w-8 h-8 text-cyan-400" />
        </motion.div>
        <span className="text-sm text-cyan-400/70">Cargando 3D...</span>
      </div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE ERROR
// ═══════════════════════════════════════════════════════════════════════════════

const ErrorState = memo(function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-500/5 to-orange-500/5"
    >
      <div className="flex flex-col items-center gap-3 text-center px-4">
        <AlertCircle className="w-8 h-8 text-orange-400" />
        <span className="text-sm text-gray-400">3D no disponible</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline"
          >
            Reintentar
          </button>
        )}
      </div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Panel3DWrapper - Wrapper para integrar componentes 3D en paneles Bento
 * 
 * @example
 * ```tsx
 * <Panel3DWrapper
 *   componentType="PremiumSplineOrb"
 *   fallback={<MyFallbackComponent />}
 *   height="200px"
 * />
 * ```
 */
export const Panel3DWrapper = memo(function Panel3DWrapper({
  componentType,
  fallback,
  height = '200px',
  className = '',
  componentProps = {},
  showLoadingIndicator = true,
  disable3D = false,
}: Panel3DWrapperProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Reset error state on retry
  useEffect(() => {
    if (retryCount > 0) {
      setHasError(false)
      setIsLoaded(false)
    }
  }, [retryCount])

  // Handler para errores de carga
  const handleError = (error: Error) => {
    logger.error('Error cargando componente 3D', error, {
      context: 'Panel3DWrapper',
      data: { componentType },
    })
    setHasError(true)
  }

  // Si está desactivado, mostrar fallback directamente
  if (disable3D) {
    return (
      <div 
        className={`relative overflow-hidden ${className}`} 
        style={{ height }}
      >
        {fallback}
      </div>
    )
  }

  // Si hay error y tenemos fallback, mostrar fallback
  if (hasError && fallback) {
    return (
      <div 
        className={`relative overflow-hidden ${className}`} 
        style={{ height }}
      >
        {fallback}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setRetryCount(c => c + 1)}
            className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-md hover:bg-cyan-500/30 transition-colors"
          >
            Cargar 3D
          </button>
        </div>
      </div>
    )
  }

  // Si hay error sin fallback
  if (hasError && !fallback) {
    return (
      <div 
        className={`relative overflow-hidden ${className}`} 
        style={{ height }}
      >
        <ErrorState onRetry={() => setRetryCount(c => c + 1)} />
      </div>
    )
  }

  // Renderizar el componente 3D correspondiente
  const render3DComponent = () => {
    switch (componentType) {
      case 'PremiumSplineOrb':
        return <PremiumSplineOrb />
      case 'AnalyticsGlobe3D':
        // Crear data points por defecto si no hay props
        const defaultDataPoints = [
          { id: '1', country: 'México', city: 'CDMX', value: 100, lat: 19.4326, lng: -99.1332, type: 'venta' as const },
          { id: '2', country: 'México', city: 'Monterrey', value: 80, lat: 25.6866, lng: -100.3161, type: 'cliente' as const },
        ]
        return <AnalyticsGlobe3D data={defaultDataPoints} />
      case 'WorkflowVisualizer3D':
        // Crear nodos por defecto con estructura correcta
        const defaultNodes = [
          { id: 'n1', name: 'Inicio', type: 'start' as const, status: 'completed' as const, position: { x: 0, y: 0 } },
          { id: 'n2', name: 'Proceso', type: 'process' as const, status: 'active' as const, position: { x: 200, y: 0 } },
        ]
        const defaultConnections = [{ from: 'n1', to: 'n2' }]
        return <WorkflowVisualizer3D nodes={defaultNodes} connections={defaultConnections} />
      case 'SingularityLogo':
        return <SingularityLogo />
      case 'AIAgentScene':
        return <AIAgentScene />
      case 'NavIcons3D':
        return <NavIcons3D section="dashboard" />
      default:
        logger.warn('Tipo de componente 3D no reconocido', { data: { componentType } })
        return fallback || null
    }
  }

  return (
    <div 
      className={`relative overflow-hidden ${className}`} 
      style={{ height }}
    >
      <AnimatePresence mode="wait">
        {showLoadingIndicator && !isLoaded && <LoadingState key="loading" />}
      </AnimatePresence>
      
      <Suspense fallback={showLoadingIndicator ? <LoadingState /> : null}>
        <ErrorBoundary 
          fallback={fallback || <ErrorState onRetry={() => setRetryCount(c => c + 1)} />}
          onError={handleError}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0.3 }}
            className="absolute inset-0"
          >
            {render3DComponent()}
          </motion.div>
        </ErrorBoundary>
      </Suspense>
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
  onError?: (error: Error) => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught error', error, {
      context: 'Panel3DWrapper.ErrorBoundary',
      data: { componentStack: errorInfo.componentStack },
    })
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESETS DE PANELES
// ═══════════════════════════════════════════════════════════════════════════════

/** Preset para panel de Dashboard */
export const Dashboard3DPreset = memo(function Dashboard3DPreset({ 
  fallback 
}: { 
  fallback?: ReactNode 
}) {
  return (
    <Panel3DWrapper
      componentType="PremiumSplineOrb"
      fallback={fallback}
      height="100%"
      className="rounded-xl"
    />
  )
})

/** Preset para panel de Analytics */
export const Analytics3DPreset = memo(function Analytics3DPreset({ 
  fallback,
  dataPoints = [],
}: { 
  fallback?: ReactNode
  dataPoints?: Array<{ lat: number; lng: number; value: number; label?: string }>
}) {
  return (
    <Panel3DWrapper
      componentType="AnalyticsGlobe3D"
      fallback={fallback}
      height="300px"
      className="rounded-xl"
      componentProps={{ dataPoints }}
    />
  )
})

/** Preset para panel de Workflows */
export const Workflow3DPreset = memo(function Workflow3DPreset({ 
  fallback,
  nodes = [],
  connections = [],
}: { 
  fallback?: ReactNode
  nodes?: Array<{ id: string; label: string; type: string; position: [number, number, number] }>
  connections?: Array<{ from: string; to: string }>
}) {
  return (
    <Panel3DWrapper
      componentType="WorkflowVisualizer3D"
      fallback={fallback}
      height="250px"
      className="rounded-xl"
      componentProps={{ nodes, connections }}
    />
  )
})

/** Preset para panel de IA */
export const AI3DPreset = memo(function AI3DPreset({ 
  fallback 
}: { 
  fallback?: ReactNode 
}) {
  return (
    <Panel3DWrapper
      componentType="AIAgentScene"
      fallback={fallback}
      height="200px"
      className="rounded-xl"
    />
  )
})

export default Panel3DWrapper
