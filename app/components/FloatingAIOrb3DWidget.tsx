'use client'

/**
 * 🔮 FloatingAIOrb3DWidget - Widget Flotante Premium con Orbe 3D GLTF
 * 
 * Widget de asistente IA flotante que usa el modelo 3D real:
 * /SPLINE COMPONENTS/ai_voice_assistance_orb.gltf
 * 
 * Características:
 * - Orbe 3D real cargado desde GLTF
 * - Animaciones reactivas por estado (idle, listening, thinking, speaking)
 * - Panel de chat inmersivo con glassmorphism
 * - Respuestas contextuales basadas en datos del sistema (Firestore)
 * - Efectos visuales premium (bloom, particles, glow)
 */

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, MicOff, Send, Maximize2, Sparkles, X, Bot, 
  Brain, Zap, Activity, ChevronDown, 
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { useAIWidgetData, generateAIResponse } from '@/app/hooks/useAIWidgetData'
import { AIVoiceOrbGLTF, type OrbState } from '@/app/components/3d/models/AIVoiceOrbGLTF'

// Tipos
interface DisplayMessage {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  suggestions?: string[]
}

// Fallback mientras carga el 3D
function OrbFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div
        className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Bot className="w-6 h-6 text-white" />
      </motion.div>
    </div>
  )
}

// Escena 3D del orbe
function OrbScene({ 
  state, 
  audioLevel,
  onClick,
}: { 
  state: OrbState
  audioLevel: number
  onClick?: () => void
}) {
  return (
    <Canvas
      gl={{ 
        alpha: true, 
        antialias: true, 
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0, 0, 4], fov: 45 }}
      style={{ 
        pointerEvents: 'auto', 
        cursor: 'pointer',
        background: 'transparent',
      }}
      onClick={onClick}
    >
      <Suspense fallback={null}>
        {/* Iluminación */}
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#60a5fa" />
        <pointLight position={[-5, -5, 5]} intensity={0.8} color="#a855f7" />
        <spotLight
          position={[0, 5, 0]}
          angle={0.5}
          penumbra={1}
          intensity={1}
          color="#3b82f6"
        />
        
        {/* Orbe 3D GLTF */}
        <AIVoiceOrbGLTF
          state={state}
          audioLevel={audioLevel}
          scale={0.9}
          enableParticles={true}
          enableGlow={true}
        />
        
        {/* Environment para reflexiones */}
        <Environment preset="city" />
        
        {/* Post-processing premium */}
        <EffectComposer>
          <Bloom 
            intensity={0.6} 
            luminanceThreshold={0.4} 
            mipmapBlur 
            radius={0.8}
          />
          <ChromaticAberration 
            blendFunction={BlendFunction.NORMAL} 
            offset={new THREE.Vector2(0.001, 0.001)} 
          />
          <Vignette darkness={0.25} offset={0.3} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}

// Estado del indicador
function StatusIndicator({ status }: { status: OrbState }) {
  const config: Record<OrbState, { color: string; label: string; icon: typeof Activity }> = {
    idle: { color: 'bg-emerald-500', label: 'Listo', icon: Activity },
    listening: { color: 'bg-blue-500', label: 'Escuchando...', icon: Mic },
    thinking: { color: 'bg-purple-500', label: 'Procesando...', icon: Brain },
    speaking: { color: 'bg-cyan-500', label: 'Respondiendo...', icon: Zap },
    success: { color: 'bg-green-500', label: 'Completado', icon: Sparkles },
    error: { color: 'bg-red-500', label: 'Error', icon: X },
  }
  
  const { color, label } = config[status]
  
  return (
    <motion.div 
      className="flex items-center gap-2" 
      key={status} 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <motion.div 
        className={`w-2 h-2 rounded-full ${color}`}
        animate={status === 'idle' ? {} : { 
          scale: [1, 1.3, 1], 
          opacity: [1, 0.7, 1], 
        }}
        transition={{ duration: 1, repeat: status === 'idle' ? 0 : Infinity }}
      />
      <span className="text-xs text-white/50">{label}</span>
    </motion.div>
  )
}

