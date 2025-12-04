'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🌌 CHRONOS INFINITY - COMPONENTES ULTRA PREMIUM
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Componentes React con:
 * - Efectos 3D con CSS transforms y perspective
 * - Sombras volumétricas multicapa
 * - Animaciones con física de spring (Framer Motion)
 * - Glassmorphism de 3ª generación
 * - Holographic shimmer effects
 * - Micro-interacciones hápticas
 * 
 * @version 2.0.0
 */

import React, { forwardRef, useState, useRef, useEffect, memo, useMemo } from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { INFINITY, INFINITY_COLORS, INFINITY_GRADIENTS, INFINITY_SHADOWS, INFINITY_ANIMATIONS } from '@/app/lib/design/infinity-tokens'

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🎴 INFINITY CARD 3D - Card con profundidad y hover 3D real
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface InfinityCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gold' | 'violet' | 'emerald' | 'plasma' | 'sapphire'
  glow?: boolean
  float?: boolean
  tilt?: boolean
  children: React.ReactNode
}

export const InfinityCard = memo(forwardRef<HTMLDivElement, InfinityCardProps>(
  ({ variant = 'default', glow = false, float = false, tilt = true, className, children, ...props }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null)
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    
    const rotateX = useSpring(useTransform(y, [-100, 100], [8, -8]), { stiffness: 300, damping: 30 })
    const rotateY = useSpring(useTransform(x, [-100, 100], [-8, 8]), { stiffness: 300, damping: 30 })
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tilt || !cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      x.set(e.clientX - centerX)
      y.set(e.clientY - centerY)
    }
    
    const handleMouseLeave = () => {
      x.set(0)
      y.set(0)
    }
    
    const variantClasses = {
      default: 'infinity-card',
      gold: 'infinity-card-gold',
      violet: 'infinity-card-violet',
      emerald: 'infinity-card-emerald',
      plasma: 'infinity-card-plasma',
      sapphire: 'infinity-card-sapphire',
    }
    
    const glowClasses = {
      gold: 'infinity-hover-glow-gold',
      violet: 'infinity-hover-glow-violet',
      emerald: 'infinity-hover-glow-emerald',
      plasma: 'infinity-hover-glow-plasma',
      sapphire: 'infinity-hover-glow-sapphire',
    }
    
    return (
      <motion.div
        ref={cardRef}
        style={{
          transformStyle: 'preserve-3d',
          rotateX: tilt ? rotateX : 0,
          rotateY: tilt ? rotateY : 0,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          variantClasses[variant],
          glow && variant !== 'default' && glowClasses[variant as keyof typeof glowClasses],
          float && 'infinity-animate-float-3d',
          'infinity-gpu',
          className
        )}
      >
        {/* Shimmer effect layer */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-inherit">
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    )
  }
))

InfinityCard.displayName = 'InfinityCard'

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🏆 INFINITY HERO CARD - Card héroe con efectos cinematográficos
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface InfinityHeroCardProps {
  title?: string
  subtitle?: string
  value: string | number
  trend?: { value: number; isPositive: boolean }
  icon?: LucideIcon
  className?: string
  children?: React.ReactNode
}

