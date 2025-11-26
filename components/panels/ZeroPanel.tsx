/**
 * 🎮 ZERO PANEL - Interfaz de Mando Táctica
 * 
 * El centro de comando completo de ZERO FORCE.
 * 
 * Incluye:
 * - Fondo 3D inmersivo con Zero
 * - Panel de logs del sistema
 * - Input de comandos con voz
 * - Botones de acción con targeting láser
 * - Alertas holográficas
 * - HUD superpuesto estilo militar
 */

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Send,
  Terminal,
  ShieldAlert,
  Download,
  RefreshCw,
  Database,
  TrendingUp,
  Users,
  Package,
  Zap,
  Eye,
  Radio,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ZeroEnvironment from '@/components/3d/ZeroEnvironment'
import { useRealtimeVoice } from '@/app/hooks/useRealtimeVoice'
import { useToast } from '@/app/hooks/use-toast'

// ============================================
// TIPOS
// ============================================

type SystemMode = 'idle' | 'processing' | 'combat' | 'success'

interface LogEntry {
  id: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success' | 'command'
  timestamp: Date
}

interface ZeroPanelProps {
  /** Callback cuando se ejecuta un comando */
  onCommand?: (command: string, data: unknown) => void
  /** Logs iniciales del sistema */
  initialLogs?: LogEntry[]
  /** Título del panel */
  title?: string
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

/** Indicador de estado del sistema */
function SystemStatusIndicator({ mode }: { mode: SystemMode }) {
  const statusConfig = {
    idle: { color: 'bg-cyan-500', text: 'ONLINE', pulse: false },
    processing: { color: 'bg-yellow-500', text: 'PROCESSING', pulse: true },
    combat: { color: 'bg-red-500', text: 'ALERT', pulse: true },
    success: { color: 'bg-green-500', text: 'COMPLETE', pulse: false },
  }

  const config = statusConfig[mode]

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2.5 h-2.5 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      <span className="text-[10px] font-mono tracking-widest text-gray-400">
        STATUS: <span className="text-white">{config.text}</span>
      </span>
    </div>
  )
}

