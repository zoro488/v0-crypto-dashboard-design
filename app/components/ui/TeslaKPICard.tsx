'use client'

/**
 * 📊 TESLA KPI CARDS - Premium 2025
 * 
 * Cards de KPI estilo Tesla/Apple:
 * - Número gigante 64px con count-up suave
 * - Fondo #111111 (dark mode)
 * - Border-radius 20px
 * - Padding 32px
 * - Icono sutil arriba izquierda
 * - Trend indicator
 * - Glassmorphism hover
 */

import { motion, useMotionValue, useSpring, animate } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  Wallet,
  CreditCard,
  BarChart3,
  Activity,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface TeslaKPICardProps {
  title: string
  value: number
  format?: 'currency' | 'number' | 'percentage'
  trend?: number
  trendLabel?: string
  icon?: LucideIcon
  className?: string
  delay?: number
  onClick?: () => void
}

interface KPIGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: Animated Counter
// ═══════════════════════════════════════════════════════════════════════════════

const useAnimatedCounter = (value: number, duration = 1.5) => {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplayValue(latest),
    })
    
    return () => controls.stop()
  }, [value, duration])
  
  return displayValue
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Tesla KPI Card
// ═══════════════════════════════════════════════════════════════════════════════

export function TeslaKPICard({
  title,
  value,
  format = 'number',
  trend,
  trendLabel = 'vs mes anterior',
  icon: Icon = BarChart3,
  className,
  delay = 0,
  onClick,
}: TeslaKPICardProps) {
  const animatedValue = useAnimatedCounter(value)
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return `$${Math.round(val).toLocaleString('es-MX')}`
      case 'percentage':
        return `${val.toFixed(1)}%`
      default:
        return Math.round(val).toLocaleString('es-MX')
    }
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden',
        'bg-[#111111] rounded-[20px] p-8',
        'border border-white/[0.05]',
        'transition-all duration-300',
        'hover:border-white/[0.1] hover:shadow-2xl hover:shadow-black/50',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {/* Hover glow effect */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.03), transparent 40%)`,
        }}
      />

      {/* Top highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Icon */}
      <div className="flex items-center justify-between mb-6">
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <Icon className="w-5 h-5 text-white/40" strokeWidth={1.5} />
        </div>
        
        {/* Trend Badge */}
        {trend !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.3 }}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
              trend >= 0 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20',
            )}
          >
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </motion.div>
        )}
      </div>

      {/* Value - 64px */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
        className="mb-2"
      >
        <span 
          className="text-[64px] font-bold text-white leading-none tracking-tight"
          style={{ fontFeatureSettings: "'tnum', 'cv11', 'ss01'" }}
        >
          {formatValue(animatedValue)}
        </span>
      </motion.div>

      {/* Label */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#98989D] font-medium">{title}</p>
        {trend !== undefined && (
          <p className="text-xs text-white/30">{trendLabel}</p>
        )}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: KPI Grid Container
// ═══════════════════════════════════════════════════════════════════════════════

export function KPIGrid({ children, columns = 4, className }: KPIGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className={cn(
        'grid gap-4 lg:gap-6',
        gridCols[columns],
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Mini KPI Card (para sidebar o espacios reducidos)
// ═══════════════════════════════════════════════════════════════════════════════

interface MiniKPICardProps {
  title: string
  value: string | number
  trend?: number
  icon?: LucideIcon
  className?: string
}

export function MiniKPICard({
  title,
  value,
  trend,
  icon: Icon = Activity,
  className,
}: MiniKPICardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        'p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]',
        'hover:bg-white/[0.05] transition-all duration-200',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-white/40" strokeWidth={1.5} />
        {trend !== undefined && (
          <span className={cn(
            'text-xs font-medium',
            trend >= 0 ? 'text-green-400' : 'text-red-400',
          )}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-xs text-white/40 mt-1">{title}</p>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default TeslaKPICard