export const InfinityHeroCard = memo(function InfinityHeroCard({
  title,
  subtitle,
  value,
  trend,
  icon: Icon,
  className,
  children,
}: InfinityHeroCardProps) {
  const formattedValue = typeof value === 'number' 
    ? `$${value.toLocaleString()}`
    : value
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={INFINITY_ANIMATIONS.springConfig}
      className={cn('infinity-hero group', className)}
    >
      {/* Ambient orbs */}
      <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-gradient-to-r from-amber-500/20 to-transparent blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
      <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-gradient-to-l from-violet-500/20 to-transparent blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-1000" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {subtitle && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-2">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="text-xl font-bold text-white/80">{title}</h2>
            )}
          </div>
          
          {Icon && (
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20"
            >
              <Icon className="w-8 h-8 text-amber-400" />
            </motion.div>
          )}
        </div>
        
        {/* Value */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ ...INFINITY_ANIMATIONS.bounceConfig, delay: 0.2 }}
        >
          <span className="infinity-hero-value">{formattedValue}</span>
        </motion.div>
        
        {/* Trend */}
        {trend && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 inline-flex items-center gap-2"
          >
            <span className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold',
              trend.isPositive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-ruby-500/15 text-ruby-400 border border-ruby-500/30'
            )}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-white/40 text-sm">vs mes anterior</span>
          </motion.div>
        )}
        
        {/* Optional chart/content */}
        {children && (
          <div className="mt-8">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// 📊 INFINITY KPI CARD - Card de KPI con animaciones premium
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface InfinityKPICardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: LucideIcon
  color?: 'gold' | 'violet' | 'emerald' | 'plasma' | 'sapphire' | 'ruby' | 'amber'
  delay?: number
  className?: string
}

export const InfinityKPICard = memo(function InfinityKPICard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color = 'gold',
  delay = 0,
  className,
}: InfinityKPICardProps) {
  const colorConfig = {
    gold: {
      gradient: 'from-amber-500/15 to-amber-600/5',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      glow: INFINITY_SHADOWS.glowGold,
    },
    violet: {
      gradient: 'from-violet-500/15 to-violet-600/5',
      border: 'border-violet-500/20 hover:border-violet-500/40',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400',
      glow: INFINITY_SHADOWS.glowViolet,
    },
    emerald: {
      gradient: 'from-emerald-500/15 to-emerald-600/5',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      glow: INFINITY_SHADOWS.glowEmerald,
    },
    plasma: {
      gradient: 'from-pink-500/15 to-pink-600/5',
      border: 'border-pink-500/20 hover:border-pink-500/40',
      iconBg: 'bg-pink-500/20',
      iconColor: 'text-pink-400',
      glow: INFINITY_SHADOWS.glowPlasma,
    },
    sapphire: {
      gradient: 'from-blue-500/15 to-blue-600/5',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      glow: INFINITY_SHADOWS.glowSapphire,
    },
    ruby: {
      gradient: 'from-red-500/15 to-red-600/5',
      border: 'border-red-500/20 hover:border-red-500/40',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      glow: INFINITY_SHADOWS.glowRuby,
    },
    amber: {
      gradient: 'from-orange-500/15 to-orange-600/5',
      border: 'border-orange-500/20 hover:border-orange-500/40',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      glow: INFINITY_SHADOWS.glowGold,
    },
  }
  
  const config = colorConfig[color]
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString()
    : value
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95, rotateX: -5 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{ ...INFINITY_ANIMATIONS.springConfig, delay }}
      whileHover={{ 
        y: -12, 
        scale: 1.03, 
        rotateX: 4,
        transition: { duration: 0.3 }
      }}
      className={cn(
        'infinity-kpi group cursor-pointer',
        `bg-gradient-to-br ${config.gradient}`,
        `border ${config.border}`,
        className
      )}
      style={{ 
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Mesh background on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: INFINITY_GRADIENTS.meshAurora }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="infinity-kpi-label">{title}</span>
          {Icon && (
            <div className={cn('p-2.5 rounded-xl', config.iconBg)}>
              <Icon className={cn('w-5 h-5', config.iconColor)} />
            </div>
          )}
        </div>
        
        {/* Value with animated counter effect */}
        <motion.p 
          className="infinity-kpi-value mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >
          {formattedValue}
        </motion.p>
        
        {/* Trend indicator */}
        {change && (
          <div className={cn(
            'infinity-kpi-trend',
            trend === 'up' && 'positive',
            trend === 'down' && 'negative',
            trend === 'neutral' && 'bg-white/5 text-white/60'
          )}>
            {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            <span>{change}</span>
          </div>
        )}
      </div>
      
      {/* Sparkle effect */}
      <motion.div
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100"
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className={cn('w-4 h-4', config.iconColor)} />
      </motion.div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🔘 INFINITY BUTTON - Botón ultra premium con efectos
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface InfinityButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'glass' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  glow?: boolean
  pulse?: boolean
  loading?: boolean
  children: React.ReactNode
}

export const InfinityButton = memo(forwardRef<HTMLButtonElement, InfinityButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    icon: Icon, 
    iconPosition = 'left',
    glow = false,
    pulse = false,
    loading = false,
    className, 
    children, 
    disabled,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
      xl: 'px-8 py-4 text-lg gap-3',
    }
    
    const variantClasses = {
      primary: 'infinity-btn-primary',
      secondary: 'infinity-btn-secondary',
      success: 'infinity-btn-success',
      danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30',
      glass: 'infinity-btn-glass',
      ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
    }
    
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={cn(
          'infinity-btn',
          variantClasses[variant],
          sizeClasses[size],
          pulse && 'animate-pulse',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        style={{
          boxShadow: glow && variant === 'primary' ? INFINITY_SHADOWS.glowGold : undefined,
        }}
        onClick={props.onClick}
      >
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
            <span>{children}</span>
            {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
          </>
        )}
      </motion.button>
    )
  }
))

InfinityButton.displayName = 'InfinityButton'

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🏷️ INFINITY BADGE - Badge premium con efectos
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface InfinityBadgeProps {
  variant?: 'gold' | 'violet' | 'emerald' | 'plasma' | 'ruby' | 'amber' | 'sapphire'
  children: React.ReactNode
  icon?: LucideIcon
  pulse?: boolean
  className?: string
}