// Componente principal del Widget
export function FloatingAIOrb3DWidget() {
  const [widgetState, setWidgetState] = useState<'minimized' | 'chat'>('minimized')
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [orbState, setOrbState] = useState<OrbState>('idle')
  const [audioLevel, setAudioLevel] = useState(0)
  const [notificationCount, setNotificationCount] = useState(2)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Store para UI y bancos
  const { bancos, setCurrentPanel, setVoiceAgentStatus } = useAppStore()
  
  // Datos de Firestore para respuestas AI
  const aiData = useAIWidgetData(bancos)

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simular nivel de audio cuando habla
  useEffect(() => {
    if (orbState === 'speaking') {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.2)
      }, 100)
      return () => clearInterval(interval)
    } else {
      setAudioLevel(0)
    }
  }, [orbState])

  // Ir al panel IA completo
  const goToIAPanel = () => {
    setCurrentPanel('ia')
    setWidgetState('minimized')
  }

  // Enviar mensaje
  const handleSendMessage = useCallback(() => {
    if (!inputText.trim() || isTyping) return

    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageToSend = inputText
    setInputText('')
    setIsTyping(true)
    setOrbState('thinking')
    setVoiceAgentStatus('thinking')

    // Simular delay de respuesta IA
    setTimeout(() => {
      setOrbState('speaking')
      setVoiceAgentStatus('speaking')
      
      // Usar datos de Firestore para generar respuesta
      const response = generateAIResponse(messageToSend, aiData, bancos)
      
      setTimeout(() => {
        const aiMessage: DisplayMessage = {
          id: (Date.now() + 1).toString(),
          text: response.text,
          sender: 'ai',
          timestamp: new Date(),
          suggestions: response.suggestions,
        }
        
        setMessages((prev) => [...prev, aiMessage])
        setIsTyping(false)
        setOrbState('idle')
        setVoiceAgentStatus('idle')
        setNotificationCount(0)
      }, 1500)
    }, 800)
  }, [inputText, isTyping, aiData, bancos, setVoiceAgentStatus])

  // Toggle micrófono
  const toggleListening = () => {
    setIsListening(!isListening)
    if (!isListening) {
      setOrbState('listening')
      setVoiceAgentStatus('listening')
      setTimeout(() => {
        setIsListening(false)
        setOrbState('idle')
        setVoiceAgentStatus('idle')
      }, 3000)
    } else {
      setOrbState('idle')
      setVoiceAgentStatus('idle')
    }
  }

  // Estado minimizado - Solo el orb 3D
  if (widgetState === 'minimized') {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed bottom-6 right-6 z-[9999]"
      >
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-24 h-24 rounded-full cursor-pointer group"
          onClick={() => setWidgetState('chat')}
        >
          {/* Glow exterior animado */}
          <motion.div
            className="absolute -inset-4 rounded-full bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Anillo de pulso */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400/50"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />

          {/* Canvas 3D del Orbe GLTF */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <Suspense fallback={<OrbFallback />}>
              <OrbScene 
                state={orbState} 
                audioLevel={audioLevel}
              />
            </Suspense>
          </div>

          {/* Borde brillante */}
          <div className="absolute inset-0 rounded-full border border-white/20 group-hover:border-white/40 transition-colors pointer-events-none" />

          {/* Badge de notificaciones */}
          <AnimatePresence>
            {notificationCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg pointer-events-none"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {notificationCount}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Indicador de estado */}
          <motion.div
            className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-slate-900 pointer-events-none ${
              orbState === 'listening' ? 'bg-green-500' :
              orbState === 'speaking' ? 'bg-cyan-500' :
              orbState === 'thinking' ? 'bg-purple-500' :
              'bg-green-500'
            }`}
            animate={orbState !== 'idle' ? {
              scale: [1, 1.3, 1],
            } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    )
  }

  // Estado chat expandido
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-6 right-6 w-[420px] h-[620px] z-[9999]"
    >
      <div className="bg-black/95 backdrop-blur-2xl h-full rounded-3xl overflow-hidden flex flex-col shadow-[0_0_80px_rgba(59,130,246,0.15)] border border-white/10">
        {/* Fondo animado */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <motion.div 
            className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600/15 rounded-full blur-[80px]"
            animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div 
            className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-600/15 rounded-full blur-[80px]"
            animate={{ x: [0, -30, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Header con Orbe 3D mini */}
        <div className="relative p-4 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mini orbe 3D */}
              <div className="w-14 h-14 rounded-xl overflow-hidden relative">
                <Suspense fallback={<OrbFallback />}>
                  <OrbScene 
                    state={orbState} 
                    audioLevel={audioLevel}
                  />
                </Suspense>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  Chronos AI
                  {isTyping && <Sparkles className="w-3 h-3 text-blue-400 animate-spin" />}
                </h3>
                <StatusIndicator status={orbState} />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToIAPanel}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Abrir Panel IA completo"
              >
                <Maximize2 className="w-4 h-4 text-white/60" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setWidgetState('minimized')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronDown className="w-4 h-4 text-white/60" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              {/* Orbe grande cuando no hay mensajes */}
              <div className="w-32 h-32 rounded-3xl overflow-hidden mb-4 relative">
                <Suspense fallback={<OrbFallback />}>
                  <OrbScene 
                    state={orbState} 
                    audioLevel={audioLevel}
                  />
                </Suspense>
              </div>
              <h4 className="text-white font-semibold mb-1">Asistente Chronos</h4>
              <p className="text-white/60 text-xs mb-4">¿En qué puedo ayudarte hoy?</p>
              
              {/* Quick actions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {['Resumen del día', 'Ver ventas', 'Estado financiero'].map((action) => (
                  <motion.button
                    key={action}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setInputText(action)
                    }}
                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 text-xs border border-white/10 transition-colors"
                  >
                    {action}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line
                      ${message.sender === 'user' 
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' 
                        : 'bg-white/10 text-white'}
                    `}
                  >
                    {message.text}
                    
                    {/* Sugerencias */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-white/10">
                        <div className="flex flex-wrap gap-1.5">
                          {message.suggestions.map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => setInputText(suggestion)}
                              className="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex justify-start"
                >
                  <div className="bg-white/10 px-4 py-3 rounded-2xl">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-blue-500 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="relative p-4 border-t border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleListening}
              disabled={isTyping}
              className={`
                p-2.5 rounded-xl transition-all
                ${isListening ? 'bg-red-500' : 'bg-white/10 hover:bg-white/15'}
                ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4 text-white" />
              )}
            </motion.button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Escribe tu mensaje..."
              disabled={isTyping}
              className="flex-1 bg-white/5 text-white px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 text-sm placeholder:text-white/40 disabled:opacity-50"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default FloatingAIOrb3DWidget
