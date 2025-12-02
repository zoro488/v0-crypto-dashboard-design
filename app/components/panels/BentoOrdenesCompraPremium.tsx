'use client'

/**
 * 📦 BENTO ÓRDENES DE COMPRA PREMIUM 2025 - Apple Vision Pro + Tesla + Grok Design
 * 
 * ============================================================================
 * SISTEMA CHRONOS - PANEL ÓRDENES DE COMPRA ULTRA PREMIUM
 * ============================================================================
 * 
 * Diseño inspirado en:
 * - Apple Vision Pro: Glassmorphism avanzado, blur 24px, bordes sutiles
 * - Tesla: Fondo puro #000000, tipografía Inter bold, animaciones spring
 * - Grok.com 2025: KPIs gigantes con count-up, gradientes dinámicos
 * 
 * Características Premium 2025:
 * - 🔮 Orbes 3D WebGL para estadísticas principales
 * - 🪟 GlassCards con glassmorphism profundo (blur 24px)
 * - ✨ Animaciones spring ultra-fluidas (stiffness 300, damping 30)
 * - 📊 Gráficos Recharts con tema oscuro premium
 * - 🌌 Partículas de fondo con efecto aurora
 * - 🎯 Count-up animado en todos los valores numéricos
 * - 💳 Cards de órdenes con progreso visual dinámico
 * - 🔍 Búsqueda y filtrado en tiempo real
 */

import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { 
  ShoppingCart, Plus, TrendingUp, AlertCircle, CheckCircle2, Clock, Package,
  Building2, DollarSign, Calendar, Search, Filter, Download, Eye, Edit,
  ArrowUpRight, ArrowDownRight, Truck, BarChart3, PieChart as PieChartIcon,
  CreditCard, Receipt, RefreshCw, ChevronRight, Sparkles, Activity,
  FileText, Boxes, Store, Wallet, Target,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { Skeleton } from '@/app/components/ui/skeleton'
import {
  AnimatedCounter,
  GlowButton,
  Tilt3D,
  SkeletonTable,
  haptic,
} from '@/app/components/ui/microinteractions'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { suscribirOrdenesCompra } from '@/app/lib/services/unified-data-service'
import type { OrdenCompra, FirestoreTimestamp } from '@/app/types'
import { CreateOrdenCompraModalPremium } from '@/app/components/modals/CreateOrdenCompraModalPremium'
import { 
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, CartesianGrid, Legend, ComposedChart, Line,
  RadialBarChart, RadialBar,
} from 'recharts'

// Componentes 3D Premium
import { 
  StatOrb3D, 
  GlassCard3D, 
  ParticleBackground, 
  PulseIndicator,
  MiniChart3D,
  GradientText,
  VARIANT_COLORS, 
} from '@/app/components/3d/PremiumPanelComponents'

// ============================================================================
// ANIMACIONES SPRING ULTRA-PREMIUM (Apple/Tesla style)
// ============================================================================
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

// ============================================================================
// HELPERS
// ============================================================================
function formatearFecha(fecha: string | FirestoreTimestamp | undefined): string {
  if (!fecha) return '-'
  try {
    if (typeof fecha === 'object' && 'seconds' in fecha) {
      return new Date(fecha.seconds * 1000).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    }
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return '-'
  }
}

function formatearMoneda(valor: number | undefined): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(valor ?? 0)
}

function formatNumber(value: number | undefined): string {
  return (value ?? 0).toLocaleString('es-MX')
}

