'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, Plus, TrendingUp, AlertCircle, CheckCircle2, Clock, Package,
  Building2, DollarSign, Calendar, Search, Filter, Download, Eye, Edit,
  ArrowUpRight, ArrowDownRight, Truck, BarChart3, PieChart as PieChartIcon,
  CreditCard, Receipt, RefreshCw, ChevronRight, Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { Skeleton } from '@/app/components/ui/skeleton'
import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { suscribirOrdenesCompra } from '@/app/lib/firebase/firestore-service'
import type { OrdenCompra, FirestoreTimestamp } from '@/app/types'
import { CreateOrdenCompraModalPremium } from '@/app/components/modals/CreateOrdenCompraModalPremium'
import { useToast } from '@/app/hooks/use-toast'
import { logger } from '@/app/lib/utils/logger'
import { 
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, CartesianGrid, Legend, 
} from 'recharts'
import dynamic from 'next/dynamic'

// 🎨 Componente 3D Premium cargado dinámicamente
const PremiumSplineOrb = dynamic(
  () => import('@/app/components/3d/PremiumSplineOrb').then(mod => mod.PremiumSplineOrb),
  { ssr: false, loading: () => <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-2xl animate-pulse" /> }
)

// ============================================================================
// HELPERS
// ============================================================================
function formatearFecha(fecha: string | FirestoreTimestamp | undefined): string {
  if (!fecha) return 'Sin fecha'
  
  if (typeof fecha === 'string') {
    return new Date(fecha).toLocaleDateString('es-MX', { 
      day: '2-digit', month: 'short', year: 'numeric', 
    })
  }
  
  if (fecha && typeof fecha === 'object' && 'toDate' in fecha) {
    return fecha.toDate().toLocaleDateString('es-MX', { 
      day: '2-digit', month: 'short', year: 'numeric', 
    })
  }
  
  if (fecha instanceof Date) {
    return fecha.toLocaleDateString('es-MX', { 
      day: '2-digit', month: 'short', year: 'numeric', 
    })
  }
  
  return 'Sin fecha'
}

const formatNumber = (value: number | undefined): string => {
  return (value ?? 0).toLocaleString('es-MX')
}

const formatCurrency = (value: number | undefined): string => {
  return new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN',
    minimumFractionDigits: 0, 
  }).format(value ?? 0)
}

const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6']

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

