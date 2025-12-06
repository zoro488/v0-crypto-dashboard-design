'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PREMIUM VENTAS PANEL
// Panel de ventas con visualización 3D, glassmorphism y efectos
// ═══════════════════════════════════════════════════════════════

import { Suspense, useState, useMemo, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { 
  PerspectiveCamera, 
  Environment, 
  Float,
  MeshTransmissionMaterial,
  Text,
} from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  DollarSign,
  Package,
  User,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/app/_lib/utils'
import { formatCurrency, formatDate } from '@/app/_lib/utils/formatters'
import type { Venta, Banco } from '@/database/schema'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════
// 3D COMPONENTS
// ═══════════════════════════════════════════════════════════════

function VentasOrb({ value, maxValue, color }: { 
  value: number
  maxValue: number
  color: string
}) {
  const scale = 0.3 + (value / maxValue) * 0.7
  const baseColor = new THREE.Color(color)
  
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshTransmissionMaterial
          color={baseColor}
          transmission={0.9}
          thickness={0.5}
          roughness={0.1}
          chromaticAberration={0.5}
          anisotropy={0.5}
          distortion={0.2}
          temporalDistortion={0.1}
        />
      </mesh>
      <pointLight color={color} intensity={2} distance={3} />
    </Float>
  )
}

