'use client'

/**
 * 🤖 GROK AI ORB WIDGET - Premium Floating AI Assistant
 * 
 * Widget flotante premium con orbe de IA:
 * - Siempre visible en todos los paneles (fixed position)
 * - Draggable - se puede mover a cualquier posición
 * - Reacciona al sonido con animaciones
 * - Click para ver opciones: Llamada o Chat
 * - Diseño glassmorphism ultra-premium
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { 
  MessageCircle, 
  Phone, 
  PhoneOff,
  X,
  Send, 
  Sparkles,
  Mic,
  Brain,
  GripVertical,
  Volume2,
} from 'lucide-react'
import { useVoiceAgent } from '@/app/hooks/useVoiceAgent'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'

// Estado del orbe
type OrbState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'active'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

// ============================================================================
// AUDIO REACTIVE ORB - Componente del orbe que reacciona al sonido
// ============================================================================
interface AudioReactiveOrbProps {
  state: OrbState
  audioLevel: number
  onClick: () => void
}

function AudioReactiveOrb({ state, audioLevel, onClick }: AudioReactiveOrbProps) {
  const audioScale = 1 + (audioLevel * 0.35)
  const pulseIntensity = audioLevel * 80
  
  const stateColors = useMemo(() => ({
    idle: {
      primary: 'from-blue-500 via-purple-500 to-pink-500',
      glow: 'rgba(139, 92, 246, 0.5)',
      ring: 'border-purple-500/30',
    },
    listening: {
      primary: 'from-green-400 via-emerald-500 to-teal-500',
      glow: 'rgba(52, 211, 153, 0.6)',
      ring: 'border-green-500/50',
    },
    speaking: {
      primary: 'from-blue-400 via-cyan-500 to-blue-600',
      glow: 'rgba(59, 130, 246, 0.6)',
      ring: 'border-blue-500/50',
    },
    thinking: {
      primary: 'from-violet-500 via-purple-600 to-fuchsia-500',
      glow: 'rgba(168, 85, 247, 0.6)',
      ring: 'border-violet-500/50',
    },
    active: {
      primary: 'from-amber-400 via-orange-500 to-red-500',
      glow: 'rgba(251, 146, 60, 0.6)',
      ring: 'border-orange-500/50',
    },
  }), [])

  const colors = stateColors[state]

  return (
    <motion.div
      onClick={onClick}
      className="relative cursor-pointer select-none"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Outer glow rings */}
      <motion.div
        className={`absolute rounded-full ${colors.ring} border-2`}
        animate={{
          scale: [1, 1.3 + audioLevel * 0.4, 1],
          opacity: [0.4, 0.1, 0.4],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 110, height: 110, left: -5, top: -5 }}
      />
      
      <motion.div
        className={`absolute rounded-full ${colors.ring} border`}
        animate={{
          scale: [1, 1.5 + audioLevel * 0.6, 1],
          opacity: [0.25, 0.05, 0.25],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        style={{ width: 130, height: 130, left: -15, top: -15 }}
      />

      {/* Audio reactive particles */}
      {state !== 'idle' && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-white/70"
              animate={{
                x: Math.cos((i * Math.PI * 2) / 6) * (35 + audioLevel * 25),
                y: Math.sin((i * Math.PI * 2) / 6) * (35 + audioLevel * 25),
                scale: [0.5, 1 + audioLevel * 0.8, 0.5],
                opacity: [0.3, 0.9, 0.3],
              }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08 }}
              style={{ left: '50%', top: '50%', marginLeft: -3, marginTop: -3 }}
            />
          ))}
        </>
      )}

      {/* Main orb */}
      <motion.div
        className={`w-[100px] h-[100px] rounded-full relative overflow-hidden bg-gradient-to-br ${colors.primary} shadow-2xl`}
        animate={{
          scale: audioScale,
          boxShadow: `0 0 ${25 + pulseIntensity}px ${colors.glow}, 0 0 ${50 + pulseIntensity * 1.5}px ${colors.glow}`,
        }}
        transition={{ scale: { duration: 0.08 }, boxShadow: { duration: 0.15 } }}
      >
        {/* Inner glass effect */}
        <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-white/25 via-transparent to-transparent" />
        
        {/* Inner highlight */}
        <motion.div
          className="absolute inset-3 rounded-full bg-gradient-to-br from-white/15 to-transparent"
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              rotate: state === 'thinking' ? 360 : 0,
              scale: state === 'listening' ? [1, 1.15, 1] : 1,
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
              scale: { duration: 0.5, repeat: Infinity },
            }}
          >
            {state === 'listening' ? (
              <Mic className="w-8 h-8 text-white drop-shadow-lg" />
            ) : state === 'speaking' ? (
              <motion.div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-6 bg-white rounded-full"
                    animate={{ scaleY: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.35, repeat: Infinity, delay: i * 0.08 }}
                  />
                ))}
              </motion.div>
            ) : state === 'thinking' ? (
              <Brain className="w-8 h-8 text-white drop-shadow-lg" />
            ) : (
              <Sparkles className="w-8 h-8 text-white drop-shadow-lg" />
            )}
          </motion.div>
        </div>

        {/* Rotating gradient */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)' }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      {/* State label */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap"
      >
        <span className="text-[10px] text-white/80 font-medium bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-md">
          {state === 'idle' && 'Chronos AI'}
          {state === 'listening' && 'Escuchando...'}
          {state === 'speaking' && 'Hablando...'}
          {state === 'thinking' && 'Pensando...'}
          {state === 'active' && 'Activo'}
        </span>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// OPTIONS MENU
