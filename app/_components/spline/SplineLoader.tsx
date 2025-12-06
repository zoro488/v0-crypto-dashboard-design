'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — SPLINE LOADER
// Cargador dinámico de componentes Spline 3D
// ═══════════════════════════════════════════════════════════════

import { Suspense, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

// Lazy load Spline para evitar SSR issues
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => <SplineLoader />,
})

// ═══════════════════════════════════════════════════════════════
// AVAILABLE SPLINE SCENES
// ═══════════════════════════════════════════════════════════════

export const SPLINE_SCENES = {
  // AI Voice Orb
  aiVoiceOrb: '/spline/ai_voice_assistance_orb.spline',
  
  // Dropdown 3D
  dropdown3D: '/spline/3_d_drop_down.spline',
  
  // Glass Icons
  glassIcon: '/spline/frosted_glass_texture_icon.spline',
  
  // Glass Buttons
  glassButtons: '/spline/glass_buttons_inspired_by_reijo_palmiste.spline',
  
  // Nexbot Robot
  nexbotRobot: '/spline/nexbot_robot_character_concept.spline',
  
  // Particle Nebula
  particleNebula: '/spline/particle_nebula.spline',
  
  // Fire Portal (Dr Strange)
  firePortal: '/spline/fire_particle_loader_animation_dr_strange_porta.gltf',
  
  // Scene codes (splinecode format for web)
  scene1: '/spline/scene(1).splinecode',
  scene2: '/spline/scene(2).splinecode',
  scene3: '/spline/scene(3).splinecode',
  scene4: '/spline/scene(4).splinecode',
  scene5: '/spline/scene(5).splinecode',
  scene6: '/spline/scene(6).splinecode',
  scene7: '/spline/scene(7).splinecode',
  scene8: '/spline/scene(8).splinecode',
} as const

export type SplineSceneKey = keyof typeof SPLINE_SCENES

// ═══════════════════════════════════════════════════════════════
// LOADER COMPONENT
// ═══════════════════════════════════════════════════════════════

function SplineLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black/50">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="h-8 w-8 text-violet-500" />
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface SplineViewerProps {
  scene: SplineSceneKey | string
  className?: string
  onLoad?: () => void
  onError?: (error: Error) => void
  interactive?: boolean
}

export function SplineViewer({
  scene,
  className = '',
  onLoad,
  onError,
  interactive = true,
}: SplineViewerProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  
  // Get scene URL
  const sceneUrl = typeof scene === 'string' && scene.startsWith('/')
    ? scene
    : SPLINE_SCENES[scene as SplineSceneKey] || scene
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])
  
  const handleError = useCallback((error: Error) => {
    setHasError(true)
    onError?.(error)
    console.error('Spline load error:', error)
  }, [onError])

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-black/50 ${className}`}>
        <div className="text-center">
          <p className="text-sm text-red-400 mb-2">Error loading 3D scene</p>
          <button
            onClick={() => setHasError(false)}
            className="px-4 py-2 text-xs bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
          >
            <SplineLoader />
          </motion.div>
        )}
      </AnimatePresence>
      
      <Suspense fallback={<SplineLoader />}>
        <Spline
          scene={sceneUrl}
          onLoad={handleLoad}
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: interactive ? 'auto' : 'none',
          }}
        />
      </Suspense>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// AI VOICE ORB COMPONENT
// ═══════════════════════════════════════════════════════════════

interface AIVoiceOrbProps {
  isActive?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AIVoiceOrb({ isActive = false, size = 'md', className = '' }: AIVoiceOrbProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }
  
  return (
    <motion.div
      className={`relative ${sizeClasses[size]} ${className}`}
      animate={{
        scale: isActive ? [1, 1.1, 1] : 1,
      }}
      transition={{
        duration: 1.5,
        repeat: isActive ? Infinity : 0,
        ease: 'easeInOut',
      }}
    >
      <SplineViewer
        scene="aiVoiceOrb"
        className="w-full h-full"
        interactive={false}
      />
      
      {/* Glow effect when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full bg-violet-500/30 blur-xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE NEBULA BACKGROUND
// ═══════════════════════════════════════════════════════════════

interface ParticleNebulaProps {
  className?: string
  opacity?: number
}

export function ParticleNebula({ className = '', opacity = 0.5 }: ParticleNebulaProps) {
  return (
    <div 
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <SplineViewer
        scene="particleNebula"
        className="w-full h-full"
        interactive={false}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// GLASS BUTTON 3D
// ═══════════════════════════════════════════════════════════════

interface GlassButton3DProps {
  children?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function GlassButton3D({ children, onClick, className = '' }: GlassButton3DProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden ${className}`}
    >
      <SplineViewer
        scene="glassButtons"
        className="absolute inset-0 w-full h-full"
        interactive={false}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

export default SplineViewer
