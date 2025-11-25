"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Spline from "@splinetool/react-spline"
import type { Application, SplineEvent } from "@splinetool/runtime"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"

type BotState = 'idle' | 'listening' | 'speaking' | 'thinking'

interface SplineBot3DProps {
  state?: BotState
  isListening?: boolean
  isSpeaking?: boolean
  className?: string
  onLoad?: () => void
  onInteraction?: (objectName: string) => void
}

export function SplineBot3D({ 
  state = 'idle',
  isListening = false, 
  isSpeaking = false, 
  className = "",
  onLoad,
  onInteraction
}: SplineBot3DProps) {
  const splineRef = useRef<Application | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentState, setCurrentState] = useState<BotState>(state)

  // URL de la escena Spline del bot 3D (R_4_X_Bot)
  const sceneUrl = "https://prod.spline.design/cZAGZ7v6TaqZrhFN/scene.splinecode"

  useEffect(() => {
    // Determinar estado basado en props
    if (isSpeaking) {
      setCurrentState('speaking')
    } else if (isListening) {
      setCurrentState('listening')
    } else {
      setCurrentState(state)
    }
  }, [state, isListening, isSpeaking])

  useEffect(() => {
    if (splineRef.current && isLoaded) {
      updateBotState(currentState)
    }
  }, [currentState, isLoaded])

  const updateBotState = (newState: BotState) => {
    if (!splineRef.current) return

    try {
      // Emitir eventos a Spline según el estado
      switch (newState) {
        case 'idle':
          splineRef.current.emitEvent('keyDown', 'idle')
          break
        case 'listening':
          splineRef.current.emitEvent('keyDown', 'listening')
          break
        case 'speaking':
          splineRef.current.emitEvent('keyDown', 'speaking')
          break
        case 'thinking':
          splineRef.current.emitEvent('keyDown', 'thinking')
          break
      }
    } catch (error) {
      // Animación Spline no disponible (escena aún cargando)
    }
  }

  const handleLoad = (spline: Application) => {
    splineRef.current = spline
    setIsLoaded(true)
    
    // Setup event listeners for interactions
    try {
      spline.addEventListener('mouseDown', (event: SplineEvent) => {
        if (event.target?.name) {
          onInteraction?.(event.target.name)
        }
      })
    } catch (error) {
      // Event listener Spline no disponible
    }
    
    onLoad?.()
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
              <p className="text-sm text-white/60">Cargando IA 3D...</p>
            </div>
          </div>
        }
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.9 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full"
        >
          <Spline
            scene={sceneUrl}
            onLoad={handleLoad}
            className="w-full h-full"
          />
        </motion.div>
      </Suspense>

      {/* Status indicator overlay */}
      <AnimatePresence>
        {currentState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
          >
            <div className={`px-6 py-3 rounded-full backdrop-blur-xl border shadow-2xl ${
              currentState === 'listening' ? 'bg-green-500/20 border-green-500/30' :
              currentState === 'speaking' ? 'bg-blue-500/20 border-blue-500/30' :
              'bg-purple-500/20 border-purple-500/30'
            }`}>
              <div className="flex items-center gap-3">
                {currentState === 'listening' && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-white text-sm font-medium">🎤 Escuchando...</p>
                  </>
                )}
                {currentState === 'speaking' && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-white text-sm font-medium">🔊 Hablando...</p>
                  </>
                )}
                {currentState === 'thinking' && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <p className="text-white text-sm font-medium">🧠 Pensando...</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Hook para controlar el bot 3D desde cualquier componente
export function useSplineBot() {
  const [state, setState] = useState<BotState>('idle')
  const [isInteracting, setIsInteracting] = useState(false)

  const setIdle = () => {
    setState('idle')
    setIsInteracting(false)
  }

  const setListening = () => {
    setState('listening')
    setIsInteracting(true)
  }

  const setSpeaking = () => {
    setState('speaking')
    setIsInteracting(true)
  }

  const setThinking = () => {
    setState('thinking')
    setIsInteracting(true)
  }

  const simulateConversation = async (duration: number = 3000) => {
    setListening()
    await new Promise(resolve => setTimeout(resolve, duration))
    
    setThinking()
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setSpeaking()
    await new Promise(resolve => setTimeout(resolve, duration))
    
    setIdle()
  }

  return {
    state,
    isInteracting,
    setIdle,
    setListening,
    setSpeaking,
    setThinking,
    simulateConversation,
  }
}
