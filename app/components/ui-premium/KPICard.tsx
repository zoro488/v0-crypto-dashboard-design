'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { memo, useEffect, useState, ReactNode } from 'react'
import { cn } from '@/app/lib/utils'
import { LuminousIcon } from './LuminousIcon'
import { ObsidianCard } from './ObsidianCard'
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'

/**
 * 💎 KPICard
 * 
 * Tarjeta de métrica clave ultra-premium con:
 * - Animación count-up para números
 * - Icono luminoso con glow volumétrico
 * - Sparkline de tendencia brillante
 * - Indicador de cambio (trend)
 * - Reflejo especular animado en hover
 */

type KPIVariant = 'sapphire' | 'emerald' | 'amethyst' | 'amber' | 'ruby' | 'cyan'
type TrendDirection = 'up' | 'down' | 'neutral'

interface KPICardProps {
  /** Etiqueta del KPI */
  label: string
  /** Valor numérico */
  value: number
  /** Formato del valor (currency, number, percent) */
  format?: 'currency' | 'number' | 'percent' | 'compact'
  /** Prefijo (ej: $) */
  prefix?: string
  /** Sufijo (ej: k, %, unidades) */
  suffix?: string
  /** Icono del KPI */
  icon: LucideIcon
  /** Variante de color */
  variant?: KPIVariant
  /** Porcentaje de cambio */
  trend?: number
  /** Datos para sparkline (array de valores) */
  sparklineData?: number[]
  /** Descripción adicional */
  description?: string
  /** Click handler */
  onClick?: () => void
  /** Deshabilitar animación de count-up */
  disableCountUp?: boolean
  /** Clase adicional */
  className?: string
  /** Tamaño de la tarjeta */
  size?: 'sm' | 'md' | 'lg'
}

// Animación de count-up
const useCountUp = (end: number, duration: number = 1500, disabled: boolean = false) => {
  const [hasAnimated, setHasAnimated] = useState(false)
  
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration,
  })

  useEffect(() => {
    if (!disabled && !hasAnimated) {
      spring.set(end)
      setHasAnimated(true)
    } else if (disabled) {
      spring.set(end)
    }
  }, [end, spring, disabled, hasAnimated])

  return useTransform(spring, (value) => value)
}

// Formateador de números
const formatValue = (
  value: number,
  format: KPICardProps['format'],
  prefix?: string,
  suffix?: string,
): string => {
  let formatted: string

  switch (format) {
    case 'currency':
      formatted = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
      break
    case 'percent':
      formatted = `${value.toFixed(1)}%`
      break
    case 'compact':
      if (value >= 1000000) {
        formatted = `${(value / 1000000).toFixed(1)}M`
      } else if (value >= 1000) {
        formatted = `${(value / 1000).toFixed(0)}k`
      } else {
        formatted = value.toFixed(0)
      }
      break
    default:
      formatted = value.toLocaleString('es-MX')
  }

  return `${prefix || ''}${formatted}${suffix || ''}`
}

// Componente de Sparkline SVG
const Sparkline = memo(({ 
  data, 
  variant = 'sapphire',
  trend = 'neutral',
}: { 
  data: number[]
  variant?: KPIVariant
  trend?: TrendDirection
}) => {
  const width = 120
  const height = 40
  const padding = 4

  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((value - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const pathD = `M ${points.join(' L ')}`
  
  // Color basado en trend
  const colors: Record<TrendDirection, string> = {
    up: '#047857',    // Esmeralda
    down: '#be123c',  // Rubí
    neutral: '#2563eb', // Zafiro
  }

  const strokeColor = colors[trend]

  return (
    <svg 
      width={width} 
      height={height} 
      className="opacity-80"
      style={{ filter: `drop-shadow(0 0 8px ${strokeColor}40)` }}
    >
      <defs>
        <linearGradient id={`sparkline-gradient-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Área bajo la línea */}
      <path
        d={`${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
        fill={`url(#sparkline-gradient-${variant})`}
      />
      
      {/* Línea principal */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Punto final */}
      <motion.circle
        cx={width - padding}
        cy={height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2)}
        r="3"
        fill={strokeColor}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.3 }}
      />
    </svg>
  )
})

Sparkline.displayName = 'Sparkline'

// Badge de tendencia
const TrendBadge = memo(({ trend }: { trend: number }) => {
  const direction: TrendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral'
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus

  const styles = {
    up: {
      bg: 'bg-[rgba(4,120,87,0.15)]',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      glow: '0 0 15px -3px rgba(4, 120, 87, 0.5)',
    },
    down: {
      bg: 'bg-[rgba(190,18,60,0.15)]',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      glow: '0 0 15px -3px rgba(190, 18, 60, 0.5)',
    },
    neutral: {
      bg: 'bg-white/5',
      text: 'text-white/50',
      border: 'border-white/10',
      glow: 'none',
    },
  }

  const style = styles[direction]

  return (
    <motion.div
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border',
        style.bg,
        style.text,
        style.border,
      )}
      style={{ boxShadow: style.glow }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.3 }}
    >
      <Icon className="w-3 h-3" />
      <span>{Math.abs(trend).toFixed(1)}%</span>
    </motion.div>
  )
})

