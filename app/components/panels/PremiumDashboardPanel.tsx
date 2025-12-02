'use client'

/**
 * 🎛️ PREMIUM DASHBOARD PANEL - CHRONOS
 * 
 * Dashboard ultra-premium con:
 * - Estadísticas animadas
 * - Gráficos 3D-like
 * - Efectos de partículas
 * - Glassmorphism completo
 * - Transiciones fluidas
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Package,
  Users,
  Activity,
  ArrowRight,
  Sparkles,
  Zap,
  Building2,
} from 'lucide-react'
import { useFirestoreCRUD } from '@/app/hooks/useFirestoreCRUD'
import { cn } from '@/app/lib/utils'
import type { Venta, Banco, OrdenCompra, Cliente } from '@/app/types'

// Premium Components
import { 
  Card3D, 
  AnimatedBarChart, 
  AnimatedRingChart,
  ParticleBackground,
  AnimatedStatCard,
  GradientOrb,
  MorphingBlob,
} from '@/app/components/ui/PremiumVisualizations'
import { 
  GlassSurface, 
  GradientText, 
  AnimatedCounter,
  PageTransition,
  ShimmerLoader,
} from '@/app/components/ui/PremiumDesignSystem'
import { animationPresets, useRevealOnScroll } from '@/app/lib/hooks/usePremiumAnimations'

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT - Ultra Premium
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumStatProps {
  title: string
  value: number
  format?: 'currency' | 'number' | 'percentage'
  trend?: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'cyan'
  delay?: number
}

const PremiumStat = ({ title, value, format = 'number', trend, icon, color, delay = 0 }: PremiumStatProps) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500/20 via-blue-500/10 to-transparent',
      border: 'border-blue-500/30 hover:border-blue-400/50',
      icon: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/20',
    },
    green: {
      bg: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
      border: 'border-emerald-500/30 hover:border-emerald-400/50',
      icon: 'from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-500/20',
    },
    purple: {
      bg: 'from-purple-500/20 via-purple-500/10 to-transparent',
      border: 'border-purple-500/30 hover:border-purple-400/50',
      icon: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/20',
    },
    amber: {
      bg: 'from-amber-500/20 via-amber-500/10 to-transparent',
      border: 'border-amber-500/30 hover:border-amber-400/50',
      icon: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/20',
    },
    rose: {
      bg: 'from-rose-500/20 via-rose-500/10 to-transparent',
      border: 'border-rose-500/30 hover:border-rose-400/50',
      icon: 'from-rose-500 to-pink-500',
      glow: 'shadow-rose-500/20',
    },
    cyan: {
      bg: 'from-cyan-500/20 via-cyan-500/10 to-transparent',
      border: 'border-cyan-500/30 hover:border-cyan-400/50',
      icon: 'from-cyan-500 to-blue-500',
      glow: 'shadow-cyan-500/20',
    },
  }

  const colors = colorClasses[color]

  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
      case 'percentage':
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString('es-MX')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group"
    >
      <Card3D className={cn('p-6', colors.border)} depth={8}>
        {/* Background gradient */}
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', colors.bg)} />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-white/60">{title}</span>
            <motion.div 
              className={cn(
                'p-2.5 rounded-xl bg-gradient-to-br shadow-lg',
                colors.icon,
                colors.glow
              )}
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
              {icon}
            </motion.div>
          </div>

          {/* Value */}
          <div className="mb-3">
            <AnimatedCounter
              value={value}
              duration={1.5}
              className="text-3xl font-bold text-white"
              prefix={format === 'currency' ? '$' : ''}
              suffix={format === 'percentage' ? '%' : ''}
            />
          </div>

          {/* Trend */}
          {trend !== undefined && (
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.3, type: 'spring' }}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                  trend >= 0 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/20 text-rose-400'
                )}
              >
                {trend >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </motion.div>
              <span className="text-xs text-white/40">vs mes anterior</span>
            </div>
          )}
        </div>
      </Card3D>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACTION BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

interface QuickActionProps {
  label: string
  icon: React.ReactNode
  color: string
  onClick: () => void
  delay?: number
}

