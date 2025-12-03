'use client'

/**
 * CHRONOS 2026 - KPI Card Premium
 * Tarjeta de KPI con glassmorphism, animaciones y 3D tilt
 * 
 * Features:
 * - Glassmorphism sutil
 * - Tilt 3D al hover
 * - Animación de número morph
 * - Estados de tendencia con colores semánticos
 * - Fully accessible
 */

import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TiltCard, HoverScale } from './motion'
import { CHRONOS_COLORS, CHRONOS_ANIMATIONS } from '@/app/lib/constants/chronos-2026'

interface KPICardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const trendConfig = {
  up: {
    icon: TrendingUp,
    color: CHRONOS_COLORS.success,
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
  },
  down: {
    icon: TrendingDown,
    color: CHRONOS_COLORS.danger,
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
  },
  neutral: {
    icon: Minus,
    color: CHRONOS_COLORS.textSecondary,
    bgColor: 'bg-white/5',
    textColor: 'text-white/60',
  },
}

const sizeConfig = {
  sm: {
    padding: 'p-4',
    titleSize: 'text-sm',
    valueSize: 'text-2xl',
    iconSize: 'w-8 h-8',
    changeSize: 'text-xs',
    iconContainerSize: 'p-2',
  },
  md: {
    padding: 'p-6',
    titleSize: 'text-sm',
    valueSize: 'text-4xl',
    iconSize: 'w-10 h-10',
    changeSize: 'text-sm',
    iconContainerSize: 'p-3',
  },
  lg: {
    padding: 'p-8',
    titleSize: 'text-base',
    valueSize: 'text-6xl',
    iconSize: 'w-12 h-12',
    changeSize: 'text-base',
    iconContainerSize: 'p-4',
  },
}

function KPICard({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  onClick,
  className = '',
  size = 'md',
}: KPICardProps) {
  const prefersReducedMotion = useReducedMotion()
  const config = trendConfig[trend]
  const sizes = sizeConfig[size]
  const TrendIcon = config.icon
  
  const cardContent = (
    <motion.div
      whileHover={prefersReducedMotion ? {} : { y: -4 }}
      transition={{ 
        type: 'spring', 
        ...CHRONOS_ANIMATIONS.spring.snappy, 
      }}
      onClick={onClick}
      className={cn(
        // Base styles
        'group relative overflow-hidden rounded-2xl',
        // Glassmorphism
        'bg-white/[0.03] backdrop-blur-xl',
        'border border-white/[0.08] hover:border-white/[0.15]',
        // Sizing
        sizes.padding,
        // Interactive
        onClick && 'cursor-pointer',
        // Transitions
        'transition-all duration-300',
        className,
      )}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${title}: ${value}${change ? `, ${change}` : ''}`}
    >
      {/* Gradient overlay on hover */}
      <motion.div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${CHRONOS_COLORS.primary}10 0%, ${CHRONOS_COLORS.accent}10 100%)`,
        }}
      />
      
      {/* Glow effect */}
      <div 
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${config.color}20 0%, transparent 70%)`,
        }}
      />
      
      {/* Content */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className={cn(
            sizes.titleSize,
            'text-white/60 font-medium mb-2 truncate',
          )}>
            {title}
          </p>
          
          {/* Value */}
          <motion.p 
            className={cn(
              sizes.valueSize,
              'font-bold text-white tracking-tight',
            )}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {value}
          </motion.p>
          
          {/* Change indicator */}
          {change && (
            <motion.div 
              className={cn(
                'flex items-center gap-1.5 mt-3',
                sizes.changeSize,
                config.textColor,
              )}
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className={cn(
                'flex items-center justify-center rounded-full',
                config.bgColor,
                'p-1',
              )}>
                <TrendIcon className="w-3 h-3" />
              </span>
              <span className="font-medium">{change}</span>
            </motion.div>
          )}
        </div>
        
        {/* Icon */}
        {icon && (
          <motion.div 
            className={cn(
              'rounded-xl bg-white/[0.05] border border-white/[0.08]',
              'group-hover:bg-white/[0.08] group-hover:border-white/[0.12]',
              'transition-all duration-300',
              sizes.iconContainerSize,
            )}
            whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <div className={cn(sizes.iconSize, 'text-white/80')}>
              {icon}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        }}
      />
    </motion.div>
  )
  
  // Envolver con TiltCard si no hay reduced motion
  if (prefersReducedMotion) {
    return (
      <HoverScale scale={1.01}>
        {cardContent}
      </HoverScale>
    )
  }
  
  return (
    <TiltCard maxTilt={8}>
      <HoverScale scale={1.02}>
        {cardContent}
      </HoverScale>
    </TiltCard>
  )
}

export default memo(KPICard)
