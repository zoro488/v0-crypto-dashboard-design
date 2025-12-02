'use client'

/**
 * ============================================================================
 * 🎯 CHRONOS DASHBOARD ULTRA-PREMIUM 2025
 * ============================================================================
 * 
 * Diseño inspirado en:
 * - Apple Vision Pro: Glassmorphism 24px blur, bordes ultra-sutiles
 * - Tesla: Fondo negro puro #000, tipografía bold, animaciones spring
 * - Grok.com 2025: KPIs gigantes con count-up, gradientes dinámicos
 * 
 * Optimizaciones 2025:
 * - 🚀 Lazy loading de componentes 3D
 * - 🎨 Animaciones spring optimizadas (stiffness 300, damping 30)
 * - 📊 Charts con SafeChartContainer para prevenir errores
 * - 🔄 Count-up animado en todos los valores numéricos
 * - 🌌 Aurora background con orbes animados
 * - 📱 Responsive completo (mobile-first)
 */

import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { useAppStore } from '@/app/lib/store/useAppStore'
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
  Target,
  Cpu,
  Gauge,
  type LucideIcon,
} from 'lucide-react'
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
} from 'recharts'
import { SafeChartContainer, SAFE_ANIMATION_PROPS, SAFE_PIE_PROPS } from '@/app/components/ui/SafeChartContainer'
import { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react'
import { useVentas, useOrdenesCompra, useProductos, useClientes } from '@/app/lib/firebase/firestore-hooks.service'
import { Skeleton } from '@/app/components/ui/skeleton'
import { CreateOrdenCompraModalPremium } from '@/app/components/modals/CreateOrdenCompraModalPremium'
import { CreateVentaModalPremium } from '@/app/components/modals/CreateVentaModalPremium'
import { CreateTransferenciaModalPremium } from '@/app/components/modals/CreateTransferenciaModalPremium'
import { LiveMarketTicker } from '@/app/components/ui/LiveMarketTicker'
import { PerformanceMetrics, MiniPerformanceWidget } from '@/app/components/ui/PerformanceMetrics'

// Lazy load 3D components
const PremiumSplineOrb = lazy(() => 
  import('@/app/components/3d/PremiumSplineOrb').then(mod => ({ default: mod.PremiumSplineOrb })),
)

// ============================================================
// CONSTANTES PREMIUM
// ============================================================
const SPRING_CONFIG = {
  stiffness: 300,
  damping: 30,
  mass: 0.8,
}

const TRANSITION_PREMIUM = {
  type: 'spring' as const,
  ...SPRING_CONFIG,
}

// Hook para count-up animado estilo Grok
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const countRef = useRef(count)
  
  useEffect(() => {
    const startTime = Date.now()
    const startValue = countRef.current
    
    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = Math.floor(startValue + (end - startValue) * easeOutQuart)
      
      setCount(current)
      countRef.current = current
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [end, duration])
  
  return count
}

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
  trend: 'up' | 'down'
  icon: LucideIcon
  color: string
  index: number
  sparklineData?: number[]
}

// ============================================================
// COMPONENTES AUXILIARES PREMIUM 2025
// ============================================================

// Custom Tooltip para charts - Ultra Premium
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; value: number; name: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-black/90 backdrop-blur-[24px] border border-white/[0.08] p-4 rounded-2xl shadow-2xl"
      >
        <p className="text-white/50 text-xs mb-2 font-medium uppercase tracking-wider">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 py-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-white font-bold text-lg">${entry.value.toLocaleString()}</span>
            <span className="text-white/30 text-xs">{entry.name}</span>
          </div>
        ))}
      </motion.div>
    )
  }
  return null
}

