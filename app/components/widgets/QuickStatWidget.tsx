'use client'

/**
 * 🎯 QUICK STATS WIDGET - Widget de Estadísticas Rápidas Premium
 * 
 * Componente compacto para mostrar estadísticas con:
 * - Animaciones de entrada elegantes
 * - Efectos de hover premium
 * - Sparkline mini-gráfico
 * - Indicadores de tendencia
 * - Glassmorphism avanzado
 */

import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'

// ============================================================================
// TIPOS
// ============================================================================
interface QuickStatWidgetProps {
  title: string
  value: number | string
  prefix?: string
  suffix?: string
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'pink' | 'red'
  sparklineData?: number[]
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  onClick?: () => void
  className?: string
  delay?: number
}

// ============================================================================
// CONFIGURACIÓN DE COLORES
// ============================================================================
const colorConfig = {
  blue: {
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    glow: 'rgba(59, 130, 246, 0.3)',
    spark: '#3b82f6',
  },
  green: {
    gradient: 'from-emerald-500 to-green-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    glow: 'rgba(16, 185, 129, 0.3)',
    spark: '#10b981',
  },
  purple: {
    gradient: 'from-purple-500 to-violet-500',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    glow: 'rgba(139, 92, 246, 0.3)',
    spark: '#8b5cf6',
  },
  orange: {
    gradient: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    glow: 'rgba(249, 115, 22, 0.3)',
    spark: '#f97316',
  },
  cyan: {
    gradient: 'from-cyan-500 to-teal-500',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    glow: 'rgba(6, 182, 212, 0.3)',
    spark: '#06b6d4',
  },
  pink: {
    gradient: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    glow: 'rgba(236, 72, 153, 0.3)',
    spark: '#ec4899',
  },
  red: {
    gradient: 'from-red-500 to-rose-500',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    glow: 'rgba(239, 68, 68, 0.3)',
    spark: '#ef4444',
  },
}

// ============================================================================
// COMPONENTE SPARKLINE
// ============================================================================
function Sparkline({ data, color, width = 80, height = 30 }: { 
  data: number[]
  color: string
  width?: number
  height?: number 
}) {
  if (!data || data.length < 2) return null
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  
  const areaPoints = `0,${height} ${points} ${width},${height}`
  
  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="overflow-visible"
      style={{ width, height }}
    >
      <defs>
        <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Área bajo la línea */}
      <motion.polygon
        points={areaPoints}
        fill={`url(#sparkGrad-${color.replace('#', '')})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      
      {/* Línea principal */}
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      
      {/* Punto final */}
      <motion.circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      />
    </svg>
  )
}

// ============================================================================
// CONTADOR ANIMADO
// ============================================================================
function AnimatedValue({ 
  value, 
  prefix = '', 
  suffix = '',
  duration = 1000, 
}: { 
  value: number | string
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0
  
  useEffect(() => {
    const startTime = Date.now()
    const startValue = displayValue
    
    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      
      const current = startValue + (numericValue - startValue) * easeOutQuart
      setDisplayValue(current)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericValue, duration])
  
  const formattedValue = useMemo(() => {
    if (typeof value === 'string' && isNaN(parseFloat(value))) {
      return value
    }
    
    if (numericValue >= 1000000) {
      return `${(displayValue / 1000000).toFixed(2)}M`
    }
    if (numericValue >= 1000) {
      return `${(displayValue / 1000).toFixed(1)}K`
    }
    return displayValue.toFixed(0)
  }, [displayValue, numericValue, value])
  
  return (
    <span className="font-mono font-bold tracking-tight">
      {prefix}{formattedValue}{suffix}
    </span>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export function QuickStatWidget({
  title,
  value,
  prefix = '',
  suffix = '',
  change,
  changeLabel,
  icon: Icon,
  color = 'blue',
  sparklineData,
  size = 'md',
  animated = true,
  onClick,
  className = '',
  delay = 0,
}: QuickStatWidgetProps) {
  const config = colorConfig[color]
  
  // Tamaños según prop
  const sizeConfig = {
    sm: { padding: 'p-3', title: 'text-xs', value: 'text-lg', icon: 'w-8 h-8' },
    md: { padding: 'p-4', title: 'text-xs', value: 'text-2xl', icon: 'w-10 h-10' },
    lg: { padding: 'p-5', title: 'text-sm', value: 'text-3xl', icon: 'w-12 h-12' },
  }
  
  const sizes = sizeConfig[size]
  
  // Determinar tendencia
  const trend = change !== undefined ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : undefined
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ 
        y: -4, 
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        relative group overflow-hidden
        ${sizes.padding} rounded-2xl
        bg-zinc-900/60 backdrop-blur-xl
        border border-white/5 hover:border-white/10
        transition-colors duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Efecto de glow en hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${config.glow} 0%, transparent 70%)`,
        }}
      />
      
      {/* Contenido */}
      <div className="relative z-10">
        {/* Header con icono y título */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {Icon && (
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`${sizes.icon} rounded-xl ${config.bg} flex items-center justify-center`}
              >
                <Icon className={`w-1/2 h-1/2 ${config.text}`} />
              </motion.div>
            )}
            <span className={`${sizes.title} text-white/50 uppercase tracking-wider font-medium`}>
              {title}
            </span>
          </div>
          
          {/* Indicador de cambio */}
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold
                ${trend === 'up' 
                  ? 'bg-emerald-500/15 text-emerald-400' 
                  : trend === 'down' 
                    ? 'bg-red-500/15 text-red-400' 
                    : 'bg-zinc-500/15 text-zinc-400'
                }
              `}
            >
              <TrendIcon className="w-3 h-3" />
              <span>{Math.abs(change || 0)}%</span>
            </motion.div>
          )}
        </div>
        
        {/* Valor principal */}
        <div className={`${sizes.value} text-white mb-2`}>
          {animated ? (
            <AnimatedValue value={value} prefix={prefix} suffix={suffix} />
          ) : (
            <span className="font-mono font-bold tracking-tight">
              {prefix}{value}{suffix}
            </span>
          )}
        </div>
        
        {/* Sparkline o label de cambio */}
        <div className="flex items-center justify-between">
          {sparklineData && sparklineData.length > 0 && (
            <Sparkline 
              data={sparklineData} 
              color={config.spark}
              width={size === 'sm' ? 60 : size === 'md' ? 80 : 100}
              height={size === 'sm' ? 20 : size === 'md' ? 30 : 40}
            />
          )}
          
          {changeLabel && (
            <span className="text-xs text-white/40">{changeLabel}</span>
          )}
        </div>
      </div>
      
      {/* Línea decorativa inferior */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${config.gradient}`}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
      />
    </motion.div>
  )
}

// ============================================================================
// GRID DE STATS
// ============================================================================
interface QuickStatsGridProps {
  stats: Array<Omit<QuickStatWidgetProps, 'delay'>>
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export function QuickStatsGrid({ stats, columns = 4, className = '' }: QuickStatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  }
  
  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <QuickStatWidget
          key={stat.title}
          {...stat}
          delay={index * 0.1}
        />
      ))}
    </div>
  )
}

export default QuickStatWidget
