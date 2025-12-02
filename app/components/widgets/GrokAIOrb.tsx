'use client'

/**
 * 🤖 GROK AI ORB WIDGET - Premium 2025
 * 
 * Widget flotante estilo Grok.com:
 * - Orb circular bottom-right
 * - Gradiente rojo Tesla → negro
 * - Pulse animation sutil
 * - Expande a chat panel completo
 * - Voice input con waveform
 * - Tool calling activo
 */

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  Zap,
  Bot,
  User,
  Loader2,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface GrokAIOrbProps {
  className?: string
  onToolCall?: (tool: string, params: Record<string, unknown>) => void
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Waveform Animation
// ═══════════════════════════════════════════════════════════════════════════════

const WaveformAnimation = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex items-center justify-center gap-0.5 h-4">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-white rounded-full"
          animate={isActive ? {
            height: [4, 16, 4],
          } : { height: 4 }}
          transition={{
            duration: 0.5,
            repeat: isActive ? Infinity : 0,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Message Bubble
// ═══════════════════════════════════════════════════════════════════════════════

const MessageBubble = ({ message }: { message: Message }) => {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-3 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        isUser 
          ? 'bg-white/10' 
          : 'bg-gradient-to-br from-[#E31911] to-[#8B0000]'
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-white/70" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3',
        isUser 
          ? 'bg-white/10 text-white' 
          : 'bg-[#111] border border-white/5 text-white/90'
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
          {message.isStreaming && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-2 h-4 bg-white/50 ml-1"
            />
          )}
        </p>
        
        {/* Actions */}
        {!isUser && !message.isStreaming && (
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-white/40" />
              )}
            </button>
            <button className="p-1 rounded hover:bg-white/10 transition-colors">
              <RefreshCw className="w-3.5 h-3.5 text-white/40" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Quick Actions
// ═══════════════════════════════════════════════════════════════════════════════

const quickActions = [
  { label: 'Resumen del día', prompt: 'Dame un resumen de las operaciones del día' },
  { label: 'Stock bajo', prompt: '¿Qué productos tienen stock bajo?' },
  { label: 'Ventas pendientes', prompt: '¿Cuántas ventas pendientes hay?' },
  { label: 'Crear venta', prompt: 'Quiero registrar una nueva venta' },
  { label: 'Transferencia', prompt: 'Necesito hacer una transferencia entre bancos' },
]

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function GrokAIOrb({ className, onToolCall }: GrokAIOrbProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente IA. Puedo ayudarte a crear ventas, órdenes, transferencias, analizar datos y más. ¿En qué puedo ayudarte?',
      timestamp: new Date(),
    },
  ])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response (replace with actual API call)
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages(prev => [...prev, assistantMessage])

    // Simulate streaming response
    const response = 'Entendido. Estoy procesando tu solicitud. En un sistema real, aquí conectaría con la API de IA para ejecutar la acción correspondiente.'
    
    for (let i = 0; i <= response.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20))
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: response.slice(0, i) }
            : msg
        )
      )
    }

    setMessages(prev =>
      prev.map(msg =>
        msg.id === assistantMessage.id
          ? { ...msg, isStreaming: false }
          : msg
      )
    )

    setIsLoading(false)
  }, [input, isLoading])

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
    handleSend()
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    // Implement speech recognition here
  }

  // Orb hover animation
  const orbScale = useMotionValue(1)
  const springScale = useSpring(orbScale, { stiffness: 300, damping: 20 })

  return (
    <>
      {/* Floating Orb */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            onHoverStart={() => orbScale.set(1.05)}
            onHoverEnd={() => orbScale.set(1)}
            className={cn(
              'fixed bottom-6 right-6 z-50',
              'w-14 h-14 rounded-full',
              'bg-gradient-to-br from-[#E31911] via-[#8B0000] to-black',
              'flex items-center justify-center',
              'shadow-2xl shadow-red-500/30',
              'cursor-pointer',
              className
            )}
            style={{ scale: springScale }}
          >
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-[#E31911]/30"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Icon */}
            <Sparkles className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed z-50',
              isExpanded 
                ? 'inset-4 md:inset-10' 
                : 'bottom-6 right-6 w-96 h-[600px] max-h-[80vh]',
              'bg-[#050505] border border-white/10 rounded-2xl',
              'flex flex-col overflow-hidden',
              'shadow-2xl shadow-black/50'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E31911] to-[#8B0000] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Asistente IA</h3>
                  <p className="text-xs text-white/40">Grok-powered • Online</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4 text-white/60" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-white/60" />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-white/40 mb-2">Sugerencias</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="px-3 py-1.5 text-xs text-white/70 bg-white/5 hover:bg-white/10 
                                 rounded-full border border-white/5 transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-black/30">
              <div className="relative flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje..."
                    disabled={isLoading}
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl
                               text-sm text-white placeholder-white/30 outline-none
                               focus:border-white/20 transition-colors disabled:opacity-50"
                  />
                  
                  {/* Voice button inside input */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleListening}
                    className={cn(
                      'absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors',
                      isListening 
                        ? 'bg-[#E31911] text-white' 
                        : 'text-white/40 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {isListening ? (
                      <WaveformAnimation isActive={isListening} />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>

                {/* Send button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    'p-3 rounded-xl transition-all',
                    input.trim() && !isLoading
                      ? 'bg-[#E31911] text-white shadow-lg shadow-red-500/20'
                      : 'bg-white/5 text-white/30'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>

              {/* Powered by */}
              <p className="text-center text-[10px] text-white/20 mt-2">
                Powered by Grok • Tool calling activo
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default GrokAIOrb
