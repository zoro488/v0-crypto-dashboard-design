'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { cn, formatCurrency } from '@/app/_lib/utils'
import { useChronosStore } from '@/app/lib/store'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIInsight {
  id: string
  type: 'success' | 'warning' | 'info' | 'prediction'
  title: string
  description: string
  value?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// AI RESPONSE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateAIResponse(input: string, context: any): string {
  const lowerInput = input.toLowerCase()
  
  if (lowerInput.includes('capital') || lowerInput.includes('dinero') || lowerInput.includes('balance')) {
    const total = Object.values(context.bancos).reduce((acc: number, b: any) => acc + (b.capitalActual || 0), 0)
    return `📊 **Resumen de Capital**\n\nEl capital total actual es de **${formatCurrency(total as number)}**.\n\nDistribuido en ${Object.keys(context.bancos).length} bancos/bóvedas.`
  }
  
  if (lowerInput.includes('venta') || lowerInput.includes('ventas')) {
    const totalVentas = context.ventas?.length || 0
    const montoTotal = context.ventas?.reduce((acc: number, v: any) => acc + (v.precioTotalVenta || 0), 0) || 0
    return `📈 **Análisis de Ventas**\n\nTienes **${totalVentas}** ventas registradas.\nMonto total: **${formatCurrency(montoTotal)}**\n\n¿Necesitas un reporte más detallado?`
  }
  
  if (lowerInput.includes('cliente')) {
    const totalClientes = context.clientes?.length || 0
    const activos = context.clientes?.filter((c: any) => c.estado === 'activo').length || 0
    return `👥 **Cartera de Clientes**\n\nTotal: **${totalClientes}** clientes\nActivos: **${activos}**\n\nPuedo mostrarte los clientes con deudas pendientes si lo necesitas.`
  }
  
  if (lowerInput.includes('ayuda') || lowerInput.includes('puedes')) {
    return `🤖 **¿Cómo puedo ayudarte?**\n\n• Consultar capital y balance de bancos\n• Analizar ventas y tendencias\n• Ver cartera de clientes\n• Generar reportes\n• Verificar stock de almacén\n• Optimizar distribución de capital\n\nSolo pregúntame lo que necesites.`
  }
  
  if (lowerInput.includes('hola') || lowerInput.includes('buenos')) {
    return `👋 **¡Hola!**\n\nSoy CHRONOS AI, tu asistente financiero. Estoy listo para ayudarte con:\n\n• Análisis de datos\n• Reportes en tiempo real\n• Predicciones\n• Recomendaciones\n\n¿En qué puedo asistirte hoy?`
  }
  
  return `🤔 Entiendo tu consulta sobre "${input}".\n\nPuedo ayudarte con información sobre capital, ventas, clientes, distribuidores y almacén. ¿Podrías ser más específico?\n\nEjemplos:\n• "¿Cuál es el capital total?"\n• "Muestra las ventas del mes"\n• "¿Cuántos clientes activos hay?"`
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function IAClient() {
  const { bancos, ventas, clientes, distribuidores, ordenesCompra } = useChronosStore()
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy **CHRONOS AI**, tu asistente financiero inteligente. 🤖\n\nPuedo ayudarte a:\n\n• 📊 Analizar tus ventas y tendencias\n• 📝 Generar reportes automáticos\n• 💰 Predecir flujo de caja\n• 🎯 Optimizar distribución de capital\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Insights basados en datos reales
  const insights: AIInsight[] = [
    {
      id: '1',
      type: 'success',
      title: 'Sistema Operativo',
      description: `${Object.keys(bancos).length} bancos activos con capital distribuido`,
      value: formatCurrency(Object.values(bancos).reduce((acc, b) => acc + (b.capitalActual || 0), 0)),
    },
    {
      id: '2',
      type: 'info',
      title: 'Ventas Registradas',
      description: `Total de ${ventas.length} ventas en el sistema`,
      value: formatCurrency(ventas.reduce((acc, v) => acc + (v.precioTotalVenta || 0), 0)),
    },
    {
      id: '3',
      type: clientes.filter(c => (c.deuda || 0) > 0).length > 5 ? 'warning' : 'success',
      title: 'Cartera de Clientes',
      description: `${clientes.filter(c => c.estado === 'activo').length} clientes activos`,
    },
    {
      id: '4',
      type: 'prediction',
      title: 'Órdenes de Compra',
      description: `${ordenesCompra.length} órdenes en el sistema`,
      value: formatCurrency(ordenesCompra.reduce((acc, o) => acc + (o.costoTotal || 0), 0)),
    },
  ]

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    
    // Simular respuesta de IA
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(input, { bancos, ventas, clientes, distribuidores, ordenesCompra }),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 
                          flex items-center justify-center">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 
                          border-2 border-gray-900 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 
                         bg-clip-text text-transparent">
              CHRONOS AI
            </h1>
            <p className="text-gray-400">Asistente Financiero Inteligente</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSpeaking(!isSpeaking)}
            className={cn(
              'p-3 rounded-xl border transition-all',
              isSpeaking 
                ? 'bg-violet-500/20 border-violet-500/30 text-violet-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            )}
          >
            {isSpeaking ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights Panel */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Insights en Tiempo Real
          </h3>
          
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-xl border",
                  insight.type === 'success' && 'bg-emerald-500/10 border-emerald-500/20',
                  insight.type === 'warning' && 'bg-amber-500/10 border-amber-500/20',
                  insight.type === 'info' && 'bg-blue-500/10 border-blue-500/20',
                  insight.type === 'prediction' && 'bg-violet-500/10 border-violet-500/20',
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{insight.title}</p>
                    <p className="text-sm text-gray-400 mt-1">{insight.description}</p>
                  </div>
                  {insight.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                  {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400" />}
                  {insight.type === 'info' && <BarChart3 className="h-5 w-5 text-blue-400" />}
                  {insight.type === 'prediction' && <TrendingUp className="h-5 w-5 text-violet-400" />}
                </div>
                {insight.value && (
                  <p className="text-lg font-bold mt-2">{insight.value}</p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-gray-400 mb-3">Acciones Rápidas</p>
            <div className="flex flex-wrap gap-2">
              {['Capital total', 'Ventas del mes', 'Clientes activos'].map((action) => (
                <button
                  key={action}
                  onClick={() => {
                    setInput(action)
                    handleSend()
                  }}
                  className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg 
                           hover:bg-white/10 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-2 flex flex-col h-[600px] rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-2xl",
                    message.role === 'user' 
                      ? 'bg-violet-500/20 border border-violet-500/30'
                      : 'bg-white/5 border border-white/10'
                  )}>
                    <div className="prose prose-invert prose-sm max-w-none">
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className="mb-1 last:mb-0">
                          {line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                               .split('<strong>')
                               .map((part, j) => {
                                 if (part.includes('</strong>')) {
                                   const [bold, rest] = part.split('</strong>')
                                   return <span key={j}><strong className="text-white">{bold}</strong>{rest}</span>
                                 }
                                 return <span key={j}>{part}</span>
                               })
                          }
                        </p>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-gray-400"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">CHRONOS AI está escribiendo...</span>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <button 
                onClick={() => setIsListening(!isListening)}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  isListening 
                    ? 'bg-red-500/20 border-red-500/30 text-red-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                )}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                         text-white placeholder-gray-500 focus:border-violet-500/50 focus:outline-none"
              />
              
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl 
                         disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
