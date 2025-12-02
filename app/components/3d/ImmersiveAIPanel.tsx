'use client'

/**
 * 🤖 ImmersiveAIPanel - Panel de IA Completamente Inmersivo
 * 
 * Interfaz interactiva con:
 * - Robot/Avatar 3D interactivo (basado en Nexbot)
 * - Paneles flotantes que aparecen dinámicamente
 * - Visualización de datos en tiempo real
 * - Sistema de formularios automatizados con IA
 * - Gráficos interactivos 3D
 * - HUD táctico
 */

import { useState, useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  Environment, 
  Float, 
  RoundedBox,
  Html,
  PerspectiveCamera,
  OrbitControls,
  ContactShadows,
  MeshTransmissionMaterial,
  Sparkles,
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { 
  Send, Mic, MicOff, X,
  AlertTriangle,
  CheckCircle, Database, Cpu, Activity,
  Save,
} from 'lucide-react'

import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { ScrollArea } from '@/app/components/ui/scroll-area'

// ============================================================================
// TIPOS
// ============================================================================

type RobotState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'success' | 'error' | 'working';

interface DataPanel {
  id: string;
  type: 'chart' | 'form' | 'data' | 'list' | 'stats';
  title: string;
  position: [number, number, number];
  data: unknown;
  isVisible: boolean;
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date';
  value: string;
  status: 'empty' | 'filling' | 'filled' | 'error';
  options?: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: 'show_chart' | 'show_form' | 'show_data' | 'fill_form';
}

// ============================================================================
// COLORES POR ESTADO
// ============================================================================

const STATE_COLORS: Record<RobotState, { primary: string; glow: string; emissive: number }> = {
  idle: { primary: '#3b82f6', glow: '#60a5fa', emissive: 0.2 },
  listening: { primary: '#22c55e', glow: '#4ade80', emissive: 0.4 },
  thinking: { primary: '#a855f7', glow: '#c084fc', emissive: 0.5 },
  speaking: { primary: '#06b6d4', glow: '#22d3ee', emissive: 0.6 },
  success: { primary: '#10b981', glow: '#34d399', emissive: 0.5 },
  error: { primary: '#ef4444', glow: '#f87171', emissive: 0.6 },
  working: { primary: '#f59e0b', glow: '#fbbf24', emissive: 0.5 },
}

// ============================================================================
// ROBOT 3D INTERACTIVO
// ============================================================================

interface RobotAvatarProps {
  state: RobotState;
  audioLevel: number;
  onInteraction?: (part: string) => void;
}

function RobotAvatar({ state, audioLevel, onInteraction: _onInteraction }: RobotAvatarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const eyeLeftRef = useRef<THREE.Mesh>(null)
  const eyeRightRef = useRef<THREE.Mesh>(null)
  const antennaRef = useRef<THREE.Mesh>(null)
  const screenRef = useRef<THREE.Mesh>(null)
  
  const colors = STATE_COLORS[state]
  useThree() // Para contexto de Three.js
  
  // Seguimiento del cursor/cámara
  useFrame((frameState, _delta) => {
    if (!groupRef.current || !headRef.current) return
    
    const time = frameState.clock.getElapsedTime()
    
    // Movimiento de respiración
    groupRef.current.position.y = Math.sin(time * 2) * 0.05
    
    // La cabeza mira hacia la cámara suavemente
    if (headRef.current) {
      const targetRotY = Math.sin(time * 0.5) * 0.1
      const targetRotX = Math.cos(time * 0.3) * 0.05
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetRotY, 0.05)
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetRotX, 0.05)
    }
    
    // Parpadeo de ojos
    if (eyeLeftRef.current && eyeRightRef.current) {
      const blink = Math.sin(time * 10) > 0.95 ? 0.1 : 1
      eyeLeftRef.current.scale.y = blink
      eyeRightRef.current.scale.y = blink
      
      // Escala basada en audio cuando habla
      if (state === 'speaking') {
        const audioScale = 1 + audioLevel * 0.3
        eyeLeftRef.current.scale.x = audioScale
        eyeRightRef.current.scale.x = audioScale
      }
    }
    
    // Antena animada
    if (antennaRef.current) {
      antennaRef.current.rotation.z = Math.sin(time * 3) * 0.1
      const intensity = state === 'thinking' ? 2 : state === 'speaking' ? 1.5 : 0.5
      if (antennaRef.current.material instanceof THREE.MeshStandardMaterial) {
        antennaRef.current.material.emissiveIntensity = intensity + Math.sin(time * 5) * 0.3
      }
    }
    
    // Pantalla del pecho
    if (screenRef.current && screenRef.current.material instanceof THREE.MeshStandardMaterial) {
      screenRef.current.material.emissiveIntensity = colors.emissive + audioLevel * 0.5
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={groupRef} scale={1.2}>
        {/* Cuerpo principal */}
        <mesh position={[0, 0, 0]} castShadow>
          <capsuleGeometry args={[0.4, 0.8, 8, 16]} />
          <meshStandardMaterial
            color="#1a1a2e"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
        
        {/* Pantalla del pecho */}
        <mesh ref={screenRef} position={[0, 0.1, 0.35]}>
          <RoundedBox args={[0.5, 0.35, 0.05]} radius={0.05}>
            <meshStandardMaterial
              color={colors.primary}
              emissive={colors.primary}
              emissiveIntensity={colors.emissive}
              metalness={0.5}
              roughness={0.3}
            />
          </RoundedBox>
        </mesh>
        
        {/* Indicador de estado en pantalla */}
        <mesh position={[0, 0.1, 0.38]}>
          <planeGeometry args={[0.4, 0.25]} />
          <meshBasicMaterial color={colors.glow} transparent opacity={0.8} />
        </mesh>
        
        {/* Cabeza */}
        <group ref={headRef} position={[0, 0.9, 0]}>
          {/* Casco */}
          <mesh castShadow>
            <sphereGeometry args={[0.35, 32, 32]} />
            <meshStandardMaterial
              color="#1a1a2e"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
          
          {/* Visor/Cara */}
          <mesh position={[0, 0, 0.2]}>
            <sphereGeometry args={[0.3, 32, 32, 0, Math.PI]} />
            <MeshTransmissionMaterial
              backside={false}
              transmission={0.9}
              roughness={0.1}
              thickness={0.2}
              chromaticAberration={0.02}
              anisotropy={0.3}
              color={colors.primary}
            />
          </mesh>
          
          {/* Ojos */}
          <mesh ref={eyeLeftRef} position={[-0.1, 0.05, 0.28]}>
            <circleGeometry args={[0.06, 32]} />
            <meshStandardMaterial
              color={colors.glow}
              emissive={colors.glow}
              emissiveIntensity={1}
            />
          </mesh>
          <mesh ref={eyeRightRef} position={[0.1, 0.05, 0.28]}>
            <circleGeometry args={[0.06, 32]} />
            <meshStandardMaterial
              color={colors.glow}
              emissive={colors.glow}
              emissiveIntensity={1}
            />
          </mesh>
          
          {/* Antena */}
          <group position={[0, 0.35, 0]}>
            <mesh>
              <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh ref={antennaRef} position={[0, 0.1, 0]}>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshStandardMaterial
                color={colors.primary}
                emissive={colors.primary}
                emissiveIntensity={1}
              />
            </mesh>
          </group>
        </group>
        
        {/* Brazos */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.5, 0.2, 0]}>
            {/* Hombro */}
            <mesh>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#2a2a3e" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Brazo */}
            <mesh position={[side * 0.15, -0.2, 0]} rotation={[0, 0, side * 0.2]}>
              <capsuleGeometry args={[0.06, 0.3, 8, 8]} />
              <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Mano */}
            <mesh position={[side * 0.2, -0.45, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial
                color={colors.primary}
                emissive={colors.primary}
                emissiveIntensity={0.3}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
          </group>
        ))}
        
        {/* Base/Piernas simplificadas */}
        <mesh position={[0, -0.7, 0]}>
          <cylinderGeometry args={[0.25, 0.35, 0.3, 16]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.2} />
        </mesh>
        
        {/* Anillo de luz en la base */}
        <mesh position={[0, -0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.35, 0.02, 16, 64]} />
          <meshStandardMaterial
            color={colors.primary}
            emissive={colors.primary}
            emissiveIntensity={colors.emissive * 2}
          />
        </mesh>
        
        {/* Luz puntual del robot */}
        <pointLight
          position={[0, 0.5, 0.5]}
          color={colors.glow}
          intensity={1 + audioLevel * 2}
          distance={3}
        />
      </group>
    </Float>
  )
}

