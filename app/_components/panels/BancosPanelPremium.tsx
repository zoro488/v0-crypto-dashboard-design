'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PREMIUM BANCOS PANEL
// Panel de bancos con 7 orbes 3D interactivos
// ═══════════════════════════════════════════════════════════════

import { Suspense, useState, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  PerspectiveCamera, 
  Environment, 
  Float,
  MeshTransmissionMaterial,
  Text,
  Html,
  OrbitControls,
} from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Eye,
  EyeOff,
  History,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/app/_lib/utils'
import { formatCurrency } from '@/app/_lib/utils/formatters'
import { BANCOS_CONFIG, type BancoId } from '@/app/_lib/constants/bancos'
import type { Banco } from '@/database/schema'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════
// 3D BANK ORB COMPONENT
// ═══════════════════════════════════════════════════════════════

interface BankOrb3DProps {
  banco: Banco
  config: typeof BANCOS_CONFIG[BancoId]
  position: [number, number, number]
  isSelected: boolean
  onClick: () => void
  maxCapital: number
}

function BankOrb3D({ banco, config, position, isSelected, onClick, maxCapital }: BankOrb3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  
  // Scale based on capital
  const scale = 0.5 + (banco.capitalActual / Math.max(maxCapital, 1)) * 0.5
  const color = new THREE.Color(config.color)
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.2
      const breathe = 1 + Math.sin(clock.elapsedTime * 2) * 0.03
      meshRef.current.scale.setScalar(scale * breathe * (isSelected ? 1.15 : 1))
    }
    
    if (glowRef.current) {
      const pulse = Math.sin(clock.elapsedTime * 3) * 0.5 + 0.5
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = (0.2 + pulse * 0.15) * (isSelected ? 1.5 : 1)
    }
  })
  
  return (
    <Float 
      position={position} 
      speed={1.5} 
      rotationIntensity={0.2} 
      floatIntensity={0.4}
    >
      <group onClick={onClick}>
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
        <mesh ref={glowRef} scale={1.3}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
        
        {/* Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5 * scale, 0.02, 16, 64]} />
          <meshBasicMaterial color={config.color} transparent opacity={0.5} />
        </mesh>
        
        {/* Light */}
        <pointLight color={config.color} intensity={isSelected ? 3 : 1.5} distance={5} />
        
        {/* Label */}
        <Html
          position={[0, -1.8 * scale, 0]}
          center
          className="pointer-events-none"
        >
          <div className="text-center">
            <p className="text-xs font-medium text-white whitespace-nowrap">
              {config.nombre}
            </p>
            <p className="text-[10px] text-gray-400">
              {formatCurrency(banco.capitalActual)}
            </p>
          </div>
        </Html>
      </group>
    </Float>
  )
}

// ═══════════════════════════════════════════════════════════════
// 3D SCENE
// ═══════════════════════════════════════════════════════════════

const ORBS_POSITIONS: [number, number, number][] = [
  [0, 0, 0],       // Centro
  [-3, 0, 2],      // Izquierda adelante
  [3, 0, 2],       // Derecha adelante
  [-3, 0, -2],     // Izquierda atrás
  [3, 0, -2],      // Derecha atrás
  [0, 0, 3],       // Frente
  [0, 0, -3],      // Atrás
]

interface BancosSceneProps {
  bancos: Banco[]
  selectedBanco: string | null
  onSelectBanco: (id: string | null) => void
}

