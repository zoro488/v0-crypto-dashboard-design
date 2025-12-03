'use client'
/**
 * 🧠 AI NEURAL HUB - Centro de Comando de Inteligencia Artificial
 * 
 * Panel principal donde convergen los 5 servicios de IA del sistema CHRONOS:
 * - MegaAIAgent: Agente central de procesamiento
 * - Reports: Generación automática de reportes
 * - Forms: Llenado inteligente de formularios
 * - Analytics: Análisis predictivo
 * - Learning: Aprendizaje de preferencias del usuario
 * 
 * Diseño "Ciencia Ficción Funcional" estilo JARVIS/Westworld
 */

import { useState, useRef, Suspense, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Float,
  Html,
  Sparkles,
  Stars,
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import * as THREE from 'three'
import {
  Brain,
  Activity,
  TrendingUp,
  Zap,
  Shield,
  ChevronRight,
  Mic,
  Send,
  X,
  Settings,
  BarChart3,
  FileText,
  Cpu,
  Sparkles as SparklesIcon,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
} from 'lucide-react'

// Componentes 3D
import NeuralCore3D from '@/app/components/3d/NeuralCore3D'
import { FluidBackgroundAdvanced } from '@/app/components/3d/FluidBackground'
import { SimpleHolographicChart } from '@/app/components/3d/HolographicBarChart'

// UI
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { ScrollArea } from '@/app/components/ui/scroll-area'

// ============================================================================
// TIPOS
// ============================================================================
type AIState = 'idle' | 'listening' | 'processing' | 'responding' | 'learning'
type SatelliteId = 'analytics' | 'automation' | 'learning' | 'health' | null

interface SatellitePanel {
  id: SatelliteId
  title: string
  icon: React.ElementType
  description: string
  color: string
  position: [number, number]
}

interface AutomationTask {
  id: string
  name: string
  status: 'running' | 'completed' | 'pending'
  progress: number
}

interface SystemHealthItem {
  id: string
  name: string
  status: 'ok' | 'warning' | 'error'
  value: number
}

// ============================================================================
// CONSTANTES
// ============================================================================
const SATELLITE_PANELS: SatellitePanel[] = [
  {
    id: 'analytics',
    title: 'Predictive Analytics',
    icon: TrendingUp,
    description: 'Proyección de ventas futuras en tiempo real',
    color: '#00d4ff',
    position: [-1, 0.8],
  },
  {
    id: 'automation',
    title: 'Automation Status',
    icon: Zap,
    description: 'Tareas que la IA está ejecutando ahora',
    color: '#ffd700',
    position: [1, 0.8],
  },
  {
    id: 'learning',
    title: 'User Learning',
    icon: Brain,
    description: 'Nivel de sincronización con tus preferencias',
    color: '#a855f7',
    position: [-1, -0.8],
  },
  {
    id: 'health',
    title: 'System Health',
    icon: Shield,
    description: 'Escáner de diagnóstico de los 7 bancos',
    color: '#22c55e',
    position: [1, -0.8],
  },
]

const STATE_COLORS: Record<AIState, string> = {
  idle: '#3b82f6',
  listening: '#22c55e',
  processing: '#f59e0b',
  responding: '#06b6d4',
  learning: '#a855f7',
}

// ============================================================================
// ESCENA 3D PRINCIPAL
// ============================================================================
interface NeuralScene3DProps {
  aiState: AIState
  activeSatellite: SatelliteId
  onSatelliteClick: (id: SatelliteId) => void
  audioEnergy: number
}

function NeuralScene3D({
  aiState,
  activeSatellite,
  onSatelliteClick,
  audioEnergy,
}: NeuralScene3DProps) {
  const groupRef = useRef<THREE.Group>(null!)

  // Intensidad de procesamiento basada en estado
  const processingIntensity = aiState === 'processing' ? 0.9
    : aiState === 'learning' ? 0.7
    : aiState === 'responding' ? 0.5
    : aiState === 'listening' ? 0.3
    : 0.15

  return (
    <>
      {/* Cámara */}
      <PerspectiveCamera makeDefault position={[0, 0.5, 6]} fov={50} />
      
      {/* Controles orbitales limitados */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate={aiState === 'idle'}
        autoRotateSpeed={0.3}
      />

      {/* Fondo de fluido cuántico */}
      <FluidBackgroundAdvanced energy={audioEnergy + processingIntensity * 0.3} />

      {/* Estrellas distantes */}
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0.5}
        fade
        speed={0.5}
      />

      {/* Núcleo Neural Central */}
      <group ref={groupRef}>
        <NeuralCore3D
          count={60000}
          radius={2}
          processingIntensity={processingIntensity}
          colorScheme="cosmic"
        />
        
        {/* Anillos orbitales */}
        <OrbitalRings state={aiState} />
        
        {/* Partículas de conexión */}
        <Sparkles
          count={200}
          scale={8}
          size={2}
          speed={0.5}
          color={STATE_COLORS[aiState]}
          opacity={0.3 + processingIntensity * 0.3}
        />
      </group>

      {/* Paneles Satélite 3D */}
      {SATELLITE_PANELS.map((panel) => (
        <SatellitePanel3D
          key={panel.id}
          panel={panel}
          isActive={activeSatellite === panel.id}
          onClick={() => onSatelliteClick(panel.id)}
          aiState={aiState}
        />
      ))}

      {/* Iluminación */}
      <ambientLight intensity={0.2} />
      <pointLight
        position={[0, 0, 0]}
        color={STATE_COLORS[aiState]}
        intensity={2 + processingIntensity * 3}
        distance={10}
      />
      <spotLight
        position={[5, 5, 5]}
        color="#60a5fa"
        intensity={0.5}
        angle={0.3}
        penumbra={0.8}
      />
      <spotLight
        position={[-5, 5, 5]}
        color="#a855f7"
        intensity={0.3}
        angle={0.3}
        penumbra={0.8}
      />

      {/* Environment */}
      <Environment preset="night" />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.001, 0.001)}
        />
        <Noise opacity={0.02} />
        <Vignette darkness={0.5} offset={0.3} />
      </EffectComposer>
    </>
  )
}

