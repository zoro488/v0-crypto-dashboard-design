'use client'

/**
 * 🎨 PREMIUM DESIGN SYSTEM - CHRONOS
 * 
 * Sistema de diseño premium inspirado en:
 * - Apple Vision Pro (glassmorphism extremo)
 * - Tesla Cybertruck (bordes futuristas)
 * - SpaceX (elegancia minimalista)
 * - Linear (precisión y fluidez)
 * - Stripe (legibilidad premium)
 * 
 * Tecnologías:
 * - Framer Motion 11+ (animaciones fluidas)
 * - Tailwind CSS 4 (utilidades avanzadas)
 * - CSS Custom Properties (theming dinámico)
 * - GPU acceleration (60fps garantizados)
 */

import { motion, AnimatePresence, Variants, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ReactNode, forwardRef, useState, useEffect, useRef, MouseEvent } from 'react'
import { cn } from '@/app/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANTES DE ANIMACIÓN PREMIUM
// ═══════════════════════════════════════════════════════════════════════════════

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20, filter: 'blur(10px)' },
  animate: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    filter: 'blur(5px)',
    transition: { duration: 0.3 },
  },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { 
    opacity: 0, 
    scale: 0.98,
    transition: { duration: 0.2 },
  },
}

export const slideInFromRight: Variants = {
  initial: { opacity: 0, x: 50 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, x: 20 },
}

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLASS CARD PREMIUM - Vision Pro Style
// ═══════════════════════════════════════════════════════════════════════════════

