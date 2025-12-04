'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🎯 CHRONOS INFINITY - AI ASSISTANT WIDGET
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Widget flotante de asistente IA con orbe 3D Infinity
 * Integra el orbe con shaders premium y panel de chat
 * 
 * Características:
 * - Orbe 3D con distorsión líquida magnética
 * - Panel de chat con glassmorphism
 * - Sugerencias contextuales
 * - Reactividad a audio/voz
 * - Estados visuales dinámicos
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useRef, useEffect, Suspense, memo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { 
  X, Send, Minimize2, Maximize2, Sparkles, Bot, User, 
  Mic, MicOff, ChevronDown,
  BarChart3, FileText, Calculator, Package,
} from 'lucide-react'
import InfinityOrb, { OrbState } from '../3d/InfinityOrb'
import { INFINITY_COLORS, INFINITY_SHADOWS } from '@/app/lib/constants/infinity-design-system'
import { fadeIn, fadeInUp, popIn, modalContentVariants } from './motion-variants'

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════════════════
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface QuickAction {
  id: string
  label: string
  icon: typeof BarChart3
  prompt: string
}

// ════════════════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════════════════
const QUICK_ACTIONS: QuickAction[] = [
  { id: 'sales', label: 'Ventas del día', icon: BarChart3, prompt: '¿Cuáles son las ventas de hoy?' },
  { id: 'inventory', label: 'Inventario', icon: Package, prompt: 'Dame un resumen del inventario' },
  { id: 'report', label: 'Generar reporte', icon: FileText, prompt: 'Genera un reporte financiero' },
  { id: 'calculate', label: 'Calcular utilidades', icon: Calculator, prompt: 'Calcula las utilidades' },
]

