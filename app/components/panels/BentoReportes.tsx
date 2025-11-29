"use client"

import { motion, AnimatePresence } from "framer-motion"
import { 
  FileText, Download, Calendar, Filter, Search, TrendingUp, TrendingDown,
  DollarSign, Users, Package, ShoppingCart, Building2, PieChart as PieChartIcon,
  BarChart3, LineChart, Clock, CheckCircle2, AlertCircle, RefreshCw,
  FileSpreadsheet, FileType, Printer, Share2, Star, ArrowUpRight, ArrowDownRight,
  Wallet, Receipt, Truck, Scissors, Eye, ChevronRight, Sparkles,
  type LucideIcon
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Skeleton } from "@/app/components/ui/skeleton"
import { useState, useMemo } from "react"
import { 
  useVentas, useClientes, useDistribuidores, useOrdenesCompra, 
  useProductos, useBancosData 
} from "@/app/lib/firebase/firestore-hooks.service"
import { 
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, CartesianGrid, Legend, LineChart as RechartsLineChart, Line,
  ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts"

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================
interface ReporteConfig {
  id: string
  nombre: string
  descripcion: string
  categoria: 'ventas' | 'compras' | 'inventario' | 'financiero' | 'clientes'
  icon: LucideIcon
  color: string
  frecuencia: string
  ultimaActualizacion?: string
  favorito?: boolean
}

// ============================================================================
// HELPERS
// ============================================================================
const formatNumber = (value: number | undefined): string => {
  return (value ?? 0).toLocaleString('es-MX')
}

const formatCurrency = (value: number | undefined): string => {
  return new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN',
    minimumFractionDigits: 0 
  }).format(value ?? 0)
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-MX', { 
    day: '2-digit', month: 'short', year: 'numeric' 
  })
}

const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899']

const CATEGORIAS = [
  { id: 'todos', label: 'Todos', icon: FileText },
  { id: 'ventas', label: 'Ventas', icon: TrendingUp },
  { id: 'compras', label: 'Compras', icon: ShoppingCart },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'financiero', label: 'Financiero', icon: DollarSign },
  { id: 'clientes', label: 'Clientes', icon: Users },
]

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

