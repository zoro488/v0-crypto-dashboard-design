'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, TrendingUp, TrendingDown, Archive, Scissors, Plus, Box, Activity, 
  BarChart3, Zap, RefreshCw, Search, Filter, Calendar, Download, Eye,
  ArrowUpRight, ArrowDownRight, Layers, AlertTriangle, CheckCircle2, Sparkles,
  Pencil, Trash2,
  type LucideIcon,
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { useProductos, useEntradasAlmacen, useSalidasAlmacen } from '@/app/lib/firebase/firestore-hooks.service'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import CreateEntradaAlmacenModal from '@/app/components/modals/CreateEntradaAlmacenModal'
import CreateSalidaAlmacenModal from '@/app/components/modals/CreateSalidaAlmacenModal'
import { DeleteConfirmModal } from '@/app/components/modals/DeleteConfirmModal'
import { eliminarProducto } from '@/app/lib/firebase/firestore-service'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { useToast } from '@/app/hooks/use-toast'
import { logger } from '@/app/lib/utils/logger'
import { 
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, CartesianGrid, Legend, 
} from 'recharts'
import { Panel3DWrapper } from '@/app/components/3d/Panel3DWrapper'

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

interface CorteRF {
  id?: string
  fecha?: string | Date | { seconds: number }
  corte?: number
  cantidad?: number
  observaciones?: string
  [key: string]: unknown
}

// ============================================================================
// CONSTANTES Y HELPERS
// ============================================================================
const TABS = [
  { id: 'entradas', label: 'Entradas', icon: TrendingUp, color: 'text-emerald-400' },
  { id: 'stock', label: 'Stock Actual', icon: Archive, color: 'text-cyan-400' },
  { id: 'salidas', label: 'Salidas', icon: TrendingDown, color: 'text-rose-400' },
  { id: 'rf', label: 'RF Actual (Cortes)', icon: Scissors, color: 'text-amber-400' },
]

const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6']

const formatDate = (date: string | Date | { seconds: number } | undefined): string => {
  if (!date) return '-'
  try {
    if (typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000).toLocaleDateString('es-MX', { 
        day: '2-digit', month: 'short', year: 'numeric', 
      })
    }
    return new Date(date as string | Date).toLocaleDateString('es-MX', { 
      day: '2-digit', month: 'short', year: 'numeric', 
    })
  } catch {
    return '-'
  }
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

