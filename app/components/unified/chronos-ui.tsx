'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎨 CHRONOS UNIFIED UI SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sistema de diseño unificado que combina lo mejor de:
 * - chronos-2026 (KPICard, GlassCard, BentoGrid)
 * - chronos-2026-ultra (UltraButton, UltraInput, Dashboard)
 * - ui-premium (ObsidianCard, HeroInput, QuantumTable)
 * - premium/banks (BankVaultPanel)
 * - premium/sales (SalesCockpit, ObsidianDistributionSlider)
 * 
 * DISEÑO: 
 * - Fondo negro puro (#000000)
 * - Glassmorphism con blur 60px+
 * - Gradientes cyan/magenta/violet
 * - Animaciones spring physics 60fps
 * - Tipografía Inter Variable
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo, forwardRef, ReactNode, InputHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { motion, useReducedMotion, HTMLMotionProps } from 'framer-motion'
import { 
  Loader2, TrendingUp, TrendingDown, Minus,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 DESIGN TOKENS - Sistema de Colores Unificado
// ═══════════════════════════════════════════════════════════════════════════

export const CHRONOS = {
  colors: {
    // Base
    void: '#000000',
    voidSoft: '#0A0A0A',
    voidMuted: '#111111',
    
    // Primary Palette
    cyan: '#00D9FF',
    cyanMuted: 'rgba(0, 217, 255, 0.15)',
    magenta: '#FF00E5',
    magentaMuted: 'rgba(255, 0, 229, 0.15)',
    violet: '#8B5CF6',
    violetMuted: 'rgba(139, 92, 246, 0.15)',
    
    // Semantic
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Text
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    
    // Glass
    glassBg: 'rgba(255, 255, 255, 0.03)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassHover: 'rgba(255, 255, 255, 0.06)',
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #00D9FF 0%, #00F5D4 50%, #00D9FF 100%)',
    secondary: 'linear-gradient(135deg, #FF00E5 0%, #8B5CF6 100%)',
    mesh: 'radial-gradient(ellipse at 20% 30%, rgba(0, 217, 255, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(255, 0, 229, 0.06) 0%, transparent 50%)',
    hero: 'linear-gradient(180deg, rgba(0, 217, 255, 0.1) 0%, transparent 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    danger: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  },
  
  shadows: {
    glow: '0 0 60px -10px rgba(0, 217, 255, 0.4)',
    glowMagenta: '0 0 60px -10px rgba(255, 0, 229, 0.3)',
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 4px 20px rgba(0, 217, 255, 0.25)',
  },
  
  animation: {
    spring: { type: 'spring', stiffness: 400, damping: 30 },
    smooth: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
    bounce: { type: 'spring', stiffness: 500, damping: 20 },
  },
  
  blur: {
    sm: 'blur(8px)',
    md: 'blur(16px)',
    lg: 'blur(32px)',
    xl: 'blur(60px)',
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════
// 🌌 AMBIENT BACKGROUND - Fondo con orbes animados
// ═══════════════════════════════════════════════════════════════════════════

export const AmbientBackground = memo(() => {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -10 }}>
      {/* Base gradient */}
      <div 
        className="absolute inset-0"
        style={{ background: CHRONOS.gradients.mesh }}
      />
      
      {!prefersReducedMotion && (
        <>
          {/* Cyan Orb */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{
              background: CHRONOS.colors.cyan,
              filter: 'blur(150px)',
              opacity: 0.1,
              top: '-10%',
              left: '-5%',
            }}
            animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Magenta Orb */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{
              background: CHRONOS.colors.magenta,
              filter: 'blur(150px)',
              opacity: 0.08,
              bottom: '-10%',
              right: '-5%',
            }}
            animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          />
        </>
      )}
    </div>
  )
})
AmbientBackground.displayName = 'AmbientBackground'

// ═══════════════════════════════════════════════════════════════════════════
// 🔘 BUTTON - Botón Ultra Premium
// ═══════════════════════════════════════════════════════════════════════════

interface ChronosButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  glow?: boolean
  children?: ReactNode
}