const QuickAction = ({ label, icon, color, onClick, delay = 0 }: QuickActionProps) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={cn(
      'relative group flex items-center gap-3 px-5 py-4 rounded-2xl',
      'bg-gradient-to-r shadow-lg transition-all duration-300',
      'border border-white/10 hover:border-white/20',
      'overflow-hidden',
      color
    )}
  >
    {/* Shine effect */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
      animate={{ x: ['0%', '200%'] }}
      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
    />
    
    <div className="relative z-10 p-2 rounded-lg bg-white/20">
      {icon}
    </div>
    <span className="relative z-10 font-medium text-white">{label}</span>
    <ArrowRight className="relative z-10 w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
  </motion.button>
)

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY FEED ITEM
// ═══════════════════════════════════════════════════════════════════════════════

interface ActivityItemProps {
  title: string
  description: string
  time: string
  type: 'sale' | 'order' | 'transfer' | 'alert'
  delay?: number
}

const ActivityItem = ({ title, description, time, type, delay = 0 }: ActivityItemProps) => {
  const typeConfig = {
    sale: { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    order: { icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    transfer: { icon: ArrowRight, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    alert: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
      className="flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer"
    >
      <div className={cn('p-2 rounded-lg', config.bg)}>
        <Icon className={cn('w-4 h-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-xs text-white/50 truncate">{description}</p>
      </div>
      <span className="text-xs text-white/30 shrink-0">{time}</span>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function PremiumDashboardPanel() {
  const { data: ventas, loading: loadingVentas } = useFirestoreCRUD<Venta>('ventas')
  const { data: ordenes, loading: loadingOrdenes } = useFirestoreCRUD<OrdenCompra>('ordenes_compra')
  const { data: clientes, loading: loadingClientes } = useFirestoreCRUD<Cliente>('clientes')
  
  const loading = loadingVentas || loadingOrdenes || loadingClientes

  // Calculate stats
  const stats = useMemo(() => {
    const totalVentas = ventas?.reduce((acc, v) => acc + (v.precioVenta * v.cantidad), 0) || 0
    const totalOrdenes = ordenes?.length || 0
    const totalClientes = clientes?.length || 0
    const totalUtilidades = ventas?.reduce((acc, v) => {
      const ganancia = ((v.precioVenta || 0) - (v.precioCompra || 0) - (v.precioFlete || 0)) * (v.cantidad || 0)
      return acc + ganancia
    }, 0) || 0

    return {
      ventas: totalVentas,
      ordenes: totalOrdenes,
      clientes: totalClientes,
      utilidades: totalUtilidades,
    }
  }, [ventas, ordenes, clientes])

  // Chart data
  const barChartData = useMemo(() => [
    { label: 'Ene', value: 45000, color: 'from-blue-500 to-cyan-400' },
    { label: 'Feb', value: 52000, color: 'from-purple-500 to-pink-400' },
    { label: 'Mar', value: 48000, color: 'from-emerald-500 to-teal-400' },
    { label: 'Abr', value: 61000, color: 'from-amber-500 to-orange-400' },
    { label: 'May', value: 55000, color: 'from-rose-500 to-red-400' },
    { label: 'Jun', value: 67000, color: 'from-indigo-500 to-blue-400' },
  ], [])

  const ringChartData = useMemo(() => [
    { label: 'Bóveda Monte', value: 45, color: '#3b82f6' },
    { label: 'Utilidades', value: 30, color: '#10b981' },
    { label: 'Fletes', value: 15, color: '#f59e0b' },
    { label: 'Otros', value: 10, color: '#8b5cf6' },
  ], [])

  const activities = useMemo(() => [
    { title: 'Nueva venta registrada', description: 'Cliente: Distribuidora Norte', time: 'Hace 5 min', type: 'sale' as const },
    { title: 'Orden de compra #1234', description: 'Proveedor: Azteca Foods', time: 'Hace 15 min', type: 'order' as const },
    { title: 'Transferencia bancaria', description: 'De Bóveda Monte a Utilidades', time: 'Hace 30 min', type: 'transfer' as const },
    { title: 'Stock bajo detectado', description: 'Producto: Carne Premium', time: 'Hace 1 hora', type: 'alert' as const },
  ], [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500"
          />
          <span className="text-white/60">Cargando dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden">
        {/* Ambient Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <GradientOrb 
            colors={['#3b82f6', '#8b5cf6', '#ec4899']} 
            size={600} 
            blur={150}
            className="-top-40 -left-40"
          />
          <GradientOrb 
            colors={['#10b981', '#06b6d4', '#3b82f6']} 
            size={500} 
            blur={120}
            className="-bottom-20 -right-20"
          />
          <MorphingBlob
            color="rgba(139, 92, 246, 0.15)"
            size={400}
            className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          />
          <ParticleBackground count={30} color="rgba(59, 130, 246, 0.3)" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 p-6 lg:p-8 pt-24 max-w-[2000px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-blue-400" />
              <GradientText
                gradient="purple"
                className="text-3xl lg:text-4xl font-bold"
              >
                Dashboard Premium
              </GradientText>
            </div>
            <p className="text-white/50">
              Bienvenido de vuelta. Aquí está el resumen de tu negocio.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <PremiumStat
              title="Ventas Totales"
              value={stats.ventas}
              format="currency"
              trend={12.5}
              icon={<DollarSign className="w-5 h-5 text-white" />}
              color="green"
              delay={0}
            />
            <PremiumStat
              title="Órdenes Activas"
              value={stats.ordenes}
              format="number"
              trend={8.3}
              icon={<Package className="w-5 h-5 text-white" />}
              color="blue"
              delay={0.1}
            />
            <PremiumStat
              title="Clientes"
              value={stats.clientes}
              format="number"
              trend={15.2}
              icon={<Users className="w-5 h-5 text-white" />}
              color="purple"
              delay={0.2}
            />
            <PremiumStat
              title="Utilidades"
              value={stats.utilidades}
              format="currency"
              trend={-2.4}
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              color="amber"
              delay={0.3}
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <GlassSurface intensity="medium" className="p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Ingresos Mensuales</h3>
                    <p className="text-sm text-white/50">Últimos 6 meses</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/40">Total:</span>
                    <span className="text-lg font-bold text-white">
                      ${barChartData.reduce((a, b) => a + b.value, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <AnimatedBarChart data={barChartData} height={250} showValues />
              </GlassSurface>
            </motion.div>

            {/* Distribution Ring */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassSurface intensity="medium" className="p-6 h-full">
                <h3 className="text-lg font-semibold text-white mb-6">Distribución de Capital</h3>
                <div className="flex flex-col items-center">
                  <AnimatedRingChart
                    data={ringChartData}
                    size={180}
                    strokeWidth={24}
                    centerContent={
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">100%</p>
                        <p className="text-xs text-white/40">Total</p>
                      </div>
                    }
                  />
                  <div className="mt-6 grid grid-cols-2 gap-3 w-full">
                    {ringChartData.map((item, i) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-white/60">{item.label}</span>
                        <span className="text-xs text-white font-medium ml-auto">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassSurface>
            </motion.div>
          </div>

          {/* Quick Actions & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <GlassSurface intensity="medium" className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <QuickAction
                    label="Nueva Venta"
                    icon={<DollarSign className="w-5 h-5 text-white" />}
                    color="from-emerald-500 to-teal-600"
                    onClick={() => {}}
                    delay={0.7}
                  />
                  <QuickAction
                    label="Nueva Orden"
                    icon={<Package className="w-5 h-5 text-white" />}
                    color="from-blue-500 to-indigo-600"
                    onClick={() => {}}
                    delay={0.8}
                  />
                  <QuickAction
                    label="Transferencia"
                    icon={<Building2 className="w-5 h-5 text-white" />}
                    color="from-purple-500 to-pink-600"
                    onClick={() => {}}
                    delay={0.9}
                  />
                  <QuickAction
                    label="Ver Reportes"
                    icon={<Activity className="w-5 h-5 text-white" />}
                    color="from-amber-500 to-orange-600"
                    onClick={() => {}}
                    delay={1.0}
                  />
                </div>
              </GlassSurface>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <GlassSurface intensity="medium" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Actividad Reciente</h3>
                  <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    Ver todo
                  </button>
                </div>
                <div className="space-y-1">
                  {activities.map((activity, i) => (
                    <ActivityItem
                      key={i}
                      {...activity}
                      delay={0.8 + i * 0.1}
                    />
                  ))}
                </div>
              </GlassSurface>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
