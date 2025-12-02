/**
 * 🤖 BentoIAFullscreen - Panel IA Completo que cubre toda la interfaz
 * 
 * Panel de IA fullscreen con:
 * - Orbe 3D animado central (GLTF/Spline)
 * - Input de texto con autocompletado
 * - Reconocimiento y síntesis de voz avanzada
 * - Automatización completa del sistema mediante comandos naturales
 * - Historial de conversación con sugerencias
 * - Modo llamada para conversación continua
 * - Integración con Firebase y todos los módulos del sistema
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Send, Bot, Sparkles, Brain, Zap,
  MessageSquare, History, Settings, Maximize2, Minimize2,
  Volume2, VolumeX, RefreshCw, HelpCircle, ChevronRight,
  TrendingUp, Users, Package, Wallet, FileText, ShoppingCart,
  X, Phone, PhoneOff, PlusCircle, Download, Share2,
  Building2, Truck, DollarSign, BarChart3, Activity,
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useAppStore } from '@/app/lib/store/useAppStore'
import type { PanelId } from '@/app/types'
import { logger } from '@/app/lib/utils/logger'
import '@/app/types/speech-recognition'

// Tipos
type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'success' | 'error'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  action?: {
    type: string
    target: string
    executed: boolean
  }
}

// Componente del Orbe animado (CSS puro, sin dependencias 3D)
function AnimatedOrb({ 
  state, 
  audioLevel = 0,
  size = 'large', 
}: { 
  state: OrbState
  audioLevel?: number
  size?: 'small' | 'medium' | 'large'
}) {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-64 h-64',
  }

  const colorsByState = {
    idle: ['from-blue-500', 'via-purple-500', 'to-pink-500'],
    listening: ['from-green-400', 'via-blue-500', 'to-purple-500'],
    thinking: ['from-purple-500', 'via-pink-500', 'to-orange-500'],
    speaking: ['from-cyan-400', 'via-blue-500', 'to-purple-500'],
    success: ['from-green-400', 'via-emerald-500', 'to-teal-500'],
    error: ['from-red-400', 'via-pink-500', 'to-orange-500'],
  }

  const colors = colorsByState[state]

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Glow exterior */}
      <motion.div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${colors[0]} ${colors[1]} ${colors[2]} blur-3xl opacity-40`}
        animate={{
          scale: [1, 1.2 + audioLevel * 0.3, 1],
          opacity: [0.3, 0.5 + audioLevel * 0.2, 0.3],
        }}
        transition={{
          duration: state === 'idle' ? 4 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Anillo exterior */}
      <motion.div
        className={'absolute inset-0 rounded-full border-2 border-white/20'}
        animate={state !== 'idle' ? {
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Orbe principal */}
      <motion.div
        className={`relative w-full h-full rounded-full bg-gradient-to-br ${colors[0]} ${colors[1]} ${colors[2]} shadow-2xl`}
        animate={{
          scale: [1, 1.02 + audioLevel * 0.05, 1],
          rotate: state === 'thinking' ? [0, 360] : 0,
        }}
        transition={{
          scale: { duration: 0.5, repeat: Infinity },
          rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
        }}
        style={{
          boxShadow: `0 0 ${60 + audioLevel * 40}px ${colors[0].replace('from-', '').replace('-500', '')}`,
        }}
      >
        {/* Patrón interno */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
        
        {/* Reflejo */}
        <div className="absolute top-4 left-1/4 w-1/3 h-1/6 rounded-full bg-white/30 blur-sm" />

        {/* Centro */}
        <div className="absolute inset-0 flex items-center justify-center">
          {state === 'listening' && (
            <motion.div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 bg-white rounded-full"
                  animate={{ height: [12, 32, 12] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          )}
          
          {state === 'thinking' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="w-12 h-12 text-white" />
            </motion.div>
          )}
          
          {state === 'speaking' && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Volume2 className="w-12 h-12 text-white" />
            </motion.div>
          )}

          {state === 'idle' && size === 'large' && (
            <Sparkles className="w-16 h-16 text-white/80" />
          )}
        </div>
      </motion.div>

      {/* Partículas */}
      {state !== 'idle' && (
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white/60"
              initial={{ 
                x: '50%', 
                y: '50%',
                scale: 0,
              }}
              animate={{
                x: `${50 + Math.cos(i * 60 * Math.PI / 180) * 80}%`,
                y: `${50 + Math.sin(i * 60 * Math.PI / 180) * 80}%`,
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Quick Actions disponibles
const quickActions = [
  { icon: TrendingUp, label: 'Ventas de hoy', query: 'Muestra las ventas de hoy', color: 'from-green-500 to-emerald-600' },
  { icon: Users, label: 'Ver clientes', query: 'Dame un resumen de clientes', color: 'from-blue-500 to-cyan-600' },
  { icon: Wallet, label: 'Estado bancos', query: '¿Cuánto hay en los bancos?', color: 'from-purple-500 to-pink-600' },
  { icon: Package, label: 'Inventario', query: 'Estado del inventario', color: 'from-orange-500 to-red-600' },
  { icon: ShoppingCart, label: 'Nueva venta', query: 'Quiero crear una nueva venta', color: 'from-pink-500 to-rose-600' },
  { icon: FileText, label: 'Reportes', query: 'Generar reporte de ventas', color: 'from-indigo-500 to-purple-600' },
  { icon: Truck, label: 'Distribuidores', query: 'Ver distribuidores con deuda', color: 'from-yellow-500 to-orange-600' },
  { icon: BarChart3, label: 'Análisis IA', query: 'Analiza las tendencias de ventas', color: 'from-cyan-500 to-blue-600' },
]

// Componente de mensaje
function MessageBubble({ 
  message, 
  isLast,
  onSuggestionClick,
}: { 
  message: Message
  isLast: boolean
  onSuggestionClick?: (suggestion: string) => void
}) {
  const isUser = message.role === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`
        max-w-[85%] px-5 py-3.5 rounded-2xl text-sm whitespace-pre-line
        ${isUser 
          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-md shadow-lg shadow-blue-500/20' 
          : 'bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-bl-md'}
      `}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
            <div className="p-1 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Sparkles className="w-3 h-3 text-blue-400" />
            </div>
            <span className="text-xs font-medium text-blue-400">Chronos AI</span>
            {isLast && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs text-green-400"
              >
                ●
              </motion.span>
            )}
          </div>
        )}
        
        <p className="leading-relaxed">{message.content}</p>
        
        {/* Sugerencias */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-white/50 mb-2">Sugerencias:</p>
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((suggestion, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1"
                >
                  {suggestion}
                  <ChevronRight className="w-3 h-3" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-white/30 mt-2 text-right">
          {message.timestamp.toLocaleTimeString('es-MX', { 
            hour: '2-digit', 
            minute: '2-digit', 
          })}
        </p>
      </div>
    </motion.div>
  )
}

/**
 * Panel IA Fullscreen Principal
 */
export function BentoIAFullscreen() {
  // Estados
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isCallMode, setIsCallMode] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [voiceSupported, setVoiceSupported] = useState(false)

  // Referencias
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)

  // Store
  const { 
    setCurrentPanel, 
    setVoiceAgentStatus,
    ventas,
    clientes,
    distribuidores,
    bancos,
    productos,
  } = useAppStore()

  // Estado del orbe
  const orbState: OrbState = 
    isListening ? 'listening' :
    isProcessing ? 'thinking' :
    isSpeaking ? 'speaking' :
    error ? 'error' :
    'idle'

  // Inicializar servicios de voz
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Speech Recognition
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI()
      recognition.lang = 'es-MX'
      recognition.continuous = false
      recognition.interimResults = true

      recognition.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          setInput(finalTranscript)
          handleSendMessage(finalTranscript)
        }
      }

      recognition.onstart = () => {
        setIsListening(true)
        setVoiceAgentStatus('listening')
      }

      recognition.onend = () => {
        setIsListening(false)
        if (!isProcessing) setVoiceAgentStatus('idle')
      }

      recognition.onerror = (event) => {
        setError(`Error de voz: ${event.error}`)
        setIsListening(false)
      }

      recognitionRef.current = recognition
      setVoiceSupported(true)
    }

    // Speech Synthesis
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort()
      if (synthesisRef.current) synthesisRef.current.cancel()
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simular nivel de audio
  useEffect(() => {
    if (isListening || isSpeaking) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.2)
      }, 100)
      return () => clearInterval(interval)
    } else {
      setAudioLevel(0)
    }
  }, [isListening, isSpeaking])

  // Generar respuesta de IA (simulada - conectar con API real)
  const generateAIResponse = async (userMessage: string): Promise<{ content: string; suggestions: string[] }> => {
    const lowerMessage = userMessage.toLowerCase()

    // Detectar intención y generar respuesta
    if (lowerMessage.includes('venta') && (lowerMessage.includes('hoy') || lowerMessage.includes('dia'))) {
      const totalHoy = ventas.filter(v => {
        const fecha = new Date(v.fecha)
        const hoy = new Date()
        return fecha.toDateString() === hoy.toDateString()
      }).reduce((sum, v) => sum + v.precioTotalVenta, 0)

      return {
        content: `📊 **Ventas del día**\n\n• Total de operaciones: ${ventas.filter(v => new Date(v.fecha).toDateString() === new Date().toDateString()).length}\n• Monto total: $${totalHoy.toLocaleString('es-MX')}\n• Ticket promedio: $${ventas.length > 0 ? (totalHoy / ventas.length).toLocaleString('es-MX') : 0}\n\n¿Deseas ver más detalles o comparar con otro periodo?`,
        suggestions: ['Ver detalle', 'Comparar con ayer', 'Top productos', 'Exportar'],
      }
    }

    if (lowerMessage.includes('banco') || lowerMessage.includes('capital') || lowerMessage.includes('saldo')) {
      const totalCapital = bancos.reduce((sum, b) => sum + b.saldo, 0)
      const bancosInfo = bancos.map(b => `• **${b.nombre}**: $${b.saldo.toLocaleString('es-MX')}`).join('\n')

      return {
        content: `🏦 **Estado Financiero**\n\n${bancosInfo}\n\n💰 **Capital Total**: $${totalCapital.toLocaleString('es-MX')}\n\n¿Deseas ver movimientos o hacer una transferencia?`,
        suggestions: ['Ver movimientos', 'Hacer transferencia', 'Generar corte', 'Historial'],
      }
    }

    if (lowerMessage.includes('cliente')) {
      const conDeuda = clientes.filter(c => c.deudaTotal > 0)
      const deudaTotal = clientes.reduce((sum, c) => sum + c.deudaTotal, 0)

      return {
        content: `👥 **Resumen de Clientes**\n\n• Total clientes: ${clientes.length}\n• Clientes con deuda: ${conDeuda.length}\n• Deuda total por cobrar: $${deudaTotal.toLocaleString('es-MX')}\n\n¿Necesitas ver la lista de morosos o registrar un pago?`,
        suggestions: ['Ver morosos', 'Nuevo cliente', 'Registrar pago', 'Exportar'],
      }
    }

    if (lowerMessage.includes('inventario') || lowerMessage.includes('stock') || lowerMessage.includes('producto')) {
      const stockBajo = productos.filter(p => p.stockActual < 10)
      const valorTotal = productos.reduce((sum, p) => sum + (p.stockActual * p.valorUnitario), 0)

      return {
        content: `📦 **Estado del Inventario**\n\n• Total productos: ${productos.length}\n• Valor del inventario: $${valorTotal.toLocaleString('es-MX')}\n• Productos con stock bajo: ${stockBajo.length}\n\n${stockBajo.length > 0 ? '⚠️ Hay productos que necesitan reabastecimiento.' : '✅ Inventario en buen estado.'}\n\n¿Deseas ver los productos críticos?`,
        suggestions: ['Stock crítico', 'Reabastecer', 'Ver movimientos', 'Generar reporte'],
      }
    }

    if (lowerMessage.includes('distribuidor') || lowerMessage.includes('proveedor')) {
      const deudaTotal = distribuidores.reduce((sum, d) => sum + d.deudaTotal, 0)

      return {
        content: `🚚 **Resumen de Distribuidores**\n\n• Total distribuidores: ${distribuidores.length}\n• Deuda total a pagar: $${deudaTotal.toLocaleString('es-MX')}\n\n¿Deseas ver el detalle o registrar un pago?`,
        suggestions: ['Ver deudas', 'Registrar pago', 'Nueva orden', 'Crédito disponible'],
      }
    }

    if (lowerMessage.includes('nueva venta') || lowerMessage.includes('crear venta') || lowerMessage.includes('registrar venta')) {
      return {
        content: '📝 **Nueva Venta**\n\nPuedo ayudarte a crear una venta. Para eso necesito:\n\n1. **Cliente**: ¿A quién va dirigida?\n2. **Distribuidor**: ¿Quién es el distribuidor?\n3. **Productos**: ¿Qué productos incluir?\n\nPuedo abrir el formulario de venta o guiarte paso a paso. ¿Qué prefieres?',
        suggestions: ['Abrir formulario', 'Guíame paso a paso', 'Ver últimas ventas'],
      }
    }

    if (lowerMessage.includes('ir a') || lowerMessage.includes('abrir') || lowerMessage.includes('muestra')) {
      const panelMap: Record<string, PanelId> = {
        dashboard: 'dashboard',
        ventas: 'ventas',
        clientes: 'clientes',
        distribuidores: 'distribuidores',
        bancos: 'bancos',
        almacen: 'almacen',
        almacén: 'almacen',
        reportes: 'reportes',
        ordenes: 'ordenes_compra',
      }

      for (const [key, panel] of Object.entries(panelMap)) {
        if (lowerMessage.includes(key)) {
          setCurrentPanel(panel)
          return {
            content: `🧭 Navegando al panel de **${panel.replace('_', ' ').toUpperCase()}**...\n\nYa puedes ver la información actualizada.`,
            suggestions: ['Ver resumen', 'Crear nuevo', 'Exportar datos'],
          }
        }
      }
    }

    if (lowerMessage.includes('reporte') || lowerMessage.includes('exportar')) {
      return {
        content: '📊 **Generación de Reportes**\n\nPuedo generar varios tipos de reportes:\n\n• **Ventas**: Diario, semanal, mensual\n• **Financiero**: Estado de bancos, flujo de caja\n• **Inventario**: Stock actual, movimientos\n• **Clientes**: Estado de cuenta, morosos\n\n¿Cuál necesitas?',
        suggestions: ['Reporte de ventas', 'Estado financiero', 'Inventario', 'Clientes morosos'],
      }
    }

    if (lowerMessage.includes('hola') || lowerMessage.includes('hey') || lowerMessage.includes('buenos')) {
      const hora = new Date().getHours()
      const saludo = hora < 12 ? '¡Buenos días!' : hora < 18 ? '¡Buenas tardes!' : '¡Buenas noches!'

      return {
        content: `${saludo} 👋\n\nSoy **Chronos**, tu asistente de IA para el sistema de gestión empresarial.\n\n¿En qué puedo ayudarte hoy? Puedo:\n\n📊 Consultar datos de ventas, clientes, inventario\n📝 Crear ventas, órdenes y registros\n🏦 Gestionar bancos y transferencias\n📈 Generar reportes y análisis\n🧭 Navegar por el sistema`,
        suggestions: ['Resumen del día', 'Ver ventas', 'Estado bancos', 'Ayuda'],
      }
    }

    if (lowerMessage.includes('ayuda') || lowerMessage.includes('qué puedes') || lowerMessage.includes('comandos')) {
      return {
        content: '🤖 **Capacidades de Chronos AI**\n\n**📊 Consultas:**\n• "Ver ventas de hoy"\n• "¿Cuánto hay en bancos?"\n• "Clientes con deuda"\n• "Stock crítico"\n\n**📝 Crear registros:**\n• "Nueva venta"\n• "Nuevo cliente"\n• "Crear orden de compra"\n\n**🧭 Navegación:**\n• "Ir al panel de clientes"\n• "Abrir almacén"\n\n**📈 Reportes:**\n• "Generar reporte de ventas"\n• "Exportar a Excel"\n\n💡 Puedes hablarme naturalmente, entiendo español y el contexto de tu negocio.',
        suggestions: ['Ver ventas', 'Estado bancos', 'Inventario', 'Nueva venta'],
      }
    }

    // Respuesta por defecto
    return {
      content: '🤔 Entiendo tu consulta. Para darte información más precisa, puedes preguntarme sobre:\n\n• Ventas y facturación\n• Clientes y cobranza\n• Inventario y productos\n• Estado de bancos\n• Distribuidores y pagos\n\n¿Sobre qué tema te gustaría más información?',
      suggestions: ['Ver opciones', 'Ventas de hoy', 'Estado general', 'Ayuda'],
    }
  }

  // Enviar mensaje
  const handleSendMessage = useCallback(async (textOverride?: string) => {
    const messageText = textOverride || input
    if (!messageText.trim() || isProcessing) return

    setError(null)

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)
    setVoiceAgentStatus('thinking')

    try {
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))

      // Generar respuesta
      const response = await generateAIResponse(messageText)

      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
      }

      setMessages(prev => [...prev, aiMessage])
      setSuggestions(response.suggestions)

      // Hablar respuesta si está en modo llamada
      if (isCallMode && synthesisRef.current) {
        speakText(response.content.replace(/[*#_]/g, '').replace(/\n/g, '. '))
      }

    } catch (err) {
      setError('Error al procesar la solicitud')
      logger.error('AI Error', err as Error, { context: 'BentoIAFullscreen' })
    } finally {
      setIsProcessing(false)
      setVoiceAgentStatus('idle')
    }
  }, [input, isProcessing, isCallMode])

  // Sintetizar voz
  const speakText = useCallback((text: string) => {
    if (!synthesisRef.current) return

    synthesisRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-MX'
    utterance.rate = 1
    utterance.pitch = 1

    const voices = synthesisRef.current.getVoices()
    const spanishVoice = voices.find(v => v.lang.startsWith('es'))
    if (spanishVoice) utterance.voice = spanishVoice

    utterance.onstart = () => {
      setIsSpeaking(true)
      setVoiceAgentStatus('speaking')
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setVoiceAgentStatus('idle')
    }

    synthesisRef.current.speak(utterance)
  }, [])

  // Toggle micrófono
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Reconocimiento de voz no disponible')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      try {
        recognitionRef.current.start()
      } catch {
        // Ya puede estar escuchando
      }
    }
  }, [isListening])

  // Toggle modo llamada
  const toggleCallMode = useCallback(() => {
    if (isCallMode) {
      setIsCallMode(false)
      if (recognitionRef.current) recognitionRef.current.stop()
      if (synthesisRef.current) synthesisRef.current.cancel()
      setIsSpeaking(false)
      setIsListening(false)
    } else {
      setIsCallMode(true)
      if (messages.length === 0) {
        handleSendMessage('Hola')
      }
    }
  }, [isCallMode, messages.length, handleSendMessage])

  // Detener voz
  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // Limpiar chat
  const clearMessages = useCallback(() => {
    setMessages([])
    setSuggestions([])
    setError(null)
  }, [])

  // Seleccionar sugerencia
  const selectSuggestion = useCallback((suggestion: string) => {
    setInput(suggestion)
    handleSendMessage(suggestion)
  }, [handleSendMessage])

  return (
    <div className="relative w-full h-full min-h-screen bg-gradient-to-br from-gray-950 via-blue-950/30 to-purple-950/30 overflow-hidden">
      {/* Fondo animado */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"
          animate={{ 
            x: [0, 60, 0], 
            y: [0, -40, 0], 
            scale: [1, 1.2, 1], 
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"
          animate={{ 
            x: [0, -60, 0], 
            y: [0, 40, 0], 
            scale: [1, 1.3, 1], 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-radial from-blue-500/5 via-purple-500/5 to-transparent rounded-full"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <motion.div 
            className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10"
            whileHover={{ scale: 1.05 }}
          >
            <Brain className="w-7 h-7 text-blue-400" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Chronos AI Assistant
              <motion.div
                animate={isProcessing ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: isProcessing ? Infinity : 0, ease: 'linear' }}
              >
                <Sparkles className="w-5 h-5 text-blue-400" />
              </motion.div>
            </h1>
            <p className="text-sm text-white/50">
              Asistente inteligente • Puedo analizar datos, generar predicciones y automatizar tareas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Indicador de estado */}
          <motion.div 
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              ${orbState === 'idle' ? 'bg-emerald-500/20 text-emerald-400' :
                orbState === 'listening' ? 'bg-blue-500/20 text-blue-400' :
                orbState === 'thinking' ? 'bg-purple-500/20 text-purple-400' :
                orbState === 'speaking' ? 'bg-cyan-500/20 text-cyan-400' :
                'bg-red-500/20 text-red-400'}
            `}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div 
              className={`w-2.5 h-2.5 rounded-full ${
                orbState === 'idle' ? 'bg-emerald-500' :
                orbState === 'listening' ? 'bg-blue-500' :
                orbState === 'thinking' ? 'bg-purple-500' :
                orbState === 'speaking' ? 'bg-cyan-500' :
                'bg-red-500'
              }`}
              animate={orbState !== 'idle' ? { 
                scale: [1, 1.4, 1], 
                opacity: [1, 0.6, 1], 
              } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <span>
              {orbState === 'idle' && 'Listo'}
              {orbState === 'listening' && 'Escuchando...'}
              {orbState === 'thinking' && 'Procesando...'}
              {orbState === 'speaking' && 'Hablando...'}
              {orbState === 'error' && 'Error'}
            </span>
          </motion.div>

          {/* Botón modo llamada */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleCallMode}
            className={`
              p-3 rounded-xl transition-all flex items-center gap-2
              ${isCallMode 
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'}
            `}
            title={isCallMode ? 'Terminar llamada' : 'Iniciar llamada de voz'}
          >
            {isCallMode ? <PhoneOff className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            <span className="text-sm font-medium">{isCallMode ? 'Terminar' : 'Llamada'}</span>
          </motion.button>

          {/* Toggle historial */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHistory(!showHistory)}
            className={`p-3 rounded-xl transition-all ${showHistory ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            <History className="w-5 h-5" />
          </motion.button>

          {/* Limpiar */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearMessages}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Limpiar conversación"
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>

          {/* Ayuda */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => selectSuggestion('Ayuda')}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Ayuda"
          >
            <HelpCircle className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex h-[calc(100vh-100px)]">
        {/* Área principal */}
        <div className={`flex-1 flex flex-col ${showHistory ? 'pr-0' : ''}`}>
          {/* Zona del orbe */}
          <div className="relative flex-shrink-0 h-[45vh] flex items-center justify-center">
            {/* Orbe animado */}
            <AnimatedOrb state={orbState} audioLevel={audioLevel} size="large" />

            {/* Texto debajo del orbe */}
            <motion.div
              className="absolute bottom-8 text-center max-w-md px-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {messages.length === 0 ? (
                <div className="text-white/60">
                  <p className="text-xl font-semibold mb-2">¡Hola! Soy Chronos</p>
                  <p className="text-sm">Tu asistente inteligente. Escribe o habla tu consulta para comenzar.</p>
                </div>
              ) : isProcessing ? (
                <div className="flex items-center gap-3 text-purple-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Brain className="w-5 h-5" />
                  </motion.div>
                  <span className="text-lg">Analizando tu solicitud...</span>
                </div>
              ) : isListening ? (
                <div className="flex items-center gap-3 text-blue-400">
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span className="text-lg">Escuchando...</span>
                </div>
              ) : isSpeaking ? (
                <div className="flex items-center gap-3 text-cyan-400">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span className="text-lg">Hablando...</span>
                </div>
              ) : null}
            </motion.div>
          </div>

          {/* Quick actions cuando no hay mensajes */}
          {messages.length === 0 && (
            <motion.div 
              className="px-6 pb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm text-white/40 mb-4">Acciones rápidas:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
                {quickActions.map((action, i) => (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectSuggestion(action.query)}
                    className="group flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} shadow-lg`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Sugerencias activas */}
          {messages.length > 0 && suggestions.length > 0 && !isProcessing && (
            <motion.div 
              className="px-6 py-4 border-t border-white/5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-xs text-white/40 mb-3">Continuar con:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((suggestion, i) => (
                  <motion.button
                    key={suggestion}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectSuggestion(suggestion)}
                    className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm border border-white/10 hover:border-white/20 transition-all flex items-center gap-2"
                  >
                    {suggestion}
                    <ChevronRight className="w-3 h-3" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Input área */}
          <div className="mt-auto p-6 border-t border-white/5 bg-black/30 backdrop-blur-md">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-4 max-w-4xl mx-auto">
              {/* Botón de voz */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleListening}
                disabled={!voiceSupported || isProcessing}
                className={`
                  p-4 rounded-xl transition-all disabled:opacity-50 flex-shrink-0
                  ${isListening 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                    : 'bg-white/10 text-white hover:bg-white/20'}
                `}
              >
                {isListening ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </motion.button>

              {/* Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isListening ? 'Escuchando tu voz...' : 'Escribe tu mensaje o comando...'}
                  disabled={isListening || isProcessing}
                  className="w-full px-6 py-4 bg-white/5 text-white rounded-xl border border-white/10 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 placeholder:text-white/30 disabled:opacity-50 text-base transition-all"
                />
                
                {/* Indicador de voz */}
                {isListening && (
                  <motion.div
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-blue-500 rounded-full"
                        animate={{ height: [10, 24, 10] }}
                        transition={{
                          duration: 0.4,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Enviar */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isProcessing}
                className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 flex-shrink-0"
              >
                <Send className="w-6 h-6" />
              </motion.button>

              {/* Speaker */}
              {messages.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking()
                    } else {
                      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
                      if (lastAssistant) {
                        speakText(lastAssistant.content.replace(/[*#_]/g, '').replace(/\n/g, '. '))
                      }
                    }
                  }}
                  className={`
                    p-4 rounded-xl transition-all flex-shrink-0
                    ${isSpeaking 
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
                      : 'bg-white/10 text-white hover:bg-white/20'}
                  `}
                  title={isSpeaking ? 'Detener' : 'Reproducir última respuesta'}
                >
                  {isSpeaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </motion.button>
              )}
            </div>

            {/* Tip */}
            <p className="text-xs text-white/30 text-center mt-4 max-w-2xl mx-auto">
              💡 <span className="text-white/40">Tip:</span> Puedo navegar por el sistema, consultar datos, crear registros y generar reportes. 
              Prueba diciendo <span className="text-blue-400/70">"Ir a ventas"</span>, <span className="text-purple-400/70">"¿Cuánto hay en bancos?"</span> o <span className="text-green-400/70">"Nueva venta"</span>
            </p>
          </div>
        </div>

        {/* Panel de historial */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 420, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="border-l border-white/5 bg-black/40 backdrop-blur-md overflow-hidden flex-shrink-0"
            >
              <div className="h-full flex flex-col w-[420px]">
                {/* Header historial */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">Conversación</span>
                    {messages.length > 0 && (
                      <span className="text-xs text-white/40">({messages.length})</span>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowHistory(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-white/50" />
                  </motion.button>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
                        <Bot className="w-12 h-12 text-white/20" />
                      </div>
                      <p className="text-white/40 text-sm mb-2">
                        Aún no hay mensajes
                      </p>
                      <p className="text-white/25 text-xs">
                        Inicia una conversación con Chronos
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, i) => (
                        <MessageBubble 
                          key={message.id} 
                          message={message}
                          isLast={i === messages.length - 1}
                          onSuggestionClick={selectSuggestion}
                        />
                      ))}
                      
                      {/* Typing indicator */}
                      <AnimatePresence>
                        {isProcessing && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex justify-start mb-4"
                          >
                            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl rounded-bl-md border border-white/10">
                              <div className="flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    className="w-2.5 h-2.5 bg-blue-500 rounded-full"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{
                                      duration: 0.5,
                                      repeat: Infinity,
                                      delay: i * 0.15,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlay modo llamada */}
      <AnimatePresence>
        {isCallMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-gradient-to-br from-blue-950/98 via-purple-950/98 to-black/98 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            {/* Orbe en modo llamada */}
            <motion.div 
              className="mb-12"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <AnimatedOrb state={orbState} audioLevel={audioLevel} size="large" />
            </motion.div>

            {/* Estado */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-4xl font-bold text-white mb-3">
                {orbState === 'listening' && '🎤 Escuchando...'}
                {orbState === 'thinking' && '🧠 Procesando...'}
                {orbState === 'speaking' && '🔊 Respondiendo...'}
                {orbState === 'idle' && '¿En qué puedo ayudarte?'}
              </h2>
              <p className="text-lg text-white/60">
                {orbState === 'listening' && 'Di tu comando o pregunta'}
                {orbState === 'thinking' && 'Analizando tu solicitud'}
                {orbState === 'speaking' && 'Escucha la respuesta'}
                {orbState === 'idle' && 'Toca el micrófono para hablar'}
              </p>
            </motion.div>

            {/* Controles */}
            <motion.div 
              className="flex items-center gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Micrófono */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleListening}
                className={`
                  p-8 rounded-full transition-all
                  ${isListening 
                    ? 'bg-red-500 text-white shadow-2xl shadow-red-500/50' 
                    : 'bg-white/20 text-white hover:bg-white/30'}
                `}
              >
                {isListening ? (
                  <MicOff className="w-12 h-12" />
                ) : (
                  <Mic className="w-12 h-12" />
                )}
              </motion.button>

              {/* Terminar */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleCallMode}
                className="p-6 rounded-full bg-red-500 text-white shadow-xl shadow-red-500/40"
              >
                <PhoneOff className="w-10 h-10" />
              </motion.button>

              {/* Silenciar */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={stopSpeaking}
                disabled={!isSpeaking}
                className="p-6 rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-40"
              >
                <VolumeX className="w-10 h-10" />
              </motion.button>
            </motion.div>

            {/* Último mensaje */}
            <AnimatePresence>
              {messages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  className="absolute bottom-8 left-8 right-8"
                >
                  <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                    <p className="text-white/90 text-center text-lg leading-relaxed">
                      {messages[messages.length - 1]?.content.slice(0, 250)}
                      {(messages[messages.length - 1]?.content.length || 0) > 250 && '...'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BentoIAFullscreen
