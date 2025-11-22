"use client"

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/lib/store/useAppStore"
import { TrendingUp, DollarSign, Package, ShoppingCart, Zap, PieChart, Filter } from "lucide-react"
import {
  AreaChart,
  Area,
  ResponsiveContainer,
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
} from "recharts"
import { useRef, useState, useEffect } from "react"
import { useVentas, useOrdenesCompra, useProductos } from "@/lib/firebase/firestore-hooks.service"
import { Skeleton } from "@/components/ui/skeleton"
import CreateOrdenCompraModal from "@/components/modals/CreateOrdenCompraModal"
import CreateVentaModal from "@/components/modals/CreateVentaModal"
import CreateTransferenciaModal from "@/components/modals/CreateTransferenciaModal"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
        <p className="text-white/70 text-sm mb-2 font-medium tracking-wide uppercase">{label}</p>
        {payload.map((entry: any, index: number) => (
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
}

export default function BentoDashboard() {
  const { bancos } = useAppStore()
  const { ventas, loading: loadingVentas } = useVentas()
  const { ordenesCompra, loading: loadingOC } = useOrdenesCompra()
  const { productos, loading: loadingProductos } = useProductos()

  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const [showChronos, setShowChronos] = useState(true)
  const [timeRange, setTimeRange] = useState("1M")

  const [isOrdenModalOpen, setIsOrdenModalOpen] = useState(false)
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false)
  const [isTransferenciaModalOpen, setIsTransferenciaModalOpen] = useState(false)

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowChronos(false)
    }, 3500)
    return () => clearTimeout(timer)
  }, [])

  const capitalTotal = bancos.reduce((acc, b) => acc + b.saldo, 0)
  const ventasMes = ventas?.reduce((acc, v) => acc + v.montoTotal, 0) || 0
  const stockActual = productos?.reduce((acc, p) => acc + p.stock, 0) || 0
  const ordenesActivas = ordenesCompra?.filter((oc) => oc.estado === "pendiente").length || 0

  const mockChartData =
    ventas?.slice(-7).map((v, i) => ({
      name: new Date(v.fecha.seconds * 1000).toLocaleDateString("es-MX", { month: "short" }),
      value: v.montoTotal,
      sales: v.precioVenta * v.cantidad,
      profit: v.ganancia || 0,
    })) || []

  const radarData = [
    { subject: "Ventas", A: 120, fullMark: 150 },
    { subject: "Compras", A: 98, fullMark: 150 },
    { subject: "Stock", A: 86, fullMark: 150 },
    { subject: "Distribución", A: 99, fullMark: 150 },
    { subject: "Profit", A: 85, fullMark: 150 },
    { subject: "Clientes", A: 65, fullMark: 150 },
  ]

  const stats = [
    {
      title: "Capital Total",
      value: `$${capitalTotal.toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "from-blue-500 via-cyan-400 to-teal-400",
    },
    {
      title: "Ventas del Mes",
      value: `$${ventasMes.toLocaleString()}`,
      change: "+8.3%",
      trend: "up",
      icon: TrendingUp,
      color: "from-emerald-500 via-green-400 to-lime-400",
    },
    {
      title: "Stock Actual",
      value: stockActual.toString(),
      change: "-3.2%",
      trend: "down",
      icon: Package,
      color: "from-violet-500 via-purple-400 to-fuchsia-400",
    },
    {
      title: "Órdenes Activas",
      value: ordenesActivas.toString(),
      change: "+15.8%",
      trend: "up",
      icon: ShoppingCart,
      color: "from-amber-500 via-orange-400 to-red-400",
    },
  ]

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
    <div ref={containerRef} className="bento-container relative min-h-screen">
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
                      textShadow: "0 0 60px rgba(10, 132, 255, 0.3)",
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
          <div className="apple-card h-full group cursor-pointer">
            <div className="flex items-start justify-between mb-6">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div
                className={`
                px-3 py-1 rounded-full text-xs font-semibold
                ${stat.trend === "up" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}
              `}
              >
                {stat.change}
              </div>
            </div>

            <p className="text-caption text-white/50 mb-2">{stat.title}</p>
            <h3 className="text-title text-white">{stat.value}</h3>
          </div>
        </motion.div>
      ))}

      <motion.div layout className="col-span-12 lg:col-span-8 row-span-2 h-[500px] apple-card relative">
        <div className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h3 className="text-title text-white mb-1">Análisis de Flujo</h3>
            <p className="text-caption text-white/40">Monitoreo financiero en tiempo real</p>
          </div>

          <div className="flex gap-1 p-1 apple-glass rounded-xl">
            {["1D", "1W", "1M", "1Y"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`
                  px-5 py-2 rounded-lg text-caption font-semibold transition-all duration-300
                  ${
                    timeRange === range
                      ? "bg-blue-500 text-white shadow-lg"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[400px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
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
                cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorValue)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }}
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#colorProfit)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }}
                animationDuration={1500}
                animationBegin={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Bancos Grid - Medium */}
      <motion.div
        layout
        className="col-span-12 lg:col-span-4 row-span-1 apple-card p-6 rounded-[32px] border border-white/5 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Bancos</h3>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Filter className="w-4 h-4 text-white/60" />
          </button>
        </div>
        <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
          {bancos.slice(0, 5).map((banco, index) => (
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
        className="col-span-12 md:col-span-6 lg:col-span-4 row-span-1 apple-card p-6 rounded-[32px] border border-white/5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Performance</h3>
            <p className="text-white/40 text-xs">Métricas clave de rendimiento</p>
          </div>
          <div className="p-2 bg-purple-500/10 rounded-xl">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
        </div>

        <div className="h-[200px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#ffffff10" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#ffffff60", fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
              <Radar name="Performance" dataKey="A" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.3} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Sales Distribution - Medium */}
      <motion.div
        layout
        className="col-span-12 md:col-span-6 lg:col-span-4 row-span-1 apple-card p-6 rounded-[32px] border border-white/5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Distribución</h3>
            <p className="text-white/40 text-xs">Ventas vs Stock</p>
          </div>
          <div className="p-2 bg-pink-500/10 rounded-xl">
            <PieChart className="w-5 h-5 text-pink-400" />
          </div>
        </div>

        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Bar dataKey="sales" name="Ventas" fill="#ec4899" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="profit" name="Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
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
            onClick={() => useAppStore.getState().setCurrentPanel("reportes")}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all bg-white/5 hover:bg-white/10 border border-white/5"
          >
            Reporte Rápido
          </motion.button>
        </div>
      </motion.div>

      <CreateOrdenCompraModal open={isOrdenModalOpen} onClose={() => setIsOrdenModalOpen(false)} />
      <CreateVentaModal open={isVentaModalOpen} onClose={() => setIsVentaModalOpen(false)} />
      <CreateTransferenciaModal isOpen={isTransferenciaModalOpen} onClose={() => setIsTransferenciaModalOpen(false)} />
    </div>
  )
}
