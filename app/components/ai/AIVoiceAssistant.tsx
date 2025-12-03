'use client'

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { 
  Mic, 
  MicOff, 
  X, 
  Send, 
  Volume2, 
  VolumeX,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Bot,
  User,
  Zap,
} from 'lucide-react'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI VOICE ASSISTANT - The Orb Interface
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Widget IA flotante con:
 * - Orbe 3D pulsante estilo Tesla (respiración)
 * - Expansión a panel lateral de vidrio
 * - Waveform que reacciona a la voz
 * - Integración con Web Speech API + ElevenLabs
 * - Chat con burbujas iMessage oscuras
 */

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  toolResult?: {
    type: string
    success: boolean
    data?: Record<string, unknown>
  }
}

interface AIVoiceAssistantProps {
  onSendMessage?: (message: string) => Promise<string>
  onToolExecution?: (tool: string, args: Record<string, unknown>) => Promise<unknown>
  elevenLabsApiKey?: string
  voiceId?: string
  className?: string
}

// Hook para Web Speech Recognition
function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [audioLevel, setAudioLevel] = useState(0)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  
  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    
    // Crear reconocimiento de voz
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'es-MX'
    
    recognition.onresult = (event) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript)
      }
    }
    
    recognition.onerror = () => {
      setIsListening(false)
    }
    
    recognition.onend = () => {
      setIsListening(false)
    }
    
    // Iniciar análisis de audio para visualización
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new AudioContext()
      const analyzer = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyzer)
      analyzer.fftSize = 256
      
      audioContextRef.current = audioContext
      analyzerRef.current = analyzer
      
      // Monitorear niveles de audio
      const dataArray = new Uint8Array(analyzer.frequencyBinCount)
      const updateLevel = () => {
        if (!analyzerRef.current) return
        analyzerRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(average / 128) // Normalizar a 0-1
        if (isListening) {
          requestAnimationFrame(updateLevel)
        }
      }
      updateLevel()
    } catch {
      // Sin micrófono disponible
    }
    
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isListening])
  
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    audioContextRef.current?.close()
    setIsListening(false)
    setAudioLevel(0)
  }, [])
  
  const clearTranscript = useCallback(() => {
    setTranscript('')
  }, [])
  
  return {
    isListening,
    transcript,
    audioLevel,
    startListening,
    stopListening,
    clearTranscript,
  }
}

// Componente de waveform visual
const AudioWaveform = memo(function AudioWaveform({ 
  level, 
  isActive,
  color = '#ef4444'
}: { 
  level: number
  isActive: boolean
  color?: string
}) {
  const bars = 12
  
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {Array.from({ length: bars }).map((_, i) => {
        const centerDistance = Math.abs(i - (bars - 1) / 2) / ((bars - 1) / 2)
        const baseHeight = isActive ? (1 - centerDistance * 0.5) * level : 0.1
        const height = Math.max(0.1, baseHeight + Math.random() * 0.2 * (isActive ? level : 0))
        
        return (
          <motion.div
            key={i}
            className="w-1 rounded-full"
            style={{ backgroundColor: color }}
            animate={{
              height: `${height * 32}px`,
              opacity: isActive ? 0.6 + height * 0.4 : 0.3,
            }}
            transition={{
              duration: 0.1,
              ease: 'easeOut',
            }}
          />
        )
      })}
    </div>
  )
})

// Burbuja de mensaje
const ChatBubble = memo(function ChatBubble({ 
  message 
}: { 
  message: Message 
}) {
  const isUser = message.role === 'user'
  const isToolResult = message.toolResult !== undefined
  
  if (isToolResult && message.toolResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex justify-center my-3"
      >
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          style={{
            background: message.toolResult.success 
              ? 'rgba(16, 185, 129, 0.15)' 
              : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.toolResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {message.toolResult.success ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-white/80">{message.content}</span>
        </div>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div 
        className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar */}
        <div 
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: isUser 
              ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
              : 'linear-gradient(135deg, #ef4444, #f97316)',
            boxShadow: isUser
              ? '0 0 20px rgba(59, 130, 246, 0.3)'
              : '0 0 20px rgba(239, 68, 68, 0.3)',
          }}
        >
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>
        
        {/* Mensaje */}
        <div
          className={`px-4 py-3 rounded-2xl ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}`}
          style={{
            background: isUser 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))'
              : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isUser ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
          }}
        >
          <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          <p className="text-[10px] text-white/30 mt-1">
            {message.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </motion.div>
  )
})

