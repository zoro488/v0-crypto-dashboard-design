"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Mic, MicOff, Send, Activity, Brain, TrendingUp, BarChart3, Package, Users, DollarSign, Zap, Target, MessageCircle } from "lucide-react"
import { useState, useEffect, useRef, useMemo } from "react"
import { useVoiceAgent } from "@/frontend/app/hooks/useVoiceAgent"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"
import { SplineBot3D, useSplineBot } from "@/frontend/app/components/3d/SplineBot3D"
import { SplitScreenIA } from "@/frontend/app/components/3d/SplitScreenIA"
import { AIAnalyticsOverlay } from "@/frontend/app/components/3d/AIAnalyticsOverlay"
import { SplineWidget3D } from "@/frontend/app/components/3d/SplineWidget3D"
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell } from "recharts"
import { AIBrainVisualizer } from "@/frontend/app/components/visualizations/AIBrainVisualizer"
import { QuickStatWidget } from "@/frontend/app/components/widgets/QuickStatWidget"
import { MiniChartWidget } from "@/frontend/app/components/widgets/MiniChartWidget"
import { ActivityFeedWidget, ActivityItem } from "@/frontend/app/components/widgets/ActivityFeedWidget"

const analysisData = [
  { month: "Ene", ventas: 45000, compras: 32000, prediccion: 48000 },
  { month: "Feb", ventas: 52000, compras: 38000, prediccion: 54000 },
  { month: "Mar", ventas: 61000, compras: 42000, prediccion: 63000 },
  { month: "Abr", ventas: 58000, compras: 40000, prediccion: 60000 },
  { month: "May", ventas: 67000, compras: 45000, prediccion: 70000 },
  { month: "Jun", ventas: 72000, compras: 48000, prediccion: 76000 },
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
  sender: "user" | "ai"
  timestamp: Date
}

