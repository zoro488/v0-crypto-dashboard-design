'use client'

/**
 * 🎨 PREMIUM MICROINTERACTIONS
 * 
 * Sistema de microinteracciones avanzadas para CHRONOS
 * - Haptic feedback
 * - Sound effects
 * - Visual feedback
 * - Animated counters
 * - Skeleton loaders
 * - Toast notifications premium
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Check, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/app/lib/utils'

// ============================================================================
// HAPTIC FEEDBACK
// ============================================================================

export const haptic = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(20),
  heavy: () => navigator.vibrate?.(30),
  success: () => navigator.vibrate?.([10, 50, 10]),
  error: () => navigator.vibrate?.([50, 100, 50]),
  pattern: (pattern: number[]) => navigator.vibrate?.(pattern),
}

// ============================================================================
// SOUND EFFECTS (Optional - requires audio files)
// ============================================================================

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private enabled: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('soundEffects') === 'true'
    }
  }

  preload(name: string, url: string) {
    if (typeof window === 'undefined') return
    const audio = new window.Audio(url)
    audio.preload = 'auto'
    this.sounds.set(name, audio)
  }

  play(name: string, volume = 0.3) {
    if (!this.enabled) return
    const sound = this.sounds.get(name)
    if (sound) {
      sound.volume = volume
      sound.currentTime = 0
      sound.play().catch(() => { /* ignore */ })
    }
  }

  toggle() {
    this.enabled = !this.enabled
    localStorage.setItem('soundEffects', this.enabled.toString())
  }
}

export const sounds = new SoundManager()

// Preload sounds (optional)
if (typeof window !== 'undefined') {
  sounds.preload('click', '/sounds/click.mp3')
  sounds.preload('success', '/sounds/success.mp3')
  sounds.preload('error', '/sounds/error.mp3')
  sounds.preload('hover', '/sounds/hover.mp3')
}

// ============================================================================
// ANIMATED COUNTER
// ============================================================================

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
  onComplete?: () => void
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1000,
  className = '',
  onComplete,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const startValue = displayValue
    const difference = value - startValue

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function: easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4)
      
      const current = startValue + difference * eased
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        onComplete?.()
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration, displayValue, onComplete])

  const formatted = displayValue.toFixed(decimals)

  return (
    <motion.span
      className={cn('tabular-nums', className)}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      {formatted}
      {suffix}
    </motion.span>
  )
}

// ============================================================================
// GLOW BUTTON (Premium hover effect)
// ============================================================================

interface GlowButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'success' | 'danger' | 'warning'
  disabled?: boolean
  loading?: boolean
}

export function GlowButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  disabled = false,
  loading = false,
}: GlowButtonProps) {
  const colors = {
    primary: {
      bg: 'from-blue-500 to-cyan-500',
      glow: 'rgba(59, 130, 246, 0.5)',
      hover: 'rgba(59, 130, 246, 0.8)',
    },
    success: {
      bg: 'from-green-500 to-emerald-500',
      glow: 'rgba(16, 185, 129, 0.5)',
      hover: 'rgba(16, 185, 129, 0.8)',
    },
    danger: {
      bg: 'from-red-500 to-pink-500',
      glow: 'rgba(239, 68, 68, 0.5)',
      hover: 'rgba(239, 68, 68, 0.8)',
    },
    warning: {
      bg: 'from-amber-500 to-orange-500',
      glow: 'rgba(245, 158, 11, 0.5)',
      hover: 'rgba(245, 158, 11, 0.8)',
    },
  }

  const color = colors[variant]

  const handleClick = () => {
    if (disabled || loading) return
    haptic.light()
    sounds.play('click')
    onClick?.()
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        'relative px-6 py-3 rounded-xl font-semibold text-white overflow-hidden',
        'transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
    >
      {/* Background gradient */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-r opacity-100',
          color.bg,
        )}
      />

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 opacity-0"
        style={{
          boxShadow: `0 0 40px ${color.glow}, inset 0 0 40px ${color.glow}`,
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: '-100%', opacity: 0 }}
        whileHover={{ x: '200%', opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <motion.div
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {children}
      </span>
    </motion.button>
  )
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circle' | 'rectangle'
  width?: string | number
  height?: string | number
  animate?: boolean
}

export function Skeleton({
  className = '',
  variant = 'rectangle',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClass = cn(
    'bg-gradient-to-r from-white/5 via-white/10 to-white/5',
    {
      'rounded-full': variant === 'circle',
      'rounded-lg': variant === 'rectangle',
      'rounded h-4': variant === 'text',
    },
    className,
  )

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'circle' ? width : undefined),
  }

  return (
    <motion.div
      className={baseClass}
      style={style}
      animate={
        animate
          ? {
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }
          : {}
      }
      transition={
        animate
          ? {
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }
          : {}
      }
    />
  )
}

