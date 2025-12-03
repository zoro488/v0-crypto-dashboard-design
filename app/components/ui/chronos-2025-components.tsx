'use client'

/**
 * 🎨 CHRONOS 2025 UI Components
 * 
 * Componentes premium con el nuevo sistema de diseño:
 * - Iconos blancos puros (#FFFFFF) con stroke 1.8
 * - Glassmorphism sutil (blur 20px + border rgba(255,255,255,0.08))
 * - Bordes 16px máximo
 * - KPIs con tipografía Inter Bold 48-64px
 * - Solo 2 colores principales: #0066FF y #C81EFF
 */

import React, { ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { CHRONOS_2025, getGradient, getStatusColor, getSpringAnimation } from '@/app/lib/chronos-2025-tokens'
import { cn } from '@/app/lib/utils'
import { LucideIcon } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// HERO CARD - Card gigante para métricas principales
// ═══════════════════════════════════════════════════════════════════════════════

interface HeroCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  chart?: ReactNode
  children?: ReactNode
  className?: string
}

export function HeroCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  chart,
  children,
  className,
}: HeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={getSpringAnimation()}
      whileHover={{ scale: 1.005 }}
      className={cn(
        // Glassmorphism sutil - border 16px max
        'relative overflow-hidden rounded-[16px] p-8',
        'bg-[rgba(20,20,30,0.6)] backdrop-blur-[20px]',
        'border border-[rgba(255,255,255,0.08)]',
        'hover:border-[rgba(255,255,255,0.12)]',
        'transition-all duration-300',
        className
      )}
      style={{
        boxShadow: CHRONOS_2025.shadows.lg,
      }}
    >
      {/* Gradient overlay sutil */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top right, ${CHRONOS_2025.colors.primaryMuted}, transparent 60%)`,
        }}
      />

      <div className="relative z-10">
        {/* Header con icono */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[#A0A0A0] text-[20px] font-medium mb-2">{title}</p>
            {subtitle && (
              <p className="text-[#6B6B6B] text-[14px]">{subtitle}</p>
            )}
          </div>
          
          {Icon && (
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              className="p-3 rounded-[12px]"
              style={{
                background: getGradient('to-br'),
                boxShadow: CHRONOS_2025.shadows.glow.primary,
              }}
            >
              {/* Icono blanco puro, stroke 1.8 */}
              <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
            </motion.div>
          )}
        </div>

        {/* KPI Value - Inter Bold 64px */}
        <div className="flex items-end gap-4 mb-6">
          <h2 
            className="text-white font-bold leading-none"
            style={{
              fontSize: CHRONOS_2025.typography.kpiLarge.fontSize,
              fontWeight: CHRONOS_2025.typography.kpiLarge.fontWeight,
              letterSpacing: CHRONOS_2025.typography.kpiLarge.letterSpacing,
            }}
          >
            {value}
          </h2>
          
          {trend && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'text-[14px] font-semibold px-3 py-1 rounded-full mb-2',
                trend.isPositive 
                  ? 'bg-[rgba(0,255,87,0.15)] text-[#00FF57]' 
                  : 'bg-[rgba(255,0,51,0.15)] text-[#FF0033]'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </motion.span>
          )}
        </div>

        {/* Chart area */}
        {chart && (
          <div className="mt-6">{chart}</div>
        )}

        {children}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// KPI CARD - Cards medianas para métricas secundarias
// ═══════════════════════════════════════════════════════════════════════════════

interface KPICardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: LucideIcon
  color?: 'primary' | 'accent' | 'success' | 'danger' | 'warning'
  className?: string
}

export function KPICard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color = 'primary',
  className,
}: KPICardProps) {
  const colorMap = {
    primary: CHRONOS_2025.colors.primary,
    accent: CHRONOS_2025.colors.accent,
    success: CHRONOS_2025.colors.success,
    danger: CHRONOS_2025.colors.danger,
    warning: CHRONOS_2025.colors.warning,
  }

  const glowMap = {
    primary: CHRONOS_2025.shadows.glow.primary,
    accent: CHRONOS_2025.shadows.glow.accent,
    success: CHRONOS_2025.shadows.glow.success,
    danger: CHRONOS_2025.shadows.glow.danger,
    warning: CHRONOS_2025.shadows.glow.danger,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={getSpringAnimation()}
      whileHover={{ y: -4, scale: CHRONOS_2025.animations.hoverScale }}
      className={cn(
        'relative overflow-hidden rounded-[16px] p-6',
        'bg-[rgba(20,20,30,0.6)] backdrop-blur-[20px]',
        'border border-[rgba(255,255,255,0.08)]',
        'hover:border-[rgba(255,255,255,0.12)]',
        'transition-all duration-300 cursor-pointer group',
        className
      )}
    >
      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colorMap[color]}15, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          {Icon && (
            <motion.div 
              className="p-2.5 rounded-[12px]"
              style={{ 
                backgroundColor: `${colorMap[color]}20`,
                boxShadow: glowMap[color],
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              {/* Icono blanco puro */}
              <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
            </motion.div>
          )}
          
          {change && (
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-[12px] font-semibold',
                trend === 'up' && 'bg-[rgba(0,255,87,0.15)] text-[#00FF57]',
                trend === 'down' && 'bg-[rgba(255,0,51,0.15)] text-[#FF0033]',
                trend === 'neutral' && 'bg-[rgba(255,255,255,0.05)] text-[#A0A0A0]'
              )}
            >
              {change}
            </span>
          )}
        </div>

        {/* Label - 20px */}
        <p 
          className="text-[#A0A0A0] mb-2 group-hover:text-[#CCCCCC] transition-colors"
          style={{ fontSize: '14px', fontWeight: 500 }}
        >
          {title}
        </p>

        {/* KPI Value - Inter Bold 48px */}
        <h3 
          className="text-white font-bold tracking-tight"
          style={{
            fontSize: CHRONOS_2025.typography.kpiMedium.fontSize,
            fontWeight: CHRONOS_2025.typography.kpiMedium.fontWeight,
            letterSpacing: CHRONOS_2025.typography.kpiMedium.letterSpacing,
          }}
        >
          {value}
        </h3>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHRONOS ICON - Iconos blancos puros con glow opcional
// ═══════════════════════════════════════════════════════════════════════════════

interface ChronosIconProps {
  icon: LucideIcon
  size?: 'sm' | 'md' | 'lg' | 'xl'
  active?: boolean
  className?: string
}

export function ChronosIcon({
  icon: Icon,
  size = 'md',
  active = false,
  className,
}: ChronosIconProps) {
  const sizes = CHRONOS_2025.icons.size

  return (
    <Icon
      className={cn('text-white', className)}
      style={{
        width: sizes[size],
        height: sizes[size],
        filter: active ? `drop-shadow(${CHRONOS_2025.icons.activeGlow})` : undefined,
      }}
      strokeWidth={CHRONOS_2025.icons.strokeWidth}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHRONOS BUTTON - Botones con nuevo diseño
// ═══════════════════════════════════════════════════════════════════════════════

interface ChronosButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
}

export function ChronosButton({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className,
  ...props
}: ChronosButtonProps) {
  const sizeStyles = {
    sm: 'px-4 py-2 text-[14px]',
    md: 'px-6 py-3 text-[15px]',
    lg: 'px-8 py-4 text-[16px]',
  }

  const variantStyles = {
    primary: cn(
      'bg-[#0066FF] text-white font-semibold',
      'hover:bg-[#0052CC]',
      'shadow-[0_4px_16px_rgba(0,102,255,0.3)]',
      'hover:shadow-[0_8px_24px_rgba(0,102,255,0.4)]'
    ),
    secondary: cn(
      'bg-transparent text-white font-medium',
      'border border-[rgba(255,255,255,0.15)]',
      'hover:bg-[rgba(255,255,255,0.05)]',
      'hover:border-[rgba(255,255,255,0.25)]'
    ),
    ghost: cn(
      'bg-transparent text-[#A0A0A0] font-medium',
      'hover:text-white',
      'hover:bg-[rgba(255,255,255,0.05)]'
    ),
    danger: cn(
      'bg-[#FF0033] text-white font-semibold',
      'hover:bg-[#CC0029]',
      'shadow-[0_4px_16px_rgba(255,0,51,0.3)]',
      'hover:shadow-[0_8px_24px_rgba(255,0,51,0.4)]'
    ),
  }

  return (
    <motion.button
      className={cn(
        'rounded-[12px] transition-all duration-300',
        'flex items-center justify-center gap-2',
        'focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:ring-offset-2 focus:ring-offset-black',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={getSpringAnimation()}
      {...props}
    >
      {Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4" strokeWidth={1.8} />
      )}
      {children}
      {Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4" strokeWidth={1.8} />
      )}
    </motion.button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLASS CARD - Card con glassmorphism sutil
// ═══════════════════════════════════════════════════════════════════════════════

interface GlassCardProps {
  children: ReactNode
  hover?: boolean
  className?: string
}

export function GlassCard({
  children,
  hover = true,
  className,
}: GlassCardProps) {
  const Comp = hover ? motion.div : 'div'

  return (
    <Comp
      className={cn(
        'rounded-[16px] p-6',
        'bg-[rgba(20,20,30,0.6)] backdrop-blur-[20px]',
        'border border-[rgba(255,255,255,0.08)]',
        hover && 'hover:border-[rgba(255,255,255,0.12)]',
        'transition-all duration-300',
        className
      )}
      {...(hover && {
        whileHover: { y: -4, scale: 1.02 },
        transition: getSpringAnimation(),
      })}
    >
      {children}
    </Comp>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS BADGE - Badge con colores semánticos
// ═══════════════════════════════════════════════════════════════════════════════

interface StatusBadgeProps {
  status: 'success' | 'danger' | 'warning' | 'neutral'
  children: ReactNode
  className?: string
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const colors = getStatusColor(status)

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full',
        'text-[12px] font-semibold',
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {children}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE - Estado vacío premium con ilustración 3D
// ═══════════════════════════════════════════════════════════════════════════════

interface EmptyStateProps {
  title: string
  description: string
  icon?: LucideIcon
  action?: {
    label: string
    onClick: () => void
  }
  illustration?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={getSpringAnimation()}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-8',
        'rounded-[16px] bg-[rgba(20,20,30,0.4)] backdrop-blur-[20px]',
        'border border-[rgba(255,255,255,0.05)]',
        className
      )}
    >
      {/* Ilustración 3D o Icono */}
      {illustration ? (
        <div className="mb-8">{illustration}</div>
      ) : Icon ? (
        <motion.div
          className="mb-8 p-6 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(0,102,255,0.1), rgba(200,30,255,0.1))',
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon className="w-12 h-12 text-[#A0A0A0]" strokeWidth={1.5} />
        </motion.div>
      ) : null}

      {/* Texto motivador */}
      <h3 className="text-white text-[24px] font-bold mb-3 text-center">{title}</h3>
      <p className="text-[#A0A0A0] text-[16px] text-center max-w-md mb-8">{description}</p>

      {/* CTA Button */}
      {action && (
        <ChronosButton variant="primary" onClick={action.onClick}>
          {action.label}
        </ChronosButton>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT TEXT - Texto con gradiente Chronos
// ═══════════════════════════════════════════════════════════════════════════════

interface GradientTextProps {
  children: ReactNode
  className?: string
}

export function GradientText({ children, className }: GradientTextProps) {
  return (
    <span
      className={cn('bg-clip-text text-transparent', className)}
      style={{
        backgroundImage: getGradient(),
      }}
    >
      {children}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY LIST ITEM - Para feeds de actividad
// ═══════════════════════════════════════════════════════════════════════════════

interface ActivityListItemProps {
  icon?: LucideIcon
  title: string
  description: string
  timestamp: string | Date
  status?: 'success' | 'danger' | 'warning' | 'neutral'
  amount?: string | number
  index?: number
}

export function ActivityListItem({
  icon: Icon,
  title,
  description,
  timestamp,
  status = 'neutral',
  amount,
  index = 0,
}: ActivityListItemProps) {
  const statusColor = getStatusColor(status)
  
  // Formatear timestamp
  const formattedTime = typeof timestamp === 'string' 
    ? timestamp 
    : timestamp.toLocaleDateString('es-MX', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
  
  // Formatear amount
  const formattedAmount = typeof amount === 'number' 
    ? `$${amount.toLocaleString()}` 
    : amount

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-all duration-200 cursor-pointer group border border-transparent hover:border-white/[0.05]"
    >
      {/* Status Indicator */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: statusColor.text }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate group-hover:text-white/90">
          {title}
        </p>
        <p className="text-[#6B6B6B] text-xs truncate">
          {description}
        </p>
      </div>

      {/* Right side */}
      <div className="text-right flex-shrink-0">
        {formattedAmount && (
          <p className="text-white font-semibold text-sm">{formattedAmount}</p>
        )}
        <p className="text-[#6B6B6B] text-[11px]">{formattedTime}</p>
      </div>
    </motion.div>
  )
}

// Export all components
export default {
  HeroCard,
  KPICard,
  ChronosIcon,
  ChronosButton,
  GlassCard,
  StatusBadge,
  EmptyState,
  GradientText,
  ActivityListItem,
}