/** Panel de logs del sistema */
function SystemLogs({
  logs,
  maxVisible = 5,
}: {
  logs: LogEntry[]
  maxVisible?: number
}) {
  const visibleLogs = logs.slice(-maxVisible)

  const typeStyles = {
    info: 'text-blue-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    success: 'text-green-400',
    command: 'text-cyan-400',
  }

  const typePrefix = {
    info: 'INFO',
    warning: 'WARN',
    error: 'ERR!',
    success: 'OK  ',
    command: 'CMD ',
  }

  return (
    <div className="space-y-1 font-mono text-[10px]">
      {visibleLogs.map((log, index) => (
        <motion.div
          key={log.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex gap-2 ${typeStyles[log.type]}`}
        >
          <span className="text-gray-600">
            {log.timestamp.toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
          <span className="opacity-60">[{typePrefix[log.type]}]</span>
          <span className="text-gray-300">{log.message}</span>
        </motion.div>
      ))}
    </div>
  )
}

/** Botón de acción táctica */
function TacticalButton({
  icon: Icon,
  label,
  onClick,
  isTarget,
  variant = 'default',
  ref,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
  isTarget?: boolean
  variant?: 'default' | 'primary' | 'danger'
  ref?: React.Ref<HTMLButtonElement>
}) {
  const variantStyles = {
    default: 'border-white/20 bg-black/50 hover:bg-white/10 hover:border-white/50 text-white',
    primary: 'border-cyan-500/50 bg-cyan-900/30 hover:bg-cyan-800/40 text-cyan-400',
    danger: 'border-red-500/50 bg-red-900/30 hover:bg-red-800/40 text-red-400',
  }

  return (
    <Button
      ref={ref}
      variant="outline"
      onClick={onClick}
      className={`
        backdrop-blur-md transition-all duration-300 gap-2
        ${variantStyles[variant]}
        ${isTarget ? 'ring-4 ring-green-500/50 scale-105 bg-green-900/30 border-green-500' : ''}
      `}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Button>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ZeroPanel({
  onCommand,
  initialLogs,
  title = 'ZERO FORCE COMMAND',
}: ZeroPanelProps) {
  // ===== ESTADO =====
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<SystemMode>('idle')
  const [logs, setLogs] = useState<LogEntry[]>(
    initialLogs || [
      { id: '1', message: 'SYSTEM INITIALIZED...', type: 'info', timestamp: new Date() },
      { id: '2', message: 'NEURAL LINK ESTABLISHED.', type: 'success', timestamp: new Date() },
      { id: '3', message: 'TACTICAL SYSTEMS ONLINE.', type: 'info', timestamp: new Date() },
    ]
  )
  const [activeTarget, setActiveTarget] = useState<string | null>(null)

  // Referencias para targeting
  const exportBtnRef = useRef<HTMLButtonElement>(null)
  const syncBtnRef = useRef<HTMLButtonElement>(null)

  // Hooks
  const { toast } = useToast()

  // Hook de voz
  const {
    isListening,
    isProcessing,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    isSupported,
  } = useRealtimeVoice({
    mode: 'general',
    onTranscript: (text) => {
      setInput('')
      processCommand(text)
    },
  })

  // ===== FUNCIONES =====

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      message: message.toUpperCase(),
      type,
      timestamp: new Date(),
    }
    setLogs(prev => [...prev, newLog])
  }, [])

  const processCommand = useCallback((text: string) => {
    const cmd = text.toLowerCase()
    addLog(`USER CMD: ${text}`, 'command')

    // Comando de amenaza/error
    if (cmd.includes('amenaza') || cmd.includes('error') || cmd.includes('atacar') || cmd.includes('alerta')) {
      setMode('combat')
      addLog('WARNING: THREAT DETECTED. DEFENSE PROTOCOL ACTIVE.', 'error')
      onCommand?.('combat', { trigger: text })

      setTimeout(() => {
        setMode('idle')
        addLog('THREAT NEUTRALIZED. RETURNING TO STANDBY.', 'success')
      }, 4000)
      return
    }

    // Comando de exportar/descargar
    if (cmd.includes('exportar') || cmd.includes('descargar') || cmd.includes('reporte')) {
      setMode('success')
      setActiveTarget('export')
      addLog('TARGET ACQUIRED: EXPORT MODULE.', 'success')
      addLog('GENERATING DATA EXPORT...', 'info')
      onCommand?.('export', { type: 'full_report' })

      setTimeout(() => {
        setMode('idle')
        setActiveTarget(null)
        addLog('EXPORT COMPLETE. DATA TRANSMITTED.', 'success')
      }, 3000)
      return
    }

    // Comando de sincronizar
    if (cmd.includes('sincronizar') || cmd.includes('sync') || cmd.includes('actualizar')) {
      setMode('processing')
      setActiveTarget('sync')
      addLog('INITIATING DATA SYNCHRONIZATION...', 'info')
      onCommand?.('sync', {})

      setTimeout(() => {
        setMode('success')
        addLog('SYNCHRONIZATION COMPLETE. ALL SYSTEMS UPDATED.', 'success')

        setTimeout(() => {
          setMode('idle')
          setActiveTarget(null)
        }, 1500)
      }, 2500)
      return
    }

    // Comando genérico
    setMode('processing')
    addLog('PROCESSING REQUEST...', 'info')

    setTimeout(() => {
      setMode('idle')
      addLog('ACKNOWLEDGED. DATA PROCESSED.', 'success')
      onCommand?.('generic', { command: text })
    }, 2000)
  }, [addLog, onCommand])

  const handleSubmit = () => {
    if (!input.trim()) return
    processCommand(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  // ===== RENDER =====

  return (
    <div
      className="relative w-full h-[calc(100vh-100px)] overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #000000 0%, #050510 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      
      {/* ===== CAPA 3D (FONDO VIVO) ===== */}
      <ZeroEnvironment
        mode={mode === 'combat' ? 'combat' : mode === 'success' ? 'success' : mode === 'processing' ? 'processing' : 'idle'}
        showAvatar
        quality={1.5}
      />

      {/* ===== HUD SUPERPUESTO ===== */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 pointer-events-none">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-start">
          
          {/* Panel de Estado y Logs */}
          <div className="pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-xl w-80 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-white tracking-widest text-sm">SYSTEM LOGS</h3>
              </div>
              <SystemStatusIndicator mode={mode} />
            </div>

            {/* Logs */}
            <div className="h-28 overflow-hidden">
              <SystemLogs logs={logs} maxVisible={5} />
            </div>

            {/* Decorative line */}
            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
          </div>

          {/* Botones de Acción (Targets del Láser) */}
          <div className="pointer-events-auto flex gap-3">
            <TacticalButton
              ref={syncBtnRef}
              icon={RefreshCw}
              label="SYNC DATA"
              onClick={() => processCommand('sincronizar')}
              isTarget={activeTarget === 'sync'}
              variant="primary"
            />
            <TacticalButton
              ref={exportBtnRef}
              icon={Download}
              label="EXPORT"
              onClick={() => processCommand('exportar')}
              isTarget={activeTarget === 'export'}
            />
          </div>
        </div>

        {/* CENTER: ALERTAS HOLOGRÁFICAS */}
        <AnimatePresence>
          {mode === 'combat' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="self-center pointer-events-none"
            >
              <div
                className="relative p-8 text-center"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,0,0,0.3) 0%, transparent 70%)',
                }}
              >
                {/* Anillos animados */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-red-500/30 rounded-full animate-ping" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-36 h-36 border border-red-500/50 rounded-full animate-pulse" />
                </div>

                {/* Contenido */}
                <div className="relative z-10 bg-red-950/50 backdrop-blur-md border border-red-500/50 p-6 rounded-2xl">
                  <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-3 animate-bounce" />
                  <h1
                    className="text-4xl font-black text-red-500 tracking-[0.5em]"
                    style={{
                      textShadow: '0 0 30px rgba(255, 0, 0, 0.8)',
                    }}
                  >
                    ALERTA
                  </h1>
                  <p className="text-red-200/80 font-mono text-xs mt-2 tracking-widest">
                    INTRUSIÓN DETECTADA EN EL SISTEMA
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats (Si no hay alerta) */}
        {mode !== 'combat' && (
          <div className="self-center pointer-events-none flex gap-6">
            {[
              { icon: TrendingUp, label: 'VENTAS', value: '$45,230' },
              { icon: Users, label: 'CLIENTES', value: '1,247' },
              { icon: Package, label: 'STOCK', value: '3,891' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 0.6, y: 0 }}
                className="text-center"
              >
                <stat.icon className="w-6 h-6 text-cyan-500/60 mx-auto mb-1" />
                <div className="text-lg font-bold text-white/80">{stat.value}</div>
                <div className="text-[10px] text-gray-500 tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* BOTTOM: INPUT DE MANDO */}
        <div className="self-center pointer-events-auto w-full max-w-xl">
          {/* Glow effect */}
          <div className="relative group">
            <div
              className={`
                absolute -inset-1 rounded-2xl blur opacity-25 
                group-hover:opacity-50 transition duration-500
                ${mode === 'combat'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 opacity-75'
                  : mode === 'success'
                    ? 'bg-gradient-to-r from-green-600 to-cyan-600'
                    : 'bg-gradient-to-r from-red-600 to-purple-600'
                }
              `}
            />

            {/* Input container */}
            <div className="relative flex items-center bg-black/80 rounded-2xl border border-white/10 p-2 backdrop-blur-xl">
              {/* Voice button */}
              <Button
                size="icon"
                onClick={toggleListening}
                disabled={!isSupported}
                className={`
                  rounded-xl w-12 h-12 shrink-0 mr-2 transition-all duration-300
                  ${isListening
                    ? 'bg-red-600 animate-pulse shadow-[0_0_30px_rgba(255,0,0,0.5)]'
                    : 'bg-white/5 hover:bg-white/10'
                  }
                `}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </Button>

              {/* Text input */}
              <Input
                value={isListening ? (interimTranscript || 'Escuchando...') : input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isListening}
                placeholder="Comandos de voz a Zero Force..."
                className="bg-transparent border-none text-white placeholder:text-gray-600 focus-visible:ring-0 h-12 font-mono"
              />

              {/* Send button */}
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!input.trim() || isListening}
                className="rounded-xl w-12 h-12 shrink-0 bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Voice status indicator */}
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center justify-center gap-2 text-red-400"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-mono tracking-widest">
                NEURAL LINK ACTIVE - SPEAK NOW
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* ===== CORNER DECORATIONS ===== */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-red-500/30 pointer-events-none" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-red-500/30 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-red-500/30 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-red-500/30 pointer-events-none" />

      {/* ===== SCAN LINE EFFECT ===== */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />
    </div>
  )
}

// ============================================
// EXPORTS
// ============================================

export { ZeroPanel }
export type { ZeroPanelProps, SystemMode, LogEntry }
