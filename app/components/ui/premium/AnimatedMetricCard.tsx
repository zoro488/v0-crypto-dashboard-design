'use client'

/**
 * 📊 ANIMATED METRIC CARD - Tarjeta de métrica con animaciones avanzadas
 * 
 * Características:
 * - Contador animado con easing
 * - Sparkline integrado
 * - Indicador de tendencia con animación
 * - Icono con efecto de pulso
 * - Gradientes dinámicos
 */

import React, { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/app/lib/utils'
import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

interface AnimatedMetricCardProps {
  title: string
  value: number
  previousValue?: number
  prefix?: string
  suffix?: string
  icon: LucideIcon
  color: string // Tailwind gradient class: 'from-blue-500 to-cyan-500'
  sparklineData?: number[]
  trend?: 'up' | 'down' | 'neutral'
  changePercent?: number
  delay?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

// Hook para animar números
function useAnimatedNumber(value: number, _duration: number = 1000) {
  const spring = useSpring(0, { 
    stiffness: 100, 
    damping: 30,
    mass: 1,
  })
  
  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  const display = useTransform(spring, (latest) => Math.round(latest))
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    return display.on('change', (v) => setDisplayValue(v))
  }, [display])

  return displayValue
}

// Componente de sparkline
function MiniSparkline({ 
  data, 
  color, 
  trend,
}: { 
  data: number[]
  color: string
  trend: 'up' | 'down' | 'neutral'
}) {
  const chartData = useMemo(() => 
    data.map((value, index) => ({ value, index })),
  [data])

  const strokeColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sparkGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#sparkGradient-${color})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Indicador de tendencia
function TrendIndicator({ 
  trend, 
  changePercent,
}: { 
  trend: 'up' | 'down' | 'neutral'
  changePercent?: number
}) {
  const config = {
    up: {
      icon: ArrowUpRight,
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      sign: '+',
    },
    down: {
      icon: ArrowDownRight,
      bg: 'bg-red-500/15',
      text: 'text-red-400',
      sign: '',
    },
    neutral: {
      icon: Minus,
      bg: 'bg-zinc-500/15',
      text: 'text-zinc-400',
      sign: '',
    },
  }

  const { icon: Icon, bg, text, sign } = config[trend]

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold',
        bg,
        text,
      )}
    >
      <motion.div
        animate={trend !== 'neutral' ? { 
          y: trend === 'up' ? [-1, 1, -1] : [1, -1, 1],
        } : undefined}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Icon className="w-3 h-3" />
      </motion.div>
      {changePercent !== undefined && (
        <span>{sign}{changePercent.toFixed(1)}%</span>
      )}
    </motion.div>
  )
}

export function AnimatedMetricCard({
  title,
  value,
  previousValue,
  prefix = '',
  suffix = '',
  icon: Icon,
  color,
  sparklineData,
  trend: propTrend,
  changePercent: propChangePercent,
  delay = 0,
  size = 'md',
  className,
  onClick,
}: AnimatedMetricCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Calcular tendencia si no se proporciona
  const trend = useMemo(() => {
    if (propTrend) return propTrend
    if (previousValue === undefined) return 'neutral'
    if (value > previousValue) return 'up'
    if (value < previousValue) return 'down'
    return 'neutral'
  }, [propTrend, value, previousValue])

  // Calcular porcentaje de cambio
  const changePercent = useMemo(() => {
    if (propChangePercent !== undefined) return propChangePercent
    if (previousValue === undefined || previousValue === 0) return 0
    return ((value - previousValue) / previousValue) * 100
  }, [propChangePercent, value, previousValue])

  // Valor animado
  const animatedValue = useAnimatedNumber(value)

  // Formatear valor
  const formattedValue = useMemo(() => {
    if (value >= 1000000) {
      return `${(animatedValue / 1000000).toFixed(2)}M`
    }
    if (value >= 1000) {
      return `${(animatedValue / 1000).toFixed(1)}K`
    }
    return animatedValue.toLocaleString()
  }, [value, animatedValue])

  const sizeConfig = {
    sm: {
      padding: 'p-3 md:p-4',
      titleSize: 'text-xs',
      valueSize: 'text-lg md:text-xl',
      iconSize: 'w-4 h-4',
      iconPadding: 'p-2',
    },
    md: {
      padding: 'p-4 md:p-6',
      titleSize: 'text-xs md:text-sm',
      valueSize: 'text-xl md:text-2xl lg:text-3xl',
      iconSize: 'w-4 h-4 md:w-5 md:h-5',
      iconPadding: 'p-2.5 md:p-3',
    },
    lg: {
      padding: 'p-6 md:p-8',
      titleSize: 'text-sm md:text-base',
      valueSize: 'text-2xl md:text-3xl lg:text-4xl',
      iconSize: 'w-5 h-5 md:w-6 md:h-6',
      iconPadding: 'p-3 md:p-4',
    },
  }

  const config = sizeConfig[size]

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
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        'relative group cursor-pointer',
        'bg-white/[0.05] backdrop-blur-xl',
        'border border-white/[0.08]',
        'rounded-2xl md:rounded-3xl',
        config.padding,
        'overflow-hidden',
        'transition-shadow duration-300',
        'hover:shadow-2xl hover:shadow-black/20',
        className,
      )}
    >
      {/* Background Glow */}
      <motion.div
        className={cn(
          'absolute -top-16 -right-16 w-40 h-40',
          'rounded-full blur-3xl',
          `bg-gradient-to-br ${color}`,
          'opacity-20 group-hover:opacity-40 transition-opacity duration-500',
        )}
        animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <motion.div
            className={cn(
              'rounded-xl md:rounded-2xl',
              `bg-gradient-to-br ${color}`,
              'shadow-lg',
              config.iconPadding,
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Icon className={cn(config.iconSize, 'text-white')} />
          </motion.div>
          
          <TrendIndicator trend={trend} changePercent={changePercent} />
        </div>

        {/* Title */}
        <p className={cn(
          config.titleSize,
          'text-white/50 font-medium mb-1',
        )}>
          {title}
        </p>

        {/* Value */}
        <motion.h3 
          className={cn(
            config.valueSize,
            'font-bold text-white tracking-tight',
          )}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={formattedValue}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {prefix}{formattedValue}{suffix}
            </motion.span>
          </AnimatePresence>
        </motion.h3>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <motion.div 
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3 }}
          >
            <MiniSparkline 
              data={sparklineData} 
              color={color} 
              trend={trend}
            />
          </motion.div>
        )}
      </div>

      {/* Hover Shine Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent"
        initial={{ x: '-100%' }}
        animate={isHovered ? { x: '100%' } : { x: '-100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}

export default AnimatedMetricCard
