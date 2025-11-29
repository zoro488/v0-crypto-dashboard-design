'use client'

/**
 * 🎙️ VOICE ORB WIDGET - Orbe de Asistencia de Voz con Spline
 * 
 * Widget flotante premium con orbe 3D animado que responde a:
 * - Comandos de voz
 * - Interacción por hover/click
 * - Estados visuales reactivos (idle, listening, processing, speaking)
 * - Partículas y efectos de energía
 */

import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Mic, MicOff, X, Volume2, VolumeX, Settings, Sparkles, Brain, MessageCircle } from 'lucide-react'
import { useVoiceAgent } from '@/app/hooks/useVoiceAgent'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'

// Lazy load Spline para optimización
const Spline = lazy(() => import('@splinetool/react-spline'))

// URL del Orbe de Voz Spline
const VOICE_ORB_SCENE = 'https://prod.spline.design/ai-voice-orb/scene.splinecode'

// Estados del orbe
type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'success' | 'error'

// Configuración de colores por estado
const STATE_COLORS: Record<OrbState, { primary: string; glow: string; bg: string }> = {
  idle: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', bg: 'from-blue-500/20 to-purple-500/20' },
  listening: { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.5)', bg: 'from-green-500/20 to-emerald-500/20' },
  processing: { primary: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)', bg: 'from-purple-500/20 to-pink-500/20' },
  speaking: { primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)', bg: 'from-cyan-500/20 to-blue-500/20' },
  success: { primary: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)', bg: 'from-green-500/20 to-teal-500/20' },
  error: { primary: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', bg: 'from-red-500/20 to-orange-500/20' },
}

// ============================================================================
// PARTICLE RING COMPONENT
// ============================================================================
function ParticleRing({ active = false, color = '#3b82f6' }: { active?: boolean; color?: string }) {
  const particles = 12
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: particles }).map((_, i) => {
        const angle = (i / particles) * 360
        const delay = i * 0.1
        
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: color,
              left: '50%',
              top: '50%',
              originX: '50%',
              originY: '50%',
            }}
            animate={active ? {
              scale: [0.5, 1, 0.5],
              opacity: [0.3, 0.8, 0.3],
              rotate: [angle, angle + 360],
              translateX: ['0px', '40px', '0px'],
              translateY: ['0px', '0px', '0px'],
            } : {
              scale: 0.5,
              opacity: 0.2,
            }}
            transition={{
              duration: 3,
              delay,
              repeat: active ? Infinity : 0,
              ease: 'easeInOut',
            }}
          />
        )
      })}
    </div>
  )
}

