'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — IA COLABORATIVA CON VOZ
// Sistema de IA que interactúa mediante voz y comandos
// Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { logger } from '@/app/lib/utils/logger'

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  audioUrl?: string
  isPlaying?: boolean
}

interface VoiceCommand {
  command: string
  action: string
  description: string
}

interface IACollaborativeProps {
  className?: string
  isOpen?: boolean
  onToggle?: () => void
  onCommand?: (command: string, action: string) => void
  systemContext?: {
    capitalTotal: number
    alertas: string[]
    ultimasVentas: number
  }
}

// ═══════════════════════════════════════════════════════════════
// COMANDOS DE VOZ DISPONIBLES
// ═══════════════════════════════════════════════════════════════

const VOICE_COMMANDS: VoiceCommand[] = [
  { command: 'mostrar capital', action: 'show_capital', description: 'Muestra el capital total del sistema' },
  { command: 'ir a ventas', action: 'navigate_ventas', description: 'Navega al panel de ventas' },
  { command: 'ir a bancos', action: 'navigate_bancos', description: 'Navega al panel de bancos' },
  { command: 'crear venta', action: 'create_venta', description: 'Abre el modal de nueva venta' },
  { command: 'estado del sistema', action: 'system_status', description: 'Resumen del estado actual' },
  { command: 'alertas', action: 'show_alerts', description: 'Muestra alertas pendientes' },
  { command: 'gráfica de utilidades', action: 'show_chart_utilidades', description: 'Muestra gráfico de utilidades' },
  { command: 'cerrar', action: 'close', description: 'Cierra el asistente' },
]

// ═══════════════════════════════════════════════════════════════
// COMPONENTE DE ORB DE VOZ ANIMADO
// ═══════════════════════════════════════════════════════════════

