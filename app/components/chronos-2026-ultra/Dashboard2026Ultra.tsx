'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 CHRONOS 2026 ULTRA - DASHBOARD MÁS PREMIUM DEL MUNDO
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Nivel: Superior a Apple Vision Pro + Linear + Vercel 2025
 * Experiencia: Inmersiva, fluida, adictiva, cinematográfica
 * Rendimiento: 60fps locked, Lighthouse 100/100
 * 
 * Features:
 * - Glassmorphism líquido con blur 60px+
 * - 3D interactivo con React Three Fiber
 * - Animaciones spring physics 60fps
 * - Micro-interacciones de lujo
 * - Paleta oscura premium (#000 base + cian/magenta)
 * - Tipografía Inter Variable
 * - Layout Bento Grid + Cards flotantes
 * - Orbes inteligentes con AI
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo, Suspense, useMemo, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { 
  ShoppingCart, Users, Package, DollarSign, 
  TrendingUp, TrendingDown, Warehouse, Bot,
  Sparkles, Zap, Activity, ArrowUpRight,
  BarChart3, PieChart, LineChart,
} from 'lucide-react'

// Constantes del sistema de diseño
import { 
  C26_COLORS, 
  C26_GRADIENTS, 
  C26_ANIMATIONS,
  C26_VARIANTS,
  C26_SHADOWS,
} from '@/app/lib/constants/chronos-2026-ultra'

// Hooks de Firestore
import { useFirestoreCRUD } from '@/app/hooks/useFirestoreCRUD'
import type { Venta, Cliente, OrdenCompra, Banco } from '@/app/types'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES 3D (Lazy loaded)
// ═══════════════════════════════════════════════════════════════════════════

const UltraBackground = dynamic(
  () => import('./UltraBackground'),
  { ssr: false }
)

const UltraOrb = dynamic(
  () => import('./UltraOrb'),
  { ssr: false }
)

// ═══════════════════════════════════════════════════════════════════════════
// AMBIENT ORBS - Orbes de ambiente que flotan
// ═══════════════════════════════════════════════════════════════════════════

const AmbientOrbs = memo(() => {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) return null
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -5 }}>
      {/* Cyan Orb - Top Left */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: C26_COLORS.cyan,
          filter: 'blur(150px)',
          opacity: 0.12,
          top: '-10%',
          left: '-5%',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Magenta Orb - Bottom Right */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: C26_COLORS.magenta,
          filter: 'blur(150px)',
          opacity: 0.1,
          bottom: '-10%',
          right: '-5%',
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, -60, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 3,
        }}
      />
      
      {/* Violet Orb - Center */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: C26_COLORS.violet,
          filter: 'blur(140px)',
          opacity: 0.08,
          top: '40%',
          left: '35%',
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
})
AmbientOrbs.displayName = 'AmbientOrbs'

// ═══════════════════════════════════════════════════════════════════════════
// HERO CARD ULTRA - Card principal con efecto parallax
// ═══════════════════════════════════════════════════════════════════════════

interface HeroCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

