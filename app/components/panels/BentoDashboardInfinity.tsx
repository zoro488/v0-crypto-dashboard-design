'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🌌 CHRONOS INFINITY DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Dashboard Ultra Premium con:
 * - Efectos 3D CSS con perspective
 * - Sombras volumétricas multicapa
 * - Animaciones spring (Framer Motion)
 * - Glassmorphism 3ª generación
 * - Holographic shimmer effects
 * - Paleta: Oro, Violeta, Esmeralda, Rosa Plasma
 * 
 * @version 3.0.0 INFINITY
 */

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Package, 
  ShoppingCart, 
  PieChart, 
  Users, 
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Wallet,
  BarChart3,
  CircleDollarSign,
  Layers,
  Eye,
  ExternalLink,
} from 'lucide-react'
import { 
  InfinityCard,
  InfinityHeroCard,
  InfinityKPICard,
  InfinityButton,
  InfinityBadge,
  InfinityAmbientBackground,
  InfinityStatInline,
  InfinityFloatingOrb,
  InfinityGlassPanel,
  InfinityGradientText,
} from '@/app/components/ui/infinity-components'
import { INFINITY, INFINITY_COLORS, INFINITY_GRADIENTS, INFINITY_SHADOWS, INFINITY_ANIMATIONS } from '@/app/lib/design/infinity-tokens'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts'
import { SafeChartContainer, SAFE_ANIMATION_PROPS } from '@/app/components/ui/SafeChartContainer'
import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react'
import { 
  useRealtimeVentas, 
  useRealtimeOrdenesCompra, 
  useRealtimeAlmacen, 
  useRealtimeBancos, 
} from '@/app/hooks/useRealtimeCollection'
import { CreateOrdenCompraModalPremium } from '@/app/components/modals/CreateOrdenCompraModalPremium'
import { CreateVentaModalPremium } from '@/app/components/modals/CreateVentaModalPremium'
import { CreateTransferenciaModalPremium } from '@/app/components/modals/CreateTransferenciaModalPremium'
import { InteractiveMetricsOrb } from '@/app/components/visualizations/InteractiveMetricsOrb'
import { FinancialRiverFlow } from '@/app/components/visualizations/FinancialRiverFlow'
import { cn } from '@/app/lib/utils'
import { logger } from '@/app/lib/utils/logger'

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🎨 CONSTANTES Y CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════════════

const SPRING_CONFIG = INFINITY_ANIMATIONS.springConfig

interface VentaData {
  id?: string
  montoTotal?: number
  precioVenta?: number
  cantidad?: number
  ganancia?: number
  cliente?: string
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
  nombre?: string
  sku?: string
  precioVenta?: number
  [key: string]: unknown
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🎯 TOOLTIP INFINITY
// ═══════════════════════════════════════════════════════════════════════════════════════

interface TooltipPayloadEntry {
  color: string
  value: number
  name: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}

const InfinityTooltip = memo(function InfinityTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="infinity-tooltip"
        style={{
          background: 'rgba(5, 5, 15, 0.95)',
          backdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255, 215, 0, 0.15)',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: INFINITY_SHADOWS.xl,
        }}
      >
        <p className="text-white/40 text-[11px] mb-3 font-semibold uppercase tracking-[0.15em]">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 mb-2 last:mb-0">
            <div 
              className="w-3 h-3 rounded-full shadow-lg" 
              style={{ 
                backgroundColor: entry.color,
                boxShadow: `0 0 12px ${entry.color}80`,
              }} 
            />
            <span className="text-white font-bold font-mono text-[15px]">
              ${entry.value.toLocaleString()}
            </span>
            <span className="text-white/40 text-[11px] uppercase tracking-wide">{entry.name}</span>
          </div>
        ))}
      </motion.div>
    )
  }
  return null
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🏦 BANCO CARD 3D - Componente individual de banco con efectos premium
// ═══════════════════════════════════════════════════════════════════════════════════════

interface BancoCardProps {
  banco: {
    id: string
    nombre: string
    saldo: number
    capitalActual: number
    historicoIngresos: number
    historicoGastos: number
  }
  index: number
  color: string
}

const BancoCard3D = memo(function BancoCard3D({ banco, index, color }: BancoCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const rotateX = useSpring(useTransform(y, [-50, 50], [10, -10]), { stiffness: 400, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-50, 50], [-10, 10]), { stiffness: 400, damping: 30 })
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    x.set(e.clientX - rect.left - rect.width / 2)
    y.set(e.clientY - rect.top - rect.height / 2)
  }
  
  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }
  
  const trend = Math.random() > 0.3 ? 'up' : 'down'
  const trendValue = (Math.random() * 15).toFixed(1)
  
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ ...SPRING_CONFIG, delay: 0.1 + index * 0.05 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      className="group cursor-pointer"
    >
      <div 
        className="relative overflow-hidden rounded-2xl p-5 h-full transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, ${color}12 0%, ${color}05 50%, transparent 100%)`,
          border: `1px solid ${color}25`,
          boxShadow: isHovered 
            ? `0 25px 50px -12px ${color}30, 0 0 0 1px ${color}40, inset 0 1px 0 ${color}20`
            : `0 10px 40px -15px ${color}20`,
          transform: 'translateZ(0)',
        }}
      >
        {/* Holographic shimmer */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background: `linear-gradient(135deg, transparent 0%, ${color}08 50%, transparent 100%)`,
          }}
        />
        
        {/* Glow orb on hover */}
        <motion.div 
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: color }}
          animate={{ opacity: isHovered ? 0.15 : 0 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                boxShadow: `0 4px 20px ${color}25`,
              }}
            >
              <Wallet className="w-5 h-5" style={{ color }} />
            </div>
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ 
                background: color,
                boxShadow: `0 0 8px ${color}`,
              }}
            />
          </div>
          
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 truncate">
            {banco.nombre}
          </p>
          
          <motion.p 
            className="text-white font-bold text-2xl font-mono tracking-tight"
            animate={{ scale: isHovered ? 1.02 : 1 }}
          >
            ${(banco.saldo / 1000).toFixed(1)}k
          </motion.p>
          
          <div className="flex items-center gap-2 mt-4">
            <span 
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{
                background: trend === 'up' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: trend === 'up' ? '#10b981' : '#ef4444',
              }}
            >
              {trend === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend === 'up' ? '+' : '-'}{trendValue}%
            </span>
          </div>
        </div>
        
        {/* 3D depth layer */}
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-50"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
          }}
        />
      </div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// 📊 ACTIVITY ITEM INFINITY - Item de actividad con efectos premium
// ═══════════════════════════════════════════════════════════════════════════════════════

interface ActivityItemProps {
  venta: VentaData
  index: number
}

const ActivityItemInfinity = memo(function ActivityItemInfinity({ venta, index }: ActivityItemProps) {
  const monto = venta.montoTotal || 0
  const fecha = venta.fecha && typeof venta.fecha === 'object' && 'seconds' in venta.fecha 
    ? new Date(venta.fecha.seconds * 1000) 
    : new Date()
  
  const timeAgo = useMemo(() => {
    const diff = Date.now() - fecha.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }, [fecha])
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SPRING_CONFIG, delay: index * 0.08 }}
      whileHover={{ x: 8, backgroundColor: 'rgba(255, 215, 0, 0.03)' }}
      className="group flex items-center justify-between py-4 px-4 -mx-4 rounded-xl cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
          }}
        >
          <DollarSign className="w-5 h-5 text-emerald-400" />
        </div>
        
        <div>
          <p className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">
            Venta #{venta.id?.slice(-4) || index + 1}
          </p>
          <p className="text-white/40 text-xs mt-0.5">
            {venta.cliente || 'Cliente'} • {timeAgo}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-emerald-400 font-bold font-mono text-lg">
          +${monto.toLocaleString()}
        </p>
        <InfinityBadge variant="emerald" className="text-[10px]">
          Completada
        </InfinityBadge>
      </div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🎯 MAIN COMPONENT - BENTO DASHBOARD INFINITY
// ═══════════════════════════════════════════════════════════════════════════════════════

export default memo(function BentoDashboardInfinity() {
  // 📦 Hooks en TIEMPO REAL
  const { data: bancosData, loading: loadingBancos, isConnected: bancosConnected } = useRealtimeBancos()
  const { data: ventasRaw, loading: loadingVentas, isConnected: ventasConnected } = useRealtimeVentas()
  const { data: ordenesCompraRaw, loading: loadingOC, isConnected: ocConnected } = useRealtimeOrdenesCompra()
  const { data: productosRaw, loading: loadingProductos } = useRealtimeAlmacen()
  
  useEffect(() => {
    if (ventasConnected && ocConnected && bancosConnected) {
      logger.info('🌌 INFINITY DASHBOARD - TIEMPO REAL ACTIVO', { 
        context: 'BentoDashboardInfinity', 
        data: { ventas: ventasRaw?.length, ordenes: ordenesCompraRaw?.length, bancos: bancosData?.length } 
      })
    }
  }, [ventasRaw?.length, ordenesCompraRaw?.length, bancosData?.length, ventasConnected, ocConnected, bancosConnected])

  // Transformar datos de bancos
  const bancos = useMemo(() => {
    return (bancosData || []).map((b: Record<string, unknown>) => ({
      id: (b.id as string) || '',
      nombre: (b.nombre as string) || 'Sin nombre',
      saldo: typeof b.saldo === 'number' ? b.saldo : (typeof b.capitalActual === 'number' ? b.capitalActual : 0),
      capitalActual: typeof b.capitalActual === 'number' ? b.capitalActual : 0,
      historicoIngresos: typeof b.historicoIngresos === 'number' ? b.historicoIngresos : 0,
      historicoGastos: typeof b.historicoGastos === 'number' ? b.historicoGastos : 0,
    }))
  }, [bancosData])

  const ventas = ventasRaw as VentaData[] | undefined
  const ordenesCompra = ordenesCompraRaw as OrdenCompraData[] | undefined
  const productos = productosRaw as ProductoData[] | undefined

  const [mounted, setMounted] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  
  const [isOrdenModalOpen, setIsOrdenModalOpen] = useState(false)
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false)
  const [isTransferenciaModalOpen, setIsTransferenciaModalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setShowIntro(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁLCULOS OPTIMIZADOS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const metrics = useMemo(() => {
    const capitalTotal = bancos?.reduce((acc, b) => acc + (b?.saldo || 0), 0) || 0
    const ventasMes = ventas?.reduce((acc, v) => acc + (v?.montoTotal ?? 0), 0) ?? 0
    const stockActual = productos?.reduce((acc, p) => acc + (p?.stock ?? 0), 0) ?? 0
    const ordenesActivas = ordenesCompra?.filter((oc) => oc?.estado === 'pendiente')?.length ?? 0
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const ventasDelDia = ventas?.filter(v => {
      if (!v?.fecha) return false
      let fecha: Date
      if (typeof v.fecha === 'object' && 'seconds' in v.fecha) {
        fecha = new Date(v.fecha.seconds * 1000)
      } else if (v.fecha instanceof Date) {
        fecha = v.fecha
      } else {
        fecha = new Date(v.fecha)
      }
      return fecha >= today
    }).reduce((acc, v) => acc + (v?.montoTotal ?? 0), 0) ?? 0
    
    return { capitalTotal, ventasMes, stockActual, ordenesActivas, ventasDelDia }
  }, [bancos, ventas, productos, ordenesCompra])

  const formatVentaDate = (fecha: VentaData['fecha']): string => {
    if (!fecha) return 'N/A'
    if (typeof fecha === 'object' && 'seconds' in fecha) {
      return new Date(fecha.seconds * 1000).toLocaleDateString('es-MX', { month: 'short' })
    }
    if (fecha instanceof Date) {
      return fecha.toLocaleDateString('es-MX', { month: 'short' })
    }
    return new Date(fecha).toLocaleDateString('es-MX', { month: 'short' })
  }

  const chartData = useMemo(() => 
    ventas?.slice(-7).map((v) => ({
      name: formatVentaDate(v?.fecha),
      value: v?.montoTotal ?? 0,
      sales: (v?.precioVenta ?? 0) * (v?.cantidad ?? 0),
      profit: v?.ganancia ?? 0,
    })) ?? []
  , [ventas])

  // Colores para bancos
  const bancoColors = ['#FFD700', '#9333EA', '#10B981', '#EC4899', '#3B82F6', '#06B6D4', '#F59E0B']

  // Loading state con skeleton premium
  if (loadingVentas || loadingOC || loadingProductos) {
    return (
      <div className="min-h-screen infinity-surface p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-96 rounded-3xl bg-white/5" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen infinity-surface relative">
      {/* 🌌 AMBIENT BACKGROUND */}
      <InfinityAmbientBackground />
      
      <div className="relative z-10 p-6 lg:p-8 max-w-[1800px] mx-auto">
        
        {/* ═══════════════════════════════════════════════════════════════════════
            INFINITY INTRO SPLASH
         ═══════════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {showIntro && (
            <motion.div
              key="infinity-intro"
              initial={{ opacity: 0, height: 450 }}
              animate={{ opacity: 1, height: 450 }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.8, ease: [0.83, 0, 0.17, 1] } }}
              className="mb-8 overflow-hidden"
            >
              <div 
                className="relative h-full rounded-3xl overflow-hidden"
                style={{
                  background: 'rgba(5, 5, 15, 0.7)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(255, 215, 0, 0.1)',
                  boxShadow: INFINITY_SHADOWS.heroCard,
                }}
              >
                {/* Gradient mesh */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{ background: INFINITY_GRADIENTS.meshAurora }}
                />
                
                {/* Floating orbs */}
                <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-gradient-to-r from-amber-500/20 to-transparent blur-3xl animate-pulse" />
                <div className="absolute bottom-10 right-20 w-72 h-72 rounded-full bg-gradient-to-l from-violet-500/20 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-t from-emerald-500/10 to-transparent blur-3xl" />

                <div className="relative h-full flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={SPRING_CONFIG}
                    className="text-center"
                  >
                    {/* Logo */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...SPRING_CONFIG, delay: 0.2 }}
                      className="mb-6"
                    >
                      <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-pulse" />
                    </motion.div>
                    
                    <motion.h1
                      className="mb-4 font-bold"
                      style={{
                        fontSize: '80px',
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                      }}
                    >
                      <InfinityGradientText variant="holographic" className="font-black">
                        CHRONOS
                      </InfinityGradientText>
                    </motion.h1>

                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      className="h-[2px] w-96 mx-auto rounded-full"
                      style={{
                        background: INFINITY_GRADIENTS.holographic,
                      }}
                    />

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9 }}
                      className="mt-8 text-[13px] tracking-[0.25em] uppercase font-semibold"
                      style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                    >
                      ∞ Infinity Dashboard Experience ∞
                    </motion.p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════════════
            HERO CARD INFINITY - Capital Total + Gráfico
         ═══════════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -5 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ ...SPRING_CONFIG, delay: showIntro ? 0 : 0.1 }}
          className="mb-8"
        >
          <InfinityHeroCard
            title="Capital Total del Sistema"
            subtitle="Sincronizado en tiempo real"
            value={metrics.capitalTotal}
            icon={CircleDollarSign}
            trend={{ value: 12.5, isPositive: true }}
          >
            <div className="h-[220px] w-full mt-6">
              <SafeChartContainer height={220} minHeight={180}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="infinityGoldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFD700" stopOpacity={0.5} />
                      <stop offset="50%" stopColor="#FFD700" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="infinityVioletGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9333EA" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#9333EA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<InfinityTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#FFD700"
                    strokeWidth={3}
                    fill="url(#infinityGoldGradient)"
                    {...SAFE_ANIMATION_PROPS}
                  />
                </AreaChart>
              </SafeChartContainer>
            </div>
          </InfinityHeroCard>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════════
            KPI CARDS GRID - 4 métricas principales con efectos 3D
         ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-12 gap-5 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...SPRING_CONFIG, delay: 0.2 }}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          >
            <InfinityKPICard
              title="Capital Total"
              value={`$${(metrics.capitalTotal / 1000).toFixed(1)}k`}
              change="+12.5% este mes"
              trend="up"
              icon={DollarSign}
              color="gold"
              delay={0.2}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...SPRING_CONFIG, delay: 0.25 }}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          >
            <InfinityKPICard
              title="Ventas del Mes"
              value={`$${(metrics.ventasMes / 1000).toFixed(1)}k`}
              change="+8.3% vs anterior"
              trend="up"
              icon={TrendingUp}
              color="emerald"
              delay={0.25}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...SPRING_CONFIG, delay: 0.3 }}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          >
            <InfinityKPICard
              title="Stock Actual"
              value={metrics.stockActual.toLocaleString()}
              change="-3.2% unidades"
              trend="down"
              icon={Package}
              color="violet"
              delay={0.3}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...SPRING_CONFIG, delay: 0.35 }}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          >
            <InfinityKPICard
              title="Órdenes Activas"
              value={metrics.ordenesActivas.toString()}
              change="+15.8% nuevas"
              trend="up"
              icon={ShoppingCart}
              color="plasma"
              delay={0.35}
            />
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            BANCOS GRID - Cards 3D con efectos holográficos
         ═══════════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_CONFIG, delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6 px-1">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Wallet className="w-5 h-5 text-amber-400" />
                Bóvedas Financieras
              </h3>
              <p className="text-white/40 text-sm mt-1">7 cuentas sincronizadas en tiempo real</p>
            </div>
            <InfinityButton variant="glass" size="sm" icon={Eye}>
              Ver detalles
            </InfinityButton>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {bancos.map((banco, index) => (
              <BancoCard3D
                key={banco.id}
                banco={banco}
                index={index}
                color={bancoColors[index % bancoColors.length]}
              />
            ))}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════════
            VISUALIZACIÓN 3D - Flujo Financiero + Orbe de Métricas
         ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          {/* Flujo Financiero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_CONFIG, delay: 0.45 }}
            className="col-span-12 lg:col-span-7"
          >
            <InfinityGlassPanel intensity="medium" className="p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                    Flujo Financiero 3D
                  </h3>
                  <p className="text-white/40 text-xs mt-1">Visualización de transacciones entre bancos</p>
                </div>
                <InfinityBadge variant="emerald" pulse>
                  <Zap className="w-3 h-3" /> LIVE
                </InfinityBadge>
              </div>
              
              <div className="flex justify-center">
                <FinancialRiverFlow
                  accounts={bancos.slice(0, 4).map((banco, index) => ({
                    id: banco.id,
                    name: banco.nombre,
                    balance: banco.saldo,
                    x: [150, 450, 450, 750][index] || 300,
                    y: [200, 120, 280, 200][index] || 200,
                    color: bancoColors[index],
                    ripples: [],
                  }))}
                  width={750}
                  height={350}
                  className="rounded-xl"
                />
              </div>
            </InfinityGlassPanel>
          </motion.div>

          {/* Orbe de Métricas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_CONFIG, delay: 0.5 }}
            className="col-span-12 lg:col-span-5"
          >
            <InfinityGlassPanel intensity="medium" className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-violet-400" />
                  Centro de Control
                </h3>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <InteractiveMetricsOrb
                  metrics={[
                    { label: 'Capital', value: metrics.capitalTotal, change: 12.5, icon: DollarSign, color: '#FFD700' },
                    { label: 'Ventas', value: metrics.ventasMes, change: 8.3, icon: TrendingUp, color: '#10B981' },
                    { label: 'Stock', value: metrics.stockActual, change: -3.2, icon: Package, color: '#9333EA' },
                    { label: 'Órdenes', value: metrics.ordenesActivas, change: 15.8, icon: ShoppingCart, color: '#EC4899' },
                  ]}
                  size={340}
                  className="mx-auto"
                />
              </div>
            </InfinityGlassPanel>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            ACCIONES RÁPIDAS - Barra de botones premium
         ═══════════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_CONFIG, delay: 0.55 }}
          className="mb-8"
        >
          <InfinityGlassPanel intensity="light" className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_#10b981]" />
                  <span className="text-white/50 text-sm font-mono">SISTEMA:</span>
                  <span className="text-emerald-400 font-bold text-sm">OPERATIVO</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-white/40 text-xs">{ventas?.length || 0} ventas • {bancos?.length || 0} bancos</span>
              </div>

              <div className="flex gap-3">
                <InfinityButton
                  variant="primary"
                  glow
                  onClick={() => setIsOrdenModalOpen(true)}
                  icon={Plus}
                >
                  Nueva Orden
                </InfinityButton>
                
                <InfinityButton
                  variant="secondary"
                  onClick={() => setIsVentaModalOpen(true)}
                  icon={DollarSign}
                >
                  Registrar Venta
                </InfinityButton>
                
                <InfinityButton
                  variant="glass"
                  onClick={() => setIsTransferenciaModalOpen(true)}
                  icon={ArrowUpRight}
                >
                  Transferencia
                </InfinityButton>
                
                <InfinityButton
                  variant="ghost"
                  onClick={() => useAppStore.getState().setCurrentPanel('reportes')}
                  icon={BarChart3}
                >
                  Reportes
                </InfinityButton>
              </div>
            </div>
          </InfinityGlassPanel>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════════
            ACTIVIDAD RECIENTE + DISTRIBUCIÓN
         ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          {/* Actividad Reciente */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_CONFIG, delay: 0.6 }}
            className="col-span-12 lg:col-span-7"
          >
            <InfinityGlassPanel intensity="medium" className="p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-amber-400" />
                    Actividad Reciente
                  </h3>
                  <p className="text-white/40 text-xs mt-1">Últimas 5 transacciones del sistema</p>
                </div>
                <InfinityButton variant="ghost" size="sm" icon={ExternalLink}>
                  Ver todas
                </InfinityButton>
              </div>
              
              {ventas && ventas.length > 0 ? (
                <div className="space-y-1 divide-y divide-white/5">
                  {ventas.slice(0, 5).map((venta, index) => (
                    <ActivityItemInfinity key={venta.id || index} venta={venta} index={index} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-white/40 text-sm mb-2">Sin actividad reciente</p>
                  <InfinityButton variant="primary" size="sm" onClick={() => setIsVentaModalOpen(true)}>
                    Registrar primera venta
                  </InfinityButton>
                </div>
              )}
            </InfinityGlassPanel>
          </motion.div>

          {/* Gráfico de Distribución */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_CONFIG, delay: 0.65 }}
            className="col-span-12 lg:col-span-5"
          >
            <InfinityGlassPanel intensity="medium" className="p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-violet-400" />
                    Distribución
                  </h3>
                  <p className="text-white/40 text-xs mt-1">Ventas vs Profit</p>
                </div>
              </div>

              <div className="h-[300px] w-full">
                <SafeChartContainer height={300} minHeight={250}>
                  <BarChart data={chartData}>
                    <defs>
                      <linearGradient id="barSalesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9333EA" stopOpacity={1} />
                        <stop offset="100%" stopColor="#9333EA" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="barProfitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFD700" stopOpacity={1} />
                        <stop offset="100%" stopColor="#FFD700" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<InfinityTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="sales" name="Ventas" fill="url(#barSalesGradient)" radius={[6, 6, 0, 0]} stackId="a" {...SAFE_ANIMATION_PROPS} />
                    <Bar dataKey="profit" name="Profit" fill="url(#barProfitGradient)" radius={[6, 6, 0, 0]} stackId="a" {...SAFE_ANIMATION_PROPS} />
                  </BarChart>
                </SafeChartContainer>
              </div>
            </InfinityGlassPanel>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            FOOTER STATS - Indicadores de estado
         ═══════════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_CONFIG, delay: 0.7 }}
        >
          <InfinityGlassPanel intensity="light" className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: 'Ventas Totales', value: ventas?.length || 0, color: '#10B981' },
                { label: 'Bancos Activos', value: bancos?.length || 0, color: '#FFD700' },
                { label: 'Stock Total', value: metrics.stockActual, color: '#9333EA' },
                { label: 'Órdenes Pendientes', value: metrics.ordenesActivas, color: '#EC4899' },
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label} 
                  className="text-center py-3"
                  whileHover={{ scale: 1.05 }}
                >
                  <p 
                    className="text-3xl font-bold font-mono"
                    style={{ color: stat.color }}
                  >
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-white/40 text-xs mt-2 uppercase tracking-wider">{stat.label}</p>
                  <div 
                    className="w-12 h-1 mx-auto mt-3 rounded-full"
                    style={{ 
                      backgroundColor: stat.color,
                      boxShadow: `0 0 12px ${stat.color}50`,
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </InfinityGlassPanel>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          FAB FLOTANTE - Acción principal
       ═══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-8 right-8 z-50">
        <InfinityFloatingOrb
          icon={Plus}
          color="gold"
          onClick={() => setIsOrdenModalOpen(true)}
        />
      </div>

      {/* Modales */}
      <CreateOrdenCompraModalPremium open={isOrdenModalOpen} onClose={() => setIsOrdenModalOpen(false)} />
      <CreateVentaModalPremium open={isVentaModalOpen} onClose={() => setIsVentaModalOpen(false)} />
      <CreateTransferenciaModalPremium open={isTransferenciaModalOpen} onClose={() => setIsTransferenciaModalOpen(false)} />
    </div>
  )
})
