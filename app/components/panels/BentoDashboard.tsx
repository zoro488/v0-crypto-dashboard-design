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
import { useState, useEffect, useMemo, memo } from 'react'
import { 
  useRealtimeVentas, 
  useRealtimeOrdenesCompra, 
  useRealtimeAlmacen, 
  useRealtimeBancos 
} from '@/app/hooks/useRealtimeCollection'
import { CreateOrdenCompraModalPremium } from '@/app/components/modals/CreateOrdenCompraModalPremium'
import { CreateVentaModalPremium } from '@/app/components/modals/CreateVentaModalPremium'
import { CreateTransferenciaModalPremium } from '@/app/components/modals/CreateTransferenciaModalPremium'
import { cn } from '@/app/lib/utils'

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
      console.log(`🔥 [BentoDashboard] TIEMPO REAL ACTIVO: ${ventasRaw.length} ventas, ${ordenesCompraRaw.length} OC, ${bancosData.length} bancos`)
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
    
    return { capitalTotal, ventasMes, stockActual, ordenesActivas }
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
          SECCIÓN: BANCOS (Lista compacta)
       ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_CONFIG, delay: 0.3 }}
        className="glass-card rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Bancos</h3>
            <p className="text-xs text-white/40 mt-1">Saldos actualizados en tiempo real</p>
          </div>
          <motion.button 
            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/[0.08] hover:border-white/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter className="w-4 h-4 text-white" strokeWidth={1.8} />
          </motion.button>
        </div>
        
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
          {bancos?.slice(0, 5).map((banco, index) => (
            <motion.div
              key={banco.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SPRING_CONFIG, delay: 0.35 + index * 0.05 }}
              className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/[0.08]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0066FF]/20 flex items-center justify-center border border-[#0066FF]/30">
                  <DollarSign className="w-5 h-5 text-white" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{banco.nombre}</p>
                  <p className="text-white/40 text-xs font-mono">ID: {banco.id.slice(-4)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">${banco.saldo.toLocaleString()}</p>
                <div className="flex items-center justify-end gap-1 text-[#00FF57] text-xs">
                  <TrendingUp className="w-3 h-3" strokeWidth={1.8} />
                  <span>+2.4%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          GRID: PERFORMANCE + DISTRIBUCIÓN (2 columnas)
       ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        {/* Performance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_CONFIG, delay: 0.4 }}
          className="col-span-12 lg:col-span-6 glass-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Performance</h3>
              <p className="text-white/40 text-xs mt-1">Métricas de rendimiento</p>
            </div>
            <div className="p-2 bg-[#C81EFF]/10 rounded-xl border border-[#C81EFF]/20">
              <Zap className="w-5 h-5 text-[#C81EFF]" strokeWidth={1.8} />
            </div>
          </div>
          
          <div className="h-[180px] w-full flex items-center justify-center">
            <p className="text-white/40 text-sm">RadarChart - Próximamente</p>
          </div>
        </motion.div>

        {/* Distribución Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_CONFIG, delay: 0.45 }}
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

          <div className="h-[180px] w-full">
            <SafeChartContainer height={180} minHeight={140}>
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
                label: "Registrar primera venta",
                onClick: () => setIsVentaModalOpen(true)
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

      <CreateOrdenCompraModalPremium open={isOrdenModalOpen} onClose={() => setIsOrdenModalOpen(false)} />
      <CreateVentaModalPremium open={isVentaModalOpen} onClose={() => setIsVentaModalOpen(false)} />
      <CreateTransferenciaModalPremium open={isTransferenciaModalOpen} onClose={() => setIsTransferenciaModalOpen(false)} />
    </div>
  )
})