function StatsScene({ stats }: { 
  stats: { total: number, pagado: number, pendiente: number } 
}) {
  const maxValue = Math.max(stats.total, stats.pagado, stats.pendiente, 1)
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <Environment preset="city" />
      
      <group position={[-2, 0, 0]}>
        <VentasOrb value={stats.total} maxValue={maxValue} color="#8B00FF" />
      </group>
      <group position={[0, 0, 0]}>
        <VentasOrb value={stats.pagado} maxValue={maxValue} color="#22C55E" />
      </group>
      <group position={[2, 0, 0]}>
        <VentasOrb value={stats.pendiente} maxValue={maxValue} color="#FFD700" />
      </group>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// STATS CARD COMPONENT
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
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "relative group overflow-hidden rounded-2xl p-6",
        "bg-gradient-to-br backdrop-blur-xl",
        "border border-white/10 hover:border-white/20",
        "transition-all duration-300",
        gradient
      )}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      </div>
      
      {/* Content */}
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
      
      {/* Decorative orb */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 blur-2xl" />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VENTAS TABLE
// ═══════════════════════════════════════════════════════════════

const estadoConfig = {
  completo: { 
    label: 'Completado', 
    icon: CheckCircle2, 
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    gradient: 'from-green-500/20 to-emerald-500/10',
  },
  pendiente: { 
    label: 'Pendiente', 
    icon: Clock, 
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    gradient: 'from-yellow-500/20 to-amber-500/10',
  },
  parcial: { 
    label: 'Parcial', 
    icon: AlertCircle, 
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    gradient: 'from-orange-500/20 to-amber-500/10',
  },
}

interface VentaRowProps {
  venta: Venta
  index: number
  onView: (id: string) => void
}

function VentaRow({ venta, index, onView }: VentaRowProps) {
  const estado = estadoConfig[venta.estadoPago as keyof typeof estadoConfig] || estadoConfig.pendiente
  const EstadoIcon = estado.icon
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, x: 4 }}
      onClick={() => onView(venta.id)}
      className={cn(
        "group relative p-4 rounded-xl cursor-pointer",
        "bg-white/5 hover:bg-white/10",
        "border border-white/5 hover:border-violet-500/30",
        "transition-all duration-200"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Index/Icon */}
        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
          <Package className="h-5 w-5 text-violet-400" />
        </div>
        
        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white truncate">
              {venta.observaciones || `Venta #${venta.id.slice(-6)}`}
            </span>
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs",
              estado.bg
            )}>
              <EstadoIcon className={cn("h-3 w-3", estado.color)} />
              <span className={estado.color}>{estado.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {venta.clienteId?.slice(-8) || 'Sin cliente'}
            </span>
            <span>•</span>
            <span>{venta.cantidad} unidades</span>
            <span>•</span>
            <span>{formatDate(new Date(venta.fecha))}</span>
          </div>
        </div>
        
        {/* Amount */}
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-white">
            {formatCurrency(venta.precioTotalVenta)}
          </p>
          <p className={cn(
            "text-xs",
            venta.estadoPago === 'completo' ? 'text-green-400' : 'text-yellow-400'
          )}>
            Pagado: {formatCurrency(venta.montoPagado ?? 0)}
          </p>
        </div>
        
        {/* View button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-lg bg-white/5 hover:bg-violet-500/20 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Eye className="h-4 w-4 text-gray-400" />
        </motion.button>
      </div>
      
      {/* Progress bar for partial payments */}
      {venta.estadoPago === 'parcial' && (
        <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((venta.montoPagado ?? 0) / venta.precioTotalVenta) * 100}%` }}
            transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
          />
        </div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface VentasPanelPremiumProps {
  ventas: Venta[]
  bancos: Banco[]
  onNewVenta?: () => void
  onViewVenta?: (id: string) => void
}

export function VentasPanelPremium({ 
  ventas, 
  bancos, 
  onNewVenta,
  onViewVenta,
}: VentasPanelPremiumProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<string | null>(null)
  
  // Calculate stats
  const stats = useMemo(() => {
    const total = ventas.reduce((sum, v) => sum + v.precioTotalVenta, 0)
    const pagado = ventas.reduce((sum, v) => sum + (v.montoPagado ?? 0), 0)
    const pendiente = total - pagado
    const count = ventas.length
    const completas = ventas.filter(v => v.estadoPago === 'completo').length
    
    return { 
      total, 
      pagado, 
      pendiente, 
      count,
      completas,
      tasa: count > 0 ? (completas / count) * 100 : 0,
    }
  }, [ventas])
  
  // Filter ventas
  const filteredVentas = useMemo(() => {
    return ventas.filter(venta => {
      const matchesSearch = 
        venta.observaciones?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venta.clienteId?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesEstado = !filterEstado || venta.estadoPago === filterEstado
      return matchesSearch && matchesEstado
    })
  }, [ventas, searchQuery, filterEstado])

  const handleView = useCallback((id: string) => {
    onViewVenta?.(id)
  }, [onViewVenta])

  return (
    <div className="min-h-screen bg-black p-6 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ventas
            </h1>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/20 border border-violet-500/30">
              <Sparkles className="h-3 w-3 text-violet-400" />
              <span className="text-xs text-violet-300">Premium</span>
            </div>
          </div>
          <p className="text-gray-400">
            Gestiona tus ventas, facturación y cobros
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewVenta}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl",
            "bg-gradient-to-r from-violet-600 to-purple-600",
            "hover:from-violet-500 hover:to-purple-500",
            "text-white font-medium",
            "shadow-lg shadow-violet-500/25",
            "transition-all duration-200"
          )}
        >
          <Plus className="h-5 w-5" />
          Nueva Venta
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Ventas"
          value={formatCurrency(stats.total)}
          subtitle={`${stats.count} ventas registradas`}
          icon={DollarSign}
          trend={12.5}
          gradient="from-violet-500/20 to-purple-500/10"
          delay={0}
        />
        <StatsCard
          title="Monto Cobrado"
          value={formatCurrency(stats.pagado)}
          subtitle="Cobros completados"
          icon={CheckCircle2}
          trend={8.3}
          gradient="from-green-500/20 to-emerald-500/10"
          delay={0.1}
        />
        <StatsCard
          title="Por Cobrar"
          value={formatCurrency(stats.pendiente)}
          subtitle="Pendiente de pago"
          icon={Clock}
          trend={-3.2}
          gradient="from-yellow-500/20 to-amber-500/10"
          delay={0.2}
        />
        <StatsCard
          title="Tasa de Cobro"
          value={`${stats.tasa.toFixed(1)}%`}
          subtitle={`${stats.completas} de ${stats.count} completadas`}
          icon={TrendingUp}
          trend={5.1}
          gradient="from-cyan-500/20 to-blue-500/10"
          delay={0.3}
        />
      </div>

      {/* 3D Visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20"
      >
        <Canvas>
          <Suspense fallback={null}>
            <StatsScene stats={stats} />
          </Suspense>
        </Canvas>
        
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-gray-400">
          <span>Total: {formatCurrency(stats.total)}</span>
          <span>Pagado: {formatCurrency(stats.pagado)}</span>
          <span>Pendiente: {formatCurrency(stats.pendiente)}</span>
        </div>
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ventas..."
            className={cn(
              "w-full pl-12 pr-4 py-3 rounded-xl",
              "bg-white/5 border border-white/10",
              "text-white placeholder-gray-400",
              "focus:outline-none focus:border-violet-500/50",
              "transition-colors"
            )}
          />
        </div>
        
        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          {(['completo', 'parcial', 'pendiente'] as const).map((estado) => (
            <motion.button
              key={estado}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterEstado(filterEstado === estado ? null : estado)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl",
                "border transition-all duration-200",
                filterEstado === estado
                  ? `${estadoConfig[estado].bg} ${estadoConfig[estado].color}`
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
              )}
            >
              {estadoConfig[estado].label}
            </motion.button>
          ))}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 transition-colors"
          >
            <Filter className="h-5 w-5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 transition-colors"
          >
            <Download className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Ventas List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {filteredVentas.length > 0 ? (
            filteredVentas.map((venta, index) => (
              <VentaRow 
                key={venta.id} 
                venta={venta} 
                index={index} 
                onView={handleView}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No se encontraron ventas
              </h3>
              <p className="text-gray-500">
                {searchQuery || filterEstado 
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Comienza registrando tu primera venta'
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default VentasPanelPremium
