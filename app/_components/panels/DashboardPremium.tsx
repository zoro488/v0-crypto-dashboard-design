'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PREMIUM DASHBOARD
// Dashboard principal con 7 orbes bancarios 3D
// ═══════════════════════════════════════════════════════════════

import { Suspense, useState, useMemo, useRef, useEffect, Component, ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  PerspectiveCamera, 
  Environment, 
  Float,
  MeshTransmissionMaterial,
  OrbitControls,
  Html,
  Stars,
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Building2,
  Eye,
  BarChart3,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/app/_lib/utils'
import { formatCurrency, formatPercent } from '@/app/_lib/utils/formatters'
import { BANCOS_CONFIG, type BancoId, BANCOS_ORDENADOS } from '@/app/_lib/constants/bancos'
import type { Banco } from '@/database/schema'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════
// ERROR BOUNDARY FOR 3D CANVAS
// ═══════════════════════════════════════════════════════════════

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class Canvas3DErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('[DashboardPremium] 3D Canvas error:', error.message)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-violet-500/5 to-purple-500/5">
          <AlertTriangle className="h-12 w-12 text-yellow-500/50 mb-4" />
          <p className="text-gray-400 text-sm">Visualización 3D no disponible</p>
          <p className="text-gray-500 text-xs mt-1">Los datos se muestran en la lista lateral</p>
        </div>
      )
    }
    return this.props.children
  }
}

// ═══════════════════════════════════════════════════════════════
// 3D BANK ORB
// ═══════════════════════════════════════════════════════════════

interface BankOrb3DProps {
  banco: Banco
  config: typeof BANCOS_CONFIG[BancoId]
  position: [number, number, number]
  isHovered: boolean
  onHover: (id: string | null) => void
  maxCapital: number
}

function BankOrb3D({ banco, config, position, isHovered, onHover, maxCapital }: BankOrb3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  
  const scale = 0.4 + (banco.capitalActual / Math.max(maxCapital, 1)) * 0.6
  const color = new THREE.Color(config.color)
  
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.2
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.1
      const breathe = 1 + Math.sin(t * 2 + position[0]) * 0.03
      const hoverScale = isHovered ? 1.2 : 1
      meshRef.current.scale.setScalar(scale * breathe * hoverScale)
    }
    
    if (glowRef.current) {
      const pulse = Math.sin(t * 3) * 0.5 + 0.5
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = (0.15 + pulse * 0.1) * (isHovered ? 1.5 : 1)
    }
    
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5
    }
  })
  
  return (
    <Float 
      position={position}
      speed={1.5}
      rotationIntensity={0.2}
      floatIntensity={0.3}
    >
      <group
        onPointerEnter={() => onHover(banco.id)}
        onPointerLeave={() => onHover(null)}
      >
        {/* Main orb */}
        <mesh ref={meshRef} castShadow>
          <icosahedronGeometry args={[1, 4]} />
          <MeshTransmissionMaterial
            color={color}
            transmission={0.95}
            thickness={0.3}
            roughness={0.05}
            chromaticAberration={0.8}
            anisotropy={0.5}
            distortion={0.3}
            temporalDistortion={0.1}
          />
        </mesh>
        
        {/* Glow */}
        <mesh ref={glowRef} scale={1.4}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
        
        {/* Ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.6 * scale, 0.015, 16, 64]} />
          <meshBasicMaterial color={config.color} transparent opacity={0.6} />
        </mesh>
        
        {/* Light */}
        <pointLight color={config.color} intensity={isHovered ? 3 : 1.5} distance={5} />
        
        {/* Label */}
        {isHovered && (
          <Html position={[0, -1.5 * scale, 0]} center className="pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel px-4 py-2 rounded-xl text-center whitespace-nowrap"
            >
              <p className="text-sm font-medium text-white">{config.nombre}</p>
              <p className="text-lg font-bold" style={{ color: config.color }}>
                {formatCurrency(banco.capitalActual)}
              </p>
            </motion.div>
          </Html>
        )}
      </group>
    </Float>
  )
}

// Posiciones hexagonales para 7 bancos
const BANK_POSITIONS: [number, number, number][] = [
  [0, 0, 0],       // Centro
  [-2.5, 0, 1.5],  // Izq adelante
  [2.5, 0, 1.5],   // Der adelante
  [-2.5, 0, -1.5], // Izq atrás
  [2.5, 0, -1.5],  // Der atrás
  [0, 0, 3],       // Frente
  [0, 0, -3],      // Atrás
]

