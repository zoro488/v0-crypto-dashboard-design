"use client"

/**
 * 🏭 BENTO ALMACÉN PREMIUM - Panel de Almacén con Componentes 3D
 * 
 * Características Premium:
 * - Orbes 3D para estadísticas principales
 * - GlassCards con efectos glassmorphism
 * - Animaciones fluidas con Framer Motion
 * - Gráficos Recharts con tema oscuro
 * - Partículas de fondo animadas
 * - 4 Tabs: Entradas, Stock, Salidas, RF Actual (Cortes)
 */

import { motion, AnimatePresence } from "framer-motion"
import { 
  Package, TrendingUp, TrendingDown, Archive, Scissors, Plus, Box, Activity, 
  BarChart3, Zap, RefreshCw, Search, Filter, Calendar, Download, Eye,
  ArrowUpRight, ArrowDownRight, Layers, AlertTriangle, CheckCircle2,
  Sparkles, ChevronRight, type LucideIcon
} from "lucide-react"
import { useState, useMemo, Suspense } from "react"
import { useProductos, useEntradasAlmacen, useSalidasAlmacen } from "@/app/lib/firebase/firestore-hooks.service"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import CreateEntradaAlmacenModal from "@/app/components/modals/CreateEntradaAlmacenModal"
import CreateSalidaAlmacenModal from "@/app/components/modals/CreateSalidaAlmacenModal"
import { 
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, CartesianGrid, Legend, ComposedChart, Line
} from "recharts"

// Componentes 3D Premium
import { 
  StatOrb3D, 
  GlassCard3D, 
  ParticleBackground, 
  PulseIndicator,
  MiniChart3D,
  GradientText,
  VARIANT_COLORS 
} from "@/app/components/3d/PremiumPanelComponents"

// ============================================================================
// INTERFACES
// ============================================================================
interface MovimientoAlmacen {
  id?: string
  fecha?: string | Date | { seconds: number }
  cantidad?: number
  origen?: string
  destino?: string
  cliente?: string
  ordenCompraId?: string
  distribuidor?: string
  valorUnitario?: number
  valorTotal?: number
  referencia?: string
  observaciones?: string
  tipo?: string
  [key: string]: unknown
}

interface ProductoAlmacen {
  id?: string
  nombre?: string
  sku?: string
  stock?: number
  stockActual?: number
  stockMinimo?: number
  valorUnitario?: number
  precio?: number
  ordenCompraId?: string
  distribuidor?: string
  fechaIngreso?: string | Date | { seconds: number }
  [key: string]: unknown
}

// ============================================================================
// CONSTANTES
// ============================================================================
const TABS = [
  { id: "entradas", label: "Entradas", icon: TrendingUp, color: "text-emerald-400", variant: "success" as const },
  { id: "stock", label: "Stock Actual", icon: Archive, color: "text-cyan-400", variant: "info" as const },
  { id: "salidas", label: "Salidas", icon: TrendingDown, color: "text-rose-400", variant: "danger" as const },
  { id: "rf", label: "RF Actual (Cortes)", icon: Scissors, color: "text-amber-400", variant: "warning" as const },
]

const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6']

// Datos de RF Cortes desde la documentación
const RF_CORTES_DATA = [
  { id: 'RF001', corte: 32, fecha: '2025-01-15', observaciones: 'Corte estándar' },
  { id: 'RF002', corte: 124, fecha: '2025-01-18', observaciones: 'Corte grande' },
  { id: 'RF003', corte: 22, fecha: '2025-01-20', observaciones: 'Corte pequeño' },
  { id: 'RF004', corte: 165, fecha: '2025-01-22', observaciones: 'Corte premium' },
  { id: 'RF005', corte: 17, fecha: '2025-01-25', observaciones: 'Corte mini' },
]

// ============================================================================
// HELPERS
// ============================================================================
const formatDate = (date: string | Date | { seconds: number } | undefined): string => {
  if (!date) return "-"
  try {
    if (typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000).toLocaleDateString('es-MX', { 
        day: '2-digit', month: 'short', year: 'numeric' 
      })
    }
    return new Date(date as string | Date).toLocaleDateString('es-MX', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    })
  } catch {
    return "-"
  }
}

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

// ============================================================================
// COMPONENTES AUXILIARES PREMIUM
// ============================================================================