// ============================================================================
// PULSE WAVES COMPONENT
// ============================================================================
function PulseWaves({ active = false, color = '#3b82f6' }: { active?: boolean; color?: string }) {
  if (!active) return null
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: color }}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ 
            scale: [1, 2, 2.5],
            opacity: [0.6, 0.3, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 0.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// ORB CORE COMPONENT (Canvas fallback)
// ============================================================================
function OrbCore({ state, onClick }: { state: OrbState; onClick: () => void }) {
  const colors = STATE_COLORS[state]
  
  return (
    <motion.div
      onClick={onClick}
      className={`relative w-24 h-24 rounded-full cursor-pointer bg-gradient-to-br ${colors.bg}`}
      style={{ 
        boxShadow: `0 0 40px ${colors.glow}, 0 0 80px ${colors.glow}`,
      }}
      animate={{
        scale: state === 'listening' ? [1, 1.05, 1] : [1, 1.02, 1],
      }}
      transition={{
        duration: state === 'listening' ? 0.8 : 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Inner glow */}
      <div 
        className="absolute inset-2 rounded-full opacity-80"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${colors.primary}, transparent 70%)`,
        }}
      />
      
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        {state === 'idle' && <Sparkles className="w-8 h-8 text-white/80" />}
        {state === 'listening' && <Mic className="w-8 h-8 text-white animate-pulse" />}
        {state === 'processing' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
        )}
        {state === 'speaking' && <Volume2 className="w-8 h-8 text-white" />}
        {state === 'success' && <Sparkles className="w-8 h-8 text-white" />}
        {state === 'error' && <X className="w-8 h-8 text-white" />}
      </div>
      
      {/* Animated border */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid ${colors.primary}`,
        }}
        animate={{
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}

// ============================================================================
// MINI CHAT PANEL
// ============================================================================
interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

function MiniChatPanel({ 
  messages, 
  onClose,
  onSend,
  isProcessing, 
}: { 
  messages: Message[]
  onClose: () => void
  onSend: (text: string) => void
  isProcessing: boolean
}) {
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSubmit = () => {
    if (!inputText.trim() || isProcessing) return
    onSend(inputText)
    setInputText('')
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="absolute bottom-full mb-4 right-0 w-80 bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-medium text-sm">Chronos Voice</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Messages */}
      <div className="h-60 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-white/50 text-sm py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Di algo o escribe un mensaje</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[80%] px-3 py-2 rounded-xl text-sm
                ${msg.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 text-white/90'}
              `}>
                {msg.text}
              </div>
            </motion.div>
          ))
        )}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white/10 px-3 py-2 rounded-xl">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-white/5 text-white text-sm px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500/50"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!inputText.trim() || isProcessing}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN VOICE ORB WIDGET COMPONENT
// ============================================================================
export function VoiceOrbWidget() {
  // State
  const [orbState, setOrbState] = useState<OrbState>('idle')
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [muted, setMuted] = useState(false)
  
  // Motion values for hover effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 20, stiffness: 150 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)
  
  // Voice agent hook
  const { connect, disconnect, isConnected } = useVoiceAgent()
  const { voiceAgentStatus } = useAppStore()
  
  // Spline ref
  const splineRef = useRef<any>(null)

  // Sync voice agent status with orb state
  useEffect(() => {
    if (voiceAgentStatus === 'listening') {
      setOrbState('listening')
    } else if (voiceAgentStatus === 'thinking') {
      setOrbState('processing')
    } else if (voiceAgentStatus === 'speaking') {
      setOrbState('speaking')
    } else {
      setOrbState('idle')
    }
  }, [voiceAgentStatus])
  
  // Toggle voice listening
  const toggleVoice = useCallback(async () => {
    if (isConnected) {
      disconnect()
      setOrbState('idle')
    } else {
      try {
        await connect()
        setOrbState('listening')
      } catch (error) {
        logger.error('Error connecting voice agent', error)
        setOrbState('error')
        setTimeout(() => setOrbState('idle'), 2000)
      }
    }
  }, [isConnected, connect, disconnect])
  
  // Handle orb click
  const handleOrbClick = useCallback(() => {
    if (showChat) {
      toggleVoice()
    } else {
      setShowChat(true)
    }
  }, [showChat, toggleVoice])
  
  // Send message
  const handleSendMessage = useCallback(async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setOrbState('processing')
    
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        '📊 Analizando datos del sistema...',
        '✅ He procesado tu solicitud correctamente',
        '💡 Basado en los datos, te recomiendo revisar el panel de ventas',
        '🔍 Encontré información relevante para tu consulta',
      ]
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'ai',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])
      setOrbState('speaking')
      
      setTimeout(() => setOrbState('idle'), 2000)
    }, 1500)
  }, [])
  
  // Mouse move handler for parallax
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set((e.clientX - centerX) * 0.1)
    mouseY.set((e.clientY - centerY) * 0.1)
  }, [mouseX, mouseY])
  
  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])
  
  const colors = STATE_COLORS[orbState]

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Mini Chat Panel */}
      <AnimatePresence>
        {showChat && (
          <MiniChatPanel
            messages={messages}
            onClose={() => setShowChat(false)}
            onSend={handleSendMessage}
            isProcessing={orbState === 'processing'}
          />
        )}
      </AnimatePresence>
      
      {/* Main Orb Container */}
      <div className="relative">
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 rounded-full blur-2xl -z-10"
          style={{ backgroundColor: colors.glow }}
          animate={{
            scale: orbState === 'listening' ? [1, 1.3, 1] : [1, 1.1, 1],
            opacity: orbState === 'idle' ? 0.3 : 0.5,
          }}
          transition={{
            duration: orbState === 'listening' ? 1 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Particle effects */}
        <ParticleRing 
          active={orbState === 'processing' || orbState === 'speaking'} 
          color={colors.primary} 
        />
        
        {/* Pulse waves */}
        <PulseWaves 
          active={orbState === 'listening'} 
          color={colors.primary} 
        />
        
        {/* Main Orb */}
        <OrbCore state={orbState} onClick={handleOrbClick} />
        
        {/* Outer ring */}
        <motion.div
          className="absolute -inset-2 rounded-full border pointer-events-none"
          style={{ borderColor: `${colors.primary}40` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -inset-4 rounded-full border pointer-events-none"
          style={{ borderColor: `${colors.primary}20` }}
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Quick action buttons */}
        <div className="absolute -top-2 -right-2 flex gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMuted(!muted)}
            className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          </motion.button>
        </div>
        
        {/* Status label */}
        <AnimatePresence>
          {orbState !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white/70">
                {orbState === 'listening' && '🎤 Escuchando...'}
                {orbState === 'processing' && '🧠 Procesando...'}
                {orbState === 'speaking' && '💬 Respondiendo...'}
                {orbState === 'success' && '✅ Completado'}
                {orbState === 'error' && '❌ Error'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Online indicator */}
        <motion.div
          className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-green-500 border-2 border-black"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </motion.div>
  )
}

export default VoiceOrbWidget