export const InfinityBadge = memo(function InfinityBadge({
  variant = 'gold',
  children,
  icon: Icon,
  pulse = false,
  className,
}: InfinityBadgeProps) {
  return (
    <span className={cn(
      'infinity-badge',
      variant,
      pulse && 'animate-pulse',
      className
    )}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🌌 INFINITY AMBIENT BACKGROUND - Fondo con orbes animados
// ═══════════════════════════════════════════════════════════════════════════════════════

export const InfinityAmbientBackground = memo(function InfinityAmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -100 }}>
      <div className="infinity-ambient gold" />
      <div className="infinity-ambient violet" />
      <div className="infinity-ambient plasma" />
      <div className="infinity-ambient emerald" />
      <div className="infinity-liquid" style={{ top: '30%', left: '40%' }} />
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// 📊 INFINITY STAT INLINE - Estadística inline con tendencia
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface InfinityStatInlineProps {
  label: string
  value: string | number
  change?: number
  color?: 'gold' | 'violet' | 'emerald' | 'plasma'
}

export const InfinityStatInline = memo(function InfinityStatInline({
  label,
  value,
  change,
  color = 'gold',
}: InfinityStatInlineProps) {
  const colorMap = {
    gold: 'text-amber-400',
    violet: 'text-violet-400',
    emerald: 'text-emerald-400',
    plasma: 'text-pink-400',
  }
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-white/60 text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <span className={cn('font-bold font-mono text-lg', colorMap[color])}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {change !== undefined && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            change >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
          )}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🔄 INFINITY FLOATING ORB - Orbe flotante FAB
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface InfinityFloatingOrbProps {
  icon: LucideIcon
  onClick?: () => void
  color?: 'gold' | 'violet' | 'emerald' | 'plasma'
  className?: string
}

export const InfinityFloatingOrb = memo(function InfinityFloatingOrb({
  icon: Icon,
  onClick,
  color = 'gold',
  className,
}: InfinityFloatingOrbProps) {
  const gradientMap = {
    gold: INFINITY_GRADIENTS.gold,
    violet: INFINITY_GRADIENTS.violet,
    emerald: INFINITY_GRADIENTS.emerald,
    plasma: INFINITY_GRADIENTS.plasma,
  }
  
  const glowMap = {
    gold: INFINITY_SHADOWS.glowGold,
    violet: INFINITY_SHADOWS.glowViolet,
    emerald: INFINITY_SHADOWS.glowEmerald,
    plasma: INFINITY_SHADOWS.glowPlasma,
  }
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'infinity-orb',
        className
      )}
      style={{
        background: gradientMap[color],
        boxShadow: `${INFINITY_SHADOWS.lg}, ${glowMap[color]}`,
      }}
    >
      <Icon className="w-7 h-7 text-black" />
    </motion.button>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// 📋 INFINITY GLASS PANEL - Panel de vidrio premium
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface InfinityGlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: 'light' | 'medium' | 'strong'
  children: React.ReactNode
}

export const InfinityGlassPanel = memo(forwardRef<HTMLDivElement, InfinityGlassPanelProps>(
  ({ intensity = 'medium', className, children, ...props }, ref) => {
    const blurMap = {
      light: '20px',
      medium: '40px',
      strong: '80px',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl overflow-hidden',
          className
        )}
        style={{
          background: INFINITY_COLORS.glass.bg,
          backdropFilter: `blur(${blurMap[intensity]}) saturate(180%)`,
          WebkitBackdropFilter: `blur(${blurMap[intensity]}) saturate(180%)`,
          border: `1px solid ${INFINITY_COLORS.glass.border}`,
          boxShadow: INFINITY_SHADOWS.md,
        }}
        {...props}
      >
        {/* Top light edge */}
        <div 
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
          }}
        />
        {children}
      </div>
    )
  }
))

InfinityGlassPanel.displayName = 'InfinityGlassPanel'

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🎯 INFINITY GRADIENT TEXT - Texto con gradiente holográfico
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface InfinityGradientTextProps {
  variant?: 'holographic' | 'gold' | 'violet' | 'emerald' | 'plasma'
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p'
  children: React.ReactNode
  className?: string
}

export const InfinityGradientText = memo(function InfinityGradientText({
  variant = 'holographic',
  as: Component = 'span',
  children,
  className,
}: InfinityGradientTextProps) {
  const variantClasses = {
    holographic: 'infinity-text-holographic',
    gold: 'infinity-text-gold',
    violet: 'infinity-text-violet',
    emerald: 'infinity-text-emerald',
    plasma: 'infinity-text-plasma',
  }
  
  return (
    <Component className={cn(variantClasses[variant], className)}>
      {children}
    </Component>
  )
})

// All components are already exported inline with their declarations
