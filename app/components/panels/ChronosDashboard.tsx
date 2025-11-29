"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/app/lib/store/useAppStore"
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Zap, 
  PieChart, 
  Users, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Clock, 
  Bell,
  Wallet,
  Building2,
  Globe,
  TrendingDown,
  BarChart3,
  Eye,
  ChevronRight,
  ExternalLink,
  Layers,
  Box,
  type LucideIcon,
} from "lucide-react"
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { useState, useEffect, useMemo, Suspense, lazy } from "react"
import { useVentas, useOrdenesCompra, useProductos, useClientes } from "@/app/lib/firebase/firestore-hooks.service"
import { Skeleton } from "@/app/components/ui/skeleton"
import CreateOrdenCompraModal from "@/app/components/modals/CreateOrdenCompraModalSmart"
import CreateVentaModal from "@/app/components/modals/CreateVentaModalSmart"
import CreateTransferenciaModal from "@/app/components/modals/CreateTransferenciaModalSmart"

// Lazy load 3D components
const PremiumSplineOrb = lazy(() => 
  import("@/app/components/3d/PremiumSplineOrb").then(mod => ({ default: mod.PremiumSplineOrb }))
)

// ============================================================
// TIPOS E INTERFACES
// ============================================================
interface VentaData {
  id?: string
  montoTotal?: number
  precioVenta?: number
  cantidad?: number
  ganancia?: number
  fecha?: { seconds: number } | Date | string
  [key: string]: unknown
}

interface OrdenCompraData {
  id?: string
  estado?: string
  [key: string]: unknown
}

interface ProductoData {
  id?: string
  stock?: number
  [key: string]: unknown
}

interface StatCardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: LucideIcon
  color: string
  index: number
  sparklineData?: number[]
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

// Custom Tooltip para charts
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; value: number; name: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl">
        <p className="text-white/60 text-xs mb-1.5 font-medium uppercase tracking-wider">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-white font-bold text-sm">${entry.value.toLocaleString()}</span>
            <span className="text-white/40 text-xs">{entry.name}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// Stat Card Component
