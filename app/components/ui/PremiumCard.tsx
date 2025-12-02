'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface PremiumCardProps {
  children: ReactNode
  className?: string
  variant?: 'glass' | 'gradient' | 'solid' | 'neon'
  glow?: boolean
  hover?: boolean
  onClick?: () => void
  icon?: LucideIcon
  title?: string
  subtitle?: string
  badge?: string
  badgeColor?: string
}

export function PremiumCard({
  children,
  className = '',
  variant = 'glass',
  glow = false,
  hover = true,
  onClick,
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeColor = '#06b6d4',
}: PremiumCardProps) {
  const variantStyles = {
    glass: 'backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20',
    gradient: 'bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-blue-500/20 border-2 border-white/30',
    solid: 'bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-white/10',
    neon: 'backdrop-blur-xl bg-black/50 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20',
  }

  const baseClass = `
    relative rounded-2xl p-6 transition-all duration-300
    ${variantStyles[variant]}
    ${hover ? 'hover:scale-[1.02] hover:shadow-2xl' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={hover ? { y: -4 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={baseClass}
    >
      {/* Header */}
      {(Icon || title || badge) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Icon className="w-6 h-6 text-cyan-400" />
              </motion.div>
            )}
            
            {(title || subtitle) && (
              <div>
                {title && (
                  <h3 className="text-white font-bold text-lg">{title}</h3>
                )}
                {subtitle && (
                  <p className="text-white/60 text-sm">{subtitle}</p>
                )}
              </div>
            )}
          </div>

          {badge && (
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: `${badgeColor}40`,
                color: badgeColor,
              }}
            >
              {badge}
            </motion.span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Glow effect */}
      {glow && (
        <motion.div
          className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl"
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Shimmer effect on hover */}
      {hover && (
        <motion.div
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
          whileHover="hover"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            variants={{
              hover: {
                x: ['-100%', '100%'],
                transition: {
                  duration: 0.8,
                  ease: 'easeInOut',
                },
              },
            }}
          />
        </motion.div>
      )}
    </motion.div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  icon: LucideIcon
  color?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color = '#06b6d4',
  trend = 'neutral',
  className = '',
}: StatCardProps) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-white/60',
  }

  return (
    <PremiumCard variant="glass" hover className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/60 text-sm mb-2">{label}</p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-white font-bold text-3xl mb-1"
          >
            {value}
          </motion.p>
          
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${trendColors[trend]}`}>
              <span>{change >= 0 ? '+' : ''}{change}%</span>
              <span className="text-xs text-white/40">vs anterior</span>
            </div>
          )}
        </div>

        <motion.div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
          whileHover={{ scale: 1.1, rotate: 10 }}
        >
          <Icon className="w-8 h-8" style={{ color }} />
        </motion.div>
      </div>

      {/* Progress bar */}
      {change !== undefined && (
        <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.abs(change) * 2, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      )}
    </PremiumCard>
  )
}

interface ActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  onClick: () => void
  color?: string
  className?: string
  disabled?: boolean
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  color = '#06b6d4',
  className = '',
  disabled = false,
}: ActionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02, y: -4 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`
        relative p-6 rounded-2xl backdrop-blur-xl
        bg-gradient-to-br from-white/10 to-white/5
        border-2 border-white/20
        hover:border-cyan-500/50
        transition-all duration-300 text-left w-full
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <div className="flex items-start gap-4">
        <motion.div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}30` }}
          whileHover={disabled ? undefined : { scale: 1.1, rotate: 5 }}
        >
          <Icon className="w-7 h-7" style={{ color }} />
        </motion.div>

        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
          <p className="text-white/60 text-sm">{description}</p>
        </div>

        {!disabled && (
          <motion.div
            className="text-cyan-400"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            →
          </motion.div>
        )}
      </div>

      {!disabled && (
        <motion.div
          className="absolute inset-0 -z-10 rounded-2xl blur-xl"
          style={{ backgroundColor: color }}
          whileHover={{ opacity: 0.2 }}
          initial={{ opacity: 0 }}
        />
      )}
    </motion.button>
  )
}
