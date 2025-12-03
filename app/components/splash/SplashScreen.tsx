'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎬 SPLASH SCREEN WRAPPER - PREMIUM EDITION 2026
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Experiencia cinematográfica ultra-premium con:
 * - Logo CHRONOS animado con efectos 3D
 * - Partículas flotantes GPU-accelerated
 * - Transiciones suaves estilo Apple
 * - Fallbacks inteligentes según capacidades del dispositivo
 * 
 * Tipos disponibles:
 * - 'premium': Nuevo diseño 2026 con logo animado (recomendado)
 * - 'ultra': Versión con imagen del logo
 * - 'warp': Efecto singularidad con efecto warping
 * - 'particles': Partículas 3D formando texto
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, ReactNode } from 'react'
import dynamic from 'next/dynamic'

// 🌟 NUEVO: Splash Premium 2026 con logo animado y efectos premium
const ChronosSplashPremium = dynamic(
  () => import('./ChronosSplashPremium'),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <div className="relative">
          {/* Logo contenedor animado */}
          <div className="w-24 h-24 rounded-3xl border border-cyan-500/30 animate-pulse bg-gradient-to-br from-cyan-500/10 to-purple-500/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-cyan-400/80 text-2xl font-bold tracking-[0.2em]">
                C
              </span>
              <div className="mt-2 flex gap-1 justify-center">
                <div className="w-1 h-1 rounded-full bg-cyan-400/60 animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-purple-400/60 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-1 rounded-full bg-pink-400/60 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
)

// Carga dinámica - Splash Ultra con imagen
const ChronosSplashUltra = dynamic(
  () => import('./ChronosSplashUltra'),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl border border-cyan-500/30 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-cyan-400/70 text-xs tracking-[0.2em] font-light">
              C
            </span>
          </div>
        </div>
      </div>
    ),
  },
)

// Fallback: Warp Singularity
const WarpSingularity = dynamic(
  () => import('./WarpSingularity').then(mod => ({ default: mod.ChronosSingularityIntro })),
  { ssr: false },
)

// Fallback: Partículas clásicas
const ChronosParticles = dynamic(
  () => import('./ChronosParticles'),
  { ssr: false },
)

type SplashType = 'premium' | 'ultra' | 'warp' | 'particles'

interface SplashScreenProps {
  children: ReactNode
  /** Duración del splash en ms (default: 4500) */
  duration?: number
  /** Si está habilitado (default: true) */
  enabled?: boolean
  /** Key para forzar mostrar splash de nuevo */
  forceShowKey?: string
  /** Tipo de splash: 'premium' (2026), 'ultra', 'warp', 'particles' */
  type?: SplashType
}

export function SplashScreen({ 
  children, 
  duration = 4500,
  enabled = true,
  forceShowKey = 'chronos-splash-shown-v4',
  type = 'premium', // 🌟 Nuevo default: Premium 2026
}: SplashScreenProps) {
  const [showSplash, setShowSplash] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [webglSupported, setWebglSupported] = useState(true)
  
  useEffect(() => {
    // Verificar soporte WebGL
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      setWebglSupported(!!gl)
    } catch {
      setWebglSupported(false)
    }
    
    if (!enabled) {
      setIsReady(true)
      return
    }
    
    const hasShown = sessionStorage.getItem(forceShowKey)
    
    if (!hasShown) {
      setShowSplash(true)
    } else {
      setIsReady(true)
    }
  }, [enabled, forceShowKey])
  
  const handleSplashComplete = () => {
    sessionStorage.setItem(forceShowKey, 'true')
    setShowSplash(false)
    setTimeout(() => setIsReady(true), 100)
  }
  
  if (!isReady && !showSplash) {
    return (
      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,245,255,0.05)_0%,transparent_70%)]" />
      </div>
    )
  }
  
  // Seleccionar componente de splash
  const getSplashComponent = () => {
    if (!webglSupported) {
      // Fallback simple sin WebGL - usar Premium que no requiere WebGL
      return ChronosSplashPremium
    }
    
    switch (type) {
      case 'premium':
        return ChronosSplashPremium
      case 'warp':
        return WarpSingularity
      case 'particles':
        return ChronosParticles
      case 'ultra':
      default:
        return ChronosSplashUltra
    }
  }
  
  const SplashComponent = getSplashComponent()
  
  return (
    <>
      {showSplash && (
        <SplashComponent 
          onComplete={handleSplashComplete}
          duration={duration}
        />
      )}
      
      {isReady && children}
    </>
  )
}

export default SplashScreen
