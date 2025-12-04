'use client'

/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    🌌 CHRONOS QUANTUM 2026 DASHBOARD 🌌                       ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  DISEÑO MÁS PREMIUM, MODERNO Y AVANZADO DEL MUNDO                            ║
 * ║  Tecnologías: Framer Motion 3D + Canvas Shaders + Glass Morphism Ultra       ║
 * ║                                                                               ║
 * ║  🚫 CYAN PROHIBIDO PARA SIEMPRE                                              ║
 * ║                                                                               ║
 * ║  PALETA DEFINITIVA:                                                          ║
 * ║  • Negro Absoluto: #000000                                                   ║
 * ║  • Violeta Real Profundo: #8B00FF                                            ║
 * ║  • Oro Líquido: #FFD700                                                      ║
 * ║  • Rosa Eléctrico Plasma: #FF1493                                            ║
 * ║  • Blanco Puro: #FFFFFF                                                      ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Package,
  BarChart3,
  Sparkles,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  CreditCard,
  PiggyBank,
  Target,
  Crown,
  Gem,
  Star,
  Bell
} from 'lucide-react'
import { logger } from '@/app/lib/utils/logger'

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 QUANTUM DESIGN TOKENS - Paleta sin cyan
// ═══════════════════════════════════════════════════════════════════════════════