// ════════════════════════════════════════════════════════════════════════════════════════
// SCENE 3D
// ════════════════════════════════════════════════════════════════════════════════════════
const OrbScene = memo(function OrbScene({ 
  state, 
  audioLevel, 
  onClick,
}: { 
  state: OrbState
  audioLevel: number
  onClick: () => void
}) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#8B00FF" />
      <pointLight position={[-5, -5, 5]} intensity={0.3} color="#FFD700" />
      
      <InfinityOrb
        state={state}
        audioLevel={audioLevel}
        scale={0.8}
        onClick={onClick}
        showRings
        glowIntensity={1.2}
      />
      
      <Environment preset="night" />
      
      <EffectComposer>
        <Bloom 
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
        />
        <Vignette offset={0.3} darkness={0.5} />
      </EffectComposer>
    </>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// STATIC FALLBACK
// ════════════════════════════════════════════════════════════════════════════════════════
const StaticOrbFallback = memo(function StaticOrbFallback({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      className="w-16 h-16 rounded-full relative overflow-hidden"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${INFINITY_COLORS.violet}, ${INFINITY_COLORS.gold})`,
        boxShadow: INFINITY_SHADOWS.glowViolet,
      }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `radial-gradient(circle at 30% 30%, ${INFINITY_COLORS.violet}, ${INFINITY_COLORS.gold})`,
            `radial-gradient(circle at 70% 70%, ${INFINITY_COLORS.gold}, ${INFINITY_COLORS.pink})`,
            `radial-gradient(circle at 30% 30%, ${INFINITY_COLORS.violet}, ${INFINITY_COLORS.gold})`,
          ],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-white" />
    </motion.button>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// CHAT PANEL
// ════════════════════════════════════════════════════════════════════════════════════════
const ChatPanel = memo(function ChatPanel({
  isOpen,
  onClose,
  messages,
  isLoading,
  onSendMessage,
  quickActions,
}: {
  isOpen: boolean
  onClose: () => void
  messages: Message[]
  isLoading: boolean
  onSendMessage: (message: string) => void
  quickActions: QuickAction[]
}) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue)
      setInputValue('')
    }
  }, [inputValue, isLoading, onSendMessage])
  
  const handleQuickAction = useCallback((action: QuickAction) => {
    onSendMessage(action.prompt)
  }, [onSendMessage])
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute bottom-20 right-0 w-[380px] max-h-[600px] rounded-2xl overflow-hidden"
          variants={modalContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            background: INFINITY_COLORS.glassBg,
            backdropFilter: 'blur(24px) saturate(180%)',
            border: `1px solid ${INFINITY_COLORS.glassBorder}`,
            boxShadow: `0 16px 64px rgba(0,0,0,0.5), ${INFINITY_SHADOWS.glowViolet}`,
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: INFINITY_COLORS.glassBorder }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: INFINITY_COLORS.success }}
              />
              <span className="text-sm font-medium text-white">CHRONOS AI</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors"
                style={{ 
                  color: INFINITY_COLORS.textSecondary,
                }}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors"
                style={{ 
                  color: INFINITY_COLORS.textSecondary,
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="h-[350px] overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: message.role === 'assistant' 
                      ? `linear-gradient(135deg, ${INFINITY_COLORS.violet}, ${INFINITY_COLORS.gold})`
                      : INFINITY_COLORS.glassBgHover,
                  }}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div 
                  className="max-w-[80%] rounded-xl px-4 py-2"
                  style={{
                    background: message.role === 'assistant' 
                      ? INFINITY_COLORS.glassBgHover
                      : INFINITY_COLORS.violetMuted,
                    border: `1px solid ${INFINITY_COLORS.glassBorder}`,
                  }}
                >
                  <p className="text-sm text-white/90">{message.content}</p>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div 
                className="flex gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${INFINITY_COLORS.violet}, ${INFINITY_COLORS.gold})`,
                  }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div 
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: INFINITY_COLORS.glassBgHover,
                    border: `1px solid ${INFINITY_COLORS.glassBorder}`,
                  }}
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: INFINITY_COLORS.violet }}
                        animate={{ y: [-2, 2, -2] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Quick Actions */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all"
                style={{
                  background: INFINITY_COLORS.glassBgHover,
                  border: `1px solid ${INFINITY_COLORS.glassBorder}`,
                  color: INFINITY_COLORS.textSecondary,
                }}
              >
                <action.icon className="w-3 h-3" />
                {action.label}
              </button>
            ))}
          </div>
          
          {/* Input */}
          <form 
            onSubmit={handleSubmit}
            className="p-4 border-t"
            style={{ borderColor: INFINITY_COLORS.glassBorder }}
          >
            <div 
              className="flex items-center gap-2 rounded-xl px-4 py-2"
              style={{
                background: INFINITY_COLORS.glassBgHover,
                border: `1px solid ${INFINITY_COLORS.glassBorder}`,
              }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2 rounded-lg transition-all disabled:opacity-50"
                style={{
                  background: inputValue.trim() ? INFINITY_COLORS.violet : 'transparent',
                }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════
function InfinityAIWidget() {
  const prefersReducedMotion = useReducedMotion()
  const [isOpen, setIsOpen] = useState(false)
  const [orbState, setOrbState] = useState<OrbState>('idle')
  const [audioLevel, setAudioLevel] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasWebGL, setHasWebGL] = useState(true)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente CHRONOS. Puedo ayudarte con análisis de datos, reportes y más. ¿En qué te puedo ayudar?',
      timestamp: new Date(),
    },
  ])
  
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      setHasWebGL(!!gl)
    } catch {
      setHasWebGL(false)
    }
  }, [])
  
  // Simular audio cuando habla
  useEffect(() => {
    if (orbState === 'speaking') {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.2)
      }, 100)
      return () => clearInterval(interval)
    } else {
      setAudioLevel(0)
    }
  }, [orbState])
  
  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])
  
  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    
    setIsLoading(true)
    setOrbState('thinking')
    
    // Simular respuesta (reemplazar con API real)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    setOrbState('speaking')
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `He procesado tu consulta sobre "${content}". Basándome en los datos del sistema CHRONOS, aquí tienes la información relevante.`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])
    
    setIsLoading(false)
    
    // Volver a idle después de "hablar"
    setTimeout(() => setOrbState('idle'), 2000)
  }, [])
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Panel */}
      <ChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        quickActions={QUICK_ACTIONS}
      />
      
      {/* Orb Button */}
      <motion.div
        className="w-16 h-16 cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {hasWebGL && !prefersReducedMotion ? (
          <Canvas
            camera={{ position: [0, 0, 4], fov: 50 }}
            style={{ borderRadius: '50%' }}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={null}>
              <OrbScene 
                state={orbState} 
                audioLevel={audioLevel}
                onClick={handleToggle}
              />
            </Suspense>
          </Canvas>
        ) : (
          <StaticOrbFallback onClick={handleToggle} />
        )}
      </motion.div>
    </div>
  )
}

export default memo(InfinityAIWidget)