// ═══════════════════════════════════════════════════════════════
// 3D SCENE
// ═══════════════════════════════════════════════════════════════

interface DashboardSceneProps {
  bancos: Banco[]
  hoveredBanco: string | null
  onHoverBanco: (id: string | null) => void
}

function DashboardScene({ bancos, hoveredBanco, onHoverBanco }: DashboardSceneProps) {
  const maxCapital = Math.max(...bancos.map(b => b.capitalActual), 1)
  
  const bancosOrdenados = [...bancos].sort((a, b) => {
    const configA = BANCOS_CONFIG[a.id as BancoId]
    const configB = BANCOS_CONFIG[b.id as BancoId]
    return (configA?.orden || 99) - (configB?.orden || 99)
  })
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={45} />
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
        maxDistance={18}
        minDistance={6}
        dampingFactor={0.05}
        autoRotate
        autoRotateSpeed={0.3}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[10, 10, 5]} intensity={0.3} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.2} color="#8B00FF" />
      <pointLight position={[10, 10, 10]} intensity={0.2} color="#FFD700" />
      
      {/* Environment & Effects */}
      <Environment preset="night" />
      <Stars radius={100} depth={50} count={2000} factor={4} fade speed={1} />
      <fog attach="fog" args={['#000000', 8, 25]} />
      
      {/* Neural Grid Floor */}
      <gridHelper args={[30, 30, '#1a1a3e', '#1a1a3e']} position={[0, -2, 0]} />
      
      {/* Bank Orbs */}
      {bancosOrdenados.map((banco, index) => {
        const config = BANCOS_CONFIG[banco.id as BancoId]
        if (!config) return null
        
        return (
          <BankOrb3D
            key={banco.id}
            banco={banco}
            config={config}
            position={BANK_POSITIONS[index] || [0, 0, 0]}
            isHovered={hoveredBanco === banco.id}
            onHover={onHoverBanco}
            maxCapital={maxCapital}
          />
        )
      })}
      
      {/* Post-processing - Simplified for stability */}
      <EffectComposer>
        <Bloom 
          intensity={0.3}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// STATS CARDS
// ═══════════════════════════════════════════════════════════════

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  icon: typeof DollarSign
  trend?: number
  gradient: string
  delay?: number
}

