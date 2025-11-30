'use client'

/**
 * 🎮 Demo de Componentes 3D Chronos
 * Página para visualizar y probar todos los componentes 3D
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, Cpu, Eye, Flame, MessageCircle, 
  ChevronRight, Play, Pause, RotateCcw,
} from 'lucide-react'

import { Button } from '@/app/components/ui/button'
import { FloatingAIOrb } from '@/app/components/3d/FloatingAIOrb'
import { FirePortal3D, PortalLoadingOverlay } from '@/app/components/3d/FirePortal3D'

// ============================================================================
// TARJETA DE DEMO
// ============================================================================

interface DemoCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

function DemoCard({ title, description, icon, children, actions }: DemoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-white/50">{description}</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        {children}
      </div>
      
      {/* Actions */}
      {actions && (
        <div className="p-4 border-t border-white/10 bg-black/20 flex gap-2 justify-end">
          {actions}
        </div>
      )}
    </motion.div>
  )
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export default function Demo3DPage() {
  // Estados para demos
  const [portalState, setPortalState] = useState<'idle' | 'opening' | 'active' | 'closing'>('idle')
  const [portalProgress, setPortalProgress] = useState(0)
  const [portalColor, setPortalColor] = useState<'fire' | 'ice' | 'void' | 'gold' | 'emerald'>('fire')
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayProgress, setOverlayProgress] = useState(0)
  
  // Simular progreso del portal
  const startPortal = () => {
    setPortalState('opening')
    setPortalProgress(0)
    
    setTimeout(() => setPortalState('active'), 500)
    
    const interval = setInterval(() => {
      setPortalProgress(prev => {
        if (prev >= 1) {
          clearInterval(interval)
          return 1
        }
        return prev + 0.02
      })
    }, 100)
  }
  
  const stopPortal = () => {
    setPortalState('closing')
    setTimeout(() => setPortalState('idle'), 1000)
  }
  
  // Simular overlay de carga
  const showLoadingOverlay = () => {
    setShowOverlay(true)
    setOverlayProgress(0)
    
    const interval = setInterval(() => {
      setOverlayProgress(prev => {
        if (prev >= 1) {
          clearInterval(interval)
          setTimeout(() => setShowOverlay(false), 500)
          return 1
        }
        return prev + 0.01
      })
    }, 50)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          Componentes <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">3D</span> Chronos
        </h1>
        <p className="text-white/50">
          Sistema de componentes React Three Fiber para interfaces inmersivas
        </p>
      </motion.div>
      
      {/* Grid de demos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        
        {/* Demo: Portal de Fuego */}
        <DemoCard
          title="Fire Portal"
          description="Portal mágico estilo Dr. Strange para loaders"
          icon={<Flame className="w-5 h-5 text-orange-400" />}
          actions={
            <>
              <select
                value={portalColor}
                onChange={(e) => setPortalColor(e.target.value as typeof portalColor)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
              >
                <option value="fire">🔥 Fuego</option>
                <option value="ice">❄️ Hielo</option>
                <option value="void">🌀 Vacío</option>
                <option value="gold">✨ Oro</option>
                <option value="emerald">💎 Esmeralda</option>
              </select>
              {portalState === 'idle' ? (
                <Button onClick={startPortal} size="sm">
                  <Play className="w-4 h-4 mr-2" /> Abrir Portal
                </Button>
              ) : (
                <Button onClick={stopPortal} size="sm" variant="destructive">
                  <Pause className="w-4 h-4 mr-2" /> Cerrar
                </Button>
              )}
            </>
          }
        >
          <FirePortal3D
            state={portalState}
            progress={portalProgress}
            size={280}
            color={portalColor}
            message={portalProgress < 1 ? 'Abriendo portal...' : '¡Portal activo!'}
          />
        </DemoCard>
        
        {/* Demo: Overlay de Carga */}
        <DemoCard
          title="Portal Loading Overlay"
          description="Overlay de pantalla completa con efecto de portal"
          icon={<Sparkles className="w-5 h-5 text-purple-400" />}
          actions={
            <Button onClick={showLoadingOverlay} size="sm" disabled={showOverlay}>
              <Eye className="w-4 h-4 mr-2" /> Mostrar Overlay
            </Button>
          }
        >
          <div className="text-center">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <Cpu className="w-12 h-12 mx-auto text-purple-400 mb-3" />
              <p className="text-white/70">
                Haz clic en el botón para ver el overlay de carga con portal
              </p>
            </div>
            <p className="text-xs text-white/40">
              Se usa para transiciones de página o cargas pesadas
            </p>
          </div>
        </DemoCard>
        
        {/* Demo: Widget IA Flotante */}
        <DemoCard
          title="AI Voice Orb Widget"
          description="Widget flotante con orbe 3D interactivo"
          icon={<MessageCircle className="w-5 h-5 text-cyan-400" />}
        >
          <div className="text-center">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-white/10 mb-4">
              <p className="text-white/70 mb-4">
                El widget flotante aparece en la esquina inferior derecha.
                <br />Interactúa con el orbe 3D para ver las animaciones.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">🎤 Modo voz</span>
                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs">💬 Chat</span>
                <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs">📊 Visualización</span>
              </div>
            </div>
            <p className="text-xs text-white/40">
              Mira la esquina inferior derecha de la pantalla
            </p>
          </div>
        </DemoCard>
        
        {/* Demo: Panel IA Inmersivo */}
        <DemoCard
          title="Immersive AI Panel"
          description="Panel completo con robot 3D interactivo"
          icon={<Cpu className="w-5 h-5 text-emerald-400" />}
          actions={
            <Button 
              onClick={() => window.open('/ai-panel', '_blank')} 
              size="sm"
            >
              <ChevronRight className="w-4 h-4 mr-2" /> Ver Panel Completo
            </Button>
          }
        >
          <div className="text-center">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-blue-900/30 border border-white/10 mb-4">
              <p className="text-white/70 mb-4">
                Experiencia inmersiva con:
              </p>
              <ul className="text-sm text-white/60 space-y-2 text-left max-w-xs mx-auto">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Robot 3D interactivo con estados visuales
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  Paneles flotantes con datos en tiempo real
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  Formularios con llenado automático por IA
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  HUD táctico con métricas del sistema
                </li>
              </ul>
            </div>
          </div>
        </DemoCard>
      </div>
      
      {/* Información adicional */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 max-w-4xl mx-auto text-center"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Stack Tecnológico</h2>
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            'React Three Fiber',
            '@react-three/drei',
            '@react-three/postprocessing',
            'Three.js',
            'Framer Motion',
            'TypeScript',
            'Tailwind CSS',
            'shadcn/ui',
          ].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/70"
            >
              {tech}
            </span>
          ))}
        </div>
      </motion.div>
      
      {/* Widget flotante activo */}
      <FloatingAIOrb />
      
      {/* Overlay de carga */}
      <PortalLoadingOverlay
        isLoading={showOverlay}
        progress={overlayProgress}
        message={overlayProgress < 0.5 ? 'Cargando recursos...' : 'Casi listo...'}
        color="void"
      />
    </div>
  )
}