// ============================================================
// HERO STAT CARD - ESTILO GROK 2025 (GIGANTE CON COUNT-UP)
// ============================================================
const HeroStatCard = ({ 
  title, 
  value, 
  numericValue,
  change, 
  trend, 
  icon: Icon, 
  gradient, 
  index, 
  sparklineData,
  prefix = '',
  suffix = '',
}: {
  title: string
  value: string
  numericValue: number
  change: string
  trend: 'up' | 'down'
  icon: LucideIcon
  gradient: string
  index: number
  sparklineData?: number[]
  prefix?: string
  suffix?: string
}) => {
  const animatedValue = useCountUp(numericValue, 1800)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1, ...TRANSITION_PREMIUM }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative group cursor-pointer"
    >
      {/* Glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
      
      {/* Card */}
      <div className="relative bg-black/60 backdrop-blur-[24px] border border-white/[0.08] rounded-2xl md:rounded-3xl p-5 md:p-6 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }} />
        </div>
        
        {/* Gradient orb background */}
        <motion.div
          className={`absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <motion.div
              className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={TRANSITION_PREMIUM}
            >
              <Icon className="w-5 h-5 text-white" />
            </motion.div>
            <motion.div
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5
                ${trend === 'up' 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'}
              `}
              whileHover={{ scale: 1.05 }}
            >
              {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {change}
            </motion.div>
          </div>

          <p className="text-white/50 text-sm mb-2 font-medium tracking-wide">{title}</p>
          
          {/* VALOR GIGANTE CON COUNT-UP */}
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-2xl text-white/60">{prefix}</span>}
            <motion.span 
              className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80"
              key={animatedValue}
            >
              {animatedValue.toLocaleString()}
            </motion.span>
            {suffix && <span className="text-xl text-white/60 ml-1">{suffix}</span>}
          </div>

          {/* Mini Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="mt-4 h-12">
              <SafeChartContainer height={48} minHeight={40}>
                <AreaChart data={sparklineData.map((v) => ({ value: v }))}>
                  <defs>
                    <linearGradient id={`spark-hero-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={trend === 'up' ? '#10b981' : '#ef4444'} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={trend === 'up' ? '#10b981' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={trend === 'up' ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    fill={`url(#spark-hero-${index})`}
                    {...SAFE_ANIMATION_PROPS}
                  />
                </AreaChart>
              </SafeChartContainer>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Bank Card Component - Premium 2025
const BankCard = ({ banco, index }: { banco: { id: string; nombre: string; saldo: number; color: string }; index: number }) => {
  const isNegative = banco.saldo < 0
  const animatedSaldo = useCountUp(Math.abs(banco.saldo), 1500)
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index, ...TRANSITION_PREMIUM }}
      whileHover={{ scale: 1.02, x: 6 }}
      className="group flex items-center justify-between p-4 rounded-2xl bg-black/40 hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] cursor-pointer transition-all backdrop-blur-xl"
    >
      <div className="flex items-center gap-4">
        <motion.div 
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${banco.color} flex items-center justify-center shadow-lg`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={TRANSITION_PREMIUM}
        >
          <Building2 className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <p className="text-white font-semibold text-base">{banco.nombre}</p>
          <p className="text-white/30 text-xs font-mono tracking-wider">•••• {banco.id.slice(-4)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-lg ${isNegative ? 'text-rose-400' : 'text-white'}`}>
          ${animatedSaldo.toLocaleString()}
        </p>
        <div className={`flex items-center justify-end gap-1 text-xs ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
          {isNegative ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
          <span>{isNegative ? '-' : '+'}2.4%</span>
        </div>
      </div>
    </motion.div>
  )
}

// Quick Action Button - Premium 2025
const QuickActionButton = ({ label, icon: Icon, onClick, variant = 'default' }: { label: string; icon: LucideIcon; onClick: () => void; variant?: 'primary' | 'secondary' | 'default' }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-500/25',
    secondary: 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 shadow-lg shadow-emerald-500/25',
    default: 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.15]',
  }
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={TRANSITION_PREMIUM}
      className={`px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-sm font-bold text-white transition-all flex items-center gap-2.5 backdrop-blur-xl ${variants[variant]}`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(' ')[0]}</span>
    </motion.button>
  )
}

// Activity Item Component - Premium 2025
const ActivityItem = ({ type, title, description, amount, time, status }: { type: string; title: string; description: string; amount?: number; time: string; status: 'success' | 'pending' | 'error' }) => {
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
    success: 'bg-emerald-500',
    pending: 'bg-amber-500',
    error: 'bg-rose-500',
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.03)' }}
      transition={TRANSITION_PREMIUM}
      className="flex items-start gap-4 p-4 rounded-xl cursor-pointer"
    >
      <div className="relative">
        <motion.div 
          className="w-11 h-11 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/[0.06]"
          whileHover={{ scale: 1.1 }}
          transition={TRANSITION_PREMIUM}
        >
          <Icon className="w-5 h-5 text-white/60" />
        </motion.div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusColors[status]} border-2 border-black shadow-lg`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        <p className="text-xs text-white/40 truncate">{description}</p>
      </div>
      <div className="text-right shrink-0">
        {amount !== undefined && (
          <p className={`text-sm font-bold ${amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {amount >= 0 ? '+' : ''}{amount.toLocaleString()}
          </p>
        )}
        <p className="text-[10px] text-white/25 mt-0.5">{time}</p>
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
  const [timeRange, setTimeRange] = useState('1M')
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
  const ordenesActivas = useMemo(() => ordenesCompra?.filter((oc) => oc?.estado === 'pendiente')?.length ?? 0, [ordenesCompra])
  const clientesActivos = clientesRaw?.length ?? 0

  // Chart Data
  const chartData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
    return months.map((name, i) => ({
      name,
      ventas: Math.floor(Math.random() * 150000) + 80000,
      gastos: Math.floor(Math.random() * 80000) + 40000,
      profit: Math.floor(Math.random() * 50000) + 30000,
    }))
  }, [])

  const pieData = useMemo(() => [
    { name: 'Bóveda Monte', value: 45, color: '#3b82f6' },
    { name: 'Bóveda USA', value: 25, color: '#ef4444' },
    { name: 'Utilidades', value: 15, color: '#10b981' },
    { name: 'Otros', value: 15, color: '#8b5cf6' },
  ], [])

  const stats = useMemo(() => [
    {
      title: 'Capital Total',
      value: `$${capitalTotal.toLocaleString()}`,
      numericValue: capitalTotal,
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      gradient: 'from-blue-500 to-cyan-500',
      sparklineData: [65, 70, 68, 75, 80, 85, 90, 95],
      prefix: '$',
    },
    {
      title: 'Ventas del Mes',
      value: `$${ventasMes.toLocaleString()}`,
      numericValue: ventasMes,
      change: '+8.3%',
      trend: 'up' as const,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-green-500',
      sparklineData: [40, 55, 45, 60, 70, 65, 80, 85],
      prefix: '$',
    },
    {
      title: 'Stock Actual',
      value: stockActual.toLocaleString(),
      numericValue: stockActual,
      change: '-3.2%',
      trend: 'down' as const,
      icon: Package,
      gradient: 'from-violet-500 to-purple-500',
      sparklineData: [100, 95, 90, 85, 88, 82, 78, 75],
      suffix: 'uds',
    },
    {
      title: 'Órdenes Activas',
      value: ordenesActivas.toString(),
      numericValue: ordenesActivas,
      change: '+15.8%',
      trend: 'up' as const,
      icon: ShoppingCart,
      gradient: 'from-amber-500 to-orange-500',
      sparklineData: [12, 15, 18, 14, 20, 22, 25, 28],
    },
  ], [capitalTotal, ventasMes, stockActual, ordenesActivas])

  const activities = useMemo(() => [
    { type: 'venta', title: 'Venta #1234', description: 'Cliente: Bódega Valle', amount: 45000, time: 'Hace 5 min', status: 'success' as const },
    { type: 'compra', title: 'OC-456 recibida', description: 'Proveedor: DistMex', amount: -23000, time: 'Hace 15 min', status: 'success' as const },
    { type: 'transferencia', title: 'Transferencia Interna', description: 'Monte → Azteca', amount: 50000, time: 'Hace 1 hr', status: 'success' as const },
    { type: 'stock', title: 'Stock Actualizado', description: 'Premium Box (+50 uds)', amount: undefined, time: 'Hace 2 hr', status: 'success' as const },
    { type: 'alerta', title: 'Stock Bajo', description: 'Producto A por debajo del mínimo', amount: undefined, time: 'Hace 4 hr', status: 'pending' as const },
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
    <div className="grid grid-cols-12 gap-4 md:gap-6 p-4 md:p-6 relative min-h-screen overflow-x-hidden max-w-full bg-black">
      {/* ============================================================ */}
      {/* AURORA BACKGROUND - EFECTO GROK 2025 */}
      {/* ============================================================ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          className="absolute top-[-30%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-blue-600/15 via-cyan-500/10 to-transparent blur-[180px]"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-20%] right-[-20%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-tl from-purple-600/15 via-pink-500/10 to-transparent blur-[180px]"
          animate={{
            x: [0, -40, 0],
            y: [0, -20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-r from-emerald-500/8 to-teal-500/5 blur-[150px]"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ============================================================ */}
      {/* INTRO ANIMATION - CHRONOS */}
      {/* ============================================================ */}
      <AnimatePresence mode="wait">
        {showChronos && (
          <motion.div
            key="chronos-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(20px)' }}
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
                        '0 0 60px rgba(59, 130, 246, 0.3)',
                        '0 0 80px rgba(168, 85, 247, 0.4)',
                        '0 0 60px rgba(59, 130, 246, 0.3)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span className="text-3xl md:text-5xl font-bold text-white">C</span>
                  </motion.div>

                  <motion.h1
                    className="text-4xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-2 md:mb-4"
                    style={{
                      textShadow: '0 0 80px rgba(59, 130, 246, 0.5)',
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
                      { label: 'Sistema', status: 'Online' },
                      { label: 'Firebase', status: 'Connected' },
                      { label: 'AI', status: 'Active' },
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
      {/* LIVE MARKET TICKER */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="col-span-12 -mx-4 md:-mx-6"
      >
        <LiveMarketTicker 
          items={[
            { id: 'capital', label: 'Capital Total', value: `$${(capitalTotal / 1000000).toFixed(2)}M`, change: 2.34, icon: DollarSign, color: 'from-blue-500 to-cyan-500' },
            { id: 'ventas', label: 'Ventas Hoy', value: `$${(ventasMes / 1000).toFixed(1)}K`, change: 8.3, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
            { id: 'ordenes', label: 'Órdenes Activas', value: ordenesActivas.toString(), change: 15.8, icon: Package, color: 'from-purple-500 to-pink-500' },
            { id: 'stock', label: 'Stock Actual', value: stockActual.toLocaleString(), change: -3.2, icon: Box, color: 'from-orange-500 to-amber-500' },
            { id: 'clientes', label: 'Clientes', value: clientesActivos.toString(), change: 5.6, icon: Users, color: 'from-indigo-500 to-violet-500' },
          ]}
          speed={25}
        />
      </motion.div>

      {/* ============================================================ */}
      {/* STATS CARDS */}
      {/* ============================================================ */}
      {stats.map((stat, index) => (
        <div key={stat.title} className="col-span-6 lg:col-span-3">
          <HeroStatCard {...stat} index={index} />
        </div>
      ))}

      {/* ============================================================ */}
      {/* MAIN CHART - GLASSMORPHISM PREMIUM */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TRANSITION_PREMIUM}
        className="col-span-12 lg:col-span-8"
      >
        <motion.div 
          className="relative bg-white/[0.03] backdrop-blur-[24px] border border-white/[0.08] rounded-[28px] p-5 md:p-7 h-full overflow-hidden"
          whileHover={{ borderColor: 'rgba(255,255,255,0.12)' }}
          transition={TRANSITION_PREMIUM}
        >
          {/* Subtle glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 md:mb-7">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Análisis Financiero
              </h3>
              <p className="text-xs md:text-sm text-white/40 mt-0.5">Flujo de capital en tiempo real</p>
            </div>
            <div className="flex gap-1 p-1.5 bg-white/[0.04] rounded-xl border border-white/[0.06]">
              {['1D', '1W', '1M', '1Y'].map((range) => (
                <motion.button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all
                    ${timeRange === range 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30' 
                      : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={TRANSITION_PREMIUM}
                >
                  {range}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-48 md:h-80">
            <SafeChartContainer height="100%" minHeight={192}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorVentas)" {...SAFE_ANIMATION_PROPS} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2.5} fill="url(#colorProfit)" {...SAFE_ANIMATION_PROPS} />
              </AreaChart>
            </SafeChartContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* ============================================================ */}
      {/* BANCOS SIDEBAR - GLASSMORPHISM PREMIUM */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TRANSITION_PREMIUM, delay: 0.1 }}
        className="col-span-12 lg:col-span-4"
      >
        <motion.div 
          className="relative bg-white/[0.03] backdrop-blur-[24px] border border-white/[0.08] rounded-[28px] p-5 md:p-7 h-full overflow-hidden"
          whileHover={{ borderColor: 'rgba(255,255,255,0.12)' }}
          transition={TRANSITION_PREMIUM}
        >
          {/* Subtle glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          
          <div className="flex items-center justify-between mb-5 md:mb-7">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Bancos
              </h3>
              <p className="text-xs md:text-sm text-white/40 mt-0.5">Saldos actualizados</p>
            </div>
            <motion.button
              onClick={() => setCurrentPanel('bancos')}
              className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
              whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.95 }}
              transition={TRANSITION_PREMIUM}
            >
              <ExternalLink className="w-4 h-4 text-white/60" />
            </motion.button>
          </div>

          <div className="space-y-2 md:space-y-3 max-h-64 md:max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {bancos?.slice(0, 6).map((banco, index) => (
              <BankCard key={banco.id} banco={banco} index={index} />
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ============================================================ */}
      {/* PIE CHART - GLASSMORPHISM PREMIUM */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TRANSITION_PREMIUM, delay: 0.15 }}
        className="col-span-12 md:col-span-6 lg:col-span-4"
      >
        <motion.div 
          className="relative bg-white/[0.03] backdrop-blur-[24px] border border-white/[0.08] rounded-[28px] p-5 md:p-7 overflow-hidden"
          whileHover={{ borderColor: 'rgba(255,255,255,0.12)' }}
          transition={TRANSITION_PREMIUM}
        >
          {/* Subtle glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
          
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-pink-400" />
                Distribución
              </h3>
              <p className="text-xs text-white/40 mt-0.5">Por categoría</p>
            </div>
          </div>

          <div className="h-40 md:h-52">
            <SafeChartContainer height={208} minHeight={160}>
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  {...SAFE_PIE_PROPS}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </SafeChartContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            {pieData.map((item, i) => (
              <motion.div 
                key={item.name} 
                className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }} />
                <span className="text-xs text-white/60 truncate flex-1">{item.name}</span>
                <span className="text-xs font-bold text-white">{item.value}%</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
                'radial-gradient(circle at 30% 30%, rgba(139,92,246,0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 70% 70%, rgba(59,130,246,0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 30% 30%, rgba(139,92,246,0.15) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
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
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
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
                { label: 'Precisión', value: '98.5%', color: 'text-emerald-400' },
                { label: 'Consultas', value: '247', color: 'text-cyan-400' },
                { label: 'Latencia', value: '42ms', color: 'text-purple-400' },
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
      {/* ACTIVITY FEED - GLASSMORPHISM PREMIUM */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TRANSITION_PREMIUM, delay: 0.25 }}
        className="col-span-12 lg:col-span-4"
      >
        <motion.div 
          className="relative bg-white/[0.03] backdrop-blur-[24px] border border-white/[0.08] rounded-[28px] p-5 md:p-7 overflow-hidden"
          whileHover={{ borderColor: 'rgba(255,255,255,0.12)' }}
          transition={TRANSITION_PREMIUM}
        >
          {/* Subtle glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Actividad Reciente
              </h3>
              <p className="text-xs text-white/40 mt-0.5">Últimos movimientos</p>
            </div>
            <motion.button
              className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
              whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.15)' }}
              transition={TRANSITION_PREMIUM}
            >
              <Clock className="w-4 h-4 text-white/60" />
            </motion.button>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {activities.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ============================================================ */}
      {/* PERFORMANCE METRICS */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
        className="col-span-12 lg:col-span-8"
      >
        <PerformanceMetrics />
      </motion.div>

      {/* ============================================================ */}
      {/* MINI PERFORMANCE WIDGET */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.87 }}
        className="col-span-12 lg:col-span-4"
      >
        <div className="space-y-4">
          <MiniPerformanceWidget />
          
          {/* Quick Summary Card - GLASSMORPHISM PREMIUM */}
          <motion.div
            className="relative bg-white/[0.03] backdrop-blur-[24px] border border-white/[0.08] rounded-[28px] p-5 overflow-hidden"
            whileHover={{ borderColor: 'rgba(255,255,255,0.12)' }}
            transition={TRANSITION_PREMIUM}
          >
            {/* Subtle glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                Objetivos del Mes
              </h4>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/60">Ventas</span>
                  <span className="text-white font-bold">78%</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: '78%' }}
                    transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/60">Nuevos Clientes</span>
                  <span className="text-white font-bold">92%</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: '92%' }}
                    transition={{ delay: 1.1, duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/60">Entregas</span>
                  <span className="text-white font-bold">65%</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    transition={{ delay: 1.2, duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* QUICK ACTIONS BAR - GLASSMORPHISM PREMIUM */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TRANSITION_PREMIUM, delay: 0.3 }}
        className="col-span-12"
      >
        <motion.div 
          className="relative bg-white/[0.03] backdrop-blur-[24px] border border-white/[0.08] rounded-[28px] p-4 md:p-5 overflow-hidden"
          whileHover={{ borderColor: 'rgba(255,255,255,0.12)' }}
          transition={TRANSITION_PREMIUM}
        >
          {/* Gradient line on top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Status */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
                </div>
                <span className="text-white/60 text-xs md:text-sm font-mono">
                  Sistema: <span className="text-emerald-400 font-semibold">ONLINE</span>
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-white/40">
                <Users className="w-3.5 h-3.5" />
                <span>{clientesActivos} clientes activos</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-3">
              <QuickActionButton label="Nueva Venta" icon={DollarSign} onClick={() => setIsVentaModalOpen(true)} variant="secondary" />
              <QuickActionButton label="Nueva Orden" icon={Package} onClick={() => setIsOrdenModalOpen(true)} variant="primary" />
              <QuickActionButton label="Transferencia" icon={ArrowUpRight} onClick={() => setIsTransferenciaModalOpen(true)} />
              <QuickActionButton label="Reportes" icon={BarChart3} onClick={() => setCurrentPanel('reportes')} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ============================================================ */}
      {/* MODALES */}
      {/* ============================================================ */}
      <CreateOrdenCompraModalPremium open={isOrdenModalOpen} onClose={() => setIsOrdenModalOpen(false)} />
      <CreateVentaModalPremium open={isVentaModalOpen} onClose={() => setIsVentaModalOpen(false)} />
      <CreateTransferenciaModalPremium open={isTransferenciaModalOpen} onClose={() => setIsTransferenciaModalOpen(false)} />
    </div>
  )
}