function BancosScene({ bancos, selectedBanco, onSelectBanco }: BancosSceneProps) {
  const maxCapital = Math.max(...bancos.map(b => b.capitalActual), 1)
  
  // Sort by config order
  const bancosOrdenados = [...bancos].sort((a, b) => {
    const configA = BANCOS_CONFIG[a.id as BancoId]
    const configB = BANCOS_CONFIG[b.id as BancoId]
    return (configA?.orden || 99) - (configB?.orden || 99)
  })
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 6, 12]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
        maxDistance={20}
        minDistance={8}
        dampingFactor={0.05}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={0.4} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.3} color="#8B00FF" />
      <pointLight position={[10, 10, 10]} intensity={0.3} color="#FFD700" />
      
      {/* Environment */}
      <Environment preset="night" />
      
      {/* Fog */}
      <fog attach="fog" args={['#000000', 10, 35]} />
      
      {/* Floor grid */}
      <gridHelper args={[20, 20, '#1a1a2e', '#1a1a2e']} position={[0, -2, 0]} />
      
      {/* Bank Orbs */}
      {bancosOrdenados.map((banco, index) => {
        const config = BANCOS_CONFIG[banco.id as BancoId]
        if (!config) return null
        
        return (
          <BankOrb3D
            key={banco.id}
            banco={banco}
            config={config}
            position={ORBS_POSITIONS[index] || [0, 0, 0]}
            isSelected={selectedBanco === banco.id}
            onClick={() => onSelectBanco(selectedBanco === banco.id ? null : banco.id)}
            maxCapital={maxCapital}
          />
        )
      })}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// BANK DETAIL PANEL
// ═══════════════════════════════════════════════════════════════

interface BankDetailPanelProps {
  banco: Banco
  config: typeof BANCOS_CONFIG[BancoId]
  onClose: () => void
  onTransfer: () => void
  onAddFunds: () => void
  onWithdraw: () => void
}

