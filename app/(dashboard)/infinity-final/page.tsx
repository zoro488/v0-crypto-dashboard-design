'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🌌 CHRONOS INFINITY 2026 — DASHBOARD FINAL SHOWCASE
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * El dashboard financiero más bello jamás creado.
 * Integra TODOS los componentes INFINITY:
 * - Header flotante 3D
 * - Command Menu portal
 * - 7 Orbs bancarios únicos
 * - QuantumDust particles
 * - Cursor Trail
 * - Micro-interactions
 * - Lenis scroll
 * 
 * Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Package,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { LenisProvider } from '@/app/lib/scroll/LenisProvider'
import { staggerContainerVariants, fadeVariants, slideUpVariants, butter, DURATIONS } from '@/app/lib/motion/easings'
import { INFINITY_COLORS, INFINITY_GRADIENTS } from '@/app/lib/constants/infinity-design-system'
import { TiltCard, GlowPulse, RippleContainer, FloatingElement } from '@/app/components/effects/MicroInteractions'

// Dynamic imports para mejor performance
const FloatingHeader = dynamic(() => import('@/app/components/layout/FloatingHeader'), { ssr: false })
const CommandMenu = dynamic(() => import('@/app/components/layout/CommandMenu'), { ssr: false })
const QuantumDust = dynamic(() => import('@/app/components/3d/particles/QuantumDust'), { ssr: false })
const CursorTrail = dynamic(() => import('@/app/components/effects/CursorTrail'), { ssr: false })
const BankOrbsGallery = dynamic(() => import('@/app/components/3d/BankOrbsGallery'), { ssr: false })

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════════════════

interface MetricCard {
  id: string
  title: string
  value: string
  change: number
  icon: typeof DollarSign
  gradient: string
}

interface RecentActivity {
  id: string
  type: 'venta' | 'pago' | 'compra'
  description: string
  amount: number
  time: string
}

// ════════════════════════════════════════════════════════════════════════════════════════
// DATOS DE EJEMPLO
// ════════════════════════════════════════════════════════════════════════════════════════

const METRICS: MetricCard[] = [
  { 
    id: 'capital', 
    title: 'Capital Total', 
    value: '$2,655,000', 
    change: 12.5, 
    icon: DollarSign,
    gradient: INFINITY_GRADIENTS.gold,
  },
  { 
    id: 'ventas', 
    title: 'Ventas del Mes', 
    value: '$485,000', 
    change: 8.2, 
    icon: ShoppingCart,
    gradient: INFINITY_GRADIENTS.primary,
  },
  { 
    id: 'clientes', 
    title: 'Clientes Activos', 
    value: '156', 
    change: 3.1, 
    icon: Users,
    gradient: `linear-gradient(135deg, ${INFINITY_COLORS.pink}, ${INFINITY_COLORS.violet})`,
  },
  { 
    id: 'stock', 
    title: 'Productos en Stock', 
    value: '2,340', 
    change: -2.4, 
    icon: Package,
    gradient: `linear-gradient(135deg, ${INFINITY_COLORS.violet}, ${INFINITY_COLORS.gold})`,
  },
]

const RECENT_ACTIVITY: RecentActivity[] = [
  { id: '1', type: 'venta', description: 'Venta a Cliente Premium', amount: 45000, time: 'Hace 5 min' },
  { id: '2', type: 'pago', description: 'Pago recibido - Factura #1234', amount: 32000, time: 'Hace 15 min' },
  { id: '3', type: 'compra', description: 'Orden a Distribuidor Norte', amount: -28000, time: 'Hace 1 hora' },
  { id: '4', type: 'venta', description: 'Venta mayoreo - 50 unidades', amount: 125000, time: 'Hace 2 horas' },
  { id: '5', type: 'pago', description: 'Pago parcial - Cliente Azteca', amount: 15000, time: 'Hace 3 horas' },
]

// ════════════════════════════════════════════════════════════════════════════════════════
// METRIC CARD COMPONENT
// ════════════════════════════════════════════════════════════════════════════════════════

function MetricCardComponent({ metric, index }: { metric: MetricCard; index: number }) {
  const Icon = metric.icon
  const isPositive = metric.change >= 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1] 
      }}
    >
      <TiltCard maxTilt={8} scale={1.02}>
        <RippleContainer
          className="relative p-6 rounded-3xl overflow-hidden cursor-pointer"
          color={INFINITY_COLORS.violetGlow}
        >
          {/* Background glass */}
          <div 
            className="absolute inset-0 -z-10"
            style={{
              background: INFINITY_COLORS.glassBg,
              backdropFilter: 'blur(24px) saturate(180%)',
              border: `1px solid ${INFINITY_COLORS.glassBorder}`,
            }}
          />
          
          {/* Gradient accent */}
          <div 
            className="absolute top-0 right-0 w-32 h-32 -z-5 opacity-20 blur-3xl"
            style={{ background: metric.gradient }}
          />
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: metric.gradient }}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(metric.change)}%</span>
            </div>
          </div>
          
          {/* Value */}
          <h3 
            className="text-3xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: metric.gradient }}
          >
            {metric.value}
          </h3>
          <p className="text-white/50 text-sm mt-1">{metric.title}</p>
        </RippleContainer>
      </TiltCard>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// ACTIVITY ITEM
