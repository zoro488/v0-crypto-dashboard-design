'use client'
/**
 * 🤖 FLOATING AI WIDGET - Contenedor del Agente IA Flotante
 * 
 * Este componente proporciona:
 * - Widget flotante en esquina inferior derecha
 * - Canvas 3D transparente con el agente
 * - Panel de chat expandible
 * - Integración con hook de IA
 * - Animaciones de entrada/salida
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion, AnimatePresence } from 'framer-motion'
import AIAgent3DWidget from '@/app/components/3d/AIAgent3DWidget'
import { Button } from '@/frontend/app/components/ui/button'
import { Input } from '@/frontend/app/components/ui/input'
import { ScrollArea } from '@/frontend/app/components/ui/scroll-area'
import { X, Send, Minimize2, Maximize2, Sparkles, Bot, User } from 'lucide-react'

// ============================================================================
// TIPOS
// ============================================================================
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ============================================================================
// HOOK DE IA SIMULADO (reemplazar con tu implementación real)
// ============================================================================
function useAI() {
  const [isLoading, setIsLoading] = useState(false)
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
    
    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    
    // Simular respuesta de IA (reemplazar con llamada real a API)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
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
    setIsLoading(false)
  }, [])

  return { isLoading, messages, askAgent }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export function FloatingAIWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [query, setQuery] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { isLoading, messages, askAgent } = useAI()

  // Auto-scroll cuando hay nuevos mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      
      {/* ════════════════════════════════════════════════════════════════════
          PANEL DE CHAT
          ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-96 h-[500px] bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-900/30 to-purple-900/30">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
                <div>
                  <span className="font-bold text-white">Chronos AI</span>
                  <p className="text-xs text-white/50">Asistente Neural v2.0</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-white/10 text-white/60"
                  onClick={() => setIsMinimized(true)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-white/10 text-white/60"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Área de Mensajes */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${message.role === 'assistant' 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      }
                    `}>
                      {message.role === 'assistant' 
                        ? <Bot className="w-4 h-4 text-white" />
                        : <User className="w-4 h-4 text-white" />
                      }
                    </div>
                    
                    {/* Burbuja de mensaje */}
                    <div className={`
                      max-w-[80%] p-3 rounded-2xl text-sm
                      ${message.role === 'assistant'
                        ? 'bg-white/10 text-white rounded-tl-sm'
                        : 'bg-blue-600/80 text-white rounded-tr-sm'
                      }
                    `}>
                      {message.content}
                    </div>
                  </motion.div>
                ))}
                
                {/* Indicador de carga */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <form 
              onSubmit={handleSubmit} 
              className="p-4 border-t border-white/10 bg-black/50"
            >
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pregunta algo..."
                  disabled={isLoading}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-blue-500/50"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !query.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel Minimizado */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-black/90 transition-colors"
            onClick={() => setIsMinimized(false)}
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-white/80">Chronos AI</span>
            <Maximize2 className="w-4 h-4 text-white/60" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════════
          BOT 3D FLOTANTE
          ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="relative w-24 h-24 cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
      >
        {/* Canvas 3D */}
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
          <pointLight position={[5, 5, 5]} intensity={1} />
          <AIAgent3DWidget
            isProcessing={isLoading}
            mood={isOpen ? 'speaking' : 'idle'}
            showLabel={false}
          />
        </Canvas>

        {/* Efecto de brillo de fondo */}
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl -z-10 animate-pulse" />
        
        {/* Indicador de notificación (cuando está cerrado) */}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black flex items-center justify-center"
          >
            <span className="text-[8px] font-bold text-white">1</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default FloatingAIWidget
