'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PREMIUM REPORTES PANEL
// Centro de reportes con visualización 3D, analytics y exports
// ═══════════════════════════════════════════════════════════════

import { Suspense, useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { 
  PerspectiveCamera, 
  Environment, 
  Float,
  MeshTransmissionMaterial,
  OrbitControls,
} from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText,
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Package,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  Filter,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/app/_lib/utils'
import type { Banco, Venta, Movimiento } from '@/database/schema'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ReportesStats {
  ventasTotales: number
  ingresosTotales: number
  gastosTotales: number
  utilidadNeta: number
  ventasMes: number
  crecimiento: number
}

interface ReportesPanelProps {
  bancos: Banco[]
  stats: ReportesStats | null
  movimientos?: Movimiento[]
}

// ═══════════════════════════════════════════════════════════════
// 3D COMPONENTS
// ═══════════════════════════════════════════════════════════════

function DataCrystal({ 
  position, 
  value, 
  maxValue, 
  color, 
  label 
}: { 
  position: [number, number, number]
  value: number
  maxValue: number
  color: string
  label: string
}) {
  const height = 0.5 + (value / Math.max(maxValue, 1)) * 2
  const baseColor = new THREE.Color(color)
  
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group position={position}>
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry args={[0.3, 0.4, height, 6]} />
          <MeshTransmissionMaterial
            color={baseColor}
            transmission={0.85}
            thickness={0.3}
            roughness={0.1}
            chromaticAberration={0.3}
          />
        </mesh>
        <pointLight color={color} intensity={1} distance={3} position={[0, height, 0]} />
      </group>
    </Float>
  )
}

function ReportesScene({ data }: { 
  data: { ingresos: number, gastos: number, utilidad: number, ventas: number } 
}) {
  const maxValue = Math.max(data.ingresos, data.gastos, data.utilidad, data.ventas, 1)
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 6]} fov={45} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <Environment preset="night" />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        autoRotate 
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
      />
      
      <DataCrystal 
        position={[-2, 0, 0]} 
        value={data.ingresos} 
        maxValue={maxValue} 
        color="#22C55E" 
        label="Ingresos" 
      />
      <DataCrystal 
        position={[-0.7, 0, 0]} 
        value={data.gastos} 
        maxValue={maxValue} 
        color="#EF4444" 
        label="Gastos" 
      />
      <DataCrystal 
        position={[0.7, 0, 0]} 
        value={data.utilidad} 
        maxValue={maxValue} 
        color="#8B5CF6" 
        label="Utilidad" 
      />
      <DataCrystal 
        position={[2, 0, 0]} 
        value={data.ventas} 
        maxValue={maxValue} 
        color="#3B82F6" 
        label="Ventas" 
      />
      
      {/* Base Platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <circleGeometry args={[4, 64]} />
        <meshStandardMaterial 
          color="#1a1a2e" 
          transparent 
          opacity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendUp,
  color = 'violet'
}: {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  color?: 'violet' | 'emerald' | 'red' | 'blue' | 'amber'
}) {
  const colorClasses = {
    violet: 'from-violet-500/20 to-purple-500/10 border-violet-500/20',
    emerald: 'from-emerald-500/20 to-green-500/10 border-emerald-500/20',
    red: 'from-red-500/20 to-rose-500/10 border-red-500/20',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
    amber: 'from-amber-500/20 to-yellow-500/10 border-amber-500/20',
  }
  
  const iconColors = {
    violet: 'text-violet-400',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl p-6',
        colorClasses[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white font-mono">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl bg-white/5',
          iconColors[color]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          {trendUp ? (
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-400" />
          )}
          <span className={cn(
            'text-sm font-medium',
            trendUp ? 'text-emerald-400' : 'text-red-400'
          )}>
            {trend}
          </span>
          <span className="text-xs text-gray-500">vs mes anterior</span>
        </div>
      )}
      
      {/* Decorative glow */}
      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// REPORT TYPE CARD
// ═══════════════════════════════════════════════════════════════