const QUANTUM = {
  colors: {
    void: '#000000',
    voidDeep: '#050505',
    voidSoft: '#0a0a0a',
    violet: '#8B00FF',
    violetBright: '#A020F0',
    violetDark: '#6B00CC',
    violetGlow: 'rgba(139, 0, 255, 0.6)',
    gold: '#FFD700',
    goldBright: '#FFE135',
    goldDark: '#B8860B',
    goldGlow: 'rgba(255, 215, 0, 0.6)',
    pink: '#FF1493',
    pinkBright: '#FF69B4',
    pinkDark: '#C71585',
    pinkGlow: 'rgba(255, 20, 147, 0.6)',
    white: '#FFFFFF',
    silver: '#E5E5E5',
    gray: '#333333',
    grayLight: '#666666',
  },
  shadows: {
    card: '0 25px 60px -12px rgba(139, 0, 255, 0.25), 0 15px 30px -15px rgba(255, 215, 0, 0.15)',
    cardHover: '0 35px 80px -12px rgba(139, 0, 255, 0.35), 0 25px 50px -15px rgba(255, 215, 0, 0.25)',
    kpi: '0 20px 50px -10px rgba(139, 0, 255, 0.3)',
    orb: '0 0 80px 30px rgba(139, 0, 255, 0.4), 0 0 120px 60px rgba(255, 215, 0, 0.2)',
    glow: '0 0 40px rgba(139, 0, 255, 0.5)',
    goldGlow: '0 0 40px rgba(255, 215, 0, 0.5)',
    pinkGlow: '0 0 40px rgba(255, 20, 147, 0.5)',
  },
  gradients: {
    heroCard: 'linear-gradient(135deg, rgba(139, 0, 255, 0.15) 0%, rgba(255, 215, 0, 0.1) 50%, rgba(255, 20, 147, 0.05) 100%)',
    kpiViolet: 'linear-gradient(135deg, rgba(139, 0, 255, 0.2) 0%, rgba(139, 0, 255, 0.05) 100%)',
    kpiGold: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0.05) 100%)',
    kpiPink: 'linear-gradient(135deg, rgba(255, 20, 147, 0.2) 0%, rgba(255, 20, 147, 0.05) 100%)',
    glassBorder: 'linear-gradient(135deg, rgba(139, 0, 255, 0.3) 0%, rgba(255, 215, 0, 0.2) 50%, rgba(255, 20, 147, 0.1) 100%)',
    orb: 'radial-gradient(ellipse at center, rgba(139, 0, 255, 0.8) 0%, rgba(255, 215, 0, 0.4) 40%, transparent 70%)',
    shine: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
  },
  glass: {
    background: 'rgba(10, 10, 10, 0.85)',
    border: '1px solid rgba(139, 0, 255, 0.2)',
    blur: 'blur(20px)',
  },
  animation: {
    spring: { type: 'spring', stiffness: 300, damping: 30 },
    bounce: { type: 'spring', stiffness: 400, damping: 25 },
    smooth: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// 🌌 QUANTUM ORB - Orbe 3D animado con Canvas
// ═══════════════════════════════════════════════════════════════════════════════

const QuantumOrb = memo(function QuantumOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const timeRef = useRef(0)

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2

    timeRef.current += 0.008

    // Clear con fade
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
    ctx.fillRect(0, 0, width, height)

    // Orbe principal violeta
    const radius = 80 + Math.sin(timeRef.current * 2) * 15
    const gradient = ctx.createRadialGradient(
      centerX + Math.sin(timeRef.current) * 20,
      centerY + Math.cos(timeRef.current) * 20,
      0,
      centerX,
      centerY,
      radius * 1.5
    )
    gradient.addColorStop(0, 'rgba(139, 0, 255, 0.9)')
    gradient.addColorStop(0.3, 'rgba(139, 0, 255, 0.6)')
    gradient.addColorStop(0.6, 'rgba(255, 215, 0, 0.3)')
    gradient.addColorStop(1, 'rgba(255, 20, 147, 0)')

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    // Anillos orbitales
    for (let i = 0; i < 3; i++) {
      const orbitRadius = 100 + i * 30
      const angle = timeRef.current * (1 + i * 0.5) + (i * Math.PI * 2) / 3
      const particleX = centerX + Math.cos(angle) * orbitRadius
      const particleY = centerY + Math.sin(angle) * orbitRadius * 0.4

      const particleGradient = ctx.createRadialGradient(
        particleX, particleY, 0,
        particleX, particleY, 12
      )
      const colors = ['#8B00FF', '#FFD700', '#FF1493']
      particleGradient.addColorStop(0, colors[i])
      particleGradient.addColorStop(1, 'transparent')

      ctx.beginPath()
      ctx.arc(particleX, particleY, 8, 0, Math.PI * 2)
      ctx.fillStyle = particleGradient
      ctx.fill()
    }

    // Estrellas de fondo
    for (let i = 0; i < 30; i++) {
      const starX = (Math.sin(i * 123.456 + timeRef.current * 0.1) + 1) * width / 2
      const starY = (Math.cos(i * 789.012 + timeRef.current * 0.1) + 1) * height / 2
      const starSize = Math.sin(timeRef.current + i) * 1.5 + 2
      const starAlpha = Math.sin(timeRef.current * 2 + i) * 0.3 + 0.4

      ctx.beginPath()
      ctx.arc(starX, starY, starSize, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 215, 0, ${starAlpha})`
      ctx.fill()
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 300

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animate])

  return (
    <motion.div
      className="relative rounded-3xl overflow-hidden"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: QUANTUM.glass.background,
        backdropFilter: QUANTUM.glass.blur,
        border: '1px solid rgba(139, 0, 255, 0.3)',
        boxShadow: QUANTUM.shadows.orb,
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {/* Overlay con gradiente */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.5) 100%)',
        }}
      />
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════
// 💎 QUANTUM KPI CARD - Tarjetas de métricas con efectos 3D
// ═══════════════════════════════════════════════════════════════════════════════

interface KPICardProps {
  title: string
  value: string
  change: number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  variant: 'violet' | 'gold' | 'pink'
  delay?: number
}

const QuantumKPICard = memo(function QuantumKPICard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  variant,
  delay = 0 
}: KPICardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useTransform(y, [-100, 100], [8, -8])
  const rotateY = useTransform(x, [-100, 100], [-8, 8])

  const springConfig = { stiffness: 300, damping: 30 }
  const smoothRotateX = useSpring(rotateX, springConfig)
  const smoothRotateY = useSpring(rotateY, springConfig)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set(e.clientX - centerX)
    y.set(e.clientY - centerY)
  }, [x, y])

  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }, [x, y])

  const gradients = {
    violet: QUANTUM.gradients.kpiViolet,
    gold: QUANTUM.gradients.kpiGold,
    pink: QUANTUM.gradients.kpiPink,
  }

  const glows = {
    violet: QUANTUM.shadows.glow,
    gold: QUANTUM.shadows.goldGlow,
    pink: QUANTUM.shadows.pinkGlow,
  }

  const colors = {
    violet: QUANTUM.colors.violet,
    gold: QUANTUM.colors.gold,
    pink: QUANTUM.colors.pink,
  }

  const isPositive = change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: delay * 0.1, 
        duration: 0.6, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      style={{
        rotateX: smoothRotateX,
        rotateY: smoothRotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="cursor-pointer"
    >
      <motion.div
        className="relative p-6 rounded-2xl overflow-hidden"
        animate={{
          boxShadow: isHovered ? glows[variant] : 'none',
        }}
        style={{
          background: gradients[variant],
          backdropFilter: QUANTUM.glass.blur,
          border: `1px solid ${colors[variant]}33`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Brillo animado */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: isHovered ? '100%' : '-100%' }}
          transition={{ duration: 0.6 }}
          style={{
            background: QUANTUM.gradients.shine,
          }}
        />

        {/* Contenido */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <motion.div
              className="p-3 rounded-xl"
              style={{ 
                background: `${colors[variant]}20`,
                boxShadow: isHovered ? `0 0 20px ${colors[variant]}40` : 'none',
              }}
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={QUANTUM.animation.spring}
            >
              <Icon 
                className="w-6 h-6" 
                style={{ color: colors[variant] }}
              />
            </motion.div>
            
            <motion.div
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                background: isPositive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isPositive ? '#22C55E' : '#EF4444',
              }}
            >
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{Math.abs(change)}%</span>
            </motion.div>
          </div>

          <motion.p 
            className="text-3xl font-bold mb-2"
            style={{ 
              color: QUANTUM.colors.white,
              textShadow: isHovered ? `0 0 20px ${colors[variant]}60` : 'none',
            }}
          >
            {value}
          </motion.p>
          
          <p 
            className="text-sm font-medium"
            style={{ color: QUANTUM.colors.silver }}
          >
            {title}
          </p>
        </div>

        {/* Efecto 3D de profundidad */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${colors[variant]}10, transparent)`,
            transform: 'translateZ(-20px)',
          }}
        />
      </motion.div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════
// 🏦 QUANTUM BANK CARD - Tarjetas de bóvedas/bancos
// ═══════════════════════════════════════════════════════════════════════════════

interface BankCardProps {
  name: string
  balance: number
  ingresos: number
  gastos: number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  variant: 'violet' | 'gold' | 'pink'
  delay?: number
}

const QuantumBankCard = memo(function QuantumBankCard({
  name,
  balance,
  ingresos,
  gastos,
  icon: Icon,
  variant,
  delay = 0
}: BankCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const colors = {
    violet: QUANTUM.colors.violet,
    gold: QUANTUM.colors.gold,
    pink: QUANTUM.colors.pink,
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: delay * 0.08, duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative overflow-hidden rounded-2xl cursor-pointer"
      style={{
        background: QUANTUM.glass.background,
        backdropFilter: QUANTUM.glass.blur,
        border: `1px solid ${colors[variant]}30`,
      }}
    >
      <motion.div
        animate={{
          boxShadow: isHovered ? QUANTUM.shadows.card : 'none',
        }}
        className="p-5"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="p-2.5 rounded-xl"
            style={{ 
              background: `${colors[variant]}15`,
              border: `1px solid ${colors[variant]}30`,
            }}
            animate={{ 
              scale: isHovered ? 1.1 : 1,
              boxShadow: isHovered ? `0 0 25px ${colors[variant]}40` : 'none',
            }}
          >
            <Icon className="w-5 h-5" style={{ color: colors[variant] }} />
          </motion.div>
          <div>
            <p className="text-sm font-medium" style={{ color: QUANTUM.colors.silver }}>
              {name}
            </p>
            <motion.p 
              className="text-xl font-bold"
              style={{ 
                color: QUANTUM.colors.white,
                textShadow: isHovered ? `0 0 15px ${colors[variant]}50` : 'none',
              }}
            >
              {formatCurrency(balance)}
            </motion.p>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            className="p-3 rounded-xl"
            style={{ background: 'rgba(34, 197, 94, 0.1)' }}
          >
            <p className="text-xs" style={{ color: QUANTUM.colors.grayLight }}>Ingresos</p>
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>
              {formatCurrency(ingresos)}
            </p>
          </div>
          <div 
            className="p-3 rounded-xl"
            style={{ background: 'rgba(239, 68, 68, 0.1)' }}
          >
            <p className="text-xs" style={{ color: QUANTUM.colors.grayLight }}>Gastos</p>
            <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>
              {formatCurrency(gastos)}
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div 
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: QUANTUM.colors.gray }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((ingresos / (ingresos + gastos)) * 100, 100)}%` }}
              transition={{ delay: delay * 0.08 + 0.3, duration: 0.8 }}
              style={{
                background: `linear-gradient(90deg, ${colors[variant]}, ${QUANTUM.colors.gold})`,
                boxShadow: `0 0 10px ${colors[variant]}60`,
              }}
            />
          </div>
        </div>

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ 
            x: isHovered ? '100%' : '-100%', 
            opacity: isHovered ? 0.3 : 0 
          }}
          transition={{ duration: 0.5 }}
          style={{
            background: QUANTUM.gradients.shine,
          }}
        />
      </motion.div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 QUANTUM ACTIVITY FEED - Feed de actividad reciente
// ═══════════════════════════════════════════════════════════════════════════════

interface ActivityItem {
  id: string
  type: 'venta' | 'gasto' | 'ingreso' | 'alerta'
  title: string
  amount?: number
  time: string
}

const QuantumActivityFeed = memo(function QuantumActivityFeed() {
  const activities: ActivityItem[] = useMemo(() => [
    { id: '1', type: 'venta', title: 'Venta registrada - Cliente Premium', amount: 15000, time: 'Hace 5 min' },
    { id: '2', type: 'ingreso', title: 'Pago recibido - Orden #1234', amount: 28500, time: 'Hace 15 min' },
    { id: '3', type: 'gasto', title: 'Transferencia a proveedor', amount: -8000, time: 'Hace 30 min' },
    { id: '4', type: 'alerta', title: 'Stock bajo - Producto XYZ', time: 'Hace 1 hora' },
    { id: '5', type: 'venta', title: 'Nueva orden de compra', amount: 42000, time: 'Hace 2 horas' },
  ], [])

  const getTypeStyles = (type: ActivityItem['type']) => {
    switch (type) {
      case 'venta':
        return { 
          icon: ShoppingCart, 
          color: QUANTUM.colors.gold, 
          bg: 'rgba(255, 215, 0, 0.1)' 
        }
      case 'ingreso':
        return { 
          icon: TrendingUp, 
          color: '#22C55E', 
          bg: 'rgba(34, 197, 94, 0.1)' 
        }
      case 'gasto':
        return { 
          icon: TrendingDown, 
          color: '#EF4444', 
          bg: 'rgba(239, 68, 68, 0.1)' 
        }
      case 'alerta':
        return { 
          icon: Bell, 
          color: QUANTUM.colors.pink, 
          bg: 'rgba(255, 20, 147, 0.1)' 
        }
      default:
        return { 
          icon: Activity, 
          color: QUANTUM.colors.violet, 
          bg: 'rgba(139, 0, 255, 0.1)' 
        }
    }
  }

  const formatCurrency = (amount: number) => {
    const prefix = amount >= 0 ? '+' : ''
    return prefix + new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-2xl p-5"
      style={{
        background: QUANTUM.glass.background,
        backdropFilter: QUANTUM.glass.blur,
        border: `1px solid ${QUANTUM.colors.violet}20`,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5" style={{ color: QUANTUM.colors.violet }} />
        <h3 className="font-semibold" style={{ color: QUANTUM.colors.white }}>
          Actividad Reciente
        </h3>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {activities.map((activity, index) => {
            const styles = getTypeStyles(activity.type)
            const IconComponent = styles.icon

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                style={{ background: styles.bg }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: `0 0 20px ${styles.color}30`,
                }}
              >
                <div 
                  className="p-2 rounded-lg"
                  style={{ background: `${styles.color}20` }}
                >
                  <IconComponent className="w-4 h-4" style={{ color: styles.color }} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm font-medium truncate"
                    style={{ color: QUANTUM.colors.white }}
                  >
                    {activity.title}
                  </p>
                  <p className="text-xs" style={{ color: QUANTUM.colors.grayLight }}>
                    {activity.time}
                  </p>
                </div>

                {activity.amount !== undefined && (
                  <p 
                    className="text-sm font-semibold"
                    style={{ 
                      color: activity.amount >= 0 ? '#22C55E' : '#EF4444' 
                    }}
                  >
                    {formatCurrency(activity.amount)}
                  </p>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function BentoDashboardQuantum() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    logger.info('BentoDashboardQuantum montado', { context: 'Dashboard' })
    return () => {
      logger.info('BentoDashboardQuantum desmontado', { context: 'Dashboard' })
    }
  }, [])

  // KPIs simulados
  const kpis = useMemo(() => [
    { 
      title: 'Capital Total', 
      value: '$2,847,500', 
      change: 12.5, 
      icon: Wallet, 
      variant: 'violet' as const 
    },
    { 
      title: 'Ventas del Mes', 
      value: '$485,200', 
      change: 8.3, 
      icon: ShoppingCart, 
      variant: 'gold' as const 
    },
    { 
      title: 'Clientes Activos', 
      value: '1,247', 
      change: 15.2, 
      icon: Users, 
      variant: 'pink' as const 
    },
    { 
      title: 'Órdenes Pendientes', 
      value: '23', 
      change: -5.1, 
      icon: Package, 
      variant: 'violet' as const 
    },
  ], [])

  // Bancos simulados
  const banks = useMemo(() => [
    { name: 'Bóveda Monte', balance: 850000, ingresos: 120000, gastos: 45000, icon: Crown, variant: 'gold' as const },
    { name: 'Bóveda USA', balance: 450000, ingresos: 85000, gastos: 32000, icon: DollarSign, variant: 'violet' as const },
    { name: 'Utilidades', balance: 380000, ingresos: 95000, gastos: 28000, icon: Gem, variant: 'pink' as const },
    { name: 'Fletes Sur', balance: 125000, ingresos: 45000, gastos: 18000, icon: Package, variant: 'violet' as const },
    { name: 'Profit', balance: 290000, ingresos: 72000, gastos: 24000, icon: TrendingUp, variant: 'gold' as const },
    { name: 'Leftie', balance: 180000, ingresos: 38000, gastos: 15000, icon: CreditCard, variant: 'pink' as const },
    { name: 'Azteca', balance: 95000, ingresos: 28000, gastos: 12000, icon: Star, variant: 'violet' as const },
  ], [])

  if (!mounted) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: QUANTUM.colors.void }}
      >
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1, repeat: Infinity },
          }}
          className="w-16 h-16 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${QUANTUM.colors.violet}, ${QUANTUM.colors.gold})`,
            boxShadow: QUANTUM.shadows.orb,
          }}
        />
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen p-6 lg:p-8"
      style={{ 
        background: `linear-gradient(180deg, ${QUANTUM.colors.void} 0%, ${QUANTUM.colors.voidDeep} 100%)`,
      }}
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            animate={{ 
              boxShadow: [
                `0 0 20px ${QUANTUM.colors.violet}40`,
                `0 0 30px ${QUANTUM.colors.gold}40`,
                `0 0 20px ${QUANTUM.colors.violet}40`,
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="p-2 rounded-xl"
            style={{ 
              background: `linear-gradient(135deg, ${QUANTUM.colors.violet}20, ${QUANTUM.colors.gold}20)`,
              border: `1px solid ${QUANTUM.colors.violet}30`,
            }}
          >
            <Sparkles className="w-6 h-6" style={{ color: QUANTUM.colors.gold }} />
          </motion.div>
          <div>
            <h1 
              className="text-3xl font-bold"
              style={{ 
                color: QUANTUM.colors.white,
                textShadow: `0 0 30px ${QUANTUM.colors.violet}40`,
              }}
            >
              CHRONOS
            </h1>
            <p className="text-sm" style={{ color: QUANTUM.colors.grayLight }}>
              Quantum Dashboard 2026
            </p>
          </div>
        </div>
      </motion.header>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Orbe 3D - Columna izquierda */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          <QuantumOrb />
        </div>

        {/* KPIs - Centro */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-5">
          <div className="grid grid-cols-2 gap-4">
            {kpis.map((kpi, index) => (
              <QuantumKPICard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                icon={kpi.icon}
                variant={kpi.variant}
                delay={index}
              />
            ))}
          </div>
        </div>

        {/* Activity Feed - Derecha */}
        <div className="col-span-12 xl:col-span-4">
          <QuantumActivityFeed />
        </div>

        {/* Bancos - Fila completa */}
        <div className="col-span-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-4 flex items-center gap-2"
          >
            <PiggyBank className="w-5 h-5" style={{ color: QUANTUM.colors.gold }} />
            <h2 
              className="text-xl font-semibold"
              style={{ color: QUANTUM.colors.white }}
            >
              Bóvedas y Bancos
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {banks.map((bank, index) => (
              <QuantumBankCard
                key={bank.name}
                name={bank.name}
                balance={bank.balance}
                ingresos={bank.ingresos}
                gastos={bank.gastos}
                icon={bank.icon}
                variant={bank.variant}
                delay={index}
              />
            ))}
          </div>
        </div>

        {/* Footer Stats */}
        <motion.div 
          className="col-span-12 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div 
            className="flex items-center justify-center gap-8 py-4 px-6 rounded-2xl"
            style={{
              background: QUANTUM.glass.background,
              backdropFilter: QUANTUM.glass.blur,
              border: `1px solid ${QUANTUM.colors.violet}15`,
            }}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: QUANTUM.colors.gold }} />
              <span className="text-sm" style={{ color: QUANTUM.colors.silver }}>
                Sistema operando a máxima capacidad
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: QUANTUM.colors.violet }} />
              <span className="text-sm" style={{ color: QUANTUM.colors.silver }}>
                Última actualización: Ahora
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