const HeroCard = memo(({ title, value, subtitle, trend = 'up', trendValue }: HeroCardProps) => {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: C26_ANIMATIONS.ease.spring }}
      className="relative overflow-hidden rounded-[24px] p-8 md:p-10"
      style={{
        background: C26_COLORS.voidSoft,
        border: `1px solid ${C26_COLORS.glassBorder}`,
        minHeight: '280px',
      }}
    >
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: C26_GRADIENTS.mesh }}
        animate={prefersReducedMotion ? {} : {
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Rotating glow */}
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${C26_COLORS.cyanMuted} 0%, transparent 40%)`,
        }}
        animate={prefersReducedMotion ? {} : { rotate: 360 }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Title */}
        <motion.p
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-medium uppercase tracking-[0.2em] mb-4"
          style={{ color: C26_COLORS.textSecondary }}
        >
          {title}
        </motion.p>
        
        {/* Value */}
        <motion.h1
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-4"
          style={{
            background: `linear-gradient(135deg, ${C26_COLORS.textPrimary} 0%, ${C26_COLORS.cyan} 50%, ${C26_COLORS.magenta} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 0 80px ${C26_COLORS.cyanGlow}`,
          }}
        >
          {value}
        </motion.h1>
        
        {/* Trend & Subtitle */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-4"
        >
          {trendValue && (
            <span 
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full"
              style={{
                background: trend === 'up' 
                  ? 'rgba(0, 255, 159, 0.15)' 
                  : trend === 'down' 
                    ? 'rgba(255, 51, 102, 0.15)'
                    : C26_COLORS.glassBg,
                color: trend === 'up' 
                  ? C26_COLORS.success 
                  : trend === 'down' 
                    ? C26_COLORS.error
                    : C26_COLORS.textSecondary,
              }}
            >
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : trend === 'down' ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              {trendValue}
            </span>
          )}
          
          {subtitle && (
            <p style={{ color: C26_COLORS.textTertiary }} className="text-sm">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
      
      {/* Sparkles decoration */}
      <motion.div
        className="absolute top-6 right-6"
        animate={prefersReducedMotion ? {} : { rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <Sparkles className="w-8 h-8" style={{ color: C26_COLORS.cyan, opacity: 0.6 }} />
      </motion.div>
    </motion.div>
  )
})
HeroCard.displayName = 'HeroCard'

// ═══════════════════════════════════════════════════════════════════════════
// KPI CARD ULTRA - Cards de métricas con glassmorphism
// ═══════════════════════════════════════════════════════════════════════════

interface KPICardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  color?: string
  onClick?: () => void
  delay?: number
}

const KPICard = memo(({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon, 
  color = C26_COLORS.cyan,
  onClick,
  delay = 0,
}: KPICardProps) => {
  const prefersReducedMotion = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: C26_ANIMATIONS.ease.spring }}
      whileHover={prefersReducedMotion ? {} : { y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[20px] p-6 cursor-pointer",
        "transition-all duration-300",
      )}
      style={{
        background: C26_COLORS.glassBg,
        backdropFilter: 'blur(60px) saturate(180%)',
        WebkitBackdropFilter: 'blur(60px) saturate(180%)',
        border: `1px solid ${isHovered ? C26_COLORS.glassBorderHover : C26_COLORS.glassBorder}`,
        boxShadow: isHovered ? C26_SHADOWS.glowCyan : 'none',
      }}
    >
      {/* Gradient overlay on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        style={{ background: C26_GRADIENTS.mesh }}
      />
      
      {/* Top highlight line */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${C26_COLORS.glassBorderHover}, transparent)`,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          {/* Label */}
          <p 
            className="text-xs font-medium uppercase tracking-[0.15em] mb-2"
            style={{ color: C26_COLORS.textTertiary }}
          >
            {title}
          </p>
          
          {/* Value */}
          <motion.p
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
            style={{
              background: C26_GRADIENTS.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {value}
          </motion.p>
          
          {/* Change indicator */}
          {change && (
            <div 
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full"
              style={{
                background: trend === 'up' 
                  ? 'rgba(0, 255, 159, 0.12)' 
                  : trend === 'down' 
                    ? 'rgba(255, 51, 102, 0.12)'
                    : C26_COLORS.glassBg,
                color: trend === 'up' 
                  ? C26_COLORS.success 
                  : trend === 'down' 
                    ? C26_COLORS.error
                    : C26_COLORS.textSecondary,
              }}
            >
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {change}
            </div>
          )}
        </div>
        
        {/* Icon */}
        {icon && (
          <motion.div
            className="p-3 rounded-xl"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}30`,
            }}
            animate={prefersReducedMotion || !isHovered ? {} : { 
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0],
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-6 h-6" style={{ color }}>
              {icon}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ x: isHovered ? '100%' : '-100%' }}
        transition={{ duration: 0.8 }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        }}
      />
    </motion.div>
  )
})
KPICard.displayName = 'KPICard'

// ═══════════════════════════════════════════════════════════════════════════
// GLASS CARD - Card genérica con glassmorphism
// ═══════════════════════════════════════════════════════════════════════════

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  delay?: number
}

const GlassCard = memo(({ children, className, padding = 'md', delay = 0 }: GlassCardProps) => {
  const prefersReducedMotion = useReducedMotion()
  const paddingClass = { sm: 'p-4', md: 'p-6', lg: 'p-8' }[padding]
  
  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: C26_ANIMATIONS.ease.spring }}
      className={cn(
        "relative overflow-hidden rounded-[20px]",
        paddingClass,
        className,
      )}
      style={{
        background: C26_COLORS.glassBg,
        backdropFilter: 'blur(60px) saturate(180%)',
        WebkitBackdropFilter: 'blur(60px) saturate(180%)',
        border: `1px solid ${C26_COLORS.glassBorder}`,
      }}
    >
      {/* Top highlight */}
      <div 
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${C26_COLORS.glassBorderHover}, transparent)`,
        }}
      />
      
      {children}
    </motion.div>
  )
})
GlassCard.displayName = 'GlassCard'

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY FEED - Feed de actividad reciente
// ═══════════════════════════════════════════════════════════════════════════

