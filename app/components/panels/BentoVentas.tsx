'use client'

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { TrendingUp, Plus, DollarSign, Users, Package, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, Sparkles, Target, Zap, BarChart3, PieChart as PieChartIcon, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { useState, useEffect, useMemo, useRef, memo, Suspense } from 'react'
import { useVentasData } from '@/app/lib/firebase/firestore-hooks.service'
import { CreateVentaModalPremium } from '@/app/components/modals/CreateVentaModalPremium'
import { DeleteConfirmModal } from '@/app/components/modals/DeleteConfirmModal'
import { SalesFlowDiagram } from '@/app/components/visualizations/SalesFlowDiagram'
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import dynamic from 'next/dynamic'
import { eliminarVenta } from '@/app/lib/services/unified-data-service'
import { useToast } from '@/app/hooks/use-toast'
import { logger } from '@/app/lib/utils/logger'
import { useAppStore } from '@/app/lib/store/useAppStore'

// 🎨 Componente 3D Premium cargado dinámicamente
const PremiumSplineOrb = dynamic(
  () => import('@/app/components/3d/PremiumSplineOrb').then(mod => mod.PremiumSplineOrb),
  { ssr: false, loading: () => <div className="w-full h-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl animate-pulse" /> },
)

interface VentaData {
  id: string
  precioTotalVenta?: number
  montoPagado?: number
  montoRestante?: number
  estadoPago?: 'completo' | 'parcial' | 'pendiente'
  cliente?: string
  fecha?: string
  producto?: string
  cantidad?: number
  // Distribución GYA
  bovedaMonte?: number
  fleteUtilidad?: number
  utilidad?: number
  distribucion?: {
    bovedaMonte: number
    fletes: number
    utilidades: number
  }
  [key: string]: unknown
}

// ============================================================================
// COMPONENTES DE ANIMACIÓN PREMIUM (Optimizados con memo)
// ============================================================================

const AnimatedCounter = memo(function AnimatedCounter({ value, prefix = '', suffix = '', className = '' }: {
  value: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const duration = 1500
    const startTime = Date.now()
    const startValue = displayValue
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      
      setDisplayValue(startValue + (value - startValue) * eased)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value])
  
  return (
    <span className={className}>
      {prefix}{displayValue.toFixed(value >= 1000 ? 2 : 0)}{suffix}
    </span>
  )
})

