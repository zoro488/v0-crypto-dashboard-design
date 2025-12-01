'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { type LucideIcon, Building2, TrendingUp, TrendingDown, ChevronRight, Sparkles } from 'lucide-react'
import { useRef, useState, memo, useCallback } from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// PREMIUM BANK CARD
// ============================================================
interface PremiumBankCardProps {
  id: string
  nombre: string
  saldo: number
  color: string
  icon?: LucideIcon
  index?: number
  onClick?: () => void
}

export const PremiumBankCard = memo(function PremiumBankCard({
  id,
  nombre,
  saldo,
  color,
  icon: Icon = Building2,
  index = 0,
  onClick,
}: PremiumBankCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  const isNegative = saldo < 0
  const trend = isNegative ? 'down' : 'up'
  
  // Magnetic effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const x = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 400, damping: 30 })
  const y = useSpring(useTransform(mouseY, [-0.5, 0.5], [-3, 3]), { stiffness: 400, damping: 30 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set((e.clientX - centerX) / rect.width)
    mouseY.set((e.clientY - centerY) / rect.height)
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }, [mouseX, mouseY])

  // Format currency
  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount)
    if (absAmount >= 1000000) {
      return `$${(absAmount / 1000000).toFixed(2)}M`
    } else if (absAmount >= 1000) {
      return `$${(absAmount / 1000).toFixed(1)}K`
    }
    return `$${absAmount.toLocaleString()}`
  }

  // Generate sparkle positions
  const sparkles = Array.from({ length: 3 }, (_, i) => ({
    x: 20 + i * 30,
    y: 10 + (i % 2) * 20,
    delay: i * 0.2,
  }))

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ x: isHovered ? x : 0, y: isHovered ? y : 0 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="group relative cursor-pointer"
    >
      <div className={cn(
        "relative flex items-center justify-between",
        "p-3 md:p-4 rounded-xl md:rounded-2xl",
        "bg-white/[0.03] hover:bg-white/[0.06]",
        "border border-white/[0.06] hover:border-white/[0.1]",
        "transition-all duration-300",
        "overflow-hidden"
      )}>
        {/* Animated Gradient Background */}
        <motion.div
          className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100",
            "transition-opacity duration-500",
            `bg-gradient-to-r ${color}`
          )}
          style={{ opacity: 0.05 }}
        />

        {/* Sparkles on hover */}
        {isHovered && sparkles.map((sparkle, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ delay: sparkle.delay, duration: 0.6 }}
          >
            <Sparkles className="w-3 h-3 text-white/30" />
          </motion.div>
        ))}

        {/* Left Section */}
        <div className="flex items-center gap-3 relative z-10">
          {/* Icon Container */}
          <motion.div 
            className={cn(
              "w-10 h-10 md:w-12 md:h-12",
              "rounded-xl md:rounded-2xl",
              "flex items-center justify-center",
              "shadow-lg",
              `bg-gradient-to-br ${color}`
            )}
            animate={{
              scale: isHovered ? 1.05 : 1,
              boxShadow: isHovered 
                ? '0 8px 30px -8px rgba(59, 130, 246, 0.4)' 
                : '0 4px 15px -4px rgba(0, 0, 0, 0.3)',
            }}
            transition={{ duration: 0.3 }}
          >
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </motion.div>

          {/* Bank Info */}
          <div>
            <p className="text-white font-medium text-sm md:text-base tracking-wide">
              {nombre}
            </p>
            <p className="text-white/40 text-[10px] md:text-xs font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/80" />
              •••• {id.slice(-4).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="text-right">
            <motion.p 
              className={cn(
                "font-bold text-sm md:text-base",
                isNegative ? 'text-red-400' : 'text-white'
              )}
              animate={{
                textShadow: isHovered && !isNegative
                  ? '0 0 20px rgba(255,255,255,0.3)'
                  : 'none',
              }}
            >
              {isNegative && '-'}{formatCurrency(saldo)}
            </motion.p>
            <div className={cn(
              "flex items-center justify-end gap-1",
              "text-[10px] md:text-xs",
              isNegative ? 'text-red-400' : 'text-emerald-400'
            )}>
              {isNegative 
                ? <TrendingDown className="w-3 h-3" /> 
                : <TrendingUp className="w-3 h-3" />
              }
              <span>{isNegative ? '-' : '+'}2.4%</span>
            </div>
          </div>

          {/* Arrow Indicator */}
          <motion.div
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            animate={{ x: isHovered ? 3 : 0 }}
          >
            <ChevronRight className="w-4 h-4 text-white/40" />
          </motion.div>
        </div>

        {/* Bottom Shine Effect */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ 
            scaleX: isHovered ? 1 : 0,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </motion.div>
  )
})

// ============================================================
// PREMIUM ACTIVITY ITEM
// ============================================================
interface PremiumActivityItemProps {
  type: 'venta' | 'compra' | 'transferencia' | 'stock' | 'cliente' | 'alerta'
  title: string
  description: string
  amount?: number
  time: string
  status: 'success' | 'pending' | 'error'
  index?: number
  onClick?: () => void
}

