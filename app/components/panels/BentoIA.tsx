'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Mic, MicOff, Send, Activity, Brain, TrendingUp, BarChart3, Package, Users, DollarSign, Zap, Target, MessageCircle, Bot, Loader2 } from 'lucide-react'
import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react'
import { useVoiceAgent } from '@/app/hooks/useVoiceAgent'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { AIAnalyticsOverlay } from '@/app/components/3d/AIAnalyticsOverlay'
import { AreaChart, Area, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell } from 'recharts'
import { SafeChartContainer, SAFE_ANIMATION_PROPS, SAFE_PIE_PROPS } from '@/app/components/ui/SafeChartContainer'
import { AIBrainVisualizer } from '@/app/components/visualizations/AIBrainVisualizer'
import { QuickStatWidget } from '@/app/components/widgets/QuickStatWidget'
import { MiniChartWidget } from '@/app/components/widgets/MiniChartWidget'
import { ActivityFeedWidget, ActivityItem } from '@/app/components/widgets/ActivityFeedWidget'
import { getMegaAIAgent, type AIResponse, type AIVisualization } from '@/app/lib/services/ai/MegaAIAgent.service'
import { logger } from '@/app/lib/utils/logger'

// Flag para habilitar/deshabilitar Spline (causa errores de runtime)
const SPLINE_ENABLED = false

// Lazy load de componentes Spline
const SplineBot3D = lazy(() => import('@/app/components/3d/SplineBot3D').then(m => ({ default: m.SplineBot3D })))
const SplitScreenIA = lazy(() => import('@/app/components/3d/SplitScreenIA').then(m => ({ default: m.SplitScreenIA })))
const SplineWidget3D = lazy(() => import('@/app/components/3d/SplineWidget3D').then(m => ({ default: m.SplineWidget3D })))

// Hook simplificado para control del bot cuando Spline está deshabilitado
function useSplineBot() {
  const [state, setState] = useState<'idle' | 'listening' | 'speaking' | 'thinking'>('idle')
  const [isInteracting, setIsInteracting] = useState(false)

  const setIdle = useCallback(() => { setState('idle'); setIsInteracting(false) }, [])
  const setListening = useCallback(() => { setState('listening'); setIsInteracting(true) }, [])
  const setSpeaking = useCallback(() => { setState('speaking'); setIsInteracting(true) }, [])
  const setThinking = useCallback(() => { setState('thinking'); setIsInteracting(true) }, [])

  return { state, isInteracting, setIdle, setListening, setSpeaking, setThinking }
}

const analysisData = [
  { month: 'Ene', ventas: 45000, compras: 32000, prediccion: 48000 },
  { month: 'Feb', ventas: 52000, compras: 38000, prediccion: 54000 },
  { month: 'Mar', ventas: 61000, compras: 42000, prediccion: 63000 },
  { month: 'Abr', ventas: 58000, compras: 40000, prediccion: 60000 },
  { month: 'May', ventas: 67000, compras: 45000, prediccion: 70000 },
  { month: 'Jun', ventas: 72000, compras: 48000, prediccion: 76000 },
]

// Datos para radar de capacidades IA
const aiCapabilities = [
  { subject: 'Ventas', A: 92, fullMark: 100 },
  { subject: 'Inventario', A: 88, fullMark: 100 },
  { subject: 'Clientes', A: 95, fullMark: 100 },
  { subject: 'Finanzas', A: 78, fullMark: 100 },
  { subject: 'Predicción', A: 85, fullMark: 100 },
  { subject: 'Reportes', A: 90, fullMark: 100 },
]

// Colores para gráficos
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  visualizations?: AIVisualization[]
  suggestions?: string[]
}