// Componente de tabla reutilizable con diseño premium
function DataTable<T extends Record<string, unknown>>({ 
  data, 
  columns, 
  loading,
  emptyMessage = 'No hay datos disponibles',
  onRowClick,
  onEdit,
  onDelete,
}: { 
  data: T[]
  columns: { key: string; label: string; render?: (item: T) => React.ReactNode; width?: string }[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/40">
        <Package size={48} className="mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
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
                  className={`px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider ${col.width || ''}`}
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-white/60 uppercase tracking-wider w-24">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((item, idx) => (
              <motion.tr
                key={item.id as string || idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onRowClick?.(item)}
                className={`bg-white/[0.02] hover:bg-white/[0.06] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-white/80">
                    {col.render ? col.render(item) : String(item[col.key] ?? '-')}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                          className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          <Pencil size={14} />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function BentoAlmacen() {
  const { toast } = useToast()
  const { triggerDataRefresh } = useAppStore()
  const [activeTab, setActiveTab] = useState('entradas')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEntradaModal, setShowEntradaModal] = useState(false)
  const [showSalidaModal, setShowSalidaModal] = useState(false)
  const [editingProducto, setEditingProducto] = useState<ProductoAlmacen | null>(null)
  const [deletingProducto, setDeletingProducto] = useState<ProductoAlmacen | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Hooks de datos
  const { data: productosRaw = [], loading: loadingProductos } = useProductos()
  const { data: entradasRaw = [], loading: loadingEntradas } = useEntradasAlmacen()
  const { data: salidasRaw = [], loading: loadingSalidas } = useSalidasAlmacen()

  // Casting seguro
  const productos = productosRaw as ProductoAlmacen[]
  const entradas = entradasRaw as MovimientoAlmacen[]
  const salidas = salidasRaw as MovimientoAlmacen[]

  // Handlers para editar/eliminar productos
  const handleEditProducto = useCallback((producto: ProductoAlmacen) => {
    setEditingProducto(producto)
    // TODO: Abrir modal de edición de producto
    toast({
      title: 'Editar producto',
      description: `Editando: ${producto.nombre}`,
    })
  }, [toast])

  const handleDeleteProducto = useCallback((producto: ProductoAlmacen) => {
    setDeletingProducto(producto)
    setShowDeleteModal(true)
  }, [])

  const confirmDeleteProducto = useCallback(async () => {
    if (!deletingProducto?.id) return
    
    try {
      await eliminarProducto(deletingProducto.id)
      toast({
        title: '✅ Producto eliminado',
        description: `${deletingProducto.nombre} ha sido eliminado del almacén`,
      })
      triggerDataRefresh()
    } catch (error) {
      logger.error('Error eliminando producto', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el producto',
        variant: 'destructive',
      })
    }
  }, [deletingProducto, toast, triggerDataRefresh])

  // Handler para exportar datos de almacén
  const handleExportAlmacen = useCallback(() => {
    const data = {
      fecha: new Date().toISOString(),
      productos,
      entradas,
      salidas,
      resumen: {
        totalProductos: productos.length,
        stockTotal: productos.reduce((sum, p) => sum + (p.stock || p.stockActual || 0), 0),
        totalEntradas: entradas.reduce((sum, e) => sum + (e.cantidad || 0), 0),
        totalSalidas: salidas.reduce((sum, s) => sum + (s.cantidad || 0), 0),
      },
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `almacen_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    logger.info('Datos de almacén exportados', { context: 'BentoAlmacen', data: { productos: productos.length } })
    toast({
      title: '✅ Datos exportados',
      description: `Se exportaron ${productos.length} productos y movimientos de almacén`,
    })
  }, [productos, entradas, salidas, toast])

  // Cálculos de métricas
  const totalEntradas = useMemo(() => 
    entradas.reduce((sum, e) => sum + (e.cantidad || 0), 0), [entradas],
  )
  const totalSalidas = useMemo(() => 
    salidas.reduce((sum, s) => sum + (s.cantidad || 0), 0), [salidas],
  )
  const stockActual = useMemo(() => 
    productos.reduce((sum, p) => sum + (p.stock || p.stockActual || 0), 0), [productos],
  )
  const valorStock = useMemo(() => 
    productos.reduce((sum, p) => sum + (p.stock || p.stockActual || 0) * (p.valorUnitario || p.precio || 6300), 0), 
    [productos],
  )

  // Datos de RF/Cortes (basados en el JSON de gg/)
  const cortesRF: CorteRF[] = useMemo(() => [
    { id: '1', fecha: '2025-08-25', corte: 32, observaciones: 'Corte inicial' },
    { id: '2', fecha: '2025-09-08', corte: 124, observaciones: 'Corte mensual' },
    { id: '3', fecha: '2025-09-22', corte: 22, observaciones: 'Corte quincenal' },
    { id: '4', fecha: '2025-10-06', corte: 165, observaciones: 'Corte mensual' },
    { id: '5', fecha: '2025-10-20', corte: 17, observaciones: 'Corte actual' },
  ], [])

  const rfActual = cortesRF.reduce((sum, c) => sum + (c.corte || 0), 0)

  // Filtrado de datos
  const filteredEntradas = useMemo(() => {
    if (!searchQuery) return entradas
    const q = searchQuery.toLowerCase()
    return entradas.filter(e => 
      e.distribuidor?.toLowerCase().includes(q) ||
      e.ordenCompraId?.toLowerCase().includes(q) ||
      e.referencia?.toLowerCase().includes(q),
    )
  }, [entradas, searchQuery])

  const filteredSalidas = useMemo(() => {
    if (!searchQuery) return salidas
    const q = searchQuery.toLowerCase()
    return salidas.filter(s => 
      s.cliente?.toLowerCase().includes(q) ||
      s.destino?.toLowerCase().includes(q) ||
      s.observaciones?.toLowerCase().includes(q),
    )
  }, [salidas, searchQuery])

  const filteredProductos = useMemo(() => {
    if (!searchQuery) return productos
    const q = searchQuery.toLowerCase()
    return productos.filter(p => 
      p.nombre?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.distribuidor?.toLowerCase().includes(q),
    )
  }, [productos, searchQuery])

  // Datos para gráficos
  const movimientosChart = useMemo(() => {
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    return dias.map((dia) => ({
      name: dia,
      entradas: Math.floor(Math.random() * 80) + 20,
      salidas: Math.floor(Math.random() * 60) + 15,
    }))
  }, [])

  const distribucionStock = useMemo(() => {
    const distribuidores = ['Q-MAYA', 'PACMAN', 'A/X', 'CH-MONTE', 'VALLE']
    return distribuidores.map((dist, i) => ({
      name: dist,
      value: Math.floor(Math.random() * 300) + 50,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
  }, [])

  // ============================================================================
  // RENDER DE TABS
  // ============================================================================
  
  const renderEntradas = () => (
    <div className="space-y-6">
      {/* Header de sección */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={24} />
            Registro de Entradas
          </h3>
          <p className="text-white/60 text-sm mt-1">
            {filteredEntradas.length} entradas registradas • {formatNumber(totalEntradas)} unidades totales
          </p>
        </div>
        <Button 
          onClick={() => setShowEntradaModal(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
        >
          <Plus size={18} className="mr-2" />
          Nueva Entrada
        </Button>
      </div>

      {/* Gráfico de entradas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="text-white/80 font-medium mb-4">Tendencia de Entradas (Semanal)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={movimientosChart}>
              <defs>
                <linearGradient id="entradaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="entradas" 
                stroke="#10b981" 
                strokeWidth={2}
                fill="url(#entradaGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <StatCard
            title="Total Entradas"
            value={formatNumber(totalEntradas)}
            subtitle="Unidades ingresadas"
            icon={TrendingUp}
            color="from-emerald-500/20 to-teal-500/20"
            trend="up"
            trendValue="+12% vs mes anterior"
          />
          <StatCard
            title="Órdenes Procesadas"
            value={entradas.length}
            subtitle="Desde distribuidores"
            icon={Package}
            color="from-cyan-500/20 to-blue-500/20"
          />
        </div>
      </div>

      {/* Tabla de entradas */}
      <DataTable
        data={filteredEntradas}
        loading={loadingEntradas}
        emptyMessage="No hay entradas registradas"
        columns={[
          { 
            key: 'fecha', 
            label: 'Fecha',
            render: (item) => (
              <span className="text-white/90 font-medium">
                {formatDate(item.fecha)}
              </span>
            ),
          },
          { 
            key: 'ordenCompraId', 
            label: 'OC',
            render: (item) => (
              <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                {item.ordenCompraId || item.referencia || '-'}
              </Badge>
            ),
          },
          { 
            key: 'distribuidor', 
            label: 'Distribuidor',
            render: (item) => (
              <span className="text-white/80">
                {item.distribuidor || item.origen || '-'}
              </span>
            ),
          },
          { 
            key: 'cantidad', 
            label: 'Cantidad',
            render: (item) => (
              <span className="text-emerald-400 font-bold">
                +{formatNumber(item.cantidad)}
              </span>
            ),
          },
          { 
            key: 'valorTotal', 
            label: 'Valor',
            render: (item) => (
              <span className="text-white/70">
                {formatCurrency((item.cantidad || 0) * (item.valorUnitario || 6300))}
              </span>
            ),
          },
        ]}
      />
    </div>
  )

  const renderStock = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Archive className="text-cyan-400" size={24} />
            Stock Actual
          </h3>
          <p className="text-white/60 text-sm mt-1">
            {productos.length} productos • {formatNumber(stockActual)} unidades en inventario
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-white/20 text-white/70 hover:bg-white/10"
            onClick={handleExportAlmacen}
          >
            <Download size={18} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs de Stock */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Stock Total"
          value={formatNumber(stockActual)}
          subtitle="Unidades disponibles"
          icon={Archive}
          color="from-cyan-500/20 to-blue-500/20"
        />
        <StatCard
          title="Valor Inventario"
          value={formatCurrency(valorStock)}
          subtitle="Al costo de compra"
          icon={Layers}
          color="from-purple-500/20 to-violet-500/20"
        />
        <StatCard
          title="Potencial Ventas"
          value={formatCurrency(stockActual * 10000)}
          subtitle="A precio de venta"
          icon={BarChart3}
          color="from-emerald-500/20 to-teal-500/20"
        />
        <StatCard
          title="Margen Esperado"
          value={formatCurrency((stockActual * 10000) - valorStock)}
          subtitle="Ganancia potencial"
          icon={Zap}
          color="from-amber-500/20 to-orange-500/20"
          trend="up"
          trendValue={valorStock > 0 ? `${(((stockActual * 10000 - valorStock) / valorStock) * 100).toFixed(1)}%` : '0%'}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="text-white/80 font-medium mb-4">Distribución por Origen</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={distribucionStock}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {distribucionStock.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="text-white/80 font-medium mb-4">Movimiento de Inventario</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={movimientosChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="salidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de Stock */}
      <DataTable
        data={filteredProductos}
        loading={loadingProductos}
        emptyMessage="No hay productos en inventario"
        columns={[
          { 
            key: 'sku', 
            label: 'SKU/OC',
            render: (item) => (
              <Badge variant="outline" className="bg-white/10 text-white/90 border-white/20">
                {item.ordenCompraId || item.sku || item.id || '-'}
              </Badge>
            ),
          },
          { 
            key: 'distribuidor', 
            label: 'Origen',
            render: (item) => (
              <span className="text-white/80">{item.distribuidor || '-'}</span>
            ),
          },
          { 
            key: 'stock', 
            label: 'Stock',
            render: (item) => {
              const stock = item.stock || item.stockActual || 0
              const isLow = stock < (item.stockMinimo || 10)
              return (
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isLow ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {formatNumber(stock)}
                  </span>
                  {isLow && <AlertTriangle size={14} className="text-amber-400" />}
                </div>
              )
            },
          },
          { 
            key: 'valorUnitario', 
            label: 'Costo Unit.',
            render: (item) => (
              <span className="text-white/70">
                {formatCurrency(item.valorUnitario || item.precio || 6300)}
              </span>
            ),
          },
          { 
            key: 'valorTotal', 
            label: 'Valor Total',
            render: (item) => {
              const valor = (item.stock || item.stockActual || 0) * (item.valorUnitario || item.precio || 6300)
              return (
                <span className="text-white/90 font-medium">
                  {formatCurrency(valor)}
                </span>
              )
            },
          },
          { 
            key: 'estado', 
            label: 'Estado',
            render: (item) => {
              const stock = item.stock || item.stockActual || 0
              if (stock === 0) {
                return <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">Agotado</Badge>
              }
              if (stock < 10) {
                return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Bajo</Badge>
              }
              return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">OK</Badge>
            },
          },
        ]}
        onEdit={handleEditProducto}
        onDelete={handleDeleteProducto}
      />
    </div>
  )

  const renderSalidas = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingDown className="text-rose-400" size={24} />
            Registro de Salidas
          </h3>
          <p className="text-white/60 text-sm mt-1">
            {filteredSalidas.length} salidas registradas • {formatNumber(totalSalidas)} unidades despachadas
          </p>
        </div>
        <Button 
          onClick={() => setShowSalidaModal(true)}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
        >
          <Plus size={18} className="mr-2" />
          Nueva Salida
        </Button>
      </div>

      {/* Gráfico de salidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="text-white/80 font-medium mb-4">Tendencia de Salidas (Semanal)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={movimientosChart}>
              <defs>
                <linearGradient id="salidaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="salidas" 
                stroke="#ef4444" 
                strokeWidth={2}
                fill="url(#salidaGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <StatCard
            title="Total Salidas"
            value={formatNumber(totalSalidas)}
            subtitle="Unidades despachadas"
            icon={TrendingDown}
            color="from-rose-500/20 to-pink-500/20"
          />
          <StatCard
            title="Clientes Atendidos"
            value={new Set(salidas.map(s => s.cliente || s.destino)).size}
            subtitle="Clientes únicos"
            icon={Box}
            color="from-violet-500/20 to-purple-500/20"
          />
        </div>
      </div>

      {/* Tabla de salidas */}
      <DataTable
        data={filteredSalidas}
        loading={loadingSalidas}
        emptyMessage="No hay salidas registradas"
        columns={[
          { 
            key: 'fecha', 
            label: 'Fecha',
            render: (item) => (
              <span className="text-white/90 font-medium">
                {formatDate(item.fecha)}
              </span>
            ),
          },
          { 
            key: 'cliente', 
            label: 'Cliente/Destino',
            render: (item) => (
              <div className="flex flex-col">
                <span className="text-white/90 font-medium">
                  {item.cliente || item.destino || '-'}
                </span>
                {item.observaciones && (
                  <span className="text-white/50 text-xs truncate max-w-[200px]">
                    {item.observaciones}
                  </span>
                )}
              </div>
            ),
          },
          { 
            key: 'cantidad', 
            label: 'Cantidad',
            render: (item) => (
              <span className="text-rose-400 font-bold">
                -{formatNumber(item.cantidad)}
              </span>
            ),
          },
          { 
            key: 'concepto', 
            label: 'Concepto',
            render: (item) => (
              <Badge variant="outline" className="bg-white/5 text-white/70 border-white/20">
                {item.tipo || 'Venta'}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  )

  const renderRFCortes = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Scissors className="text-amber-400" size={24} />
            RF Actual (Cortes)
          </h3>
          <p className="text-white/60 text-sm mt-1">
            Control de refacciones y cortes de inventario
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          <Plus size={18} className="mr-2" />
          Nuevo Corte
        </Button>
      </div>

      {/* KPIs de RF */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="RF Actual"
          value={formatNumber(rfActual)}
          subtitle="Total acumulado"
          icon={Scissors}
          color="from-amber-500/20 to-orange-500/20"
        />
        <StatCard
          title="Último Corte"
          value={formatNumber(cortesRF[cortesRF.length - 1]?.corte || 0)}
          subtitle={formatDate(cortesRF[cortesRF.length - 1]?.fecha)}
          icon={Calendar}
          color="from-cyan-500/20 to-blue-500/20"
        />
        <StatCard
          title="Cortes Realizados"
          value={cortesRF.length}
          subtitle="Este período"
          icon={CheckCircle2}
          color="from-emerald-500/20 to-teal-500/20"
        />
        <StatCard
          title="Promedio Corte"
          value={formatNumber(Math.round(rfActual / cortesRF.length))}
          subtitle="Unidades por corte"
          icon={BarChart3}
          color="from-purple-500/20 to-violet-500/20"
        />
      </div>

      {/* Gráfico de cortes */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <h4 className="text-white/80 font-medium mb-4">Histórico de Cortes</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={cortesRF}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="fecha" 
              stroke="rgba(255,255,255,0.5)" 
              fontSize={12}
              tickFormatter={(value) => formatDate(value)}
            />
            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
              }}
              labelFormatter={(value) => formatDate(value)}
            />
            <Bar 
              dataKey="corte" 
              fill="#f59e0b" 
              radius={[8, 8, 0, 0]}
              name="Unidades"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla de cortes */}
      <DataTable
        data={cortesRF}
        loading={false}
        emptyMessage="No hay cortes registrados"
        columns={[
          { 
            key: 'fecha', 
            label: 'Fecha',
            render: (item) => (
              <span className="text-white/90 font-medium">
                {formatDate(item.fecha)}
              </span>
            ),
          },
          { 
            key: 'corte', 
            label: 'Cantidad Corte',
            render: (item) => (
              <span className="text-amber-400 font-bold text-lg">
                {formatNumber(item.corte)}
              </span>
            ),
          },
          { 
            key: 'acumulado', 
            label: 'Acumulado',
            render: (item) => {
              const idx = cortesRF.findIndex(c => c.id === item.id)
              const acumulado = cortesRF.slice(0, idx + 1).reduce((s, c) => s + (c.corte || 0), 0)
              return (
                <span className="text-white/70">
                  {formatNumber(acumulado)}
                </span>
              )
            },
          },
          { 
            key: 'observaciones', 
            label: 'Observaciones',
            render: (item) => (
              <span className="text-white/60">
                {item.observaciones || '-'}
              </span>
            ),
          },
          { 
            key: 'estado', 
            label: 'Estado',
            render: () => (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                <CheckCircle2 size={12} className="mr-1" />
                Completado
              </Badge>
            ),
          },
        ]}
      />
    </div>
  )

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header Principal */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              📦 Almacén Monte
            </h1>
            <p className="text-white/60 mt-1">
              Control completo de inventario, entradas, salidas y cortes
            </p>
          </div>

          {/* Barra de búsqueda */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <Input
                placeholder="Buscar en almacén..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <Button variant="outline" className="border-white/20 text-white/70 hover:bg-white/10">
              <Filter size={18} />
            </Button>
            <Button variant="outline" className="border-white/20 text-white/70 hover:bg-white/10">
              <RefreshCw size={18} />
            </Button>
          </div>
        </div>

        {/* Resumen rápido */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Stock Total"
            value={formatNumber(stockActual)}
            icon={Archive}
            color="from-cyan-500/20 to-blue-500/20"
            trend="up"
            trendValue={`+${formatNumber(totalEntradas - totalSalidas)} neto`}
          />
          <StatCard
            title="Entradas"
            value={formatNumber(totalEntradas)}
            icon={TrendingUp}
            color="from-emerald-500/20 to-teal-500/20"
          />
          <StatCard
            title="Salidas"
            value={formatNumber(totalSalidas)}
            icon={TrendingDown}
            color="from-rose-500/20 to-pink-500/20"
          />
          <StatCard
            title="RF Actual"
            value={formatNumber(rfActual)}
            icon={Scissors}
            color="from-amber-500/20 to-orange-500/20"
          />
        </div>

        {/* Visualización 3D Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-br from-cyan-500/5 to-purple-500/5"
        >
          <div className="p-4 border-b border-white/10 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-semibold">Visualización de Inventario</span>
          </div>
          <Panel3DWrapper
            componentType="WorkflowVisualizer3D"
            fallback={
              <div className="h-[160px] bg-gradient-to-br from-cyan-500/5 to-blue-500/5 flex items-center justify-center">
                <Package className="w-12 h-12 text-cyan-400/30" />
              </div>
            }
            height="160px"
            className="bg-black/40"
          />
        </motion.div>

        {/* Navegación de Tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? tab.color : ''} />
              {tab.label}
              {tab.id === 'entradas' && (
                <Badge variant="secondary" className="ml-1 bg-emerald-500/20 text-emerald-300 text-xs">
                  {entradas.length}
                </Badge>
              )}
              {tab.id === 'salidas' && (
                <Badge variant="secondary" className="ml-1 bg-rose-500/20 text-rose-300 text-xs">
                  {salidas.length}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Contenido del Tab Activo */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'entradas' && renderEntradas()}
            {activeTab === 'stock' && renderStock()}
            {activeTab === 'salidas' && renderSalidas()}
            {activeTab === 'rf' && renderRFCortes()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Modals */}
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

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletingProducto(null)
        }}
        onConfirm={confirmDeleteProducto}
        title="¿Eliminar producto?"
        description="Esta acción eliminará permanentemente el producto del almacén."
        itemName={deletingProducto?.nombre || deletingProducto?.sku || ''}
        itemType="producto"
      />
    </div>
  )
}