// ============================================================================
// ANILLOS ORBITALES
// ============================================================================
function OrbitalRings({ state }: { state: AIState }) {
  const ring1Ref = useRef<THREE.Mesh>(null!)
  const ring2Ref = useRef<THREE.Mesh>(null!)
  const ring3Ref = useRef<THREE.Mesh>(null!)

  useFrame((frameState) => {
    const t = frameState.clock.getElapsedTime()
    const speed = state === 'processing' ? 2 : state === 'learning' ? 1.5 : 1

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.2 * speed
      ring1Ref.current.rotation.y = t * 0.1 * speed
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -t * 0.15 * speed
      ring2Ref.current.rotation.z = t * 0.1 * speed
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = t * 0.1 * speed
      ring3Ref.current.rotation.z = -t * 0.15 * speed
    }
  })

  const ringColor = STATE_COLORS[state]

  return (
    <>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.8, 0.02, 16, 100]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={0.3}
        />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[3.2, 0.015, 16, 100]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={0.2}
        />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[3.6, 0.01, 16, 100]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={0.15}
        />
      </mesh>
    </>
  )
}

// ============================================================================
// PANEL SATÉLITE 3D
// ============================================================================
interface SatellitePanel3DProps {
  panel: SatellitePanel
  isActive: boolean
  onClick: () => void
  aiState: AIState
}