// ============================================================================
// PANEL FLOTANTE 3D
// ============================================================================

interface FloatingPanel3DProps {
  title: string;
  position: [number, number, number];
  children: React.ReactNode;
  isVisible: boolean;
  onClose?: () => void;
  width?: number;
  height?: number;
}

function FloatingPanel3D({ 
  title, 
  position, 
  children, 
  isVisible,
  onClose,
  width = 300,
  height = 200,
}: FloatingPanel3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!groupRef.current) return
    // Suave movimiento flotante
    groupRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 2) * 0.02
  })

  if (!isVisible) return null

  return (
    <group ref={groupRef} position={position}>
      <Html
        transform
        distanceFactor={1.5}
        style={{
          width: `${width}px`,
          transition: 'all 0.3s ease-out',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.8)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl"
          style={{ width: `${width}px` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-white/10">
            <span className="text-sm font-semibold text-white">{title}</span>
            {onClose && (
              <button onClick={onClose} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Content */}
          <div className="p-4">
            {children}
          </div>
        </motion.div>
      </Html>
    </group>
  )
}

// ============================================================================
// VISUALIZACIÓN DE GRÁFICO 3D
// ============================================================================

function Chart3DPanel({ data, position }: { data: number[]; position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1
  })
  
  const maxValue = Math.max(...data)
  
  return (
    <group ref={groupRef} position={position}>
      {data.map((value, i) => {
        const height = (value / maxValue) * 1.5
        const x = (i - data.length / 2) * 0.25
        const hue = (i / data.length) * 0.3 + 0.55 // Azul a púrpura
        
        return (
          <mesh key={i} position={[x, height / 2, 0]} castShadow>
            <boxGeometry args={[0.15, height, 0.15]} />
            <meshStandardMaterial
              color={new THREE.Color().setHSL(hue, 0.8, 0.5)}
              emissive={new THREE.Color().setHSL(hue, 0.8, 0.3)}
              emissiveIntensity={0.5}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        )
      })}
      
      {/* Base */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[data.length * 0.25 + 0.2, 0.05, 0.3]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ============================================================================
// FORMULARIO ANIMADO
// ============================================================================

interface AnimatedFormProps {
  fields: FormField[];
  onFieldUpdate: (fieldId: string, value: string) => void;
}

function AnimatedForm({ fields, onFieldUpdate }: AnimatedFormProps) {
  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <motion.div
          key={field.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.15 }}
          className="space-y-1"
        >
          <label className="text-xs text-white/60">{field.label}</label>
          <div className="relative">
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={field.value}
              onChange={(e) => onFieldUpdate(field.id, e.target.value)}
              className={`
                w-full px-3 py-2 rounded-lg bg-white/5 border text-sm text-white
                transition-all duration-300
                ${field.status === 'filling' 
                  ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                  : field.status === 'filled'
                    ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                    : field.status === 'error'
                      ? 'border-red-500'
                      : 'border-white/10'
                }
              `}
              placeholder={`Ingresa ${field.label.toLowerCase()}`}
            />
            
            {/* Indicador de estado */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {field.status === 'filling' && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Activity className="w-4 h-4 text-blue-400" />
                </motion.div>
              )}
              {field.status === 'filled' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </motion.div>
              )}
              {field.status === 'error' && (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
            </div>
            
            {/* Efecto de llenado automático */}
            {field.status === 'filling' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent rounded-lg pointer-events-none"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ============================================================================
// HUD LATERAL
// ============================================================================

interface HUDProps {
  stats: {
    cpu: number;
    memory: number;
    tasks: number;
    accuracy: number;
  };
  state: RobotState;
}

function HUD({ stats, state }: HUDProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute left-6 top-1/2 -translate-y-1/2 space-y-3"
    >
      {/* Estado */}
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 w-48">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: STATE_COLORS[state].primary }}
          />
          <span className="text-xs text-white/60 uppercase tracking-wider">{state}</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: STATE_COLORS[state].primary }}
            animate={{ width: state === 'idle' ? '30%' : state === 'thinking' ? '60%' : '90%' }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      
      {/* Stats */}
      {[
        { label: 'CPU', value: stats.cpu, icon: Cpu, color: '#3b82f6' },
        { label: 'Memoria', value: stats.memory, icon: Database, color: '#a855f7' },
        { label: 'Tareas', value: stats.tasks, icon: Activity, color: '#22c55e' },
        { label: 'Precisión', value: stats.accuracy, icon: CheckCircle, color: '#f59e0b' },
      ].map((stat) => (
        <motion.div
          key={stat.label}
          className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 w-48"
          whileHover={{ scale: 1.02, x: 5 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <stat.icon className="w-3 h-3" style={{ color: stat.color }} />
              <span className="text-xs text-white/60">{stat.label}</span>
            </div>
            <span className="text-sm font-mono text-white">{stat.value}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: stat.color }}
              initial={{ width: 0 }}
              animate={{ width: `${stat.value}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ============================================================================
// ESCENA 3D PRINCIPAL
// ============================================================================

interface Scene3DProps {
  state: RobotState;
  audioLevel: number;
  panels: DataPanel[];
  onPanelClose: (id: string) => void;
}

function Scene3D({ state, audioLevel, panels, onPanelClose }: Scene3DProps) {
  return (
    <>
      {/* Cámara */}
      <PerspectiveCamera makeDefault position={[0, 0.5, 4]} fov={50} />
      
      {/* Controles */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={-Math.PI / 6}
        maxAzimuthAngle={Math.PI / 6}
      />
      
      {/* Iluminación */}
      <ambientLight intensity={0.3} />
      <spotLight
        position={[5, 5, 5]}
        angle={0.3}
        penumbra={0.8}
        intensity={1}
        color="#60a5fa"
        castShadow
      />
      <spotLight
        position={[-5, 5, 5]}
        angle={0.3}
        penumbra={0.8}
        intensity={0.5}
        color="#a855f7"
      />
      <pointLight position={[0, -2, 2]} intensity={0.5} color="#22c55e" />
      
      {/* Robot */}
      <RobotAvatar state={state} audioLevel={audioLevel} />
      
      {/* Partículas de ambiente */}
      <Sparkles
        count={100}
        scale={6}
        size={1}
        speed={0.3}
        color={STATE_COLORS[state].primary}
        opacity={0.3}
      />
      
      {/* Paneles flotantes */}
      {panels.map((panel) => (
        <FloatingPanel3D
          key={panel.id}
          title={panel.title}
          position={panel.position}
          isVisible={panel.isVisible}
          onClose={() => onPanelClose(panel.id)}
        >
          {panel.type === 'chart' && (
            <div className="h-32">
              {/* Mini gráfico en panel */}
              <div className="flex items-end gap-1 h-full">
                {(panel.data as number[]).map((val, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-blue-600 to-purple-500 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${val}%` }}
                    transition={{ delay: i * 0.05, type: 'spring' }}
                  />
                ))}
              </div>
            </div>
          )}
          {panel.type === 'stats' && (
            <div className="grid grid-cols-2 gap-2 text-center">
              {Object.entries(panel.data as Record<string, number>).map(([key, val]) => (
                <div key={key} className="bg-white/5 rounded-lg p-2">
                  <div className="text-lg font-bold text-white">{val}</div>
                  <div className="text-[10px] text-white/40 capitalize">{key}</div>
                </div>
              ))}
            </div>
          )}
        </FloatingPanel3D>
      ))}
      
      {/* Sombras de contacto */}
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.5}
        scale={5}
        blur={2}
        far={4}
        color={STATE_COLORS[state].primary}
      />
      
      {/* Suelo reflectante */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
        <circleGeometry args={[3, 64]} />
        <meshStandardMaterial
          color="#0a0a0f"
          metalness={0.9}
          roughness={0.4}
        />
      </mesh>
      
      {/* Environment */}
      <Environment preset="city" />
      
      {/* Post-processing */}
      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.5} luminanceSmoothing={0.9} mipmapBlur />
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.001, 0.001)} />
        <Vignette darkness={0.4} offset={0.3} />
      </EffectComposer>
    </>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function ImmersiveAIPanel() {
  const [state, setState] = useState<RobotState>('idle')
  const [audioLevel, setAudioLevel] = useState(0)
  const [query, setQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Bienvenido al Panel de IA Inmersivo! Puedo ayudarte a visualizar datos, llenar formularios automáticamente, generar reportes y más. ¿Qué necesitas?',
      timestamp: new Date(),
    },
  ])
  const [panels, setPanels] = useState<DataPanel[]>([])
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [showForm, setShowForm] = useState(false)
  const [hudStats] = useState({ cpu: 45, memory: 62, tasks: 8, accuracy: 94 })
  
  const scrollRef = useRef<HTMLDivElement>(null)

  // Simular audio cuando habla
  useEffect(() => {
    if (state === 'speaking') {
      const interval = setInterval(() => setAudioLevel(Math.random() * 0.8 + 0.2), 100)
      return () => clearInterval(interval)
    }
    setAudioLevel(0)
  }, [state])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!query.trim()) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setQuery('')
    
    setState('listening')
    await new Promise(r => setTimeout(r, 500))
    setState('thinking')
    await new Promise(r => setTimeout(r, 1500))
    setState('speaking')
    
    // Determinar acción basada en el query
    let action: ChatMessage['action']
    let responseContent = ''
    
    if (query.toLowerCase().includes('gráfico') || query.toLowerCase().includes('ventas')) {
      action = 'show_chart'
      responseContent = 'Aquí tienes el gráfico de ventas. He detectado una tendencia positiva del 15% esta semana.'
      
      // Mostrar panel de gráfico
      setPanels(prev => [...prev, {
        id: Date.now().toString(),
        type: 'chart',
        title: 'Ventas Semanales',
        position: [2, 0.5, 0],
        data: [65, 40, 85, 55, 70, 90, 75],
        isVisible: true,
      }])
    } else if (query.toLowerCase().includes('formulario') || query.toLowerCase().includes('registro') || query.toLowerCase().includes('llenar')) {
      action = 'fill_form'
      responseContent = 'Entendido, voy a preparar el formulario y llenarlo automáticamente con los datos detectados.'
      setShowForm(true)
      
      // Inicializar campos del formulario
      const fields: FormField[] = [
        { id: '1', label: 'Producto', type: 'text', value: '', status: 'empty' },
        { id: '2', label: 'Cantidad', type: 'number', value: '', status: 'empty' },
        { id: '3', label: 'Precio Unitario', type: 'number', value: '', status: 'empty' },
        { id: '4', label: 'Cliente', type: 'text', value: '', status: 'empty' },
      ]
      setFormFields(fields)
      
      // Simular llenado automático
      setTimeout(() => simulateAutoFill(), 1000)
    } else if (query.toLowerCase().includes('inventario') || query.toLowerCase().includes('stock')) {
      action = 'show_data'
      responseContent = 'He analizado el inventario actual. Aquí están los datos más relevantes.'
      
      setPanels(prev => [...prev, {
        id: Date.now().toString(),
        type: 'stats',
        title: 'Estado del Inventario',
        position: [-2, 0.5, 0],
        data: { total: 1234, bajo: 15, medio: 45, alto: 89 },
        isVisible: true,
      }])
    } else {
      responseContent = `He procesado tu solicitud: "${query}". ¿Necesitas que genere un gráfico, llene un formulario o muestre datos específicos?`
    }
    
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      action,
    }
    setMessages(prev => [...prev, aiMessage])
    
    await new Promise(r => setTimeout(r, 2000))
    setState('success')
    await new Promise(r => setTimeout(r, 500))
    setState('idle')
  }

  const simulateAutoFill = async () => {
    setState('working')
    const values = ['Laptop HP ProBook', '5', '12500', 'Empresa ABC']
    
    for (let i = 0; i < values.length; i++) {
      setFormFields(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'filling' } : f,
      ))
      
      await new Promise(r => setTimeout(r, 800))
      
      setFormFields(prev => prev.map((f, idx) => 
        idx === i ? { ...f, value: values[i], status: 'filled' } : f,
      ))
      
      await new Promise(r => setTimeout(r, 200))
    }
    
    setState('success')
    await new Promise(r => setTimeout(r, 1000))
    setState('idle')
  }

  const handlePanelClose = (id: string) => {
    setPanels(prev => prev.filter(p => p.id !== id))
  }

  const handleFieldUpdate = (fieldId: string, value: string) => {
    setFormFields(prev => prev.map(f => 
      f.id === fieldId ? { ...f, value, status: value ? 'filled' : 'empty' } : f,
    ))
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      
      {/* Canvas 3D */}
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        className="absolute inset-0"
      >
        <Suspense fallback={null}>
          <Scene3D
            state={state}
            audioLevel={audioLevel}
            panels={panels}
            onPanelClose={handlePanelClose}
          />
        </Suspense>
      </Canvas>
      
      {/* HUD */}
      <HUD stats={hudStats} state={state} />
      
      {/* Panel de Chat */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute right-6 top-6 bottom-6 w-96 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
          <h2 className="text-lg font-bold text-white">Asistente IA</h2>
          <div className="flex items-center gap-2 mt-1">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: STATE_COLORS[state].primary }}
            />
            <span className="text-xs text-white/50 capitalize">{state}</span>
          </div>
        </div>
        
        {/* Mensajes */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-tr-sm'
                    : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
        
        {/* Formulario si está activo */}
        <AnimatePresence>
          {showForm && formFields.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 p-4 bg-black/40"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white">Formulario Automático</span>
                <button onClick={() => setShowForm(false)} className="text-white/50 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <AnimatedForm fields={formFields} onFieldUpdate={handleFieldUpdate} />
              <Button className="w-full mt-3" size="sm" disabled={state === 'working'}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Registro
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-black/40">
          <div className="flex gap-2">
            <button
              onClick={() => setIsListening(!isListening)}
              className={`p-3 rounded-xl transition-colors ${
                isListening ? 'bg-red-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe un comando..."
              className="flex-1 bg-white/5 border-white/10 text-white"
            />
            <Button onClick={handleSend} disabled={!query.trim() || state !== 'idle'}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Sugerencias */}
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {['Mostrar gráfico de ventas', 'Llenar formulario', 'Ver inventario'].map((sug) => (
              <button
                key={sug}
                onClick={() => setQuery(sug)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white whitespace-nowrap"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-1/2 -translate-x-1/2"
      >
        <h1 className="text-2xl font-bold text-white/80 tracking-wider">
          CHRONOS <span className="text-blue-400">AI</span> PANEL
        </h1>
      </motion.div>
    </div>
  )
}

export default ImmersiveAIPanel