// ════════════════════════════════════════════════════════════════════════════════════════

function ActivityItem({ activity, index }: { activity: RecentActivity; index: number }) {
  const isPositive = activity.amount >= 0
  
  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(Math.abs(value))
    return isPositive ? `+${formatted}` : `-${formatted}`
  }
  
  return (
    <motion.div
      className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <div className="flex items-center gap-4">
        <div 
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isPositive ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="w-5 h-5 text-green-400" />
          ) : (
            <ArrowUpRight className="w-5 h-5 text-red-400 rotate-180" />
          )}
        </div>
        <div>
          <p className="text-white text-sm font-medium">{activity.description}</p>
          <p className="text-white/40 text-xs">{activity.time}</p>
        </div>
      </div>
      <span className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {formatCurrency(activity.amount)}
      </span>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════════════════════════════════

export default function InfinityFinalPage() {
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false)
  
  const openCommandMenu = useCallback(() => setIsCommandMenuOpen(true), [])
  const closeCommandMenu = useCallback(() => setIsCommandMenuOpen(false), [])
  
  return (
    <LenisProvider>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Particle Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Suspense fallback={null}>
            <QuantumDust />
          </Suspense>
        </div>
        
        {/* Cursor Trail */}
        <Suspense fallback={null}>
          <CursorTrail />
        </Suspense>
        
        {/* Floating Header */}
        <Suspense fallback={null}>
          <FloatingHeader onOpenCommandMenu={openCommandMenu} />
        </Suspense>
        
        {/* Command Menu */}
        <Suspense fallback={null}>
          <CommandMenu isOpen={isCommandMenuOpen} onClose={closeCommandMenu} />
        </Suspense>
        
        {/* Main Content */}
        <main className="relative z-10 pt-24 pb-12 px-4 max-w-7xl mx-auto">
          {/* Hero Section */}
          <motion.section
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <FloatingElement amplitude={8} duration={4}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-white/60">CHRONOS INFINITY 2026</span>
              </div>
            </FloatingElement>
            
            <h1 
              className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent"
              style={{ backgroundImage: INFINITY_GRADIENTS.textShine }}
            >
              Sistema Financiero
            </h1>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              El dashboard más avanzado, inmersivo y bello jamás creado.
              Gestiona tus finanzas con una experiencia de otro universo.
            </p>
          </motion.section>
          
          {/* Metrics Grid */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {METRICS.map((metric, index) => (
                <MetricCardComponent key={metric.id} metric={metric} index={index} />
              ))}
            </div>
          </section>
          
          {/* Bank Orbs Gallery */}
          <section className="mb-16">
            <Suspense fallback={
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <BankOrbsGallery 
                title="Bóvedas & Bancos"
                subtitle="7 orbs únicos representando tu capital"
              />
            </Suspense>
          </section>
          
          {/* Activity + Stats Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <motion.div 
              className="lg:col-span-2 rounded-3xl p-6"
              style={{
                background: INFINITY_COLORS.glassBg,
                backdropFilter: 'blur(24px)',
                border: `1px solid ${INFINITY_COLORS.glassBorder}`,
              }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ background: INFINITY_COLORS.gold }}
                />
                Actividad Reciente
              </h2>
              <div className="space-y-2">
                {RECENT_ACTIVITY.map((activity, index) => (
                  <ActivityItem key={activity.id} activity={activity} index={index} />
                ))}
              </div>
            </motion.div>
            
            {/* Quick Stats */}
            <motion.div 
              className="rounded-3xl p-6"
              style={{
                background: INFINITY_COLORS.glassBg,
                backdropFilter: 'blur(24px)',
                border: `1px solid ${INFINITY_COLORS.glassBorder}`,
              }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ background: INFINITY_COLORS.violet }}
                />
                Resumen Rápido
              </h2>
              
              <div className="space-y-6">
                <GlowPulse color={INFINITY_COLORS.violet} intensity="low">
                  <div className="p-4 rounded-2xl bg-white/5">
                    <p className="text-white/40 text-sm">Ventas Hoy</p>
                    <p className="text-2xl font-bold text-white">$125,000</p>
                  </div>
                </GlowPulse>
                
                <div className="p-4 rounded-2xl bg-white/5">
                  <p className="text-white/40 text-sm">Pagos Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-400">$45,000</p>
                </div>
                
                <div className="p-4 rounded-2xl bg-white/5">
                  <p className="text-white/40 text-sm">Margen Promedio</p>
                  <p className="text-2xl font-bold text-green-400">32.5%</p>
                </div>
              </div>
            </motion.div>
          </section>
          
          {/* Footer Branding */}
          <motion.footer
            className="mt-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <p className="text-white/20 text-sm">
              CHRONOS INFINITY 2026 • El sistema financiero más bello jamás creado
            </p>
          </motion.footer>
        </main>
        
        {/* Background Gradient Mesh */}
        <div 
          className="fixed inset-0 -z-10 pointer-events-none opacity-30"
          style={{ background: INFINITY_GRADIENTS.mesh }}
        />
      </div>
    </LenisProvider>
  )
}