// ============================================================================
// CONSTANTES
// ============================================================================
const ESTADO_CONFIG: Record<string, { 
  color: string
  bgColor: string
  icon: LucideIcon
  label: string
  variant: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'
}> = {
  pagado: { 
    color: 'text-emerald-300', 
    bgColor: 'bg-emerald-500/20 border-emerald-500/30', 
    icon: CheckCircle2, 
    label: 'Pagado',
    variant: 'success',
  },
  parcial: { 
    color: 'text-amber-300', 
    bgColor: 'bg-amber-500/20 border-amber-500/30', 
    icon: Clock, 
    label: 'Parcial',
    variant: 'warning',
  },
  pendiente: { 
    color: 'text-rose-300', 
    bgColor: 'bg-rose-500/20 border-rose-500/30', 
    icon: AlertCircle, 
    label: 'Pendiente',
    variant: 'danger',
  },
  entregado: { 
    color: 'text-cyan-300', 
    bgColor: 'bg-cyan-500/20 border-cyan-500/30', 
    icon: Truck, 
    label: 'Entregado',
    variant: 'info',
  },
}

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#3b82f6']

// ============================================================================
// COMPONENTE HERO KPI - ESTILO GROK 2025 (GIGANTE CON COUNT-UP)
// ============================================================================
function HeroKPI({ 
  title, 
  value, 
  prefix = '',
  suffix = '',
  icon: Icon, 
  gradient,
  description,
  trend,
  trendValue,
}: { 
  title: string
  value: number
  prefix?: string
  suffix?: string
  icon: LucideIcon
  gradient: string
  description?: string
  trend?: 'up' | 'down'
  trendValue?: string
}) {
  const animatedValue = useCountUp(value, 1500)
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={TRANSITION_PREMIUM}
      className="relative group"
    >
      {/* Glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
      
      {/* Card */}
      <div className="relative bg-black/60 backdrop-blur-[24px] rounded-2xl border border-white/[0.08] p-6 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
        </div>
        
        {/* Icon container */}
        <motion.div 
          className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${gradient} mb-4`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={TRANSITION_PREMIUM}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
        
        {/* Title */}
        <p className="text-white/60 text-sm font-medium tracking-wide uppercase mb-2">{title}</p>
        
        {/* Value - GIGANTE estilo Grok */}
        <div className="flex items-baseline gap-1">
          {prefix && <span className="text-2xl text-white/70">{prefix}</span>}
          <motion.span 
            className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80"
            key={animatedValue}
          >
            {animatedValue.toLocaleString('es-MX')}
          </motion.span>
          {suffix && <span className="text-2xl text-white/70 ml-1">{suffix}</span>}
        </div>
        
        {description && (
          <p className="text-white/40 text-sm mt-2">{description}</p>
        )}
        
        {/* Trend indicator */}
        {trend && trendValue && (
          <div className={`flex items-center gap-1 mt-3 text-sm ${
            trend === 'up' ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="font-medium">{trendValue}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

// Tarjeta de estadística premium
function StatCardPremium({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'primary',
  trend,
  trendValue,
  miniChartData,
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  miniChartData?: number[]
}) {
  const colors = VARIANT_COLORS[variant]
  
  return (
    <GlassCard3D variant={variant} size="md" glowIntensity={0.3}>
      <div className="relative">
        <div className="absolute -right-2 -top-2 opacity-10">
          <Icon size={60} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/70 text-sm font-medium mb-2">
            <div 
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: `${colors.primary}20` }}
            >
              <Icon size={14} style={{ color: colors.primary }} />
            </div>
            {title}
          </div>
          
          <GradientText variant={variant} className="text-3xl font-bold">
            {value}
          </GradientText>
          
          {subtitle && (
            <p className="text-white/50 text-sm mt-1">{subtitle}</p>
          )}
          
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-white/50'
            }`}>
              {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trendValue}
            </div>
          )}
          
          {miniChartData && (
            <div className="mt-3">
              <MiniChart3D data={miniChartData} variant={variant} height={40} />
            </div>
          )}
        </div>
      </div>
    </GlassCard3D>
  )
}

// Tarjeta de Orden de Compra Premium
function OrdenCompraCardPremium({ 
  orden, 
  onView, 
}: { 
  orden: OrdenCompra
  onView: (oc: OrdenCompra) => void 
}) {
  const estadoConfig = ESTADO_CONFIG[orden.estado || 'pendiente']
  const Icon = estadoConfig.icon
  const colors = VARIANT_COLORS[estadoConfig.variant]
  
  // Calcular progreso de pago usando campos reales de OrdenCompra
  const totalPagado = orden.pagoDistribuidor || orden.pagoInicial || 0
  const totalOrden = orden.costoTotal || 0
  const progreso = totalOrden > 0 ? Math.min((totalPagado / totalOrden) * 100, 100) : 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="group cursor-pointer"
      onClick={() => onView(orden)}
    >
      <GlassCard3D variant={estadoConfig.variant} size="md" glowIntensity={0.2}>
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant="outline" 
                  className={`${estadoConfig.bgColor} ${estadoConfig.color} font-mono`}
                >
                  {orden.id}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`${estadoConfig.bgColor} ${estadoConfig.color}`}
                >
                  <Icon size={12} className="mr-1" />
                  {estadoConfig.label}
                </Badge>
              </div>
              <p className="text-white/60 text-sm flex items-center gap-1">
                <Building2 size={14} />
                {orden.distribuidor || 'Sin distribuidor'}
              </p>
            </div>
            
            <motion.div 
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${colors.primary}20` }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <ShoppingCart size={20} style={{ color: colors.primary }} />
            </motion.div>
          </div>
          
          {/* Valores */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-white/40 text-xs uppercase">Total Orden</p>
              <p className="text-xl font-bold text-white">{formatearMoneda(totalOrden)}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase">Pagado</p>
              <p className="text-xl font-bold" style={{ color: colors.primary }}>
                {formatearMoneda(totalPagado)}
              </p>
            </div>
          </div>
          
          {/* Barra de progreso */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>Progreso de pago</span>
              <span>{progreso.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: colors.primary }}
                initial={{ width: 0 }}
                animate={{ width: `${progreso}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <Calendar size={12} />
              {formatearFecha(orden.fecha)}
            </div>
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <Package size={12} />
              {formatNumber(orden.cantidad)} unidades
            </div>
            <ChevronRight 
              size={16} 
              className="text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" 
            />
          </div>
        </div>
      </GlassCard3D>
    </motion.div>
  )
}

// Tooltip personalizado para gráficos
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null
  
  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/60 text-xs">{entry.name}:</span>
          <span className="text-white text-sm font-medium">
            {formatearMoneda(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL - BENTO ÓRDENES COMPRA PREMIUM 2025
// ============================================================================
export function BentoOrdenesCompraPremium() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompra | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Suscripción en tiempo real
  useEffect(() => {
    const unsubscribe = suscribirOrdenesCompra((data) => {
      setOrdenes(data as OrdenCompra[])
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Métricas calculadas
  const metricas = useMemo(() => {
    const totalOrdenes = ordenes.length
    const totalMonto = ordenes.reduce((sum, oc) => sum + (oc.costoTotal || 0), 0)
    const totalPagado = ordenes.reduce((sum, oc) => sum + (oc.pagoDistribuidor || oc.pagoInicial || 0), 0)
    const pendientePago = totalMonto - totalPagado
    
    const porEstado = {
      pagado: ordenes.filter(oc => oc.estado === 'pagado').length,
      parcial: ordenes.filter(oc => oc.estado === 'parcial').length,
      pendiente: ordenes.filter(oc => oc.estado === 'pendiente').length,
      entregado: ordenes.filter(oc => oc.estado === 'cancelado').length,
    }
    
    const distribuidores = new Set(ordenes.map(oc => oc.distribuidor)).size
    const totalUnidades = ordenes.reduce((sum, oc) => sum + (oc.cantidad || 0), 0)
    
    return { totalOrdenes, totalMonto, totalPagado, pendientePago, porEstado, distribuidores, totalUnidades }
  }, [ordenes])

  // Datos filtrados
  const ordenesFiltradas = useMemo(() => {
    let filtered = ordenes
    
    if (filtroEstado !== 'todos') {
      filtered = filtered.filter(oc => oc.estado === filtroEstado)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(oc => 
        oc.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        oc.distribuidor?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    
    return filtered
  }, [ordenes, filtroEstado, searchTerm])

  // Datos para gráficos
  const chartDataEstados = useMemo(() => [
    { name: 'Pagado', value: metricas.porEstado.pagado, fill: '#10b981' },
    { name: 'Parcial', value: metricas.porEstado.parcial, fill: '#f59e0b' },
    { name: 'Pendiente', value: metricas.porEstado.pendiente, fill: '#ef4444' },
    { name: 'Entregado', value: metricas.porEstado.entregado, fill: '#06b6d4' },
  ], [metricas.porEstado])

  const chartDataTendencia = useMemo(() => {
    const ultimasSemanas: Record<string, { total: number; pagado: number }> = {}
    ordenes.forEach(oc => {
      const fecha = oc.fecha
      if (fecha) {
        const semana = `Sem ${Math.ceil(new Date(typeof fecha === 'object' && 'seconds' in fecha ? fecha.seconds * 1000 : fecha).getDate() / 7)}`
        if (!ultimasSemanas[semana]) ultimasSemanas[semana] = { total: 0, pagado: 0 }
        ultimasSemanas[semana].total += oc.costoTotal || 0
        ultimasSemanas[semana].pagado += oc.pagoDistribuidor || oc.pagoInicial || 0
      }
    })
    return Object.entries(ultimasSemanas).map(([name, data]) => ({ name, ...data }))
  }, [ordenes])

  const handleViewOrden = useCallback((oc: OrdenCompra) => {
    setSelectedOrden(oc)
    haptic.light()
  }, [])
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    haptic.medium()
    setTimeout(() => setIsRefreshing(false), 1000)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen"
    >
      {/* ============================================
          FONDO ULTRA-PREMIUM - Aurora Effect
          ============================================ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Base negro puro (Tesla style) */}
        <div className="absolute inset-0 bg-black" />
        
        {/* Aurora gradients */}
        <motion.div 
          className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full blur-[180px] bg-gradient-to-r from-blue-500/15 to-purple-500/15"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[150px] bg-gradient-to-r from-cyan-500/10 to-emerald-500/10"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -80, 0],
            y: [0, -60, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />
        
        {/* Grid pattern (Apple Vision Pro style) */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      </div>
      
      {/* Partículas */}
      <ParticleBackground variant="primary" intensity="low" />
      
      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      <div className="relative z-10 p-6 md:p-8">
        
        {/* ============================================
            HEADER ULTRA-PREMIUM
            ============================================ */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={TRANSITION_PREMIUM}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Título con ícono animado */}
            <div className="flex items-center gap-5">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={TRANSITION_PREMIUM}
              >
                {/* Glow ring */}
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-40" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 backdrop-blur-xl">
                  <ShoppingCart className="w-8 h-8 text-blue-400" />
                </div>
              </motion.div>
              
              <div>
                <motion.h1 
                  className="text-3xl md:text-4xl font-bold tracking-tight"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, ...TRANSITION_PREMIUM }}
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                    Órdenes de Compra
                  </span>
                </motion.h1>
                <motion.p 
                  className="text-white/50 mt-1 text-sm md:text-base"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Gestión y seguimiento de compras a distribuidores
                </motion.p>
              </div>
            </div>
            
            {/* Acciones */}
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => { setIsModalOpen(true); haptic.light() }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-blue-500/20"
                >
                  <Plus size={16} className="mr-2" />
                  Nueva Orden
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="border-white/20 text-white/70 hover:bg-white/5 hover:border-white/30"
                >
                  <Download size={16} className="mr-2" />
                  Exportar
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white/60 hover:text-white hover:bg-white/5"
                  onClick={handleRefresh}
                >
                  <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                </Button>
              </motion.div>
            </div>
          </div>
          
          {/* ============================================
              HERO KPIs - ESTILO GROK 2025
              ============================================ */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...TRANSITION_PREMIUM }}
          >
            <HeroKPI
              title="Total Órdenes"
              value={metricas.totalOrdenes}
              icon={FileText}
              gradient="from-blue-500 to-indigo-500"
              description="Órdenes registradas"
            />
            <HeroKPI
              title="Monto Total"
              value={Math.round(metricas.totalMonto / 1000)}
              prefix="$"
              suffix="k"
              icon={DollarSign}
              gradient="from-cyan-500 to-blue-500"
              description="Valor de compras"
              trend="up"
              trendValue="+15.3%"
            />
            <HeroKPI
              title="Total Pagado"
              value={Math.round(metricas.totalPagado / 1000)}
              prefix="$"
              suffix="k"
              icon={CreditCard}
              gradient="from-emerald-500 to-green-500"
              description="Inversión ejecutada"
            />
            <HeroKPI
              title="Pendiente"
              value={Math.round(metricas.pendientePago / 1000)}
              prefix="$"
              suffix="k"
              icon={Receipt}
              gradient={metricas.pendientePago > 0 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-green-500'}
              description="Por pagar"
            />
            <HeroKPI
              title="Unidades"
              value={metricas.totalUnidades}
              suffix="uds"
              icon={Boxes}
              gradient="from-purple-500 to-violet-500"
              description="Total ordenado"
            />
          </motion.div>
        </motion.header>
      
      {/* ============================================
          GRÁFICOS PREMIUM
          ============================================ */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, ...TRANSITION_PREMIUM }}
      >
        {/* Distribución por estado */}
        <motion.div 
          className="relative group"
          whileHover={{ scale: 1.01 }}
          transition={TRANSITION_PREMIUM}
        >
          <div className="absolute -inset-px bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="relative bg-black/50 backdrop-blur-[24px] rounded-2xl border border-white/[0.08] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <PieChartIcon size={20} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Distribución por Estado</h3>
              </div>
              <PulseIndicator variant="primary" label="En vivo" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartDataEstados}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartDataEstados.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-white/70 text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
        
        {/* Tendencia de montos */}
        <motion.div 
          className="relative group"
          whileHover={{ scale: 1.01 }}
          transition={TRANSITION_PREMIUM}
        >
          <div className="absolute -inset-px bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="relative bg-black/50 backdrop-blur-[24px] rounded-2xl border border-white/[0.08] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20">
                <BarChart3 size={20} className="text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Tendencia de Montos</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartDataTendencia}>
                  <defs>
                    <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" fill="url(#gradientTotal)" stroke="#3b82f6" strokeWidth={2} name="Total" />
                  <Line type="monotone" dataKey="pagado" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Pagado" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* ============================================
          FILTROS Y BÚSQUEDA PREMIUM
          ============================================ */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...TRANSITION_PREMIUM }}
      >
        <div className="bg-black/30 backdrop-blur-[24px] rounded-2xl border border-white/[0.06] p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filtros de estado */}
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-sm font-medium">Estado:</span>
              <div className="flex gap-1.5 p-1 bg-white/[0.03] rounded-xl">
                {['todos', 'pendiente', 'parcial', 'pagado', 'entregado'].map((estado) => (
                  <motion.button
                    key={estado}
                    onClick={() => { setFiltroEstado(estado); haptic.light() }}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                      ${filtroEstado === estado 
                        ? 'bg-white/10 text-white' 
                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {estado === 'todos' ? 'Todos' : ESTADO_CONFIG[estado]?.label || estado}
                    {estado !== 'todos' && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/10 rounded-md">
                        {metricas.porEstado[estado as keyof typeof metricas.porEstado] || 0}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Búsqueda */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  placeholder="Buscar orden o distribuidor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-72 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/30 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* ============================================
          GRID DE ÓRDENES PREMIUM
          ============================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, ...TRANSITION_PREMIUM }}
      >
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Skeleton className="h-72 rounded-2xl bg-white/[0.03]" />
              </motion.div>
            ))}
          </div>
        ) : ordenesFiltradas.length === 0 ? (
          <motion.div 
            className="relative group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="absolute -inset-px bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl blur-xl" />
            <div className="relative bg-black/30 backdrop-blur-[24px] rounded-2xl border border-white/[0.06] p-16">
              <div className="flex flex-col items-center justify-center text-center">
                <motion.div 
                  className="p-6 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 mb-6"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ShoppingCart size={56} className="text-purple-400/50" />
                </motion.div>
                <p className="text-white/50 text-lg mb-2">No hay órdenes que mostrar</p>
                <p className="text-white/30 text-sm mb-6">Crea tu primera orden de compra para comenzar</p>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={() => { setIsModalOpen(true); haptic.light() }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/20"
                  >
                    <Plus size={16} className="mr-2" />
                    Crear primera orden
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { 
                opacity: 1,
                transition: { staggerChildren: 0.08 },
              },
            }}
          >
            {ordenesFiltradas.map((orden, index) => (
              <motion.div
                key={orden.id || index}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={TRANSITION_PREMIUM}
              >
                <OrdenCompraCardPremium orden={orden} onView={handleViewOrden} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
      
      {/* Modal de creación */}
      {isModalOpen && (
        <CreateOrdenCompraModalPremium
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      
      {/* ============================================
          PANEL DE DETALLE SLIDE-OVER PREMIUM
          ============================================ */}
      <AnimatePresence>
        {selectedOrden && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrden(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={TRANSITION_PREMIUM}
              className="fixed right-0 top-0 h-full w-[420px] z-50"
            >
              <div className="h-full bg-black/90 backdrop-blur-[24px] border-l border-white/[0.08] p-6 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-white">Detalle de Orden</h2>
                    <p className="text-white/40 text-sm mt-1">Información completa</p>
                  </div>
                  <motion.button 
                    onClick={() => setSelectedOrden(null)}
                    className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✕
                  </motion.button>
                </div>
                
                {/* Contenido */}
                <div className="space-y-4">
                  {/* ID de Orden */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06]">
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Orden</p>
                    <p className="text-2xl font-bold text-white font-mono">{selectedOrden.id}</p>
                  </div>
                  
                  {/* Distribuidor */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06]">
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Distribuidor</p>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Building2 size={18} className="text-blue-400" />
                      </div>
                      <p className="text-lg text-white">{selectedOrden.distribuidor}</p>
                    </div>
                  </div>
                  
                  {/* Montos */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/10">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Total</p>
                      <p className="text-xl font-bold text-cyan-400">{formatearMoneda(selectedOrden.costoTotal)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/5 to-violet-500/5 border border-purple-500/10">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Unidades</p>
                      <p className="text-xl font-bold text-purple-400">{formatNumber(selectedOrden.cantidad)}</p>
                    </div>
                  </div>
                  
                  {/* Estado */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06]">
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Estado</p>
                    <Badge 
                      variant="outline" 
                      className={`${ESTADO_CONFIG[selectedOrden.estado || 'pendiente']?.bgColor} ${ESTADO_CONFIG[selectedOrden.estado || 'pendiente']?.color} px-4 py-2`}
                    >
                      {ESTADO_CONFIG[selectedOrden.estado || 'pendiente']?.label}
                    </Badge>
                  </div>
                  
                  {/* Deuda pendiente */}
                  {selectedOrden.deuda > 0 && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500/5 to-pink-500/5 border border-rose-500/10">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Deuda Pendiente</p>
                      <p className="text-2xl font-bold text-rose-400">{formatearMoneda(selectedOrden.deuda)}</p>
                    </div>
                  )}
                  
                  {/* Fecha */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06]">
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Fecha</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-white/40" />
                      <p className="text-white">{formatearFecha(selectedOrden.fecha)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </motion.div>
  )
}

export default BentoOrdenesCompraPremium