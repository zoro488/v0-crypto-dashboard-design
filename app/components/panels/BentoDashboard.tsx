'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { TrendingUp, DollarSign, Package, ShoppingCart, Zap, PieChart, Filter, Users, Activity, ArrowUpRight, ArrowDownRight, Sparkles, Clock, Bell } from 'lucide-react'
// InteractiveMetricsOrb eliminado - causaba problemas de layout y scroll excesivo
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts'
import { SafeChartContainer, SAFE_ANIMATION_PROPS, SAFE_PIE_PROPS } from '@/app/components/ui/SafeChartContainer'
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useVentas, useOrdenesCompra, useProductos, useClientes, useBancosData } from '@/app/lib/firebase/firestore-hooks.service'
import { Skeleton } from '@/app/components/ui/skeleton'
import { CreateOrdenCompraModalPremium } from '@/app/components/modals/CreateOrdenCompraModalPremium'
import { CreateVentaModalPremium } from '@/app/components/modals/CreateVentaModalPremium'
import { CreateTransferenciaModalPremium } from '@/app/components/modals/CreateTransferenciaModalPremium'
import { QuickStatWidget, QuickStatsGrid } from '@/app/components/widgets/QuickStatWidget'
import { ActivityFeedWidget, ActivityItem } from '@/app/components/widgets/ActivityFeedWidget'
import { MiniChartWidget } from '@/app/components/widgets/MiniChartWidget'
import { PremiumSplineOrb } from '@/app/components/3d/PremiumSplineOrb'

// Interfaces para tipado
interface VentaData {
  id?: string
  montoTotal?: number
  precioVenta?: number
  cantidad?: number
  ganancia?: number
  fecha?: { seconds: number } | Date | string
  [key: string]: unknown
}

interface OrdenCompraData {
  id?: string
  estado?: string
  [key: string]: unknown
}

interface ProductoData {
  id?: string
  stock?: number
  [key: string]: unknown
}

interface TooltipPayloadEntry {
  color: string
  value: number
  name: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}

const CustomTooltip = memo(function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
        <p className="text-white/70 text-sm mb-2 font-medium tracking-wide uppercase">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-white font-bold font-mono">${entry.value.toLocaleString()}</span>
            <span className="text-white/50 text-xs uppercase">{entry.name}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
})