function BankDetailPanel({ banco, config, onClose, onTransfer, onAddFunds, onWithdraw }: BankDetailPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed right-6 top-1/2 -translate-y-1/2 w-96 z-30"
    >
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
        {/* Header */}
        <div 
          className="p-6 relative"
          style={{
            background: `linear-gradient(135deg, ${config.color}30 0%, transparent 100%)`,
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
          
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}80 100%)` }}
            >
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{config.nombre}</h3>
              <p className="text-sm text-gray-400">{config.descripcion}</p>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="p-6 space-y-4">
          {/* Capital Actual */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Capital Actual</span>
              <span 
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ 
                  background: `${config.color}20`,
                  color: config.color,
                }}
              >
                {config.tipo}
              </span>
            </div>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(banco.capitalActual)}
            </p>
          </div>
          
          {/* Históricos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="h-4 w-4 text-green-400" />
                <span className="text-xs text-gray-400">Ingresos</span>
              </div>
              <p className="text-lg font-semibold text-green-400">
                {formatCurrency(banco.historicoIngresos)}
              </p>
            </div>
            
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownRight className="h-4 w-4 text-red-400" />
                <span className="text-xs text-gray-400">Gastos</span>
              </div>
              <p className="text-lg font-semibold text-red-400">
                {formatCurrency(banco.historicoGastos)}
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddFunds}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors"
            >
              <Plus className="h-5 w-5 text-green-400" />
              <span className="text-xs text-green-400">Ingreso</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onWithdraw}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <Minus className="h-5 w-5 text-red-400" />
              <span className="text-xs text-red-400">Gasto</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onTransfer}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
            >
              <ArrowRightLeft className="h-5 w-5 text-violet-400" />
              <span className="text-xs text-violet-400">Transferir</span>
            </motion.button>
          </div>
          
          {/* Ver historial */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-gray-300"
          >
            <History className="h-4 w-4" />
            <span className="text-sm">Ver Historial Completo</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY CARDS
// ═══════════════════════════════════════════════════════════════

interface SummaryCardProps {
  title: string
  value: string
  icon: typeof Wallet
  gradient: string
  delay?: number
  showAmount?: boolean
}

function SummaryCard({ title, value, icon: Icon, gradient, delay = 0, showAmount = true }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "bg-gradient-to-br backdrop-blur-xl",
        gradient
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/70 mb-2">{title}</p>
          <p className="text-3xl font-bold text-white">
            {showAmount ? value : '••••••'}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-white/10">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      
      {/* Decorative */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface BancosPanelPremiumProps {
  bancos: Banco[]
  capitalTotal: number
  historicoIngresos: number
  historicoGastos: number
}

export function BancosPanelPremium({ 
  bancos,
  capitalTotal,
  historicoIngresos,
  historicoGastos,
}: BancosPanelPremiumProps) {
  const [selectedBanco, setSelectedBanco] = useState<string | null>(null)
  const [showAmounts, setShowAmounts] = useState(true)
  
  const selectedBancoData = useMemo(() => {
    if (!selectedBanco) return null
    const banco = bancos.find(b => b.id === selectedBanco)
    const config = BANCOS_CONFIG[selectedBanco as BancoId]
    if (!banco || !config) return null
    return { banco, config }
  }, [selectedBanco, bancos])

  return (
    <div className="min-h-screen bg-black p-6 lg:p-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
              Bancos & Bóvedas
            </h1>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span className="text-xs text-yellow-300">7 Orbes</span>
            </div>
          </div>
          <p className="text-gray-400">
            Control y distribución de capital
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAmounts(!showAmounts)}
          className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          {showAmounts ? (
            <Eye className="h-5 w-5 text-gray-400" />
          ) : (
            <EyeOff className="h-5 w-5 text-gray-400" />
          )}
        </motion.button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          title="Capital Total"
          value={formatCurrency(capitalTotal)}
          icon={Wallet}
          gradient="from-violet-500/30 to-purple-600/20"
          delay={0}
          showAmount={showAmounts}
        />
        <SummaryCard
          title="Ingresos Históricos"
          value={formatCurrency(historicoIngresos)}
          icon={TrendingUp}
          gradient="from-green-500/30 to-emerald-600/20"
          delay={0.1}
          showAmount={showAmounts}
        />
        <SummaryCard
          title="Gastos Históricos"
          value={formatCurrency(historicoGastos)}
          icon={TrendingDown}
          gradient="from-red-500/30 to-rose-600/20"
          delay={0.2}
          showAmount={showAmounts}
        />
      </div>

      {/* 3D Canvas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-black to-zinc-900 border border-white/10"
      >
        <Canvas shadows dpr={[1, 2]}>
          <Suspense fallback={null}>
            <BancosScene 
              bancos={bancos} 
              selectedBanco={selectedBanco}
              onSelectBanco={setSelectedBanco}
            />
          </Suspense>
        </Canvas>
        
        {/* Instructions */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-gray-500">
          <span>🖱️ Click para seleccionar</span>
          <span>•</span>
          <span>↔️ Arrastra para rotar</span>
          <span>•</span>
          <span>🔍 Scroll para zoom</span>
        </div>
      </motion.div>

      {/* Bank Cards Grid (below 3D) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8"
      >
        {bancos.map((banco, index) => {
          const config = BANCOS_CONFIG[banco.id as BancoId]
          if (!config) return null
          
          return (
            <motion.div
              key={banco.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => setSelectedBanco(banco.id)}
              className={cn(
                "p-4 rounded-xl cursor-pointer transition-all duration-200",
                "bg-white/5 border hover:bg-white/10",
                selectedBanco === banco.id 
                  ? "border-violet-500/50" 
                  : "border-white/10 hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}80 100%)` }}
                >
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{config.nombre}</p>
                  <p className="text-xs text-gray-500">{config.tipo}</p>
                </div>
              </div>
              <p className="text-xl font-bold text-white">
                {showAmounts ? formatCurrency(banco.capitalActual) : '••••••'}
              </p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedBancoData && (
          <BankDetailPanel
            banco={selectedBancoData.banco}
            config={selectedBancoData.config}
            onClose={() => setSelectedBanco(null)}
            onTransfer={() => console.log('Transfer')}
            onAddFunds={() => console.log('Add funds')}
            onWithdraw={() => console.log('Withdraw')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default BancosPanelPremium
