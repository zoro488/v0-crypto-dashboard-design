"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Package, TrendingUp, TrendingDown, Archive, Edit, Plus, Box, Activity, BarChart3, Zap, RefreshCw } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useProductos, useEntradasAlmacen, useSalidasAlmacen } from "@/frontend/app/lib/firebase/firestore-hooks.service"
import { Skeleton } from "@/frontend/app/components/ui/skeleton"
import CreateEntradaAlmacenModal from "@/frontend/app/components/modals/CreateEntradaAlmacenModal"
import CreateSalidaAlmacenModal from "@/frontend/app/components/modals/CreateSalidaAlmacenModal"
import { InventoryHeatGrid } from "@/frontend/app/components/visualizations/InventoryHeatGrid"
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"
import { QuickStatWidget, QuickStatsGrid } from "@/app/components/widgets/QuickStatWidget"
import { MiniChartWidget } from "@/app/components/widgets/MiniChartWidget"
import { ActivityFeedWidget, ActivityItem } from "@/app/components/widgets/ActivityFeedWidget"

// Interfaces para tipado
interface MovimientoAlmacen {
  id?: string
  cantidad?: number
  fecha?: string | Date
  origen?: string
  destino?: string
  valorUnitario?: number
  valorTotal?: number
  referencia?: string
  [key: string]: unknown
}

// Helper para formatear fechas de forma segura
const formatDate = (date: string | Date | undefined): string => {
  if (!date) return "-"
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return "-"
  }
}

// Helper para formatear números de forma segura
const formatNumber = (value: number | undefined): string => {
  return (value ?? 0).toLocaleString()
}

interface ProductoAlmacen {
  id?: string
  nombre?: string
  stock?: number
  stockActual?: number
  valorUnitario?: number
  precio?: number
  [key: string]: unknown
}

const tabs = [
  { id: "entradas", label: "Entradas", icon: TrendingUp },
  { id: "salidas", label: "Salidas", icon: TrendingDown },
  { id: "stock", label: "Stock Actual", icon: Archive },
  { id: "modificaciones", label: "Modificaciones", icon: Edit },
]

// Colores para gráficos
const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6']

// Datos de ejemplo para gráficos de tendencia
const generateTrendData = (baseValue: number, variance: number = 20) => {
  return Array.from({ length: 7 }, (_, i) => ({
    name: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i],
    value: Math.max(0, baseValue + Math.floor(Math.random() * variance * 2) - variance),
    entrada: Math.floor(Math.random() * 50) + 10,
    salida: Math.floor(Math.random() * 40) + 5,
  }))
}

