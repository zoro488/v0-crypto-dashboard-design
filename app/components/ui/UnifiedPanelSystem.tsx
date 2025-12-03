'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎨 CHRONOS UNIFIED PANEL SYSTEM - Sistema de Diseño Unificado Premium
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Este archivo contiene todos los componentes base para unificar la UI/UX
 * de todos los paneles del sistema CHRONOS.
 * 
 * Paleta de colores CHRONOS:
 * - Cyan Primary: #00F5FF
 * - Magenta: #FF00AA
 * - Violet: #8B5CF6
 * - Emerald: #10B981
 * - Amber: #F59E0B
 * - Rose: #F43F5E
 * 
 * Efectos:
 * - Glassmorphism: blur(24px) + border 1px white/8
 * - Glow effects con colores temáticos
 * - Spring animations (stiffness: 300, damping: 30)
 */

import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion'
import { forwardRef, ReactNode, useState, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/app/lib/utils'
import { 
  TrendingUp, TrendingDown, Minus, ChevronRight, 
  type LucideIcon, 
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from 'recharts'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES DEL SISTEMA DE DISEÑO
// ═══════════════════════════════════════════════════════════════════════════

export const CHRONOS_TOKENS = {
  colors: {
    // Primarios
    cyan: '#00F5FF',
    magenta: '#FF00AA',
    violet: '#8B5CF6',
    
    // Semánticos
    success: '#10B981',
    warning: '#F59E0B',
    error: '#F43F5E',
    info: '#3B82F6',
    
    // Neutrales
    background: '#000000',
    surface: 'rgba(10, 10, 15, 0.8)',
    surfaceElevated: 'rgba(20, 20, 25, 0.9)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(255, 255, 255, 0.15)',
    
    // Texto
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
  },
  
  gradients: {
    cyan: 'from-cyan-500 to-blue-500',
    magenta: 'from-pink-500 to-rose-500',
    violet: 'from-violet-500 to-purple-500',
    emerald: 'from-emerald-500 to-green-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
    chronos: 'from-cyan-400 via-violet-500 to-pink-500',
  },
  
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
    md: '0 4px 16px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 50px rgba(0, 0, 0, 0.6)',
    glow: (color: string) => `0 0 40px ${color}40, 0 0 80px ${color}20`,
  },
  
  blur: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px',
  },
  
  animation: {
    spring: {
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
    fast: { duration: 0.15 },
    default: { duration: 0.3 },
    slow: { duration: 0.5 },
  },
} as const

export type ColorVariant = 'cyan' | 'magenta' | 'violet' | 'emerald' | 'amber' | 'rose'

const VARIANT_STYLES: Record<ColorVariant, { 
  gradient: string
  glow: string
  text: string
  border: string
  bg: string
}> = {
  cyan: {
    gradient: 'from-cyan-500 to-blue-500',
    glow: 'rgba(0, 245, 255, 0.4)',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
  },
  magenta: {
    gradient: 'from-pink-500 to-rose-500',
    glow: 'rgba(255, 0, 170, 0.4)',
    text: 'text-pink-400',
    border: 'border-pink-500/30',
    bg: 'bg-pink-500/10',
  },
  violet: {
    gradient: 'from-violet-500 to-purple-500',
    glow: 'rgba(139, 92, 246, 0.4)',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
  },
  emerald: {
    gradient: 'from-emerald-500 to-green-500',
    glow: 'rgba(16, 185, 129, 0.4)',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
  amber: {
    gradient: 'from-amber-500 to-orange-500',
    glow: 'rgba(245, 158, 11, 0.4)',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  rose: {
    gradient: 'from-rose-500 to-pink-500',
    glow: 'rgba(244, 63, 94, 0.4)',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: COUNT-UP ANIMADO
// ═══════════════════════════════════════════════════════════════════════════

export function useCountUp(end: number, duration: number = 1500) {
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

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: PANEL CONTAINER (Wrapper principal)
// ═══════════════════════════════════════════════════════════════════════════

interface PanelContainerProps {
  children: ReactNode
  className?: string
}

export function PanelContainer({ children, className }: PanelContainerProps) {
  return (
    <div className={cn(
      'min-h-screen bg-black p-4 md:p-6 space-y-6 relative overflow-hidden',
      className,
    )}>
      {/* Aurora Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <motion.div
          className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,245,255,0.08) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          animate={{
            x: [0, -20, 0],
            y: [0, -15, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: PANEL HEADER
// ═══════════════════════════════════════════════════════════════════════════

interface PanelHeaderProps {
  title: string
  subtitle?: string
  icon: LucideIcon
  variant?: ColorVariant
  actions?: ReactNode
  badge?: string
}

export function PanelHeader({ 
  title, 
  subtitle, 
  icon: Icon, 
  variant = 'cyan',
  actions,
  badge,
}: PanelHeaderProps) {
  const styles = VARIANT_STYLES[variant]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={CHRONOS_TOKENS.animation.spring}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <motion.div 
          className={cn(
            'relative w-14 h-14 rounded-2xl flex items-center justify-center',
            `bg-gradient-to-br ${styles.gradient}`,
          )}
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={CHRONOS_TOKENS.animation.spring}
        >
          <div 
            className="absolute inset-0 rounded-2xl opacity-50"
            style={{ boxShadow: CHRONOS_TOKENS.shadows.glow(styles.glow) }}
          />
          <Icon className="w-7 h-7 text-white relative z-10" />
        </motion.div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className={cn(
              'text-2xl md:text-3xl font-bold bg-clip-text text-transparent',
              `bg-gradient-to-r ${styles.gradient}`,
            )}>
              {title}
            </h1>
            {badge && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                styles.bg, styles.text,
              )}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-white/50 text-sm mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: UNIFIED CARD (Tarjeta base premium)
// ═══════════════════════════════════════════════════════════════════════════

interface UnifiedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  variant?: ColorVariant
  glow?: boolean
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

export const UnifiedCard = forwardRef<HTMLDivElement, UnifiedCardProps>(
  ({ 
    children, 
    variant = 'cyan', 
    glow = false, 
    hover = true,
    padding = 'md',
    className,
    ...props 
  }, ref) => {
    const styles = VARIANT_STYLES[variant]
    
    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }
    
    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative rounded-2xl overflow-hidden',
          'bg-[rgba(10,10,15,0.7)] backdrop-blur-[24px]',
          'border border-white/[0.08]',
          hover && 'hover:border-white/[0.15] cursor-pointer',
          paddingStyles[padding],
          className,
        )}
        whileHover={hover ? { 
          y: -4, 
          scale: 1.005,
          transition: CHRONOS_TOKENS.animation.spring,
        } : undefined}
        style={glow ? {
          boxShadow: CHRONOS_TOKENS.shadows.glow(styles.glow),
        } : undefined}
        {...props}
      >
        {/* Glow effect on hover */}
        {glow && (
          <div 
            className={cn(
              'absolute -inset-1 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500',
              `bg-gradient-to-r ${styles.gradient}`,
            )}
          />
        )}
        {children}
      </motion.div>
    )
  },
)

UnifiedCard.displayName = 'UnifiedCard'

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: STAT CARD (KPI con count-up)
// ═══════════════════════════════════════════════════════════════════════════

interface StatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  icon: LucideIcon
  variant?: ColorVariant
  trend?: number
  sparklineData?: number[]
  description?: string
  index?: number
}

export function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  icon: Icon,
  variant = 'cyan',
  trend,
  sparklineData,
  description,
  index = 0,
}: StatCardProps) {
  const animatedValue = useCountUp(value, 1500)
  const styles = VARIANT_STYLES[variant]
  const isTrendUp = trend !== undefined && trend >= 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        ...CHRONOS_TOKENS.animation.spring,
        delay: index * 0.1,
      }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative group"
    >
      {/* Glow effect */}
      <div 
        className={cn(
          'absolute -inset-1 rounded-3xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500',
          `bg-gradient-to-r ${styles.gradient}`,
        )}
      />
      
      {/* Card */}
      <div className="relative bg-[rgba(10,10,15,0.8)] backdrop-blur-[24px] border border-white/[0.08] rounded-2xl p-5 overflow-hidden group-hover:border-white/[0.15] transition-colors">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }} 
          />
        </div>
        
        {/* Gradient orb */}
        <motion.div
          className={cn(
            'absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity',
            `bg-gradient-to-br ${styles.gradient}`,
          )}
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                styles.bg, styles.border, 'border',
              )}>
                <Icon className={cn('w-5 h-5', styles.text)} />
              </div>
              <span className="text-sm font-medium text-white/60">{title}</span>
            </div>
            {trend !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                isTrendUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10',
              )}>
                {isTrendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{isTrendUp ? '+' : ''}{trend.toFixed(1)}%</span>
              </div>
            )}
          </div>
          
          {/* Value */}
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-xl text-white/50">{prefix}</span>}
            <motion.span 
              className="text-3xl md:text-4xl font-bold text-white"
              key={animatedValue}
            >
              {animatedValue.toLocaleString()}
            </motion.span>
            {suffix && <span className="text-lg text-white/50 ml-1">{suffix}</span>}
          </div>
          
          {description && (
            <p className="text-sm text-white/40 mt-2">{description}</p>
          )}
          
          {/* Mini Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="mt-4 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData.map((v, i) => ({ value: v, index: i }))}>
                  <defs>
                    <linearGradient id={`stat-sparkline-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isTrendUp ? '#10b981' : '#f43f5e'} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={isTrendUp ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={isTrendUp ? '#10b981' : '#f43f5e'}
                    strokeWidth={2}
                    fill={`url(#stat-sparkline-${index})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: UNIFIED BUTTON
// ═══════════════════════════════════════════════════════════════════════════

interface UnifiedButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  colorVariant?: ColorVariant
}

export function UnifiedButton({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  onClick,
  disabled = false,
  loading = false,
  className,
  colorVariant = 'cyan',
}: UnifiedButtonProps) {
  const styles = VARIANT_STYLES[colorVariant]
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  }
  
  const variantStyles = {
    primary: cn(
      `bg-gradient-to-r ${styles.gradient}`,
      'text-white font-semibold',
      'shadow-lg',
      'hover:opacity-90',
    ),
    secondary: cn(
      'bg-white/[0.05] backdrop-blur-xl',
      'border border-white/[0.1]',
      'text-white font-medium',
      'hover:bg-white/[0.1] hover:border-white/[0.2]',
    ),
    ghost: cn(
      'bg-transparent',
      'text-white/70 font-medium',
      'hover:bg-white/[0.05] hover:text-white',
    ),
    danger: cn(
      'bg-gradient-to-r from-rose-600 to-red-600',
      'text-white font-semibold',
      'shadow-lg shadow-red-500/25',
      'hover:opacity-90',
    ),
  }
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={CHRONOS_TOKENS.animation.spring}
      className={cn(
        'inline-flex items-center justify-center rounded-xl',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
    >
      {loading ? (
        <motion.div
          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </motion.button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: DATA TABLE PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

interface TableColumn<T> {
  key: keyof T | string
  header: string
  width?: string
  render?: (value: unknown, row: T) => ReactNode
}

interface UnifiedTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  loading?: boolean
  variant?: ColorVariant
}

export function UnifiedTable<T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  loading = false,
  variant = 'cyan',
}: UnifiedTableProps<T>) {
  const styles = VARIANT_STYLES[variant]
  
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="h-16 bg-white/[0.03] rounded-xl animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    )
  }
  
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mb-4',
          styles.bg,
        )}>
          <Minus className={cn('w-8 h-8', styles.text)} />
        </div>
        <p className="text-white/50">{emptyMessage}</p>
      </div>
    )
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.08]">
            {columns.map((col, i) => (
              <th 
                key={String(col.key)}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40',
                  i === 0 && 'pl-0',
                )}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <motion.tr
              key={rowIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.05 }}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors',
                onRowClick && 'cursor-pointer',
              )}
            >
              {columns.map((col, i) => (
                <td 
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-4 text-sm text-white/80',
                    i === 0 && 'pl-0 font-medium text-white',
                  )}
                >
                  {col.render 
                    ? col.render(row[col.key as keyof T], row)
                    : String(row[col.key as keyof T] ?? '-')
                  }
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: CHART CONTAINER
// ═══════════════════════════════════════════════════════════════════════════

interface ChartContainerProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  variant?: ColorVariant
  height?: number
  children: ReactNode
  actions?: ReactNode
}

export function ChartContainer({
  title,
  subtitle,
  icon: Icon,
  variant = 'cyan',
  height = 280,
  children,
  actions,
}: ChartContainerProps) {
  const styles = VARIANT_STYLES[variant]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      {/* Glow */}
      <div 
        className={cn(
          'absolute -inset-1 rounded-2xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500',
          `bg-gradient-to-r ${styles.gradient}`,
        )}
      />
      
      <div className="relative bg-[rgba(10,10,15,0.7)] backdrop-blur-[24px] border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.12] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                styles.bg, styles.border, 'border',
              )}>
                <Icon className={cn('w-5 h-5', styles.text)} />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              {subtitle && <p className="text-sm text-white/40">{subtitle}</p>}
            </div>
          </div>
          {actions}
        </div>
        
        {/* Chart */}
        <div style={{ height }}>
          {children}
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: TABS PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

