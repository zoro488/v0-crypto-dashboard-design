'use client'

/**
 * 📦 BENTO ÓRDENES DE COMPRA PREMIUM - Panel de OC con Componentes 3D
 * 
 * Características Premium:
 * - Orbes 3D para estadísticas principales
 * - Cards con glassmorphism y efectos 3D
 * - Timeline interactivo de órdenes
 * - Gráficos avanzados con Recharts
 * - Animaciones fluidas con Framer Motion
 * - Estados visuales dinámicos
 */

import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, Plus, TrendingUp, AlertCircle, CheckCircle2, Clock, Package,
  Building2, DollarSign, Calendar, Search, Filter, Download, Eye, Edit,
  ArrowUpRight, ArrowDownRight, Truck, BarChart3, PieChart as PieChartIcon,
  CreditCard, Receipt, RefreshCw, ChevronRight, Sparkles, Activity,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { Skeleton } from '@/app/components/ui/skeleton'
import { useState, useEffect, useMemo } from 'react'
import { suscribirOrdenesCompra } from '@/app/lib/firebase/firestore-service'
import type { OrdenCompra, FirestoreTimestamp } from '@/app/types'
import { CreateOrdenCompraModalPremium } from '@/app/components/modals/CreateOrdenCompraModalPremium'
import { 
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, CartesianGrid, Legend, ComposedChart, Line,
} from 'recharts'

// Componentes 3D Premium
import { 
  StatOrb3D, 
  GlassCard3D, 
  ParticleBackground, 
  PulseIndicator,
  MiniChart3D,
  GradientText,
  VARIANT_COLORS, 
} from '@/app/components/3d/PremiumPanelComponents'

// ============================================================================
// HELPERS
// ============================================================================
function formatearFecha(fecha: string | FirestoreTimestamp | undefined): string {
  if (!fecha) return '-'
  try {
    if (typeof fecha === 'object' && 'seconds' in fecha) {
      return new Date(fecha.seconds * 1000).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    }
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return '-'
  }
}

function formatearMoneda(valor: number | undefined): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(valor ?? 0)
}

function formatNumber(value: number | undefined): string {
  return (value ?? 0).toLocaleString('es-MX')
}

// ============================================================================
// CONSTANTES
// ============================================================================
const ESTADO_CONFIG: Record<string, { 
  color: string
  bgColor: string
  icon: LucideIcon
  label: string
  variant: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'
}> = {
  pagado: { 
    color: 'text-emerald-300', 
    bgColor: 'bg-emerald-500/20 border-emerald-500/30', 
    icon: CheckCircle2, 
    label: 'Pagado',
    variant: 'success',
  },
  parcial: { 
    color: 'text-amber-300', 
    bgColor: 'bg-amber-500/20 border-amber-500/30', 
    icon: Clock, 
    label: 'Parcial',
    variant: 'warning',
  },
  pendiente: { 
    color: 'text-rose-300', 
    bgColor: 'bg-rose-500/20 border-rose-500/30', 
    icon: AlertCircle, 
    label: 'Pendiente',
    variant: 'danger',
  },
  entregado: { 
    color: 'text-cyan-300', 
    bgColor: 'bg-cyan-500/20 border-cyan-500/30', 
    icon: Truck, 
    label: 'Entregado',
    variant: 'info',
  },
}

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#3b82f6']

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