// ============================================================================
interface OptionsMenuProps {
  isOpen: boolean
  onClose: () => void
  onCallClick: () => void
  onChatClick: () => void
  isCallActive: boolean
}

function OptionsMenu({ isOpen, onClose, onCallClick, onChatClick, isCallActive }: OptionsMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 15 }}
          transition={{ type: 'spring', damping: 22, stiffness: 350 }}
          className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2"
        >
          <div 
            className="flex gap-2.5 p-2.5 rounded-2xl"
            style={{
              background: 'rgba(10, 15, 30, 0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* Call Option */}
            <motion.button
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { onCallClick(); onClose() }}
              className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all
                ${isCallActive 
                  ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30' 
                  : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 hover:shadow-green-500/50'
                }`}
            >
              {isCallActive ? <PhoneOff className="w-5 h-5 text-white" /> : <Phone className="w-5 h-5 text-white" />}
              <span className="text-[9px] text-white/90 font-medium">{isCallActive ? 'Colgar' : 'Llamar'}</span>
            </motion.button>

            {/* Chat Option */}
            <motion.button
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { onChatClick(); onClose() }}
              className="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="text-[9px] text-white/90 font-medium">Chat</span>
            </motion.button>

            {/* Close */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-9 h-14 rounded-lg flex items-center justify-center bg-white/8 hover:bg-white/15 transition-all"
            >
              <X className="w-4 h-4 text-white/60" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// CHAT OVERLAY
// ============================================================================
interface ChatOverlayProps {
  isOpen: boolean
  onClose: () => void
  messages: Message[]
  onSendMessage: (text: string) => void
  isTyping: boolean
}

function ChatOverlay({ isOpen, onClose, messages, onSendMessage, isTyping }: ChatOverlayProps) {
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!inputText.trim()) return
    onSendMessage(inputText)
    setInputText('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.92 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.92 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="fixed bottom-6 right-6 w-[380px] h-[520px] z-[9998] rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(10, 15, 30, 0.94)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/8 bg-gradient-to-r from-blue-500/8 to-purple-500/8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ boxShadow: ['0 0 15px rgba(139,92,246,0.4)', '0 0 25px rgba(59,130,246,0.4)', '0 0 15px rgba(139,92,246,0.4)'] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-sm font-bold text-white">Chronos AI</h3>
                  <div className="flex items-center gap-1.5">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-white/50 text-[10px]">En línea</span>
                  </div>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[calc(100%-130px)] overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">¡Hola!</h4>
                <p className="text-white/50 text-xs">Soy Chronos AI. ¿En qué puedo ayudarte?</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <motion.div key={message.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-3 rounded-xl text-xs ${message.sender === 'ai' ? 'bg-white/8 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/20'}`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      <span className="text-[9px] opacity-50 mt-1 block text-right">{message.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/8 p-3 rounded-xl">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (<motion.div key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.45, delay: i * 0.1 }} />))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/8 bg-black/30 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Escribe tu mensaje..." className="flex-1 bg-white/5 text-white text-xs px-3 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-white/30" />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSend} disabled={!inputText.trim()} className="p-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// CALL OVERLAY
// ============================================================================
interface CallOverlayProps {
  isActive: boolean
  onEnd: () => void
  isListening: boolean
}

function CallOverlay({ isActive, onEnd, isListening }: CallOverlayProps) {
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!isActive) { setDuration(0); return }
    const timer = setInterval(() => setDuration(prev => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [isActive])

  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999]">
          <div className="px-5 py-2.5 rounded-xl flex items-center gap-4" style={{ background: 'rgba(10, 15, 30, 0.94)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)' }}>
            <div className="flex items-center gap-2.5">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-green-500' : 'bg-blue-500'}`} />
              <div>
                <p className="text-white font-semibold text-xs">Llamada activa</p>
                <p className="text-white/50 text-[10px]">{isListening ? 'Escuchando...' : 'Hablando...'}</p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-white/5"><span className="text-white font-mono text-xs">{formatDuration(duration)}</span></div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onEnd} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-red-500/25">
              <PhoneOff className="w-3.5 h-3.5" />Colgar
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// MAIN COMPONENT - GrokAIOrb (Floating Widget)
// ============================================================================
export function GrokAIOrb() {
  // State
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [orbState, setOrbState] = useState<OrbState>('idle')
  const [audioLevel, setAudioLevel] = useState(0)
  
  // Refs
  const constraintsRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  // Hooks
  const { connect, disconnect } = useVoiceAgent()
  const { voiceAgentStatus } = useAppStore()

  // Initialize audio analyzer
  useEffect(() => {
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioContextRef.current = new AudioContext()
        analyserRef.current = audioContextRef.current.createAnalyser()
        const source = audioContextRef.current.createMediaStreamSource(stream)
        source.connect(analyserRef.current)
        analyserRef.current.fftSize = 256
        
        const updateAudioLevel = () => {
          if (!analyserRef.current) return
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(Math.min(average / 128, 1))
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
        }
        updateAudioLevel()
        logger.info('Audio analyzer inicializado', { context: 'GrokAIOrb' })
      } catch {
        // Simulate audio if no permissions
        const simulateAudio = () => {
          if (isCallActive || orbState === 'speaking') {
            setAudioLevel(0.3 + Math.random() * 0.35)
          } else {
            setAudioLevel(0.05 + Math.random() * 0.08)
          }
          animationFrameRef.current = requestAnimationFrame(simulateAudio)
        }
        simulateAudio()
      }
    }
    initAudio()
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [isCallActive, orbState])

  // Sync orb state
  useEffect(() => {
    if (isCallActive) {
      setOrbState(voiceAgentStatus === 'listening' ? 'listening' : 'speaking')
    } else if (isTyping) {
      setOrbState('thinking')
    } else if (isMenuOpen) {
      setOrbState('active')
    } else {
      setOrbState('idle')
    }
  }, [isCallActive, voiceAgentStatus, isTyping, isMenuOpen])

  const handleOrbClick = useCallback(() => setIsMenuOpen(prev => !prev), [])

  const toggleCall = useCallback(async () => {
    if (isCallActive) {
      disconnect()
      setIsCallActive(false)
      setOrbState('idle')
    } else {
      await connect()
      setIsCallActive(true)
      setOrbState('listening')
      setIsChatOpen(false)
    }
  }, [isCallActive, connect, disconnect])

  const openChat = useCallback(() => {
    setIsChatOpen(true)
    setIsMenuOpen(false)
  }, [])

  const generateAIResponse = useCallback((userInput: string): string => {
    const input = userInput.toLowerCase()
    if (input.includes('ventas')) return '📊 Las ventas totales ascienden a $3,378,700 con +18% vs mes anterior.'
    if (input.includes('inventario') || input.includes('stock')) return '📦 Stock actual: 17 unidades. ⚠️ Nivel bajo detectado.'
    if (input.includes('clientes')) return '👥 31 clientes activos con 94% de retención.'
    if (input.includes('hola') || input.includes('hey')) return '¡Hola! 👋 Soy Chronos AI. ¿En qué puedo ayudarte?'
    return '🤖 Puedo ayudarte con ventas, inventario, clientes o predicciones. ¿Qué necesitas?'
  }, [])

  const handleSendMessage = useCallback((text: string) => {
    const userMessage: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)
    setOrbState('thinking')

    setTimeout(() => {
      const response = generateAIResponse(text)
      const aiMessage: Message = { id: (Date.now() + 1).toString(), text: response, sender: 'ai', timestamp: new Date() }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
      setOrbState('speaking')
      setTimeout(() => setOrbState('idle'), 2000)
    }, 1200 + Math.random() * 800)
  }, [generateAIResponse])

  return (
    <>
      {/* Constraints container */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[9999]" />

      {/* Floating Widget */}
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.08}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-[9999] cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        {/* Drag indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          whileHover={{ opacity: 0.9 }}
          className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 text-white/50"
        >
          <GripVertical className="w-3 h-3" />
          <span className="text-[8px]">Arrastra</span>
        </motion.div>

        {/* Options Menu */}
        <OptionsMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onCallClick={toggleCall} onChatClick={openChat} isCallActive={isCallActive} />

        {/* The Orb */}
        <AudioReactiveOrb state={orbState} audioLevel={audioLevel} onClick={handleOrbClick} />
      </motion.div>

      {/* Chat Overlay */}
      <ChatOverlay isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} />

      {/* Call Overlay */}
      <CallOverlay isActive={isCallActive} onEnd={() => { disconnect(); setIsCallActive(false); setOrbState('idle') }} isListening={voiceAgentStatus === 'listening'} />
    </>
  )
}

export default GrokAIOrb