export default memo(function BentoDashboard() {
  // 📦 Usar hook de bancos que lee de localStorage/Firebase
  const { data: bancosData, loading: loadingBancos } = useBancosData()
  const { data: ventasRaw, loading: loadingVentas } = useVentas()
  const { data: ordenesCompraRaw, loading: loadingOC } = useOrdenesCompra()
  const { data: productosRaw, loading: loadingProductos } = useProductos()

  // Transformar datos de bancos
  const bancos = useMemo(() => {
    return (bancosData || []).map((b: Record<string, unknown>) => ({
      id: (b.id as string) || '',
      nombre: (b.nombre as string) || 'Sin nombre',
      saldo: typeof b.saldo === 'number' ? b.saldo : (typeof b.capitalActual === 'number' ? b.capitalActual : 0),
      capitalActual: typeof b.capitalActual === 'number' ? b.capitalActual : 0,
      historicoIngresos: typeof b.historicoIngresos === 'number' ? b.historicoIngresos : 0,
      historicoGastos: typeof b.historicoGastos === 'number' ? b.historicoGastos : 0,
    }))
  }, [bancosData])

  // Casting seguro
  const ventas = ventasRaw as VentaData[] | undefined
  const ordenesCompra = ordenesCompraRaw as OrdenCompraData[] | undefined
  const productos = productosRaw as ProductoData[] | undefined

  const [mounted, setMounted] = useState(false)
  const [showChronos, setShowChronos] = useState(true)
  const [timeRange, setTimeRange] = useState('1M')

  const [isOrdenModalOpen, setIsOrdenModalOpen] = useState(false)
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false)
  const [isTransferenciaModalOpen, setIsTransferenciaModalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      setShowChronos(false)
    }, 3500)
    return () => clearTimeout(timer)
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁLCULOS OPTIMIZADOS CON useMemo - Solo se recalculan cuando cambian datos
  // ═══════════════════════════════════════════════════════════════════════════
  
  const metrics = useMemo(() => {
    const capitalTotal = bancos?.reduce((acc, b) => acc + (b?.saldo || 0), 0) || 0
    const ventasMes = ventas?.reduce((acc, v) => acc + (v?.montoTotal ?? 0), 0) ?? 0
    const stockActual = productos?.reduce((acc, p) => acc + (p?.stock ?? 0), 0) ?? 0
    const ordenesActivas = ordenesCompra?.filter((oc) => oc?.estado === 'pendiente')?.length ?? 0
    
    return { capitalTotal, ventasMes, stockActual, ordenesActivas }
  }, [bancos, ventas, productos, ordenesCompra])

  // Helper para formatear fecha de Firestore
  const formatVentaDate = (fecha: VentaData['fecha']): string => {
    if (!fecha) return 'N/A'
    if (typeof fecha === 'object' && 'seconds' in fecha) {
      return new Date(fecha.seconds * 1000).toLocaleDateString('es-MX', { month: 'short' })
    }
    if (fecha instanceof Date) {
      return fecha.toLocaleDateString('es-MX', { month: 'short' })
    }
    return new Date(fecha).toLocaleDateString('es-MX', { month: 'short' })
  }

  const mockChartData = useMemo(() => 
    ventas?.slice(-7).map((v) => ({
      name: formatVentaDate(v?.fecha),
      value: v?.montoTotal ?? 0,
      sales: (v?.precioVenta ?? 0) * (v?.cantidad ?? 0),
      profit: v?.ganancia ?? 0,
    })) ?? []
  , [ventas])

  const radarData = useMemo(() => [
    { subject: 'Ventas', A: 120, fullMark: 150 },
    { subject: 'Compras', A: 98, fullMark: 150 },
    { subject: 'Stock', A: 86, fullMark: 150 },
    { subject: 'Distribución', A: 99, fullMark: 150 },
    { subject: 'Profit', A: 85, fullMark: 150 },
    { subject: 'Clientes', A: 65, fullMark: 150 },
  ], [])

  const stats = useMemo(() => [
    {
      title: 'Capital Total',
      value: `$${metrics.capitalTotal.toLocaleString()}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-blue-500 via-cyan-400 to-teal-400',
    },
    {
      title: 'Ventas del Mes',
      value: `$${metrics.ventasMes.toLocaleString()}`,
      change: '+8.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-emerald-500 via-green-400 to-lime-400',
    },
    {
      title: 'Stock Actual',
      value: metrics.stockActual.toString(),
      change: '-3.2%',
      trend: 'down',
      icon: Package,
      color: 'from-violet-500 via-purple-400 to-fuchsia-400',
    },
    {
      title: 'Órdenes Activas',
      value: metrics.ordenesActivas.toString(),
      change: '+15.8%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'from-amber-500 via-orange-400 to-red-400',
    },
  ], [metrics])

  if (loadingVentas || loadingOC || loadingProductos) {
    return (
      <div className="bento-container min-h-screen">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Skeleton className="h-32 w-full rounded-3xl" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-6 p-6 relative min-h-screen">
      <AnimatePresence mode="wait">
        {showChronos && (
          <motion.div
            key="chronos-intro"
            initial={{ opacity: 0, height: 500 }}
            animate={{ opacity: 1, height: 500 }}
            exit={{
              opacity: 0,
              height: 0,
              transition: { duration: 1, ease: [0.83, 0, 0.17, 1] },
            }}
            className="col-span-12 relative z-50 mb-8 overflow-hidden"
          >
            <div className="relative h-full rounded-[48px] overflow-hidden apple-glass-strong">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />

              <div className="relative h-full flex flex-col items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center"
                >
                  <motion.h1
                    className="text-display-xl text-white mb-4"
                    style={{
                      textShadow: '0 0 60px rgba(10, 132, 255, 0.3)',
                    }}
                  >
                    CHRONOS
                  </motion.h1>

                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-px w-96 mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="text-caption text-white/50 mt-6 tracking-widest uppercase"
                  >
                    Sistema de Gestión Inteligente
                  </motion.p>
                </motion.div>

                <motion.div
                  className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                />
                <motion.div
                  className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, delay: 2 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {stats.map((stat, index) => (
        <motion.div
          layout
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: showChronos ? 0 : index * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="col-span-12 sm:col-span-6 lg:col-span-3"
        >
          <motion.div 
            className="apple-card h-full group cursor-pointer relative overflow-hidden"
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Animated background glow */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${stat.color.includes('blue') ? 'rgba(59, 130, 246, 0.1)' : stat.color.includes('emerald') ? 'rgba(16, 185, 129, 0.1)' : stat.color.includes('purple') ? 'rgba(168, 85, 247, 0.1)' : 'rgba(249, 115, 22, 0.1)'}, transparent 70%)`,
              }}
            />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <motion.div 
                  className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </motion.div>
                <motion.div
                  className={`
                  px-3 py-1 rounded-full text-xs font-semibold
                  ${stat.trend === 'up' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}
                `}
                  whileHover={{ scale: 1.05 }}
                >
                  {stat.change}
                </motion.div>
              </div>

              <p className="text-caption text-white/50 mb-2 group-hover:text-white/70 transition-colors duration-300">{stat.title}</p>
              <h3 className="text-title text-white font-bold tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        </motion.div>
      ))}

      <motion.div 
        layout 
        className="col-span-12 lg:col-span-8 row-span-2 h-[500px] apple-card relative overflow-hidden group"
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h3 className="text-title text-white mb-1 font-bold tracking-tight">Análisis de Flujo</h3>
            <p className="text-caption text-white/40">Monitoreo financiero en tiempo real</p>
          </div>

          <div className="flex gap-1 p-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
            {['1D', '1W', '1M', '1Y'].map((range) => (
              <motion.button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`
                  px-5 py-2 rounded-lg text-caption font-semibold transition-all duration-300
                  ${
                    timeRange === range
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {range}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="h-[400px] w-full relative z-10" style={{ minWidth: 300, minHeight: 300 }}>
          <SafeChartContainer height={400} minHeight={300}>
            <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis
                stroke="#ffffff40"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dx={-10}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorValue)"
                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                {...SAFE_ANIMATION_PROPS}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#colorProfit)"
                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                {...SAFE_ANIMATION_PROPS}
              />
            </AreaChart>
          </SafeChartContainer>
        </div>
      </motion.div>

      {/* Bancos Grid - Medium */}
      <motion.div
        layout
        className="col-span-12 lg:col-span-4 row-span-1 apple-card p-6 rounded-[32px] border border-white/5 relative overflow-hidden group"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Bancos</h3>
            <p className="text-xs text-white/40 mt-1">Saldos actualizados</p>
          </div>
          <motion.button 
            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 border border-white/5 hover:border-white/20"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <Filter className="w-4 h-4 text-white/60" />
          </motion.button>
        </div>
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
          {bancos?.slice(0, 5).map((banco, index) => (
            <motion.div
              key={banco.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${banco.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}
                >
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium tracking-wide">{banco.nombre}</p>
                  <p className="text-white/40 text-xs font-mono mt-0.5">**** {banco.id.slice(-4)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold tracking-tight">${banco.saldo.toLocaleString()}</p>
                <div className="flex items-center justify-end gap-1 text-emerald-400 text-xs mt-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span>2.4%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Performance Radar - Medium */}
      <motion.div
        layout
        className="col-span-12 md:col-span-6 lg:col-span-4 row-span-1 apple-card p-6 rounded-[32px] border border-white/5 relative overflow-hidden group"
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Performance</h3>
              <p className="text-white/40 text-xs mt-1">Métricas clave de rendimiento</p>
            </div>
            <motion.div 
              className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20"
              whileHover={{ scale: 1.1, rotate: 180 }}
              transition={{ duration: 0.5 }}
            >
              <Zap className="w-5 h-5 text-purple-400" />
            </motion.div>
          </div>

          <div className="h-[200px] w-full relative flex items-center justify-center">
            <p className="text-white/40 text-sm">RadarChart temporarily disabled - Recharts React 19 compatibility</p>
          </div>
        </div>
      </motion.div>

      {/* Sales Distribution - Medium */}
      <motion.div
        layout
        className="col-span-12 md:col-span-6 lg:col-span-4 row-span-1 apple-card p-6 rounded-[32px] border border-white/5 relative overflow-hidden group"
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Distribución</h3>
              <p className="text-white/40 text-xs mt-1">Ventas vs Stock</p>
            </div>
            <motion.div 
              className="p-2 bg-pink-500/10 rounded-xl border border-pink-500/20"
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <PieChart className="w-5 h-5 text-pink-400" />
            </motion.div>
          </div>

          <div className="h-[200px] w-full">
            <SafeChartContainer height={200} minHeight={150}>
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="sales" name="Ventas" fill="#ec4899" radius={[8, 8, 0, 0]} stackId="a" {...SAFE_ANIMATION_PROPS} />
                <Bar dataKey="profit" name="Profit" fill="#3b82f6" radius={[8, 8, 0, 0]} stackId="a" {...SAFE_ANIMATION_PROPS} />
              </BarChart>
            </SafeChartContainer>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions - Floating Bar Style */}
      <motion.div
        layout
        className="col-span-12 mt-4 apple-card p-4 rounded-[24px] border border-white/5 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4 px-4">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
          <span className="text-white/60 text-sm font-mono">
            SISTEMA OPERATIVO: <span className="text-white">ONLINE</span>
          </span>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOrdenModalOpen(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all bg-gradient-to-r from-blue-600 to-cyan-500 hover:shadow-blue-500/25"
          >
            Nueva Orden
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsVentaModalOpen(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all bg-white/5 hover:bg-white/10 border border-white/5"
          >
            Registrar Venta
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsTransferenciaModalOpen(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all bg-white/5 hover:bg-white/10 border border-white/5"
          >
            Transferencia
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => useAppStore.getState().setCurrentPanel('reportes')}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all bg-white/5 hover:bg-white/10 border border-white/5"
          >
            Reporte Rápido
          </motion.button>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SECCIÓN PREMIUM: WIDGETS ADICIONALES */}
      {/* ============================================================ */}
      
      {/* Fila de Mini Charts - 3 columnas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="col-span-12 lg:col-span-4"
      >
        <MiniChartWidget
          title="Tendencia Semanal"
          subtitle="Últimos 7 días"
          type="area"
          color="blue"
          data={[
            { name: 'L', value: 45000 },
            { name: 'M', value: 52000 },
            { name: 'X', value: 48000 },
            { name: 'J', value: 61000 },
            { name: 'V', value: 58000 },
            { name: 'S', value: 72000 },
            { name: 'D', value: 65000 },
          ]}
          height={140}
          delay={0.5}
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="col-span-12 lg:col-span-4"
      >
        <MiniChartWidget
          title="Distribución de Capital"
          subtitle="Por cuenta"
          type="donut"
          color="purple"
          showLegend
          data={bancos?.slice(0, 4).map((b, i) => ({
            name: b.nombre,
            value: b.saldo,
            color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][i],
          })) || []}
          height={140}
          delay={0.6}
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="col-span-12 lg:col-span-4"
      >
        <MiniChartWidget
          title="Comparativa Mensual"
          subtitle="Ventas vs Compras"
          type="bar"
          color="green"
          data={[
            { name: 'Ene', value: 180000, value2: 120000 },
            { name: 'Feb', value: 220000, value2: 150000 },
            { name: 'Mar', value: 195000, value2: 140000 },
            { name: 'Abr', value: 280000, value2: 180000 },
          ]}
          height={140}
          delay={0.7}
        />
      </motion.div>

      {/* Fila: Premium 3D Orb + Activity Feed */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="col-span-12 lg:col-span-4 apple-card p-6 rounded-[32px] border border-white/5 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group"
      >
        {/* Fondo animado */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"
          animate={{
            background: [
              'radial-gradient(circle at 30% 30%, rgba(59,130,246,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 70% 70%, rgba(139,92,246,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 70%, rgba(236,72,153,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 30%, rgba(59,130,246,0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        
        <div className="relative z-10">
          <PremiumSplineOrb
            state="idle"
            size={120}
            glowIntensity={1.2}
            showParticles
            showRings
            interactive
            label="AI Status"
            value="Online"
          />
        </div>
        
        {/* Indicadores de estado */}
        <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-4">
          {[
            { label: 'Precisión', value: '98.5%', color: 'text-emerald-400' },
            { label: 'Consultas', value: '247', color: 'text-cyan-400' },
            { label: 'Latencia', value: '42ms', color: 'text-purple-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.1 }}
              className="text-center"
            >
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-white/40">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="col-span-12 lg:col-span-8"
      >
        <ActivityFeedWidget
          title="Actividad en Tiempo Real"
          maxItems={6}
          activities={[
            { id: '1', type: 'venta', title: 'Venta #1234', description: 'Cliente: Bódega Valle', amount: 45000, timestamp: new Date(Date.now() - 5 * 60000), status: 'success' },
            { id: '2', type: 'compra', title: 'OC-456 recibida', description: 'Proveedor: DistMex', amount: -23000, timestamp: new Date(Date.now() - 15 * 60000), status: 'success' },
            { id: '3', type: 'transferencia', title: 'Transferencia Interna', description: 'Monte → Azteca', amount: 50000, timestamp: new Date(Date.now() - 60 * 60000), status: 'success' },
            { id: '4', type: 'stock', title: 'Stock Actualizado', description: 'Producto Premium Box (+50 unidades)', timestamp: new Date(Date.now() - 2 * 60 * 60000), status: 'success' },
            { id: '5', type: 'cliente', title: 'Nuevo Cliente', description: 'Super Express registrado', timestamp: new Date(Date.now() - 3 * 60 * 60000), status: 'success' },
            { id: '6', type: 'alerta', title: 'Stock Bajo', description: 'Producto A por debajo del mínimo', timestamp: new Date(Date.now() - 4 * 60 * 60000), status: 'pending' },
          ]}
        />
      </motion.div>

      {/* Fila de Quick Stats Adicionales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="col-span-12"
      >
        <QuickStatsGrid
          columns={5}
          stats={[
            { title: 'Clientes Activos', value: 156, icon: Users, color: 'cyan', change: 12, changeLabel: 'vs mes anterior', sparklineData: [120, 135, 142, 138, 150, 156] },
            { title: 'Ticket Promedio', value: 45200, prefix: '$', icon: DollarSign, color: 'green', change: 8.3, changeLabel: 'vs mes anterior', sparklineData: [38000, 40000, 42000, 44000, 45200] },
            { title: 'Productos Activos', value: 847, icon: Package, color: 'purple', change: -2.1, changeLabel: '5 descontinuados', sparklineData: [860, 855, 850, 848, 847] },
            { title: 'Días Sin Incidentes', value: 23, suffix: ' días', icon: Activity, color: 'orange', change: 15, sparklineData: [15, 17, 19, 21, 23] },
            { title: 'Eficiencia', value: '94.5%', icon: Zap, color: 'pink', change: 3.2, changeLabel: 'mejora continua', sparklineData: [88, 90, 91, 93, 94.5] },
          ]}
        />
      </motion.div>

      {/* Nota: InteractiveMetricsOrb eliminado para mejorar layout - el PremiumSplineOrb compacto cumple función similar */}

      <CreateOrdenCompraModalPremium open={isOrdenModalOpen} onClose={() => setIsOrdenModalOpen(false)} />
      <CreateVentaModalPremium open={isVentaModalOpen} onClose={() => setIsVentaModalOpen(false)} />
      <CreateTransferenciaModalPremium open={isTransferenciaModalOpen} onClose={() => setIsTransferenciaModalOpen(false)} />
    </div>
  )
})