// Tarjeta de estadística con efecto 3D
function StatCardPremium({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'primary',
  trend,
  trendValue,
  miniChartData
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
        {/* Icono de fondo */}
        <div className="absolute -right-2 -top-2 opacity-10">
          <Icon size={60} />
        </div>
        
        {/* Contenido */}
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
          
          {/* Trend */}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-white/50'
            }`}>
              {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trendValue}
            </div>
          )}
          
          {/* Mini Chart */}
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

// Tabla de datos premium
function DataTablePremium<T extends Record<string, unknown>>({ 
  data, 
  columns, 
  loading,
  emptyMessage = "No hay datos disponibles",
  onRowClick,
  variant = 'primary'
}: { 
  data: T[]
  columns: { key: string; label: string; render?: (item: T) => React.ReactNode; width?: string }[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'
}) {
  const colors = VARIANT_COLORS[variant]
  
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/5" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-white/40"
      >
        <div 
          className="p-4 rounded-full mb-4"
          style={{ backgroundColor: `${colors.primary}10` }}
        >
          <Package size={48} style={{ color: colors.primary }} className="opacity-50" />
        </div>
        <p>{emptyMessage}</p>
      </motion.div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              {columns.map((col) => (
                <th 
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((item, idx) => (
              <motion.tr
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onRowClick?.(item)}
                className={`
                  bg-white/[0.02] hover:bg-white/[0.06] transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-white/80">
                    {col.render ? col.render(item) : String(item[col.key] ?? '-')}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
          <span className="text-white text-sm font-medium">
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// COMPONENTES DE TABS
// ============================================================================

// Tab Entradas
function TabEntradas({ entradas, loading }: { entradas: MovimientoAlmacen[]; loading: boolean }) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredData = useMemo(() => {
    if (!searchTerm) return entradas
    return entradas.filter(e => 
      e.distribuidor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.ordenCompraId?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [entradas, searchTerm])
  
  const totalEntradas = entradas.reduce((sum, e) => sum + (e.cantidad ?? 0), 0)
  const valorTotal = entradas.reduce((sum, e) => sum + (e.valorTotal ?? 0), 0)
  
  // Datos para gráfico
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {}
    entradas.forEach(e => {
      const month = formatDate(e.fecha).split(' ')[1] || 'Sin fecha'
      grouped[month] = (grouped[month] || 0) + (e.cantidad ?? 0)
    })
    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }, [entradas])

  return (
    <div className="space-y-6">
      {/* Stats Row con Orbes 3D */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardPremium
          title="Total Entradas"
          value={formatNumber(totalEntradas)}
          subtitle="Unidades ingresadas"
          icon={TrendingUp}
          variant="success"
          trend="up"
          trendValue="+12% vs mes anterior"
          miniChartData={[20, 35, 28, 45, 52, 48, 65]}
        />
        <StatCardPremium
          title="Valor Total"
          value={formatCurrency(valorTotal)}
          subtitle="Inversión en stock"
          icon={Box}
          variant="primary"
        />
        <StatCardPremium
          title="Proveedores"
          value={new Set(entradas.map(e => e.distribuidor)).size}
          subtitle="Activos este mes"
          icon={Layers}
          variant="info"
        />
        <StatCardPremium
          title="Promedio/Entrada"
          value={formatNumber(Math.round(totalEntradas / (entradas.length || 1)))}
          subtitle="Unidades por registro"
          icon={Activity}
          variant="secondary"
        />
      </div>
      
      {/* Gráfico */}
      <GlassCard3D variant="success" size="lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Tendencia de Entradas</h3>
          </div>
          <PulseIndicator variant="success" label="En tiempo real" />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradientEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                fill="url(#gradientEntradas)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard3D>
      
      {/* Búsqueda y tabla */}
      <GlassCard3D variant="success" size="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Registro de Entradas</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 w-64"
              />
            </div>
            <Button variant="outline" size="sm" className="border-white/20 text-white/70">
              <Filter size={14} className="mr-2" /> Filtrar
            </Button>
          </div>
        </div>
        
        <DataTablePremium
          data={filteredData}
          loading={loading}
          variant="success"
          columns={[
            { key: 'fecha', label: 'Fecha', render: (item) => formatDate(item.fecha) },
            { key: 'ordenCompraId', label: 'OC', render: (item) => (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                {item.ordenCompraId || '-'}
              </Badge>
            )},
            { key: 'distribuidor', label: 'Distribuidor' },
            { key: 'cantidad', label: 'Cantidad', render: (item) => (
              <span className="font-semibold text-emerald-400">+{formatNumber(item.cantidad)}</span>
            )},
            { key: 'valorTotal', label: 'Valor', render: (item) => formatCurrency(item.valorTotal) },
          ]}
          emptyMessage="No hay entradas registradas"
        />
      </GlassCard3D>
    </div>
  )
}

// Tab Stock
function TabStock({ productos, loading }: { productos: ProductoAlmacen[]; loading: boolean }) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const totalStock = productos.reduce((sum, p) => sum + (p.stock ?? p.stockActual ?? 0), 0)
  const valorInventario = productos.reduce((sum, p) => {
    const stock = p.stock ?? p.stockActual ?? 0
    const valor = p.valorUnitario ?? p.precio ?? 0
    return sum + (stock * valor)
  }, 0)
  const lowStockCount = productos.filter(p => {
    const stock = p.stock ?? p.stockActual ?? 0
    const minimo = p.stockMinimo ?? 10
    return stock < minimo
  }).length
  
  // Datos para gráfico de distribución
  const distributionData = useMemo(() => {
    const grouped: Record<string, number> = {}
    productos.forEach(p => {
      const dist = p.distribuidor || 'Sin clasificar'
      grouped[dist] = (grouped[dist] || 0) + (p.stock ?? p.stockActual ?? 0)
    })
    return Object.entries(grouped).map(([name, value], i) => ({ 
      name: name.length > 15 ? name.slice(0, 15) + '...' : name, 
      value,
      fill: CHART_COLORS[i % CHART_COLORS.length]
    }))
  }, [productos])

  return (
    <div className="space-y-6">
      {/* Stats con Orbes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardPremium
          title="Stock Total"
          value={formatNumber(totalStock)}
          subtitle="Unidades disponibles"
          icon={Archive}
          variant="info"
          miniChartData={[45, 52, 49, 60, 55, 70, 65]}
        />
        <StatCardPremium
          title="Valor Inventario"
          value={formatCurrency(valorInventario)}
          subtitle="Valor total en almacén"
          icon={Box}
          variant="primary"
          trend="up"
          trendValue="+8.5%"
        />
        <StatCardPremium
          title="Stock Bajo"
          value={lowStockCount}
          subtitle="Productos en alerta"
          icon={AlertTriangle}
          variant={lowStockCount > 0 ? "warning" : "success"}
        />
        <StatCardPremium
          title="SKUs Activos"
          value={productos.length}
          subtitle="Productos únicos"
          icon={Package}
          variant="secondary"
        />
      </div>
      
      {/* Gráficos en row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por proveedor */}
        <GlassCard3D variant="info" size="lg">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={20} className="text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Distribución por Proveedor</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
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
        
        {/* Niveles de stock */}
        <GlassCard3D variant="info" size="lg">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Niveles de Stock</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productos.slice(0, 8).map(p => ({
                name: (p.sku || p.nombre || 'N/A').slice(0, 10),
                stock: p.stock ?? p.stockActual ?? 0,
                minimo: p.stockMinimo ?? 10
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="stock" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="minimo" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard3D>
      </div>
      
      {/* Tabla de productos */}
      <GlassCard3D variant="info" size="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Inventario Actual</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 w-64"
              />
            </div>
          </div>
        </div>
        
        <DataTablePremium
          data={productos.filter(p => 
            !searchTerm || 
            p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          loading={loading}
          variant="info"
          columns={[
            { key: 'sku', label: 'SKU', render: (item) => (
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 font-mono">
                {item.sku || item.ordenCompraId || '-'}
              </Badge>
            )},
            { key: 'nombre', label: 'Producto', render: (item) => item.nombre || item.distribuidor || '-' },
            { key: 'stock', label: 'Stock', render: (item) => {
              const stock = item.stock ?? item.stockActual ?? 0
              const minimo = item.stockMinimo ?? 10
              const isLow = stock < minimo
              return (
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isLow ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {formatNumber(stock)}
                  </span>
                  {isLow && <AlertTriangle size={14} className="text-amber-400" />}
                </div>
              )
            }},
            { key: 'valorUnitario', label: 'Precio Unit.', render: (item) => formatCurrency(item.valorUnitario ?? item.precio) },
            { key: 'total', label: 'Valor Total', render: (item) => {
              const stock = item.stock ?? item.stockActual ?? 0
              const valor = item.valorUnitario ?? item.precio ?? 0
              return formatCurrency(stock * valor)
            }},
          ]}
          emptyMessage="No hay productos en inventario"
        />
      </GlassCard3D>
    </div>
  )
}

// Tab Salidas
function TabSalidas({ salidas, loading }: { salidas: MovimientoAlmacen[]; loading: boolean }) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const totalSalidas = salidas.reduce((sum, s) => sum + (s.cantidad ?? 0), 0)
  const valorTotal = salidas.reduce((sum, s) => sum + (s.valorTotal ?? 0), 0)
  
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {}
    salidas.forEach(s => {
      const cliente = s.cliente || s.destino || 'Sin cliente'
      grouped[cliente] = (grouped[cliente] || 0) + (s.cantidad ?? 0)
    })
    return Object.entries(grouped).slice(0, 6).map(([name, value], i) => ({ 
      name: name.length > 12 ? name.slice(0, 12) + '...' : name, 
      value,
      fill: CHART_COLORS[i % CHART_COLORS.length]
    }))
  }, [salidas])

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardPremium
          title="Total Salidas"
          value={formatNumber(totalSalidas)}
          subtitle="Unidades despachadas"
          icon={TrendingDown}
          variant="danger"
          trend="up"
          trendValue="+18% despachos"
          miniChartData={[30, 45, 35, 50, 42, 55, 60]}
        />
        <StatCardPremium
          title="Valor Despachado"
          value={formatCurrency(valorTotal)}
          subtitle="Valor total salidas"
          icon={Box}
          variant="primary"
        />
        <StatCardPremium
          title="Clientes Atendidos"
          value={new Set(salidas.map(s => s.cliente)).size}
          subtitle="Clientes únicos"
          icon={CheckCircle2}
          variant="success"
        />
        <StatCardPremium
          title="Promedio/Salida"
          value={formatNumber(Math.round(totalSalidas / (salidas.length || 1)))}
          subtitle="Unidades por despacho"
          icon={Activity}
          variant="secondary"
        />
      </div>
      
      {/* Gráfico de distribución */}
      <GlassCard3D variant="danger" size="lg">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={20} className="text-rose-400" />
          <h3 className="text-lg font-semibold text-white">Distribución por Cliente</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard3D>
      
      {/* Tabla */}
      <GlassCard3D variant="danger" size="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Registro de Salidas</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 w-64"
            />
          </div>
        </div>
        
        <DataTablePremium
          data={salidas.filter(s => 
            !searchTerm || 
            s.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.destino?.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          loading={loading}
          variant="danger"
          columns={[
            { key: 'fecha', label: 'Fecha', render: (item) => formatDate(item.fecha) },
            { key: 'cliente', label: 'Cliente/Destino', render: (item) => item.cliente || item.destino || '-' },
            { key: 'cantidad', label: 'Cantidad', render: (item) => (
              <span className="font-semibold text-rose-400">-{formatNumber(item.cantidad)}</span>
            )},
            { key: 'valorTotal', label: 'Valor', render: (item) => formatCurrency(item.valorTotal) },
            { key: 'referencia', label: 'Referencia', render: (item) => (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-300 border-rose-500/30">
                {item.referencia || item.ordenCompraId || '-'}
              </Badge>
            )},
          ]}
          emptyMessage="No hay salidas registradas"
        />
      </GlassCard3D>
    </div>
  )
}

// Tab RF (Cortes)
function TabRF() {
  const totalCortes = RF_CORTES_DATA.reduce((sum, rf) => sum + (rf.corte ?? 0), 0)
  
  const chartData = RF_CORTES_DATA.map(rf => ({
    name: rf.id,
    value: rf.corte,
    fecha: rf.fecha
  }))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardPremium
          title="Total RF Cortes"
          value={formatNumber(totalCortes)}
          subtitle="Unidades cortadas"
          icon={Scissors}
          variant="warning"
          miniChartData={RF_CORTES_DATA.map(rf => rf.corte)}
        />
        <StatCardPremium
          title="Registros"
          value={RF_CORTES_DATA.length}
          subtitle="Cortes registrados"
          icon={Layers}
          variant="info"
        />
        <StatCardPremium
          title="Promedio/Corte"
          value={formatNumber(Math.round(totalCortes / RF_CORTES_DATA.length))}
          subtitle="Unidades promedio"
          icon={Activity}
          variant="primary"
        />
        <StatCardPremium
          title="Mayor Corte"
          value={formatNumber(Math.max(...RF_CORTES_DATA.map(rf => rf.corte)))}
          subtitle="Máximo registrado"
          icon={Zap}
          variant="success"
        />
      </div>
      
      {/* Gráfico de cortes */}
      <GlassCard3D variant="warning" size="lg">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={20} className="text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Historial de Cortes RF</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="gradientRF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.8} />
              <Line type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2} dot={{ fill: '#fbbf24', r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </GlassCard3D>
      
      {/* Tabla de cortes */}
      <GlassCard3D variant="warning" size="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Detalle de Cortes RF</h3>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30">
            <Scissors size={12} className="mr-1" />
            {RF_CORTES_DATA.length} registros
          </Badge>
        </div>
        
        <DataTablePremium
          data={RF_CORTES_DATA}
          variant="warning"
          columns={[
            { key: 'id', label: 'ID', render: (item) => (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 font-mono">
                {item.id}
              </Badge>
            )},
            { key: 'fecha', label: 'Fecha' },
            { key: 'corte', label: 'Cantidad', render: (item) => (
              <span className="font-bold text-amber-400">{formatNumber(item.corte)}</span>
            )},
            { key: 'observaciones', label: 'Observaciones' },
          ]}
          emptyMessage="No hay cortes registrados"
        />
      </GlassCard3D>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export function BentoAlmacenPremium() {
  const [activeTab, setActiveTab] = useState("entradas")
  const [showEntradaModal, setShowEntradaModal] = useState(false)
  const [showSalidaModal, setShowSalidaModal] = useState(false)
  
  // Hooks de datos
  const { data: productos = [], loading: loadingProductos } = useProductos()
  const { data: entradas = [], loading: loadingEntradas } = useEntradasAlmacen()
  const { data: salidas = [], loading: loadingSalidas } = useSalidasAlmacen()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen p-6"
    >
      {/* Fondo de partículas */}
      <ParticleBackground 
        variant={TABS.find(t => t.id === activeTab)?.variant || 'primary'} 
        intensity="low" 
      />
      
      {/* Header */}
      <div className="relative z-10 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Package className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold">
                <GradientText variant="info">Gestión de Almacén</GradientText>
              </h1>
              <p className="text-white/50 mt-1">Control integral de inventario y movimientos</p>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowEntradaModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white border-0"
            >
              <Plus size={16} className="mr-2" />
              Nueva Entrada
            </Button>
            <Button
              onClick={() => setShowSalidaModal(true)}
              variant="outline"
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
            >
              <TrendingDown size={16} className="mr-2" />
              Registrar Salida
            </Button>
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
              <RefreshCw size={18} />
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mt-6 p-1 bg-white/5 rounded-2xl border border-white/10 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-white/10 text-white shadow-lg' 
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={16} className={isActive ? tab.color : ''} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-xl bg-white/5"
                    style={{ zIndex: -1 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
      
      {/* Contenido de tabs */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "entradas" && (
              <TabEntradas entradas={entradas as MovimientoAlmacen[]} loading={loadingEntradas} />
            )}
            {activeTab === "stock" && (
              <TabStock productos={productos as ProductoAlmacen[]} loading={loadingProductos} />
            )}
            {activeTab === "salidas" && (
              <TabSalidas salidas={salidas as MovimientoAlmacen[]} loading={loadingSalidas} />
            )}
            {activeTab === "rf" && <TabRF />}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Modales */}
      {showEntradaModal && (
        <CreateEntradaAlmacenModal
          isOpen={showEntradaModal}
          onClose={() => setShowEntradaModal(false)}
        />
      )}
      {showSalidaModal && (
        <CreateSalidaAlmacenModal
          isOpen={showSalidaModal}
          onClose={() => setShowSalidaModal(false)}
        />
      )}
    </motion.div>
  )
}

export default BentoAlmacenPremium
