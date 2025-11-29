'use client'

/**
 * ZeroChatWidget - Widget Conversacional con Avatar 3D Spline
 * 
 * Este componente provee una interfaz de chat con:
 * - Avatar 3D de Spline miniatura con paleta Negro/Plata/Blanco
 * - Ojos rojos rasgados horizontales
 * - Historial de mensajes con animaciones
 * - Input de texto y voz
 * - Estados visuales según la conversación
 * - Efecto de escritura para respuestas
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Volume2,
  VolumeX,
  Trash2,
  Download,
  Settings,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { ZeroState } from './ZeroAvatar'

// Cargar Spline dinámicamente (solo cliente)
const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false })

// URL del modelo Spline para el WIDGET (diferente al Avatar principal)
const SPLINE_WIDGET_URL = 'https://prod.spline.design/xdhWZ6ngBTNQdXGg/scene.splinecode'

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  status?: 'pending' | 'complete' | 'error'
  metadata?: {
    processingTime?: number
    tokens?: number
    model?: string
  }
}

interface ZeroChatWidgetProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  onVoiceInput?: (transcript: string) => void
  onClearChat?: () => void
  onExportChat?: () => void
  state: ZeroState
  isListening?: boolean
  isSpeaking?: boolean
  onToggleListening?: () => void
  onToggleSpeaking?: () => void
  className?: string
  minimized?: boolean
  onToggleMinimize?: () => void
  placeholder?: string
  maxHeight?: string
  showAvatar?: boolean
  showTimestamps?: boolean
  showMetadata?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMACIONES
// ═══════════════════════════════════════════════════════════════════════════════

const containerVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20, 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
}

const messageVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20,
    scale: 0.9,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  exit: { 
    opacity: 0,
    x: 20,
    scale: 0.9,
    transition: { duration: 0.15 },
  },
}

const minimizedVariants: Variants = {
  minimized: {
    height: 60,
    transition: { duration: 0.3 },
  },
  expanded: {
    height: 'auto',
    transition: { duration: 0.3 },
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE MENSAJE INDIVIDUAL
// ═══════════════════════════════════════════════════════════════════════════════

interface MessageBubbleProps {
  message: ChatMessage
  showTimestamp: boolean
  showMetadata: boolean
  state: ZeroState
}

function MessageBubble({ message, showTimestamp, showMetadata, state }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  
  // Colores según el rol y estado
  const bubbleColors = useMemo(() => {
    if (isUser) {
      return 'bg-blue-600/80 border-blue-500/50'
    }
    if (isSystem) {
      return 'bg-amber-600/20 border-amber-500/30'
    }
    // Assistant colors basados en estado
    switch (state) {
      case 'combat': return 'bg-red-600/20 border-red-500/30'
      case 'error': return 'bg-orange-600/20 border-orange-500/30'
      case 'success': return 'bg-green-600/20 border-green-500/30'
      case 'processing': return 'bg-purple-600/20 border-purple-500/30'
      default: return 'bg-slate-800/80 border-slate-700/50'
    }
  }, [isUser, isSystem, state])
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
    })
  }
  
  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div 
        className={`
          max-w-[85%] px-4 py-3 rounded-2xl border backdrop-blur-sm
          ${bubbleColors}
          ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}
        `}
      >
        {/* Indicador de rol para sistema */}
        {isSystem && (
          <div className="text-xs text-amber-400/80 font-mono mb-1">
            [SISTEMA]
          </div>
        )}
        
        {/* Contenido del mensaje */}
        <p className={`
          text-sm leading-relaxed
          ${isUser ? 'text-white' : 'text-slate-200'}
          ${message.status === 'pending' ? 'animate-pulse' : ''}
        `}>
          {message.content}
        </p>
        
        {/* Footer con timestamp y metadata */}
        <div className="flex items-center justify-between mt-2 gap-3">
          {showTimestamp && (
            <span className="text-xs text-slate-400/70">
              {formatTime(message.timestamp)}
            </span>
          )}
          
          {showMetadata && message.metadata && (
            <div className="flex items-center gap-2 text-xs text-slate-500/70 font-mono">
              {message.metadata.processingTime && (
                <span>{message.metadata.processingTime}ms</span>
              )}
              {message.metadata.tokens && (
                <span>{message.metadata.tokens} tok</span>
              )}
            </div>
          )}
          
          {/* Estado del mensaje */}
          {message.status === 'pending' && (
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          
          {message.status === 'error' && (
            <span className="text-xs text-red-400">Error</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INDICADOR DE ESTADO DE ZERO
// ═══════════════════════════════════════════════════════════════════════════════

function ZeroStateIndicator({ state, isListening, isSpeaking }: { 
  state: ZeroState
  isListening: boolean
  isSpeaking: boolean 
}) {
  const stateConfig = useMemo(() => ({
    idle: { color: '#3b82f6', label: 'LISTO', pulse: false },
    listening: { color: '#06b6d4', label: 'ESCUCHANDO', pulse: true },
    speaking: { color: '#10b981', label: 'HABLANDO', pulse: true },
    processing: { color: '#8b5cf6', label: 'PROCESANDO', pulse: true },
    combat: { color: '#ef4444', label: 'ALERTA', pulse: true },
    success: { color: '#22c55e', label: 'COMPLETADO', pulse: false },
    error: { color: '#f97316', label: 'ERROR', pulse: true },
  }), [])
  
  const config = stateConfig[state]
  
  return (
    <div className="flex items-center gap-2">
      {/* Indicador de estado visual */}
      <div className="relative">
        <div 
          className={`w-3 h-3 rounded-full ${config.pulse ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: config.color }}
        />
        {config.pulse && (
          <div 
            className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75"
            style={{ backgroundColor: config.color }}
          />
        )}
      </div>
      
      {/* Etiqueta de estado */}
      <span 
        className="text-xs font-mono font-medium tracking-wider"
        style={{ color: config.color }}
      >
        {config.label}
      </span>
      
      {/* Iconos de audio */}
      <div className="flex gap-1 ml-2">
        {isListening && (
          <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        )}
        {isSpeaking && (
          <Volume2 className="w-3.5 h-3.5 text-green-400 animate-pulse" />
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BARRA DE INPUT
// ═══════════════════════════════════════════════════════════════════════════════

interface InputBarProps {
  onSend: (message: string) => void
  onToggleListening?: () => void
  isListening: boolean
  disabled?: boolean
  placeholder: string
  state: ZeroState
}

function InputBar({ 
  onSend, 
  onToggleListening, 
  isListening, 
  disabled, 
  placeholder,
  state, 
}: InputBarProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }, [input, disabled, onSend])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])
  
  // Color del borde según estado
  const borderColor = useMemo(() => {
    switch (state) {
      case 'combat': return 'focus-within:border-red-500/50'
      case 'error': return 'focus-within:border-orange-500/50'
      case 'success': return 'focus-within:border-green-500/50'
      case 'listening': return 'focus-within:border-cyan-500/50'
      default: return 'focus-within:border-blue-500/50'
    }
  }, [state])
  
  return (
    <form 
      onSubmit={handleSubmit}
      className={`
        flex items-center gap-2 p-3 
        bg-slate-900/80 border-t border-slate-700/50
        ${borderColor}
      `}
    >
      {/* Botón de voz */}
      {onToggleListening && (
        <button
          type="button"
          onClick={onToggleListening}
          disabled={disabled}
          className={`
            p-2 rounded-full transition-all duration-200
            ${isListening 
              ? 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/50' 
              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      )}
      
      {/* Input de texto */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? '🎤 Escuchando...' : placeholder}
        disabled={disabled || isListening}
        className={`
          flex-1 px-4 py-2 
          bg-slate-800/50 border border-slate-700/50 rounded-xl
          text-white placeholder-slate-500
          focus:outline-none focus:border-blue-500/50
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
        `}
      />
      
      {/* Botón de enviar */}
      <button
        type="submit"
        disabled={!input.trim() || disabled || isListening}
        className={`
          p-2 rounded-full transition-all duration-200
          ${input.trim() 
            ? 'bg-blue-600 text-white hover:bg-blue-500' 
            : 'bg-slate-700/50 text-slate-500'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR MINIATURA CON SPLINE
// ═══════════════════════════════════════════════════════════════════════════════

interface SplineAvatarMiniProps {
  state: ZeroState
  size?: number
}

function SplineAvatarMini({ state, size = 48 }: SplineAvatarMiniProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Colores de ojos según estado - SIEMPRE ROJO como especificado
  const eyeColor = useMemo(() => {
    switch (state) {
      case 'combat':
      case 'error':
        return '#ff0000' // Rojo intenso máximo
      case 'success':
        return '#ef4444' // Rojo
      case 'listening':
        return '#ef4444' // Rojo
      case 'speaking':
        return '#ff3333' // Rojo brillante
      case 'processing':
        return '#dc2626' // Rojo
      default:
        return '#ef4444' // Rojo por defecto
    }
  }, [state])

  // Intensidad del glow según estado
  const glowIntensity = useMemo(() => {
    switch (state) {
      case 'combat': return 1.5
      case 'speaking': return 1.2
      case 'processing': return 1.0
      default: return 0.8
    }
  }, [state])
  
  return (
    <div 
      className="relative overflow-hidden"
      style={{ 
        width: size, 
        height: size,
        borderRadius: '12px',
        background: '#000000',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: `
          0 0 ${20 * glowIntensity}px rgba(239, 68, 68, ${0.3 * glowIntensity}),
          0 4px 12px rgba(0,0,0,0.8),
          inset 0 0 30px rgba(0,0,0,0.9)
        `,
      }}
    >
      {/* Contenedor del Spline - SIN FILTROS, modelo original */}
      <div 
        className="absolute inset-0"
        style={{ 
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
          transform: 'scale(1.3)', // Ajustar escala para que se vea bien
          transformOrigin: 'center center',
        }}
      >
        <Spline
          scene={SPLINE_WIDGET_URL}
          onLoad={() => setIsLoaded(true)}
          style={{ 
            width: '100%', 
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      </div>
      
      {/* OJOS ROJOS RASGADOS HORIZONTALES - Superpuestos al modelo */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {/* Ojo principal - línea roja horizontal rasgada */}
        <motion.div
          animate={{
            scaleX: state === 'combat' ? [1, 0.6, 1] : state === 'speaking' ? [1, 0.85, 1] : [1, 0.92, 1],
            opacity: state === 'combat' ? [1, 0.7, 1] : [1, 0.85, 1],
          }}
          transition={{
            duration: state === 'combat' ? 0.2 : state === 'speaking' ? 0.8 : 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
          style={{
            width: size * 0.55,
            height: size * 0.06,
            backgroundColor: eyeColor,
            borderRadius: '100px',
            boxShadow: `
              0 0 ${size * 0.15 * glowIntensity}px ${eyeColor},
              0 0 ${size * 0.3 * glowIntensity}px ${eyeColor},
              0 0 ${size * 0.5 * glowIntensity}px ${eyeColor}60,
              inset 0 0 ${size * 0.05}px rgba(255,255,255,0.8)
            `,
          }}
        >
          {/* Efecto de scan Cylon */}
          <motion.div
            animate={{ x: ['-120%', '120%'] }}
            transition={{
              duration: state === 'combat' ? 0.8 : 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-0 overflow-hidden rounded-full"
          >
            <div 
              className="absolute inset-y-0 w-1/4"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
              }}
            />
          </motion.div>
          
          {/* Núcleo brillante central */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: size * 0.08,
              height: size * 0.04,
              background: 'radial-gradient(ellipse, #ffffff 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
        </motion.div>
      </div>
      
      {/* Efecto de glitch en modo combate */}
      {state === 'combat' && (
        <motion.div
          animate={{ 
            opacity: [0, 0.3, 0, 0.2, 0],
            x: [-2, 2, -1, 1, 0],
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 30%, rgba(255,0,0,0.1) 50%, transparent 70%)',
            mixBlendMode: 'screen',
          }}
        />
      )}
      
      {/* Borde luminoso sutil */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          border: `1px solid rgba(239, 68, 68, ${0.2 * glowIntensity})`,
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
        }}
      />
      
      {/* Loader mientras carga Spline */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <motion.div
            animate={{ 
              scaleX: [0.3, 1, 0.3],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: size * 0.4,
              height: size * 0.05,
              backgroundColor: '#ef4444',
              borderRadius: '100px',
              boxShadow: '0 0 15px #ef4444, 0 0 30px #ef4444',
            }}
          />
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER DEL CHAT
// ═══════════════════════════════════════════════════════════════════════════════

interface ChatHeaderProps {
  state: ZeroState
  isListening: boolean
  isSpeaking: boolean
  minimized: boolean
  onToggleMinimize?: () => void
  onToggleSpeaking?: () => void
  onClearChat?: () => void
  onExportChat?: () => void
}

function ChatHeader({
  state,
  isListening,
  isSpeaking,
  minimized,
  onToggleMinimize,
  onToggleSpeaking,
  onClearChat,
  onExportChat,
}: ChatHeaderProps) {
  return (
    <div 
      className="flex items-center justify-between p-3 border-b border-slate-700/50"
      style={{
        background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
      }}
    >
      {/* Info de Zero */}
      <div className="flex items-center gap-3">
        {/* Avatar Spline miniatura con ojos rojos */}
        <SplineAvatarMini state={state} size={44} />
        
        {/* Nombre y estado */}
        <div className="flex flex-col">
          <span 
            className="text-sm font-bold tracking-wider"
            style={{
              background: 'linear-gradient(90deg, #ffffff 0%, #c0c0c0 50%, #808080 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ZERO
          </span>
          <ZeroStateIndicator 
            state={state} 
            isListening={isListening} 
            isSpeaking={isSpeaking} 
          />
        </div>
      </div>
      
      {/* Controles */}
      <div className="flex items-center gap-1">
        {/* Toggle audio */}
        {onToggleSpeaking && (
          <button
            onClick={onToggleSpeaking}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
            title={isSpeaking ? 'Silenciar' : 'Activar voz'}
          >
            {isSpeaking ? (
              <Volume2 className="w-4 h-4 text-green-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}
        
        {/* Export chat */}
        {onExportChat && (
          <button
            onClick={onExportChat}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
            title="Exportar conversación"
          >
            <Download className="w-4 h-4 text-slate-400" />
          </button>
        )}
        
        {/* Clear chat */}
        {onClearChat && (
          <button
            onClick={onClearChat}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
            title="Limpiar chat"
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
          </button>
        )}
        
        {/* Minimize/Maximize */}
        {onToggleMinimize && (
          <button
            onClick={onToggleMinimize}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
            title={minimized ? 'Expandir' : 'Minimizar'}
          >
            {minimized ? (
              <Maximize2 className="w-4 h-4 text-slate-400" />
            ) : (
              <Minimize2 className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL EXPORTADO
// ═══════════════════════════════════════════════════════════════════════════════

export function ZeroChatWidget({
  messages,
  onSendMessage,
  onVoiceInput,
  onClearChat,
  onExportChat,
  state = 'idle',
  isListening = false,
  isSpeaking = false,
  onToggleListening,
  onToggleSpeaking,
  className = '',
  minimized = false,
  onToggleMinimize,
  placeholder = 'Escribe un mensaje a Zero...',
  maxHeight = '500px',
  showAvatar = true,
  showTimestamps = true,
  showMetadata = false,
}: ZeroChatWidgetProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll al último mensaje
  useEffect(() => {
    if (!minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, minimized])
  
  // Determinar si está procesando
  const isProcessing = state === 'processing' || 
    messages.some(m => m.status === 'pending')
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`
        flex flex-col 
        backdrop-blur-xl
        rounded-2xl
        overflow-hidden
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0f0f0f 100%)',
        border: '1px solid rgba(192, 192, 192, 0.2)',
        boxShadow: `
          0 25px 50px -12px rgba(0, 0, 0, 0.8),
          0 0 30px rgba(239, 68, 68, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.05)
        `,
      }}
    >
      {/* Header */}
      <ChatHeader
        state={state}
        isListening={isListening}
        isSpeaking={isSpeaking}
        minimized={minimized}
        onToggleMinimize={onToggleMinimize}
        onToggleSpeaking={onToggleSpeaking}
        onClearChat={onClearChat}
        onExportChat={onExportChat}
      />
      
      {/* Contenido (oculto si minimizado) */}
      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col"
          >
            {/* Área de mensajes */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-1"
              style={{ 
                maxHeight,
                background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 50%, #111111 100%)',
              }}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  {/* Avatar Spline grande con ojos rojos */}
                  <div className="mb-6">
                    <SplineAvatarMini state={state} size={80} />
                  </div>
                  
                  {/* Texto con estilo metálico */}
                  <p 
                    className="text-sm font-medium"
                    style={{
                      background: 'linear-gradient(90deg, #c0c0c0 0%, #ffffff 50%, #c0c0c0 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Inicia una conversación con Zero
                  </p>
                  <p className="text-slate-600 text-xs mt-2">
                    Escribe o usa el micrófono para hablar
                  </p>
                  
                  {/* Línea decorativa roja */}
                  <div 
                    className="mt-4 w-24 h-0.5 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
                      boxShadow: '0 0 10px #ef4444',
                    }}
                  />
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      showTimestamp={showTimestamps}
                      showMetadata={showMetadata}
                      state={state}
                    />
                  ))}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input bar */}
            <InputBar
              onSend={onSendMessage}
              onToggleListening={onToggleListening}
              isListening={isListening}
              disabled={isProcessing}
              placeholder={placeholder}
              state={state}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export type { ZeroChatWidgetProps }
export default ZeroChatWidget
