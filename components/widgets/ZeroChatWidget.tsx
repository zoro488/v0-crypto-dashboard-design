/**
 * 💬 ZERO CHAT WIDGET - Widget Conversacional Flotante Premium
 * 
 * El widget definitivo de ZERO FORCE: OVERDRIVE
 * 
 * Características:
 * - Avatar 3D con ojos rojos rasgados que reaccionan a la voz
 * - Post-processing cinematográfico en el fondo
 * - Reconocimiento de voz en tiempo real
 * - Interfaz de vidrio esmerilado oscuro
 * - Animaciones fluidas con Framer Motion
 * - Integración con IA para comandos de voz
 * - Modo compacto (botón) y expandido (chat completo)
 */

'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Mic,
  MicOff,
  Send,
  X,
  Maximize2,
  Minimize2,
  Terminal,
  ShieldAlert,
  Zap,
  Volume2,
  VolumeX,
  Settings,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRealtimeVoice } from '@/app/hooks/useRealtimeVoice'
import { useToast } from '@/app/hooks/use-toast'
import ZeroAvatar from '@/components/3d/ZeroAvatar'

// ============================================
// TIPOS
// ============================================

type ZeroMode = 'idle' | 'listening' | 'processing' | 'speaking' | 'combat' | 'success'

interface Message {
  id: string
  role: 'user' | 'zero' | 'system'
  content: string
  timestamp: Date
  type?: 'text' | 'command' | 'alert' | 'success'
}

interface ZeroChatWidgetProps {
  /** Posición inicial del widget */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Si el widget inicia expandido */
  defaultExpanded?: boolean
  /** Callback cuando Zero ejecuta un comando */
  onCommand?: (command: string, data: unknown) => void
  /** Si el sonido está habilitado */
  soundEnabled?: boolean
}

// ============================================
// CONSTANTES
// ============================================

const POSITION_CLASSES = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'zero',
    content: 'ZERO FORCE en línea. Sistemas tácticos listos.',
    timestamp: new Date(),
    type: 'success',
  },
]

// ============================================
// COMPONENTE MINI-CANVAS (Botón flotante)
// ============================================

function MiniZeroCanvas({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: false }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4], fov: 50 }}
    >
      <ambientLight intensity={0.8} />
      <pointLight position={[2, 2, 2]} intensity={2} color="#ff0000" />
      
      <Suspense fallback={null}>
        <ZeroAvatar
          isSpeaking={isSpeaking}
          isProcessing={false}
          isCombat={false}
          scale={0.8}
          showStatus={false}
        />
      </Suspense>
      
      <EffectComposer disableNormalPass>
        <Bloom
          luminanceThreshold={0.3}
          intensity={2}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  )
}

// ============================================
// COMPONENTE CHAT CANVAS (Expandido)
// ============================================

