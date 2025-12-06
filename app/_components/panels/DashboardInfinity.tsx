'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — DASHBOARD INFINITY
// Panel principal con 7 orbes 3D representando los bancos
// Conectado a Zustand Store para funcionar sin servidor
// ═══════════════════════════════════════════════════════════════

import { Suspense, useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { 
  PerspectiveCamera, 
  Environment, 
  OrbitControls,
} from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing'
import { motion } from 'framer-motion'
import { PremiumOrb } from '@/app/_components/3d/PremiumOrb'
import { NeuralGridFloor } from '@/app/_components/3d/NeuralGridFloor'
import { QuantumDust } from '@/app/_components/3d/QuantumDust'
import { useChronosStore } from '@/app/lib/store'
import { BANCOS_CONFIG, type BancoId } from '@/app/_lib/constants/bancos'
import { formatCurrency } from '@/app/_lib/utils/formatters'
import type { Banco } from '@/app/types'
import * as THREE from 'three'

// Posiciones optimizadas para los 7 bancos en formación hexagonal
const BANCO_POSITIONS: Record<BancoId, [number, number, number]> = {
  'boveda_monte': [0, 0, 0],      // Centro
  'boveda_usa': [-3, 0, 2],       // Izquierda adelante
  'utilidades': [3, 0, 2],        // Derecha adelante
  'flete_sur': [-3, 0, -2],       // Izquierda atrás
  'azteca': [3, 0, -2],           // Derecha atrás
  'leftie': [0, 0, 3],            // Frente
  'profit': [0, 0, -3],           // Atrás
}

interface DashboardStats {
  totalCapital: number
  totalIngresos: number
  totalGastos: number
  ventasHoy: number
  clientesActivos: number
  bancoMayorCapital: BancoId
}

function BankOrbs3D({ onBancoClick }: { onBancoClick: (id: BancoId) => void }) {
  // Usar Zustand store en lugar de API
  const storeBancos = useChronosStore(state => state.bancos)
  
  const bancosData = useMemo(() => {
    return Object.entries(storeBancos).map(([bancoId, banco]) => {
      const config = BANCOS_CONFIG[bancoId as BancoId]
      const intensity = Math.min(banco.capitalActual / 100000, 1) // Normalizar intensidad
      
      return {
        id: bancoId as BancoId,
        position: BANCO_POSITIONS[bancoId as BancoId] || [0, 0, 0] as [number, number, number],
        color: config?.color || '#8B00FF',
        glowColor: '#FFD700',
        capital: banco.capitalActual,
        nombre: config?.nombre || banco.nombre,
        intensity: Math.max(intensity, 0.3), // Mínimo 0.3 para visibilidad
      }
    })
  }, [storeBancos])

  return (
    <group>
      {bancosData.map((banco) => (
        <PremiumOrb
          key={banco.id}
          position={banco.position}
          color={banco.color}
          glowColor={banco.glowColor}
          size={1}
          intensity={banco.intensity}
          label={banco.nombre}
          value={banco.capital}
          onClick={() => onBancoClick(banco.id)}
        />
      ))}
    </group>
  )
}

function Scene({ onBancoClick }: { onBancoClick: (id: BancoId) => void }) {
  return (
    <>
      {/* Cámara con perspectiva cinematográfica */}
      <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />
      
      {/* Controles suaves */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        maxDistance={20}
        minDistance={5}
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />
      
      {/* Iluminación cinematográfica */}
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.3} color="#8B00FF" />
      <pointLight position={[10, 10, 10]} intensity={0.3} color="#FFD700" />
      
      {/* Environment map para reflexiones */}
      <Environment preset="city" />
      
      {/* Niebla atmosférica */}
      <fog attach="fog" args={['#000000', 10, 30]} />
      
      {/* Grid neural en el piso */}
      <NeuralGridFloor />
      
      {/* Orbes bancarios */}
      <BankOrbs3D onBancoClick={onBancoClick} />
      
      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
        />
        <DepthOfField
          focusDistance={0.01}
          focalLength={0.05}
          bokehScale={3}
        />
      </EffectComposer>
    </>
  )
}

function StatsCard({ title, value, change, icon }: {
  title: string
  value: string
  change?: string
  icon: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <div className="glass-panel p-6 rounded-2xl border border-violet-500/20 hover:border-violet-500/40 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl">{icon}</div>
          {change && (
            <span className={`text-sm font-medium ${
              change.startsWith('+') ? 'text-green-400' : 'text-red-400'
            }`}>
              {change}
            </span>
          )}
        </div>
        
        <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
        <p className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-gold-400 bg-clip-text text-transparent">
          {value}
        </p>
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-gold-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </motion.div>
  )
}

export default function DashboardInfinity() {
  const [selectedBanco, setSelectedBanco] = useState<BancoId | null>(null)
  
  // Usar Zustand store
  const storeBancos = useChronosStore(state => state.bancos)
  const storeVentas = useChronosStore(state => state.ventas)
  const storeClientes = useChronosStore(state => state.clientes)
  
  // Convertir bancos del store a array
  const bancos = useMemo(() => {
    return Object.values(storeBancos)
  }, [storeBancos])
  
  // Calcular estadísticas
  const stats: DashboardStats = useMemo(() => {
    const totalCapital = bancos.reduce((sum, b) => sum + b.capitalActual, 0)
    const totalIngresos = bancos.reduce((sum, b) => sum + b.historicoIngresos, 0)
    const totalGastos = bancos.reduce((sum, b) => sum + b.historicoGastos, 0)
    
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const ventasHoy = storeVentas.filter(v => {
      // Manejar fecha como string o FirestoreTimestamp
      let fechaVenta: Date
      if (typeof v.fecha === 'string') {
        fechaVenta = new Date(v.fecha)
      } else if (v.fecha && typeof v.fecha === 'object' && 'toDate' in v.fecha) {
        fechaVenta = v.fecha.toDate()
      } else {
        fechaVenta = new Date()
      }
      return fechaVenta >= hoy
    }).length
    
    const clientesActivos = storeClientes.filter(c => c.estado === 'activo').length
    
    const bancoMayorCapital = bancos.reduce((max, b) => 
      b.capitalActual > (max?.capitalActual || 0) ? b : max
    , bancos[0])?.id as BancoId
    
    return {
      totalCapital,
      totalIngresos,
      totalGastos,
      ventasHoy,
      clientesActivos,
      bancoMayorCapital,
    }
  }, [bancos, storeVentas, storeClientes])

  return (
    <div className="relative w-full h-full min-h-screen bg-black overflow-hidden">
      {/* Partículas de fondo */}
      <QuantumDust count={2000} size={0.06} opacity={0.5} />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-8"
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 via-gold-400 to-pink-400 bg-clip-text text-transparent mb-2">
          CHRONOS INFINITY
        </h1>
        <p className="text-gray-400">Sistema de Gestión Financiera Premium</p>
      </motion.div>
      
      {/* Stats Grid */}
      <div className="relative z-10 px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Capital Total"
            value={formatCurrency(stats.totalCapital)}
            change="+12.5%"
            icon="💰"
          />
          <StatsCard
            title="Ingresos Históricos"
            value={formatCurrency(stats.totalIngresos)}
            change="+8.3%"
            icon="📈"
          />
          <StatsCard
            title="Ventas Hoy"
            value={stats.ventasHoy.toString()}
            change="+5"
            icon="🛒"
          />
          <StatsCard
            title="Clientes Activos"
            value={stats.clientesActivos.toString()}
            change="+3"
            icon="👥"
          />
        </div>
      </div>
      
      {/* Canvas 3D */}
      <div className="relative w-full h-[600px]">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
          }}
        >
          <Suspense fallback={null}>
            <Scene onBancoClick={setSelectedBanco} />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Panel de detalles del banco seleccionado */}
      {selectedBanco && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-8 top-1/2 -translate-y-1/2 z-20 w-96"
        >
          <div className="glass-panel p-8 rounded-2xl border border-violet-500/30">
            <button
              onClick={() => setSelectedBanco(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
            
            <h3 className="text-2xl font-bold mb-6">
              {BANCOS_CONFIG[selectedBanco]?.nombre}
            </h3>
            
            {/* Aquí irían los detalles del banco */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Capital Actual</p>
                <p className="text-2xl font-bold text-violet-400">
                  {formatCurrency(
                    bancos.find(b => b.id === selectedBanco)?.capitalActual || 0
                  )}
                </p>
              </div>
              
              {/* Más detalles... */}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