function StatsCard({ title, value, subtitle, icon: Icon, trend, gradient, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 500, damping: 30 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        "relative group overflow-hidden rounded-2xl p-6",
        "bg-gradient-to-br backdrop-blur-xl",
        "border border-white/10 hover:border-white/20",
        "transition-all duration-300",
        gradient
      )}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
            <Icon className="h-5 w-5 text-white" />
          </div>
          
          {trend !== undefined && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.2 }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                trend >= 0 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              )}
            >
              {trend >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </motion.div>
          )}
        </div>
        
        <h3 className="text-sm font-medium text-white/60 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white">{value}</p>
        
        {subtitle && (
          <p className="text-xs text-white/40 mt-2">{subtitle}</p>
        )}
      </div>
      
      {/* Decorative glow */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors" />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// BANK MINI CARD
// ═══════════════════════════════════════════════════════════════

interface BankMiniCardProps {
  banco: Banco
  config: typeof BANCOS_CONFIG[BancoId]
  isHovered: boolean
  onHover: (id: string | null) => void
  index: number
}

function BankMiniCard({ banco, config, isHovered, onHover, index }: BankMiniCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.05 }}
      onMouseEnter={() => onHover(banco.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
        "bg-white/5 hover:bg-white/10 border",
        isHovered ? "border-violet-500/50 shadow-lg shadow-violet-500/10" : "border-white/5"
      )}
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}80 100%)` }}
      >
        <Building2 className="h-5 w-5 text-white" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{config.nombre}</p>
        <p className="text-xs text-gray-500">{config.tipo}</p>
      </div>
      
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-white">
          {formatCurrency(banco.capitalActual)}
        </p>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface DashboardPremiumProps {
  capital: {
    capitalTotal: number
    ingresosHistoricos: number
    gastosHistoricos: number
  }
  bancos: Banco[]
  stats: {
    totalVentas: number
    montoTotal: number
    montoPagado: number
    montoRestante: number
    ventasCompletas: number
    ventasParciales: number
    ventasPendientes: number
  } | null
}

export function DashboardPremium({ capital, bancos, stats }: DashboardPremiumProps) {
  const [hoveredBanco, setHoveredBanco] = useState<string | null>(null)
  
  // Sort bancos
  const bancosOrdenados = useMemo(() => {
    return [...bancos].sort((a, b) => {
      const configA = BANCOS_CONFIG[a.id as BancoId]
      const configB = BANCOS_CONFIG[b.id as BancoId]
      return (configA?.orden || 99) - (configB?.orden || 99)
    })
  }, [bancos])

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 lg:p-8 pb-0"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                CHRONOS INFINITY
              </h1>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span className="text-sm text-violet-300 font-medium">2026</span>
              </div>
            </div>
            <p className="text-gray-400">Sistema de Gestión Financiera Premium</p>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            >
              <BarChart3 className="h-5 w-5" />
              Reportes
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            >
              <Eye className="h-5 w-5" />
              Vista Completa
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Capital Total"
            value={formatCurrency(capital.capitalTotal)}
            subtitle="Suma de todos los bancos"
            icon={DollarSign}
            trend={12.5}
            gradient="from-violet-500/20 to-purple-500/10"
            delay={0}
          />
          <StatsCard
            title="Ingresos Históricos"
            value={formatCurrency(capital.ingresosHistoricos)}
            subtitle="Total acumulado"
            icon={TrendingUp}
            trend={8.3}
            gradient="from-green-500/20 to-emerald-500/10"
            delay={0.1}
          />
          <StatsCard
            title="Ventas del Período"
            value={formatCurrency(stats?.montoTotal || 0)}
            subtitle={`${stats?.totalVentas || 0} transacciones`}
            icon={ShoppingCart}
            trend={5.7}
            gradient="from-blue-500/20 to-cyan-500/10"
            delay={0.2}
          />
          <StatsCard
            title="Por Cobrar"
            value={formatCurrency(stats?.montoRestante || 0)}
            subtitle="Pagos pendientes"
            icon={Package}
            trend={-2.1}
            gradient="from-yellow-500/20 to-amber-500/10"
            delay={0.3}
          />
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 3D Canvas - Takes 3 columns */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3 relative h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-violet-500/20"
          >
            <Canvas3DErrorBoundary>
              <Canvas 
                shadows 
                dpr={[1, 1.5]} 
                gl={{ 
                  antialias: true, 
                  alpha: true,
                  powerPreference: 'high-performance',
                  failIfMajorPerformanceCaveat: false,
                }}
                onCreated={({ gl }) => {
                  gl.setClearColor(0x000000, 0)
                }}
              >
                <Suspense fallback={null}>
                  <DashboardScene 
                    bancos={bancos}
                    hoveredBanco={hoveredBanco}
                    onHoverBanco={setHoveredBanco}
                  />
                </Suspense>
              </Canvas>
            </Canvas3DErrorBoundary>
            
            {/* Instructions overlay */}
            <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-gray-500">
              <span>🖱️ Hover para detalles</span>
              <span>↔️ Arrastra para rotar</span>
              <span>🔍 Scroll para zoom</span>
            </div>
            
            {/* Title overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10">
                <Building2 className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">7 Bóvedas Financieras</p>
                <p className="text-xs text-gray-400">Distribución de capital en tiempo real</p>
              </div>
            </div>
          </motion.div>

          {/* Bank List - Takes 1 column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-panel rounded-2xl p-4 border border-white/10 h-[500px] overflow-hidden flex flex-col"
          >
            <h3 className="text-lg font-semibold text-white mb-4 px-2">Bancos</h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {bancosOrdenados.map((banco, index) => {
                const config = BANCOS_CONFIG[banco.id as BancoId]
                if (!config) return null
                
                return (
                  <BankMiniCard
                    key={banco.id}
                    banco={banco}
                    config={config}
                    isHovered={hoveredBanco === banco.id}
                    onHover={setHoveredBanco}
                    index={index}
                  />
                )
              })}
            </div>
            
            {/* Total */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Capital</span>
                <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  {formatCurrency(capital.capitalTotal)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPremium
