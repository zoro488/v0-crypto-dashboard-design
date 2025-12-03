'use client'

/**
 * 🎨 CHRONOS 2025 Dashboard
 * 
 * Layout Premium 2025:
 * - 1 Hero Card gigante arriba (Capital Total + gráfico 30 días)
 * - Grid de 4-6 KPI cards medianas
 * - Actividad reciente estilo Twitter
 * - 1 FAB principal abajo derecha (opcional)
 * 
 * Colores: #0066FF (azul cobalto) + #C81EFF (magenta)
 * Glassmorphism sutil: blur 20px + border rgba(255,255,255,0.08)
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  PieChart, 
  Users, 
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Zap,
} from 'lucide-react'
import { CHRONOS_2025 } from '@/app/lib/chronos-2025-tokens'
import { 
  HeroCard, 
  KPICard, 
  GlassCard, 
  ChronosButton,
  EmptyState,
  ActivityListItem,
  GradientText,
} from '@/app/components/ui/chronos-2025-components'
// ═══════════════════════════════════════════════════════════════════════════
// 🔴 TESLA 2025 DESIGN SYSTEM - Componentes Legacy (para compatibilidad)
// ═══════════════════════════════════════════════════════════════════════════
import { 
  SkeletonDashboard,
} from '@/app/components/ui/tesla-index'
import { Skeleton } from '@/app/components/ui/skeleton'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { SafeChartContainer, SAFE_ANIMATION_PROPS } from '@/app/components/ui/SafeChartContainer'
import { useState, useEffect, useMemo, memo, useCallback } from 'react'
import { 
  useRealtimeVentas, 
  useRealtimeOrdenesCompra, 
  useRealtimeAlmacen, 
  useRealtimeBancos, 
} from '@/app/hooks/useRealtimeCollection'
import { CreateOrdenCompraModalPremium } from '@/app/components/modals/CreateOrdenCompraModalPremium'
import { CreateVentaModalPremium } from '@/app/components/modals/CreateVentaModalPremium'
import { CreateTransferenciaModalPremium } from '@/app/components/modals/CreateTransferenciaModalPremium'
import RevenueWidget from '@/app/components/widgets/RevenueWidget'
import TopProductsWidget from '@/app/components/widgets/TopProductsWidget'
import { InteractiveMetricsOrb } from '@/app/components/visualizations/InteractiveMetricsOrb'
import { FinancialRiverFlow } from '@/app/components/visualizations/FinancialRiverFlow'
import { cn } from '@/app/lib/utils'
import { logger } from '@/app/lib/utils/logger'

// Spring animation Chronos 2025
const SPRING_CONFIG = CHRONOS_2025.animations.spring

// Interfaces para tipado
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

// Tooltip Chronos 2025 - Glassmorphism sutil
const CustomTooltip = memo(function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div 
        className="p-4 rounded-[12px]"
        style={{
          background: 'rgba(20, 20, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: CHRONOS_2025.shadows.lg,
        }}
      >
        <p className="text-[#A0A0A0] text-[12px] mb-2 font-medium uppercase tracking-wide">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-white font-bold font-mono text-[14px]">${entry.value.toLocaleString()}</span>
            <span className="text-[#6B6B6B] text-[11px] uppercase">{entry.name}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
})

export default memo(function BentoDashboard() {
  // 📦 Hooks en TIEMPO REAL - onSnapshot
  const { data: bancosData, loading: loadingBancos, isConnected: bancosConnected } = useRealtimeBancos()
  const { data: ventasRaw, loading: loadingVentas, isConnected: ventasConnected } = useRealtimeVentas()
  const { data: ordenesCompraRaw, loading: loadingOC, isConnected: ocConnected } = useRealtimeOrdenesCompra()
  const { data: productosRaw, loading: loadingProductos } = useRealtimeAlmacen()
  
  // Log para verificar conexiones en tiempo real
  useEffect(() => {
    if (ventasConnected && ocConnected && bancosConnected) {
      logger.info('TIEMPO REAL ACTIVO', { 
        context: 'BentoDashboard', 
        data: { ventas: ventasRaw.length, ordenesCompra: ordenesCompraRaw.length, bancos: bancosData.length } 
      })
    }
  }, [ventasRaw.length, ordenesCompraRaw.length, bancosData.length, ventasConnected, ocConnected, bancosConnected])

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

  // Casting seguro
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
    const timer = setTimeout(() => {
      setShowChronos(false)
    }, 3500)
    return () => clearTimeout(timer)
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁLCULOS OPTIMIZADOS CON useMemo - Solo se recalculan cuando cambian datos
  // ═══════════════════════════════════════════════════════════════════════════
  
  const metrics = useMemo(() => {
    const capitalTotal = bancos?.reduce((acc, b) => acc + (b?.saldo || 0), 0) || 0
    const ventasMes = ventas?.reduce((acc, v) => acc + (v?.montoTotal ?? 0), 0) ?? 0
    const stockActual = productos?.reduce((acc, p) => acc + (p?.stock ?? 0), 0) ?? 0
    const ordenesActivas = ordenesCompra?.filter((oc) => oc?.estado === 'pendiente')?.length ?? 0
    // Ventas del día actual
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

  // Helper para formatear fecha de Firestore
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

  const mockChartData = useMemo(() => 
    ventas?.slice(-7).map((v) => ({
      name: formatVentaDate(v?.fecha),
      value: v?.montoTotal ?? 0,
      sales: (v?.precioVenta ?? 0) * (v?.cantidad ?? 0),
      profit: v?.ganancia ?? 0,
    })) ?? []
  , [ventas])

  const radarData = useMemo(() => [
    { subject: 'Ventas', A: 120, fullMark: 150 },
    { subject: 'Compras', A: 98, fullMark: 150 },
    { subject: 'Stock', A: 86, fullMark: 150 },
    { subject: 'Distribución', A: 99, fullMark: 150 },
    { subject: 'Profit', A: 85, fullMark: 150 },
    { subject: 'Clientes', A: 65, fullMark: 150 },
  ], [])

  // KPI Stats con nuevo sistema de colores Chronos 2025
  const stats = useMemo(() => [
    {
      title: 'Capital Total',
      value: `$${metrics.capitalTotal.toLocaleString()}`,
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'primary' as const,
    },
    {
      title: 'Ventas del Mes',
      value: `$${metrics.ventasMes.toLocaleString()}`,
      change: '+8.3%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'success' as const,
    },
    {
      title: 'Stock Actual',
      value: metrics.stockActual.toString(),
      change: '-3.2%',
      trend: 'down' as const,
      icon: Package,
      color: 'accent' as const,
    },
    {
      title: 'Órdenes Activas',
      value: metrics.ordenesActivas.toString(),
      change: '+15.8%',
      trend: 'up' as const,
      icon: ShoppingCart,
      color: 'warning' as const,
    },
  ], [metrics])

  if (loadingVentas || loadingOC || loadingProductos) {
    return (
      <div className="min-h-screen bg-black p-6">
        <SkeletonDashboard />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6">
      {/* ═══════════════════════════════════════════════════════════════════════
          CHRONOS 2025 INTRO SPLASH
       ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {showChronos && (
          <motion.div
            key="chronos-intro"
            initial={{ opacity: 0, height: 400 }}
            animate={{ opacity: 1, height: 400 }}
            exit={{
              opacity: 0,
              height: 0,
              transition: { duration: 0.8, ease: [0.83, 0, 0.17, 1] },
            }}
            className="mb-8 overflow-hidden"
          >
            <div 
              className="relative h-full rounded-[16px] overflow-hidden"
              style={{
                background: 'rgba(20, 20, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Gradient overlay con nuevos colores */}
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                  background: `radial-gradient(ellipse at top, ${CHRONOS_2025.colors.primaryMuted}, transparent 60%), radial-gradient(ellipse at bottom right, ${CHRONOS_2025.colors.accentMuted}, transparent 60%)`,
                }}
              />

              <div className="relative h-full flex flex-col items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={SPRING_CONFIG}
                  className="text-center"
                >
                  {/* Logo grande centrado */}
                  <motion.h1
                    className="text-white mb-4 font-bold"
                    style={{
                      fontSize: '72px',
                      letterSpacing: '-0.03em',
                      textShadow: `0 0 80px ${CHRONOS_2025.colors.primaryGlow}`,
                    }}
                  >
                    <GradientText>CHRONOS</GradientText>
                  </motion.h1>

                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-[1px] w-80 mx-auto"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${CHRONOS_2025.colors.glassBorder}, transparent)`,
                    }}
                  />

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 text-[14px] tracking-[0.2em] uppercase"
                    style={{ color: CHRONOS_2025.colors.textSecondary }}
                  >
                    Sistema de Gestión Inteligente
                  </motion.p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO CARD GIGANTE - Capital Total + Gráfico 30 días
       ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_CONFIG, delay: showChronos ? 0 : 0.1 }}
        className="mb-6"
      >
        <HeroCard
          title="Capital Total del Sistema"
          subtitle="Actualizado en tiempo real"
          value={`$${metrics.capitalTotal.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          chart={
            <div className="h-[200px] w-full">
              <SafeChartContainer height={200} minHeight={150}>
                <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue2025" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHRONOS_2025.colors.primary} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHRONOS_2025.colors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#6B6B6B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6B6B6B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={CHRONOS_2025.colors.primary}
                    strokeWidth={2}
                    fill="url(#colorValue2025)"
                    {...SAFE_ANIMATION_PROPS}
                  />
                </AreaChart>
              </SafeChartContainer>
            </div>
          }
        />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          GRID DE 4 KPI CARDS MEDIANAS (escaneabilidad en 100ms)
       ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_CONFIG, delay: showChronos ? 0 : 0.2 + index * 0.08 }}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          >
            <KPICard
              title={stat.title}
              value={stat.value}
              change={stat.change}
              trend={stat.trend}
              icon={stat.icon}
              color={stat.color}
            />
          </motion.div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          VISUALIZACIÓN 3D INTERACTIVA - FLUJO FINANCIERO DE BANCOS
       ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_CONFIG, delay: 0.35 }}
        className="mb-6"
      >
        <div 
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(20, 20, 30, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
                Flujo Financiero en Tiempo Real
              </h3>
              <p className="text-white/40 text-xs mt-1">Visualización 3D interactiva de transacciones entre bancos</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#00FF57] font-mono bg-[#00FF57]/10 px-2 py-1 rounded-lg">LIVE</span>
            </div>
          </div>
          
          <div className="flex justify-center py-6">
            <FinancialRiverFlow
              accounts={bancos.slice(0, 4).map((banco, index) => {
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
                const positions = [
                  { x: 150, y: 200 },
                  { x: 450, y: 120 },
                  { x: 450, y: 280 },
                  { x: 750, y: 200 },
                ]
                return {
                  id: banco.id,
                  name: banco.nombre,
                  balance: banco.saldo,
                  x: positions[index]?.x || 300,
                  y: positions[index]?.y || 200,
                  color: colors[index] || '#3b82f6',
                  ripples: [],
                }
              })}
              width={900}
              height={350}
              className="rounded-xl"
            />
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECCIÓN: BANCOS CON SALDOS REALES (Cards Premium)
       ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_CONFIG, delay: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4 px-2">
          <div>
            <h3 className="text-lg font-bold text-white">Saldos de Bancos</h3>
            <p className="text-xs text-white/40 mt-1">7 cuentas • Actualizado en tiempo real</p>
          </div>
          <motion.button 
            className="text-xs text-[#0066FF] hover:text-[#0066FF]/80 font-medium flex items-center gap-1"
            whileHover={{ x: 4 }}
          >
            Ver todos <ArrowUpRight className="w-3 h-3" />
          </motion.button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {bancos.map((banco, index) => {
            const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f97316']
            const color = colors[index % colors.length]
            const trend = Math.random() > 0.3 ? 'up' : 'down'
            const trendValue = (Math.random() * 15).toFixed(1)
            
            return (
              <motion.div
                key={banco.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING_CONFIG, delay: 0.42 + index * 0.03 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <div 
                  className="relative overflow-hidden rounded-2xl p-4 h-full"
                  style={{
                    background: `linear-gradient(135deg, ${color}15, ${color}05)`,
                    border: `1px solid ${color}30`,
                  }}
                >
                  {/* Glow efecto en hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${color}30, transparent 70%)`,
                    }}
                  />
                  
                  {/* Contenido */}
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${color}25` }}
                      >
                        <DollarSign className="w-4 h-4" style={{ color }} />
                      </div>
                    </div>
                    
                    <p className="text-white/60 text-xs font-medium mb-1 truncate">{banco.nombre}</p>
                    <p className="text-white font-bold text-lg font-mono">
                      ${(banco.saldo / 1000).toFixed(0)}k
                    </p>
                    
                    <div className="flex items-center gap-1 mt-2">
                      {trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 text-[#00FF57]" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-[#FF4444]" />
                      )}
                      <span className={`text-xs font-medium ${trend === 'up' ? 'text-[#00FF57]' : 'text-[#FF4444]'}`}>
                        {trend === 'up' ? '+' : '-'}{trendValue}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ORB 3D INTERACTIVO - MÉTRICAS PRINCIPALES
       ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_CONFIG, delay: 0.45 }}
          className="col-span-12 lg:col-span-6"
        >
          <div 
            className="rounded-2xl p-6 h-full flex items-center justify-center"
            style={{
              background: 'rgba(20, 20, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <InteractiveMetricsOrb
              metrics={[
                { label: 'Capital', value: metrics.capitalTotal, change: 12.5, icon: DollarSign, color: '#10b981' },
                { label: 'Ventas', value: metrics.ventasMes, change: 8.3, icon: TrendingUp, color: '#3b82f6' },
                { label: 'Stock', value: metrics.stockActual, change: -3.2, icon: Package, color: '#f59e0b' },
                { label: 'Órdenes', value: metrics.ordenesActivas, change: 15.8, icon: ShoppingCart, color: '#8b5cf6' },
              ]}
              size={380}
              className="mx-auto"
            />
          </div>
        </motion.div>

        {/* Distribución Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_CONFIG, delay: 0.5 }}
          className="col-span-12 lg:col-span-6 glass-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Distribución</h3>
              <p className="text-white/40 text-xs mt-1">Ventas vs Profit</p>
            </div>
            <div className="p-2 bg-[#0066FF]/10 rounded-xl border border-[#0066FF]/20">
              <PieChart className="w-5 h-5 text-[#0066FF]" strokeWidth={1.8} />
            </div>
          </div>

          <div className="h-[320px] w-full">
            <SafeChartContainer height={320} minHeight={280}>
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#6B6B6B" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="sales" name="Ventas" fill={CHRONOS_2025.colors.accent} radius={[4, 4, 0, 0]} stackId="a" {...SAFE_ANIMATION_PROPS} />
                <Bar dataKey="profit" name="Profit" fill={CHRONOS_2025.colors.primary} radius={[4, 4, 0, 0]} stackId="a" {...SAFE_ANIMATION_PROPS} />
              </BarChart>
            </SafeChartContainer>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          BARRA DE ACCIONES RÁPIDAS (1 FAB principal + acciones secundarias)
       ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_CONFIG, delay: 0.5 }}
        className="glass-card rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4 px-2">
          <div className="w-2 h-2 rounded-full bg-[#00FF57] animate-pulse shadow-[0_0_8px_#00FF57]" />
          <span className="text-white/60 text-sm font-mono">
            SISTEMA: <span className="text-white font-medium">OPERATIVO</span>
          </span>
        </div>

        <div className="flex gap-3">
          {/* FAB Principal */}
          <ChronosButton
            variant="primary"
            onClick={() => setIsOrdenModalOpen(true)}
            icon={Plus}
          >
            Nueva Orden
          </ChronosButton>
          
          {/* Acciones secundarias */}
          <ChronosButton
            variant="secondary"
            onClick={() => setIsVentaModalOpen(true)}
          >
            Venta
          </ChronosButton>
          <ChronosButton
            variant="secondary"
            onClick={() => setIsTransferenciaModalOpen(true)}
          >
            Transferencia
          </ChronosButton>
          <ChronosButton
            variant="ghost"
            onClick={() => useAppStore.getState().setCurrentPanel('reportes')}
          >
            Reportes
          </ChronosButton>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ACTIVIDAD RECIENTE (estilo Twitter/Linear)
       ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_CONFIG, delay: 0.55 }}
        className="glass-card rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Actividad Reciente</h3>
          <span className="text-xs text-white/40">Últimas 5 transacciones</span>
        </div>
        
        <div className="space-y-1">
          {ventas && ventas.length > 0 ? (
            ventas.slice(0, 5).map((venta, index) => {
              const monto = (venta as Record<string, unknown>).montoTotal as number || 
                           (venta as Record<string, unknown>).precioTotalVenta as number || 0
              const fecha = venta.fecha && typeof venta.fecha === 'object' && 'seconds' in venta.fecha 
                ? new Date((venta.fecha as {seconds: number}).seconds * 1000) 
                : new Date()
              
              return (
                <ActivityListItem
                  key={venta.id || index}
                  title={`Venta #${venta.id?.slice(-4) || index + 1}`}
                  description={(venta as Record<string, unknown>).cliente as string || 'Cliente'}
                  amount={monto}
                  timestamp={fecha}
                  status="success"
                  index={index}
                />
              )
            })
          ) : (
            <EmptyState
              icon={Activity}
              title="Sin actividad reciente"
              description="Las transacciones aparecerán aquí"
              action={{
                label: 'Registrar primera venta',
                onClick: () => setIsVentaModalOpen(true),
              }}
            />
          )}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          INDICADORES DE ESTADO DEL SISTEMA
       ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_CONFIG, delay: 0.6 }}
        className="glass-card rounded-2xl p-4 mb-6"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Ventas', value: ventas?.length || 0, color: CHRONOS_2025.colors.success },
            { label: 'Bancos', value: bancos?.length || 0, color: CHRONOS_2025.colors.primary },
            { label: 'Stock', value: metrics.stockActual, color: CHRONOS_2025.colors.accent },
            { label: 'Órdenes', value: metrics.ordenesActivas, color: CHRONOS_2025.colors.warning },
          ].map((stat, i) => (
            <div key={stat.label} className="text-center py-2">
              <p className="text-2xl font-bold text-white font-mono">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">{stat.label}</p>
              <div 
                className="w-8 h-1 mx-auto mt-2 rounded-full opacity-60"
                style={{ backgroundColor: stat.color }}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          WIDGETS PREMIUM - Revenue & Top Products
       ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <RevenueWidget 
          value={metrics.ventasDelDia}
          change={12.5}
          data={mockChartData.slice(-7).map((d) => ({ 
            time: d.name, 
            value: d.value, 
          }))}
          sparkle
        />
        <TopProductsWidget 
          products={productos?.slice(0, 5).map((p, i) => ({
            id: (p as Record<string, unknown>).id as string || String(i),
            name: (p as Record<string, unknown>).nombre as string || (p as Record<string, unknown>).sku as string || `Producto ${i + 1}`,
            sales: (p as Record<string, unknown>).stock as number || 0,
            revenue: ((p as Record<string, unknown>).stock as number || 0) * ((p as Record<string, unknown>).precioVenta as number || 100),
            trend: Math.random() * 20 - 10,
          })) || []}
        />
      </div>

      <CreateOrdenCompraModalPremium open={isOrdenModalOpen} onClose={() => setIsOrdenModalOpen(false)} />
      <CreateVentaModalPremium open={isVentaModalOpen} onClose={() => setIsVentaModalOpen(false)} />
      <CreateTransferenciaModalPremium open={isTransferenciaModalOpen} onClose={() => setIsTransferenciaModalOpen(false)} />
    </div>
  )
})
