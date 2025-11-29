'use client'

/**
 * 🎬 SPLASH SCREEN WRAPPER
 * 
 * Componente que maneja el splash screen con las partículas CHRONOS
 * y la transición al contenido principal de la aplicación.
 */

import { useState, useEffect, ReactNode } from 'react'
import dynamic from 'next/dynamic'

// Carga dinámica para evitar SSR issues con Three.js
const ChronosParticles = dynamic(
  () => import('./ChronosParticles'),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <div className="text-cyan-400/50 text-sm tracking-widest animate-pulse">
          LOADING...
        </div>
      </div>
    ),
  },
)

interface SplashScreenProps {
  children: ReactNode
  /** Duración del splash en ms (default: 5500) */
  duration?: number
  /** Si está habilitado (default: true) */
  enabled?: boolean
  /** Key para forzar mostrar splash de nuevo */
  forceShowKey?: string
}

export default function SplashScreen({ 
  children, 
  duration = 5500,
  enabled = true,
  forceShowKey = 'chronos-splash-shown',
}: SplashScreenProps) {
  const [showSplash, setShowSplash] = useState(false)
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
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
  
  // Mientras carga, mostrar pantalla negra
  if (!isReady && !showSplash) {
    return (
      <div className="fixed inset-0 bg-black" />
    )
  }
  
  return (
    <>
      {showSplash && (
        <ChronosParticles 
          onComplete={handleSplashComplete}
          duration={duration}
        />
      )}
      
      {isReady && children}
    </>
  )
}
