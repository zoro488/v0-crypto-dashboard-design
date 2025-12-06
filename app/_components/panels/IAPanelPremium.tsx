'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PREMIUM IA PANEL
// Centro de IA con chat, insights y análisis predictivo
// ═══════════════════════════════════════════════════════════════

import { Suspense, useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  PerspectiveCamera, 
  Environment, 
  Float,
  MeshTransmissionMaterial,
  Sphere,
  MeshDistortMaterial,
} from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain,
  Sparkles,
  MessageSquare,
  Send,
  Mic,
  MicOff,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  BarChart3,
  ArrowRight,
  RefreshCw,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react'
import { cn, formatCurrency } from '@/app/_lib/utils'
import type { Banco } from '@/database/schema'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface AIInsight {
  id: string
  type: 'success' | 'warning' | 'info' | 'prediction'
  title: string
  description: string
  action?: string
  value?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface IAPanelProps {
  bancos: Banco[]
  insights?: AIInsight[]
}

// ═══════════════════════════════════════════════════════════════
// 3D COMPONENTS
// ═══════════════════════════════════════════════════════════════

function NeuralCore() {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hue, setHue] = useState(0)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
      meshRef.current.rotation.y += 0.005
    }
    setHue((state.clock.elapsedTime * 20) % 360)
  })

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 4]} />
        <MeshDistortMaterial
          color={`hsl(${hue}, 70%, 60%)`}
          speed={2}
          distort={0.3}
          radius={1}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Inner glow */}
      <Sphere args={[1.2, 32, 32]}>
        <MeshTransmissionMaterial
          color="#8B5CF6"
          transmission={0.95}
          thickness={0.5}
          roughness={0}
          chromaticAberration={1}
        />
      </Sphere>
      
      {/* Orbiting particles */}
      {[...Array(8)].map((_, i) => (
        <OrbitingParticle key={i} index={i} total={8} />
      ))}
      
      <pointLight color="#8B5CF6" intensity={3} distance={5} />
      <pointLight color="#EC4899" intensity={2} distance={4} position={[2, 0, 0]} />
    </Float>
  )
}

function OrbitingParticle({ index, total }: { index: number; total: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const angle = (index / total) * Math.PI * 2
  const radius = 2.5

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime + angle
      ref.current.position.x = Math.cos(t) * radius
      ref.current.position.z = Math.sin(t) * radius
      ref.current.position.y = Math.sin(t * 2) * 0.5
    }
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color="#EC4899"
        emissive="#EC4899"
        emissiveIntensity={2}
      />
    </mesh>
  )
}

function AIScene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45} />
      <ambientLight intensity={0.2} />
      <Environment preset="night" />
      <NeuralCore />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// INSIGHT CARD
// ═══════════════════════════════════════════════════════════════