function SatellitePanel3D({ panel, isActive, onClick, aiState }: SatellitePanel3DProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    
    // Flotar suavemente
    groupRef.current.position.y = panel.position[1] * 2 + Math.sin(t * 2 + panel.position[0]) * 0.1
    
    // Escala al hover
    const targetScale = hovered || isActive ? 1.1 : 1
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
  })

  // Renderizar ícono directamente
  const renderIcon = (size: string = 'w-4 h-4') => {
    const Icon = panel.icon
    return <Icon className={size} style={{ color: panel.color } as React.CSSProperties} />
  }

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
      <group
        ref={groupRef}
        position={[panel.position[0] * 3.5, panel.position[1] * 2, -1]}
        onClick={onClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <Html
          center
          distanceFactor={1.5}
          style={{
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: isActive ? 1.05 : 1,
              boxShadow: isActive 
                ? `0 0 30px ${panel.color}40, 0 0 60px ${panel.color}20`
                : `0 0 15px ${panel.color}20`,
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={`
              w-48 p-4 rounded-2xl backdrop-blur-xl
              border border-white/10 bg-black/60
              ${isActive ? 'ring-2 ring-white/20' : ''}
            `}
            style={{
              borderColor: isActive ? panel.color : 'rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${panel.color}20` }}
              >
                {renderIcon()}
              </div>
              <span className="text-sm font-semibold text-white">{panel.title}</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              {panel.description}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: panel.color }}
              />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">
                {aiState === 'processing' ? 'Activo' : 'En espera'}
              </span>
            </div>
          </motion.div>
        </Html>
      </group>
    </Float>
  )
}

// ============================================================================
// PANEL DE DETALLES EXPANDIDO
// ============================================================================
interface ExpandedPanelProps {
  satellite: SatelliteId
  onClose: () => void
}

function ExpandedPanel({ satellite, onClose }: ExpandedPanelProps) {
  const panel = SATELLITE_PANELS.find(p => p.id === satellite)
  if (!panel) return null

  // Renderizar ícono del panel
  const PanelIcon = panel.icon

  return (
    <motion.div
      layoutId={`panel-${satellite}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-4 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-4xl max-h-[80vh] bg-black/90 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-6 border-b border-white/10"
          style={{ background: `linear-gradient(135deg, ${panel.color}20, transparent)` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${panel.color}30` }}
              >
                {(() => {
                  const IconComp = PanelIcon as React.ComponentType<{ className?: string; style?: React.CSSProperties }>
                  return <IconComp className="w-6 h-6" style={{ color: panel.color }} />
                })()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{panel.title}</h2>
                <p className="text-sm text-white/50">{panel.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {satellite === 'analytics' && <AnalyticsContent />}
          {satellite === 'automation' && <AutomationContent />}
          {satellite === 'learning' && <LearningContent />}
          {satellite === 'health' && <HealthContent />}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// CONTENIDOS DE PANELES
// ============================================================================
function AnalyticsContent() {
  const salesData = [65, 78, 52, 89, 73, 95, 82, 67, 88, 94, 76, 91]
  const futureData = [95, 102, 98, 110]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ventas Proyectadas', value: '$485,000', trend: '+15%' },
          { label: 'Confianza', value: '92%', trend: 'Alta' },
          { label: 'Horizonte', value: '30 días', trend: 'Óptimo' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-white/50 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-emerald-400">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className="bg-white/5 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-white mb-4">Proyección de Ventas</h4>
        <div className="h-48 flex items-end gap-2">
          {/* Datos históricos */}
          {salesData.map((val, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-cyan-600/50 to-cyan-400/30 rounded-t"
              style={{ height: `${val}%` }}
            />
          ))}
          {/* Datos proyectados (punteados) */}
          {futureData.map((val, i) => (
            <motion.div
              key={`future-${i}`}
              className="flex-1 rounded-t border-2 border-dashed border-cyan-400"
              style={{ height: `${val}%` }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-white/30">Histórico</span>
          <span className="text-xs text-cyan-400">Proyección →</span>
        </div>
      </div>
    </div>
  )
}

function AutomationContent() {
  const tasks: AutomationTask[] = [
    { id: '1', name: 'Generando reporte de ventas mensual...', status: 'running', progress: 67 },
    { id: '2', name: 'Verificando stock de almacén...', status: 'running', progress: 34 },
    { id: '3', name: 'Sincronizando datos con Firestore...', status: 'completed', progress: 100 },
    { id: '4', name: 'Análisis de márgenes por producto', status: 'pending', progress: 0 },
    { id: '5', name: 'Notificaciones de cobro pendientes', status: 'pending', progress: 0 },
  ]

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white">{task.name}</span>
            {task.status === 'running' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Activity className="w-4 h-4 text-yellow-400" />
              </motion.div>
            )}
            {task.status === 'completed' && (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            )}
            {task.status === 'pending' && (
              <Clock className="w-4 h-4 text-white/30" />
            )}
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                task.status === 'completed' ? 'bg-emerald-400'
                : task.status === 'running' ? 'bg-yellow-400'
                : 'bg-white/20'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${task.progress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function LearningContent() {
  const syncLevel = 78

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          {/* Círculo de progreso */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              stroke="#a855f7"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={553}
              initial={{ strokeDashoffset: 553 }}
              animate={{ strokeDashoffset: 553 - (553 * syncLevel) / 100 }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white">{syncLevel}%</span>
            <span className="text-sm text-white/50">Sincronizado</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Patrones Aprendidos', value: '847' },
          { label: 'Acciones Predichas', value: '12,394' },
          { label: 'Precisión', value: '94.2%' },
          { label: 'Tiempo Activo', value: '45 días' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{stat.value}</p>
            <p className="text-xs text-white/50">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function HealthContent() {
  const banks: SystemHealthItem[] = [
    { id: 'monte', name: 'Bóveda Monte', status: 'ok', value: 98 },
    { id: 'usa', name: 'Bóveda USA', status: 'ok', value: 100 },
    { id: 'profit', name: 'Profit', status: 'warning', value: 75 },
    { id: 'leftie', name: 'Leftie', status: 'ok', value: 92 },
    { id: 'azteca', name: 'Azteca', status: 'ok', value: 88 },
    { id: 'flete', name: 'Flete Sur', status: 'error', value: 45 },
    { id: 'utilidades', name: 'Utilidades', status: 'ok', value: 95 },
  ]

  const getStatusColor = (status: SystemHealthItem['status']) => {
    switch (status) {
      case 'ok': return '#22c55e'
      case 'warning': return '#f59e0b'
      case 'error': return '#ef4444'
    }
  }

  const getStatusIcon = (status: SystemHealthItem['status']) => {
    switch (status) {
      case 'ok': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return AlertTriangle
    }
  }

  return (
    <div className="space-y-4">
      {banks.map((bank) => {
        const Icon = getStatusIcon(bank.status)
        const color = getStatusColor(bank.status)

        return (
          <div
            key={bank.id}
            className="bg-white/5 rounded-xl p-4 flex items-center gap-4"
          >
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <Database className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white">{bank.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono" style={{ color }}>
                    {bank.value}%
                  </span>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${bank.value}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function AINeuralHub() {
  const [aiState, setAiState] = useState<AIState>('idle')
  const [activeSatellite, setActiveSatellite] = useState<SatelliteId>(null)
  const [query, setQuery] = useState('')
  const [audioEnergy, setAudioEnergy] = useState(0)
  const [isListening, setIsListening] = useState(false)

  // Simular estado de la IA
  const handleSend = useCallback(async () => {
    if (!query.trim()) return

    setAiState('listening')
    await new Promise(r => setTimeout(r, 500))
    
    setAiState('processing')
    // Simular energía de audio
    const interval = setInterval(() => {
      setAudioEnergy(Math.random() * 0.5 + 0.3)
    }, 100)
    
    await new Promise(r => setTimeout(r, 2000))
    clearInterval(interval)
    
    setAiState('responding')
    await new Promise(r => setTimeout(r, 1500))
    
    setAiState('idle')
    setAudioEnergy(0)
    setQuery('')
  }, [query])

  const handleSatelliteClick = useCallback((id: SatelliteId) => {
    setActiveSatellite(prev => prev === id ? null : id)
  }, [])

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Canvas 3D */}
      <Canvas
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        className="absolute inset-0"
      >
        <Suspense fallback={null}>
          <NeuralScene3D
            aiState={aiState}
            activeSatellite={activeSatellite}
            onSatelliteClick={handleSatelliteClick}
            audioEnergy={audioEnergy}
          />
        </Suspense>
      </Canvas>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="flex items-center gap-4 px-6 py-3 bg-black/50 backdrop-blur-xl rounded-full border border-white/10">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: STATE_COLORS[aiState] }}
          />
          <h1 className="text-xl font-bold text-white tracking-wider">
            CHRONOS <span className="text-cyan-400">NEURAL HUB</span>
          </h1>
          <div className="text-xs text-white/50 uppercase tracking-wider">
            {aiState === 'idle' ? 'Sistema Listo' : aiState}
          </div>
        </div>
      </motion.div>

      {/* Estado del Sistema - HUD Lateral */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute left-6 top-1/2 -translate-y-1/2 space-y-3 z-10"
      >
        {[
          { icon: Cpu, label: 'CPU', value: 45 + Math.random() * 20, color: '#3b82f6' },
          { icon: Database, label: 'Memoria', value: 62 + Math.random() * 15, color: '#a855f7' },
          { icon: Activity, label: 'Tareas', value: 8, color: '#22c55e', isCount: true },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 w-40"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <stat.icon className="w-3 h-3" style={{ color: stat.color }} />
                <span className="text-xs text-white/60">{stat.label}</span>
              </div>
              <span className="text-sm font-mono text-white">
                {stat.isCount ? stat.value : `${Math.round(stat.value)}%`}
              </span>
            </div>
            {!stat.isCount && (
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: stat.color }}
                  animate={{ width: `${stat.value}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Input de Chat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-10"
      >
        <div className="bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-4">
          <div className="flex gap-3">
            <button
              onClick={() => setIsListening(!isListening)}
              className={`p-3 rounded-xl transition-all ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Habla con el Neural Hub..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
            <Button
              onClick={handleSend}
              disabled={!query.trim() || aiState !== 'idle'}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* Sugerencias */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {[
              'Mostrar análisis predictivo',
              'Estado de automatizaciones',
              'Verificar salud del sistema',
              'Generar reporte',
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Panel Expandido */}
      <AnimatePresence>
        {activeSatellite && (
          <ExpandedPanel
            satellite={activeSatellite}
            onClose={() => setActiveSatellite(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
