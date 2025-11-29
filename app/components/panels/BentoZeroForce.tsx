"use client"

/**
 * BentoZeroForce - Panel de IA con Zero Force Overdrive
 * 
 * Este componente reemplaza/complementa BentoIA con la nueva interfaz
 * 3D táctica de Zero Force Overdrive, ofreciendo:
 * - Avatar 3D procedural de Zero con ojos rojos rasgados
 * - Efectos de post-procesamiento cinematográficos
 * - Sistema de chat con reconocimiento de voz
 * - HUD táctico con información en tiempo real
 * - Modo combate con efectos visuales intensos
 */

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Zap, 
  Shield, 
  Target, 
  Activity,
  Settings,
  Eye,
  EyeOff,
  Layers,
  Radio
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { ZeroState, ChatMessage } from '../3d'

// Cargar ZeroPanel dinámicamente (solo cliente)
const ZeroPanel = dynamic(
  () => import('../3d/ZeroPanel').then(mod => mod.ZeroPanel),
  { 
    ssr: false, 
    loading: () => <ZeroLoader />
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface BentoZeroForceProps {
  className?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ZeroLoader() {
  return (
    <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-6">
        {/* Logo Zero animado */}
        <div className="relative">
          {/* Ojos de Zero */}
          <motion.div
            className="w-32 h-5 rounded-full"
            style={{ 
              backgroundColor: '#ef4444',
              boxShadow: '0 0 40px #ef4444, 0 0 80px #ef4444, 0 0 120px #ef4444'
            }}
            animate={{
              scaleX: [1, 0.8, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          
          {/* Efecto de scan */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: [-150, 150] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: 'linear' 
            }}
          />
        </div>
        
        {/* Texto de carga */}
        <div className="text-center">
          <motion.p 
            className="text-lg font-mono font-bold text-red-500"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ZERO FORCE OVERDRIVE
          </motion.p>
          <p className="text-sm font-mono text-slate-500 mt-2">
            Inicializando sistemas tácticos...
          </p>
        </div>
        
        {/* Barra de progreso */}
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-600 to-red-400"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'linear' }}
          />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL DE CONTROL LATERAL
// ═══════════════════════════════════════════════════════════════════════════════

interface ControlPanelProps {
  settings: {
    showHUD: boolean
    showLogs: boolean
    showScene: boolean
    effectsIntensity: 'minimal' | 'normal' | 'intense' | 'cinematic'
  }
  onSettingsChange: (settings: ControlPanelProps['settings']) => void
  currentState: ZeroState
}

function ControlPanel({ settings, onSettingsChange, currentState }: ControlPanelProps) {
  const stateColors: Record<ZeroState, string> = {
    idle: 'bg-blue-500',
    listening: 'bg-cyan-500',
    speaking: 'bg-green-500',
    processing: 'bg-purple-500',
    combat: 'bg-red-500',
    success: 'bg-emerald-500',
    error: 'bg-orange-500'
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-30"
    >
      <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-3 space-y-3">
        {/* Estado actual */}
        <div className="flex flex-col items-center gap-2 pb-3 border-b border-slate-700/50">
          <div className={`w-3 h-3 rounded-full ${stateColors[currentState]} animate-pulse`} />
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            {currentState}
          </span>
        </div>
        
        {/* Controles */}
        <div className="space-y-2">
          {/* Toggle HUD */}
          <button
            onClick={() => onSettingsChange({ ...settings, showHUD: !settings.showHUD })}
            className={`p-2 rounded-lg transition-colors ${
              settings.showHUD ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800/50 text-slate-500'
            }`}
            title="Toggle HUD"
          >
            <Activity className="w-4 h-4" />
          </button>
          
          {/* Toggle Logs */}
          <button
            onClick={() => onSettingsChange({ ...settings, showLogs: !settings.showLogs })}
            className={`p-2 rounded-lg transition-colors ${
              settings.showLogs ? 'bg-green-500/20 text-green-400' : 'bg-slate-800/50 text-slate-500'
            }`}
            title="Toggle Logs"
          >
            <Radio className="w-4 h-4" />
          </button>
          
          {/* Toggle Scene */}
          <button
            onClick={() => onSettingsChange({ ...settings, showScene: !settings.showScene })}
            className={`p-2 rounded-lg transition-colors ${
              settings.showScene ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800/50 text-slate-500'
            }`}
            title="Toggle 3D Scene"
          >
            {settings.showScene ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
          
          {/* Intensidad de efectos */}
          <div className="pt-2 border-t border-slate-700/50">
            <button
              onClick={() => {
                const intensities: ControlPanelProps['settings']['effectsIntensity'][] = 
                  ['minimal', 'normal', 'intense', 'cinematic']
                const currentIndex = intensities.indexOf(settings.effectsIntensity)
                const nextIndex = (currentIndex + 1) % intensities.length
                onSettingsChange({ ...settings, effectsIntensity: intensities[nextIndex] })
              }}
              className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 transition-colors"
              title={`Intensidad: ${settings.effectsIntensity}`}
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface QuickActionsProps {
  onAction: (action: string) => void
  disabled?: boolean
}

function QuickActions({ onAction, disabled }: QuickActionsProps) {
  const actions = [
    { id: 'sales', label: 'Análisis Ventas', icon: Activity, color: 'from-blue-600 to-cyan-600' },
    { id: 'inventory', label: 'Inventario', icon: Shield, color: 'from-purple-600 to-pink-600' },
    { id: 'predictions', label: 'Predicciones', icon: Sparkles, color: 'from-amber-600 to-orange-600' },
    { id: 'combat', label: 'Modo Combate', icon: Target, color: 'from-red-600 to-rose-600' }
  ]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20"
    >
      <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-2">
        {actions.map((action) => (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAction(action.id)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl
              bg-gradient-to-r ${action.color}
              text-white text-sm font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all hover:shadow-lg
            `}
          >
            <action.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function BentoZeroForce({ className = '' }: BentoZeroForceProps) {
  // Estado
  const [currentState, setCurrentState] = useState<ZeroState>('idle')
  const [settings, setSettings] = useState<{
    showHUD: boolean
    showLogs: boolean
    showScene: boolean
    effectsIntensity: 'minimal' | 'normal' | 'intense' | 'cinematic'
  }>({
    showHUD: true,
    showLogs: true,
    showScene: true,
    effectsIntensity: 'normal'
  })
  
  // Handlers
  const handleStateChange = useCallback((state: ZeroState) => {
    setCurrentState(state)
  }, [])
  
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'combat':
        setCurrentState('combat')
        break
      case 'sales':
      case 'inventory':
      case 'predictions':
        // Estos se manejarían enviando un mensaje al chat
        break
    }
  }, [])
  
  const handleMessage = useCallback((message: string, response: string) => {
    // Aquí se podría conectar con un backend real
    // Por ahora solo log
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.debug('Zero Message:', { message, response })
    }
  }, [])
  
  const handleExport = useCallback((data: unknown) => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.debug('Zero Export:', data)
    }
  }, [])
  
  return (
    <div className={`relative w-full h-[calc(100vh-8rem)] min-h-[700px] ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-30 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo Zero */}
            <div className="relative w-12 h-12 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-red-500/30 flex items-center justify-center overflow-hidden">
              <div 
                className="w-8 h-2 rounded-full animate-pulse"
                style={{ 
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 15px #ef4444'
                }}
              />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                ZERO FORCE OVERDRIVE
              </h1>
              <p className="text-sm text-slate-400 font-mono">
                Sistema Táctico de Inteligencia Artificial
              </p>
            </div>
          </div>
          
          {/* Indicadores */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-xl border border-slate-700/50">
              <Zap className={`w-4 h-4 ${currentState === 'combat' ? 'text-red-400' : 'text-emerald-400'}`} />
              <span className="text-xs font-mono text-slate-300">
                SISTEMA ACTIVO
              </span>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Panel de Control */}
      <ControlPanel
        settings={settings}
        onSettingsChange={setSettings}
        currentState={currentState}
      />
      
      {/* Zero Panel Principal */}
      <ZeroPanel
        onMessage={handleMessage}
        onExport={handleExport}
        onStateChange={handleStateChange}
        showHUD={settings.showHUD}
        showLogs={settings.showLogs}
        showScene={settings.showScene}
        effectsIntensity={settings.effectsIntensity}
        className="w-full h-full"
      />
      
      {/* Quick Actions */}
      <QuickActions
        onAction={handleQuickAction}
        disabled={currentState === 'processing'}
      />
    </div>
  )
}