function VoiceOrb({ 
  isListening, 
  isSpeaking,
  amplitude = 0,
}: { 
  isListening: boolean
  isSpeaking: boolean
  amplitude?: number
}) {
  const scale = useSpring(1, { stiffness: 300, damping: 20 })
  const glow = useSpring(0, { stiffness: 100, damping: 15 })
  
  useEffect(() => {
    if (isListening) {
      scale.set(1 + amplitude * 0.3)
      glow.set(0.8)
    } else if (isSpeaking) {
      scale.set(1.1)
      glow.set(0.6)
    } else {
      scale.set(1)
      glow.set(0)
    }
  }, [isListening, isSpeaking, amplitude, scale, glow])
  
  const glowOpacity = useTransform(glow, [0, 1], [0, 0.6])
  
  return (
    <motion.div
      className="relative w-24 h-24"
      style={{ scale }}
    >
      {/* Glow exterior */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{
          background: isListening 
            ? 'radial-gradient(circle, #8B00FF 0%, transparent 70%)'
            : isSpeaking
              ? 'radial-gradient(circle, #FFD700 0%, transparent 70%)'
              : 'radial-gradient(circle, #FF1493 0%, transparent 70%)',
          opacity: glowOpacity,
        }}
      />
      
      {/* Anillos pulsantes */}
      {(isListening || isSpeaking) && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderColor: isListening ? '#8B00FF' : '#FFD700',
              }}
              animate={{
                scale: [1, 2, 2],
                opacity: [0.6, 0.2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}
      
      {/* Orbe central */}
      <motion.div
        className="absolute inset-2 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, 
            ${isListening ? '#8B00FF' : isSpeaking ? '#FFD700' : '#FF1493'} 0%, 
            #000000 80%)`,
          boxShadow: `0 0 30px ${isListening ? '#8B00FF' : isSpeaking ? '#FFD700' : '#FF1493'}40`,
        }}
        animate={isListening || isSpeaking ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Icono central */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isListening ? (
            <Mic className="w-8 h-8 text-white animate-pulse" />
          ) : isSpeaking ? (
            <Volume2 className="w-8 h-8 text-white animate-pulse" />
          ) : (
            <Bot className="w-8 h-8 text-white/80" />
          )}
        </div>
      </motion.div>
      
      {/* Partículas alrededor */}
      {(isListening || isSpeaking) && (
        <motion.div className="absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                backgroundColor: isListening ? '#8B00FF' : '#FFD700',
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: [0, Math.cos(i * Math.PI / 4) * 50],
                y: [0, Math.sin(i * Math.PI / 4) * 50],
                opacity: [1, 0],
                scale: [1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeOut',
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE DE MENSAJE
// ═══════════════════════════════════════════════════════════════

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser 
          ? 'bg-gradient-to-br from-violet-500 to-violet-700' 
          : 'bg-gradient-to-br from-amber-500 to-pink-500'
        }
      `}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>
      
      {/* Mensaje */}
      <div className={`
        max-w-[80%] px-4 py-3 rounded-2xl
        ${isUser 
          ? 'bg-violet-600/30 border border-violet-500/30 text-white' 
          : 'bg-gradient-to-br from-amber-500/20 to-pink-500/20 border border-amber-500/30 text-white'
        }
      `}>
        <p className="text-sm leading-relaxed">{message.content}</p>
        <p className="text-xs text-gray-400 mt-1">
          {message.timestamp.toLocaleTimeString('es-MX', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE DE COMANDOS SUGERIDOS
// ═══════════════════════════════════════════════════════════════

function SuggestedCommands({ 
  onCommand 
}: { 
  onCommand: (cmd: VoiceCommand) => void 
}) {
  return (
    <div className="p-4 border-t border-white/10">
      <p className="text-xs text-gray-400 mb-3">Comandos sugeridos:</p>
      <div className="flex flex-wrap gap-2">
        {VOICE_COMMANDS.slice(0, 4).map((cmd) => (
          <motion.button
            key={cmd.action}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCommand(cmd)}
            className="
              px-3 py-1.5 rounded-full text-xs
              bg-gradient-to-r from-violet-500/20 to-pink-500/20
              border border-violet-500/30
              text-white/80 hover:text-white
              transition-colors
            "
          >
            {cmd.command}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function IACollaborative({
  className = '',
  isOpen = false,
  onToggle,
  onCommand,
  systemContext,
}: IACollaborativeProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy CHRONOS AI, tu asistente financiero. Puedo ayudarte a navegar el sistema, consultar datos y ejecutar acciones. ¿En qué puedo ayudarte?',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [amplitude, setAmplitude] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  
  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Inicializar Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'es-MX'
        
        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('')
          
          // Simular amplitud basada en confianza
          const confidence = event.results[0]?.[0]?.confidence || 0.5
          setAmplitude(confidence)
          
          if (event.results[0]?.isFinal) {
            handleUserInput(transcript)
          }
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
          setAmplitude(0)
        }
        
        recognitionRef.current.onerror = (event) => {
          logger.error('Speech recognition error', event.error, { context: 'IACollaborative' })
          setIsListening(false)
          setAmplitude(0)
        }
      }
      
      // Speech Synthesis
      synthRef.current = window.speechSynthesis
    }
    
    return () => {
      recognitionRef.current?.stop()
      synthRef.current?.cancel()
    }
  }, [])
  
  // Procesar comando de voz
  const matchVoiceCommand = useCallback((input: string): VoiceCommand | null => {
    const normalizedInput = input.toLowerCase().trim()
    
    for (const cmd of VOICE_COMMANDS) {
      if (normalizedInput.includes(cmd.command.toLowerCase())) {
        return cmd
      }
    }
    return null
  }, [])
  
  // Generar respuesta del asistente
  const generateResponse = useCallback(async (input: string): Promise<string> => {
    const matchedCommand = matchVoiceCommand(input)
    
    if (matchedCommand) {
      onCommand?.(matchedCommand.command, matchedCommand.action)
      
      switch (matchedCommand.action) {
        case 'show_capital':
          return `El capital total del sistema es ${
            new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
            }).format(systemContext?.capitalTotal || 0)
          }. ¿Necesitas más detalles sobre algún banco específico?`
        
        case 'navigate_ventas':
          return 'Navegando al panel de ventas. Ahí podrás ver todas las transacciones recientes y crear nuevas ventas.'
        
        case 'navigate_bancos':
          return 'Navegando al panel de bancos. Podrás ver el estado de las 7 bóvedas del sistema.'
        
        case 'create_venta':
          return 'Abriendo el formulario de nueva venta. Recuerda que el sistema distribuirá automáticamente: costo a Bóveda Monte, fletes al banco de Fletes, y utilidades al fondo correspondiente.'
        
        case 'system_status':
          return `Estado del sistema: Capital total ${
            new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
            }).format(systemContext?.capitalTotal || 0)
          }. ${systemContext?.alertas?.length || 0} alertas pendientes. ${
            systemContext?.ultimasVentas || 0
          } ventas en las últimas 24 horas.`
        
        case 'show_alerts':
          if (systemContext?.alertas?.length) {
            return `Tienes ${systemContext.alertas.length} alertas: ${systemContext.alertas.join(', ')}`
          }
          return 'No hay alertas pendientes. El sistema está funcionando correctamente.'
        
        case 'show_chart_utilidades':
          return 'Mostrando gráfica de utilidades. Puedes ver la tendencia de ganancias de los últimos 12 meses.'
        
        case 'close':
          onToggle?.()
          return 'Hasta luego. Estaré aquí cuando me necesites.'
        
        default:
          return 'Entendido. Ejecutando comando...'
      }
    }
    
    // Respuestas contextuales si no hay comando
    const lowerInput = input.toLowerCase()
    
    if (lowerInput.includes('hola') || lowerInput.includes('buenos')) {
      return '¡Hola! ¿En qué puedo ayudarte hoy? Puedo mostrarte el capital, navegar a diferentes paneles, o ejecutar acciones.'
    }
    
    if (lowerInput.includes('ayuda') || lowerInput.includes('comandos')) {
      return `Puedo ejecutar estos comandos: ${VOICE_COMMANDS.map(c => c.command).join(', ')}. ¿Cuál te gustaría usar?`
    }
    
    if (lowerInput.includes('gracias')) {
      return '¡De nada! Estoy aquí para ayudarte con la gestión financiera de CHRONOS.'
    }
    
    return 'Entiendo. ¿Podrías ser más específico? Puedo ayudarte con capital, ventas, bancos, alertas y más.'
  }, [matchVoiceCommand, onCommand, onToggle, systemContext])
  
  // Hablar respuesta
  const speakResponse = useCallback((text: string) => {
    if (!voiceEnabled || !synthRef.current) return
    
    synthRef.current.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-MX'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    synthRef.current.speak(utterance)
  }, [voiceEnabled])
  
  // Manejar input del usuario
  const handleUserInput = useCallback(async (input: string) => {
    if (!input.trim()) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsProcessing(true)
    
    try {
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const response = await generateResponse(input)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, assistantMessage])
      speakResponse(response)
      
    } catch (error) {
      logger.error('Error generating response', error, { context: 'IACollaborative' })
    } finally {
      setIsProcessing(false)
    }
  }, [generateResponse, speakResponse])
  
  // Toggle escucha
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }
  
  // Toggle voz
  const toggleVoice = () => {
    if (isSpeaking) {
      synthRef.current?.cancel()
      setIsSpeaking(false)
    }
    setVoiceEnabled(!voiceEnabled)
  }
  
  // Manejar comando sugerido
  const handleSuggestedCommand = (cmd: VoiceCommand) => {
    handleUserInput(cmd.command)
  }
  
  // Manejar submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleUserInput(inputValue)
  }
  
  if (!isOpen) {
    return (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-br from-violet-600 to-pink-600
          shadow-lg shadow-violet-500/30
          flex items-center justify-center
          border border-white/20
          ${className}
        `}
      >
        <Sparkles className="w-6 h-6 text-white" />
      </motion.button>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`
        fixed z-50
        ${isExpanded 
          ? 'inset-4' 
          : 'bottom-6 right-6 w-[400px] h-[600px]'
        }
        bg-black/90 backdrop-blur-xl
        border border-white/10
        rounded-2xl
        shadow-2xl shadow-violet-500/20
        flex flex-col
        overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="
        flex items-center justify-between
        px-4 py-3
        border-b border-white/10
        bg-gradient-to-r from-violet-500/10 to-pink-500/10
      ">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">CHRONOS AI</h3>
            <p className="text-xs text-gray-400">
              {isListening ? 'Escuchando...' : isSpeaking ? 'Hablando...' : 'Asistente activo'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-lg transition-colors ${
              voiceEnabled 
                ? 'bg-violet-500/20 text-violet-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Voice Orb (cuando está escuchando) */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-center py-6 bg-gradient-to-b from-violet-500/10 to-transparent"
          >
            <VoiceOrb 
              isListening={isListening} 
              isSpeaking={isSpeaking}
              amplitude={amplitude}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-gray-400"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Procesando...</span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Comandos sugeridos */}
      <SuggestedCommands onCommand={handleSuggestedCommand} />
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleListening}
            className={`
              p-3 rounded-full transition-all
              ${isListening 
                ? 'bg-violet-500 text-white animate-pulse' 
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }
            `}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe o usa el micrófono..."
            className="
              flex-1 px-4 py-3
              bg-white/5 border border-white/10
              rounded-xl
              text-white placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-violet-500/50
              transition-all
            "
          />
          
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="
              p-3 rounded-full
              bg-gradient-to-r from-violet-500 to-pink-500
              text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:shadow-lg hover:shadow-violet-500/30
              transition-all
            "
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  )
}
