'use client'

/**
 * 🎬 SPLASH SCREEN WRAPPER - WARP SINGULARITY EDITION
 * 
 * Experiencia cinematográfica de viaje en el tiempo con túnel de hipervelocidad
 * Shaders GLSL personalizados a 120fps con post-procesamiento avanzado
 */

import { useState, useEffect, ReactNode } from 'react'
import dynamic from 'next/dynamic'

// Carga dinámica para evitar SSR issues con Three.js
const WarpSingularity = dynamic(
  () => import('./WarpSingularity').then(mod => ({ default: mod.ChronosSingularityIntro })),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <div className="relative">
          {/* Warp loading animation */}
          <div className="w-32 h-32 rounded-full border-2 border-cyan-500/20 animate-ping absolute inset-0" />
          <div className="w-32 h-32 rounded-full border border-cyan-400/40 animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-cyan-400/70 text-xs tracking-[0.3em] font-light">
              WARP
            </span>
          </div>
        </div>
      </div>
    ),
  },
)

// Fallback para navegadores sin soporte WebGL
const ChronosParticles = dynamic(
  () => import('./ChronosParticles'),
  { ssr: false },
)

interface SplashScreenProps {
  children: ReactNode
  /** Duración del splash en ms (default: 6000 para warp experience) */
  duration?: number
  /** Si está habilitado (default: true) */
  enabled?: boolean
  /** Key para forzar mostrar splash de nuevo */
  forceShowKey?: string
  /** Usar experiencia Warp Singularity (default: true) */
  useWarp?: boolean
}

export default function SplashScreen({ 
  children, 
  duration = 6000,
  enabled = true,
  forceShowKey = 'chronos-warp-shown',
  useWarp = true,
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
    
    // Verificar si ya se mostró el splash en esta sesión
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
    // Pequeño delay para transición suave
    setTimeout(() => setIsReady(true), 100)
  }
  
  // Mientras carga, mostrar pantalla negra con efecto warp
  if (!isReady && !showSplash) {
    return (
      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]" />
      </div>
    )
  }
  
  // Determinar qué componente usar
  const SplashComponent = useWarp && webglSupported ? WarpSingularity : ChronosParticles
  
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