function InsightCard({ insight, index }: { insight: AIInsight; index: number }) {
  const icons = {
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Lightbulb,
    prediction: TrendingUp,
  }
  
  const colors = {
    success: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400',
    warning: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400',
    info: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
    prediction: 'from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400',
  }
  
  const Icon = icons[insight.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'p-4 rounded-xl border bg-gradient-to-r backdrop-blur-sm',
        colors[insight.type]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white/10">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white">{insight.title}</h4>
          <p className="text-sm text-gray-400 mt-1">{insight.description}</p>
          {insight.value && (
            <p className="text-lg font-bold text-white mt-2 font-mono">{insight.value}</p>
          )}
          {insight.action && (
            <button className="mt-3 flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all">
              {insight.action}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CHAT MESSAGE
// ═══════════════════════════════════════════════════════════════

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div className={cn(
        'max-w-[80%] p-4 rounded-2xl',
        isUser 
          ? 'bg-violet-500/20 border border-violet-500/30 rounded-br-sm'
          : 'bg-white/5 border border-white/10 rounded-bl-sm'
      )}>
        <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
        <p className="text-xs text-gray-500 mt-2">
          {message.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// QUICK ACTION
// ═══════════════════════════════════════════════════════════════

function QuickAction({ 
  label, 
  icon: Icon, 
  onClick 
}: { 
  label: string
  icon: LucideIcon
  onClick: () => void 
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10
                 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all text-sm text-gray-300"
    >
      <Icon className="h-4 w-4 text-violet-400" />
      {label}
    </motion.button>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function IAPanelPremium({ bancos, insights = [] }: IAPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy CHRONOS AI, tu asistente financiero. Puedo ayudarte a:\n\n• Analizar tus ventas y tendencias\n• Generar reportes automáticos\n• Predecir flujo de caja\n• Optimizar distribución de capital\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Default insights si no hay datos
  const defaultInsights: AIInsight[] = [
    {
      id: '1',
      type: 'success',
      title: 'Crecimiento Positivo',
      description: 'Las ventas han aumentado un 15% respecto al mes anterior',
      value: '+15%',
    },
    {
      id: '2',
      type: 'prediction',
      title: 'Proyección Semanal',
      description: 'Se estima un ingreso de $150,000 para los próximos 7 días',
      value: formatCurrency(150000),
    },
    {
      id: '3',
      type: 'warning',
      title: 'Atención Requerida',
      description: 'Hay 3 clientes con pagos vencidos que requieren seguimiento',
      action: 'Ver clientes',
    },
    {
      id: '4',
      type: 'info',
      title: 'Oportunidad Detectada',
      description: 'El margen de utilidad podría mejorar optimizando los costos de flete',
      action: 'Ver análisis',
    },
  ]

  const activeInsights = insights.length > 0 ? insights : defaultInsights

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
        content: generateAIResponse(input, bancos),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleQuickAction = (action: string) => {
    setInput(action)
    handleSend()
  }

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
        {/* Left Column - 3D + Insights */}
        <div className="lg:col-span-1 space-y-6">
          {/* 3D Neural Core */}
          <div className="relative h-[250px] rounded-3xl overflow-hidden border border-white/10 
                        bg-gradient-to-br from-violet-500/5 to-purple-500/5">
            <Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-violet-500" />
              </div>
            }>
              <Canvas>
                <AIScene />
              </Canvas>
            </Suspense>
            
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span>IA Activa • Analizando datos...</span>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-violet-400" />
              Insights en Tiempo Real
            </h2>
            <div className="space-y-3">
              {activeInsights.map((insight, index) => (
                <InsightCard key={insight.id} insight={insight} index={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className="lg:col-span-2">
          <div className="h-[600px] flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] 
                        backdrop-blur-xl overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-violet-400" />
                <span className="font-medium text-white">Chat con IA</span>
              </div>
              <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-gray-400"
                >
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm">CHRONOS AI está escribiendo...</span>
                </motion.div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-3 border-t border-white/5 flex gap-2 overflow-x-auto">
              <QuickAction 
                label="Resumen del día" 
                icon={BarChart3} 
                onClick={() => handleQuickAction('Dame un resumen del día de hoy')} 
              />
              <QuickAction 
                label="Proyección semanal" 
                icon={TrendingUp} 
                onClick={() => handleQuickAction('¿Cuál es la proyección para esta semana?')} 
              />
              <QuickAction 
                label="Alertas pendientes" 
                icon={AlertTriangle} 
                onClick={() => handleQuickAction('¿Hay alertas o pendientes importantes?')} 
              />
              <QuickAction 
                label="Optimizar capital" 
                icon={Zap} 
                onClick={() => handleQuickAction('¿Cómo puedo optimizar el capital entre bancos?')} 
              />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsListening(!isListening)}
                  className={cn(
                    'p-3 rounded-xl border transition-all',
                    isListening 
                      ? 'bg-red-500/20 border-red-500/30 text-red-400 animate-pulse'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  )}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3
                           text-white placeholder:text-gray-500 focus:outline-none 
                           focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
                />
                
                <motion.button
                  onClick={handleSend}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!input.trim()}
                  className={cn(
                    'p-3 rounded-xl transition-all',
                    input.trim()
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                      : 'bg-white/5 text-gray-500'
                  )}
                >
                  <Send className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// AI RESPONSE GENERATOR (Placeholder)
// ═══════════════════════════════════════════════════════════════

function generateAIResponse(input: string, bancos: Banco[]): string {
  const totalCapital = bancos.reduce((sum, b) => sum + (b.capitalActual || 0), 0)
  const inputLower = input.toLowerCase()
  
  if (inputLower.includes('resumen') || inputLower.includes('día')) {
    return `📊 **Resumen del día:**\n\n• Capital total: ${formatCurrency(totalCapital)}\n• Bancos activos: ${bancos.length}\n• Estado: Todo operando normalmente\n\n¿Te gustaría ver más detalles de algún banco específico?`
  }
  
  if (inputLower.includes('proyección') || inputLower.includes('semana')) {
    return `📈 **Proyección semanal:**\n\nBasándome en las tendencias actuales:\n\n• Ingresos estimados: ${formatCurrency(totalCapital * 0.15)}\n• Gastos proyectados: ${formatCurrency(totalCapital * 0.08)}\n• Utilidad esperada: ${formatCurrency(totalCapital * 0.07)}\n\nLa tendencia es positiva con un crecimiento del 12% respecto a la semana anterior.`
  }
  
  if (inputLower.includes('alerta') || inputLower.includes('pendiente')) {
    return `⚠️ **Alertas y pendientes:**\n\n1. 3 clientes con pagos vencidos\n2. Stock bajo en 2 productos\n3. Transferencia pendiente de aprobar\n\n¿Quieres que te muestre los detalles de alguna alerta?`
  }
  
  if (inputLower.includes('optimizar') || inputLower.includes('capital')) {
    return `💡 **Sugerencias de optimización:**\n\n1. **Bóveda Monte** tiene exceso de capital. Considera transferir ${formatCurrency(totalCapital * 0.1)} a Utilidades.\n\n2. **Flete Sur** necesita refuerzo para cubrir operaciones de la próxima semana.\n\n3. El ratio óptimo sería: 40% operativo, 35% inversión, 25% ahorro.\n\n¿Ejecuto alguna de estas recomendaciones?`
  }
  
  return `Entiendo tu consulta sobre "${input}". \n\nBasándome en los datos actuales del sistema con ${bancos.length} bancos y un capital total de ${formatCurrency(totalCapital)}, puedo ayudarte a analizar tendencias, generar reportes o hacer proyecciones.\n\n¿Podrías ser más específico sobre lo que necesitas?`
}

export default IAPanelPremium