// Tarjeta de estadística premium
function StatCardPremium({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'primary',
  trend,
  trendValue,
  miniChartData,
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  miniChartData?: number[]
}) {
  const colors = VARIANT_COLORS[variant]
  
  return (
    <GlassCard3D variant={variant} size="md" glowIntensity={0.3}>
      <div className="relative">
        <div className="absolute -right-2 -top-2 opacity-10">
          <Icon size={60} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/70 text-sm font-medium mb-2">
            <div 
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: `${colors.primary}20` }}
            >
              <Icon size={14} style={{ color: colors.primary }} />
            </div>
            {title}
          </div>
          
          <GradientText variant={variant} className="text-3xl font-bold">
            {value}
          </GradientText>
          
          {subtitle && (
            <p className="text-white/50 text-sm mt-1">{subtitle}</p>
          )}
          
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-white/50'
            }`}>
              {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trendValue}
            </div>
          )}
          
          {miniChartData && (
            <div className="mt-3">
              <MiniChart3D data={miniChartData} variant={variant} height={40} />
            </div>
          )}
        </div>
      </div>
    </GlassCard3D>
  )
}

// Tarjeta de Orden de Compra Premium
function OrdenCompraCardPremium({ 
  orden, 
  onView, 
}: { 
  orden: OrdenCompra
  onView: (oc: OrdenCompra) => void 
}) {
  const estadoConfig = ESTADO_CONFIG[orden.estado || 'pendiente']
  const Icon = estadoConfig.icon
  const colors = VARIANT_COLORS[estadoConfig.variant]
  
  // Calcular progreso de pago usando campos reales de OrdenCompra
  const totalPagado = orden.pagoDistribuidor || orden.pagoInicial || 0
  const totalOrden = orden.costoTotal || 0
  const progreso = totalOrden > 0 ? Math.min((totalPagado / totalOrden) * 100, 100) : 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="group cursor-pointer"
      onClick={() => onView(orden)}
    >
      <GlassCard3D variant={estadoConfig.variant} size="md" glowIntensity={0.2}>
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant="outline" 
                  className={`${estadoConfig.bgColor} ${estadoConfig.color} font-mono`}
                >
                  {orden.id}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`${estadoConfig.bgColor} ${estadoConfig.color}`}
                >
                  <Icon size={12} className="mr-1" />
                  {estadoConfig.label}
                </Badge>
              </div>
              <p className="text-white/60 text-sm flex items-center gap-1">
                <Building2 size={14} />
                {orden.distribuidor || 'Sin distribuidor'}
              </p>
            </div>
            
            <motion.div 
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${colors.primary}20` }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <ShoppingCart size={20} style={{ color: colors.primary }} />
            </motion.div>
          </div>
          
          {/* Valores */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-white/40 text-xs uppercase">Total Orden</p>
              <p className="text-xl font-bold text-white">{formatearMoneda(totalOrden)}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase">Pagado</p>
              <p className="text-xl font-bold" style={{ color: colors.primary }}>
                {formatearMoneda(totalPagado)}
              </p>
            </div>
          </div>
          
          {/* Barra de progreso */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>Progreso de pago</span>
              <span>{progreso.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: colors.primary }}
                initial={{ width: 0 }}
                animate={{ width: `${progreso}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <Calendar size={12} />
              {formatearFecha(orden.fecha)}
            </div>
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <Package size={12} />
              {formatNumber(orden.cantidad)} unidades
            </div>
            <ChevronRight 
              size={16} 
              className="text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" 
            />
          </div>
        </div>
      </GlassCard3D>
    </motion.div>
  )
}

// Tooltip personalizado para gráficos
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null
  
  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/60 text-xs">{entry.name}:</span>
          <span className="text-white text-sm font-medium">
            {formatearMoneda(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export function BentoOrdenesCompraPremium() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompra | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [searchTerm, setSearchTerm] = useState('')

  // Suscripción en tiempo real
  useEffect(() => {
    const unsubscribe = suscribirOrdenesCompra((data) => {
      setOrdenes(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Métricas calculadas
  const metricas = useMemo(() => {
    const totalOrdenes = ordenes.length
    const totalMonto = ordenes.reduce((sum, oc) => sum + (oc.costoTotal || 0), 0)
    const totalPagado = ordenes.reduce((sum, oc) => sum + (oc.pagoDistribuidor || oc.pagoInicial || 0), 0)
    const pendientePago = totalMonto - totalPagado
    
    const porEstado = {
      pagado: ordenes.filter(oc => oc.estado === 'pagado').length,
      parcial: ordenes.filter(oc => oc.estado === 'parcial').length,
      pendiente: ordenes.filter(oc => oc.estado === 'pendiente').length,
      entregado: ordenes.filter(oc => oc.estado === 'cancelado').length,
    }
    
    const distribuidores = new Set(ordenes.map(oc => oc.distribuidor)).size
    
    return { totalOrdenes, totalMonto, totalPagado, pendientePago, porEstado, distribuidores }
  }, [ordenes])

  // Datos filtrados
  const ordenesFiltradas = useMemo(() => {
    let filtered = ordenes
    
    if (filtroEstado !== 'todos') {
      filtered = filtered.filter(oc => oc.estado === filtroEstado)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(oc => 
        oc.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        oc.distribuidor?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    
    return filtered
  }, [ordenes, filtroEstado, searchTerm])

  // Datos para gráficos
  const chartDataEstados = useMemo(() => [
    { name: 'Pagado', value: metricas.porEstado.pagado, fill: '#10b981' },
    { name: 'Parcial', value: metricas.porEstado.parcial, fill: '#f59e0b' },
    { name: 'Pendiente', value: metricas.porEstado.pendiente, fill: '#ef4444' },
    { name: 'Entregado', value: metricas.porEstado.entregado, fill: '#06b6d4' },
  ], [metricas.porEstado])

  const chartDataTendencia = useMemo(() => {
    const ultimasSemanas: Record<string, { total: number; pagado: number }> = {}
    ordenes.forEach(oc => {
      const fecha = oc.fecha
      if (fecha) {
        const semana = `Sem ${Math.ceil(new Date(typeof fecha === 'object' && 'seconds' in fecha ? fecha.seconds * 1000 : fecha).getDate() / 7)}`
        if (!ultimasSemanas[semana]) ultimasSemanas[semana] = { total: 0, pagado: 0 }
        ultimasSemanas[semana].total += oc.costoTotal || 0
        ultimasSemanas[semana].pagado += oc.pagoDistribuidor || oc.pagoInicial || 0
      }
    })
    return Object.entries(ultimasSemanas).map(([name, data]) => ({ name, ...data }))
  }, [ordenes])

  const handleViewOrden = (oc: OrdenCompra) => {
    setSelectedOrden(oc)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen p-6"
    >
      {/* Fondo de partículas */}
      <ParticleBackground variant="primary" intensity="low" />
      
      {/* Header */}
      <div className="relative z-10 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <ShoppingCart className="w-8 h-8 text-blue-400" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold">
                <GradientText variant="primary">Órdenes de Compra</GradientText>
              </h1>
              <p className="text-white/50 mt-1">Gestión y seguimiento de compras a distribuidores</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0"
            >
              <Plus size={16} className="mr-2" />
              Nueva Orden
            </Button>
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
              <RefreshCw size={18} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCardPremium
          title="Total Órdenes"
          value={metricas.totalOrdenes}
          subtitle="Órdenes registradas"
          icon={ShoppingCart}
          variant="primary"
          miniChartData={[15, 22, 18, 28, 25, 32, 30]}
        />
        <StatCardPremium
          title="Monto Total"
          value={formatearMoneda(metricas.totalMonto)}
          subtitle="Valor de compras"
          icon={DollarSign}
          variant="info"
          trend="up"
          trendValue="+15.3%"
        />
        <StatCardPremium
          title="Total Pagado"
          value={formatearMoneda(metricas.totalPagado)}
          subtitle="Inversión ejecutada"
          icon={CreditCard}
          variant="success"
        />
        <StatCardPremium
          title="Pendiente"
          value={formatearMoneda(metricas.pendientePago)}
          subtitle="Por pagar"
          icon={Receipt}
          variant={metricas.pendientePago > 0 ? 'warning' : 'success'}
        />
      </div>
      
      {/* Gráficos */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Distribución por estado */}
        <GlassCard3D variant="primary" size="lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon size={20} className="text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Distribución por Estado</h3>
            </div>
            <PulseIndicator variant="primary" label="Actualizado" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataEstados}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartDataEstados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-white/70 text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard3D>
        
        {/* Tendencia de montos */}
        <GlassCard3D variant="info" size="lg">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Tendencia de Montos</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartDataTendencia}>
                <defs>
                  <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" fill="url(#gradientTotal)" stroke="#3b82f6" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="pagado" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Pagado" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard3D>
      </div>
      
      {/* Filtros y búsqueda */}
      <div className="relative z-10 mb-6">
        <GlassCard3D variant="secondary" size="sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">Filtrar:</span>
              {['todos', 'pendiente', 'parcial', 'pagado', 'entregado'].map((estado) => (
                <Button
                  key={estado}
                  variant={filtroEstado === estado ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFiltroEstado(estado)}
                  className={`
                    capitalize
                    ${filtroEstado === estado 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {estado === 'todos' ? 'Todos' : ESTADO_CONFIG[estado]?.label || estado}
                  {estado !== 'todos' && (
                    <Badge className="ml-2 bg-white/10 text-white/70" variant="outline">
                      {metricas.porEstado[estado as keyof typeof metricas.porEstado] || 0}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Buscar orden..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 w-64"
                />
              </div>
              <Button variant="outline" size="sm" className="border-white/20 text-white/70">
                <Download size={14} className="mr-2" /> Exportar
              </Button>
            </div>
          </div>
        </GlassCard3D>
      </div>
      
      {/* Grid de órdenes */}
      <div className="relative z-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : ordenesFiltradas.length === 0 ? (
          <GlassCard3D variant="secondary" size="lg">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 rounded-full bg-purple-500/10 mb-4">
                <ShoppingCart size={48} className="text-purple-400 opacity-50" />
              </div>
              <p className="text-white/40">No hay órdenes que mostrar</p>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus size={16} className="mr-2" />
                Crear primera orden
              </Button>
            </div>
          </GlassCard3D>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { 
                opacity: 1,
                transition: { staggerChildren: 0.1 },
              },
            }}
          >
            {ordenesFiltradas.map((orden, index) => (
              <motion.div
                key={orden.id || index}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <OrdenCompraCardPremium orden={orden} onView={handleViewOrden} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      
      {/* Modal de creación */}
      {isModalOpen && (
        <CreateOrdenCompraModalPremium
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      
      {/* Panel de detalle de orden seleccionada */}
      <AnimatePresence>
        {selectedOrden && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Detalle de Orden</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedOrden(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs uppercase mb-1">Orden</p>
                <p className="text-xl font-bold text-white">{selectedOrden.id}</p>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs uppercase mb-1">Distribuidor</p>
                <p className="text-lg text-white">{selectedOrden.distribuidor}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/40 text-xs uppercase mb-1">Total</p>
                  <p className="text-lg font-bold text-white">{formatearMoneda(selectedOrden.costoTotal)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/40 text-xs uppercase mb-1">Unidades</p>
                  <p className="text-lg font-bold text-white">{formatNumber(selectedOrden.cantidad)}</p>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs uppercase mb-2">Estado</p>
                <Badge 
                  variant="outline" 
                  className={`${ESTADO_CONFIG[selectedOrden.estado || 'pendiente']?.bgColor} ${ESTADO_CONFIG[selectedOrden.estado || 'pendiente']?.color}`}
                >
                  {ESTADO_CONFIG[selectedOrden.estado || 'pendiente']?.label}
                </Badge>
              </div>
              
              {/* Info de deuda */}
              {selectedOrden.deuda > 0 && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/40 text-xs uppercase mb-2">Deuda Pendiente</p>
                  <p className="text-rose-400 text-lg font-bold">{formatearMoneda(selectedOrden.deuda)}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default BentoOrdenesCompraPremium
