'use client'
/**
 * 💬 IMMERSIVE AI CHAT - Interfaz de Conversación Modo Zen
 * 
 * Chat inmersivo de pantalla completa con:
 * - Mensajes con efecto de streaming ultra suave
 * - Data Cards renderizadas dinámicamente
 * - Voice Wave sincronizada con audio
 * - Input multimodal (voz, archivos, acciones rápidas)
 * - Diseño minimalista estilo ChatGPT/Claude premium
 */

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import * as THREE from 'three'
import {
  Mic,
  Send,
  Paperclip,
  Zap,
  X,
  ArrowLeft,
  Settings,
  Volume2,
  VolumeX,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Table,
  BarChart3,
  Play,
  Pause,
  ChevronDown,
  Plus,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react'

import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { ScrollArea } from '@/app/components/ui/scroll-area'

// ============================================================================
// TIPOS
// ============================================================================
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  dataCard?: DataCard
}

interface DataCard {
  type: 'chart' | 'table' | 'kpi' | 'image'
  title: string
  data: unknown
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

// ============================================================================
// COMPONENTE DE ONDA DE VOZ
// ============================================================================
interface VoiceWaveProps {
  isActive: boolean
  audioLevel: number
}

function VoiceWave({ isActive, audioLevel }: VoiceWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const barsRef = useRef<number[]>(Array(64).fill(0))

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      const width = canvas.width
      const height = canvas.height
      const barCount = 64
      const barWidth = width / barCount
      const maxBarHeight = height * 0.8

      ctx.clearRect(0, 0, width, height)

      // Actualizar barras con suavizado
      for (let i = 0; i < barCount; i++) {
        const targetHeight = isActive
          ? (Math.sin(Date.now() * 0.01 + i * 0.3) * 0.5 + 0.5) * audioLevel * maxBarHeight
          : 2

        barsRef.current[i] = THREE.MathUtils.lerp(
          barsRef.current[i],
          targetHeight,
          0.15
        )

        const barHeight = barsRef.current[i]
        const x = i * barWidth
        const y = (height - barHeight) / 2

        // Gradiente
        const gradient = ctx.createLinearGradient(x, y + barHeight, x, y)
        gradient.addColorStop(0, isActive ? 'rgba(0, 212, 255, 0.3)' : 'rgba(100, 100, 100, 0.2)')
        gradient.addColorStop(0.5, isActive ? 'rgba(0, 212, 255, 0.8)' : 'rgba(100, 100, 100, 0.4)')
        gradient.addColorStop(1, isActive ? 'rgba(168, 85, 247, 0.8)' : 'rgba(100, 100, 100, 0.2)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.roundRect(x + 1, y, barWidth - 2, barHeight, 2)
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, audioLevel])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
      className="absolute bottom-32 left-0 right-0 h-24 pointer-events-none"
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={96}
        className="w-full h-full"
      />
    </motion.div>
  )
}

// ============================================================================
// COMPONENTE DE MENSAJE
// ============================================================================
interface MessageBubbleProps {
  message: ChatMessage
  onCopy?: () => void
  onRegenerate?: () => void
}