interface SkeletonTableProps {
  rows?: number
  columns?: number
  animated?: boolean
}

export function SkeletonTable({
  rows = 5,
  columns = 6,
  animated = true,
}: SkeletonTableProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.div
          key={rowIndex}
          className="flex gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: rowIndex * 0.05 }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              width={colIndex === 0 ? '40px' : '100%'}
              height="32px"
              animate={animated}
            />
          ))}
        </motion.div>
      ))}
    </div>
  )
}

// ============================================================================
// TOAST PREMIUM
// ============================================================================

interface ToastPremiumProps {
  title: string
  description?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

export function ToastPremium({
  title,
  description,
  variant = 'info',
  duration = 3000,
  onClose,
}: ToastPremiumProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) {
          setTimeout(onClose, 300)
        }
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: <Check className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  const colors = {
    success: {
      bg: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/50',
      icon: 'text-green-400',
      glow: '0 0 30px rgba(16, 185, 129, 0.3)',
    },
    error: {
      bg: 'from-red-500/20 to-pink-500/20',
      border: 'border-red-500/50',
      icon: 'text-red-400',
      glow: '0 0 30px rgba(239, 68, 68, 0.3)',
    },
    warning: {
      bg: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/50',
      icon: 'text-amber-400',
      glow: '0 0 30px rgba(245, 158, 11, 0.3)',
    },
    info: {
      bg: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/50',
      icon: 'text-blue-400',
      glow: '0 0 30px rgba(59, 130, 246, 0.3)',
    },
  }

  const color = colors[variant]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'relative overflow-hidden rounded-2xl border backdrop-blur-xl',
            'p-4 pr-12 min-w-[300px] max-w-md',
            'bg-gradient-to-r',
            color.bg,
            color.border,
          )}
          style={{
            boxShadow: color.glow,
          }}
        >
          {/* Background effects */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          <div className="relative flex items-start gap-3">
            {/* Icon */}
            <motion.div
              className={cn('flex-shrink-0 p-1', color.icon)}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', damping: 12 }}
            >
              {icons[variant]}
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <motion.p
                className="font-semibold text-white"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {title}
              </motion.p>
              {description && (
                <motion.p
                  className="text-sm text-white/70 mt-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {description}
                </motion.p>
              )}
            </div>

            {/* Close button */}
            <motion.button
              onClick={() => {
                setIsVisible(false)
                if (onClose) {
                  setTimeout(onClose, 300)
                }
              }}
              className={cn(
                'absolute top-4 right-4',
                'w-6 h-6 rounded-lg',
                'flex items-center justify-center',
                'text-white/50 hover:text-white',
                'hover:bg-white/10',
                'transition-colors',
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Progress bar */}
          {duration > 0 && (
            <motion.div
              className={cn('absolute bottom-0 left-0 h-1', color.icon)}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// PULSE EFFECT (For highlighting new items)
// ============================================================================

interface PulseProps {
  children: React.ReactNode
  color?: string
  duration?: number
  enabled?: boolean
}

export function Pulse({
  children,
  color = 'rgba(16, 185, 129, 0.3)',
  duration = 2,
  enabled = true,
}: PulseProps) {
  if (!enabled) return <>{children}</>

  return (
    <motion.div
      className="relative"
      animate={{
        boxShadow: [
          `0 0 0 0 ${color}`,
          `0 0 20px 10px ${color}`,
          `0 0 0 0 ${color}`,
        ],
      }}
      transition={{
        duration,
        repeat: enabled ? Infinity : 0,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

// ============================================================================
// SHINE EFFECT (For cards/buttons)
// ============================================================================

interface ShineEffectProps {
  children: React.ReactNode
  trigger?: 'hover' | 'always'
  duration?: number
}

export function ShineEffect({
  children,
  trigger = 'hover',
  duration = 1,
}: ShineEffectProps) {
  return (
    <div className="relative overflow-hidden">
      {children}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        initial={{ x: '-100%' }}
        animate={trigger === 'always' ? { x: '200%' } : {}}
        whileHover={trigger === 'hover' ? { x: '200%' } : {}}
        transition={{
          duration,
          repeat: trigger === 'always' ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}

// ============================================================================
// TILT 3D EFFECT (For cards)
// ============================================================================

interface Tilt3DProps {
  children: React.ReactNode
  className?: string
  maxTilt?: number
}

export function Tilt3D({
  children,
  className = '',
  maxTilt = 10,
}: Tilt3DProps) {
  const [tiltX, setTiltX] = useState(0)
  const [tiltY, setTiltY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    setTiltX((y - 0.5) * maxTilt)
    setTiltY((0.5 - x) * maxTilt)
  }

  const handleMouseLeave = () => {
    setTiltX(0)
    setTiltY(0)
  }

  return (
    <motion.div
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tiltX,
        rotateY: tiltY,
      }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
      }}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </motion.div>
  )
}
