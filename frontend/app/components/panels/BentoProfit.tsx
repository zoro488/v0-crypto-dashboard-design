"use client"

import { useState, lazy, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, PieChart, BarChart3, Download, ArrowUpRight, Target, Zap, DollarSign, Activity, Gauge } from "lucide-react"
import { ProfitWaterfallChart } from "@/frontend/app/components/visualizations/ProfitWaterfallChart"
import {
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useVentasData, useBancoData } from "@/frontend/app/lib/firebase/firestore-hooks.service"
import { Skeleton } from "@/frontend/app/components/ui/skeleton"
import CasaCambioWidget from "@/frontend/app/components/widgets/CasaCambioWidget"

// Importar el nuevo sistema de arbitraje Panel Profit
const ProfitCommandCenter = lazy(() => 
  import("@/frontend/app/components/profit/ProfitCommandCenter").then(mod => ({ default: mod.ProfitCommandCenter }))
)

const monthlyProfitData = [
  { mes: "Ene", utilidadBruta: 450000, utilidadNeta: 320000, gastos: 130000 },
  { mes: "Feb", utilidadBruta: 520000, utilidadNeta: 380000, gastos: 140000 },
  { mes: "Mar", utilidadBruta: 680000, utilidadNeta: 510000, gastos: 170000 },
  { mes: "Abr", utilidadBruta: 750000, utilidadNeta: 580000, gastos: 170000 },
  { mes: "May", utilidadBruta: 820000, utilidadNeta: 640000, gastos: 180000 },
  { mes: "Jun", utilidadBruta: 950000, utilidadNeta: 760000, gastos: 190000 },
]

const profitByCategory = [
  { name: "Ventas Directas", value: 4500000, color: "#3b82f6" },
  { name: "Tipo de Cambio", value: 2800000, color: "#10b981" },
  { name: "Fletes", value: 1200000, color: "#f59e0b" },
  { name: "Otros", value: 850000, color: "#8b5cf6" },
]

const roiData = [
  { producto: "Producto A", inversion: 250000, ganancia: 480000, roi: 92 },
  { producto: "Producto B", inversion: 180000, ganancia: 320000, roi: 77 },
  { producto: "Producto C", inversion: 320000, ganancia: 580000, roi: 81 },
  { producto: "Producto D", inversion: 150000, ganancia: 290000, roi: 93 },
]

export default function BentoProfit() {
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("6m")

  const { data: ventasRaw, loading: loadingVentas, error: errorVentas } = useVentasData()
  const { data: bancoProfitData, loading: loadingBanco, stats } = useBancoData("profit")

  interface VentaProfit {
    precioVentaUnidad?: number
    precioCompraUnidad?: number
    precioFlete?: number
    cantidad?: number
  }

  const ventas = ventasRaw as VentaProfit[]
  const loading = loadingVentas || loadingBanco

  const utilidadNeta =
    ventas.length > 0
      ? ventas.reduce(
          (acc, v) => acc + ((v.precioVentaUnidad || 0) - (v.precioCompraUnidad || 0) - (v.precioFlete || 0)) * (v.cantidad || 0),
          0,
        )
      : 760000 // Fallback value

  const totalIngresos = stats?.totalIngresos || 2500000
  const totalGastos = stats?.totalGastos || 850000
  const margenPromedio = totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 42.5

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const tabs = [
    { id: "overview", label: "Resumen", icon: PieChart },
    { id: "arbitrage", label: "Panel Profit", icon: Activity },
    { id: "analysis", label: "Análisis Detallado", icon: BarChart3 },
    { id: "casa-cambio", label: "Casa de Cambio", icon: DollarSign },
    { id: "roi", label: "ROI por Producto", icon: Target },
    { id: "projections", label: "Proyecciones", icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Panel Profit</h1>
          <p className="text-white/60">Análisis avanzado de rentabilidad y utilidades</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="1m">Último Mes</option>
            <option value="3m">3 Meses</option>
            <option value="6m">6 Meses</option>
            <option value="1y">1 Año</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-premium px-6 py-2 text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
          className="glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-green-500/10 to-emerald-500/5 hover:scale-105 transition-transform duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-sm font-medium">Utilidad Neta</span>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <TrendingUp className="w-5 h-5 text-green-400" />
            </motion.div>
          </div>
          <p className="text-4xl font-bold text-white tracking-tight mb-2">${(utilidadNeta / 1000000).toFixed(1)}M</p>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <ArrowUpRight className="w-4 h-4" />
            <span>+28.5% vs mes anterior</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 hover:scale-105 transition-transform duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-sm font-medium">Margen Promedio</span>
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-4xl font-bold text-white tracking-tight mb-2">{margenPromedio.toFixed(1)}%</p>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(margenPromedio, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-purple-500/10 to-pink-500/5"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-sm font-medium">ROI Promedio</span>
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-4xl font-bold text-white tracking-tight mb-2">85.8%</p>
          <div className="flex items-center gap-2 text-sm text-purple-400">
            <Zap className="w-4 h-4" />
            <span>Excelente rendimiento</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-orange-500/10 to-amber-500/5"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-sm font-medium">Proyección Anual</span>
            <TrendingUp className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-4xl font-bold text-white tracking-tight mb-2">$150M</p>
          <div className="flex items-center gap-2 text-sm text-orange-400">
            <span>Basado en tendencia actual</span>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto bg-black/20 p-2 rounded-3xl backdrop-blur-xl border border-white/5 no-scrollbar">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap relative ${
              activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div layoutId="activeProfitTab" className="absolute inset-0 bg-white/10 rounded-2xl" />
            )}
            <tab.icon className={`w-4 h-4 relative z-10 ${activeTab === tab.id ? "text-cyan-400" : ""}`} />
            <span className="relative z-10">{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="min-h-[600px]"
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Profit Trend */}
              <div className="glass p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4">Tendencia de Utilidades (6 Meses)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyProfitData}>
                    <defs>
                      <linearGradient id="colorUtilidadBruta" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorUtilidadNeta" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="mes" stroke="#ffffff40" />
                    <YAxis stroke="#ffffff40" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="utilidadBruta"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorUtilidadBruta)"
                    />
                    <Area
                      type="monotone"
                      dataKey="utilidadNeta"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorUtilidadNeta)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Profit Distribution */}
              <div className="glass p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4">Distribución de Utilidades</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={profitByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {profitByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "arbitrage" && (
            <Suspense fallback={
              <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-64" />
              </div>
            }>
              <ProfitCommandCenter />
            </Suspense>
          )}

          {activeTab === "casa-cambio" && (
            <CasaCambioWidget />
          )}

          {activeTab === "roi" && (
            <div className="glass p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-6">ROI por Producto</h3>
              <div className="space-y-4">
                {roiData.map((item, index) => (
                  <motion.div
                    key={item.producto}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">{item.producto}</span>
                      <span className="text-2xl font-bold text-green-400">{item.roi}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/40">Inversión</span>
                        <p className="text-white font-medium">${item.inversion.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-white/40">Ganancia</span>
                        <p className="text-green-400 font-medium">${item.ganancia.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                        style={{ width: `${item.roi}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Profit Waterfall Chart - Premium Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="glass p-6 rounded-2xl border border-white/5 bg-black/20 mt-6"
      >
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">Cascada de Ganancias</h3>
          <p className="text-sm text-white/60">Desglose visual de ingresos y gastos</p>
        </div>
        <ProfitWaterfallChart width={900} height={500} className="w-full" />
      </motion.div>
    </div>
  )
}
