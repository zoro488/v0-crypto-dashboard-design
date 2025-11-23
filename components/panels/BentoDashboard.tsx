"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useAppStore } from "@/lib/store/useAppStore"
import { TrendingUp, DollarSign, Package, ShoppingCart, ArrowUpRight, Sparkles } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { useDashboardData } from "@/lib/firebase/firestore-hooks.service"
import CreateOrdenCompraModal from "@/components/modals/CreateOrdenCompraModal"
import CreateVentaModal from "@/components/modals/CreateVentaModal"
import CreateTransferenciaModal from "@/components/modals/CreateTransferenciaModal"
import { AnimatedCounter } from "@/components/ui/AnimatedCounter"
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export default function BentoDashboard() {
  const { bancos } = useAppStore()
  const { data: dashboardData, loading } = useDashboardData()

  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const [showChronos, setShowChronos] = useState(true)

  const [isOrdenModalOpen, setIsOrdenModalOpen] = useState(false)
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false)
  const [isTransferenciaModalOpen, setIsTransferenciaModalOpen] = useState(false)

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  useEffect(() => {
    const timer = setTimeout(() => setShowChronos(false), 3500)
    return () => clearTimeout(timer)
  }, [])

  const capitalTotal = bancos.reduce((acc, b) => acc + (b.saldo || 0), 0)
  const ventasMes = dashboardData?.ventas?.reduce((acc, v) => acc + (v.montoTotal || 0), 0) || 0
  const stockActual = dashboardData?.productos?.reduce((acc, p) => acc + (p.stock || 0), 0) || 0
  const ordenesActivas = dashboardData?.ordenes?.filter((oc) => oc.estado === "pendiente").length || 0

  const chartData = dashboardData?.chartData || []
  const pieData = [
    { name: "Bóveda Monte", value: 45, color: "#3b82f6" },
    { name: "Fletes", value: 30, color: "#10b981" },
    { name: "Utilidades", value: 25, color: "#8b5cf6" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-white/10 border-t-cyan-500 animate-spin" />
          <div className="text-white text-lg">Cargando Dashboard...</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0f] p-4 md:p-6">
      <div className="grid grid-cols-12 gap-4 max-h-screen">
        {/* Top Stats - 4 cards across */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 md:col-span-3 relative group cursor-pointer"
          whileHover={{ y: -4 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 group-hover:border-blue-500/50 transition-all overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                  <ArrowUpRight className="w-3 h-3" />
                  +12.5%
                </div>
              </div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Capital Total</p>
              <AnimatedCounter value={capitalTotal} prefix="$" className="text-3xl font-bold text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 md:col-span-3 relative group cursor-pointer"
          whileHover={{ y: -4 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 group-hover:border-emerald-500/50 transition-all overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                  <ArrowUpRight className="w-3 h-3" />
                  +8.3%
                </div>
              </div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Ventas del Mes</p>
              <AnimatedCounter value={ventasMes} prefix="$" className="text-3xl font-bold text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-12 md:col-span-3 relative group cursor-pointer"
          whileHover={{ y: -4 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 group-hover:border-violet-500/50 transition-all overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-rose-400 text-xs font-semibold">
                  <ArrowUpRight className="w-3 h-3 rotate-90" />
                  -3.2%
                </div>
              </div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Stock Actual</p>
              <AnimatedCounter value={stockActual} className="text-3xl font-bold text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-12 md:col-span-3 relative group cursor-pointer"
          whileHover={{ y: -4 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 group-hover:border-amber-500/50 transition-all overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                  <ArrowUpRight className="w-3 h-3" />
                  +15.8%
                </div>
              </div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Órdenes Activas</p>
              <AnimatedCounter value={ordenesActivas} className="text-3xl font-bold text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="col-span-12 lg:col-span-7 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl blur-2xl" />
          <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 h-[300px] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Flujo Financiero
                </h3>
                <p className="text-white/40 text-xs">Análisis de ingresos vs gastos</p>
              </div>
            </div>

            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="mes" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#10b981"
                    fill="url(#colorIngresos)"
                    strokeWidth={2}
                  />
                  <Area type="monotone" dataKey="gastos" stroke="#ef4444" fill="url(#colorGastos)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="col-span-12 lg:col-span-5 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl blur-2xl" />
          <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 h-[300px]">
            <h3 className="text-xl font-bold text-white mb-4">Distribución Capital</h3>
            <div className="h-[220px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="col-span-12 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-3xl blur-2xl" />
          <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
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
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all bg-white/5 hover:bg-white/10 border border-white/10"
              >
                Registrar Venta
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsTransferenciaModalOpen(true)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all bg-white/5 hover:bg-white/10 border border-white/10"
              >
                Transferencia
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => useAppStore.getState().setCurrentPanel("reportes")}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all bg-white/5 hover:bg-white/10 border border-white/10"
              >
                Reporte Rápido
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      <CreateOrdenCompraModal open={isOrdenModalOpen} onClose={() => setIsOrdenModalOpen(false)} />
      <CreateVentaModal open={isVentaModalOpen} onClose={() => setIsVentaModalOpen(false)} />
      <CreateTransferenciaModal isOpen={isTransferenciaModalOpen} onClose={() => setIsTransferenciaModalOpen(false)} />
    </div>
  )
}
