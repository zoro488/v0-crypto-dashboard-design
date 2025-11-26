'use client'
/**
 * 🤖 FLOATING AI WIDGET - Contenedor del Agente IA Flotante Premium
 * 
 * Este componente proporciona:
 * - Widget flotante en esquina inferior derecha
 * - Canvas 3D transparente con el agente
 * - Panel de chat expandible con efectos glassmorphism
 * - Integración con hook de IA
 * - Animaciones de entrada/salida premium
 * - Efectos de partículas y ondas reactivas
 * - Sistema de estado visual del agente
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import AIAgent3DWidget from '@/app/components/3d/AIAgent3DWidget'
import { Button } from '@/frontend/app/components/ui/button'
import { Input } from '@/frontend/app/components/ui/input'
import { ScrollArea } from '@/frontend/app/components/ui/scroll-area'
import { X, Send, Minimize2, Maximize2, Sparkles, Bot, User, Zap, Brain, Activity, MessageSquare } from 'lucide-react'
import * as THREE from 'three'

// ============================================================================
// TIPOS
// ============================================================================
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type AgentStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'success' | 'error'

// ============================================================================
// COMPONENTE DE PARTÍCULAS FLOTANTES
// ============================================================================
function FloatingParticles({ count = 20, active = false }: { count?: number; active?: boolean }) {
  const particlesRef = useRef<THREE.Points>(null)
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const theta = Math.random() * Math.PI * 2
      const radius = 0.8 + Math.random() * 0.5
      
      positions[i3] = Math.cos(theta) * radius
      positions[i3 + 1] = (Math.random() - 0.5) * 2
      positions[i3 + 2] = Math.sin(theta) * radius
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [count])
  
  useFrame((state) => {
    if (!particlesRef.current) return
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.getElapsedTime()
    const speed = active ? 2 : 0.5
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3] += Math.sin(time * speed + i) * 0.005
      positions[i3 + 1] += Math.cos(time * speed + i) * 0.005
      positions[i3 + 2] += Math.sin(time * speed + i * 0.5) * 0.005
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.03}
        color={active ? '#60a5fa' : '#3b82f6'}
        transparent
        opacity={active ? 0.8 : 0.4}
        sizeAttenuation
      />
    </points>
  )
}

// ============================================================================
// COMPONENTE DE ANILLOS DE PULSO
// ============================================================================
function PulseRings({ active = false }: { active?: boolean }) {
  const ringsRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!ringsRef.current) return
    const time = state.clock.getElapsedTime()
    
    ringsRef.current.children.forEach((ring, i) => {
      const scale = 1 + Math.sin(time * (active ? 3 : 1) + i * 0.5) * 0.1
      ring.scale.setScalar(scale)
      
      if (ring instanceof THREE.Mesh && ring.material instanceof THREE.MeshBasicMaterial) {
        ring.material.opacity = 0.3 + Math.sin(time * 2 + i) * 0.2
      }
    })
  })
  
  return (
    <group ref={ringsRef}>
      {[0.9, 1.1, 1.3].map((radius, i) => (
        <mesh key={i} rotation-x={Math.PI / 2}>
          <ringGeometry args={[radius - 0.02, radius, 64]} />
          <meshBasicMaterial
            color={active ? '#60a5fa' : '#3b82f6'}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================================
// HOOK DE IA SIMULADO (reemplazar con tu implementación real)
// ============================================================================
function useAI() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<AgentStatus>('idle')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy Chronos, tu asistente de inteligencia artificial. ¿En qué puedo ayudarte con tus finanzas hoy?',
      timestamp: new Date()
    }
  ])

  const askAgent = useCallback(async (query: string) => {
    setIsLoading(true)
    setStatus('listening')
    
    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    
    // Fase de pensamiento
    await new Promise(resolve => setTimeout(resolve, 500))
    setStatus('thinking')
    
    // Simular respuesta de IA (reemplazar con llamada real a API)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setStatus('speaking')
    
    const responses = [
      `He analizado tu consulta sobre "${query}". Basándome en los datos del sistema, te recomiendo revisar el panel de ventas para más detalles.`,
      `Entiendo. Respecto a "${query}", los indicadores financieros muestran un comportamiento positivo este mes.`,
      `Gracias por tu pregunta. Sobre "${query}", puedo ver en el dashboard que hay oportunidades de mejora en la gestión de inventario.`,
      `Analizando "${query}"... He encontrado patrones interesantes en tus transacciones recientes que podrían optimizar tus operaciones.`
    ]
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, aiMessage])
    setStatus('success')
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    setStatus('idle')
    setIsLoading(false)
  }, [])

  return { isLoading, status, messages, askAgent }
}

// ============================================================================
// COMPONENTE DE STATUS INDICATOR
// ============================================================================
function StatusIndicator({ status }: { status: AgentStatus }) {
  const statusConfig: Record<AgentStatus, { color: string; label: string; icon: typeof Activity }> = {
    idle: { color: 'bg-emerald-500', label: 'En línea', icon: Activity },
    listening: { color: 'bg-blue-500', label: 'Escuchando...', icon: MessageSquare },
    thinking: { color: 'bg-purple-500', label: 'Procesando...', icon: Brain },
    speaking: { color: 'bg-cyan-500', label: 'Respondiendo...', icon: Zap },
    success: { color: 'bg-green-500', label: 'Completado', icon: Sparkles },
    error: { color: 'bg-red-500', label: 'Error', icon: X }
  }
  
  const config = statusConfig[status]
  const Icon = config.icon
  
  return (
    <motion.div 
      className="flex items-center gap-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      key={status}
    >
      <motion.div 
        className={`w-2 h-2 rounded-full ${config.color}`}
        animate={{ 
          scale: status === 'idle' ? 1 : [1, 1.3, 1],
          opacity: status === 'idle' ? 1 : [1, 0.7, 1]
        }}
        transition={{ 
          duration: 1, 
          repeat: status === 'idle' ? 0 : Infinity 
        }}
      />
      <span className="text-xs text-white/50">{config.label}</span>
    </motion.div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export function FloatingAIWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [query, setQuery] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { isLoading, status, messages, askAgent } = useAI()
  
  // Motion values para el orbe flotante
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 150 }
  const orbX = useSpring(mouseX, springConfig)
  const orbY = useSpring(mouseY, springConfig)

  // Auto-scroll cuando hay nuevos mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])
  
  // Focus en input al abrir
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, isMinimized])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return
    
    await askAgent(query)
    setQuery('')
  }

  const toggleOpen = () => {
    setIsOpen(!isOpen)
    setIsMinimized(false)
  }
  
  // Handler para movimiento del mouse sobre el orbe
  const handleOrbMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set((e.clientX - centerX) * 0.1)
    mouseY.set((e.clientY - centerY) * 0.1)
  }
  
  const handleOrbMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      
      {/* ════════════════════════════════════════════════════════════════════
          PANEL DE CHAT PREMIUM
          ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.85, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 30, scale: 0.85, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-[420px] h-[550px] bg-black/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(59,130,246,0.15)] flex flex-col overflow-hidden"
          >
            {/* Fondo gradiente animado */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <motion.div 
                className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]"
                animate={{ 
                  x: [0, 30, 0], 
                  y: [0, -20, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div 
                className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px]"
                animate={{ 
                  x: [0, -30, 0], 
                  y: [0, 20, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            
            {/* Header Premium */}
            <div className="relative p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-purple-900/20">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="relative"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                      <Brain className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                  <motion.span 
                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <span className="font-bold text-white text-lg">Chronos AI</span>
                  <StatusIndicator status={status} />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-white/10 text-white/60"
                    onClick={() => setIsMinimized(true)}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-white/10 text-white/60"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Área de Mensajes con scroll mejorado */}
            <ScrollArea className="flex-1 p-5 relative" ref={scrollRef}>
              <div className="space-y-5">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.05, type: 'spring', damping: 20 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar con animación */}
                    <motion.div 
                      className={`
                        w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                        ${message.role === 'assistant' 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25' 
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25'
                        }
                      `}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      {message.role === 'assistant' 
                        ? <Bot className="w-5 h-5 text-white" />
                        : <User className="w-5 h-5 text-white" />
                      }
                    </motion.div>
                    
                    {/* Burbuja de mensaje premium */}
                    <motion.div 
                      className={`
                        max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed
                        ${message.role === 'assistant'
                          ? 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'
                          : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-sm shadow-lg shadow-blue-500/20'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                    >
                      {message.content}
                      <div className={`text-[10px] mt-2 ${message.role === 'assistant' ? 'text-white/30' : 'text-white/60'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
                
                {/* Indicador de carga mejorado */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Brain className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                          <motion.span 
                            key={i}
                            className="w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                            animate={{ 
                              y: [-3, 3, -3],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ 
                              duration: 0.8, 
                              repeat: Infinity,
                              delay: i * 0.15
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Premium */}
            <form 
              onSubmit={handleSubmit} 
              className="relative p-4 border-t border-white/10 bg-black/40"
            >
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    disabled={isLoading}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-blue-500/50 rounded-xl h-12 pr-4 pl-4"
                  />
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !query.trim()}
                    className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-30 shadow-lg shadow-blue-500/25"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </motion.div>
              </div>
              
              {/* Sugerencias rápidas */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {['¿Resumen del día?', 'Ventas de hoy', 'Estado del inventario'].map((suggestion, i) => (
                  <motion.button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    disabled={isLoading}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white whitespace-nowrap transition-colors"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel Minimizado Premium */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-4 cursor-pointer shadow-[0_0_40px_rgba(59,130,246,0.1)]"
            onClick={() => setIsMinimized(false)}
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-5 h-5 text-blue-400" />
              </motion.div>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
            </div>
            <span className="text-sm font-medium text-white">Chronos AI</span>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-xs text-white/50">{messages.length} mensajes</span>
            <Maximize2 className="w-4 h-4 text-white/40" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════════
          BOT 3D FLOTANTE PREMIUM
          ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="relative w-28 h-28 cursor-pointer"
        style={{ x: orbX, y: orbY }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        onMouseMove={handleOrbMouseMove}
        onMouseLeave={handleOrbMouseLeave}
      >
        {/* Canvas 3D con partículas y efectos */}
        <Canvas
          gl={{ alpha: true, antialias: true }}
          camera={{ position: [0, 0, 4], fov: 45 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} intensity={1} color="#60a5fa" />
          <pointLight position={[-5, -5, 5]} intensity={0.5} color="#a855f7" />
          
          <FloatingParticles count={25} active={isLoading || status === 'thinking'} />
          <PulseRings active={isLoading || status === 'speaking'} />
          
          <AIAgent3DWidget
            isProcessing={isLoading}
            mood={isOpen ? 'speaking' : 'idle'}
            showLabel={false}
          />
        </Canvas>

        {/* Efecto de brillo de fondo mejorado */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl -z-10"
          animate={{ 
            scale: isLoading ? [1, 1.3, 1] : [1, 1.1, 1],
            opacity: isLoading ? [0.4, 0.6, 0.4] : [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Anillos orbitales decorativos */}
        <motion.div
          className="absolute inset-[-4px] border border-blue-500/20 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-[-8px] border border-purple-500/10 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Indicador de notificación mejorado */}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full border-2 border-black flex items-center justify-center shadow-lg shadow-green-500/30"
          >
            <motion.span 
              className="text-[10px] font-bold text-white"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              AI
            </motion.span>
          </motion.div>
        )}
        
        {/* Estado visual */}
        <AnimatePresence>
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-full border border-white/10"
            >
              <span className="text-[9px] text-white/70 whitespace-nowrap capitalize">{status}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default FloatingAIWidget