const StatCard = ({ title, value, change, trend, icon: Icon, color, index, sparklineData }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative group cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 overflow-hidden">
        {/* Background Glow */}
        <motion.div
          className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${color} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <motion.div
              className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br ${color} shadow-lg`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </motion.div>
            <motion.div
              className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold flex items-center gap-1
                ${trend === "up" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}
              `}
              whileHover={{ scale: 1.05 }}
            >
              {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {change}
            </motion.div>
          </div>

          <p className="text-white/50 text-xs md:text-sm mb-1 font-medium">{title}</p>
          <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight">{value}</h3>

          {/* Mini Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="mt-3 md:mt-4 h-8 md:h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData.map((v, i) => ({ value: v }))}>
                  <defs>
                    <linearGradient id={`spark-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={trend === "up" ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={trend === "up" ? "#10b981" : "#ef4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={trend === "up" ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                    fill={`url(#spark-${index})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Bank Card Component
const BankCard = ({ banco, index }: { banco: { id: string; nombre: string; saldo: number; color: string }; index: number }) => {
  const isNegative = banco.saldo < 0
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      whileHover={{ scale: 1.02, x: 4 }}
      className="group flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 cursor-pointer transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br ${banco.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
          <Building2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-medium text-sm md:text-base">{banco.nombre}</p>
          <p className="text-white/40 text-[10px] md:text-xs font-mono">•••• {banco.id.slice(-4)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-sm md:text-base ${isNegative ? 'text-red-400' : 'text-white'}`}>
          ${Math.abs(banco.saldo).toLocaleString()}
        </p>
        <div className={`flex items-center justify-end gap-1 text-[10px] md:text-xs ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
          {isNegative ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
          <span>{isNegative ? '-' : '+'}2.4%</span>
        </div>
      </div>
    </motion.div>
  )
}

// Quick Action Button
const QuickActionButton = ({ label, icon: Icon, onClick, variant = "default" }: { label: string; icon: LucideIcon; onClick: () => void; variant?: "primary" | "secondary" | "default" }) => {
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-blue-500/25",
    secondary: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/25",
    default: "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
  }
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold text-white transition-all flex items-center gap-2 ${variants[variant]}`}
    >
      <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(' ')[0]}</span>
    </motion.button>
  )
}

// Activity Item Component
const ActivityItem = ({ type, title, description, amount, time, status }: { type: string; title: string; description: string; amount?: number; time: string; status: "success" | "pending" | "error" }) => {
  const icons = {
    venta: ShoppingCart,
    compra: Package,
    transferencia: ArrowUpRight,
    stock: Layers,
    cliente: Users,
    alerta: Bell,
  }
  const Icon = icons[type as keyof typeof icons] || Activity
  
  const statusColors = {
    success: "bg-emerald-500",
    pending: "bg-amber-500",
    error: "bg-red-500"
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <Icon className="w-5 h-5 text-white/60" />
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusColors[status]} border-2 border-black`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-xs text-white/40 truncate">{description}</p>
      </div>
      <div className="text-right shrink-0">
        {amount !== undefined && (
          <p className={`text-sm font-bold ${amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {amount >= 0 ? '+' : ''}{amount.toLocaleString()}
          </p>
        )}
        <p className="text-[10px] text-white/30">{time}</p>
      </div>
    </motion.div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function ChronosDashboard() {
  const { bancos, setCurrentPanel } = useAppStore()
  const { data: ventasRaw, loading: loadingVentas } = useVentas()
  const { data: ordenesCompraRaw, loading: loadingOC } = useOrdenesCompra()
  const { data: productosRaw, loading: loadingProductos } = useProductos()
  const { data: clientesRaw, loading: loadingClientes } = useClientes()

  const ventas = ventasRaw as VentaData[] | undefined
  const ordenesCompra = ordenesCompraRaw as OrdenCompraData[] | undefined
  const productos = productosRaw as ProductoData[] | undefined

  const [mounted, setMounted] = useState(false)
  const [showChronos, setShowChronos] = useState(true)
  const [timeRange, setTimeRange] = useState("1M")
  const [isOrdenModalOpen, setIsOrdenModalOpen] = useState(false)
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false)
  const [isTransferenciaModalOpen, setIsTransferenciaModalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setShowChronos(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  // Calculos
  const capitalTotal = useMemo(() => bancos?.reduce((acc, b) => acc + (b?.saldo || 0), 0) || 0, [bancos])
  const ventasMes = useMemo(() => ventas?.reduce((acc, v) => acc + (v?.montoTotal ?? 0), 0) ?? 0, [ventas])
  const stockActual = useMemo(() => productos?.reduce((acc, p) => acc + (p?.stock ?? 0), 0) ?? 0, [productos])
  const ordenesActivas = useMemo(() => ordenesCompra?.filter((oc) => oc?.estado === "pendiente")?.length ?? 0, [ordenesCompra])
  const clientesActivos = clientesRaw?.length ?? 0

  // Chart Data
  const chartData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
    return months.map((name, i) => ({
      name,
      ventas: Math.floor(Math.random() * 150000) + 80000,
      gastos: Math.floor(Math.random() * 80000) + 40000,
      profit: Math.floor(Math.random() * 50000) + 30000,
    }))
  }, [])

  const pieData = useMemo(() => [
    { name: "Bóveda Monte", value: 45, color: "#3b82f6" },
    { name: "Bóveda USA", value: 25, color: "#ef4444" },
    { name: "Utilidades", value: 15, color: "#10b981" },
    { name: "Otros", value: 15, color: "#8b5cf6" },
  ], [])

  const stats = useMemo(() => [
    {
      title: "Capital Total",
      value: `$${capitalTotal.toLocaleString()}`,
      change: "+12.5%",
      trend: "up" as const,
      icon: DollarSign,
      color: "from-blue-500 to-cyan-500",
      sparklineData: [65, 70, 68, 75, 80, 85, 90],
    },
    {
      title: "Ventas del Mes",
      value: `$${ventasMes.toLocaleString()}`,
      change: "+8.3%",
      trend: "up" as const,
      icon: TrendingUp,
      color: "from-emerald-500 to-green-500",
      sparklineData: [40, 55, 45, 60, 70, 65, 80],
    },
    {
      title: "Stock Actual",
      value: stockActual.toLocaleString(),
      change: "-3.2%",
      trend: "down" as const,
      icon: Package,
      color: "from-violet-500 to-purple-500",
      sparklineData: [100, 95, 90, 85, 88, 82, 78],
    },
    {
      title: "Órdenes Activas",
      value: ordenesActivas.toString(),
      change: "+15.8%",
      trend: "up" as const,
      icon: ShoppingCart,
      color: "from-amber-500 to-orange-500",
      sparklineData: [12, 15, 18, 14, 20, 22, 25],
    },
  ], [capitalTotal, ventasMes, stockActual, ordenesActivas])

  const activities = useMemo(() => [
    { type: "venta", title: "Venta #1234", description: "Cliente: Bódega Valle", amount: 45000, time: "Hace 5 min", status: "success" as const },
    { type: "compra", title: "OC-456 recibida", description: "Proveedor: DistMex", amount: -23000, time: "Hace 15 min", status: "success" as const },
    { type: "transferencia", title: "Transferencia Interna", description: "Monte → Azteca", amount: 50000, time: "Hace 1 hr", status: "success" as const },
    { type: "stock", title: "Stock Actualizado", description: "Premium Box (+50 uds)", amount: undefined, time: "Hace 2 hr", status: "success" as const },
    { type: "alerta", title: "Stock Bajo", description: "Producto A por debajo del mínimo", amount: undefined, time: "Hace 4 hr", status: "pending" as const },
  ], [])

  // Loading State
  if (loadingVentas || loadingOC || loadingProductos) {
    return (
      <div className="grid grid-cols-12 gap-4 md:gap-6 p-4 md:p-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-span-6 lg:col-span-3">
            <Skeleton className="h-32 md:h-40 w-full rounded-2xl md:rounded-3xl" />
          </div>
        ))}
        <div className="col-span-12 lg:col-span-8">
          <Skeleton className="h-64 md:h-96 w-full rounded-2xl md:rounded-3xl" />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <Skeleton className="h-64 md:h-96 w-full rounded-2xl md:rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6 p-4 md:p-6 relative min-h-screen">
      {/* ============================================================ */}
      {/* INTRO ANIMATION - CHRONOS */}
      {/* ============================================================ */}
      <AnimatePresence mode="wait">
        {showChronos && (
          <motion.div
            key="chronos-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 relative z-50 mb-4 md:mb-8"
          >
            <div className="relative h-64 md:h-[400px] rounded-3xl md:rounded-[48px] overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black border border-white/10">
              {/* Animated Background */}
              <div className="absolute inset-0">
                <motion.div
                  className="absolute top-1/4 left-1/4 w-48 md:w-96 h-48 md:h-96 rounded-full bg-blue-500/20 blur-[100px]"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-1/4 right-1/4 w-48 md:w-96 h-48 md:h-96 rounded-full bg-purple-500/20 blur-[100px]"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                />
              </div>

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center"
                >
                  {/* Logo */}
                  <motion.div
                    className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center"
                    animate={{ 
                      boxShadow: [
                        "0 0 60px rgba(59, 130, 246, 0.3)",
                        "0 0 80px rgba(168, 85, 247, 0.4)",
                        "0 0 60px rgba(59, 130, 246, 0.3)",
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span className="text-3xl md:text-5xl font-bold text-white">C</span>
                  </motion.div>

                  <motion.h1
                    className="text-4xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-2 md:mb-4"
                    style={{
                      textShadow: "0 0 80px rgba(59, 130, 246, 0.5)",
                    }}
                  >
                    CHRONOS
                  </motion.h1>

                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-px w-48 md:w-96 mx-auto bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  />

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="text-white/40 text-xs md:text-sm mt-4 md:mt-6 tracking-[0.3em] uppercase"
                  >
                    Sistema de Gestión Inteligente
                  </motion.p>

                  {/* Status Indicators */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="flex items-center justify-center gap-4 md:gap-6 mt-4 md:mt-8"
                  >
                    {[
                      { label: "Sistema", status: "Online" },
                      { label: "Firebase", status: "Connected" },
                      { label: "AI", status: "Active" },
                    ].map((item, i) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] md:text-xs text-white/40">{item.label}</span>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* STATS CARDS */}
      {/* ============================================================ */}
      {stats.map((stat, index) => (
        <div key={stat.title} className="col-span-6 lg:col-span-3">
          <StatCard {...stat} index={index} />
        </div>
      ))}

      {/* ============================================================ */}
      {/* MAIN CHART */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="col-span-12 lg:col-span-8"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 h-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">Análisis Financiero</h3>
              <p className="text-xs md:text-sm text-white/40">Flujo de capital en tiempo real</p>
            </div>
            <div className="flex gap-1 p-1 bg-white/5 rounded-lg md:rounded-xl border border-white/10">
              {["1D", "1W", "1M", "1Y"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-xs md:text-sm font-medium transition-all
                    ${timeRange === range 
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" 
                      : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-48 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#3b82f6" strokeWidth={2} fill="url(#colorVentas)" />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* BANCOS SIDEBAR */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="col-span-12 lg:col-span-4"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 h-full">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">Bancos</h3>
              <p className="text-xs md:text-sm text-white/40">Saldos actualizados</p>
            </div>
            <motion.button
              onClick={() => setCurrentPanel("banco")}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ExternalLink className="w-4 h-4 text-white/60" />
            </motion.button>
          </div>

          <div className="space-y-2 md:space-y-3 max-h-64 md:max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {bancos?.slice(0, 6).map((banco, index) => (
              <BankCard key={banco.id} banco={banco} index={index} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* PIE CHART + AI ORBI */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="col-span-12 md:col-span-6 lg:col-span-4"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-white">Distribución</h3>
              <p className="text-xs text-white/40">Por categoría</p>
            </div>
            <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20">
              <PieChart className="w-4 h-4 text-pink-400" />
            </div>
          </div>

          <div className="h-40 md:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-white/60 truncate">{item.name}</span>
                <span className="text-xs font-bold text-white ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* AI STATUS ORB */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className="col-span-12 md:col-span-6 lg:col-span-4"
      >
        <div className="bg-gradient-to-br from-purple-500/10 via-black to-blue-500/10 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 relative overflow-hidden">
          {/* Animated Background */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.15) 0%, transparent 50%)",
                "radial-gradient(circle at 70% 70%, rgba(59,130,246,0.15) 0%, transparent 50%)",
                "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.15) 0%, transparent 50%)",
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base md:text-lg font-bold text-white">AI Status</h3>
                <p className="text-xs text-white/40">Asistente inteligente</p>
              </div>
              <motion.div 
                className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
            </div>

            {/* 3D Orb */}
            <div className="flex items-center justify-center py-4 md:py-6">
              <Suspense fallback={
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 animate-pulse" />
              }>
                <PremiumSplineOrb
                  state="idle"
                  size={100}
                  glowIntensity={1.5}
                  showParticles
                  showRings
                  interactive
                  label=""
                  value=""
                />
              </Suspense>
            </div>

            {/* AI Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Precisión", value: "98.5%", color: "text-emerald-400" },
                { label: "Consultas", value: "247", color: "text-cyan-400" },
                { label: "Latencia", value: "42ms", color: "text-purple-400" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={`text-sm md:text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-white/40">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* ACTIVITY FEED */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="col-span-12 lg:col-span-4"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-white">Actividad Reciente</h3>
              <p className="text-xs text-white/40">Últimos movimientos</p>
            </div>
            <motion.button
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              whileHover={{ scale: 1.05 }}
            >
              <Clock className="w-4 h-4 text-white/60" />
            </motion.button>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {activities.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* QUICK ACTIONS BAR */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="col-span-12"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                <span className="text-white/60 text-xs md:text-sm font-mono">
                  Sistema: <span className="text-white font-semibold">ONLINE</span>
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-white/40">
                <Users className="w-3.5 h-3.5" />
                <span>{clientesActivos} clientes activos</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              <QuickActionButton label="Nueva Venta" icon={DollarSign} onClick={() => setIsVentaModalOpen(true)} variant="secondary" />
              <QuickActionButton label="Nueva Orden" icon={Package} onClick={() => setIsOrdenModalOpen(true)} variant="primary" />
              <QuickActionButton label="Transferencia" icon={ArrowUpRight} onClick={() => setIsTransferenciaModalOpen(true)} />
              <QuickActionButton label="Reportes" icon={BarChart3} onClick={() => setCurrentPanel("reportes")} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* MODALES */}
      {/* ============================================================ */}
      <CreateOrdenCompraModal open={isOrdenModalOpen} onClose={() => setIsOrdenModalOpen(false)} />
      <CreateVentaModal open={isVentaModalOpen} onClose={() => setIsVentaModalOpen(false)} />
      <CreateTransferenciaModal isOpen={isTransferenciaModalOpen} onClose={() => setIsTransferenciaModalOpen(false)} />
    </div>
  )
}