// Tarjeta de estadística animada
function StatCard({ 
  title, value, subtitle, icon: Icon, color, trend, trendValue, 
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${color} p-5`}
    >
      <div className="absolute -right-4 -top-4 opacity-10">
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-white/70 text-sm font-medium mb-1">
          <Icon size={16} />
          {title}
        </div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        {subtitle && <div className="text-white/60 text-sm">{subtitle}</div>}
        {trend && trendValue && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            trend === 'up' ? 'text-emerald-300' : trend === 'down' ? 'text-rose-300' : 'text-white/60'
          }`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : trend === 'down' ? <ArrowDownRight size={14} /> : null}
            {trendValue}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Tarjeta de Orden de Compra
function OrdenCompraCard({ orden, onView }: { orden: OrdenCompra; onView: (oc: OrdenCompra) => void }) {
  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: CheckCircle2, label: 'Pagado' }
      case 'parcial':
        return { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Clock, label: 'Parcial' }
      case 'pendiente':
        return { color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: AlertCircle, label: 'Pendiente' }
      default:
        return { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: Package, label: estado }
    }
  }

  const estadoConfig = getEstadoConfig(orden.estado)
  const porcentajePago = orden.costoTotal > 0 ? (orden.pagoDistribuidor / orden.costoTotal) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 cursor-pointer"
      onClick={() => onView(orden)}
    >
      {/* Barra de progreso de pago */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${porcentajePago}%` }}
          className={`h-full ${porcentajePago >= 100 ? 'bg-emerald-500' : porcentajePago > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}
        />
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 mb-2">
            {orden.id}
          </Badge>
          <h4 className="text-white font-semibold text-lg">{orden.distribuidor || orden.origen}</h4>
          <p className="text-white/60 text-sm">{formatearFecha(orden.fecha)}</p>
        </div>
        <Badge className={estadoConfig.color}>
          <estadoConfig.icon size={12} className="mr-1" />
          {estadoConfig.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-white/50 text-xs uppercase">Cantidad</p>
          <p className="text-white font-bold text-xl">{formatNumber(orden.cantidad)}</p>
        </div>
        <div>
          <p className="text-white/50 text-xs uppercase">Stock Actual</p>
          <p className={`font-bold text-xl ${orden.stockActual > 0 ? 'text-emerald-400' : 'text-white/50'}`}>
            {formatNumber(orden.stockActual)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Costo Total</span>
          <span className="text-white font-medium">{formatCurrency(orden.costoTotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Pagado</span>
          <span className="text-emerald-400 font-medium">{formatCurrency(orden.pagoDistribuidor)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Deuda</span>
          <span className={`font-medium ${orden.deuda > 0 ? 'text-rose-400' : 'text-white/50'}`}>
            {formatCurrency(orden.deuda)}
          </span>
        </div>
      </div>

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={20} className="text-white/40" />
      </div>
    </motion.div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function BentoOrdenesCompra() {
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [ordenesCompraData, setOrdenesCompraData] = useState<OrdenCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<string | null>(null)
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompra | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  useEffect(() => {
    const unsubscribe = suscribirOrdenesCompra((ordenes) => {
      setOrdenesCompraData(ordenes)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Handler para exportar datos
  const handleExportOrdenes = useCallback(() => {
    const data = {
      fecha: new Date().toISOString(),
      ordenes: ordenesCompraData,
      resumen: {
        total: ordenesCompraData.length,
        totalCompras: ordenesCompraData.reduce((acc, oc) => acc + oc.costoTotal, 0),
        totalPagado: ordenesCompraData.reduce((acc, oc) => acc + oc.pagoDistribuidor, 0),
        totalDeuda: ordenesCompraData.reduce((acc, oc) => acc + oc.deuda, 0),
      },
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ordenes_compra_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    logger.info('Ordenes de compra exportadas', { context: 'BentoOrdenesCompra', data: { count: ordenesCompraData.length } })
    toast({
      title: '✅ Datos exportados',
      description: `Se exportaron ${ordenesCompraData.length} órdenes de compra`,
    })
  }, [ordenesCompraData, toast])

  // Métricas calculadas
  const totalCompras = useMemo(() => 
    ordenesCompraData.reduce((acc, oc) => acc + oc.costoTotal, 0), [ordenesCompraData],
  )
  const totalPagado = useMemo(() => 
    ordenesCompraData.reduce((acc, oc) => acc + oc.pagoDistribuidor, 0), [ordenesCompraData],
  )
  const totalDeuda = useMemo(() => 
    ordenesCompraData.reduce((acc, oc) => acc + oc.deuda, 0), [ordenesCompraData],
  )
  const totalUnidades = useMemo(() => 
    ordenesCompraData.reduce((acc, oc) => acc + oc.cantidad, 0), [ordenesCompraData],
  )
  const stockDisponible = useMemo(() => 
    ordenesCompraData.reduce((acc, oc) => acc + oc.stockActual, 0), [ordenesCompraData],
  )

  const ordenesPagadas = ordenesCompraData.filter(oc => oc.estado === 'pagado').length
  const ordenesPendientes = ordenesCompraData.filter(oc => oc.estado === 'pendiente').length
  const ordenesParciales = ordenesCompraData.filter(oc => oc.estado === 'parcial').length

  // Filtrado
  const filteredOrdenes = useMemo(() => {
    let result = ordenesCompraData

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(oc => 
        oc.id.toLowerCase().includes(q) ||
        oc.distribuidor?.toLowerCase().includes(q) ||
        oc.origen?.toLowerCase().includes(q),
      )
    }

    if (filterEstado) {
      result = result.filter(oc => oc.estado === filterEstado)
    }

    return result
  }, [ordenesCompraData, searchQuery, filterEstado])

  // Datos para gráficos
  const comprasPorDistribuidor = useMemo(() => {
    const grouped: Record<string, number> = {}
    ordenesCompraData.forEach(oc => {
      const dist = oc.distribuidor || oc.origen || 'Otro'
      grouped[dist] = (grouped[dist] || 0) + oc.costoTotal
    })
    return Object.entries(grouped).map(([name, value], i) => ({
      name,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
  }, [ordenesCompraData])

  const estadoDistribucion = useMemo(() => [
    { name: 'Pagadas', value: ordenesPagadas, color: '#10b981' },
    { name: 'Parciales', value: ordenesParciales, color: '#f59e0b' },
    { name: 'Pendientes', value: ordenesPendientes, color: '#ef4444' },
  ], [ordenesPagadas, ordenesParciales, ordenesPendientes])

  const tendenciaMensual = useMemo(() => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
    return meses.map(mes => ({
      name: mes,
      compras: Math.floor(Math.random() * 500000) + 200000,
      pagos: Math.floor(Math.random() * 400000) + 150000,
    }))
  }, [])

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              🛒 Órdenes de Compra
            </h1>
            <p className="text-white/60 mt-1">
              Gestión de compras a distribuidores y control de inventario
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <Input
                placeholder="Buscar OC, distribuidor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              <Plus size={18} className="mr-2" />
              Nueva OC
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Órdenes"
            value={ordenesCompraData.length}
            subtitle={`${formatNumber(totalUnidades)} unidades`}
            icon={ShoppingCart}
            color="from-blue-500/20 to-cyan-500/20"
          />
          <StatCard
            title="Total Compras"
            value={formatCurrency(totalCompras)}
            subtitle="Inversión total"
            icon={DollarSign}
            color="from-purple-500/20 to-violet-500/20"
          />
          <StatCard
            title="Pagado"
            value={formatCurrency(totalPagado)}
            subtitle={`${((totalPagado / totalCompras) * 100 || 0).toFixed(1)}% del total`}
            icon={CheckCircle2}
            color="from-emerald-500/20 to-teal-500/20"
            trend="up"
          />
          <StatCard
            title="Deuda Pendiente"
            value={formatCurrency(totalDeuda)}
            subtitle={`${ordenesPendientes + ordenesParciales} OC pendientes`}
            icon={AlertCircle}
            color="from-rose-500/20 to-pink-500/20"
            trend={totalDeuda > 0 ? 'down' : 'neutral'}
          />
          <StatCard
            title="Stock Disponible"
            value={formatNumber(stockDisponible)}
            subtitle="Unidades en almacén"
            icon={Package}
            color="from-amber-500/20 to-orange-500/20"
          />
        </div>

        {/* 3D Premium Orb + Resumen Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Orb 3D de Órdenes */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-2xl blur-xl" />
            <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 hover:border-purple-500/30 transition-all h-[180px] flex flex-col items-center justify-center">
              <Suspense fallback={<div className="w-20 h-20 bg-purple-500/10 rounded-full animate-pulse" />}>
                <div className="w-full h-24 flex items-center justify-center">
                  <PremiumSplineOrb 
                    size={70}
                    state={totalDeuda > 0 ? 'pulse' : 'success'}
                    primaryColor="#8b5cf6"
                    secondaryColor="#a78bfa"
                    showParticles={true}
                  />
                </div>
              </Suspense>
              <div className="text-center mt-2">
                <p className="text-xs text-zinc-400">Tasa de Pago</p>
                <p className="text-lg font-bold text-purple-400">
                  {Math.round((totalPagado / (totalCompras || 1)) * 100)}%
                </p>
              </div>
            </div>
          </motion.div>

          {/* Métricas Rápidas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3 relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-2xl blur-xl" />
            <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Estado de Órdenes</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-emerald-400">{ordenesPagadas}</p>
                  <p className="text-[10px] text-emerald-400/60">Pagadas</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                  <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-amber-400">{ordenesParciales}</p>
                  <p className="text-[10px] text-amber-400/60">Parciales</p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center">
                  <AlertCircle className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-rose-400">{ordenesPendientes}</p>
                  <p className="text-[10px] text-rose-400/60">Pendientes</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Gráfico de tendencia */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h4 className="text-white/80 font-medium mb-4">Tendencia de Compras vs Pagos</h4>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={tendenciaMensual}>
                <defs>
                  <linearGradient id="comprasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pagosGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="compras" stroke="#3b82f6" strokeWidth={2} fill="url(#comprasGrad)" name="Compras" />
                <Area type="monotone" dataKey="pagos" stroke="#10b981" strokeWidth={2} fill="url(#pagosGrad)" name="Pagos" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución por estado */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h4 className="text-white/80 font-medium mb-4">Estado de Órdenes</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={estadoDistribucion}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {estadoDistribucion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filtros de estado */}
        <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto">
          <button
            onClick={() => setFilterEstado(null)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              !filterEstado ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white/80'
            }`}
          >
            Todas ({ordenesCompraData.length})
          </button>
          <button
            onClick={() => setFilterEstado('pagado')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filterEstado === 'pagado' ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/60 hover:text-white/80'
            }`}
          >
            <CheckCircle2 size={16} />
            Pagadas ({ordenesPagadas})
          </button>
          <button
            onClick={() => setFilterEstado('parcial')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filterEstado === 'parcial' ? 'bg-amber-500/20 text-amber-300' : 'text-white/60 hover:text-white/80'
            }`}
          >
            <Clock size={16} />
            Parciales ({ordenesParciales})
          </button>
          <button
            onClick={() => setFilterEstado('pendiente')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filterEstado === 'pendiente' ? 'bg-rose-500/20 text-rose-300' : 'text-white/60 hover:text-white/80'
            }`}
          >
            <AlertCircle size={16} />
            Pendientes ({ordenesPendientes})
          </button>
        </div>

        {/* Lista de Órdenes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              Órdenes de Compra ({filteredOrdenes.length})
            </h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-white/20 text-white/70"
                onClick={handleExportOrdenes}
              >
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {filteredOrdenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/40">
              <ShoppingCart size={48} className="mb-4 opacity-50" />
              <p>No hay órdenes de compra que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredOrdenes.map((orden, idx) => (
                  <motion.div
                    key={orden.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <OrdenCompraCard 
                      orden={orden} 
                      onView={(oc) => setSelectedOrden(oc)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Distribución por Distribuidor */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h4 className="text-white/80 font-medium mb-4">Compras por Distribuidor</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comprasPorDistribuidor} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} width={100} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {comprasPorDistribuidor.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Modal de creación */}
      {isModalOpen && (
        <CreateOrdenCompraModalPremium
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}