interface TabItem {
  id: string
  label: string
  icon?: LucideIcon
  badge?: string | number
}

interface UnifiedTabsProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  variant?: ColorVariant
}

export function UnifiedTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'cyan',
}: UnifiedTabsProps) {
  const styles = VARIANT_STYLES[variant]
  
  return (
    <div className="flex items-center gap-2 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              isActive 
                ? cn('text-white', styles.bg)
                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]',
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            {tab.badge !== undefined && (
              <span className={cn(
                'ml-1 px-1.5 py-0.5 rounded-full text-xs',
                isActive ? 'bg-white/20' : 'bg-white/10',
              )}>
                {tab.badge}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className={cn(
                  'absolute inset-0 rounded-lg -z-10',
                  `bg-gradient-to-r ${styles.gradient} opacity-20`,
                )}
                transition={CHRONOS_TOKENS.animation.spring}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: ACTIVITY ITEM
// ═══════════════════════════════════════════════════════════════════════════

interface ActivityItemProps {
  icon: LucideIcon
  title: string
  description: string
  time: string
  status?: 'success' | 'warning' | 'error' | 'info'
  amount?: number
}

export function ActivityItem({
  icon: Icon,
  title,
  description,
  time,
  status = 'info',
  amount,
}: ActivityItemProps) {
  const statusStyles = {
    success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
    error: { bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-500' },
    info: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500' },
  }
  
  const styles = statusStyles[status]
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.03)' }}
      className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors"
    >
      <div className="relative">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.06]',
          styles.bg,
        )}>
          <Icon className={cn('w-5 h-5', styles.text)} />
        </div>
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black',
          styles.dot,
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        <p className="text-xs text-white/40 truncate">{description}</p>
      </div>
      <div className="text-right shrink-0">
        {amount !== undefined && (
          <p className={cn(
            'text-sm font-bold',
            amount >= 0 ? 'text-emerald-400' : 'text-rose-400',
          )}>
            {amount >= 0 ? '+' : ''}${Math.abs(amount).toLocaleString()}
          </p>
        )}
        <p className="text-[10px] text-white/25 mt-0.5">{time}</p>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: BADGE PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

interface UnifiedBadgeProps {
  children: ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  size?: 'sm' | 'md'
  icon?: LucideIcon
}

export function UnifiedBadge({
  children,
  variant = 'default',
  size = 'md',
  icon: Icon,
}: UnifiedBadgeProps) {
  const variantStyles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    default: 'bg-white/5 text-white/70 border-white/10',
  }
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-medium',
      variantStyles[variant],
      sizeStyles[size],
    )}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: SKELETON LOADER
