'use client'

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import React, { forwardRef, createContext, useContext, ReactNode, useState, useRef, useEffect } from 'react'
import { cn } from '@/app/lib/utils'
import { LucideIcon } from 'lucide-react'

// ============================================
// CONTEXTO Y TIPOS
// ============================================

interface GlowContextType {
  glowColor: string
  intensity: 'low' | 'medium' | 'high'
}

const GlowContext = createContext<GlowContextType>({
  glowColor: 'rgba(59, 130, 246, 0.5)',
  intensity: 'medium',
})

// ============================================
// PREMIUM CARD - Glassmorphism avanzado
// ============================================

interface PremiumCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
  glowOnHover?: boolean
  floatOnHover?: boolean
  shine?: boolean
  gradient?: string
  borderGlow?: boolean
  delay?: number
  onClick?: () => void
}

export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(({
  children,
  className,
  glowColor = 'rgba(59, 130, 246, 0.5)',
  glowOnHover = true,
  floatOnHover = true,
  shine = true,
  gradient,
  borderGlow = false,
  delay = 0,
  onClick,
}, ref) => {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Efecto de brillo que sigue al mouse
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const spotlightX = useSpring(mouseX, { stiffness: 300, damping: 30 })
  const spotlightY = useSpring(mouseY, { stiffness: 300, damping: 30 })

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden rounded-3xl',
        'bg-gradient-to-br from-white/[0.08] to-white/[0.02]',
        'backdrop-blur-xl border border-white/10',
        borderGlow && 'border-transparent',
        className,
      )}
      style={{
        background: gradient || undefined,
      }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay, 
        ease: [0.16, 1, 0.3, 1], 
      }}
      whileHover={floatOnHover ? { 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.3, ease: 'easeOut' },
      } : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Borde con gradiente animado */}
      {borderGlow && (
        <motion.div
          className="absolute inset-0 rounded-3xl p-[1px] -z-10"
          style={{
            background: `linear-gradient(135deg, ${glowColor}, transparent 50%, ${glowColor})`,
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        />
      )}
      
      {/* Glow effect on hover */}
      <AnimatePresence>
        {glowOnHover && isHovered && (
          <motion.div
            className="absolute inset-0 -z-10"
            style={{
              background: `radial-gradient(600px circle at ${spotlightX}px ${spotlightY}px, ${glowColor}, transparent 40%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Shine sweep effect */}
      {shine && (
        <motion.div
          className="absolute inset-0 -z-5"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
          }}
          initial={{ backgroundPosition: '200% 0' }}
          animate={isHovered ? { backgroundPosition: '-200% 0' } : {}}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}

      {/* Contenido */}
      <GlowContext.Provider value={{ glowColor, intensity: 'medium' }}>
        {children}
      </GlowContext.Provider>
    </motion.div>
  )
})
PremiumCard.displayName = 'PremiumCard'

// ============================================
// KPI CARD - Tarjeta de métricas premium
// ============================================

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: LucideIcon
  iconColor?: string
  gradient?: string
  sparklineData?: number[]
  suffix?: string
  prefix?: string
  description?: string
  delay?: number
  onClick?: () => void
  className?: string
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  iconColor = 'from-blue-500 to-cyan-500',
  gradient,
  sparklineData,
  suffix = '',
  prefix = '',
  description,
  delay = 0,
  onClick,
  className,
}) => {
  const trendConfig = {
    up: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', symbol: '↑' },
    down: { color: 'text-rose-400', bg: 'bg-rose-500/10', symbol: '↓' },
    neutral: { color: 'text-white/50', bg: 'bg-white/5', symbol: '→' },
  }

  const { color: trendColor, bg: trendBg, symbol: trendSymbol } = trendConfig[trend]

  return (
    <PremiumCard
      className={cn('p-6 cursor-pointer', className)}
      glowColor={gradient?.includes('emerald') ? 'rgba(16, 185, 129, 0.3)' : 
                gradient?.includes('purple') ? 'rgba(147, 51, 234, 0.3)' : 
                'rgba(59, 130, 246, 0.3)'}
      delay={delay}
      onClick={onClick}
    >
      {/* Fondo con gradiente sutil */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: gradient || 'radial-gradient(circle at top right, rgba(59,130,246,0.15), transparent 60%)',
        }}
      />

      <div className="relative z-10">
        {/* Header con icono y cambio */}
        <div className="flex items-start justify-between mb-4">
          {Icon && (
            <motion.div
              className={cn(
                'p-3 rounded-2xl bg-gradient-to-br shadow-lg',
                iconColor,
              )}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Icon className="w-5 h-5 text-white" />
            </motion.div>
          )}

          {change !== undefined && (
            <motion.div
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1',
                trendBg,
                trendColor,
              )}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <span>{trendSymbol}</span>
              <span>{Math.abs(change)}%</span>
            </motion.div>
          )}
        </div>

        {/* Título */}
        <motion.p
          className="text-white/50 text-sm font-medium mb-2 uppercase tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.1 }}
        >
          {title}
        </motion.p>

        {/* Valor principal */}
        <motion.div
          className="text-3xl font-bold text-white tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.15, duration: 0.5 }}
        >
          {prefix}
          <AnimatedValue value={value} />
          {suffix}
        </motion.div>

        {/* Descripción opcional */}
        {description && (
          <motion.p
            className="text-white/40 text-xs mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3 }}
          >
            {description}
          </motion.p>
        )}

        {/* Mini sparkline opcional */}
        {sparklineData && sparklineData.length > 0 && (
          <motion.div
            className="mt-4 h-12"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: delay + 0.4, duration: 0.5 }}
          >
            <MiniSparkline data={sparklineData} color={iconColor} />
          </motion.div>
        )}
      </div>
    </PremiumCard>
  )
}

// ============================================
// ANIMATED VALUE - Contador animado mejorado
// ============================================

interface AnimatedValueProps {
  value: string | number
  duration?: number
  className?: string
}

const AnimatedValue: React.FC<AnimatedValueProps> = ({ 
  value, 
  duration = 1000,
  className, 
}) => {
  const [displayValue, setDisplayValue] = useState(value)
  
  useEffect(() => {
    if (typeof value === 'number') {
      const startValue = typeof displayValue === 'number' ? displayValue : 0
      const endValue = value
      const startTime = Date.now()
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Easing suave
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = startValue + (endValue - startValue) * eased
        
        setDisplayValue(Math.round(current))
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setDisplayValue(endValue)
        }
      }
      
      requestAnimationFrame(animate)
    } else {
      setDisplayValue(value)
    }
  }, [value, duration])

  return (
    <span className={cn('tabular-nums', className)}>
      {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
    </span>
  )
}

// ============================================
// MINI SPARKLINE - Gráfico compacto
// ============================================

interface MiniSparklineProps {
  data: number[]
  color?: string
  className?: string
}

const MiniSparkline: React.FC<MiniSparklineProps> = ({ 
  data, 
  color = 'from-blue-500 to-cyan-500',
  className, 
}) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 80
    return `${x},${y}`
  }).join(' ')

  return (
    <svg 
      className={cn('w-full h-full', className)} 
      viewBox="0 0 100 100" 
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="sparklineFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Área bajo la línea */}
      <motion.polygon
        points={`0,100 ${points} 100,100`}
        fill="url(#sparklineFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      />
      
      {/* Línea principal */}
      <motion.polyline
        points={points}
        fill="none"
        stroke="url(#sparklineGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      
      {/* Punto final */}
      <motion.circle
        cx={(data.length - 1) / (data.length - 1) * 100}
        cy={100 - ((data[data.length - 1] - min) / range) * 80}
        r="3"
        fill="#fff"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
      />
    </svg>
  )
}

// ============================================
// GLOW BUTTON - Botón con efectos premium
// ============================================

interface GlowButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  glow?: boolean
  className?: string
  onClick?: () => void
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  glow = true,
  className,
  onClick,
}) => {
  const variants = {
    primary: {
      bg: 'bg-gradient-to-r from-blue-600 to-cyan-500',
      hover: 'hover:from-blue-500 hover:to-cyan-400',
      glow: 'rgba(59, 130, 246, 0.5)',
      text: 'text-white',
    },
    secondary: {
      bg: 'bg-white/5 border border-white/10',
      hover: 'hover:bg-white/10 hover:border-white/20',
      glow: 'rgba(255, 255, 255, 0.2)',
      text: 'text-white',
    },
    ghost: {
      bg: 'bg-transparent',
      hover: 'hover:bg-white/5',
      glow: 'rgba(255, 255, 255, 0.1)',
      text: 'text-white/70 hover:text-white',
    },
    danger: {
      bg: 'bg-gradient-to-r from-rose-600 to-pink-500',
      hover: 'hover:from-rose-500 hover:to-pink-400',
      glow: 'rgba(244, 63, 94, 0.5)',
      text: 'text-white',
    },
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  }

  const { bg, hover, glow: glowColor, text } = variants[variant]

  return (
    <motion.button
      className={cn(
        'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
        'transition-all duration-300 overflow-hidden',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-black',
        bg,
        hover,
        text,
        sizes[size],
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled || loading}
    >
      {/* Glow effect */}
      {glow && !disabled && (
        <motion.div
          className="absolute inset-0 -z-10 opacity-0"
          style={{
            boxShadow: `0 0 30px 10px ${glowColor}`,
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Loading spinner */}
      {loading && (
        <motion.div
          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Icon left */}
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className="w-4 h-4" />
      )}

      {/* Text */}
      <span>{children}</span>

      {/* Icon right */}
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className="w-4 h-4" />
      )}
    </motion.button>
  )
}

// ============================================
// ANIMATED BADGE - Badge con animaciones
// ============================================

interface AnimatedBadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  pulse?: boolean
  glow?: boolean
  className?: string
}

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  children,
  variant = 'default',
  pulse = false,
  glow = false,
  className,
}) => {
  const variants = {
    default: { bg: 'bg-white/10', text: 'text-white/80', border: 'border-white/20', glow: 'rgba(255,255,255,0.3)' },
    success: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'rgba(16,185,129,0.5)' },
    warning: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'rgba(245,158,11,0.5)' },
    error: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', glow: 'rgba(244,63,94,0.5)' },
    info: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', glow: 'rgba(59,130,246,0.5)' },
  }

  const config = variants[variant]

  return (
    <motion.span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
        'border backdrop-blur-sm',
        config.bg,
        config.text,
        config.border,
        className,
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      style={glow ? { boxShadow: `0 0 15px ${config.glow}` } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {pulse && (
        <motion.span
          className={cn('w-1.5 h-1.5 rounded-full', config.text.replace('text-', 'bg-'))}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {children}
    </motion.span>
  )
}

// ============================================
// FLOATING PANEL - Panel flotante animado
// ============================================

interface FloatingPanelProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  title?: string
  subtitle?: string
  className?: string
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  children,
  isOpen,
  onClose,
  position = 'bottom-right',
  size = 'md',
  title,
  subtitle,
  className,
}) => {
  const positions = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  }

  const sizes = {
    sm: 'w-[320px] max-h-[400px]',
    md: 'w-[400px] max-h-[500px]',
    lg: 'w-[500px] max-h-[600px]',
    xl: 'w-[600px] max-h-[700px]',
    full: 'w-[90vw] h-[90vh]',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            className={cn(
              'fixed z-50',
              positions[position],
              sizes[size],
              className,
            )}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <PremiumCard className="h-full flex flex-col">
              {/* Header */}
              {(title || subtitle) && (
                <div className="p-4 border-b border-white/10">
                  {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                  {subtitle && <p className="text-sm text-white/50">{subtitle}</p>}
                </div>
              )}
              
              {/* Content */}
              <div className="flex-1 overflow-auto p-4">
                {children}
              </div>
            </PremiumCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Export all
export {
  GlowContext,
  AnimatedValue,
  MiniSparkline,
}