// Tarjeta de estadística
function StatCard({ 
  title, value, subtitle, icon: Icon, color, trend, trendValue 
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

// Tarjeta de reporte
function ReporteCard({ 
  reporte, 
  onGenerar, 
  onToggleFavorito 
}: { 
  reporte: ReporteConfig
  onGenerar: () => void
  onToggleFavorito: () => void
}) {
  const Icon = reporte.icon
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 cursor-pointer group"
      onClick={onGenerar}
    >
      {/* Indicador de favorito */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorito(); }}
        className="absolute top-4 right-4 z-10"
      >
        <Star 
          size={18} 
          className={`transition-colors ${reporte.favorito ? 'fill-amber-400 text-amber-400' : 'text-white/30 hover:text-white/60'}`}
        />
      </button>

      {/* Icono grande de fondo */}
      <div className="absolute -right-6 -bottom-6 opacity-5">
        <Icon size={120} />
      </div>

      <div className="relative z-10">
        <div className={`inline-flex p-3 rounded-xl mb-4 ${reporte.color}`}>
          <Icon size={24} className="text-white" />
        </div>

        <h4 className="text-white font-semibold text-lg mb-1">{reporte.nombre}</h4>
        <p className="text-white/60 text-sm mb-4 line-clamp-2">{reporte.descripcion}</p>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-white/5 text-white/60 border-white/20">
            <Clock size={12} className="mr-1" />
            {reporte.frecuencia}
          </Badge>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" className="text-white/60 hover:text-white h-8 w-8 p-0">
              <FileType size={16} />
            </Button>
            <Button size="sm" variant="ghost" className="text-white/60 hover:text-white h-8 w-8 p-0">
              <FileSpreadsheet size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function BentoReportes() {
  const [categoriaActiva, setCategoriaActiva] = useState('todos')
  const [searchQuery, setSearchQuery] = useState("")
  const [periodoActivo, setPeriodoActivo] = useState('mes')
  const [generandoReporte, setGenerandoReporte] = useState<string | null>(null)

  // Hooks de datos
  const { data: ventas = [], loading: loadingVentas } = useVentas()
  const { data: clientes = [], loading: loadingClientes } = useClientes()
  const { data: distribuidores = [], loading: loadingDistribuidores } = useDistribuidores()
  const { data: ordenesCompra = [], loading: loadingOC } = useOrdenesCompra()
  const { data: productos = [], loading: loadingProductos } = useProductos()
  const { data: bancos = [], loading: loadingBancos } = useBancosData()

  const isLoading = loadingVentas || loadingClientes || loadingDistribuidores || loadingOC || loadingProductos || loadingBancos

  // Métricas calculadas
  const metricas = useMemo(() => {
    const totalVentas = ventas.reduce((sum, v: Record<string, unknown>) => 
      sum + (Number(v.precioTotalVenta) || Number(v.montoTotal) || 0), 0
    )
    const totalCompras = ordenesCompra.reduce((sum, oc: Record<string, unknown>) => 
      sum + (Number(oc.costoTotal) || 0), 0
    )
    const totalStock = productos.reduce((sum, p: Record<string, unknown>) => 
      sum + (Number(p.stock) || Number(p.stockActual) || 0), 0
    )
    const totalDeudaClientes = clientes.reduce((sum, c: Record<string, unknown>) => 
      sum + (Number(c.deudaTotal) || Number(c.deuda) || 0), 0
    )
    const capitalTotal = bancos.reduce((sum, b: Record<string, unknown>) => 
      sum + (Number(b.capitalActual) || 0), 0
    )
    
    return {
      totalVentas,
      totalCompras,
      totalStock,
      totalDeudaClientes,
      capitalTotal,
      margenBruto: totalVentas - totalCompras,
      numeroVentas: ventas.length,
      numeroClientes: clientes.length,
      numeroDistribuidores: distribuidores.length,
      numeroOC: ordenesCompra.length,
    }
  }, [ventas, ordenesCompra, productos, clientes, bancos, distribuidores])

  // Reportes disponibles
  const [reportes, setReportes] = useState<ReporteConfig[]>([
    {
      id: 'ventas-diarias',
      nombre: 'Ventas Diarias',
      descripcion: 'Resumen de ventas del día con desglose por cliente y producto',
      categoria: 'ventas',
      icon: TrendingUp,
      color: 'bg-emerald-500/20',
      frecuencia: 'Diario',
      favorito: true,
    },
    {
      id: 'ventas-mensuales',
      nombre: 'Ventas Mensuales',
      descripcion: 'Análisis mensual de ventas con comparativa de períodos anteriores',
      categoria: 'ventas',
      icon: BarChart3,
      color: 'bg-emerald-500/20',
      frecuencia: 'Mensual',
    },
    {
      id: 'rentabilidad-ventas',
      nombre: 'Rentabilidad por Venta',
      descripcion: 'Análisis de margen y utilidad por cada venta realizada',
      categoria: 'ventas',
      icon: DollarSign,
      color: 'bg-emerald-500/20',
      frecuencia: 'Semanal',
    },
    {
      id: 'ordenes-compra',
      nombre: 'Órdenes de Compra',
      descripcion: 'Estado de OC, pagos a distribuidores y deudas pendientes',
      categoria: 'compras',
      icon: ShoppingCart,
      color: 'bg-blue-500/20',
      frecuencia: 'Semanal',
      favorito: true,
    },
    {
      id: 'pagos-distribuidores',
      nombre: 'Pagos a Distribuidores',
      descripcion: 'Historial de pagos y deudas con cada distribuidor',
      categoria: 'compras',
      icon: Building2,
      color: 'bg-blue-500/20',
      frecuencia: 'Quincenal',
    },
    {
      id: 'inventario-actual',
      nombre: 'Inventario Actual',
      descripcion: 'Stock actual por OC, valorización y alertas de bajo inventario',
      categoria: 'inventario',
      icon: Package,
      color: 'bg-amber-500/20',
      frecuencia: 'Diario',
      favorito: true,
    },
    {
      id: 'movimientos-almacen',
      nombre: 'Movimientos de Almacén',
      descripcion: 'Entradas, salidas y cortes de inventario en el período',
      categoria: 'inventario',
      icon: Truck,
      color: 'bg-amber-500/20',
      frecuencia: 'Semanal',
    },
    {
      id: 'cortes-rf',
      nombre: 'Reporte RF (Cortes)',
      descripcion: 'Detalle de cortes realizados y RF acumulado',
      categoria: 'inventario',
      icon: Scissors,
      color: 'bg-amber-500/20',
      frecuencia: 'Quincenal',
    },
    {
      id: 'flujo-caja',
      nombre: 'Flujo de Caja',
      descripcion: 'Ingresos y egresos por banco con proyección',
      categoria: 'financiero',
      icon: Wallet,
      color: 'bg-purple-500/20',
      frecuencia: 'Diario',
      favorito: true,
    },
    {
      id: 'estado-bancos',
      nombre: 'Estado de Bancos',
      descripcion: 'Capital actual, histórico de movimientos y transferencias',
      categoria: 'financiero',
      icon: Receipt,
      color: 'bg-purple-500/20',
      frecuencia: 'Diario',
    },
    {
      id: 'utilidades',
      nombre: 'Reporte de Utilidades',
      descripcion: 'Ganancias netas distribuidas y disponibles',
      categoria: 'financiero',
      icon: TrendingUp,
      color: 'bg-purple-500/20',
      frecuencia: 'Mensual',
    },
    {
      id: 'cartera-clientes',
      nombre: 'Cartera de Clientes',
      descripcion: 'Saldos, deudas y estado de cuenta por cliente',
      categoria: 'clientes',
      icon: Users,
      color: 'bg-cyan-500/20',
      frecuencia: 'Semanal',
      favorito: true,
    },
    {
      id: 'top-clientes',
      nombre: 'Top Clientes',
      descripcion: 'Ranking de clientes por volumen de compra',
      categoria: 'clientes',
      icon: Star,
      color: 'bg-cyan-500/20',
      frecuencia: 'Mensual',
    },
    {
      id: 'cobranza-pendiente',
      nombre: 'Cobranza Pendiente',
      descripcion: 'Clientes con adeudos y antigüedad de deuda',
      categoria: 'clientes',
      icon: AlertCircle,
      color: 'bg-cyan-500/20',
      frecuencia: 'Diario',
    },
  ])

  // Filtrado de reportes
  const reportesFiltrados = useMemo(() => {
    let result = reportes

    if (categoriaActiva !== 'todos') {
      result = result.filter(r => r.categoria === categoriaActiva)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(r => 
        r.nombre.toLowerCase().includes(q) ||
        r.descripcion.toLowerCase().includes(q)
      )
    }

    return result
  }, [reportes, categoriaActiva, searchQuery])

  const reportesFavoritos = reportes.filter(r => r.favorito)

  // Toggle favorito
  const toggleFavorito = (id: string) => {
    setReportes(prev => prev.map(r => 
      r.id === id ? { ...r, favorito: !r.favorito } : r
    ))
  }

  // Generar reporte
  const generarReporte = async (id: string) => {
    setGenerandoReporte(id)
    // Simular generación
    await new Promise(resolve => setTimeout(resolve, 2000))
    setGenerandoReporte(null)
  }

  // Datos para gráficos del dashboard
  const ventasPorMes = useMemo(() => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
    return meses.map((mes, i) => ({
      name: mes,
      ventas: Math.floor(Math.random() * 500000) + 200000,
      compras: Math.floor(Math.random() * 300000) + 100000,
      utilidad: Math.floor(Math.random() * 200000) + 50000,
    }))
  }, [])

  const distribucionVentas = useMemo(() => [
    { name: 'Locales', value: 45, color: '#10b981' },
    { name: 'Foráneas', value: 35, color: '#3b82f6' },
    { name: 'Especiales', value: 20, color: '#f59e0b' },
  ], [])

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              📊 Centro de Reportes
            </h1>
            <p className="text-white/60 mt-1">
              Genera y exporta reportes del negocio en tiempo real
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <Input
                placeholder="Buscar reportes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <Button variant="outline" className="border-white/20 text-white/70 hover:bg-white/10">
              <Calendar size={18} className="mr-2" />
              {formatDate(new Date())}
            </Button>
          </div>
        </div>

        {/* KPIs Resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Ventas"
            value={formatCurrency(metricas.totalVentas)}
            subtitle={`${metricas.numeroVentas} transacciones`}
            icon={TrendingUp}
            color="from-emerald-500/20 to-teal-500/20"
            trend="up"
            trendValue="+12.5%"
          />
          <StatCard
            title="Total Compras"
            value={formatCurrency(metricas.totalCompras)}
            subtitle={`${metricas.numeroOC} órdenes`}
            icon={ShoppingCart}
            color="from-blue-500/20 to-cyan-500/20"
          />
          <StatCard
            title="Margen Bruto"
            value={formatCurrency(metricas.margenBruto)}
            subtitle="Utilidad estimada"
            icon={DollarSign}
            color="from-purple-500/20 to-violet-500/20"
            trend="up"
            trendValue="+8.3%"
          />
          <StatCard
            title="Stock Total"
            value={formatNumber(metricas.totalStock)}
            subtitle="Unidades disponibles"
            icon={Package}
            color="from-amber-500/20 to-orange-500/20"
          />
          <StatCard
            title="Capital Bancos"
            value={formatCurrency(metricas.capitalTotal)}
            subtitle="Liquidez total"
            icon={Wallet}
            color="from-cyan-500/20 to-blue-500/20"
          />
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tendencia de Ventas vs Compras */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white/80 font-medium">Tendencia Mensual</h4>
              <div className="flex gap-2">
                {['semana', 'mes', 'año'].map((periodo) => (
                  <button
                    key={periodo}
                    onClick={() => setPeriodoActivo(periodo)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      periodoActivo === periodo 
                        ? 'bg-white/10 text-white' 
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={ventasPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="ventas" fill="#10b981" radius={[4, 4, 0, 0]} name="Ventas" />
                <Bar dataKey="compras" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Compras" />
                <Line type="monotone" dataKey="utilidad" stroke="#f59e0b" strokeWidth={2} name="Utilidad" />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución de ventas */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h4 className="text-white/80 font-medium mb-4">Distribución de Ventas</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={distribucionVentas}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {distribucionVentas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reportes Favoritos */}
        {reportesFavoritos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="text-amber-400" size={20} />
              <h3 className="text-xl font-bold text-white">Reportes Favoritos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportesFavoritos.map((reporte, idx) => (
                <motion.div
                  key={reporte.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ReporteCard
                    reporte={reporte}
                    onGenerar={() => generarReporte(reporte.id)}
                    onToggleFavorito={() => toggleFavorito(reporte.id)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros de categoría */}
        <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaActiva(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                categoriaActiva === cat.id
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <cat.icon size={18} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lista de Reportes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              {categoriaActiva === 'todos' ? 'Todos los Reportes' : `Reportes de ${CATEGORIAS.find(c => c.id === categoriaActiva)?.label}`}
              <span className="text-white/50 font-normal text-base ml-2">({reportesFiltrados.length})</span>
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-white/20 text-white/70">
                <Sparkles size={16} className="mr-2" />
                Generar IA
              </Button>
            </div>
          </div>

          {reportesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/40">
              <FileText size={48} className="mb-4 opacity-50" />
              <p>No hay reportes que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {reportesFiltrados.map((reporte, idx) => (
                  <motion.div
                    key={reporte.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <ReporteCard
                      reporte={reporte}
                      onGenerar={() => generarReporte(reporte.id)}
                      onToggleFavorito={() => toggleFavorito(reporte.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6">
          <h4 className="text-white font-medium mb-4">Exportar Datos</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 h-auto py-4 flex-col">
              <FileSpreadsheet size={24} className="mb-2" />
              <span>Excel</span>
              <span className="text-xs text-white/50">Todos los datos</span>
            </Button>
            <Button variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 h-auto py-4 flex-col">
              <FileType size={24} className="mb-2" />
              <span>PDF</span>
              <span className="text-xs text-white/50">Reporte ejecutivo</span>
            </Button>
            <Button variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 h-auto py-4 flex-col">
              <Printer size={24} className="mb-2" />
              <span>Imprimir</span>
              <span className="text-xs text-white/50">Vista de impresión</span>
            </Button>
            <Button variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 h-auto py-4 flex-col">
              <Share2 size={24} className="mb-2" />
              <span>Compartir</span>
              <span className="text-xs text-white/50">Link temporal</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Overlay de generación */}
      <AnimatePresence>
        {generandoReporte && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a2e] rounded-2xl p-8 text-center"
            >
              <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-white font-medium">Generando reporte...</p>
              <p className="text-white/60 text-sm">Esto puede tomar unos segundos</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