export const ChronosButton = memo(forwardRef<HTMLButtonElement, ChronosButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  glow = false,
  children,
  className,
  disabled,
  ...props
}, ref) => {
  const prefersReducedMotion = useReducedMotion()
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
    lg: 'px-7 py-3.5 text-base gap-2.5 rounded-2xl',
  }
  
  const variants = {
    primary: {
      background: CHRONOS.gradients.primary,
      color: CHRONOS.colors.void,
      boxShadow: glow ? CHRONOS.shadows.button : undefined,
    },
    secondary: {
      background: CHRONOS.colors.glassBg,
      color: CHRONOS.colors.textPrimary,
      border: `1px solid ${CHRONOS.colors.glassBorder}`,
      backdropFilter: CHRONOS.blur.lg,
    },
    ghost: {
      background: 'transparent',
      color: CHRONOS.colors.textSecondary,
    },
    danger: {
      background: CHRONOS.gradients.danger,
      color: '#FFFFFF',
      boxShadow: glow ? '0 0 30px rgba(239, 68, 68, 0.3)' : undefined,
    },
    success: {
      background: CHRONOS.gradients.success,
      color: '#FFFFFF',
      boxShadow: glow ? '0 0 30px rgba(16, 185, 129, 0.3)' : undefined,
    },
  }
  
  return (
    <motion.button
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center font-semibold',
        'transition-all duration-200 outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        className,
      )}
      style={variants[variant] as React.CSSProperties}
      whileHover={prefersReducedMotion || disabled ? {} : { y: -2, scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Shimmer effect for primary */}
      {variant === 'primary' && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        >
          <div 
            className="w-full h-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
          />
        </motion.div>
      )}
      
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      <span className="relative">{children}</span>
      {!isLoading && rightIcon}
    </motion.button>
  )
}))
ChronosButton.displayName = 'ChronosButton'

// ═══════════════════════════════════════════════════════════════════════════
// 📝 INPUT - Input Ultra Premium
// ═══════════════════════════════════════════════════════════════════════════

interface ChronosInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  variant?: 'default' | 'hero'
}

export const ChronosInput = memo(forwardRef<HTMLInputElement, ChronosInputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  variant = 'default',
  className,
  ...props
}, ref) => {
  const isHero = variant === 'hero'
  
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-sm font-medium mb-2"
          style={{ color: CHRONOS.colors.textSecondary }}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl outline-none transition-all duration-200',
            'placeholder:text-white/30',
            isHero 
              ? 'py-6 px-6 text-4xl font-mono font-bold text-center tracking-wider'
              : 'py-3 px-4 text-sm',
            leftIcon && !isHero && 'pl-12',
            rightIcon && !isHero && 'pr-12',
            error && 'ring-2 ring-red-500/50',
            className,
          )}
          style={{
            background: CHRONOS.colors.glassBg,
            border: `1px solid ${error ? CHRONOS.colors.error : CHRONOS.colors.glassBorder}`,
            color: CHRONOS.colors.textPrimary,
            backdropFilter: CHRONOS.blur.lg,
          }}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm" style={{ color: CHRONOS.colors.error }}>
          {error}
        </p>
      )}
    </div>
  )
}))
ChronosInput.displayName = 'ChronosInput'

// ═══════════════════════════════════════════════════════════════════════════
// 🏷️ BADGE - Badge Premium
// ═══════════════════════════════════════════════════════════════════════════

interface ChronosBadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'premium'
  size?: 'sm' | 'md'
  children: ReactNode
  dot?: boolean
}

export const ChronosBadge = memo(({ 
  variant = 'default', 
  size = 'sm',
  children,
  dot = false,
}: ChronosBadgeProps) => {
  const colors = {
    default: { bg: CHRONOS.colors.glassBg, text: CHRONOS.colors.textSecondary, border: CHRONOS.colors.glassBorder },
    success: { bg: 'rgba(16, 185, 129, 0.15)', text: CHRONOS.colors.success, border: 'rgba(16, 185, 129, 0.3)' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', text: CHRONOS.colors.warning, border: 'rgba(245, 158, 11, 0.3)' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', text: CHRONOS.colors.error, border: 'rgba(239, 68, 68, 0.3)' },
    info: { bg: 'rgba(59, 130, 246, 0.15)', text: CHRONOS.colors.info, border: 'rgba(59, 130, 246, 0.3)' },
    premium: { bg: CHRONOS.colors.cyanMuted, text: CHRONOS.colors.cyan, border: 'rgba(0, 217, 255, 0.3)' },
  }
  
  const c = colors[variant]
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      )}
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {dot && (
        <span 
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: c.text }}
        />
      )}
      {children}
    </span>
  )
})
ChronosBadge.displayName = 'ChronosBadge'

