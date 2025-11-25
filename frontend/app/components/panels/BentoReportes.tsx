"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { FileText, Download, TrendingUp, BarChart3, PieChart, LineChart, Sparkles, Share2, Clock } from "lucide-react"
import { ReportsTimeline } from "@/frontend/app/components/visualizations/ReportsTimeline"
import {
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  useVentasData,
  useOrdenesCompraData,
  useDistribuidoresData,
  useClientesData,
  useAlmacenData,
} from "@/frontend/app/lib/firebase/firestore-hooks.service"
import { Skeleton } from "@/frontend/app/components/ui/skeleton"

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#ef4444"]

export default function BentoReportes() {
  const { data: ventas = [], loading: loadingVentas } = useVentasData()
  const { data: ordenesCompra = [], loading: loadingOC } = useOrdenesCompraData()
  const { data: distribuidores = [], loading: loadingDist } = useDistribuidoresData()
  const { data: clientes = [], loading: loadingClientes } = useClientesData()
  const { data: productos = [], loading: loadingProductos } = useAlmacenData()

  const [activeTab, setActiveTab] = useState<"overview" | "detailed" | "ai">("overview")
  const [selectedPeriod, setSelectedPeriod] = useState("month")

  const loading = loadingVentas || loadingOC || loadingDist || loadingClientes || loadingProductos

  if (loading) {
    return (
      <div className="bento-container space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const totalVentas = ventas.reduce((sum, v) => sum + (v.precioTotalVenta || 0), 0)
  const totalCompras = ordenesCompra.reduce((sum, oc) => sum + (oc.costoTotal || 0), 0)
  const totalDeuda = distribuidores.reduce((sum, d) => sum + (d.deudaTotal || 0), 0)
  const margenPromedio = totalVentas > 0 ? ((totalVentas - totalCompras) / totalVentas) * 100 : 0

  const productosData = productos.map((p) => ({
    ...p,
    value: p.stockActual || 0,
  }))

  const stats = [
    {
      title: "Total Ventas",
      value: `$${totalVentas.toLocaleString()}`,
      change: "+18.2%",
      trend: "up",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Total Compras",
      value: `$${totalCompras.toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
      icon: BarChart3,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Deuda Pendiente",
      value: `$${totalDeuda.toLocaleString()}`,
      change: "-5.3%",
      trend: "down",
      icon: FileText,
      color: "from-orange-500 to-amber-500",
    },
    {
      title: "Margen Promedio",
      value: `${margenPromedio.toFixed(1)}%`,
      change: "+3.1%",
      trend: "up",
      icon: PieChart,
      color: "from-purple-500 to-pink-500",
    },
  ]

  const tabs = [
    { id: "overview", label: "Vista General", icon: BarChart3 },
    { id: "detailed", label: "Análisis Detallado", icon: LineChart },
    { id: "ai", label: "Insights IA", icon: Sparkles },
  ]

  return (
    <div className="bento-container">
      {/* Header with tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-full glass-transmission p-6 ambient-glow"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Reportes y Análisis</h2>
            <p className="text-white/60">Insights en tiempo real de Chronos</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-white/5 text-white px-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
            >
              <option value="week">Esta Semana</option>
              <option value="month">Este Mes</option>
              <option value="quarter">Este Trimestre</option>
              <option value="year">Este Año</option>
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-premium px-4 py-2 rounded-xl text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all
                ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats cards */}
      <div className="bento-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="crystal-card p-6 ambient-glow group relative overflow-hidden"
            whileHover={{ y: -4 }}
          >
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-sm font-medium ${stat.trend === "up" ? "text-green-400" : "text-red-400"}`}>
                  {stat.change}
                </span>
              </div>

              <h3 className="text-white/60 text-sm mb-2">{stat.title}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content based on active tab */}
      {activeTab === "overview" && (
        <>
          {/* Sales trend chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bento-lg crystal-card p-6 ambient-glow"
          >
            <h3 className="text-xl font-bold text-white mb-4">Tendencia de Ventas vs Compras</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ventas}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#fff" opacity={0.5} />
                <YAxis stroke="#fff" opacity={0.5} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="precioTotalVenta"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorVentas)"
                />
                <Area type="monotone" dataKey="costoTotal" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCompras)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Product distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bento-md crystal-card p-6 ambient-glow"
          >
            <h3 className="text-xl font-bold text-white mb-4">Distribución de Productos</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={productosData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {productosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Performance radar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bento-md crystal-card p-6 ambient-glow"
          >
            <h3 className="text-xl font-bold text-white mb-4">Performance General</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={ventas}>
                <PolarGrid stroke="#ffffff20" />
                <PolarAngleAxis dataKey="subject" stroke="#fff" tick={{ fill: "#ffffff80" }} />
                <PolarRadiusAxis stroke="#ffffff20" />
                <Radar name="Actual" dataKey="precioTotalVenta" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </>
      )}

      {activeTab === "detailed" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bento-full crystal-card p-8 text-center ambient-glow"
        >
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-blue-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Análisis Detallado</h3>
          <p className="text-white/60">Visualización de datos en profundidad próximamente</p>
        </motion.div>
      )}

      {activeTab === "ai" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bento-full crystal-card p-8 ambient-glow"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">AI Insights</h3>
              <p className="text-white/60">Análisis inteligente de tus datos</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: TrendingUp,
                title: "Tendencia Positiva Detectada",
                description:
                  "Las ventas aumentaron 18.2% respecto al mes anterior. Se recomienda incrementar inventario.",
                confidence: 95,
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: Clock,
                title: "Stock Crítico Predicho",
                description: "El producto principal alcanzará stock crítico en 7 días según el ritmo actual de ventas.",
                confidence: 87,
                color: "from-orange-500 to-amber-500",
              },
              {
                icon: Share2,
                title: "Oportunidad de Optimización",
                description:
                  "Distribuidor Q-MAYA tiene patrón de compra regular. Considerar oferta de crédito preferencial.",
                confidence: 92,
                color: "from-blue-500 to-cyan-500",
              },
            ].map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${insight.color} flex-shrink-0`}>
                    <insight.icon className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold">{insight.title}</h4>
                      <span className="text-xs text-white/60">Confianza: {insight.confidence}%</span>
                    </div>
                    <p className="text-white/70 text-sm">{insight.description}</p>

                    <div className="mt-3 flex gap-2">
                      <button className="btn-premium px-4 py-1.5 text-xs rounded-lg">Ver Detalles</button>
                      <button className="bg-white/5 hover:bg-white/10 px-4 py-1.5 text-xs rounded-lg text-white transition-all">
                        Aplicar Recomendación
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Reports Timeline - Premium Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="glass p-6 rounded-2xl border border-white/5 bg-black/20 mt-6"
      >
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">Línea de Tiempo de Reportes</h3>
          <p className="text-sm text-white/60">Cronología espiral de eventos del negocio</p>
        </div>
        <ReportsTimeline width={900} height={600} className="w-full" />
      </motion.div>
    </div>
  )
}