TrendBadge.displayName = 'TrendBadge'

// Componente AnimatedValue con count-up
const AnimatedValue = memo(({ 
  value, 
  format, 
  prefix, 
  suffix,
  disabled,
}: { 
  value: number
  format: KPICardProps['format']
  prefix?: string
  suffix?: string
  disabled: boolean
}) => {
  const animatedValue = useCountUp(value, 1500, disabled)

  return (
    <motion.span className="font-mono">
      {useTransform(animatedValue, (v) => formatValue(Math.round(v), format, prefix, suffix))}
    </motion.span>
  )
})

AnimatedValue.displayName = 'AnimatedValue'

// Tamaños
const sizeStyles = {
  sm: {
    padding: 'p-4',
    value: 'text-2xl',
    label: 'text-xs',
    iconSize: 'sm' as const,
  },
  md: {
    padding: 'p-6',
    value: 'text-3xl md:text-4xl',
    label: 'text-sm',
    iconSize: 'md' as const,
  },
  lg: {
    padding: 'p-8',
    value: 'text-4xl md:text-5xl',
    label: 'text-base',
    iconSize: 'lg' as const,
  },
}

export const KPICard = memo(({
  label,
  value,
  format = 'number',
  prefix,
  suffix,
  icon,
  variant = 'sapphire',
  trend,
  sparklineData,
  description,
  onClick,
  disableCountUp = false,
  className,
  size = 'md',
}: KPICardProps) => {
  const trendDirection: TrendDirection = trend ? (trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral') : 'neutral'
  const styles = sizeStyles[size]

  return (
    <ObsidianCard
      glowVariant={variant}
      padding="none"
      onClick={onClick}
      className={cn('group', className)}
      interactive={!!onClick}
    >
      <div className={cn('flex flex-col h-full', styles.padding)}>
        {/* Header: Icon + Label + Trend */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <LuminousIcon
              icon={icon}
              variant={variant}
              size={styles.iconSize}
              pulse
            />
            <div>
              <p className={cn('font-medium text-white/80', styles.label)}>{label}</p>
              {description && (
                <p className="text-[10px] text-white/40 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {typeof trend === 'number' && <TrendBadge trend={trend} />}
        </div>

        {/* Value */}
        <div className="flex-1 flex items-end justify-between">
          <motion.div
            className={cn(
              'font-bold tracking-tight',
              styles.value,
              // Gradient text con glow
              'bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent',
            )}
            style={{
              textShadow: '0 0 40px rgba(255, 255, 255, 0.15)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {disableCountUp ? (
              formatValue(value, format, prefix, suffix)
            ) : (
              <AnimatedValue
                value={value}
                format={format}
                prefix={prefix}
                suffix={suffix}
                disabled={disableCountUp}
              />
            )}
          </motion.div>

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 1 && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Sparkline 
                data={sparklineData} 
                variant={variant}
                trend={trendDirection}
              />
            </div>
          )}
        </div>
      </div>
    </ObsidianCard>
  )
})

KPICard.displayName = 'KPICard'

/**
 * 📊 KPIGrid
 * Grid responsivo para múltiples KPIs
 */
interface KPIGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export const KPIGrid = ({ children, columns = 4, className }: KPIGridProps) => {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  }

  return (
    <div className={cn('grid gap-4 md:gap-6', gridCols[columns], className)}>
      {children}
    </div>
  )
}

export default KPICard