const PulsingOrb = memo(function PulsingOrb({ color = 'green' }: { color?: string }) {
  const colorMap: Record<string, string> = useMemo(() => ({
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-violet-500',
    yellow: 'from-yellow-500 to-orange-500',
    cyan: 'from-cyan-500 to-teal-500',
  }), [])
  
  return (
    <motion.div
      className={`absolute -top-3 -right-3 w-6 h-6 rounded-full bg-gradient-to-r ${colorMap[color]} shadow-lg`}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.8, 0.4, 0.8],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <motion.div
        className={`absolute inset-0 rounded-full bg-gradient-to-r ${colorMap[color]} blur-sm`}
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  )
})

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface TooltipPayload {
  value: number
  name: string
  color: string
  dataKey?: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload) return null
  
  const colorNames: Record<string, string> = {
    ventas: 'Total Ventas',
    cobrado: 'Cobrado',
    bovedaMonte: 'Bóveda Monte',
    fletes: 'Flete Sur',
    utilidades: 'Utilidades',
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl p-4 shadow-xl"
    >
      <p className="text-xs text-zinc-400 mb-3 font-medium">{label}</p>
      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-zinc-400">{colorNames[entry.dataKey || entry.name] || entry.name}</span>
            </div>
            <span className="text-sm text-white font-mono font-medium">${(entry.value / 1000).toFixed(1)}K</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default memo(function BentoVentas() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month'>('week')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingVenta, setEditingVenta] = useState<VentaData | null>(null)
  const [deletingVenta, setDeletingVenta] = useState<VentaData | null>(null)
  
  const { toast } = useToast()
  const { triggerDataRefresh } = useAppStore()

  const { data: ventasDataRaw, loading, error } = useVentasData()
  const ventasData = ventasDataRaw as VentaData[]

  // Handlers para editar/eliminar
  const handleEditVenta = (venta: VentaData) => {
    setEditingVenta(venta)
    setIsModalOpen(true)
  }

  const handleDeleteVenta = (venta: VentaData) => {
    setDeletingVenta(venta)
    setShowDeleteModal(true)
  }

  const confirmDeleteVenta = async () => {
    if (!deletingVenta?.id) return
    
    try {
      await eliminarVenta(deletingVenta.id)
      toast({
        title: '✅ Venta eliminada',
        description: 'La venta ha sido eliminada exitosamente',
      })
      triggerDataRefresh()
    } catch (error) {
      logger.error('Error eliminando venta', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar la venta',
        variant: 'destructive',
      })
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingVenta(null)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁLCULOS OPTIMIZADOS CON useMemo - Solo se recalculan cuando cambian ventas
  // ═══════════════════════════════════════════════════════════════════════════
  
  const metrics = useMemo(() => {
    const totalVentas = ventasData.reduce((acc, v) => acc + (v.precioTotalVenta || 0), 0)
    const totalCobrado = ventasData.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
    const totalPendiente = ventasData.reduce((acc, v) => acc + (v.montoRestante || 0), 0)
    const ventasPendientes = ventasData.filter((v) => v.estadoPago === 'pendiente').length
    const ventasCompletas = ventasData.filter((v) => v.estadoPago === 'completo').length
    const ventasParciales = ventasData.filter((v) => v.estadoPago === 'parcial').length
    const promedioVenta = ventasData.length > 0 ? totalVentas / ventasData.length : 0
    const tasaCobro = totalVentas > 0 ? (totalCobrado / totalVentas) * 100 : 0
    
    // Métricas de distribución GYA
    const totalBovedaMonte = ventasData.reduce((acc, v) => 
      acc + (v.distribucion?.bovedaMonte || v.bovedaMonte || 0), 0)
    const totalFletes = ventasData.reduce((acc, v) => 
      acc + (v.distribucion?.fletes || v.fleteUtilidad || 0), 0)
    const totalUtilidades = ventasData.reduce((acc, v) => 
      acc + (v.distribucion?.utilidades || v.utilidad || 0), 0)
    
    return {
      totalVentas,
      totalCobrado,
      totalPendiente,
      ventasPendientes,
      ventasCompletas,
      ventasParciales,
      promedioVenta,
      tasaCobro,
      // GYA
      totalBovedaMonte,
      totalFletes,
      totalUtilidades,
    }
  }, [ventasData])
  
  // Datos agrupados por fecha para gráficos (datos reales)
  const chartData = useMemo(() => {
    // Agrupar ventas por día de la semana
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
    const agrupado: Record<string, { ventas: number, cobrado: number, bovedaMonte: number, fletes: number, utilidades: number }> = {}
    
    diasSemana.forEach(dia => {
      agrupado[dia] = { ventas: 0, cobrado: 0, bovedaMonte: 0, fletes: 0, utilidades: 0 }
    })
    
    ventasData.forEach((venta: VentaData) => {
      if (venta.fecha) {
        // Parsear fecha (formato DD/MM/YYYY o YYYY-MM-DD)
        let date: Date
        if (venta.fecha.includes('/')) {
          const [dia, mes, año] = venta.fecha.split('/')
          date = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia))
        } else {
          date = new Date(venta.fecha)
        }
        
        const diaSemana = diasSemana[date.getDay()]
        if (agrupado[diaSemana]) {
          agrupado[diaSemana].ventas += venta.precioTotalVenta || 0
          agrupado[diaSemana].cobrado += venta.montoPagado || 0
          agrupado[diaSemana].bovedaMonte += venta.distribucion?.bovedaMonte || venta.bovedaMonte || 0
          agrupado[diaSemana].fletes += venta.distribucion?.fletes || venta.fleteUtilidad || 0
          agrupado[diaSemana].utilidades += venta.distribucion?.utilidades || venta.utilidad || 0
        }
      }
    })
    
    // Ordenar por día de semana empezando desde Lunes
    const ordenDias = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
    return ordenDias.map(dia => ({
      name: dia,
      ventas: agrupado[dia].ventas,
      cobrado: agrupado[dia].cobrado,
      bovedaMonte: agrupado[dia].bovedaMonte,
      fletes: agrupado[dia].fletes,
      utilidades: agrupado[dia].utilidades,
    }))
  }, [ventasData])
  
  const pieData = useMemo(() => [
    { name: 'Completas', value: metrics.ventasCompletas, color: '#22c55e' },
    { name: 'Parciales', value: metrics.ventasParciales, color: '#eab308' },
    { name: 'Pendientes', value: metrics.ventasPendientes, color: '#ef4444' },
  ], [metrics.ventasCompletas, metrics.ventasParciales, metrics.ventasPendientes])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-white/10 border-t-green-500 animate-spin" />
          <div className="text-white text-lg">Cargando ventas...</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6 space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4"
        >
          <p className="text-yellow-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl" />
            <TrendingUp className="w-12 h-12 text-green-400 relative" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Ventas
            </h1>
            <p className="text-zinc-400 text-sm">Registro de ventas y gestión de cobros</p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Venta
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-green-500/50 transition-colors">
            <Package className="w-8 h-8 text-green-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">{ventasData.length}</div>
            <p className="text-sm text-zinc-400">Ventas Totales</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors">
            <DollarSign className="w-8 h-8 text-emerald-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">${(metrics.totalVentas / 1000000).toFixed(2)}M</div>
            <p className="text-sm text-zinc-400">Valor Total</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-lime-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-green-500/50 transition-colors">
            <CheckCircle2 className="w-8 h-8 text-lime-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">${(metrics.totalCobrado / 1000000).toFixed(2)}M</div>
            <p className="text-sm text-zinc-400">Cobrado</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-yellow-500/50 transition-colors">
            <Clock className="w-8 h-8 text-yellow-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">${(metrics.totalPendiente / 1000000).toFixed(2)}M</div>
            <p className="text-sm text-zinc-400">Por Cobrar</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-colors">
            <Users className="w-8 h-8 text-cyan-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">{metrics.ventasCompletas}</div>
            <p className="text-sm text-zinc-400">Completas</p>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ORB 3D PREMIUM - INDICADOR VISUAL DE RENDIMIENTO
          ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Orb 3D de Ventas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 hover:border-green-500/30 transition-all h-[200px] flex flex-col items-center justify-center">
            <Suspense fallback={<div className="w-24 h-24 bg-green-500/10 rounded-full animate-pulse" />}>
              <div className="w-full h-32 flex items-center justify-center">
                <PremiumSplineOrb 
                  size={80} 
                  state={metrics.totalVentas > 1000000 ? 'active' : 'idle'}
                  primaryColor="#22c55e"
                  secondaryColor="#10b981"
                  showParticles={true}
                />
              </div>
            </Suspense>
            <div className="text-center mt-2">
              <p className="text-xs text-zinc-400">Performance Score</p>
              <p className="text-lg font-bold text-green-400">
                {Math.round((metrics.totalCobrado / (metrics.totalVentas || 1)) * 100)}%
              </p>
            </div>
          </div>
        </motion.div>

        {/* Distribución GYA Visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl blur-xl" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Distribución GYA</h3>
              <Badge variant="outline" className="ml-2 text-xs border-purple-500/30 text-purple-400">Sistema</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-zinc-400 mb-1">Bóveda Monte</p>
                <p className="text-xl font-bold text-blue-400">${(metrics.totalBovedaMonte / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-blue-400/60">Costo (Compra × Cantidad)</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-zinc-400 mb-1">Fletes</p>
                <p className="text-xl font-bold text-orange-400">${(metrics.totalFletes / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-orange-400/60">Transporte</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-zinc-400 mb-1">Utilidades</p>
                <p className="text-xl font-bold text-green-400">${(metrics.totalUtilidades / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-green-400/60">Ganancia Neta</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECCIÓN DE GRÁFICOS PREMIUM
          ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Ventas vs Cobrado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-2xl blur-2xl" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-green-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-bold text-white">Rendimiento Semanal</h3>
                </div>
                <p className="text-sm text-zinc-400 mt-1">Ventas vs Cobrado</p>
              </div>
              <div className="flex gap-2">
                {(['day', 'week', 'month'] as const).map((range) => (
                  <motion.button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedTimeRange === range
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-zinc-800/50 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {range === 'day' ? 'Día' : range === 'week' ? 'Semana' : 'Mes'}
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCobrado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${(v/1000)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVentas)"
                    name="Ventas"
                  />
                  <Area
                    type="monotone"
                    dataKey="cobrado"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCobrado)"
                    name="Cobrado"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Leyenda personalizada */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-zinc-400">Ventas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-zinc-400">Cobrado</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Gráfico de Distribución GYA (Bóveda Monte, Fletes, Utilidades) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-orange-500/5 rounded-2xl blur-2xl" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Distribución GYA</h3>
              </div>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                Por Día
              </Badge>
            </div>
            
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${(v/1000)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="bovedaMonte" stackId="a" fill="#a855f7" name="Bóveda Monte" />
                  <Bar dataKey="fletes" stackId="a" fill="#f97316" name="Flete Sur" />
                  <Bar dataKey="utilidades" stackId="a" fill="#22c55e" name="Utilidades" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Leyenda GYA */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm text-zinc-400">B. Monte</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-sm text-zinc-400">Flete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-zinc-400">Utilidad</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Gráfico de Distribución de Estados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 rounded-2xl blur-2xl" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 h-full">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Estado de Pagos</h3>
            </div>
            
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Stats debajo del gráfico */}
            <div className="space-y-3 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-zinc-400">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5 hover:border-cyan-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Promedio por Venta</p>
                <div className="text-2xl font-bold text-white">
                  $<AnimatedCounter value={metrics.promedioVenta / 1000} suffix="K" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-cyan-500/10">
                <Target className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5 hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Tasa de Cobro</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">
                    <AnimatedCounter value={metrics.tasaCobro} suffix="%" />
                  </span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +5%
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            {/* Barra de progreso */}
            <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                initial={{ width: 0 }}
                animate={{ width: `${metrics.tasaCobro}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Meta Mensual</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">78%</span>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    En progreso
                  </Badge>
                </div>
              </div>
              <motion.div 
                className="p-3 rounded-xl bg-purple-500/10"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Target className="w-6 h-6 text-purple-400" />
              </motion.div>
            </div>
            {/* Barra de progreso */}
            <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-400"
                initial={{ width: 0 }}
                animate={{ width: '78%' }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tables Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-2xl blur-2xl" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
          <Tabs defaultValue="todas" className="w-full">
            <TabsList className="bg-zinc-800/50 backdrop-blur-xl mb-6">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="pendientes">Pendientes ({metrics.ventasPendientes})</TabsTrigger>
              <TabsTrigger value="completas">Completas ({metrics.ventasCompletas})</TabsTrigger>
            </TabsList>

            <TabsContent value="todas">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">ID</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Fecha</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Cliente</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Cantidad</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Total</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-purple-400" title="Costo recuperado al distribuidor">B. Monte</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-orange-400" title="Ganancia del flete">Flete</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-emerald-400" title="Ganancia neta">Utilidad</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-yellow-400">Pendiente</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasData.map((venta, idx) => (
                      <motion.tr
                        key={venta.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + idx * 0.03 }}
                        whileHover={{ backgroundColor: 'rgba(39, 39, 42, 0.4)' }}
                        className="border-b border-zinc-800/50 transition-colors group/row cursor-pointer"
                      >
                        <td className="py-4 px-4">
                          <div className="font-mono text-sm text-green-400">{venta.id}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-zinc-400">{venta.fecha}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-white group-hover/row:text-green-400 transition-colors">
                            {venta.cliente}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            {venta.cantidad} unidades
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-mono text-white">
                            ${((venta.precioTotalVenta || 0) / 1000).toFixed(0)}K
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-mono text-purple-400" title="Costo recuperado">
                            ${((venta.distribucion?.bovedaMonte || venta.bovedaMonte || 0) / 1000).toFixed(0)}K
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-mono text-orange-400" title="Flete">
                            ${((venta.distribucion?.fletes || venta.fleteUtilidad || 0) / 1000).toFixed(0)}K
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className={`font-mono ${(venta.distribucion?.utilidades || venta.utilidad || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} title="Ganancia neta">
                            ${((venta.distribucion?.utilidades || venta.utilidad || 0) / 1000).toFixed(0)}K
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-mono text-yellow-400">
                            ${((venta.montoRestante || 0) / 1000).toFixed(0)}K
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {venta.estadoPago === 'completo' ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completo
                            </Badge>
                          ) : venta.estadoPago === 'parcial' ? (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Parcial
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendiente
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditVenta(venta)}
                              className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVenta(venta)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Similar tables for pendientes and completas tabs */}
            <TabsContent value="pendientes">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">ID</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Fecha</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Cliente</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Cantidad</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Total</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-purple-400" title="Costo recuperado al distribuidor">B. Monte</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-orange-400" title="Ganancia del flete">Flete</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-emerald-400" title="Ganancia neta">Utilidad</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-yellow-400">Pendiente</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasData
                      .filter((venta: VentaData) => venta.estadoPago === 'pendiente')
                      .map((venta, idx) => (
                        <motion.tr
                          key={venta.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + idx * 0.05 }}
                          className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group/row"
                        >
                          <td className="py-4 px-4">
                            <div className="font-mono text-sm text-green-400">{venta.id}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-zinc-400">{venta.fecha}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-white group-hover/row:text-green-400 transition-colors">
                              {venta.cliente}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            >
                              {venta.cantidad} unidades
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-white">
                              ${((venta.precioTotalVenta || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-purple-400" title="Costo recuperado">
                              ${((venta.distribucion?.bovedaMonte || venta.bovedaMonte || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-orange-400" title="Flete">
                              ${((venta.distribucion?.fletes || venta.fleteUtilidad || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className={`font-mono ${(venta.distribucion?.utilidades || venta.utilidad || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} title="Ganancia neta">
                              ${((venta.distribucion?.utilidades || venta.utilidad || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-yellow-400">
                              ${((venta.montoRestante || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendiente
                            </Badge>
                          </td>
                        </motion.tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="completas">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">ID</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Fecha</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Cliente</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Cantidad</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Total</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-purple-400" title="Costo recuperado al distribuidor">B. Monte</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-orange-400" title="Ganancia del flete">Flete</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-emerald-400" title="Ganancia neta">Utilidad</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-yellow-400">Pendiente</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasData
                      .filter((venta: VentaData) => venta.estadoPago === 'completo')
                      .map((venta, idx) => (
                        <motion.tr
                          key={venta.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + idx * 0.05 }}
                          className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group/row"
                        >
                          <td className="py-4 px-4">
                            <div className="font-mono text-sm text-green-400">{venta.id}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-zinc-400">{venta.fecha}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-white group-hover/row:text-green-400 transition-colors">
                              {venta.cliente}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            >
                              {venta.cantidad} unidades
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-white">
                              ${((venta.precioTotalVenta || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-purple-400" title="Costo recuperado">
                              ${((venta.distribucion?.bovedaMonte || venta.bovedaMonte || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-orange-400" title="Flete">
                              ${((venta.distribucion?.fletes || venta.fleteUtilidad || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className={`font-mono ${(venta.distribucion?.utilidades || venta.utilidad || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} title="Ganancia neta">
                              ${((venta.distribucion?.utilidades || venta.utilidad || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-yellow-400">
                              ${((venta.montoRestante || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completo
                            </Badge>
                          </td>
                        </motion.tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>

      {/* Sales Flow Diagram - Premium Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl blur-2xl" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white">Flujo de Ventas</h3>
            <p className="text-sm text-zinc-400">Visualización de procesos de ventas en tiempo real</p>
          </div>
          <SalesFlowDiagram width={900} height={500} className="w-full" />
        </div>
      </motion.div>

      <CreateVentaModalPremium open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
})