export default function BentoIA() {
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analyticsType, setAnalyticsType] = useState<"sales" | "inventory" | "clients" | "predictions">("sales")
  const [use3DMode, setUse3DMode] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { connect, disconnect, isConnected } = useVoiceAgent()
  const { voiceAgentStatus, audioFrequencies } = useAppStore()
  
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
      status: 'success'
    },
    {
      id: 'ai-2',
      type: 'sistema',
      title: 'Recomendación generada',
      description: 'Optimización de inventario sugerida',
      timestamp: new Date(Date.now() - 900000),
      status: 'success'
    },
    {
      id: 'ai-3',
      type: 'alerta',
      title: 'Alerta detectada',
      description: 'Stock bajo en 3 productos',
      timestamp: new Date(Date.now() - 1800000),
      status: 'pending'
    },
    {
      id: 'ai-4',
      type: 'sistema',
      title: 'Modelo actualizado',
      description: 'Red neural reentrenada con datos recientes',
      timestamp: new Date(Date.now() - 3600000),
      status: 'success'
    }
  ], [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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
      setTimeout(() => botControl.setIdle(), 2000)
    } else {
      botControl.setIdle()
    }
  }, [isListening, isTyping, messages])

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
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputText),
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()

    if (input.includes("ventas") || input.includes("vender")) {
      setShowAnalytics(true)
      setAnalyticsType("sales")
      return "📊 Las ventas totales ascienden a $3,378,700. Hay 3 ventas registradas, con un promedio de $1,126,233 por venta. He activado la visualización de análisis de ventas. ¿Te gustaría ver un análisis más detallado?"
    }

    if (input.includes("compras") || input.includes("órdenes")) {
      setShowAnalytics(true)
      setAnalyticsType("inventory")
      return "📦 Hay 9 órdenes de compra registradas por un total de $14,678,900. La deuda pendiente es de $13,725,800. He mostrado el análisis de inventario. ¿Necesitas información sobre algún distribuidor específico?"
    }

    if (input.includes("banco") || input.includes("saldo")) {
      return "💰 Estado de bancos: Bóveda Monte ($0), Bóveda USA ($0), Utilidades ($0), Fletes ($0), Azteca ($0), Leftie ($0), Profit ($0). ¿Quieres ver movimientos recientes?"
    }

    if (input.includes("stock") || input.includes("inventario")) {
      setShowAnalytics(true)
      setAnalyticsType("inventory")
      return "📦 Stock actual: 17 unidades del Producto Principal. Total entradas: 2,296 | Total salidas: 2,279. El stock está en nivel bajo, considera generar una orden de compra. He activado el análisis de inventario."
    }

    if (input.includes("clientes") || input.includes("cliente")) {
      setShowAnalytics(true)
      setAnalyticsType("clients")
      return "👥 Análisis de clientes activado. Tenemos 31 clientes activos con una tasa de retención del 94%. ¿Quieres ver detalles específicos?"
    }

    if (input.includes("predicción") || input.includes("prediccion") || input.includes("futuro")) {
      setShowAnalytics(true)
      setAnalyticsType("predictions")
      return "🔮 He generado predicciones basadas en IA. La tendencia del mercado es alcista con 87% de probabilidad de alcanzar objetivos. ¿Quieres explorar más?"
    }

    if (input.includes("dashboard") || input.includes("inicio")) {
      return "🏠 Te llevaré al dashboard principal donde puedes ver todos los KPIs en tiempo real."
    }

    return "🤖 Soy tu asistente inteligente de Chronos. Puedo ayudarte con información sobre ventas, compras, bancos, inventario y mucho más. ¿Qué te gustaría saber?"
  }

  const quickActions = [
    { label: "Análisis de Ventas", icon: TrendingUp, type: "sales" as const },
    { label: "Estado de Inventario", icon: Package, type: "inventory" as const },
    { label: "Clientes Activos", icon: Users, type: "clients" as const },
    { label: "Predicciones IA", icon: Brain, type: "predictions" as const },
  ]

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setInputText(action.label)
    setShowAnalytics(true)
    setAnalyticsType(action.type)
  }

  return (
    <div className="bento-container relative">
      {/* Main interface with split screen */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-full h-[calc(100vh-12rem)] relative"
      >
        {use3DMode ? (
          <SplitScreenIA
            defaultRatio={35}
            leftContent={
              <div className="relative w-full h-full flex items-center justify-center p-8">
                <SplineBot3D
                  isListening={isListening}
                  isSpeaking={isTyping}
                  className="w-full h-full"
                />
                
                {/* Widget 3D flotante pequeño */}
                <div className="absolute bottom-8 right-8">
                  <SplineWidget3D size="sm" />
                </div>
              </div>
            }
            rightContent={
              <div className="relative w-full h-full">
                {/* Chat interface */}
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
                            ${isListening ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-white/10"}
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
                              className={`w-2 h-2 rounded-full ${voiceAgentStatus === "listening" ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
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
                          {use3DMode ? "Vista Simple" : "Vista 3D"}
                        </button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={toggleVoiceAgent}
                          className={`
                            px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all
                            ${isListening ? "bg-red-500 hover:bg-red-600" : "btn-premium"}
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
                            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`
                                max-w-[70%] p-4 rounded-2xl
                                ${message.sender === "user" ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white" : "bg-white/10 text-white"}
                              `}
                            >
                              <p className="text-sm leading-relaxed">{message.text}</p>
                              <span className="text-xs opacity-70 mt-2 block">
                                {message.timestamp.toLocaleTimeString("es-MX", {
                                  hour: "2-digit",
                                  minute: "2-digit",
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
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
            }
          />
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
            <ResponsiveContainer width="100%" height={250}>
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
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                />
                <Area type="monotone" dataKey="ventas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVentas)" />
                <Area
                  type="monotone"
                  dataKey="prediccion"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorPrediccion)"
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
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
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={aiCapabilities}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
              <Radar name="Capacidad" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
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