export const PremiumActivityItem = memo(function PremiumActivityItem({
  type,
  title,
  description,
  amount,
  time,
  status,
  index = 0,
  onClick,
}: PremiumActivityItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  const typeIcons: Record<string, { icon: string; color: string }> = {
    venta: { icon: '💰', color: 'from-green-500 to-emerald-500' },
    compra: { icon: '📦', color: 'from-blue-500 to-cyan-500' },
    transferencia: { icon: '↗️', color: 'from-purple-500 to-pink-500' },
    stock: { icon: '📊', color: 'from-amber-500 to-orange-500' },
    cliente: { icon: '👤', color: 'from-indigo-500 to-violet-500' },
    alerta: { icon: '⚠️', color: 'from-red-500 to-rose-500' },
  }

  const statusStyles = {
    success: { bg: 'bg-emerald-500', glow: 'shadow-emerald-500/50' },
    pending: { bg: 'bg-amber-500', glow: 'shadow-amber-500/50' },
    error: { bg: 'bg-red-500', glow: 'shadow-red-500/50' },
  }

  const { icon, color } = typeIcons[type] || typeIcons.venta
  const { bg, glow } = statusStyles[status]

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl",
        "hover:bg-white/[0.04] transition-colors cursor-pointer",
        "group relative"
      )}
    >
      {/* Icon */}
      <div className="relative">
        <motion.div 
          className={cn(
            "w-10 h-10 rounded-xl",
            "bg-white/[0.05] group-hover:bg-white/[0.08]",
            "flex items-center justify-center",
            "transition-colors"
          )}
          animate={{ scale: isHovered ? 1.05 : 1 }}
        >
          <span className="text-lg">{icon}</span>
        </motion.div>
        
        {/* Status Indicator */}
        <motion.div 
          className={cn(
            "absolute -bottom-0.5 -right-0.5",
            "w-3 h-3 rounded-full",
            "border-2 border-black/80",
            bg,
            isHovered && `shadow-lg ${glow}`
          )}
          animate={{
            scale: isHovered ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate group-hover:text-white/90">
          {title}
        </p>
        <p className="text-xs text-white/40 truncate">{description}</p>
      </div>

      {/* Amount & Time */}
      <div className="text-right shrink-0">
        {amount !== undefined && (
          <motion.p 
            className={cn(
              "text-sm font-bold",
              amount >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}
            animate={{
              textShadow: isHovered 
                ? amount >= 0 
                  ? '0 0 15px rgba(16, 185, 129, 0.5)' 
                  : '0 0 15px rgba(239, 68, 68, 0.5)'
                : 'none',
            }}
          >
            {amount >= 0 ? '+' : ''}{amount.toLocaleString()}
          </motion.p>
        )}
        <p className="text-[10px] text-white/30">{time}</p>
      </div>

      {/* Hover Line */}
      <motion.div
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2",
          "w-0.5 h-8 rounded-full",
          `bg-gradient-to-b ${color}`
        )}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ 
          scaleY: isHovered ? 1 : 0,
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  )
})

// ============================================================
// PREMIUM QUICK ACTION BUTTON
// ============================================================
interface PremiumQuickActionProps {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'default' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export const PremiumQuickAction = memo(function PremiumQuickAction({
  label,
  icon: Icon,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
}: PremiumQuickActionProps) {
  const [isPressed, setIsPressed] = useState(false)

  const variants = {
    primary: {
      bg: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600',
      shadow: 'shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40',
      text: 'text-white',
    },
    secondary: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
      shadow: 'shadow-lg shadow-green-500/25 hover:shadow-green-500/40',
      text: 'text-white',
    },
    danger: {
      bg: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600',
      shadow: 'shadow-lg shadow-red-500/25 hover:shadow-red-500/40',
      text: 'text-white',
    },
    default: {
      bg: 'bg-white/[0.05] hover:bg-white/[0.08]',
      shadow: '',
      text: 'text-white',
    },
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm gap-2',
    lg: 'px-6 md:px-8 py-3 text-sm md:text-base gap-2.5',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5 md:w-4 md:h-4',
    lg: 'w-4 h-4 md:w-5 md:h-5',
  }

  const { bg, shadow, text } = variants[variant]

  return (
    <motion.button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      disabled={disabled}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-lg md:rounded-xl font-bold",
        "flex items-center justify-center",
        "transition-all duration-300",
        "border border-white/[0.1]",
        "overflow-hidden",
        bg,
        shadow,
        text,
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-2">
        <Icon className={iconSizes[size]} />
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{label.split(' ')[0]}</span>
      </div>

      {/* Press Effect */}
      <motion.div
        className="absolute inset-0 bg-black/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: isPressed ? 1 : 0 }}
        transition={{ duration: 0.1 }}
      />
    </motion.button>
  )
})

export default {
  PremiumBankCard,
  PremiumActivityItem,
  PremiumQuickAction,
}
