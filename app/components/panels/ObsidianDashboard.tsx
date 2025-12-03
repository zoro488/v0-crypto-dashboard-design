'use client'

/**
 * ============================================================================
 * 🔮 CHRONOS OBSIDIAN GLASS DASHBOARD
 * ============================================================================
 * 
 * Dashboard Ultra-Premium con el nuevo sistema de diseño Obsidian Glass
 * 
 * 4 Pilares del diseño:
 * 1. Materialidad: "Obsidian Glass" - Vidrio oscuro pulido
 * 2. Iluminación: "Bioluminiscencia Controlada" - Glow indirecto orgánico
 * 3. Arquitectura: "Spatial UI" - Capas Z con profundidad pseudo-3D
 * 4. Movimiento: "Fluid Dynamics" - Micro-interacciones respiratorias
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/app/lib/store/useAppStore'
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Activity,
  ArrowUpRight,
  Building2,
  BarChart3,
  ExternalLink,
  Sparkles,
  Clock,
  Box,
  Layers,
  Target,
  Bell,
  TrendingDown,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts'
import { SafeChartContainer, SAFE_ANIMATION_PROPS, SAFE_PIE_PROPS } from '@/app/components/ui/SafeChartContainer'
import { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { useVentas, useOrdenesCompra, useProductos, useClientes } from '@/app/lib/firebase/firestore-hooks.service'
import { Skeleton } from '@/app/components/ui/skeleton'
import { CreateOrdenCompraModalPremium } from '@/app/components/modals/CreateOrdenCompraModalPremium'
import { CreateVentaModalPremium } from '@/app/components/modals/CreateVentaModalPremium'
import { CreateTransferenciaModalPremium } from '@/app/components/modals/CreateTransferenciaModalPremium'

// Nuevos componentes Obsidian Glass
import { AtmosphericBackground } from '@/app/components/ui-premium/AtmosphericBackground'
import { ObsidianCard } from '@/app/components/ui-premium/ObsidianCard'
import { KPICard, KPIGrid } from '@/app/components/ui-premium/KPICard'
import { LuminousIcon, BadgeLuminous } from '@/app/components/ui-premium/LuminousIcon'
import { HeroMetricCard } from '@/app/components/ui-premium/HeroMetricCard'
import { BentoMetricCard } from '@/app/components/ui-premium/BentoMetricCard'
import { SparklineBackground } from '@/app/components/ui-premium/SparklineBackground'

// Lazy load 3D components
const PremiumSplineOrb = lazy(() =>
  import('@/app/components/3d/PremiumSplineOrb').then(mod => ({ default: mod.PremiumSplineOrb }))
)

// ============================================================
// TIPOS
// ============================================================
interface VentaData {
  id?: string
  montoTotal?: number
  precioVenta?: number
  cantidad?: number
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

// ============================================================
// CONSTANTES
// ============================================================
const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
}

// ============================================================
// COMPONENTES AUXILIARES OBSIDIAN
// ============================================================

// Tooltip personalizado para charts
const ObsidianTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; value: number; name: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.7)]"
      >
        <p className="text-white/40 text-xs mb-2 font-medium uppercase tracking-wider">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 py-1">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}60` }}
            />
            <span className="text-white font-bold text-lg font-mono">${entry.value.toLocaleString()}</span>
            <span className="text-white/30 text-xs">{entry.name}</span>
          </div>
        ))}
      </motion.div>
    )
  }
  return null
}

// Bank Card con estilo Obsidian
const ObsidianBankCard = ({ banco, index }: { banco: { id: string; nombre: string; saldo: number; color: string }; index: number }) => {
  const isNegative = banco.saldo < 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index, ...SPRING_CONFIG }}
      whileHover={{ scale: 1.02, x: 6 }}
      className="group flex items-center justify-between p-4 rounded-2xl bg-[rgba(10,10,15,0.5)] hover:bg-[rgba(20,20,30,0.6)] border border-white/[0.06] hover:border-white/[0.12] cursor-pointer transition-all backdrop-blur-xl"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${banco.color} flex items-center justify-center relative`}>
          {/* Glow detrás */}
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${banco.color} blur-lg opacity-40`}
          />
          <Building2 className="w-5 h-5 text-white relative z-10" />
        </div>
        <div>
          <p className="text-white font-semibold text-base">{banco.nombre}</p>
          <p className="text-white/30 text-xs font-mono tracking-wider">•••• {banco.id.slice(-4)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-lg font-mono ${isNegative ? 'text-rose-400' : 'text-white'}`}>
          ${Math.abs(banco.saldo).toLocaleString()}
        </p>
        <div className={`flex items-center justify-end gap-1 text-xs ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
          {isNegative ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
          <span>{isNegative ? '-' : '+'}2.4%</span>
        </div>
      </div>
    </motion.div>
  )
}

// Activity Item con estilo Obsidian
const ObsidianActivityItem = ({
  type,
  title,
  description,
  amount,
  time,
  status,
}: {
  type: string
  title: string
  description: string
  amount?: number
  time: string
  status: 'success' | 'pending' | 'error'
}) => {
  const icons: Record<string, LucideIcon> = {
    venta: ShoppingCart,
    compra: Package,
    transferencia: ArrowUpRight,
    stock: Layers,
    cliente: Users,
    alerta: Bell,
  }
  const Icon = icons[type] || Activity

  const statusColors = {
    success: { dot: 'bg-emerald-500', glow: 'shadow-[0_0_8px_rgba(4,120,87,0.5)]' },
    pending: { dot: 'bg-amber-500', glow: 'shadow-[0_0_8px_rgba(217,119,6,0.5)]' },
    error: { dot: 'bg-rose-500', glow: 'shadow-[0_0_8px_rgba(190,18,60,0.5)]' },
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.03)' }}
      transition={SPRING_CONFIG}
      className="flex items-start gap-4 p-4 rounded-xl cursor-pointer"
    >
      <div className="relative">
        <motion.div
          className="w-11 h-11 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center border border-white/[0.06]"
          whileHover={{ scale: 1.1 }}
          transition={SPRING_CONFIG}
        >
          <Icon className="w-5 h-5 text-white/60" />
        </motion.div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusColors[status].dot} ${statusColors[status].glow} border-2 border-[#0a0a0f]`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        <p className="text-xs text-white/40 truncate">{description}</p>
      </div>
      <div className="text-right shrink-0">
        {amount !== undefined && (
          <p className={`text-sm font-bold font-mono ${amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {amount >= 0 ? '+' : ''}${Math.abs(amount).toLocaleString()}
          </p>
        )}
        <p className="text-[10px] text-white/25 mt-0.5">{time}</p>
      </div>
    </motion.div>
  )
}

// Botón de acción rápida Obsidian
const ObsidianActionButton = ({
  label,
  icon: Icon,
  onClick,
  variant = 'default',
}: {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'default'
}) => {
  const variants = {
    primary:
      'bg-gradient-to-r from-[#047857] to-[#065f46] hover:from-[#059669] hover:to-[#047857] shadow-[0_8px_24px_-8px_rgba(4,120,87,0.4)]',
    secondary:
      'bg-gradient-to-r from-[#2563eb] to-[#1e40af] hover:from-[#3b82f6] hover:to-[#2563eb] shadow-[0_8px_24px_-8px_rgba(37,99,235,0.4)]',
    default: 'bg-[rgba(10,10,15,0.7)] hover:bg-[rgba(20,20,30,0.8)] border border-white/[0.08] hover:border-white/[0.15]',
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={SPRING_CONFIG}
      className={`px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-sm font-bold text-white transition-all flex items-center gap-2.5 backdrop-blur-xl ${variants[variant]}`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(' ')[0]}</span>
    </motion.button>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function ObsidianDashboard() {
  const { bancos, setCurrentPanel } = useAppStore()
  const { data: ventasRaw, loading: loadingVentas } = useVentas()
  const { data: ordenesCompraRaw, loading: loadingOC } = useOrdenesCompra()
  const { data: productosRaw, loading: loadingProductos } = useProductos()
  const { data: clientesRaw, loading: loadingClientes } = useClientes()

  const ventas = ventasRaw as VentaData[] | undefined
  const ordenesCompra = ordenesCompraRaw as OrdenCompraData[] | undefined
  const productos = productosRaw as ProductoData[] | undefined

  const [mounted, setMounted] = useState(false)
  const [timeRange, setTimeRange] = useState('1M')
  const [isOrdenModalOpen, setIsOrdenModalOpen] = useState(false)
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false)
  const [isTransferenciaModalOpen, setIsTransferenciaModalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Cálculos
  const capitalTotal = useMemo(() => bancos?.reduce((acc, b) => acc + (b?.saldo || 0), 0) || 0, [bancos])
  const ventasMes = useMemo(() => ventas?.reduce((acc, v) => acc + (v?.montoTotal ?? 0), 0) ?? 0, [ventas])
  const stockActual = useMemo(() => productos?.reduce((acc, p) => acc + (p?.stock ?? 0), 0) ?? 0, [productos])
  const ordenesActivas = useMemo(() => ordenesCompra?.filter((oc) => oc?.estado === 'pendiente')?.length ?? 0, [ordenesCompra])
  const clientesActivos = clientesRaw?.length ?? 0

  // Chart Data
  const chartData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
    return months.map((name) => ({
      name,
      ventas: Math.floor(Math.random() * 150000) + 80000,
      gastos: Math.floor(Math.random() * 80000) + 40000,
      profit: Math.floor(Math.random() * 50000) + 30000,
    }))
  }, [])

  const pieData = useMemo(
    () => [
      { name: 'Bóveda Monte', value: 45, color: '#2563eb' },
      { name: 'Bóveda USA', value: 25, color: '#be123c' },
      { name: 'Utilidades', value: 15, color: '#047857' },
      { name: 'Otros', value: 15, color: '#7c3aed' },
    ],
    []
  )

  const activities = useMemo(
    () => [
      { type: 'venta', title: 'Venta #1234', description: 'Cliente: Bódega Valle', amount: 45000, time: 'Hace 5 min', status: 'success' as const },
      { type: 'compra', title: 'OC-456 recibida', description: 'Proveedor: DistMex', amount: -23000, time: 'Hace 15 min', status: 'success' as const },
      { type: 'transferencia', title: 'Transferencia Interna', description: 'Monte → Azteca', amount: 50000, time: 'Hace 1 hr', status: 'success' as const },
      { type: 'stock', title: 'Stock Actualizado', description: 'Premium Box (+50 uds)', amount: undefined, time: 'Hace 2 hr', status: 'success' as const },
      { type: 'alerta', title: 'Stock Bajo', description: 'Producto A por debajo del mínimo', amount: undefined, time: 'Hace 4 hr', status: 'pending' as const },
    ],
    []
  )

  // Loading State
  if (loadingVentas || loadingOC || loadingProductos) {
    return (
      <div className="grid grid-cols-12 gap-4 md:gap-6 p-4 md:p-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-span-6 lg:col-span-3">
            <Skeleton className="h-32 md:h-40 w-full rounded-3xl bg-white/5" />
          </div>
        ))}
        <div className="col-span-12 lg:col-span-8">
          <Skeleton className="h-64 md:h-96 w-full rounded-3xl bg-white/5" />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <Skeleton className="h-64 md:h-96 w-full rounded-3xl bg-white/5" />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 🌌 ATMOSPHERIC BACKGROUND con nebulosas volumétricas */}
      <AtmosphericBackground showParticles vignetteIntensity={0.5} />

      <div className="relative z-10 grid grid-cols-12 gap-4 md:gap-6 p-4 md:p-6 min-h-screen overflow-x-hidden max-w-full">
        {/* ============================================================ */}
        {/* KPI CARDS - Obsidian Glass con count-up */}
        {/* ============================================================ */}
        <div className="col-span-6 lg:col-span-3">
          <KPICard
            label="Capital Total"
            value={capitalTotal}
            format="compact"
            prefix="$"
            icon={DollarSign}
            variant="sapphire"
            trend={12.5}
            sparklineData={[65, 70, 68, 75, 80, 85, 90, 95]}
            onClick={() => setCurrentPanel('bancos')}
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <KPICard
            label="Ventas del Mes"
            value={ventasMes}
            format="compact"
            prefix="$"
            icon={TrendingUp}
            variant="emerald"
            trend={8.3}
            sparklineData={[40, 55, 45, 60, 70, 65, 80, 85]}
            onClick={() => setCurrentPanel('ventas')}
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <KPICard
            label="Stock Actual"
            value={stockActual}
            format="number"
            suffix=" uds"
            icon={Package}
            variant="amethyst"
            trend={-3.2}
            sparklineData={[100, 95, 90, 85, 88, 82, 78, 75]}
            onClick={() => setCurrentPanel('almacen')}
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <KPICard
            label="Órdenes Activas"
            value={ordenesActivas}
            format="number"
            icon={ShoppingCart}
            variant="amber"
            trend={15.8}
            sparklineData={[12, 15, 18, 14, 20, 22, 25, 28]}
            onClick={() => setCurrentPanel('ordenes')}
          />
        </div>

        {/* ============================================================ */}
        {/* MAIN CHART - Obsidian Card */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_CONFIG}
          className="col-span-12 lg:col-span-8"
        >
          <ObsidianCard glowVariant="sapphire" padding="lg" interactive={false}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <LuminousIcon icon={BarChart3} variant="sapphire" size="md" />
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white">Análisis Financiero</h3>
                  <p className="text-xs md:text-sm text-white/40">Flujo de capital en tiempo real</p>
                </div>
              </div>
              <div className="flex gap-1 p-1.5 bg-[rgba(0,0,0,0.3)] rounded-xl border border-white/[0.06]">
                {['1D', '1W', '1M', '1Y'].map((range) => (
                  <motion.button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all
                      ${timeRange === range
                        ? 'bg-gradient-to-r from-[#2563eb] to-[#0891b2] text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]'
                        : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING_CONFIG}
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
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#047857" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="rgba(255,255,255,0.2)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <Tooltip content={<ObsidianTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    name="Ventas"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fill="url(#colorVentas)"
                    {...SAFE_ANIMATION_PROPS}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#047857"
                    strokeWidth={2.5}
                    fill="url(#colorProfit)"
                    {...SAFE_ANIMATION_PROPS}
                  />
                </AreaChart>
              </SafeChartContainer>
            </div>
          </ObsidianCard>
        </motion.div>

        {/* ============================================================ */}
        {/* BANCOS SIDEBAR - Obsidian Card */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_CONFIG, delay: 0.1 }}
          className="col-span-12 lg:col-span-4"
        >
          <ObsidianCard glowVariant="emerald" padding="lg" interactive={false}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <LuminousIcon icon={Building2} variant="emerald" size="md" />
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white">Bancos</h3>
                  <p className="text-xs md:text-sm text-white/40">Saldos actualizados</p>
                </div>
              </div>
              <motion.button
                onClick={() => setCurrentPanel('bancos')}
                className="p-2.5 rounded-xl bg-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.5)] border border-white/[0.06] transition-all"
                whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_CONFIG}
              >
                <ExternalLink className="w-4 h-4 text-white/60" />
              </motion.button>
            </div>

            <div className="space-y-2 md:space-y-3 max-h-64 md:max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {bancos?.slice(0, 6).map((banco, index) => (
                <ObsidianBankCard key={banco.id} banco={banco} index={index} />
              ))}
            </div>
          </ObsidianCard>
        </motion.div>

        {/* ============================================================ */}
        {/* PIE CHART - Obsidian Card */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_CONFIG, delay: 0.15 }}
          className="col-span-12 md:col-span-6 lg:col-span-4"
        >
          <ObsidianCard glowVariant="amethyst" padding="lg" interactive={false}>
            <div className="flex items-center gap-3 mb-5">
              <LuminousIcon icon={Layers} variant="amethyst" size="sm" />
              <div>
                <h3 className="text-base md:text-lg font-bold text-white">Distribución</h3>
                <p className="text-xs text-white/40">Por categoría</p>
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
                  className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.3)] transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }}
                  />
                  <span className="text-xs text-white/60 truncate flex-1">{item.name}</span>
                  <span className="text-xs font-bold text-white">{item.value}%</span>
                </motion.div>
              ))}
            </div>
          </ObsidianCard>
        </motion.div>

        {/* ============================================================ */}
        {/* AI STATUS ORB - Obsidian Card */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="col-span-12 md:col-span-6 lg:col-span-4"
        >
          <ObsidianCard glowVariant="amethyst" padding="lg" interactive={false}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <LuminousIcon icon={Sparkles} variant="amethyst" size="sm" pulse />
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">AI Status</h3>
                  <p className="text-xs text-white/40">Asistente inteligente</p>
                </div>
              </div>
              <BadgeLuminous variant="success" size="sm">
                <Zap className="w-3 h-3" />
                Activo
              </BadgeLuminous>
            </div>

            {/* 3D Orb */}
            <div className="flex items-center justify-center py-4 md:py-6">
              <Suspense
                fallback={
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 animate-pulse" />
                }
              >
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
                  <p className={`text-sm md:text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-white/40">{stat.label}</p>
                </div>
              ))}
            </div>
          </ObsidianCard>
        </motion.div>

        {/* ============================================================ */}
        {/* ACTIVITY FEED - Obsidian Card */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_CONFIG, delay: 0.25 }}
          className="col-span-12 lg:col-span-4"
        >
          <ObsidianCard glowVariant="amber" padding="lg" interactive={false}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <LuminousIcon icon={Activity} variant="amber" size="sm" />
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">Actividad Reciente</h3>
                  <p className="text-xs text-white/40">Últimos movimientos</p>
                </div>
              </div>
              <motion.button
                className="p-2.5 rounded-xl bg-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.5)] border border-white/[0.06] transition-all"
                whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.15)' }}
                transition={SPRING_CONFIG}
              >
                <Clock className="w-4 h-4 text-white/60" />
              </motion.button>
            </div>

            <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {activities.map((activity, index) => (
                <ObsidianActivityItem key={index} {...activity} />
              ))}
            </div>
          </ObsidianCard>
        </motion.div>

        {/* ============================================================ */}
        {/* OBJECTIVES - Obsidian Card */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.87 }}
          className="col-span-12 lg:col-span-4"
        >
          <ObsidianCard glowVariant="cyan" padding="lg" interactive={false}>
            <div className="flex items-center gap-3 mb-5">
              <LuminousIcon icon={Target} variant="cyan" size="sm" />
              <div>
                <h4 className="text-base font-bold text-white">Objetivos del Mes</h4>
                <p className="text-xs text-white/40">Progreso actual</p>
              </div>
            </div>
            <div className="space-y-5">
              {[
                { label: 'Ventas', value: 78, color: 'from-[#0891b2] to-[#2563eb]', glow: 'rgba(8,145,178,0.5)' },
                { label: 'Nuevos Clientes', value: 92, color: 'from-[#047857] to-[#10b981]', glow: 'rgba(4,120,87,0.5)' },
                { label: 'Entregas', value: 65, color: 'from-[#7c3aed] to-[#ec4899]', glow: 'rgba(124,58,237,0.5)' },
              ].map((obj, i) => (
                <div key={obj.label}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/60">{obj.label}</span>
                    <span className="text-white font-bold font-mono">{obj.value}%</span>
                  </div>
                  <div className="h-2 bg-[rgba(0,0,0,0.3)] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${obj.color} rounded-full`}
                      style={{ boxShadow: `0 0 12px ${obj.glow}` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${obj.value}%` }}
                      transition={{ delay: 1 + i * 0.1, duration: 1.2, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ObsidianCard>
        </motion.div>

        {/* ============================================================ */}
        {/* QUICK ACTIONS BAR - Obsidian Card */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_CONFIG, delay: 0.3 }}
          className="col-span-12"
        >
          <ObsidianCard padding="md" interactive={false}>
            {/* Gradient line on top */}
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#2563eb]/50 to-transparent" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Status */}
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 10px rgba(4,120,87,0.6)' }} />
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
                <ObsidianActionButton label="Nueva Venta" icon={DollarSign} onClick={() => setIsVentaModalOpen(true)} variant="secondary" />
                <ObsidianActionButton label="Nueva Orden" icon={Package} onClick={() => setIsOrdenModalOpen(true)} variant="primary" />
                <ObsidianActionButton label="Transferencia" icon={ArrowUpRight} onClick={() => setIsTransferenciaModalOpen(true)} />
                <ObsidianActionButton label="Reportes" icon={BarChart3} onClick={() => setCurrentPanel('reportes')} />
              </div>
            </div>
          </ObsidianCard>
        </motion.div>

        {/* ============================================================ */}
        {/* MODALES */}
        {/* ============================================================ */}
        <CreateOrdenCompraModalPremium open={isOrdenModalOpen} onClose={() => setIsOrdenModalOpen(false)} />
        <CreateVentaModalPremium open={isVentaModalOpen} onClose={() => setIsVentaModalOpen(false)} />
        <CreateTransferenciaModalPremium open={isTransferenciaModalOpen} onClose={() => setIsTransferenciaModalOpen(false)} />
      </div>
    </>
  )
}
