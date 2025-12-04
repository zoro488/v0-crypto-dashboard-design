/**
 * 🎙️ VOICE ASSISTANT - Componente Premium de Asistente por Voz
 * 
 * Componente flotante para interacción por voz con AI:
 * - Activación por tecla o click
 * - Visualización de ondas de audio
 * - Transcripción en tiempo real
 * - Respuestas con TTS
 * - Diseño glassmorphism premium
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  X, 
  Minimize2,
  Maximize2,
  MessageSquare,
  Sparkles,
  Loader2,
  Settings,
  History,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useAI } from '@/app/lib/ai/useAI'
import { logger } from '@/app/lib/utils/logger'

// =====================================================================
// TIPOS
// =====================================================================

interface VoiceAssistantProps {
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  systemPrompt?: string
  voiceEnabled?: boolean
  shortcutKey?: string // Default: 'v'
  onMessage?: (message: string, response: string) => void
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking'

// =====================================================================
// ANIMACIONES
// =====================================================================

const containerVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    y: 20,
    transition: { duration: 0.2 }
  },
}

const pulseVariants = {
  idle: { scale: 1 },
  listening: {
    scale: [1, 1.1, 1],
    transition: { duration: 1.5, repeat: Infinity },
  },
  processing: {
    rotate: 360,
    transition: { duration: 2, repeat: Infinity, ease: 'linear' as const },
  },
}

// =====================================================================
// COMPONENTE DE ONDAS
// =====================================================================

function AudioWaves({ isActive, intensity = 0.5 }: { isActive: boolean; intensity?: number }) {
  const bars = 5
  
  return (
    <div className="flex items-center justify-center gap-0.5 h-6">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-full"
          animate={{
            height: isActive 
              ? [8, 16 + Math.random() * 8 * intensity, 8]
              : 4,
          }}
          transition={{
            duration: 0.3 + Math.random() * 0.2,
            repeat: isActive ? Infinity : 0,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  )
}

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================

export function VoiceAssistant({
  className,
  position = 'bottom-right',
  systemPrompt = 'Eres CHRONOS, un asistente financiero experto. Responde de forma concisa y útil en español.',
  voiceEnabled = true,
  shortcutKey = 'v',
  onMessage,
}: VoiceAssistantProps) {
  // Estado
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [state, setState] = useState<AssistantState>('idle')
  const [showHistory, setShowHistory] = useState(false)
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null)
  
  // AI Hook
  const ai = useAI({
    systemPrompt,
    autoSpeak: voiceEnabled,
    persistHistory: true,
    historyKey: 'voice_assistant_history',
    onMessageStart: () => setState('processing'),
    onMessageComplete: (response) => {
      setState(voiceEnabled ? 'speaking' : 'idle')
      
      // Obtener último mensaje del usuario
      const lastUserMsg = ai.messages.filter(m => m.role === 'user').pop()
      if (lastUserMsg) {
        onMessage?.(lastUserMsg.content, response)
      }
    },
  })

  // Actualizar estado basado en ai
  useEffect(() => {
    if (ai.isListening) setState('listening')
    else if (ai.isLoading) setState('processing')
    else if (ai.isSpeaking) setState('speaking')
    else setState('idle')
  }, [ai.isListening, ai.isLoading, ai.isSpeaking])

  // ─────────────────────────────────────────────────────────────────────
  // SHORTCUTS
  // ─────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Key para abrir
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === shortcutKey) {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      
      // Escape para cerrar
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
      
      // Space para toggle voz cuando está abierto
      if (e.key === ' ' && isOpen && document.activeElement !== inputRef.current) {
        e.preventDefault()
        handleVoiceToggle()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, shortcutKey])

  // ─────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────
  
  const handleVoiceToggle = useCallback(async () => {
    if (ai.isListening) {
      await ai.stopVoiceChat()
    } else {
      await ai.startVoiceChat()
    }
  }, [ai])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('message') as HTMLInputElement
    const message = input?.value.trim()
    
    if (message) {
      input.value = ''
      await ai.streamMessage(message)
    }
  }, [ai])

  const handleStopSpeaking = useCallback(() => {
    ai.stopGeneration()
    setState('idle')
  }, [ai])

  // ─────────────────────────────────────────────────────────────────────
  // POSICIÓN
  // ─────────────────────────────────────────────────────────────────────
  
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────
  
  return (
    <>
      {/* Botón flotante */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed z-50 p-4 rounded-full',
          'bg-gradient-to-br from-cyan-500 to-blue-600',
          'shadow-lg shadow-cyan-500/25',
          'hover:shadow-xl hover:shadow-cyan-500/30',
          'transition-shadow duration-300',
          positionClasses[position],
          isOpen && 'hidden',
          className,
        )}
        title={`Asistente de voz (${shortcutKey.toUpperCase()})`}
      >
        <Mic className="w-6 h-6 text-white" />
        
        {/* Indicador de estado */}
        {state !== 'idle' && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}
      </motion.button>

      {/* Panel del asistente */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed z-50',
              positionClasses[position],
              isExpanded ? 'w-96 h-[500px]' : 'w-80 h-auto',
            )}
          >
            {/* Contenedor principal */}
            <div className={cn(
              'relative rounded-2xl overflow-hidden',
              'bg-black/80 backdrop-blur-xl',
              'border border-white/10',
              'shadow-2xl shadow-black/50',
            )}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <motion.div
                    variants={pulseVariants}
                    animate={state}
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      'bg-gradient-to-br from-cyan-500 to-blue-600',
                    )}
                  >
                    {state === 'processing' ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-white" />
                    )}
                  </motion.div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">CHRONOS</h3>
                    <p className="text-xs text-white/60">
                      {state === 'idle' && 'Listo para ayudar'}
                      {state === 'listening' && 'Escuchando...'}
                      {state === 'processing' && 'Pensando...'}
                      {state === 'speaking' && 'Hablando...'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Historial"
                  >
                    <History className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title={isExpanded ? 'Minimizar' : 'Expandir'}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-4 h-4 text-white/60" />
                    ) : (
                      <Maximize2 className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Cerrar"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </div>

              {/* Contenido expandido - Historial */}
              <AnimatePresence>
                {isExpanded && showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="max-h-64 overflow-y-auto p-4 space-y-3 border-b border-white/10"
                  >
                    {ai.messages.length === 0 ? (
                      <p className="text-center text-white/40 text-sm py-4">
                        Sin mensajes aún
                      </p>
                    ) : (
                      ai.messages.slice(-10).map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'p-3 rounded-xl text-sm',
                            msg.role === 'user' 
                              ? 'bg-cyan-500/20 text-cyan-100 ml-8'
                              : 'bg-white/5 text-white/80 mr-8',
                          )}
                        >
                          {msg.content}
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Área de visualización de voz */}
              <div className="p-6 flex flex-col items-center justify-center">
                {/* Ondas de audio */}
                <div className="mb-4">
                  <AudioWaves 
                    isActive={state === 'listening' || state === 'speaking'} 
                    intensity={state === 'speaking' ? 0.8 : 0.5}
                  />
                </div>

                {/* Transcripción en vivo */}
                <AnimatePresence>
                  {ai.isListening && (ai as { transcript?: string }).transcript && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 px-4 py-2 bg-white/5 rounded-lg max-w-full"
                    >
                      <p className="text-sm text-white/80 text-center truncate">
                        "{(ai as { transcript?: string }).transcript}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botón principal de voz */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={state === 'speaking' ? handleStopSpeaking : handleVoiceToggle}
                  disabled={state === 'processing'}
                  className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center',
                    'transition-all duration-300',
                    state === 'idle' && 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/30',
                    state === 'listening' && 'bg-red-500 animate-pulse',
                    state === 'processing' && 'bg-yellow-500/50 cursor-wait',
                    state === 'speaking' && 'bg-green-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {state === 'idle' && <Mic className="w-7 h-7 text-white" />}
                  {state === 'listening' && <MicOff className="w-7 h-7 text-white" />}
                  {state === 'processing' && <Loader2 className="w-7 h-7 text-white animate-spin" />}
                  {state === 'speaking' && <VolumeX className="w-7 h-7 text-white" />}
                </motion.button>

                {/* Instrucciones */}
                <p className="mt-4 text-xs text-white/40 text-center">
                  {state === 'idle' && 'Presiona para hablar o escribe abajo'}
                  {state === 'listening' && 'Habla ahora... presiona para detener'}
                  {state === 'processing' && 'Procesando tu mensaje...'}
                  {state === 'speaking' && 'Presiona para detener'}
                </p>
              </div>

              {/* Input de texto */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    name="message"
                    type="text"
                    placeholder="Escribe un mensaje..."
                    disabled={state === 'processing' || state === 'listening'}
                    className={cn(
                      'flex-1 px-4 py-2 rounded-xl',
                      'bg-white/5 border border-white/10',
                      'text-white placeholder-white/30',
                      'focus:outline-none focus:border-cyan-500/50',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                  />
                  <button
                    type="submit"
                    disabled={state === 'processing' || state === 'listening'}
                    className={cn(
                      'px-4 py-2 rounded-xl',
                      'bg-gradient-to-r from-cyan-500 to-blue-600',
                      'text-white font-medium',
                      'hover:opacity-90 transition-opacity',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Shortcut hint */}
              <div className="px-4 pb-3 flex justify-center">
                <span className="text-xs text-white/30">
                  Ctrl+{shortcutKey.toUpperCase()} para abrir/cerrar • Espacio para voz
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default VoiceAssistant
