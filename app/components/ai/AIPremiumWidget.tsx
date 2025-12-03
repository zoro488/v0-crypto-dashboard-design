'use client'

import React, { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'

// Cargar el orbe 3D de forma dinámica (solo cliente)
const AudioReactiveOrb = dynamic(
  () => import('@/app/components/3d/AudioReactiveOrb'),
  { ssr: false, loading: () => <OrbPlaceholder /> },
)

// Placeholder mientras carga el 3D
function OrbPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-900/50 to-purple-900/50 animate-pulse" />
    </div>
  )
}

// ==========================================
// TIPOS
// ==========================================
type WidgetState = 'idle' | 'listening' | 'processing' | 'responding'

interface AIPremiumWidgetProps {
  onTranscript?: (text: string) => void
  onStateChange?: (state: WidgetState) => void
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'center'
}

// ==========================================
// WIDGET PRINCIPAL
// ==========================================
export default function AIPremiumWidget({
  onTranscript,
  onStateChange,
  className = '',
  position = 'bottom-right',
}: AIPremiumWidgetProps) {
  const [state, setState] = useState<WidgetState>('idle')
  const [isExpanded, setIsExpanded] = useState(false)

  // Manejar cambio de estado
  const handleStateChange = useCallback((newState: WidgetState) => {
    setState(newState)
    onStateChange?.(newState)
  }, [onStateChange])

  // Toggle escucha
  const toggleListening = useCallback(() => {
    if (state === 'listening') {
      handleStateChange('processing')
      // Simular procesamiento
      setTimeout(() => {
        handleStateChange('idle')
        onTranscript?.('Transcripción de ejemplo...')
      }, 2000)
    } else {
      handleStateChange('listening')
    }
  }, [state, handleStateChange, onTranscript])

  // Posicionamiento
  const positionClasses = {
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'center': 'bottom-8 left-1/2 -translate-x-1/2',
  }

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 flex flex-col items-center ${className}`}
    >
      {/* Contenedor del Orbe 3D */}
      <motion.div
        className="relative pointer-events-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ 
          scale: isExpanded ? 1.2 : 1, 
          opacity: 1,
          width: isExpanded ? 400 : 280,
          height: isExpanded ? 400 : 280,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {/* Orbe 3D */}
        <div className="absolute inset-0">
          <AudioReactiveOrb 
            isListening={state === 'listening'} 
            state={state === 'responding' ? 'processing' : state}
          />
        </div>

        {/* Anillos decorativos */}
        <AnimatePresence>
          {state === 'listening' && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-cyan-500/30"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ 
                    scale: [1, 1.5 + i * 0.2], 
                    opacity: [0.5, 0], 
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.4,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Panel de Control */}
      <motion.div 
        className="mt-4 pointer-events-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className={`
          flex items-center gap-4 px-4 py-3 rounded-2xl
          backdrop-blur-xl border transition-all duration-500
          ${state === 'listening' 
            ? 'bg-black/70 border-cyan-500/50 shadow-[0_0_40px_rgba(34,211,238,0.25)]' 
            : state === 'processing'
            ? 'bg-black/70 border-amber-500/50 shadow-[0_0_40px_rgba(251,191,36,0.25)]'
            : 'bg-black/50 border-white/10 hover:bg-black/60 hover:border-white/20'
          }
        `}>
          
          {/* Botón Principal de Micrófono */}
          <motion.button 
            onClick={toggleListening}
            disabled={state === 'processing'}
            className={`
              relative w-14 h-14 rounded-full flex items-center justify-center
              text-white font-medium transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
              ${state === 'listening' 
                ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30' 
                : state === 'processing'
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                : 'bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500'
              }
            `}
            whileHover={{ scale: state !== 'processing' ? 1.05 : 1 }}
            whileTap={{ scale: state !== 'processing' ? 0.95 : 1 }}
          >
            {state === 'listening' ? (
              // Waveform animado
              <div className="flex gap-1 h-5 items-end">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1 bg-white rounded-full"
                    animate={{ 
                      height: ['40%', '100%', '60%', '100%', '40%'], 
                    }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.1,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            ) : state === 'processing' ? (
              // Spinner de procesamiento
              <motion.div 
                className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              // Icono de micrófono
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </motion.button>

          {/* Texto de Estado */}
          <div className="pr-2">
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-[0.2em] mb-1">
              {state === 'idle' && 'CHRONOS AI'}
              {state === 'listening' && 'ESCUCHANDO...'}
              {state === 'processing' && 'PROCESANDO...'}
              {state === 'responding' && 'RESPONDIENDO...'}
            </p>
            
            {/* Barra de actividad */}
            <div className="h-1 w-28 bg-white/10 rounded-full overflow-hidden">
              {state === 'listening' && (
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  animate={{ 
                    scaleX: [0.3, 1, 0.5, 0.8, 0.3],
                    opacity: [0.5, 1, 0.7, 1, 0.5],
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ transformOrigin: 'left' }}
                />
              )}
              {state === 'processing' && (
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 w-full"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              )}
            </div>
          </div>

          {/* Botón de Expandir */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 
                       flex items-center justify-center text-white/50 hover:text-white/80
                       transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              animate={{ rotate: isExpanded ? 180 : 0 }}
            >
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </motion.svg>
          </motion.button>
        </div>
      </motion.div>

      {/* Indicador de permisos */}
      <AnimatePresence>
        {state === 'listening' && (
          <motion.p
            className="mt-3 text-[10px] text-white/30 font-mono"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            🎤 Micrófono activo • Toca para detener
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