export default function BentoIA() {
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analyticsType, setAnalyticsType] = useState<'sales' | 'inventory' | 'clients' | 'predictions'>('sales')
  const [use3DMode, setUse3DMode] = useState(true)
  const [aiError, setAiError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { connect, disconnect, isConnected } = useVoiceAgent()
  const { voiceAgentStatus, audioFrequencies, currentUserId } = useAppStore()
  
  // Instancia del MegaAIAgent
  const aiAgent = useMemo(() => getMegaAIAgent(currentUserId || 'anonymous'), [currentUserId])
  
  // Hook del bot 3D de Spline
  const botControl = useSplineBot()

  // Activity feed para IA
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
    {
      id: 'ai-4',
      type: 'sistema',
      title: 'Modelo actualizado',
      description: 'Red neural reentrenada con datos recientes',
      timestamp: new Date(Date.now() - 3600000),
      status: 'success',
    },
  ], [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Sincronizar estado del bot con el voice agent
    if (isListening) {
      botControl.setListening()
    } else if (isTyping) {
      botControl.setThinking()
    } else if (messages.length > 0 && messages[messages.length - 1].sender === 'ai') {
      botControl.setSpeaking()
      // Volver a idle después de 2 segundos
      const timer = setTimeout(() => botControl.setIdle(), 2000)
      return () => clearTimeout(timer)
    } else {
      botControl.setIdle()
    }
  }, [isListening, isTyping, messages, botControl])

  const toggleVoiceAgent = async () => {
    if (isConnected) {
      disconnect()
      setIsListening(false)
    } else {
      await connect()
      setIsListening(true)
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputText
    setInputText('')
    setIsTyping(true)
    setAiError(null)

    try {
      // Usar MegaAIAgent para procesar el mensaje
      const response = await aiAgent.sendMessage({
        message: currentInput,
        userId: currentUserId || 'anonymous',
        context: { 
          panelActual: 'ia',
          historialMensajes: messages.length, 
        },
      })
      
      logger.info('Respuesta de MegaAIAgent', { 
        context: 'BentoIA', 
        data: { responseType: response.type },
      })
      
      // Determinar tipo de analytics a mostrar
      if (response.type === 'data' || response.type === 'visualization') {
        setShowAnalytics(true)
        const lowerInput = currentInput.toLowerCase()
        if (lowerInput.includes('venta')) setAnalyticsType('sales')
        else if (lowerInput.includes('inventario') || lowerInput.includes('stock') || lowerInput.includes('compra')) setAnalyticsType('inventory')
        else if (lowerInput.includes('cliente')) setAnalyticsType('clients')
        else if (lowerInput.includes('predicción') || lowerInput.includes('prediccion')) setAnalyticsType('predictions')
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'ai',
        timestamp: new Date(),
        visualizations: response.visualizations,
        suggestions: response.suggestions,
      }
      
      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      logger.error('Error en MegaAIAgent', error, { context: 'BentoIA' })
      setAiError('Error al procesar tu mensaje. Intenta de nuevo.')
      
      // Fallback a respuesta local
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(currentInput),
        sender: 'ai',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, fallbackResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()

    // Respuestas con datos reales del sistema CHRONOS
    if (input.includes('ventas') || input.includes('vender')) {
      setShowAnalytics(true)
      setAnalyticsType('sales')
      return '📊 **Resumen de Ventas del Sistema:**\n\n' +
        '• Total registros: **96 ventas**\n' +
        '• Clientes activos: **31**\n' +
        '• Órdenes de compra: **9**\n' +
        '• Distribuidores: **6 orígenes** (PACMAN, Q-MAYA, A/X🌶️🦀, CH-MONTE, VALLE-MONTE, Q-MAYA-MP)\n\n' +
        'He activado la visualización de análisis de ventas. ¿Te gustaría ver un análisis más detallado de algún cliente o distribuidor específico?'
    }

    if (input.includes('compras') || input.includes('órdenes') || input.includes('ordenes')) {
      setShowAnalytics(true)
      setAnalyticsType('inventory')
      return '📦 **Órdenes de Compra:**\n\n' +
        '• OC0001 - Q-MAYA: 423 unidades @ $6,300\n' +
        '• OC0004 - PACMAN: 487 unidades @ $6,300\n' +
        '• OC0005 - Q-MAYA: 513 unidades @ $6,300\n' +
        '• OC0008 - PACMAN: 488 unidades @ $6,300\n' +
        '• OC0009 - Q-MAYA-MP: 200 unidades @ $6,300\n\n' +
        'Total: **9 órdenes** | Costo promedio: **$6,300/unidad**\n\n' +
        '¿Necesitas información sobre algún distribuidor específico?'
    }

    if (input.includes('banco') || input.includes('saldo') || input.includes('capital')) {
      return '💰 **Estado de Bancos/Bóvedas:**\n\n' +
        '• 🏛️ **Bóveda Monte** - MXN (Principal)\n' +
        '• 🇺🇸 **Bóveda USA** - USD\n' +
        '• 📊 **Profit** - Operativo\n' +
        '• 🔵 **Leftie** - Operativo\n' +
        '• 🏧 **Azteca** - Operativo\n' +
        '• 🚛 **Flete Sur** - Gastos de flete\n' +
        '• 💎 **Utilidades** - Ganancias\n\n' +
        'Los saldos se calculan: `capitalActual = historicoIngresos - historicoGastos`\n\n' +
        '¿Quieres ver movimientos recientes de algún banco específico?'
    }

    if (input.includes('stock') || input.includes('inventario')) {
      setShowAnalytics(true)
      setAnalyticsType('inventory')
      return '📦 **Estado del Inventario:**\n\n' +
        'Las unidades se rastrean por OC (Orden de Compra). Cada OC tiene:\n' +
        '• `stockActual` - Unidades disponibles\n' +
        '• `costoPorUnidad` = costoDistribuidor + costoTransporte\n\n' +
        '**Distribución por origen:**\n' +
        '• Q-MAYA: 1,168 unidades (OC0001, OC0002, OC0005)\n' +
        '• PACMAN: 975 unidades (OC0004, OC0008)\n' +
        '• Q-MAYA-MP: 200 unidades (OC0009)\n\n' +
        '¿Quieres ver el detalle de alguna OC específica?'
    }

    if (input.includes('clientes') || input.includes('cliente')) {
      setShowAnalytics(true)
      setAnalyticsType('clients')
      return '👥 **Análisis de Clientes:**\n\n' +
        '• Total: **31 clientes activos**\n\n' +
        '**Top clientes por deuda:**\n' +
        '• Bódega M-P: $945,000\n' +
        '• amigo playa azul: $355,000\n' +
        '• flama: $335,000\n' +
        '• Tio Tocayo: $315,000\n' +
        '• Tocayo: $255,200\n\n' +
        '**Clientes al corriente:**\n' +
        '• A/X: $317,380 a favor\n' +
        '• Primo: $3,000 a favor\n\n' +
        '¿Quieres ver el historial de algún cliente específico?'
    }

    if (input.includes('predicción') || input.includes('prediccion') || input.includes('futuro') || input.includes('tendencia')) {
      setShowAnalytics(true)
      setAnalyticsType('predictions')
      return '🔮 **Predicciones basadas en IA:**\n\n' +
        '📈 **Tendencias detectadas:**\n' +
        '• Demanda alta: Valle (recurrente)\n' +
        '• Cliente estrella: Lamas (6 transacciones)\n' +
        '• Origen preferido: Q-MAYA (mejor relación costo/calidad)\n\n' +
        '⚠️ **Alertas:**\n' +
        '• Deuda pendiente alta: $2,500,000+\n' +
        '• Clientes con pagos pendientes: 15\n' +
        '• OCs con stock bajo: revisar OC0006, OC0007\n\n' +
        '¿Quieres un análisis más profundo?'
    }

    if (input.includes('distribuidor')) {
      return '🏭 **Distribuidores del Sistema:**\n\n' +
        '| Origen | Costo Unit. | Transporte | Total |\n' +
        '|--------|------------|------------|-------|\n' +
        '| Q-MAYA | $6,100 | $200 | $6,300 |\n' +
        '| PACMAN | $6,100 | $200 | $6,300 |\n' +
        '| A/X🌶️🦀 | $6,100 | $200 | $6,300 |\n' +
        '| CH-MONTE | $6,300 | $0 | $6,300 |\n' +
        '| VALLE-MONTE | $7,000 | $0 | $7,000 |\n' +
        '| Q-MAYA-MP | $6,100 | $200 | $6,300 |\n\n' +
        '¿Necesitas más información de alguno?'
    }

    if (input.includes('dashboard') || input.includes('inicio') || input.includes('resumen')) {
      return '🏠 **Resumen del Dashboard CHRONOS:**\n\n' +
        '📊 **KPIs Principales:**\n' +
        '• 96 ventas registradas\n' +
        '• 31 clientes activos\n' +
        '• 9 órdenes de compra\n' +
        '• 6 distribuidores/orígenes\n' +
        '• 7 bancos/bóvedas\n\n' +
        '💡 **Fórmula de Ganancia:**\n' +
        '```\n' +
        'utilidad = (precioVenta - precioCompra - flete) × cantidad\n' +
        '```\n\n' +
        '¿En qué puedo ayudarte?'
    }

    return '🤖 **Soy tu asistente inteligente de CHRONOS.**\n\n' +
      'Puedo ayudarte con:\n' +
      '• 📊 Ventas (96 registros)\n' +
      '• 👥 Clientes (31 activos)\n' +
      '• 📦 Órdenes de compra (9 OCs)\n' +
      '• 🏭 Distribuidores (6 orígenes)\n' +
      '• 💰 Bancos y capital (7 bóvedas)\n' +
      '• 🔮 Predicciones y tendencias\n\n' +
      '¿Qué te gustaría consultar?'
  }

  const quickActions = [
    { label: 'Análisis de Ventas', icon: TrendingUp, type: 'sales' as const },
    { label: 'Estado de Inventario', icon: Package, type: 'inventory' as const },
    { label: 'Clientes Activos', icon: Users, type: 'clients' as const },
    { label: 'Predicciones IA', icon: Brain, type: 'predictions' as const },
  ]

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setInputText(action.label)
    setShowAnalytics(true)
    setAnalyticsType(action.type)
  }

  // Componente Fallback cuando Spline está deshabilitado
  const BotFallback = () => (
    <div className="relative w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-blue-950/40 via-purple-950/40 to-black/40 rounded-2xl">
      <div className="relative">
        {/* Avatar del Bot animado */}
        <motion.div
          animate={{
            scale: isListening ? [1, 1.05, 1] : [1, 1.02, 1],
            rotate: isTyping ? [0, 2, -2, 0] : 0,
          }}
          transition={{ repeat: Infinity, duration: isListening ? 1 : 3 }}
          className="w-40 h-40 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30"
        >
          <div className="w-36 h-36 rounded-2xl bg-black/80 flex items-center justify-center">
            <Bot className="w-20 h-20 text-white" />
          </div>
        </motion.div>
        
        {/* Indicador de estado */}
        <motion.div
          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full backdrop-blur-xl border shadow-lg ${
            isListening ? 'bg-green-500/20 border-green-500/30' :
            isTyping ? 'bg-purple-500/20 border-purple-500/30' :
            'bg-blue-500/20 border-blue-500/30'
          }`}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-white text-sm font-medium">
            {isListening ? '🎤 Escuchando...' : isTyping ? '🧠 Pensando...' : '✨ Chronos IA'}
          </span>
        </motion.div>

        {/* Partículas decorativas */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-blue-400/60"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              repeat: Infinity,
              duration: 2 + Math.random() * 2,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div className="bento-container relative">
      {/* Main interface with split screen */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-full h-[calc(100vh-12rem)] relative"
      >
        {use3DMode ? (
          // Usar Spline solo si está habilitado, sino usar fallback
          SPLINE_ENABLED ? (
            <Suspense fallback={<BotFallback />}>
              <SplitScreenIA
                defaultRatio={35}
                leftContent={
                  <div className="relative w-full h-full flex items-center justify-center p-8">
                    <SplineBot3D
                      isListening={isListening}
                      isSpeaking={isTyping}
                      className="w-full h-full"
                    />
                    <div className="absolute bottom-8 right-8">
                      <SplineWidget3D size="sm" />
                    </div>
                  </div>
                }
                rightContent={<div className="relative w-full h-full">{/* Chat content */}</div>}
              />
            </Suspense>
          ) : (
            // Layout sin Spline - diseño elegante split
            <div className="flex h-full gap-4">
              {/* Panel izquierdo - Bot Fallback */}
              <div className="w-[35%] min-w-[300px]">
                <BotFallback />
              </div>
              
              {/* Panel derecho - Chat */}
              <div className="flex-1 relative">
                <div className="crystal-card h-full flex flex-col">
                  {/* Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div
                          animate={{
                            scale: isListening ? [1, 1.1, 1] : 1,
                            rotate: isListening ? [0, 5, -5, 0] : 0,
                          }}
                          transition={{ repeat: isListening ? Number.POSITIVE_INFINITY : 0, duration: 2 }}
                          className={`
                            w-16 h-16 rounded-2xl flex items-center justify-center relative
                            ${isListening ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-white/10'}
                          `}
                        >
                          <Sparkles className="w-8 h-8 text-white" />
                          {isListening && (
                            <motion.div
                              className="absolute inset-0 rounded-2xl bg-blue-500"
                              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                            />
                          )}
                        </motion.div>

                        <div>
                          <h2 className="text-2xl font-bold text-white">Chronos AI Assistant</h2>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${voiceAgentStatus === 'listening' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}
                            />
                            <span className="text-white/60 text-sm capitalize">{voiceAgentStatus}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setUse3DMode(!use3DMode)}
                          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                        >
                          {use3DMode ? 'Vista Simple' : 'Vista 3D'}
                        </button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={toggleVoiceAgent}
                          className={`
                            px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all
                            ${isListening ? 'bg-red-500 hover:bg-red-600' : 'btn-premium'}
                          `}
                        >
                          {isListening ? (
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
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6"
                        >
                          <Sparkles className="w-12 h-12 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-white mb-2">¡Hola! Soy tu asistente IA</h3>
                        <p className="text-white/60 max-w-md mb-8">
                          Puedo ayudarte con información sobre ventas, compras, bancos, inventario y más. ¿En qué puedo
                          asistirte hoy?
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          {quickActions.map((action, index) => (
                            <motion.button
                              key={action.label}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              onClick={() => handleQuickAction(action)}
                              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center gap-3 transition-all"
                            >
                              <action.icon className="w-4 h-4" />
                              {action.label}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`
                                max-w-[70%] p-4 rounded-2xl
                                ${message.sender === 'user' ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' : 'bg-white/10 text-white'}
                              `}
                            >
                              <p className="text-sm leading-relaxed">{message.text}</p>
                              <span className="text-xs opacity-70 mt-2 block">
                                {message.timestamp.toLocaleTimeString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </motion.div>
                        ))}

                        {isTyping && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="bg-white/10 p-4 rounded-2xl">
                              <div className="flex gap-2">
                                <motion.div
                                  className="w-2 h-2 bg-blue-500 rounded-full"
                                  animate={{ y: [0, -8, 0] }}
                                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.6, delay: 0 }}
                                />
                                <motion.div
                                  className="w-2 h-2 bg-blue-500 rounded-full"
                                  animate={{ y: [0, -8, 0] }}
                                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.6, delay: 0.2 }}
                                />
                                <motion.div
                                  className="w-2 h-2 bg-blue-500 rounded-full"
                                  animate={{ y: [0, -8, 0] }}
                                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.6, delay: 0.4 }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-6 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Escribe tu mensaje o pregunta..."
                        className="flex-1 bg-white/5 text-white px-6 py-4 rounded-2xl border border-white/10 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={sendMessage}
                        disabled={!inputText.trim() || isTyping}
                        className="btn-premium p-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Analytics Overlay */}
                <AIAnalyticsOverlay 
                  isVisible={showAnalytics} 
                  type={analyticsType}
                />
              </div>
            </div>
          )
        ) : (
          // Simple mode - solo chat
          <div className="crystal-card h-full flex flex-col lg:flex-row gap-6">{/* Contenido simple mode aquí */}</div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bento-full crystal-card p-6 ambient-glow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Análisis Generado por IA</h3>
              <p className="text-white/60 text-sm">Predicciones y tendencias detectadas</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-medium mb-4">Predicción de Ventas</h4>
            <div style={{ width: '100%', minWidth: 200, height: 250, minHeight: 250 }}>
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
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Area type="monotone" dataKey="ventas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVentas)" {...SAFE_ANIMATION_PROPS} />
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
          </div>

          {/* Insights */}
          <div className="space-y-3">
            <h4 className="text-white font-medium mb-4">Insights Clave</h4>

            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium text-sm">Tendencia Positiva</span>
              </div>
              <p className="text-white/80 text-xs">Incremento del 18% en ventas</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-medium text-sm">Predicción</span>
              </div>
              <p className="text-white/80 text-xs">Alcanzar 76K en ventas próximo mes</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 font-medium text-sm">Recomendación</span>
              </div>
              <p className="text-white/80 text-xs">Aumentar inventario en 15%</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPIs Premium de IA */}
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

      {/* Gráficos Avanzados de IA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Radar de Capacidades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
          <div style={{ width: '100%', minWidth: 150, height: 200, minHeight: 200 }}>
          <SafeChartContainer height={200} minHeight={150}>
            <RadarChart data={aiCapabilities}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
              <Radar name="Capacidad" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} {...SAFE_ANIMATION_PROPS} />
            </RadarChart>
          </SafeChartContainer>
          </div>
        </motion.div>

        {/* Activity Feed de IA */}
        <ActivityFeedWidget
          title="Actividad IA"
          activities={aiActivityFeed}
          maxItems={4}
          autoScroll
        />

        {/* Mini Charts de Performance */}
        <div className="grid grid-cols-2 gap-4">
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

      {/* AI Brain Visualizer - Premium Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="glass p-6 rounded-2xl border border-white/5 bg-black/20 mt-6"
      >
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">Red Neural IA</h3>
          <p className="text-sm text-white/60">Visualización de actividad cerebral del sistema</p>
        </div>
        <AIBrainVisualizer 
          width={900} 
          height={600} 
          isThinking={isTyping} 
          activityLevel={isListening ? 0.8 : 0.3}
          className="w-full" 
        />
      </motion.div>
    </div>
  )
}