// ═══════════════════════════════════════════════════════════════════════════
// 🃏 GLASS CARD - Tarjeta con Glassmorphism
// ═══════════════════════════════════════════════════════════════════════════

interface GlassCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'subtle' | 'strong' | 'gradient'
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const cardVariants = {
  default: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
  subtle: { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.05)' },
  strong: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' },
  gradient: { bg: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: 'rgba(255,255,255,0.1)' },
}

const cardPadding = {
  none: '',
  sm: 'p-3 md:p-4',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
}

export const GlassCard = memo(({
  children,
  className = '',
  variant = 'default',
  hover = true,
  onClick,
  padding = 'md',
}: GlassCardProps) => {
  const prefersReducedMotion = useReducedMotion()
  const v = cardVariants[variant]
  
  return (
    <motion.div
      whileHover={hover && !prefersReducedMotion ? { y: -2, scale: 1.01 } : {}}
      whileTap={onClick && !prefersReducedMotion ? { scale: 0.99 } : {}}
      transition={CHRONOS.animation.spring}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl backdrop-blur-xl',
        'transition-all duration-300',
        onClick && 'cursor-pointer',
        cardPadding[padding],
        className,
      )}
      style={{
        background: v.bg,
        border: `1px solid ${v.border}`,
      }}
    >
      {children}
    </motion.div>
  )
})
GlassCard.displayName = 'GlassCard'

// ═══════════════════════════════════════════════════════════════════════════
// 📊 KPI CARD - Tarjeta de KPI Premium
// ═══════════════════════════════════════════════════════════════════════════

interface KPICardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: LucideIcon
  color?: 'cyan' | 'magenta' | 'violet' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const trendConfig = {
  up: { Icon: TrendingUp, color: CHRONOS.colors.success },
  down: { Icon: TrendingDown, color: CHRONOS.colors.error },
  neutral: { Icon: Minus, color: CHRONOS.colors.textMuted },
}

const colorConfig = {
  cyan: { accent: CHRONOS.colors.cyan, bg: CHRONOS.colors.cyanMuted },
  magenta: { accent: CHRONOS.colors.magenta, bg: CHRONOS.colors.magentaMuted },
  violet: { accent: CHRONOS.colors.violet, bg: CHRONOS.colors.violetMuted },
  success: { accent: CHRONOS.colors.success, bg: 'rgba(16, 185, 129, 0.1)' },
  warning: { accent: CHRONOS.colors.warning, bg: 'rgba(245, 158, 11, 0.1)' },
  error: { accent: CHRONOS.colors.error, bg: 'rgba(239, 68, 68, 0.1)' },
}

const sizeConfig = {
  sm: { padding: 'p-4', title: 'text-xs', value: 'text-2xl', icon: 'w-8 h-8' },
  md: { padding: 'p-6', title: 'text-sm', value: 'text-4xl', icon: 'w-10 h-10' },
  lg: { padding: 'p-8', title: 'text-base', value: 'text-5xl', icon: 'w-12 h-12' },
}

