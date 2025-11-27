"use client"

/**
 * ZeroPanel - Interfaz Táctica Completa de Zero Force
 * 
 * Este componente integra todo el sistema Zero Force:
 * - Escena 3D con avatar de Zero
 * - Post-procesamiento cinematográfico
 * - Widget de chat conversacional
 * - HUD con información táctica
 * - Sistema de logs en tiempo real
 * - Controles de voz
 * - Exportación de datos
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Terminal, 
  Download, 
  Settings, 
  Maximize2, 
  Minimize2,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Target,
  Activity,
  Cpu,
  Shield,
  Crosshair
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { ZeroState } from './ZeroAvatar'
import { ZeroChatWidget, ChatMessage } from './ZeroChatWidget'
import { useVoiceInput, VoiceCommand } from '@/frontend/app/hooks/useVoiceInput'

// Cargar componentes 3D de forma dinámica (solo cliente)
const ZeroCombatScene = dynamic(
  () => import('./ZeroCombatScene').then(mod => mod.ZeroCombatScene),
  { ssr: false, loading: () => <SceneLoader /> }
)

const ZeroEnvironment = dynamic(
  () => import('./ZeroEnvironment').then(mod => mod.ZeroEnvironment),
  { ssr: false }
)

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface ZeroPanelProps {
  onMessage?: (message: string, response: string) => void
  onExport?: (data: ExportData) => void
  onStateChange?: (state: ZeroState) => void
  initialMessages?: ChatMessage[]
  className?: string
  showHUD?: boolean
  showLogs?: boolean
  showScene?: boolean
  effectsIntensity?: 'minimal' | 'normal' | 'intense' | 'cinematic'
}

interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'success' | 'combat'
  message: string
  details?: string
}

interface ExportData {
  messages: ChatMessage[]
  logs: LogEntry[]
  timestamp: Date
  sessionId: string
}

interface HUDStats {
  status: ZeroState
  uptime: number        // segundos
  messagesCount: number
  processingTime: number // ms promedio
  accuracy: number      // 0-100%
  threatLevel: number   // 0-100
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADER DE ESCENA
// ═══════════════════════════════════════════════════════════════════════════════

function SceneLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        {/* Ojos de Zero animados */}
        <div className="relative">
          <div 
            className="w-24 h-4 rounded-full animate-pulse"
            style={{ 
              backgroundColor: '#ef4444',
              boxShadow: '0 0 30px #ef4444, 0 0 60px #ef4444'
            }}
          />
          {/* Efecto de scan */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: [-100, 100] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <p className="text-slate-400 font-mono text-sm">INICIALIZANDO ZERO...</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HUD TÁCTICO
// ═══════════════════════════════════════════════════════════════════════════════

interface TacticalHUDProps {
  stats: HUDStats
}

function TacticalHUD({ stats }: TacticalHUDProps) {
  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  
  const statusColors = useMemo(() => ({
    idle: 'text-blue-400',
    listening: 'text-cyan-400',
    speaking: 'text-green-400',
    processing: 'text-purple-400',
    combat: 'text-red-400',
    success: 'text-emerald-400',
    error: 'text-orange-400'
  }), [])
  
  return (
    <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none z-10">
      <div className="flex justify-between items-start">
        {/* Panel izquierdo - Estado */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-950/80 backdrop-blur-xl border border-slate-700/50 rounded-lg p-4 pointer-events-auto"
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono text-slate-400">ESTADO DEL SISTEMA</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-500">STATUS</span>
              <p className={`${statusColors[stats.status]} font-semibold uppercase`}>
                {stats.status}
              </p>
            </div>
            <div>
              <span className="text-slate-500">UPTIME</span>
              <p className="text-green-400">{formatUptime(stats.uptime)}</p>
            </div>
            <div>
              <span className="text-slate-500">MSGS</span>
              <p className="text-blue-400">{stats.messagesCount}</p>
            </div>
            <div>
              <span className="text-slate-500">LATENCIA</span>
              <p className="text-yellow-400">{stats.processingTime}ms</p>
            </div>
          </div>
        </motion.div>
        
        {/* Panel derecho - Amenazas */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-950/80 backdrop-blur-xl border border-slate-700/50 rounded-lg p-4 pointer-events-auto"
        >
          <div className="flex items-center gap-2 mb-3">
            <Crosshair className="w-4 h-4 text-red-400" />
            <span className="text-xs font-mono text-slate-400">ANÁLISIS TÁCTICO</span>
          </div>
          
          <div className="space-y-2">
            {/* Barra de precisión */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-500">PRECISIÓN</span>
                <span className="text-emerald-400">{stats.accuracy}%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.accuracy}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            
            {/* Barra de amenaza */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-500">NIVEL AMENAZA</span>
                <span className={stats.threatLevel > 70 ? 'text-red-400' : stats.threatLevel > 40 ? 'text-yellow-400' : 'text-green-400'}>
                  {stats.threatLevel}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${
                    stats.threatLevel > 70 ? 'bg-red-500' : 
                    stats.threatLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.threatLevel}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Indicadores de esquina */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          stats.status === 'combat' ? 'bg-red-500 animate-pulse' :
          stats.status === 'error' ? 'bg-orange-500 animate-pulse' :
          'bg-emerald-500'
        }`} />
        <span className="text-xs font-mono text-slate-400">ZERO FORCE OVERDRIVE</span>
        <div className={`w-2 h-2 rounded-full ${
          stats.status === 'combat' ? 'bg-red-500 animate-pulse' :
          stats.status === 'error' ? 'bg-orange-500 animate-pulse' :
          'bg-emerald-500'
        }`} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL DE LOGS
// ═══════════════════════════════════════════════════════════════════════════════

interface LogsPanelProps {
  logs: LogEntry[]
  expanded: boolean
  onToggleExpand: () => void
  onClear: () => void
}

function LogsPanel({ logs, expanded, onToggleExpand, onClear }: LogsPanelProps) {
  const logsEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])
  
  const levelIcons = {
    info: <Info className="w-3.5 h-3.5 text-blue-400" />,
    warn: <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />,
    error: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
    success: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
    combat: <Target className="w-3.5 h-3.5 text-red-400 animate-pulse" />
  }
  
  const levelColors = {
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    success: 'text-green-400',
    combat: 'text-red-400'
  }
  
  return (
    <motion.div
      initial={{ height: 100 }}
      animate={{ height: expanded ? 250 : 100 }}
      className="absolute bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-700/50 z-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-mono text-slate-400">SYSTEM LOGS</span>
          <span className="text-xs font-mono text-slate-600">({logs.length})</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="p-1 hover:bg-slate-700/50 rounded transition-colors"
            title="Limpiar logs"
          >
            <span className="text-xs text-slate-500">CLEAR</span>
          </button>
          <button
            onClick={onToggleExpand}
            className="p-1 hover:bg-slate-700/50 rounded transition-colors"
          >
            {expanded ? (
              <Minimize2 className="w-4 h-4 text-slate-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>
      
      {/* Logs */}
      <div className="overflow-y-auto px-4 py-2" style={{ height: expanded ? 200 : 60 }}>
        <div className="font-mono text-xs space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2">
              {levelIcons[log.level]}
              <span className="text-slate-600">
                {log.timestamp.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
              <span className={levelColors[log.level]}>{log.message}</span>
              {log.details && (
                <span className="text-slate-600">— {log.details}</span>
              )}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function ZeroPanel({
  onMessage,
  onExport,
  onStateChange,
  initialMessages = [],
  className = '',
  showHUD = true,
  showLogs = true,
  showScene = true,
  effectsIntensity = 'normal'
}: ZeroPanelProps) {
  // Estado
  const [zeroState, setZeroState] = useState<ZeroState>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logsExpanded, setLogsExpanded] = useState(false)
  const [chatMinimized, setChatMinimized] = useState(false)
  const [sessionId] = useState(() => `zero-${Date.now()}`)
  const [startTime] = useState(() => Date.now())
  const [uptime, setUptime] = useState(0)
  
  // Comandos de voz
  const voiceCommands: VoiceCommand[] = useMemo(() => [
    { trigger: ['zero', 'oye zero', 'hey zero'], action: 'wake', description: 'Despertar a Zero' },
    { trigger: ['modo combate', 'alerta roja', 'combat mode'], action: 'combat', description: 'Activar modo combate' },
    { trigger: ['cancelar', 'detente', 'para'], action: 'stop', description: 'Detener acción actual' },
    { trigger: ['exportar', 'guardar', 'descargar'], action: 'export', description: 'Exportar datos' },
    { trigger: ['limpiar', 'borrar chat', 'nuevo chat'], action: 'clear', description: 'Limpiar chat' }
  ], [])
  
  // Hook de voz
  const voice = useVoiceInput({
    language: 'es-ES',
    continuous: true,
    commands: voiceCommands,
    onCommand: (action) => {
      addLog('info', `Comando detectado: ${action}`)
      
      switch (action) {
        case 'wake':
          setZeroState('listening')
          break
        case 'combat':
          setZeroState('combat')
          addLog('combat', 'MODO COMBATE ACTIVADO')
          break
        case 'stop':
          setZeroState('idle')
          voice.stopListening()
          break
        case 'export':
          handleExport()
          break
        case 'clear':
          handleClearChat()
          break
      }
    },
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        handleSendMessage(text.trim())
      }
    },
    onError: (error) => {
      addLog('error', `Error de voz: ${error}`)
    }
  })
  
  // Stats del HUD
  const hudStats: HUDStats = useMemo(() => ({
    status: zeroState,
    uptime,
    messagesCount: messages.filter(m => m.role === 'user').length,
    processingTime: 150, // Placeholder
    accuracy: 94,
    threatLevel: zeroState === 'combat' ? 85 : zeroState === 'error' ? 60 : 15
  }), [zeroState, uptime, messages])
  
  // Actualizar uptime
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])
  
  // Notificar cambio de estado
  useEffect(() => {
    onStateChange?.(zeroState)
  }, [zeroState, onStateChange])
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FUNCIONES DE UTILIDAD
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const addLog = useCallback((
    level: LogEntry['level'], 
    message: string, 
    details?: string
  ) => {
    setLogs(prev => [...prev, {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level,
      message,
      details
    }])
  }, [])
  
  const handleSendMessage = useCallback(async (content: string) => {
    // Añadir mensaje del usuario
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'complete'
    }
    setMessages(prev => [...prev, userMessage])
    addLog('info', 'Mensaje recibido', content.substring(0, 50))
    
    // Cambiar a estado procesando
    setZeroState('processing')
    
    // Simular respuesta de Zero (esto se conectaría a un LLM real)
    const pendingMessage: ChatMessage = {
      id: `msg-${Date.now()}-pending`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'pending'
    }
    setMessages(prev => [...prev, pendingMessage])
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Generar respuesta simulada
    const responses = [
      'Entendido. Procesando tu solicitud táctica.',
      'Análisis completado. Los datos han sido evaluados.',
      'Afirmativo. Ejecutando protocolo de respuesta.',
      'Sistema en línea. ¿En qué puedo asistirte?',
      'Datos recibidos. Iniciando procesamiento.'
    ]
    const response = responses[Math.floor(Math.random() * responses.length)]
    
    // Actualizar mensaje
    setMessages(prev => prev.map(m => 
      m.id === pendingMessage.id 
        ? { ...m, content: response, status: 'complete' as const }
        : m
    ))
    
    setZeroState('speaking')
    addLog('success', 'Respuesta generada')
    
    // Callback
    onMessage?.(content, response)
    
    // Síntesis de voz
    voice.speak(response, { rate: 0.95, pitch: 0.8 })
    
    // Volver a idle después de hablar
    setTimeout(() => {
      setZeroState('idle')
    }, 2000)
    
  }, [addLog, onMessage, voice])
  
  const handleClearChat = useCallback(() => {
    setMessages([])
    addLog('info', 'Chat limpiado')
  }, [addLog])
  
  const handleExport = useCallback(() => {
    const data: ExportData = {
      messages,
      logs,
      timestamp: new Date(),
      sessionId
    }
    
    // Crear y descargar archivo JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zero-session-${sessionId}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    addLog('success', 'Datos exportados')
    onExport?.(data)
  }, [messages, logs, sessionId, addLog, onExport])
  
  const handleClearLogs = useCallback(() => {
    setLogs([])
  }, [])
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Log inicial
  useEffect(() => {
    addLog('info', 'ZERO FORCE OVERDRIVE inicializado')
    addLog('info', `Session ID: ${sessionId}`)
  }, [addLog, sessionId])
  
  return (
    <div className={`relative w-full h-full bg-slate-950 overflow-hidden ${className}`}>
      {/* Escena 3D */}
      {showScene && (
        <div className="absolute inset-0">
          <ZeroCombatScene
            state={zeroState}
            speechAmplitude={voice.amplitude}
            showGrid={true}
            showParticles={true}
            showStars={true}
            enableMouseTracking={true}
          />
        </div>
      )}
      
      {/* HUD */}
      {showHUD && <TacticalHUD stats={hudStats} />}
      
      {/* Chat Widget */}
      <div className="absolute right-4 top-20 bottom-32 w-96 z-20">
        <ZeroChatWidget
          messages={messages}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onExportChat={handleExport}
          state={zeroState}
          isListening={voice.isListening}
          isSpeaking={voice.isSpeaking}
          onToggleListening={voice.toggleListening}
          onToggleSpeaking={voice.stopSpeaking}
          minimized={chatMinimized}
          onToggleMinimize={() => setChatMinimized(!chatMinimized)}
          showTimestamps={true}
          showMetadata={false}
          maxHeight="calc(100% - 60px)"
        />
      </div>
      
      {/* Panel de Logs */}
      {showLogs && (
        <LogsPanel
          logs={logs}
          expanded={logsExpanded}
          onToggleExpand={() => setLogsExpanded(!logsExpanded)}
          onClear={handleClearLogs}
        />
      )}
      
      {/* Indicadores de esquina inferiores */}
      <div className="absolute bottom-28 left-4 flex items-center gap-3 pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-xl border border-slate-700/50 rounded-lg px-3 py-2">
          <Activity className={`w-4 h-4 ${voice.isListening ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
          <span className="text-xs font-mono text-slate-400">
            {voice.isListening ? 'ESCUCHANDO' : 'MIC OFF'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-xl border border-slate-700/50 rounded-lg px-3 py-2">
          <Cpu className={`w-4 h-4 ${zeroState === 'processing' ? 'text-purple-400 animate-pulse' : 'text-slate-600'}`} />
          <span className="text-xs font-mono text-slate-400">
            {zeroState === 'processing' ? 'PROCESANDO' : 'STANDBY'}
          </span>
        </div>
      </div>
    </div>
  )
}

export type { ZeroPanelProps, LogEntry, ExportData, HUDStats }
export default ZeroPanel