function MessageBubble({ message, onCopy, onRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [displayedText, setDisplayedText] = useState('')

  // Efecto de streaming
  useEffect(() => {
    if (message.role === 'assistant' && message.isStreaming) {
      let currentIndex = 0
      const interval = setInterval(() => {
        if (currentIndex <= message.content.length) {
          setDisplayedText(message.content.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(interval)
        }
      }, 20)
      return () => clearInterval(interval)
    } else {
      setDisplayedText(message.content)
    }
  }, [message.content, message.isStreaming, message.role])

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
    >
      {message.role === 'user' ? (
        // Mensaje del usuario - texto brillante alineado a la derecha
        <div className="max-w-[70%]">
          <p className="text-lg text-white text-right leading-relaxed">
            {message.content}
            <span className="inline-block w-2 h-5 ml-1 bg-white/30 rounded-full" />
          </p>
          <div
            className="absolute inset-0 blur-2xl opacity-20 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)',
            }}
          />
        </div>
      ) : (
        // Respuesta de la IA
        <div className="max-w-[80%] space-y-4">
          {/* Texto con efecto de mecanografía */}
          <div className="relative">
            <p className="text-lg text-white/90 leading-relaxed">
              {displayedText}
              {message.isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-2 h-5 ml-1 bg-cyan-400 rounded-full"
                />
              )}
            </p>
          </div>

          {/* Data Card si existe */}
          {message.dataCard && (
            <DataCardRenderer card={message.dataCard} />
          )}

          {/* Acciones */}
          {!message.isStreaming && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/50" />
                )}
              </button>
              <button
                onClick={onRegenerate}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-white/50" />
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ============================================================================
// RENDERIZADOR DE DATA CARDS
// ============================================================================
function DataCardRenderer({ card }: { card: DataCard }) {
  const data = card.data as Record<string, unknown>

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        {card.type === 'chart' && <BarChart3 className="w-4 h-4 text-cyan-400" />}
        {card.type === 'table' && <Table className="w-4 h-4 text-purple-400" />}
        {card.type === 'kpi' && <Sparkles className="w-4 h-4 text-yellow-400" />}
        {card.type === 'image' && <ImageIcon className="w-4 h-4 text-pink-400" />}
        <span className="text-sm font-medium text-white">{card.title}</span>
      </div>

      {/* Content */}
      <div className="p-4">
        {card.type === 'chart' && (
          <div className="h-48 flex items-end gap-2">
            {(data.values as number[] || [65, 80, 45, 90, 75, 85, 70]).map((val: number, i: number) => (
              <motion.div
                key={i}
                className="flex-1 bg-gradient-to-t from-cyan-600/50 to-cyan-400/30 rounded-t"
                initial={{ height: 0 }}
                animate={{ height: `${val}%` }}
                transition={{ delay: i * 0.1, type: 'spring' }}
              />
            ))}
          </div>
        )}

        {card.type === 'kpi' && (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="text-center p-3 bg-white/5 rounded-xl">
                <div className="text-2xl font-bold text-white">{String(value)}</div>
                <div className="text-xs text-white/50 capitalize">{key}</div>
              </div>
            ))}
          </div>
        )}

        {card.type === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {Object.keys((data.rows as Record<string, unknown>[])?.[0] || {}).map((header) => (
                    <th key={header} className="text-left p-2 text-white/50 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {((data.rows as Record<string, unknown>[]) || []).map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Object.values(row).map((cell, j) => (
                      <td key={j} className="p-2 text-white/80">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// ACCIONES RÁPIDAS
// ============================================================================
interface QuickActionsProps {
  onAction: (action: string) => void
  context?: string
}

function QuickActions({ onAction, context }: QuickActionsProps) {
  const actions = [
    { id: 'create_sale', label: 'Crear Venta', icon: Plus },
    { id: 'analyze_fletes', label: 'Analizar Fletes', icon: BarChart3 },
    { id: 'generate_report', label: 'Generar Reporte', icon: FileText },
    { id: 'check_inventory', label: 'Ver Inventario', icon: Table },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 mb-4"
    >
      {actions.map((action) => (
        <motion.button
          key={action.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAction(action.label)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
        >
          <action.icon className="w-4 h-4" />
          {action.label}
        </motion.button>
      ))}
    </motion.div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function ImmersiveAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bienvenido al modo de conversación inmersiva. Estoy listo para ayudarte con análisis de datos, generación de reportes, y cualquier tarea que necesites. ¿En qué puedo asistirte hoy?',
      timestamp: new Date(),
    },
  ])
  const [query, setQuery] = useState('')
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [audioLevel, setAudioLevel] = useState(0)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [isPushToTalk, setIsPushToTalk] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Simular respuesta de IA
  const handleSend = useCallback(async (customQuery?: string) => {
    const messageText = customQuery || query
    if (!messageText.trim()) return

    // Mensaje del usuario
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setQuery('')

    // Simular procesamiento
    setVoiceState('processing')

    await new Promise((r) => setTimeout(r, 500))

    // Crear respuesta con streaming
    const aiMessageId = (Date.now() + 1).toString()
    let responseContent = ''
    let dataCard: DataCard | undefined

    // Determinar tipo de respuesta basado en query
    if (messageText.toLowerCase().includes('venta')) {
      responseContent = 'He analizado los datos de ventas. Aquí tienes un resumen visual de las ventas de los últimos 7 días. Se observa una tendencia positiva del 15% con respecto a la semana anterior.'
      dataCard = {
        type: 'chart',
        title: 'Ventas Semanales',
        data: { values: [65, 78, 52, 89, 73, 95, 82] },
      }
    } else if (messageText.toLowerCase().includes('reporte')) {
      responseContent = 'He generado un resumen de los indicadores clave del sistema. Los datos muestran un rendimiento saludable en todas las métricas principales.'
      dataCard = {
        type: 'kpi',
        title: 'Indicadores Clave',
        data: {
          'Ventas Totales': '$485,000',
          'Margen Promedio': '32%',
          'Clientes Activos': '147',
          'Órdenes Pendientes': '23',
        },
      }
    } else if (messageText.toLowerCase().includes('inventario')) {
      responseContent = 'Aquí está el estado actual del inventario. He identificado 3 productos con stock bajo que requieren reabastecimiento.'
      dataCard = {
        type: 'table',
        title: 'Estado del Inventario',
        data: {
          rows: [
            { Producto: 'Laptop HP', Stock: 15, Estado: '✅ OK' },
            { Producto: 'Monitor LG', Stock: 8, Estado: '⚠️ Bajo' },
            { Producto: 'Teclado Logitech', Stock: 45, Estado: '✅ OK' },
            { Producto: 'Mouse Wireless', Stock: 3, Estado: '🔴 Crítico' },
          ],
        },
      }
    } else {
      responseContent = `He procesado tu solicitud: "${messageText}". ¿Necesitas que profundice en algún aspecto específico o genere algún tipo de visualización de datos?`
    }

    // Agregar mensaje con streaming
    setMessages((prev) => [
      ...prev,
      {
        id: aiMessageId,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        isStreaming: true,
        dataCard,
      },
    ])

    // Simular voz
    setVoiceState('speaking')
    const audioInterval = setInterval(() => {
      setAudioLevel(Math.random() * 0.6 + 0.4)
    }, 100)

    await new Promise((r) => setTimeout(r, 2000))

    clearInterval(audioInterval)
    setAudioLevel(0)
    setVoiceState('idle')

    // Marcar como completado
    setMessages((prev) =>
      prev.map((m) => (m.id === aiMessageId ? { ...m, isStreaming: false } : m))
    )
  }, [query])

  // Manejar Push-to-Talk
  const handleVoiceStart = useCallback(() => {
    setIsPushToTalk(true)
    setVoiceState('listening')
    // Simular nivel de audio
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 0.5 + 0.3)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const handleVoiceEnd = useCallback(() => {
    setIsPushToTalk(false)
    setAudioLevel(0)
    setVoiceState('idle')
    // Simular transcripción
    setQuery('Muéstrame el reporte de ventas del mes')
  }, [])

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDraggingFile(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(false)
    // Simular análisis de archivo
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleSend(`Analiza el archivo: ${files[0].name}`)
    }
  }, [handleSend])

  return (
    <div
      className="relative w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Fondo con grid sutil */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between"
      >
        <button className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <div
              className={`w-2 h-2 rounded-full ${
                voiceState === 'idle'
                  ? 'bg-white/50'
                  : voiceState === 'speaking'
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-yellow-400 animate-pulse'
              }`}
            />
            <span className="text-sm text-white/70">
              {voiceState === 'idle'
                ? 'Modo Zen'
                : voiceState === 'speaking'
                ? 'Respondiendo...'
                : 'Procesando...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`p-2 rounded-xl transition-colors ${
              isVoiceEnabled ? 'bg-white/10 text-white' : 'text-white/30'
            }`}
          >
            {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </motion.header>

      {/* Área de mensajes */}
      <ScrollArea
        className="h-full pt-20 pb-48 px-4 md:px-8 lg:px-16"
        ref={scrollRef}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onRegenerate={() => handleSend(messages.find(m => m.id === message.id)?.content)}
              />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Voice Wave */}
      <VoiceWave
        isActive={voiceState === 'speaking' || voiceState === 'listening'}
        audioLevel={audioLevel}
      />

      {/* Overlay de drag & drop */}
      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/80 backdrop-blur-xl flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-cyan-500/20 border-2 border-dashed border-cyan-400 flex items-center justify-center"
              >
                <Paperclip className="w-10 h-10 text-cyan-400" />
              </motion.div>
              <p className="text-xl text-white">Suelta el archivo para analizarlo</p>
              <p className="text-sm text-white/50 mt-2">Excel, PDF, CSV, Imágenes</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-6 bg-gradient-to-t from-black via-black/80 to-transparent"
      >
        <div className="max-w-3xl mx-auto">
          {/* Acciones rápidas */}
          <QuickActions onAction={(action) => handleSend(action)} />

          {/* Input principal */}
          <div className="relative">
            <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
              {/* Botón de voz (Push-to-Talk) */}
              <motion.button
                onMouseDown={handleVoiceStart}
                onMouseUp={handleVoiceEnd}
                onMouseLeave={handleVoiceEnd}
                onTouchStart={handleVoiceStart}
                onTouchEnd={handleVoiceEnd}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-xl transition-all ${
                  isPushToTalk
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                <Mic className="w-6 h-6" />
              </motion.button>

              {/* Input de texto */}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe tu mensaje o mantén presionado 🎙️ para hablar..."
                className="flex-1 bg-transparent text-white text-lg placeholder:text-white/30 focus:outline-none"
              />

              {/* Botón de adjuntar */}
              <button className="p-3 rounded-xl hover:bg-white/10 transition-colors">
                <Paperclip className="w-5 h-5 text-white/50" />
              </button>

              {/* Botón de enviar */}
              <motion.button
                onClick={() => handleSend()}
                disabled={!query.trim() || voiceState !== 'idle'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-xl transition-all ${
                  query.trim()
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                    : 'bg-white/5 text-white/30'
                }`}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Indicador de grabación */}
            <AnimatePresence>
              {isPushToTalk && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute -top-16 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/20 border border-red-500/50 rounded-full backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-white">Escuchando... Suelta para enviar</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