export const KPICard = memo(({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color = 'cyan',
  size = 'md',
  onClick,
}: KPICardProps) => {
  const prefersReducedMotion = useReducedMotion()
  const t = trendConfig[trend]
  const c = colorConfig[color]
  const s = sizeConfig[size]
  
  return (
    <motion.div
      whileHover={!prefersReducedMotion ? { y: -4 } : {}}
      transition={CHRONOS.animation.spring}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl backdrop-blur-xl',
        'transition-all duration-300 cursor-pointer group',
        s.padding,
      )}
      style={{
        background: CHRONOS.colors.glassBg,
        border: `1px solid ${CHRONOS.colors.glassBorder}`,
      }}
    >
      {/* Glow effect on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ 
          background: `radial-gradient(circle at 50% 50%, ${c.bg}, transparent 70%)`, 
        }}
      />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className={cn('font-medium', s.title)} style={{ color: CHRONOS.colors.textSecondary }}>
            {title}
          </span>
          {Icon && (
            <div 
              className={cn('rounded-xl flex items-center justify-center', s.icon)}
              style={{ background: c.bg }}
            >
              <Icon className="w-1/2 h-1/2" style={{ color: c.accent }} />
            </div>
          )}
        </div>
        
        {/* Value */}
        <p 
          className={cn('font-bold tracking-tight mb-2', s.value)}
          style={{ color: CHRONOS.colors.textPrimary }}
        >
          {value}
        </p>
        
        {/* Change */}
        {change && (
          <div className="flex items-center gap-1.5">
            <t.Icon className="w-4 h-4" style={{ color: t.color }} />
            <span className="text-sm font-medium" style={{ color: t.color }}>
              {change}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
})
KPICard.displayName = 'KPICard'

// ═══════════════════════════════════════════════════════════════════════════
// 🦸 HERO CARD - Tarjeta Hero Grande
// ═══════════════════════════════════════════════════════════════════════════

interface HeroCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  gradient?: 'cyan' | 'magenta' | 'violet'
}

export const HeroCard = memo(({ 
  title, 
  value, 
  subtitle, 
  trend = 'up', 
  trendValue,
  gradient = 'cyan',
}: HeroCardProps) => {
  const prefersReducedMotion = useReducedMotion()
  const t = trendConfig[trend]
  
  const gradients = {
    cyan: `radial-gradient(ellipse at 30% 50%, ${CHRONOS.colors.cyanMuted} 0%, transparent 50%)`,
    magenta: `radial-gradient(ellipse at 30% 50%, ${CHRONOS.colors.magentaMuted} 0%, transparent 50%)`,
    violet: `radial-gradient(ellipse at 30% 50%, ${CHRONOS.colors.violetMuted} 0%, transparent 50%)`,
  }
  
  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative overflow-hidden rounded-3xl p-8 md:p-10"
      style={{
        background: CHRONOS.colors.voidSoft,
        border: `1px solid ${CHRONOS.colors.glassBorder}`,
        minHeight: '280px',
      }}
    >
      {/* Animated Gradient */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: gradients[gradient] }}
        animate={prefersReducedMotion ? {} : {
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <div className="relative z-10">
        {/* Title */}
        <p 
          className="text-sm font-medium tracking-wider uppercase mb-4"
          style={{ color: CHRONOS.colors.textMuted }}
        >
          {title}
        </p>
        
        {/* Value */}
        <h2 
          className="text-5xl md:text-7xl font-bold tracking-tight mb-4"
          style={{ color: CHRONOS.colors.textPrimary }}
        >
          {value}
        </h2>
        
        {/* Subtitle & Trend */}
        <div className="flex items-center gap-4">
          {subtitle && (
            <span style={{ color: CHRONOS.colors.textSecondary }}>
              {subtitle}
            </span>
          )}
          {trendValue && (
            <div 
              className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: trend === 'up' ? 'rgba(16,185,129,0.15)' : trend === 'down' ? 'rgba(239,68,68,0.15)' : CHRONOS.colors.glassBg }}
            >
              <t.Icon className="w-4 h-4" style={{ color: t.color }} />
              <span className="text-sm font-medium" style={{ color: t.color }}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
})
HeroCard.displayName = 'HeroCard'

// ═══════════════════════════════════════════════════════════════════════════
// 📱 BENTO GRID - Layout Bento
// ═══════════════════════════════════════════════════════════════════════════

interface BentoGridProps {
  children: ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4
}

export const BentoGrid = memo(({ children, className, cols = 4 }: BentoGridProps) => {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }
  
  return (
    <div className={cn('grid gap-4 md:gap-6', colsClass[cols], className)}>
      {children}
    </div>
  )
})
BentoGrid.displayName = 'BentoGrid'

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════════

export const ChronosSkeleton = memo(({ className }: { className?: string }) => (
  <div 
    className={cn('animate-pulse rounded-2xl', className)}
    style={{ background: CHRONOS.colors.glassBg }}
  />
))
ChronosSkeleton.displayName = 'ChronosSkeleton'

// ═══════════════════════════════════════════════════════════════════════════
// 📤 EXPORTS - Solo named exports para evitar React Error #31
// ═══════════════════════════════════════════════════════════════════════════
// Todos los componentes ya están exportados con 'export const'