function ReportTypeCard({
  title,
  description,
  icon: Icon,
  onClick,
  color = 'violet'
}: {
  title: string
  description: string
  icon: LucideIcon
  onClick?: () => void
  color?: string
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group relative p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm
                 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 text-left w-full"
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          'p-3 rounded-xl bg-gradient-to-br',
          color === 'violet' && 'from-violet-500/20 to-purple-500/10',
          color === 'emerald' && 'from-emerald-500/20 to-green-500/10',
          color === 'blue' && 'from-blue-500/20 to-cyan-500/10',
          color === 'amber' && 'from-amber-500/20 to-yellow-500/10',
        )}>
          <Icon className={cn(
            'h-6 w-6',
            color === 'violet' && 'text-violet-400',
            color === 'emerald' && 'text-emerald-400',
            color === 'blue' && 'text-blue-400',
            color === 'amber' && 'text-amber-400',
          )} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <Download className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
      </div>
    </motion.button>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ReportesPanelPremium({ bancos, stats, movimientos = [] }: ReportesPanelProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'dia' | 'semana' | 'mes' | 'año'>('mes')
  const [isGenerating, setIsGenerating] = useState(false)

  const defaultStats: ReportesStats = {
    ventasTotales: 0,
    ingresosTotales: 0,
    gastosTotales: 0,
    utilidadNeta: 0,
    ventasMes: 0,
    crecimiento: 0,
  }

  const currentStats = stats || defaultStats

  // Calcular totales de bancos
  const bancosStats = useMemo(() => {
    const totalCapital = bancos.reduce((sum, b) => sum + (b.capitalActual || 0), 0)
    const totalIngresos = bancos.reduce((sum, b) => sum + (b.historicoIngresos || 0), 0)
    const totalGastos = bancos.reduce((sum, b) => sum + (b.historicoGastos || 0), 0)
    return { totalCapital, totalIngresos, totalGastos }
  }, [bancos])

  const sceneData = {
    ingresos: bancosStats.totalIngresos,
    gastos: bancosStats.totalGastos,
    utilidad: currentStats.utilidadNeta,
    ventas: currentStats.ventasTotales,
  }

  const handleGenerateReport = async (tipo: string) => {
    setIsGenerating(true)
    // Simular generación
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsGenerating(false)
    // En producción: llamar a Server Action para generar PDF/Excel
  }

  const periods = [
    { id: 'dia', label: 'Hoy' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
    { id: 'año', label: 'Año' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 
                         bg-clip-text text-transparent">
            Centro de Reportes
          </h1>
          <p className="text-gray-400 mt-1">Analytics y exportación de datos</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedPeriod === period.id
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Visualization */}
      <div className="relative h-[300px] rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-violet-500" />
          </div>
        }>
          <Canvas>
            <ReportesScene data={sceneData} />
          </Canvas>
        </Suspense>
        
        {/* Overlay Labels */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8">
          {[
            { label: 'Ingresos', color: 'emerald' },
            { label: 'Gastos', color: 'red' },
            { label: 'Utilidad', color: 'violet' },
            { label: 'Ventas', color: 'blue' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={cn(
                'h-3 w-3 rounded-full',
                item.color === 'emerald' && 'bg-emerald-500',
                item.color === 'red' && 'bg-red-500',
                item.color === 'violet' && 'bg-violet-500',
                item.color === 'blue' && 'bg-blue-500',
              )} />
              <span className="text-xs text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Capital Total"
          value={formatCurrency(bancosStats.totalCapital)}
          subtitle="En 7 bancos"
          icon={DollarSign}
          trend="+8.5%"
          trendUp={true}
          color="violet"
        />
        <StatCard
          title="Ingresos Históricos"
          value={formatCurrency(bancosStats.totalIngresos)}
          subtitle="Acumulado total"
          icon={TrendingUp}
          trend="+12.3%"
          trendUp={true}
          color="emerald"
        />
        <StatCard
          title="Gastos Históricos"
          value={formatCurrency(bancosStats.totalGastos)}
          subtitle="Acumulado total"
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Utilidad Neta"
          value={formatCurrency(bancosStats.totalIngresos - bancosStats.totalGastos)}
          subtitle="Ingresos - Gastos"
          icon={Sparkles}
          trend="+5.2%"
          trendUp={true}
          color="blue"
        />
      </div>

      {/* Report Types */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-violet-400" />
          Generar Reportes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReportTypeCard
            title="Reporte de Ventas"
            description="Detalle de todas las ventas con distribución GYA"
            icon={BarChart3}
            color="violet"
            onClick={() => handleGenerateReport('ventas')}
          />
          <ReportTypeCard
            title="Estado de Bancos"
            description="Capital actual y movimientos de cada banco"
            icon={DollarSign}
            color="emerald"
            onClick={() => handleGenerateReport('bancos')}
          />
          <ReportTypeCard
            title="Reporte de Clientes"
            description="Historial de compras y saldos pendientes"
            icon={Users}
            color="blue"
            onClick={() => handleGenerateReport('clientes')}
          />
          <ReportTypeCard
            title="Inventario y Almacén"
            description="Stock actual y movimientos de productos"
            icon={Package}
            color="amber"
            onClick={() => handleGenerateReport('almacen')}
          />
        </div>
      </div>

      {/* Banks Summary */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-violet-400" />
          Distribución por Banco
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bancos.map((banco, index) => (
            <motion.div
              key={banco.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${banco.color}20` }}
                >
                  <DollarSign className="h-5 w-5" style={{ color: banco.color }} />
                </div>
                <div>
                  <p className="font-medium text-white">{banco.nombre}</p>
                  <p className="text-xs text-gray-500">{banco.tipo}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Capital</span>
                  <span className="text-white font-mono">{formatCurrency(banco.capitalActual)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min((banco.capitalActual / Math.max(bancosStats.totalCapital, 1)) * 100, 100)}%`,
                      backgroundColor: banco.color 
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4">
              <RefreshCw className="h-8 w-8 text-violet-400 animate-spin" />
              <p className="text-white font-medium">Generando reporte...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ReportesPanelPremium
