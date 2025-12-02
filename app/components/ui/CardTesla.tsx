'use client'

/**
 * 💳 CARD TESLA - Tarjeta glassmorphism estilo Apple 2025
 * 
 * Características premium:
 * - Glassmorphism con blur(24px)
 * - Border sutil 1px rgba(255,255,255,0.08)
 * - Hover lift effect con spring physics
 * - Variantes: default, interactive, elevated
 */

import * as React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/app/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface CardTeslaProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode
  variant?: 'default' | 'interactive' | 'elevated' | 'glass'
  padding?: 'none' | 'sm' | 'default' | 'lg'
  hover?: boolean
  glow?: boolean
  glowColor?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export const CardTesla = React.forwardRef<HTMLDivElement, CardTeslaProps>(
  ({
    children,
    className,
    variant = 'default',
    padding = 'default',
    hover = false,
    glow = false,
    glowColor = 'rgba(227, 25, 17, 0.15)',
    ...props
  }, ref) => {
    const paddingStyles = {
      none: '',
      sm: 'p-4',
      default: 'p-6',
      lg: 'p-8',
    }

    const variantStyles = {
      default: cn(
        'bg-[#1C1C1E]/80',
        'border border-white/8',
      ),
      interactive: cn(
        'bg-[#1C1C1E]/80',
        'border border-white/8',
        'cursor-pointer',
      ),
      elevated: cn(
        'bg-[#1C1C1E]/90',
        'border border-white/10',
        'shadow-xl shadow-black/30',
      ),
      glass: cn(
        'bg-white/5',
        'border border-white/10',
        'backdrop-blur-[24px]',
      ),
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-[20px] overflow-hidden',
          'backdrop-blur-[24px]',
          variantStyles[variant],
          paddingStyles[padding],
          className,
        )}
        whileHover={hover ? {
          y: -4,
          scale: 1.01,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
          },
        } : undefined}
        style={glow ? {
          boxShadow: `0 0 60px ${glowColor}`,
        } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    )
  },
)

CardTesla.displayName = 'CardTesla'

// ═══════════════════════════════════════════════════════════════════════════
// CARD HEADER
// ═══════════════════════════════════════════════════════════════════════════

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function CardHeader({
  title,
  description,
  icon,
  action,
  className,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4',
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
            {icon}
          </div>
        )}
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-[#98989D]">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD CONTENT
// ═══════════════════════════════════════════════════════════════════════════

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({
  className,
  children,
  ...props
}: CardContentProps) {
  return (
    <div className={cn('mt-6', className)} {...props}>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD FOOTER
// ═══════════════════════════════════════════════════════════════════════════

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  border?: boolean
}

export function CardFooter({
  className,
  children,
  border = true,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={cn(
        'mt-6 flex items-center justify-end gap-3',
        border && 'pt-6 border-t border-white/8',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD (para KPIs)
// ═══════════════════════════════════════════════════════════════════════════

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  icon?: React.ReactNode
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className,
}: StatCardProps) {
  const trendColors = {
    up: 'text-[#10B981]',
    down: 'text-[#E31911]',
    neutral: 'text-[#98989D]',
  }

  return (
    <CardTesla
      variant="default"
      padding="default"
      hover
      className={className}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-[#98989D] uppercase tracking-wide">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#98989D]">
            {icon}
          </div>
        )}
      </div>
      
      <div className="text-[48px] font-bold text-white leading-none tracking-tight">
        {typeof value === 'number' ? value.toLocaleString('es-MX') : value}
      </div>
      
      <div className="flex items-center gap-2 mt-2">
        {trend && (
          <span className={cn(
            'text-sm font-semibold',
            trendColors[trend.direction],
          )}>
            {trend.direction === 'up' && '↑'}
            {trend.direction === 'down' && '↓'}
            {trend.value}%
          </span>
        )}
        {subtitle && (
          <span className="text-sm text-[#98989D]">
            {subtitle}
          </span>
        )}
      </div>
    </CardTesla>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// BANK CARD (para selector de bancos)
// ═══════════════════════════════════════════════════════════════════════════

interface BankCardProps {
  name: string
  balance: number
  icon?: React.ReactNode
  isSelected?: boolean
  onClick?: () => void
  className?: string
}

export function BankCard({
  name,
  balance,
  icon,
  isSelected = false,
  onClick,
  className,
}: BankCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full p-4 text-left rounded-2xl',
        'transition-all duration-200',
        'border',
        isSelected
          ? 'bg-white/10 border-white/20'
          : 'bg-white/5 border-white/8 hover:bg-white/8',
        className,
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            isSelected ? 'bg-[#E31911]/20 text-[#E31911]' : 'bg-white/10 text-[#98989D]',
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {name}
          </p>
          <p className={cn(
            'text-lg font-semibold',
            balance >= 0 ? 'text-white' : 'text-[#E31911]',
          )}>
            ${balance.toLocaleString('es-MX')}
          </p>
        </div>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 rounded-full bg-[#E31911]"
          />
        )}
      </div>
    </motion.button>
  )
}

export default CardTesla
