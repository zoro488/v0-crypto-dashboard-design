'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🔮 SPLINE COMPONENTS WRAPPER - INTEGRACIÓN DE ESCENAS SPLINE
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Componentes wrapper para las escenas Spline del proyecto
 * Con fallback elegante, lazy loading y control de eventos
 * 
 * Escenas disponibles:
 * - AI Voice Orb (asistente de voz)
 * - Fire Portal (portal Dr. Strange)
 * - Glass Buttons (botones de cristal)
 * - Particle Nebula (nebulosa de partículas)
 * - NexBot Robot (robot asistente)
 * - R4X Bot (robot cyberpunk)
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { 
  lazy, 
  Suspense, 
  useState, 
  useCallback, 
  memo,
  ReactNode,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Application } from '@splinetool/runtime'

// ════════════════════════════════════════════════════════════════════════════════════════
// LAZY LOAD SPLINE
// ════════════════════════════════════════════════════════════════════════════════════════
const Spline = lazy(() => import('@splinetool/react-spline'))

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════════════════
export interface SplineWrapperProps {
  /** URL de la escena Spline */
  scene: string
  /** Clase CSS adicional */
  className?: string
  /** Callback cuando la escena carga */
  onLoad?: (spline: Application) => void
  /** Fallback mientras carga */
  fallback?: ReactNode
  /** Mostrar loader por defecto */
  showLoader?: boolean
  /** Altura del contenedor */
  height?: string | number
  /** Ancho del contenedor */
  width?: string | number
  /** Deshabilitar interactividad */
  disabled?: boolean
}

// ════════════════════════════════════════════════════════════════════════════════════════
// LOADER PREMIUM
// ════════════════════════════════════════════════════════════════════════════════════════
const SplineLoader = memo(function SplineLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        className="relative"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        {/* Anillo exterior */}
        <div 
          className="w-16 h-16 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: '#8B00FF',
            borderRightColor: '#FFD700',
          }}
        />
        {/* Núcleo brillante */}
        <motion.div
          className="absolute inset-0 m-auto w-4 h-4 rounded-full"
          style={{ backgroundColor: '#FFD700' }}
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
          }}
        />
      </motion.div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// ERROR FALLBACK
// ════════════════════════════════════════════════════════════════════════════════════════
const SplineErrorFallback = memo(function SplineErrorFallback({
  message = 'No se pudo cargar la escena 3D'
}: { message?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="text-center p-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-600/20 to-amber-500/20 flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-amber-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        <p className="text-white/80 text-sm">{message}</p>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════
function SplineWrapper({
  scene,
  className = '',
  onLoad,
  fallback,
  showLoader = true,
  height = '100%',
  width = '100%',
  disabled = false,
}: SplineWrapperProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  
  const handleLoad = useCallback((splineApp: Application) => {
    setIsLoaded(true)
    setHasError(false)
    onLoad?.(splineApp)
  }, [onLoad])
  
  const handleError = useCallback(() => {
    setHasError(true)
    setIsLoaded(false)
  }, [])
  
  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ height, width }}
    >
      <Suspense fallback={fallback || (showLoader && <SplineLoader />)}>
        <AnimatePresence>
          {hasError ? (
            <SplineErrorFallback />
          ) : (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoaded ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <Spline
                scene={scene}
                onLoad={handleLoad}
                style={{ 
                  width: '100%', 
                  height: '100%',
                  pointerEvents: disabled ? 'none' : 'auto',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
      
      {/* Loader mientras carga */}
      {showLoader && !isLoaded && !hasError && <SplineLoader />}
    </div>
  )
}

export default memo(SplineWrapper)

// ════════════════════════════════════════════════════════════════════════════════════════
// ESCENAS PRE-CONFIGURADAS
// ════════════════════════════════════════════════════════════════════════════════════════

/** AI Voice Orb - Orbe de asistente de voz */
export const AIVoiceOrbSpline = memo(function AIVoiceOrbSpline(
  props: Omit<SplineWrapperProps, 'scene'>
) {
  return (
    <SplineWrapper
      {...props}
      scene="/spline/ai_voice_orb.splinecode"
    />
  )
})

/** Fire Portal - Portal estilo Dr. Strange */
export const FirePortalSpline = memo(function FirePortalSpline(
  props: Omit<SplineWrapperProps, 'scene'>
) {
  return (
    <SplineWrapper
      {...props}
      scene="https://prod.spline.design/NgWU8fD6towEaxnr/scene.splinecode"
    />
  )
})

/** Glass Buttons - Botones de cristal premium */
export const GlassButtonsSpline = memo(function GlassButtonsSpline(
  props: Omit<SplineWrapperProps, 'scene'>
) {
  return (
    <SplineWrapper
      {...props}
      scene="/spline/scene.splinecode"
    />
  )
})

/** Particle Nebula - Nebulosa de partículas */
export const ParticleNebulaSpline = memo(function ParticleNebulaSpline(
  props: Omit<SplineWrapperProps, 'scene'>
) {
  return (
    <SplineWrapper
      {...props}
      scene="/spline/particle_nebula.splinecode"
    />
  )
})

/** NexBot - Robot asistente */
export const NexBotSpline = memo(function NexBotSpline(
  props: Omit<SplineWrapperProps, 'scene'>
) {
  return (
    <SplineWrapper
      {...props}
      scene="https://prod.spline.design/eGbfbvp0WBojpcqu/scene.splinecode"
    />
  )
})

/** R4X Bot - Robot cyberpunk */
export const R4XBotSpline = memo(function R4XBotSpline(
  props: Omit<SplineWrapperProps, 'scene'>
) {
  return (
    <SplineWrapper
      {...props}
      scene="https://prod.spline.design/cZAGZ7v6TaqZrhFN/scene.splinecode"
    />
  )
})

/** 3D Dropdown - Menu desplegable 3D */
export const Dropdown3DSpline = memo(function Dropdown3DSpline(
  props: Omit<SplineWrapperProps, 'scene'>
) {
  return (
    <SplineWrapper
      {...props}
      scene="https://prod.spline.design/dH-4EV9KmcymGWUW/scene.splinecode"
    />
  )
})

/** Particle Animation on Logos */
export const ParticleLogoSpline = memo(function ParticleLogoSpline(
  props: Omit<SplineWrapperProps, 'scene'>
) {
  return (
    <SplineWrapper
      {...props}
      scene="https://prod.spline.design/OmWYX0apclMCltcg/scene.splinecode"
    />
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// EXPORTACIONES
// ════════════════════════════════════════════════════════════════════════════════════════
export { SplineLoader, SplineErrorFallback }
