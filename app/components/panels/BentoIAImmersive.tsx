'use client'

/**
 * 🤖 BENTO IA IMMERSIVE - Panel de Asistente Chronos Premium
 * 
 * Panel inmersivo con integración Spline Nexbot, partículas, y portal Dr. Strange.
 * Características:
 * - Nexbot robot 3D interactivo con estados (idle, listening, speaking, thinking)
 * - Particle Nebula como fondo dinámico
 * - Fire Portal para efecto de energía
 * - Chat inteligente con voz
 * - Analytics overlay con predicciones IA
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Send, 
  Brain, 
  TrendingUp, 
  BarChart3, 
  Package, 
  Users, 
  DollarSign, 
  Target, 
  MessageCircle, 
  Zap,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  RefreshCw,
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react'
import { useVoiceAgent } from '@/app/hooks/useVoiceAgent'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { AIAnalyticsOverlay } from '@/app/components/3d/AIAnalyticsOverlay'
import { AreaChart, Area, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { SafeChartContainer, SAFE_ANIMATION_PROPS } from '@/app/components/ui/SafeChartContainer'
import { QuickStatWidget } from '@/app/components/widgets/QuickStatWidget'
import { MiniChartWidget } from '@/app/components/widgets/MiniChartWidget'
import { ActivityFeedWidget, ActivityItem } from '@/app/components/widgets/ActivityFeedWidget'
import { logger } from '@/app/lib/utils/logger'

// Lazy load Spline para optimización
const Spline = lazy(() => import('@splinetool/react-spline'))

// URLs de los escenarios Spline
const SPLINE_SCENES = {
  nexbot: 'https://prod.spline.design/eGbfbvp0WBojpcqu/scene.splinecode',
  particle_nebula: 'https://prod.spline.design/Umjz4tA2QXT43ljm/scene.splinecode',
  fire_portal: 'https://prod.spline.design/NgWU8fD6towEaxnr/scene.splinecode',
}

// Datos de análisis para gráficos
const analysisData = [
  { month: 'Ene', ventas: 45000, compras: 32000, prediccion: 48000 },
  { month: 'Feb', ventas: 52000, compras: 38000, prediccion: 54000 },
  { month: 'Mar', ventas: 61000, compras: 42000, prediccion: 63000 },
  { month: 'Abr', ventas: 58000, compras: 40000, prediccion: 60000 },
  { month: 'May', ventas: 67000, compras: 45000, prediccion: 70000 },
  { month: 'Jun', ventas: 72000, compras: 48000, prediccion: 76000 },
]

// Capacidades IA para radar
const aiCapabilities = [
  { subject: 'Ventas', A: 92, fullMark: 100 },
  { subject: 'Inventario', A: 88, fullMark: 100 },
  { subject: 'Clientes', A: 95, fullMark: 100 },
  { subject: 'Finanzas', A: 78, fullMark: 100 },
  { subject: 'Predicción', A: 85, fullMark: 100 },
  { subject: 'Reportes', A: 90, fullMark: 100 },
]

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  type?: 'normal' | 'insight' | 'alert' | 'action'
}

// Estado del Nexbot
type NexbotState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'excited'

// ============================================================================
// NEXBOT 3D COMPONENT
// ============================================================================
interface NexbotSplineProps {
  state: NexbotState
  onLoad?: () => void
  className?: string
}

function NexbotSpline({ state, onLoad, className }: NexbotSplineProps) {
  const splineRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const handleLoad = useCallback((spline: any) => {
    splineRef.current = spline
    setIsLoaded(true)
    onLoad?.()
    logger.info('Nexbot Spline cargado', { context: 'NexbotSpline' })
  }, [onLoad])

  // Emitir eventos según el estado
  useEffect(() => {
    if (!splineRef.current || !isLoaded) return
    
    try {
      // Intentar emitir evento de estado al Spline
      const eventName = `state_${state}`
      splineRef.current.emitEvent('mouseDown', eventName)
    } catch (error) {
      // Spline puede no soportar eventos personalizados
      logger.debug('Evento Spline no disponible', { context: 'NexbotSpline', data: { state } })
    }
  }, [state, isLoaded])

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-950/60 via-purple-950/60 to-black/60 rounded-3xl">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
          />
          <span className="absolute text-white/60 text-sm mt-24">Cargando Nexbot...</span>
        </div>
      )}
      
      {/* Spline Scene */}
      <Suspense fallback={null}>
        <Spline
          scene={SPLINE_SCENES.nexbot}
          onLoad={handleLoad}
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>

      {/* State indicator overlay */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={`
          px-4 py-2 rounded-full backdrop-blur-xl border shadow-lg
          ${state === 'listening' ? 'bg-green-500/20 border-green-500/40 text-green-300' :
            state === 'speaking' ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' :
            state === 'thinking' ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' :
            state === 'excited' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' :
            'bg-white/10 border-white/20 text-white/70'}
        `}>
          <div className="flex items-center gap-2">
            {state === 'listening' && (
              <>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-2 h-2 bg-green-400 rounded-full"
                />
                <span className="text-sm font-medium">Escuchando...</span>
              </>
            )}
            {state === 'speaking' && (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="text-sm font-medium">Hablando...</span>
              </>
            )}
            {state === 'thinking' && (
              <>
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Brain className="w-4 h-4" />
                </motion.div>
                <span className="text-sm font-medium">Procesando...</span>
              </>
            )}
            {state === 'excited' && (
              <>
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">¡Insight!</span>
              </>
            )}
            {state === 'idle' && (
              <>
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Chronos AI</span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// PARTICLE BACKGROUND
// ============================================================================
function ParticleBackground() {
  const [showParticles, setShowParticles] = useState(false)

  useEffect(() => {
    // Delay para no competir con Nexbot
    const timer = setTimeout(() => setShowParticles(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (!showParticles) return null

  return (
    <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none overflow-hidden rounded-3xl">
      <Suspense fallback={null}>
        <Spline
          scene={SPLINE_SCENES.particle_nebula}
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>
    </div>
  )
}

// ============================================================================
// CHAT MESSAGE COMPONENT
// ============================================================================
interface ChatMessageProps {
  message: Message
}

function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.sender === 'ai'
  
  const typeStyles = {
    normal: '',
    insight: 'border-l-2 border-purple-500',
    alert: 'border-l-2 border-amber-500',
    action: 'border-l-2 border-green-500',
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`
          max-w-[80%] p-4 rounded-2xl relative
          ${isAI 
            ? `bg-gradient-to-br from-white/10 to-white/5 text-white backdrop-blur-sm ${typeStyles[message.type || 'normal']}` 
            : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/20'
          }
        `}
      >
        {isAI && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-white/60 font-medium">Chronos AI</span>
          </div>
        )}
        
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
        
        <span className="text-xs opacity-50 mt-2 block text-right">
          {message.timestamp.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </motion.div>
  )
}

// ============================================================================
// QUICK ACTION BUTTON
// ============================================================================
interface QuickActionProps {
  icon: React.ElementType
  label: string
  onClick: () => void
  delay?: number
}

function QuickAction({ icon: Icon, label, onClick, delay = 0 }: QuickActionProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center gap-3 transition-all border border-white/5 hover:border-white/10 group"
    >
      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-colors">
        {React.createElement(Icon, { className: 'w-4 h-4 text-blue-300' })}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  )
}

// ============================================================================
// TYPING INDICATOR
// ============================================================================
function TypingIndicator() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex justify-start"
    >
      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
              />
            ))}
          </div>
          <span className="text-xs text-white/50 ml-2">Nexbot está pensando...</span>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function BentoIAImmersive() {
  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analyticsType, setAnalyticsType] = useState<'sales' | 'inventory' | 'clients' | 'predictions'>('sales')
  const [nexbotState, setNexbotState] = useState<NexbotState>('idle')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Hooks
  const { connect, disconnect, isConnected } = useVoiceAgent()
  const { voiceAgentStatus } = useAppStore()

  // Activity feed
  const aiActivityFeed: ActivityItem[] = useMemo(() => [
    {
      id: 'ai-1',
      type: 'sistema',
      title: 'Análisis completado',
      description: 'Predicción de ventas Q2 procesada',
      timestamp: new Date(Date.now() - 300000),
      status: 'success',
    },
    {
      id: 'ai-2',
      type: 'sistema',
      title: 'Recomendación generada',
      description: 'Optimización de inventario sugerida',
      timestamp: new Date(Date.now() - 900000),
      status: 'success',
    },
    {
      id: 'ai-3',
      type: 'alerta',
      title: 'Alerta detectada',
      description: 'Stock bajo en 3 productos',
      timestamp: new Date(Date.now() - 1800000),
      status: 'pending',
    },
  ], [])

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Sync nexbot state with voice agent
  useEffect(() => {
    if (voiceAgentStatus === 'listening') {
      setNexbotState('listening')
    } else if (isTyping) {
      setNexbotState('thinking')
    } else if (messages.length > 0 && messages[messages.length - 1].sender === 'ai') {
      setNexbotState('speaking')
      const timer = setTimeout(() => setNexbotState('idle'), 3000)
      return () => clearTimeout(timer)
    } else {
      setNexbotState('idle')
    }
  }, [voiceAgentStatus, isTyping, messages])

  // Voice toggle
  const toggleVoiceAgent = useCallback(async () => {
    if (isConnected) {
      disconnect()
      setNexbotState('idle')
    } else {
      await connect()
      setNexbotState('listening')
    }
  }, [isConnected, connect, disconnect])

  // Generate AI response
  const generateAIResponse = useCallback((userInput: string): { text: string; type: Message['type'] } => {
    const input = userInput.toLowerCase()

    if (input.includes('ventas') || input.includes('vender')) {
      setShowAnalytics(true)
      setAnalyticsType('sales')
      setNexbotState('excited')
      return {
        text: '📊 **Análisis de Ventas Activado**\n\nLas ventas totales ascienden a $3,378,700 con un promedio de $1,126,233 por transacción.\n\n✨ Tendencia: +18% vs mes anterior\n🎯 Predicción: Alcanzar $4.2M este trimestre\n\n¿Deseas ver desglose por cliente o predicciones detalladas?',
        type: 'insight',
      }
    }

    if (input.includes('inventario') || input.includes('stock')) {
      setShowAnalytics(true)
      setAnalyticsType('inventory')
      return {
        text: '📦 **Estado del Inventario**\n\nStock actual: 17 unidades\nEntradas totales: 2,296\nSalidas totales: 2,279\n\n⚠️ Alerta: Stock en nivel bajo\n💡 Recomendación: Generar orden de compra para mantener 30+ unidades\n\n¿Genero una orden de compra automática?',
        type: 'alert',
      }
    }

    if (input.includes('clientes') || input.includes('cliente')) {
      setShowAnalytics(true)
      setAnalyticsType('clients')
      setNexbotState('excited')
      return {
        text: '👥 **Análisis de Clientes**\n\n31 clientes activos\nTasa de retención: 94%\nValor promedio por cliente: $108,990\n\n⭐ Top 3 clientes representan 45% de ingresos\n📈 Oportunidad: 5 clientes con potencial de upselling\n\n¿Ver perfiles detallados?',
        type: 'insight',
      }
    }

    if (input.includes('predicción') || input.includes('prediccion') || input.includes('futuro')) {
      setShowAnalytics(true)
      setAnalyticsType('predictions')
      setNexbotState('thinking')
      return {
        text: '🔮 **Predicciones IA Generadas**\n\nModelo: Neural Network v3.2\nConfianza: 87%\n\nProyecciones Q3:\n• Ventas: $4.5M (+22%)\n• Margen: 34% (estable)\n• Nuevos clientes: +8\n\n🚀 Escenario optimista: +35% si se activan campañas\n\n¿Explorar escenarios alternativos?',
        type: 'insight',
      }
    }

    if (input.includes('hola') || input.includes('hey') || input.includes('saludos')) {
      return {
        text: '¡Hola! 👋 Soy Nexbot, tu asistente inteligente de Chronos.\n\nPuedo ayudarte con:\n• 📊 Análisis de ventas y predicciones\n• 📦 Gestión de inventario\n• 👥 Insights de clientes\n• 💰 Estado financiero\n\n¿En qué te puedo asistir hoy?',
        type: 'normal',
      }
    }

    return {
      text: '🤖 Entendido. Estoy procesando tu solicitud...\n\nPuedo ayudarte con análisis de ventas, inventario, clientes o predicciones. También puedo ejecutar acciones como generar reportes o crear órdenes.\n\n¿Qué necesitas específicamente?',
      type: 'normal',
    }
  }, [])

  // Send message
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      type: 'normal',
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)
    setNexbotState('thinking')

    // Simulate AI thinking
    setTimeout(() => {
      const response = generateAIResponse(inputText)
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'ai',
        timestamp: new Date(),
        type: response.type,
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
      setNexbotState('speaking')
    }, 1500 + Math.random() * 1000)
  }, [inputText, isTyping, generateAIResponse])

  // Quick actions
  const quickActions: Array<{ label: string; icon: React.ElementType; type: string }> = [
    { label: 'Análisis de Ventas', icon: TrendingUp, type: 'sales' },
    { label: 'Estado de Inventario', icon: Package, type: 'inventory' },
    { label: 'Insights de Clientes', icon: Users, type: 'clients' },
    { label: 'Predicciones IA', icon: Brain, type: 'predictions' },
  ]

  const handleQuickAction = useCallback((type: string) => {
    const actionMessages: Record<string, string> = {
      sales: 'Muéstrame el análisis de ventas',
      inventory: '¿Cuál es el estado del inventario?',
      clients: 'Quiero ver insights de clientes',
      predictions: 'Genera predicciones con IA',
    }
    setInputText(actionMessages[type] || '')
  }, [])

  return (
    <div className="bento-container relative">
      {/* Main Panel - Split Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bento-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-purple-950/40 to-slate-900/90 border border-white/10 backdrop-blur-xl ${isFullscreen ? 'fixed inset-4 z-50' : 'h-[calc(100vh-14rem)]'}`}
      >
        {/* Particle Background */}
        <ParticleBackground />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        <div className="flex h-full relative z-10">
          {/* Left Panel - Nexbot 3D */}
          <div className="w-[40%] min-w-[320px] h-full relative border-r border-white/10">
            <NexbotSpline 
              state={nexbotState} 
              className="w-full h-full"
            />
            
            {/* Floating controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </motion.button>
            </div>

            {/* Voice activation button */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleVoiceAgent}
                className={`
                  px-6 py-3 rounded-2xl font-medium flex items-center gap-2 transition-all shadow-lg
                  ${isConnected 
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/30' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-blue-500/30'
                  }
                `}
              >
                {isConnected ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    Detener
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Activar Voz
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="p-5 border-b border-white/10 bg-black/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{
                      boxShadow: isConnected 
                        ? ['0 0 20px rgba(59,130,246,0.5)', '0 0 40px rgba(139,92,246,0.5)', '0 0 20px rgba(59,130,246,0.5)']
                        : '0 0 0px transparent',
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center"
                  >
                    <Sparkles className="w-7 h-7 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Chronos AI Assistant</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`w-2 h-2 rounded-full ${
                          nexbotState === 'idle' ? 'bg-green-500' :
                          nexbotState === 'listening' ? 'bg-blue-500' :
                          nexbotState === 'thinking' ? 'bg-purple-500' :
                          nexbotState === 'speaking' ? 'bg-cyan-500' :
                          'bg-amber-500'
                        }`}
                      />
                      <span className="text-white/60 text-sm capitalize">
                        {nexbotState === 'idle' ? 'Listo' :
                         nexbotState === 'listening' ? 'Escuchando' :
                         nexbotState === 'thinking' ? 'Procesando' :
                         nexbotState === 'speaking' ? 'Respondiendo' :
                         'Insight detectado'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMessages([])}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', duration: 0.8 }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30"
                  >
                    <Brain className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  <motion.h3 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-white mb-2"
                  >
                    ¡Hola! Soy Nexbot
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/60 max-w-md mb-8"
                  >
                    Tu asistente inteligente de Chronos. Puedo analizar datos, generar predicciones y automatizar tareas.
                  </motion.p>

                  <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                    {quickActions.map((action, index) => (
                      <QuickAction
                        key={action.label}
                        icon={action.icon}
                        label={action.label}
                        onClick={() => handleQuickAction(action.type)}
                        delay={0.4 + index * 0.1}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-5 border-t border-white/10 bg-black/20">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Escribe tu mensaje o pregunta..."
                  className="flex-1 bg-white/5 text-white px-5 py-4 rounded-2xl border border-white/10 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-white/30"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isTyping}
                  className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 disabled:shadow-none"
                >
                  <Send className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Overlay */}
        <AIAnalyticsOverlay 
          isVisible={showAnalytics} 
          type={analyticsType}
        />
      </motion.div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <QuickStatWidget
          title="Precisión IA"
          value={94.7}
          suffix="%"
          change={2.3}
          icon={Brain}
          color="purple"
          sparklineData={[88, 90, 91, 93, 92, 94, 94.7]}
          delay={0.1}
        />
        <QuickStatWidget
          title="Consultas Hoy"
          value={messages.length + 47}
          change={15.8}
          icon={MessageCircle}
          color="cyan"
          sparklineData={[20, 35, 42, 38, 45, 52, messages.length + 47]}
          delay={0.2}
        />
        <QuickStatWidget
          title="Predicciones"
          value={156}
          change={22.1}
          icon={Target}
          color="green"
          sparklineData={[80, 95, 110, 125, 140, 150, 156]}
          delay={0.3}
        />
        <QuickStatWidget
          title="Ahorro Generado"
          value={45200}
          prefix="$"
          change={31.5}
          icon={DollarSign}
          color="orange"
          sparklineData={[15000, 22000, 28000, 35000, 40000, 42000, 45200]}
          delay={0.4}
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass p-6 rounded-2xl border border-white/5 bg-black/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Predicción de Ventas</h3>
              <p className="text-xs text-white/50">Análisis generado por Nexbot</p>
            </div>
          </div>
          <div style={{ width: '100%', minWidth: 200, height: 250, minHeight: 200 }}>
            <SafeChartContainer height={250} minHeight={200}>
              <AreaChart data={analysisData}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPrediccion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#fff" opacity={0.5} />
                <YAxis stroke="#fff" opacity={0.5} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorVentas)" 
                  {...SAFE_ANIMATION_PROPS} 
                />
                <Area
                  type="monotone"
                  dataKey="prediccion"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorPrediccion)"
                  strokeDasharray="5 5"
                  {...SAFE_ANIMATION_PROPS}
                />
              </AreaChart>
            </SafeChartContainer>
          </div>
        </motion.div>

        {/* Capabilities Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass p-6 rounded-2xl border border-white/5 bg-black/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-violet-500/20">
              <Brain className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Capacidades IA</h3>
              <p className="text-xs text-white/50">Rendimiento por área</p>
            </div>
          </div>
          <div style={{ width: '100%', minWidth: 150, height: 200, minHeight: 150 }}>
            <SafeChartContainer height={200} minHeight={150}>
              <RadarChart data={aiCapabilities}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                <Radar 
                  name="Capacidad" 
                  dataKey="A" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3} 
                  strokeWidth={2} 
                  {...SAFE_ANIMATION_PROPS} 
                />
              </RadarChart>
            </SafeChartContainer>
          </div>
        </motion.div>
      </div>

      {/* Activity & Mini Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <ActivityFeedWidget
          title="Actividad Nexbot"
          activities={aiActivityFeed}
          maxItems={4}
          autoScroll
        />
        
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniChartWidget
            title="Tiempo Respuesta"
            subtitle="0.8s"
            type="line"
            data={[1.2, 1.1, 0.9, 0.95, 0.85, 0.82, 0.8].map((v, i) => ({ name: `T${i + 1}`, value: v * 100 }))}
            color="cyan"
          />
          <MiniChartWidget
            title="Uso GPU"
            subtitle="67%"
            type="donut"
            data={[{ name: 'Usado', value: 67 }, { name: 'Disponible', value: 33 }]}
            color="purple"
          />
          <MiniChartWidget
            title="Modelos Activos"
            subtitle="5 modelos"
            type="bar"
            data={[3, 4, 4, 5, 5, 5, 5].map((v, i) => ({ name: `D${i + 1}`, value: v }))}
            color="green"
          />
          <MiniChartWidget
            title="Accuracy"
            subtitle="97.2%"
            type="area"
            data={[92, 93, 94, 95, 96, 96.5, 97.2].map((v, i) => ({ name: `V${i + 1}`, value: v }))}
            color="orange"
          />
        </div>
      </div>
    </div>
  )
}