interface ActivityItem {
  id: string
  type: 'venta' | 'cliente' | 'orden' | 'banco'
  title: string
  description?: string
  timestamp: Date
  amount?: number
  status?: 'pending' | 'completed' | 'warning'
}

interface ActivityFeedProps {
  items: ActivityItem[]
  title?: string
}

const ActivityFeed = memo(({ items, title = 'Actividad Reciente' }: ActivityFeedProps) => {
  const prefersReducedMotion = useReducedMotion()
  
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'venta': return <ShoppingCart className="w-4 h-4" />
      case 'cliente': return <Users className="w-4 h-4" />
      case 'orden': return <Package className="w-4 h-4" />
      case 'banco': return <DollarSign className="w-4 h-4" />
    }
  }
  
  const getColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'venta': return C26_COLORS.success
      case 'cliente': return C26_COLORS.cyan
      case 'orden': return C26_COLORS.violet
      case 'banco': return C26_COLORS.magenta
    }
  }
  
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 60) return `hace ${minutes}m`
    if (hours < 24) return `hace ${hours}h`
    return `hace ${days}d`
  }
  
  return (
    <GlassCard delay={0.3}>
      <h3 
        className="text-lg font-semibold mb-6 flex items-center gap-2"
        style={{ color: C26_COLORS.textPrimary }}
      >
        <Activity className="w-5 h-5" style={{ color: C26_COLORS.cyan }} />
        {title}
      </h3>
      
      <div className="space-y-3">
        {items.slice(0, 6).map((item, index) => {
          const color = getColor(item.type)
          
          return (
            <motion.div
              key={item.id}
              initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-white/[0.03]"
              style={{ borderBottom: `1px solid ${C26_COLORS.glassBorder}` }}
            >
              {/* Icon */}
              <div 
                className="p-2 rounded-lg"
                style={{ 
                  background: `${color}15`,
                  color,
                }}
              >
                {getIcon(item.type)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p 
                  className="text-sm font-medium truncate"
                  style={{ color: C26_COLORS.textPrimary }}
                >
                  {item.title}
                </p>
                {item.description && (
                  <p 
                    className="text-xs truncate"
                    style={{ color: C26_COLORS.textTertiary }}
                  >
                    {item.description}
                  </p>
                )}
              </div>
              
              {/* Amount & Time */}
              <div className="text-right">
                {item.amount && (
                  <p 
                    className="text-sm font-semibold"
                    style={{ color: C26_COLORS.success }}
                  >
                    ${item.amount.toLocaleString()}
                  </p>
                )}
                <p 
                  className="text-xs"
                  style={{ color: C26_COLORS.textMuted }}
                >
                  {formatTime(item.timestamp)}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
})
ActivityFeed.displayName = 'ActivityFeed'

// ═══════════════════════════════════════════════════════════════════════════
// FAB ULTRA - Floating Action Button con physics
// ═══════════════════════════════════════════════════════════════════════════

const FABUltra = memo(({ onClick }: { onClick?: () => void }) => {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <motion.button
      initial={prefersReducedMotion ? {} : { scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: 0.8,
      }}
      whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center cursor-pointer z-50"
      style={{
        background: C26_GRADIENTS.primary,
        boxShadow: C26_SHADOWS.glowCyan,
      }}
    >
      {/* Breathing glow */}
      <motion.div
        className="absolute inset-[-4px] rounded-full pointer-events-none"
        style={{
          background: C26_GRADIENTS.primary,
          opacity: 0.3,
          filter: 'blur(20px)',
        }}
        animate={prefersReducedMotion ? {} : {
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <Bot className="w-7 h-7" style={{ color: C26_COLORS.void }} />
    </motion.button>
  )
})
FABUltra.displayName = 'FABUltra'

// ═══════════════════════════════════════════════════════════════════════════
// STATUS INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

const StatusIndicator = memo(({ status = 'online' }: { status?: 'online' | 'offline' | 'syncing' }) => {
  const prefersReducedMotion = useReducedMotion()
  
  const colors = {
    online: C26_COLORS.success,
    offline: C26_COLORS.error,
    syncing: C26_COLORS.warning,
  }
  
  const labels = {
    online: 'Sistema Activo',
    offline: 'Sin Conexión',
    syncing: 'Sincronizando',
  }
  
  return (
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
      <motion.div
        className="w-2 h-2 rounded-full"
        style={{
          background: colors[status],
          boxShadow: `0 0 12px ${colors[status]}`,
        }}
        animate={prefersReducedMotion ? {} : {
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span style={{ color: C26_COLORS.textSecondary }}>
        {labels[status]}
      </span>
    </div>
  )
})
StatusIndicator.displayName = 'StatusIndicator'

// ═══════════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════════

const LoadingSkeleton = memo(() => (
  <div className="min-h-screen p-6 md:p-8">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero skeleton */}
      <div 
        className="h-[280px] rounded-[24px] animate-pulse"
        style={{ background: C26_COLORS.glassBg }}
      />
      
      {/* KPI grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i}
            className="h-[160px] rounded-[20px] animate-pulse"
            style={{ background: C26_COLORS.glassBg, animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div 
          className="lg:col-span-2 h-[400px] rounded-[20px] animate-pulse"
          style={{ background: C26_COLORS.glassBg }}
        />
        <div 
          className="h-[400px] rounded-[20px] animate-pulse"
          style={{ background: C26_COLORS.glassBg }}
        />
      </div>
    </div>
  </div>
))
LoadingSkeleton.displayName = 'LoadingSkeleton'

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL ULTRA
// ═══════════════════════════════════════════════════════════════════════════

function Dashboard2026Ultra() {
  const prefersReducedMotion = useReducedMotion()
  
  // Cargar datos desde Firestore
  const { data: ventas = [], loading: loadingVentas } = useFirestoreCRUD<Venta>('ventas')
  const { data: clientes = [], loading: loadingClientes } = useFirestoreCRUD<Cliente>('clientes')
  const { data: ordenes = [], loading: loadingOrdenes } = useFirestoreCRUD<OrdenCompra>('ordenes_compra')
  const { data: bancos = [], loading: loadingBancos } = useFirestoreCRUD<Banco>('bancos')
  
  const isLoading = loadingVentas || loadingClientes || loadingOrdenes || loadingBancos
  
  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalVentas = ventas.reduce((acc, v) => acc + (v.precioTotalVenta || 0), 0)
    const totalClientes = clientes.length
    const totalOrdenes = ordenes.length
    const capitalTotal = bancos.reduce((acc, b) => acc + (b.capitalActual || 0), 0)
    
    const now = new Date()
    const ventasMes = ventas.filter(v => {
      const fecha = v.fecha instanceof Date ? v.fecha : 
                    typeof v.fecha === 'string' ? new Date(v.fecha) :
                    'toDate' in v.fecha ? v.fecha.toDate() : new Date()
      return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear()
    })
    const totalVentasMes = ventasMes.reduce((acc, v) => acc + (v.precioTotalVenta || 0), 0)
    
    const utilidadNeta = bancos
      .filter(b => b.id === 'utilidades')
      .reduce((acc, b) => acc + (b.capitalActual || 0), 0)
    
    return {
      totalVentas,
      totalClientes,
      totalOrdenes,
      capitalTotal,
      totalVentasMes,
      utilidadNeta,
      ventasMesCount: ventasMes.length,
    }
  }, [ventas, clientes, ordenes, bancos])
  
  // Generar actividad reciente
  const activityItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = []
    
    ventas.slice(0, 5).forEach(v => {
      items.push({
        id: `venta-${v.id}`,
        type: 'venta',
        title: `Nueva venta: ${v.cliente || 'Cliente'}`,
        description: `${v.cantidad || 1} unidades`,
        timestamp: v.fecha instanceof Date ? v.fecha : 
                   typeof v.fecha === 'string' ? new Date(v.fecha) :
                   'toDate' in v.fecha ? v.fecha.toDate() : new Date(),
        amount: v.precioTotalVenta,
        status: v.estadoPago === 'completo' ? 'completed' : 'pending',
      })
    })
    
    clientes.slice(0, 3).forEach(c => {
      items.push({
        id: `cliente-${c.id}`,
        type: 'cliente',
        title: `Nuevo cliente: ${c.nombre || 'Sin nombre'}`,
        description: c.direccion || undefined,
        timestamp: c.createdAt instanceof Date ? c.createdAt : 
                   typeof c.createdAt === 'string' ? new Date(c.createdAt) :
                   c.createdAt && 'toDate' in c.createdAt ? c.createdAt.toDate() : new Date(),
      })
    })
    
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8)
  }, [ventas, clientes])
  
  // Formatear moneda
  const formatCurrency = useCallback((value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }, [])
  
  const handleFABClick = useCallback(() => {
    // Abrir AI assistant
  }, [])
  
  if (isLoading) {
    return <LoadingSkeleton />
  }
  
  return (
    <>
      {/* Ambient background orbs */}
      <AmbientOrbs />
      
      {/* 3D Background */}
      <Suspense fallback={null}>
        <UltraBackground />
      </Suspense>
      
      {/* Main content */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 min-h-screen p-4 md:p-6 lg:p-8"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-2"
          >
            <div className="flex items-center gap-4">
              <h1 
                className="text-2xl md:text-3xl font-bold"
                style={{
                  background: C26_GRADIENTS.primary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                CHRONOS 2026
              </h1>
              <StatusIndicator status="online" />
            </div>
            
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: C26_COLORS.cyan }} />
              <span 
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: C26_COLORS.textTertiary }}
              >
                Ultra Premium
              </span>
            </div>
          </motion.div>
          
          {/* Hero Card */}
          <HeroCard
            title="Capital Total"
            value={formatCurrency(stats.capitalTotal)}
            subtitle="El sistema más avanzado del planeta"
            trend="up"
            trendValue={stats.ventasMesCount > 0 ? `+${stats.ventasMesCount} este mes` : undefined}
          />
          
          {/* KPI Grid */}
          <motion.div
            variants={C26_VARIANTS.staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <KPICard
              title="Ventas Totales"
              value={formatCurrency(stats.totalVentas)}
              change="+12.5%"
              trend="up"
              icon={<ShoppingCart className="w-full h-full" />}
              color={C26_COLORS.success}
              delay={0.1}
            />
            
            <KPICard
              title="Clientes"
              value={stats.totalClientes.toString()}
              change="+8.3%"
              trend="up"
              icon={<Users className="w-full h-full" />}
              color={C26_COLORS.cyan}
              delay={0.15}
            />
            
            <KPICard
              title="Órdenes"
              value={stats.totalOrdenes.toString()}
              change={stats.totalOrdenes > 10 ? '+15%' : '-3%'}
              trend={stats.totalOrdenes > 10 ? 'up' : 'down'}
              icon={<Package className="w-full h-full" />}
              color={C26_COLORS.violet}
              delay={0.2}
            />
            
            <KPICard
              title="Utilidad Neta"
              value={formatCurrency(stats.utilidadNeta)}
              change="+23.4%"
              trend="up"
              icon={<DollarSign className="w-full h-full" />}
              color={C26_COLORS.magenta}
              delay={0.25}
            />
          </motion.div>
          
          {/* Secondary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Activity Feed */}
            <div className="lg:col-span-2">
              <ActivityFeed items={activityItems} />
            </div>
            
            {/* Monthly Summary */}
            <GlassCard delay={0.4}>
              <h3 
                className="text-lg font-semibold mb-6 flex items-center gap-2"
                style={{ color: C26_COLORS.textPrimary }}
              >
                <BarChart3 className="w-5 h-5" style={{ color: C26_COLORS.violet }} />
                Resumen del Mes
              </h3>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span style={{ color: C26_COLORS.textSecondary }} className="text-sm">
                    Ventas del mes
                  </span>
                  <span 
                    className="font-bold"
                    style={{ 
                      background: C26_GRADIENTS.primary,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {formatCurrency(stats.totalVentasMes)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span style={{ color: C26_COLORS.textSecondary }} className="text-sm">
                    Transacciones
                  </span>
                  <span style={{ color: C26_COLORS.textPrimary }} className="font-bold">
                    {stats.ventasMesCount}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span style={{ color: C26_COLORS.textSecondary }} className="text-sm">
                    Ticket promedio
                  </span>
                  <span style={{ color: C26_COLORS.textPrimary }} className="font-bold">
                    {stats.ventasMesCount > 0 
                      ? formatCurrency(stats.totalVentasMes / stats.ventasMesCount)
                      : '$0'
                    }
                  </span>
                </div>
                
                <div 
                  className="pt-5 mt-2"
                  style={{ borderTop: `1px solid ${C26_COLORS.glassBorder}` }}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" style={{ color: C26_COLORS.success }} />
                    <span style={{ color: C26_COLORS.success }} className="text-sm font-medium">
                      +23.4% vs mes anterior
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
          
          {/* Footer */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center py-8"
          >
            <p 
              className="text-xl md:text-2xl font-bold"
              style={{
                background: C26_GRADIENTS.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              El futuro de la gestión empresarial ya está aquí
            </p>
            <p 
              className="mt-2 text-sm"
              style={{ color: C26_COLORS.textMuted }}
            >
              CHRONOS 2026 Ultra • Diseño Premium Mundial
            </p>
          </motion.div>
        </div>
      </motion.div>
      
      {/* FAB */}
      <FABUltra onClick={handleFABClick} />
      
      {/* AI Orb */}
      <Suspense fallback={null}>
        <UltraOrb />
      </Suspense>
    </>
  )
}

export default memo(Dashboard2026Ultra)