export default function BentoAlmacen() {
  const [activeTab, setActiveTab] = useState("entradas")
  const [searchQuery, setSearchQuery] = useState("")
  const [showEntradaModal, setShowEntradaModal] = useState(false)
  const [showSalidaModal, setShowSalidaModal] = useState(false)

  const { data: productosRaw = [], loading: loadingProductos } = useProductos()
  const { data: entradasRaw = [], loading: loadingEntradas } = useEntradasAlmacen()
  const { data: salidasRaw = [], loading: loadingSalidas } = useSalidasAlmacen()

  // Casting seguro
  const productos = productosRaw as ProductoAlmacen[]
  const entradas = entradasRaw as MovimientoAlmacen[]
  const salidas = salidasRaw as MovimientoAlmacen[]

  const totalEntradas = Array.isArray(entradas) ? entradas.reduce((sum, e) => sum + (e.cantidad || 0), 0) : 0
  const totalSalidas = Array.isArray(salidas) ? salidas.reduce((sum, s) => sum + (s.cantidad || 0), 0) : 0
  const stockActual = Array.isArray(productos)
    ? productos.reduce((sum, p) => sum + (p.stock || p.stockActual || 0), 0)
    : 0
  const valorStock = Array.isArray(productos)
    ? productos.reduce((sum, p) => sum + (p.stock || p.stockActual || 0) * (p.valorUnitario || p.precio || 0), 0)
    : 0
  const potencialVentas = stockActual * 10000

  // Datos para gráficos
  const trendData = useMemo(() => generateTrendData(stockActual / 7), [stockActual])
  
  // Datos para el pie chart de distribución de stock
  const stockDistribution = useMemo(() => {
    if (!Array.isArray(productos) || productos.length === 0) return []
    return productos.slice(0, 5).map((p, i) => ({
      name: p.nombre || `Producto ${i + 1}`,
      value: p.stock || p.stockActual || 0,
      color: CHART_COLORS[i % CHART_COLORS.length]
    }))
  }, [productos])

  // Datos para el activity feed
  const recentActivity: ActivityItem[] = useMemo(() => {
    const activities: ActivityItem[] = []
    
    entradas.slice(0, 3).forEach((e, i) => {
      activities.push({
        id: `entrada-${e.id || i}`,
        type: 'stock',
        title: 'Nueva entrada registrada',
        description: `+${e.cantidad || 0} unidades desde ${e.origen || 'origen'}`,
        timestamp: e.fecha ? new Date(e.fecha as string) : new Date(),
        status: 'success'
      })
    })
    
    salidas.slice(0, 3).forEach((s, i) => {
      activities.push({
        id: `salida-${s.id || i}`,
        type: 'stock',
        title: 'Salida procesada',
        description: `-${s.cantidad || 0} unidades hacia ${s.destino || 'destino'}`,
        timestamp: s.fecha ? new Date(s.fecha as string) : new Date(),
        status: 'pending'
      })
    })
    
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5)
  }, [entradas, salidas])

  const loading = loadingProductos || loadingEntradas || loadingSalidas

  if (loading) {
    return (
      <div className="bento-container space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="bento-container space-y-6">
      {/* Immersive Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-full crystal-card p-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 animate-gradient" />
        <div className="absolute inset-0 backdrop-blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-900/20 relative group">
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Package className="w-8 h-8 text-white relative z-10" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Centro de Distribución</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Operativo
                </span>
                <span className="text-white/40 text-sm">Última actualización: Hace 2 min</span>
              </div>
            </div>
          </div>

          <div className="flex items-end flex-col">
            <p className="text-white/40 text-sm font-medium uppercase tracking-wider">Producto Estrella</p>
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
              {productos.length > 0 ? productos[0].nombre : "Cargando..."}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Gamified KPI Grid with Premium Widgets */}
      <div className="bento-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStatWidget
          title="Entradas Totales"
          value={totalEntradas}
          suffix=" unid."
          change={12.5}
          icon={TrendingUp}
          color="green"
          sparklineData={trendData.map(d => d.entrada)}
          delay={0.1}
        />
        <QuickStatWidget
          title="Salidas Totales"
          value={totalSalidas}
          suffix=" unid."
          change={-8.3}
          icon={TrendingDown}
          color="red"
          sparklineData={trendData.map(d => d.salida)}
          delay={0.2}
        />
        <QuickStatWidget
          title="Stock Disponible"
          value={stockActual}
          suffix=" unid."
          change={5.2}
          icon={Box}
          color="cyan"
          sparklineData={trendData.map(d => d.value)}
          delay={0.3}
        />
        <QuickStatWidget
          title="Valor Total"
          value={valorStock}
          prefix="$"
          change={15.7}
          icon={Archive}
          color="purple"
          sparklineData={trendData.map(d => d.value * 100)}
          delay={0.4}
        />
      </div>

      {/* Premium Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Tendencias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass p-6 rounded-2xl border border-white/5 bg-black/20"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Movimiento de Inventario</h3>
              <p className="text-sm text-white/50">Entradas vs Salidas últimos 7 días</p>
            </div>
            <motion.button
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSalida" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#fff" opacity={0.3} fontSize={12} />
              <YAxis stroke="#fff" opacity={0.3} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(15, 23, 42, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="entrada" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorEntrada)" 
                name="Entradas"
              />
              <Area 
                type="monotone" 
                dataKey="salida" 
                stroke="#f43f5e" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSalida)" 
                name="Salidas"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Distribución de Stock - Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass p-6 rounded-2xl border border-white/5 bg-black/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-violet-500/20">
              <BarChart3 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Distribución</h3>
              <p className="text-xs text-white/50">Por producto</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={stockDistribution}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {stockDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(15, 23, 42, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '8px' 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {stockDistribution.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-white/70 truncate max-w-[100px]">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Activity Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-1"
        >
          <ActivityFeedWidget
            title="Actividad Reciente"
            activities={recentActivity}
            maxItems={5}
          />
        </motion.div>

        {/* Mini Charts Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <MiniChartWidget
            title="Rotación de Stock"
            subtitle={`${Math.round((totalSalidas / Math.max(stockActual, 1)) * 100)}%`}
            type="donut"
            data={[{ name: 'Salidas', value: totalSalidas }, { name: 'Disponible', value: stockActual - totalSalidas > 0 ? stockActual - totalSalidas : 0 }]}
            color="cyan"
          />
          <MiniChartWidget
            title="Eficiencia"
            subtitle="87%"
            type="area"
            data={trendData.map((d, i) => ({ name: d.name, value: Math.random() * 30 + 70 }))}
            color="green"
          />
          <MiniChartWidget
            title="Productos Bajo Stock"
            subtitle={`${productos.filter(p => (p.stock || p.stockActual || 0) < 20).length} productos`}
            type="bar"
            data={trendData.map((d, i) => ({ name: d.name, value: Math.floor(Math.random() * 10) }))}
            color="orange"
          />
          <MiniChartWidget
            title="Valor Promedio"
            subtitle={`$${productos.length > 0 ? Math.round(valorStock / productos.length).toLocaleString() : 0}`}
            type="line"
            data={trendData.map((d, i) => ({ name: d.name, value: d.value * 100 }))}
            color="purple"
          />
        </div>
      </div>

      {/* Controls & Tabs - Similar structure to Banco but customized */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-black/20 p-2 rounded-3xl backdrop-blur-xl border border-white/5">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap relative
                ${activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white hover:bg-white/5"}
              `}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabAlmacen"
                  className="absolute inset-0 bg-white/10 rounded-2xl shadow-inner shadow-white/5"
                />
              )}
              <tab.icon className={`w-4 h-4 relative z-10 ${activeTab === tab.id ? "text-cyan-400" : ""}`} />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>
        {/* Search bar logic same as Banco */}
      </div>

      {/* Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="bento-full min-h-[500px]"
      >
        {activeTab === "entradas" && (
          <div className="crystal-card p-1 relative overflow-hidden group">
            <div className="flex items-center justify-between p-6 relative z-10">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Entradas de Mercancía</h3>
                <p className="text-white/40 text-sm mt-1">Registro detallado de recepción de productos</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEntradaModal(true)}
                className="btn-premium bg-cyan-500 hover:bg-cyan-400 text-white border-none flex items-center gap-2 shadow-lg shadow-cyan-900/20"
              >
                <Plus className="w-4 h-4" />
                Nueva Entrada
              </motion.button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      ID
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Origen
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Valor Unit.
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Ref
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entradas.map((entrada, index) => (
                    <motion.tr
                      key={entrada.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group/row hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 text-white/80">{entrada.id}</td>
                      <td className="px-6 py-4 text-white/60">{formatDate(entrada.fecha)}</td>
                      <td className="px-6 py-4 text-white/80">{entrada.origen ?? "-"}</td>
                      <td className="px-6 py-4 text-white/80">{entrada.cantidad ?? 0}</td>
                      <td className="px-6 py-4 text-white/80">${formatNumber(entrada.valorUnitario)}</td>
                      <td className="px-6 py-4 text-white/80">${formatNumber(entrada.valorTotal)}</td>
                      <td className="px-6 py-4 text-blue-400">{entrada.referencia ?? "-"}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "salidas" && (
          <div className="crystal-card p-1 relative overflow-hidden group">
            <div className="flex items-center justify-between p-6 relative z-10">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Salidas de Mercancía</h3>
                <p className="text-white/40 text-sm mt-1">Historial de despachos y ventas</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSalidaModal(true)}
                className="btn-premium bg-orange-500 hover:bg-orange-400 text-white border-none flex items-center gap-2 shadow-lg shadow-orange-900/20"
              >
                <TrendingDown className="w-4 h-4" />
                Nueva Salida
              </motion.button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      ID
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Destino
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Valor Unit.
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Ref
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {salidas.map((salida, index) => (
                    <motion.tr
                      key={salida.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group/row hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 text-white/80">{salida.id}</td>
                      <td className="px-6 py-4 text-white/60">{formatDate(salida.fecha)}</td>
                      <td className="px-6 py-4 text-white/80">{salida.destino ?? "-"}</td>
                      <td className="px-6 py-4 text-white/80">{salida.cantidad ?? 0}</td>
                      <td className="px-6 py-4 text-white/80">${formatNumber(salida.valorUnitario)}</td>
                      <td className="px-6 py-4 text-white/80">${formatNumber(salida.valorTotal)}</td>
                      <td className="px-6 py-4 text-blue-400">{salida.referencia ?? "-"}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "stock" && (
          <div className="crystal-card p-1 relative overflow-hidden group">
            <div className="flex items-center justify-between p-6 relative z-10">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Stock Actual</h3>
                <p className="text-white/40 text-sm mt-1">Estado del inventario en tiempo real</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      ID
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Origen
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Disponible
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Valor Unit.
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="text-center py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {productos.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group/row hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 text-white/80">{item.id}</td>
                      <td className="px-6 py-4 text-white/80">{item.nombre ?? "-"}</td>
                      <td className="px-6 py-4 text-white/60">Múltiples</td>
                      <td className="px-6 py-4 text-white/80">{item.stock ?? item.stockActual ?? 0}</td>
                      <td className="px-6 py-4 text-white/80">${formatNumber(item.valorUnitario ?? item.precio)}</td>
                      <td className="px-6 py-4 text-white/80">
                        ${formatNumber((item.stock ?? item.stockActual ?? 0) * (item.valorUnitario ?? item.precio ?? 0))}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            (item.stock ?? item.stockActual ?? 0) < 20
                              ? "bg-red-500/20 text-red-400"
                              : (item.stock ?? item.stockActual ?? 0) < 50
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {(item.stock ?? item.stockActual ?? 0) < 20
                            ? "Bajo"
                            : (item.stock ?? item.stockActual ?? 0) < 50
                              ? "Medio"
                              : "Alto"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "modificaciones" && <ModificacionesTable />}
      </motion.div>

      {showEntradaModal && (
        <CreateEntradaAlmacenModal isOpen={showEntradaModal} onClose={() => setShowEntradaModal(false)} />
      )}

      {showSalidaModal && (
        <CreateSalidaAlmacenModal isOpen={showSalidaModal} onClose={() => setShowSalidaModal(false)} />
      )}

      {/* Inventory Heat Grid - Premium Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="glass p-6 rounded-2xl border border-white/5 bg-black/20 mt-6"
      >
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">Mapa de Calor de Inventario</h3>
          <p className="text-sm text-white/60">Visualización isométrica de niveles de stock</p>
        </div>
        <InventoryHeatGrid className="w-full" />
      </motion.div>
    </div>
  )
}

function ModificacionesTable() {
  return (
    <div className="crystal-card p-1 relative overflow-hidden group">
      <div className="flex items-center justify-between p-6 relative z-10">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Modificaciones Manuales</h3>
          <p className="text-white/40 text-sm mt-1">Registro de ajustes de inventario</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-premium bg-purple-500 hover:bg-purple-400 text-white border-none flex items-center gap-2 shadow-lg shadow-purple-900/20"
        >
          <Edit className="w-4 h-4" />
          Nuevo Ajuste
        </motion.button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                Fecha
              </th>
              <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">Tipo</th>
              <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                Cantidad
              </th>
              <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                Motivo
              </th>
              <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                Usuario
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">{/* Placeholder for actual data */}</tbody>
        </table>
      </div>
    </div>
  )
}