// ═══════════════════════════════════════════════════════════════════════════

interface SkeletonProps {
  className?: string
  variant?: 'card' | 'text' | 'circle' | 'stat'
}

export function UnifiedSkeleton({ className, variant = 'text' }: SkeletonProps) {
  const variantStyles = {
    card: 'h-40 rounded-2xl',
    text: 'h-4 rounded',
    circle: 'rounded-full',
    stat: 'h-32 rounded-2xl',
  }
  
  return (
    <div 
      className={cn(
        'bg-white/[0.05] animate-pulse',
        variantStyles[variant],
        className,
      )}
    />
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <UnifiedSkeleton className="w-14 h-14 rounded-2xl" variant="card" />
        <div className="space-y-2">
          <UnifiedSkeleton className="w-48 h-6" />
          <UnifiedSkeleton className="w-32 h-4" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <UnifiedSkeleton key={i} variant="stat" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UnifiedSkeleton className="h-80" variant="card" />
        </div>
        <UnifiedSkeleton className="h-80" variant="card" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: ColorVariant
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'cyan',
}: EmptyStateProps) {
  const styles = VARIANT_STYLES[variant]
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className={cn(
        'w-20 h-20 rounded-2xl flex items-center justify-center mb-6',
        styles.bg, styles.border, 'border',
      )}>
        <Icon className={cn('w-10 h-10', styles.text)} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/50 max-w-sm mb-6">{description}</p>
      {action && (
        <UnifiedButton
          variant="primary"
          onClick={action.onClick}
          colorVariant={variant}
        >
          {action.label}
        </UnifiedButton>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTACIONES
// ═══════════════════════════════════════════════════════════════════════════

export {
  VARIANT_STYLES,
}