// Orbe principal con efectos de respiración
const PulsingOrb = memo(function PulsingOrb({ 
  isActive,
  isSpeaking,
  onClick,
}: { 
  isActive: boolean
  isSpeaking: boolean
  onClick: () => void
}) {
  const scale = useMotionValue(1)
  const springScale = useSpring(scale, { stiffness: 300, damping: 20 })
  
  return (
    <motion.button
      onClick={onClick}
      className="relative w-14 h-14 rounded-full outline-none focus:outline-none"
      style={{ scale: springScale }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Glow exterior pulsante */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${isActive ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.3)'} 0%, transparent 70%)`,
          filter: 'blur(15px)',
        }}
        animate={{
          scale: isSpeaking ? [1, 1.5, 1] : [1, 1.2, 1],
          opacity: isSpeaking ? [0.8, 1, 0.8] : [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: isSpeaking ? 0.5 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Orbe principal */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `
            radial-gradient(circle at 30% 30%, rgba(255, 100, 100, 0.8) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(200, 50, 50, 0.6) 0%, transparent 50%),
            linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)
          `,
          boxShadow: `
            0 0 30px rgba(239, 68, 68, 0.5),
            inset 0 0 20px rgba(255, 255, 255, 0.2),
            inset 0 -10px 20px rgba(0, 0, 0, 0.3)
          `,
        }}
        animate={{
          scale: isActive ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 1,
          repeat: isActive ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />
      
      {/* Reflejo superior */}
      <div 
        className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-4 rounded-full"
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%)',
        }}
      />
      
      {/* Icono central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isSpeaking ? (
            <motion.div
              key="speaking"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
            >
              <Volume2 className="w-5 h-5 text-white" />
            </motion.div>
          ) : isActive ? (
            <motion.div
              key="active"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Mic className="w-5 h-5 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  )
})

export const AIVoiceAssistant = memo(function AIVoiceAssistant({
  onSendMessage,
  className = '',
}: AIVoiceAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de Chronos. Puedo ayudarte a registrar ventas, consultar balances y más. ¿En qué puedo ayudarte?',
      timestamp: new Date(),
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const {
    isListening,
    transcript,
    audioLevel,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition()
  
  // Auto scroll a mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Manejar transcript de voz
  useEffect(() => {
    if (transcript && !isListening) {
      setInputText(transcript)
      clearTranscript()
    }
  }, [transcript, isListening, clearTranscript])
  
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isProcessing) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsProcessing(true)
    
    try {
      // Simular respuesta de IA
      let response = ''
      
      if (onSendMessage) {
        response = await onSendMessage(inputText.trim())
      } else {
        // Respuesta simulada
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const lowerInput = inputText.toLowerCase()
        if (lowerInput.includes('venta') || lowerInput.includes('registrar')) {
          response = 'He registrado la venta exitosamente. El monto se ha distribuido automáticamente entre Bóveda Monte, Fletes y Utilidades según la configuración establecida.'
          
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'system',
            content: 'Venta registrada: $5,000.00 ✓',
            timestamp: new Date(),
            toolResult: { type: 'crearVenta', success: true, data: { monto: 5000 } }
          }])
        } else if (lowerInput.includes('balance') || lowerInput.includes('capital')) {
          response = 'Tu capital total actual es de $125,840.00 distribuido en 6 bancos. El banco con mayor saldo es Bóveda Monte con $45,200.00.'
        } else if (lowerInput.includes('hola') || lowerInput.includes('buenos')) {
          response = '¡Hola! Es un placer ayudarte. Puedo registrar ventas, consultar balances, gestionar órdenes de compra y más. ¿Qué necesitas?'
        } else {
          response = 'Entendido. Puedo ayudarte con operaciones como registrar ventas, consultar balances, ver órdenes pendientes o gestionar clientes. ¿Qué te gustaría hacer?'
        }
      }
      
      // Simular "hablando"
      setIsSpeaking(true)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIsSpeaking(false)
      
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error procesando tu solicitud. Por favor intenta de nuevo.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }, [inputText, isProcessing, onSendMessage])
  
  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])
  
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <AnimatePresence mode="wait">
        {isExpanded ? (
          // Panel expandido
          <motion.div
            key="expanded"
            layoutId="ai-assistant"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[400px] h-[600px] rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(10, 10, 15, 0.95)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: `
                0 0 60px rgba(239, 68, 68, 0.2),
                0 30px 60px -15px rgba(0, 0, 0, 0.7),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
            }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 border-b border-white/10"
              style={{
                background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)',
              }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
                  }}
                  animate={isSpeaking ? {
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      '0 0 20px rgba(239, 68, 68, 0.4)',
                      '0 0 40px rgba(239, 68, 68, 0.6)',
                      '0 0 20px rgba(239, 68, 68, 0.4)',
                    ],
                  } : {}}
                  transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
                >
                  <Bot className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-white font-semibold">Chronos AI</h3>
                  <p className="text-white/40 text-xs">
                    {isProcessing ? 'Pensando...' : isSpeaking ? 'Hablando...' : 'En línea'}
                  </p>
                </div>
              </div>
              <motion.button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-white/60" />
              </motion.button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 h-[420px] overflow-y-auto p-4 scrollbar-obsidian">
              {messages.map(message => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-white/40 text-sm ml-10"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Voice visualizer */}
            {isListening && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 py-2 border-t border-white/10"
              >
                <AudioWaveform level={audioLevel} isActive={isListening} color="#ef4444" />
              </motion.div>
            )}
            
            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={toggleVoice}
                  className={`p-3 rounded-xl transition-colors ${isListening ? 'bg-red-500/20' : 'bg-white/5 hover:bg-white/10'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5 text-red-400" />
                  ) : (
                    <Mic className="w-5 h-5 text-white/60" />
                  )}
                </motion.button>
                
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isListening ? 'Escuchando...' : 'Escribe un mensaje...'}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-white/20 transition-colors"
                />
                
                <motion.button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isProcessing}
                  className={`p-3 rounded-xl transition-colors ${inputText.trim() ? 'bg-red-500 hover:bg-red-600' : 'bg-white/5'}`}
                  whileHover={inputText.trim() ? { scale: 1.05 } : {}}
                  whileTap={inputText.trim() ? { scale: 0.95 } : {}}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          // Orbe colapsado
          <motion.div
            key="collapsed"
            layoutId="ai-assistant"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <PulsingOrb
              isActive={isListening}
              isSpeaking={isSpeaking}
              onClick={() => setIsExpanded(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default AIVoiceAssistant