function ChatZeroCanvas({
  mode,
  isSpeaking,
  isProcessing,
}: {
  mode: ZeroMode
  isSpeaking: boolean
  isProcessing: boolean
}) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 50 }}
    >
      {/* Iluminación */}
      <ambientLight intensity={0.4} />
      <spotLight
        position={[5, 5, 5]}
        angle={0.5}
        penumbra={1}
        intensity={mode === 'combat' ? 3 : 1.5}
        color={mode === 'combat' ? '#ff0000' : '#ff3333'}
      />
      <pointLight
        position={[-3, 2, 2]}
        intensity={1}
        color="#330000"
      />

      {/* Avatar */}
      <Suspense fallback={null}>
        <ZeroAvatar
          isSpeaking={isSpeaking}
          isProcessing={isProcessing}
          isCombat={mode === 'combat'}
          scale={1.2}
          showStatus={false}
        />
      </Suspense>

      {/* Post-processing */}
      <EffectComposer disableNormalPass>
        <Bloom
          luminanceThreshold={0.2}
          intensity={2.5}
          mipmapBlur
          radius={0.4}
        />
        <Noise opacity={0.08} blendFunction={BlendFunction.OVERLAY} />
        <ChromaticAberration
          offset={new THREE.Vector2(0.001, 0.001)}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </Canvas>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ZeroChatWidget({
  position = 'bottom-right',
  defaultExpanded = false,
  onCommand,
  soundEnabled = true,
}: ZeroChatWidgetProps) {
  // ===== ESTADO =====
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [mode, setMode] = useState<ZeroMode>('idle')
  const [isMuted, setIsMuted] = useState(!soundEnabled)
  
  // Referencias
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Hooks
  const { toast } = useToast()
  
  // Hook de voz
  const {
    isListening,
    isProcessing: voiceProcessing,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    isSupported,
  } = useRealtimeVoice({
    mode: 'general',
    onTranscript: (text) => {
      // Cuando se detecta una transcripción final
      handleSendMessage(text)
    },
    onResult: (result) => {
      // Cuando la IA procesa el resultado
      if (result.success && result.data) {
        handleAIResponse(result.data as { tipo?: string; resumen?: string })
      }
    },
  })

  // ===== EFECTOS =====
  
  // Auto-scroll a mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Actualizar modo según estado de voz
  useEffect(() => {
    if (isListening) {
      setMode('listening')
    } else if (voiceProcessing) {
      setMode('processing')
    } else {
      setMode('idle')
    }
  }, [isListening, voiceProcessing])

  // ===== HANDLERS =====

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newMessage])
  }, [])

  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim()) return

    // Agregar mensaje del usuario
    addMessage({
      role: 'user',
      content: text,
      type: 'text',
    })

    setInput('')
    setMode('processing')

    // Detectar comandos especiales
    const lowerText = text.toLowerCase()

    if (lowerText.includes('amenaza') || lowerText.includes('error') || lowerText.includes('atacar')) {
      setMode('combat')
      addMessage({
        role: 'zero',
        content: '⚠️ ALERTA: Amenaza detectada. Activando protocolo de defensa.',
        type: 'alert',
      })
      setTimeout(() => setMode('idle'), 4000)
      return
    }

    if (lowerText.includes('exportar') || lowerText.includes('descargar') || lowerText.includes('reporte')) {
      setMode('success')
      addMessage({
        role: 'zero',
        content: '📊 Generando reporte... Objetivo adquirido.',
        type: 'success',
      })
      onCommand?.('export', { type: 'report' })
      setTimeout(() => setMode('idle'), 3000)
      return
    }

    // Respuesta genérica de Zero
    setTimeout(() => {
      setMode('speaking')
      addMessage({
        role: 'zero',
        content: `Comando recibido: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}". Procesando solicitud.`,
        type: 'text',
      })
      setTimeout(() => setMode('idle'), 2000)
    }, 1000)
  }, [addMessage, onCommand])

  const handleAIResponse = useCallback((data: { tipo?: string; resumen?: string }) => {
    if (data.tipo === 'nueva_venta') {
      setMode('success')
      addMessage({
        role: 'zero',
        content: `✅ Venta detectada: ${data.resumen || 'Procesando...'}`,
        type: 'success',
      })
      onCommand?.('venta', data)
    } else if (data.tipo === 'nueva_orden_compra') {
      addMessage({
        role: 'zero',
        content: `📦 Orden de compra: ${data.resumen || 'Procesando...'}`,
        type: 'success',
      })
      onCommand?.('orden_compra', data)
    }
    
    setTimeout(() => setMode('idle'), 2000)
  }, [addMessage, onCommand])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(input)
    }
  }

  const handleVoiceToggle = () => {
    if (!isSupported) {
      toast({
        title: 'Voz no soportada',
        description: 'Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.',
        variant: 'destructive',
      })
      return
    }
    toggleListening()
  }

  // ===== RENDER =====

  return (
    <div className={`fixed ${POSITION_CLASSES[position]} z-50 flex flex-col items-end`}>
      
      {/* ===== VENTANA DE CHAT EXPANDIDA ===== */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mb-4 w-[380px] h-[550px] flex flex-col relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,0,0,0.9) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 0, 0, 0.2)',
              borderRadius: '24px',
              boxShadow: `
                0 0 60px rgba(255, 0, 0, 0.15),
                0 25px 50px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `,
            }}
          >
            
            {/* FONDO 3D */}
            <div className="absolute inset-0 z-0 h-[45%]">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 z-10" />
              <ChatZeroCanvas
                mode={mode}
                isSpeaking={mode === 'speaking'}
                isProcessing={mode === 'processing'}
              />
            </div>

            {/* HEADER */}
            <div className="relative z-10 p-4 flex justify-between items-center border-b border-red-900/30">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Terminal className="w-5 h-5 text-red-500" />
                  <span
                    className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                      mode === 'combat' ? 'bg-red-500 animate-ping' :
                      mode === 'listening' ? 'bg-green-500 animate-pulse' :
                      mode === 'processing' ? 'bg-yellow-500 animate-pulse' :
                      'bg-red-600'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-widest">ZERO FORCE</h3>
                  <p className="text-[10px] text-red-400/60 font-mono tracking-wider">
                    {mode === 'listening' ? 'ESCUCHANDO...' :
                     mode === 'processing' ? 'PROCESANDO...' :
                     mode === 'speaking' ? 'TRANSMITIENDO...' :
                     mode === 'combat' ? '⚠️ ALERTA' :
                     'NEURAL LINK ACTIVE'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className="h-8 w-8 text-gray-500 hover:text-white hover:bg-white/10"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 text-gray-500 hover:text-white hover:bg-white/10"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* ÁREA DE MENSAJES */}
            <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3 mt-[140px] scrollbar-thin scrollbar-thumb-red-900/30 scrollbar-track-transparent">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium ${
                      msg.role === 'user'
                        ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-br-sm'
                        : msg.type === 'alert'
                          ? 'bg-red-900/30 border border-red-500/40 text-red-200 rounded-bl-sm animate-pulse'
                          : msg.type === 'success'
                            ? 'bg-green-900/30 border border-green-500/40 text-green-200 rounded-bl-sm'
                            : 'bg-red-950/40 border border-red-800/30 text-red-100 rounded-bl-sm'
                    }`}
                    style={{
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {msg.role === 'zero' && (
                      <div className="flex items-center gap-2 mb-1.5 text-[10px] text-red-400/70 font-mono">
                        <Sparkles className="w-3 h-3" />
                        ZERO
                      </div>
                    )}
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {/* Indicador de transcripción en tiempo real */}
              {(isListening || interimTranscript) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-end"
                >
                  <div className="max-w-[85%] p-3 rounded-2xl rounded-br-sm bg-blue-900/20 border border-blue-500/20 text-blue-200/70 text-xs italic">
                    {interimTranscript || '🎤 Escuchando...'}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className="relative z-10 p-4 border-t border-red-900/20">
              {/* Glow effect */}
              <div
                className={`absolute inset-x-4 -top-px h-px bg-gradient-to-r transition-all duration-500 ${
                  mode === 'combat'
                    ? 'from-transparent via-red-500 to-transparent opacity-100'
                    : mode === 'listening'
                      ? 'from-transparent via-green-500 to-transparent opacity-100'
                      : 'from-transparent via-red-800/50 to-transparent opacity-50'
                }`}
              />

              <div className="flex items-center gap-2">
                {/* Botón de voz */}
                <Button
                  size="icon"
                  onClick={handleVoiceToggle}
                  disabled={!isSupported}
                  className={`shrink-0 rounded-xl w-11 h-11 transition-all duration-300 ${
                    isListening
                      ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(255,0,0,0.5)] animate-pulse'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>

                {/* Input de texto */}
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Comandos de voz a Zero..."
                    disabled={isListening}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-11 pr-12 rounded-xl font-mono text-xs focus-visible:ring-red-500/30 focus-visible:border-red-500/50"
                  />
                </div>

                {/* Botón enviar */}
                <Button
                  size="icon"
                  onClick={() => handleSendMessage(input)}
                  disabled={!input.trim() || isListening}
                  className="shrink-0 rounded-xl w-11 h-11 bg-red-600/80 hover:bg-red-600 text-white disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Comandos rápidos */}
              <div className="flex gap-2 mt-3">
                {['Reporte', 'Ventas', 'Inventario'].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => handleSendMessage(cmd)}
                    className="px-3 py-1.5 text-[10px] font-mono text-red-400/70 bg-red-950/30 border border-red-900/30 rounded-lg hover:bg-red-900/30 hover:text-red-300 transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== BOTÓN FLOTANTE (MINIMIZADO) ===== */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          relative w-16 h-16 rounded-full overflow-hidden
          transition-all duration-300 group
          ${isExpanded ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'}
        `}
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,0,0,0.95) 100%)',
          border: '2px solid rgba(255, 0, 0, 0.3)',
          boxShadow: `
            0 0 30px rgba(255, 0, 0, 0.3),
            0 10px 40px rgba(0, 0, 0, 0.5),
            inset 0 0 20px rgba(255, 0, 0, 0.1)
          `,
        }}
      >
        {/* Mini 3D Avatar */}
        <div className="absolute inset-0">
          <MiniZeroCanvas isSpeaking={mode === 'speaking'} />
        </div>

        {/* Anillo de estado */}
        <div
          className={`absolute inset-0 rounded-full border-2 transition-colors duration-300 ${
            isListening
              ? 'border-green-500 animate-pulse'
              : mode === 'combat'
                ? 'border-red-500 animate-ping'
                : 'border-transparent'
          }`}
        />

        {/* Indicador de notificación */}
        {!isExpanded && messages.length > 1 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-black flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">
              {Math.min(messages.length - 1, 9)}
            </span>
          </span>
        )}

        {/* Hover glow */}
        <div className="absolute inset-0 rounded-full bg-red-500/0 group-hover:bg-red-500/10 transition-colors duration-300" />
      </motion.button>
    </div>
  )
}

// ============================================
// EXPORTS
// ============================================

export { ZeroChatWidget }
export type { ZeroChatWidgetProps, Message, ZeroMode }