interface GlassCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'subtle' | 'glow'
  hover?: boolean
  onClick?: () => void
  gradient?: boolean
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, variant = 'default', hover = true, onClick, gradient = false }, ref) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const cardRef = useRef<HTMLDivElement>(null)

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    const variantStyles = {
      default: 'bg-black/40 backdrop-blur-xl border-white/10',
      elevated: 'bg-black/60 backdrop-blur-2xl border-white/15 shadow-2xl',
      subtle: 'bg-white/[0.02] backdrop-blur-md border-white/5',
      glow: 'bg-black/50 backdrop-blur-xl border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.15)]',
    }

    return (
      <motion.div
        ref={cardRef}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={scaleIn}
        whileHover={hover ? { 
          scale: 1.02, 
          y: -4,
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
        } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        className={cn(
          'relative overflow-hidden rounded-2xl border transition-all duration-500',
          variantStyles[variant],
          hover && 'cursor-pointer hover:border-white/20',
          onClick && 'cursor-pointer',
          className,
        )}
        style={{
          background: gradient ? `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.06), transparent 40%)` : undefined,
        }}
      >
        {/* Top highlight line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Ambient glow on hover */}
        {hover && (
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1), transparent 40%)`,
            }}
          />
        )}
        
        {children}
      </motion.div>
    )
  },
)

GlassCard.displayName = 'GlassCard'

// ═══════════════════════════════════════════════════════════════════════════════
// GLASS SURFACE - Simpler Glass Container
// ═══════════════════════════════════════════════════════════════════════════════

interface GlassSurfaceProps {
  children: ReactNode
  className?: string
  intensity?: 'light' | 'medium' | 'heavy'
}

export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(
  ({ children, className, intensity = 'medium' }, ref) => {
    const intensityStyles = {
      light: 'bg-white/5 backdrop-blur-sm border-white/10',
      medium: 'bg-white/10 backdrop-blur-md border-white/15',
      heavy: 'bg-white/15 backdrop-blur-xl border-white/20',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border',
          intensityStyles[intensity],
          className,
        )}
      >
        {children}
      </div>
    )
  },
)

GlassSurface.displayName = 'GlassSurface'

// ═══════════════════════════════════════════════════════════════════════════════
// PREMIUM BUTTON - Apple Style
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  onClick?: () => void
  fullWidth?: boolean
}

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    className, 
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    onClick,
    fullWidth = false,
  }, ref) => {
    const baseStyles = 'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variantStyles = {
      primary: 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 focus-visible:ring-blue-500',
      secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 focus-visible:ring-white/50',
      ghost: 'text-white/80 hover:text-white hover:bg-white/10 focus-visible:ring-white/30',
      danger: 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 focus-visible:ring-red-500',
      success: 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 focus-visible:ring-emerald-500',
    }
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-8 py-4 text-base gap-3',
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        disabled={disabled || loading}
        onClick={onClick}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className,
        )}
      >
        {/* Shimmer effect on primary */}
        {variant === 'primary' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
            animate={{ x: ['0%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          />
        )}
        
        {loading && (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        )}
        
        {!loading && icon && iconPosition === 'left' && icon}
        <span className="relative z-10">{children}</span>
        {!loading && icon && iconPosition === 'right' && icon}
      </motion.button>
    )
  },
)

PremiumButton.displayName = 'PremiumButton'

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER - Tesla Style
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
  format?: 'number' | 'currency' | 'percentage'
  decimals?: number
}

export const AnimatedCounter = ({ 
  value, 
  prefix = '', 
  suffix = '', 
  duration = 1.5,
  className,
  format = 'number',
  decimals = 0,
}: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(0)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { 
    damping: 30, 
    stiffness: 100,
    duration: duration * 1000, 
  })

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(latest)
    })
    return () => unsubscribe()
  }, [springValue])

  const formatValue = (val: number) => {
    const fixed = val.toFixed(decimals)
    switch (format) {
      case 'currency':
        return `$${parseFloat(fixed).toLocaleString('es-MX')}`
      case 'percentage':
        return `${fixed}%`
      default:
        return parseFloat(fixed).toLocaleString('es-MX')
    }
  }

  return (
    <motion.span 
      className={cn('tabular-nums font-bold', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}{formatValue(displayValue)}{suffix}
    </motion.span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOW ORB - Ambient Light Effect
// ═══════════════════════════════════════════════════════════════════════════════

interface GlowOrbProps {
  color?: string
  size?: number
  position?: { top?: string; left?: string; right?: string; bottom?: string }
  blur?: number
  opacity?: number
  animate?: boolean
}

export const GlowOrb = ({
  color = 'rgba(59, 130, 246, 0.4)',
  size = 400,
  position = { top: '50%', left: '50%' },
  blur = 80,
  opacity = 0.4,
  animate = true,
}: GlowOrbProps) => {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity,
        ...position,
        transform: 'translate(-50%, -50%)',
      }}
      animate={animate ? {
        scale: [1, 1.2, 1],
        opacity: [opacity, opacity * 0.6, opacity],
      } : undefined}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREMIUM INPUT - Stripe Style
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumInputProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'number' | 'tel'
  icon?: ReactNode
  error?: string
  helper?: string
  className?: string
  disabled?: boolean
}

export const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  ({ label, placeholder, value, onChange, type = 'text', icon, error, helper, className, disabled }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    return (
      <motion.div 
        className={cn('relative', className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {label && (
          <label className="block text-sm font-medium text-white/70 mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              {icon}
            </div>
          )}
          
          <motion.input
            ref={ref}
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30',
              'transition-all duration-300 outline-none',
              'focus:bg-white/10 focus:border-blue-500/50',
              icon && 'pl-12',
              error ? 'border-red-500/50' : 'border-white/10',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            animate={{
              boxShadow: isFocused 
                ? '0 0 0 4px rgba(59, 130, 246, 0.1)' 
                : '0 0 0 0px rgba(59, 130, 246, 0)',
            }}
          />
          
          {/* Focus glow */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 -z-10 rounded-xl bg-blue-500/5 blur-xl"
              />
            )}
          </AnimatePresence>
        </div>
        
        {(error || helper) && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-2 text-sm',
              error ? 'text-red-400' : 'text-white/50',
            )}
          >
            {error || helper}
          </motion.p>
        )}
      </motion.div>
    )
  },
)

PremiumInput.displayName = 'PremiumInput'

// ═══════════════════════════════════════════════════════════════════════════════
// MAGNETIC BUTTON - Interactive Premium Effect
// ═══════════════════════════════════════════════════════════════════════════════

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export const MagneticButton = ({ children, className, onClick }: MagneticButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.2)
    y.set((e.clientY - centerY) * 0.2)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const springX = useSpring(x, { stiffness: 150, damping: 15 })
  const springY = useSpring(y, { stiffness: 150, damping: 15 })

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative inline-flex items-center justify-center px-6 py-3 rounded-xl',
        'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold',
        'shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40',
        'transition-shadow duration-300',
        className,
      )}
    >
      {children}
    </motion.button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR PREMIUM
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumProgressProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'rose'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const PremiumProgress = ({
  value,
  max = 100,
  label,
  showValue = true,
  color = 'blue',
  size = 'md',
  className,
}: PremiumProgressProps) => {
  const percentage = Math.min((value / max) * 100, 100)
  
  const colorStyles = {
    blue: 'from-blue-500 to-cyan-400',
    green: 'from-emerald-500 to-teal-400',
    purple: 'from-purple-500 to-pink-400',
    amber: 'from-amber-500 to-orange-400',
    rose: 'from-rose-500 to-red-400',
  }

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-white/70">{label}</span>}
          {showValue && (
            <AnimatedCounter 
              value={percentage} 
              suffix="%" 
              decimals={0}
              className="text-sm text-white/90"
            />
          )}
        </div>
      )}
      
      <div className={cn(
        'w-full bg-white/10 rounded-full overflow-hidden',
        sizeStyles[size],
      )}>
        <motion.div
          className={cn(
            'h-full rounded-full bg-gradient-to-r',
            colorStyles[color],
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="h-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '500%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        </motion.div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED BADGE
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedBadgeProps {
  children: ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  pulse?: boolean
  className?: string
}

export const AnimatedBadge = ({
  children,
  variant = 'neutral',
  pulse = false,
  className,
}: AnimatedBadgeProps) => {
  const variantStyles = {
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    neutral: 'bg-white/10 text-white/80 border-white/20',
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
        variantStyles[variant],
        className,
      )}
    >
      {pulse && (
        <motion.span
          className={cn(
            'w-2 h-2 rounded-full',
            variant === 'success' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'danger' && 'bg-red-400',
            variant === 'info' && 'bg-blue-400',
            variant === 'neutral' && 'bg-white/60',
          )}
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      {children}
    </motion.span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON LOADER PREMIUM
// ═══════════════════════════════════════════════════════════════════════════════

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export const Skeleton = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'wave',
}: SkeletonProps) => {
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  }

  return (
    <motion.div
      className={cn(
        'relative bg-white/10 overflow-hidden',
        variantStyles[variant],
        className,
      )}
      style={{ width, height }}
    >
      {animation === 'wave' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {animation === 'pulse' && (
        <motion.div
          className="absolute inset-0 bg-white/5"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLTIP PREMIUM
// ═══════════════════════════════════════════════════════════════════════════════

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 200,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 px-3 py-2 text-sm text-white bg-black/90 backdrop-blur-xl',
              'rounded-lg border border-white/10 shadow-xl whitespace-nowrap',
              positionStyles[position],
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT TEXT - Premium Gradient Text
// ═══════════════════════════════════════════════════════════════════════════════

interface GradientTextProps {
  children: ReactNode
  className?: string
  gradient?: 'blue' | 'purple' | 'gold' | 'emerald' | 'rainbow'
}

export const GradientText = ({ 
  children, 
  className,
  gradient = 'blue',
}: GradientTextProps) => {
  const gradients = {
    blue: 'from-blue-400 via-cyan-400 to-blue-600',
    purple: 'from-purple-400 via-pink-400 to-purple-600',
    gold: 'from-yellow-400 via-amber-400 to-orange-500',
    emerald: 'from-emerald-400 via-green-400 to-teal-500',
    rainbow: 'from-red-400 via-yellow-400 to-blue-500',
  }

  return (
    <span 
      className={cn(
        'bg-gradient-to-r bg-clip-text text-transparent',
        gradients[gradient],
        className,
      )}
    >
      {children}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE TRANSITION - Wrapper for Page Animations
// ═══════════════════════════════════════════════════════════════════════════════

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export const PageTransition = ({ children, className }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHIMMER LOADER - Loading Shimmer Effect
// ═══════════════════════════════════════════════════════════════════════════════

interface ShimmerLoaderProps {
  className?: string
  width?: string | number
  height?: string | number
}

export const ShimmerLoader = ({ className, width, height }: ShimmerLoaderProps) => {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-lg bg-white/10',
        className,
      )}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  )
}

// Animation variants already exported above with their definitions
// Todos los componentes se exportan con named exports arriba
