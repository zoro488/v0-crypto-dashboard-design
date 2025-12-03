'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 CHRONOS BUTTON ULTRA PREMIUM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Botón premium con efectos avanzados:
 * - Gradiente dinámico con hover
 * - Ripple effect
 * - Glow pulsante
 * - Shimmer animation
 * - Glass morphism
 * - Haptic feedback visual
 * 
 * Uso: Reemplaza todos los botones de paneles
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo, forwardRef, useState, ReactNode, MouseEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'glass'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonUltraProps {
  children?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: LucideIcon | ReactNode
  iconRight?: LucideIcon | ReactNode
  fullWidth?: boolean
  pulse?: boolean
  glow?: boolean
  disabled?: boolean
  className?: string
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  name?: string
  value?: string
  'aria-label'?: string
  'aria-disabled'?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const VARIANTS: Record<ButtonVariant, {
  bg: string
  bgHover: string
  text: string
  border: string
  glow: string
  shadow: string
}> = {
  primary: {
    bg: 'linear-gradient(135deg, #0066FF 0%, #00D4FF 100%)',
    bgHover: 'linear-gradient(135deg, #0052CC 0%, #00B8E6 100%)',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(0, 102, 255, 0.5)',
    shadow: '0 4px 20px rgba(0, 102, 255, 0.4)',
  },
  secondary: {
    bg: 'rgba(255, 255, 255, 0.05)',
    bgHover: 'rgba(255, 255, 255, 0.1)',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.1)',
    glow: 'rgba(255, 255, 255, 0.2)',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  ghost: {
    bg: 'transparent',
    bgHover: 'rgba(255, 255, 255, 0.05)',
    text: 'rgba(255, 255, 255, 0.7)',
    border: 'transparent',
    glow: 'transparent',
    shadow: 'none',
  },
  danger: {
    bg: 'linear-gradient(135deg, #FF0033 0%, #FF3366 100%)',
    bgHover: 'linear-gradient(135deg, #CC0029 0%, #E62E5C 100%)',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(255, 0, 51, 0.5)',
    shadow: '0 4px 20px rgba(255, 0, 51, 0.4)',
  },
  success: {
    bg: 'linear-gradient(135deg, #00FF57 0%, #00D448 100%)',
    bgHover: 'linear-gradient(135deg, #00CC46 0%, #00B03D 100%)',
    text: '#000000',
    border: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(0, 255, 87, 0.5)',
    shadow: '0 4px 20px rgba(0, 255, 87, 0.4)',
  },
  warning: {
    bg: 'linear-gradient(135deg, #FF9500 0%, #FFB347 100%)',
    bgHover: 'linear-gradient(135deg, #E68600 0%, #E6A23C 100%)',
    text: '#000000',
    border: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(255, 149, 0, 0.5)',
    shadow: '0 4px 20px rgba(255, 149, 0, 0.4)',
  },
  glass: {
    bg: 'rgba(255, 255, 255, 0.03)',
    bgHover: 'rgba(255, 255, 255, 0.08)',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.08)',
    glow: 'rgba(0, 212, 255, 0.3)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
}

const SIZES: Record<ButtonSize, {
  height: string
  padding: string
  fontSize: string
  iconSize: number
  borderRadius: string
}> = {
  xs: { height: 'h-7', padding: 'px-2.5', fontSize: 'text-xs', iconSize: 12, borderRadius: 'rounded-lg' },
  sm: { height: 'h-8', padding: 'px-3', fontSize: 'text-xs', iconSize: 14, borderRadius: 'rounded-lg' },
  md: { height: 'h-10', padding: 'px-4', fontSize: 'text-sm', iconSize: 16, borderRadius: 'rounded-xl' },
  lg: { height: 'h-12', padding: 'px-6', fontSize: 'text-base', iconSize: 18, borderRadius: 'rounded-xl' },
  xl: { height: 'h-14', padding: 'px-8', fontSize: 'text-lg', iconSize: 20, borderRadius: 'rounded-2xl' },
}

// ═══════════════════════════════════════════════════════════════════════════
// RIPPLE EFFECT
// ═══════════════════════════════════════════════════════════════════════════

interface Ripple {
  x: number
  y: number
  id: number
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const ButtonUltra = memo(forwardRef<HTMLButtonElement, ButtonUltraProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: IconLeft,
  iconRight: IconRight,
  fullWidth = false,
  pulse = false,
  glow = true,
  className,
  disabled,
  onClick,
  type = 'button',
  name,
  value,
  'aria-label': ariaLabel,
  'aria-disabled': ariaDisabled,
}, ref) => {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [isHovered, setIsHovered] = useState(false)
  
  const styles = VARIANTS[variant]
  const sizeStyles = SIZES[size]
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return
    
    // Create ripple
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    
    setRipples(prev => [...prev, { x, y, id }])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 800)
    
    onClick?.(e)
  }
  
  const renderIcon = (Icon: LucideIcon | ReactNode, position: 'left' | 'right') => {
    if (!Icon) return null
    
    if (typeof Icon === 'function') {
      const IconComponent = Icon as LucideIcon
      return <IconComponent size={sizeStyles.iconSize} className={position === 'left' ? 'mr-2' : 'ml-2'} />
    }
    
    return <span className={position === 'left' ? 'mr-2' : 'ml-2'}>{Icon}</span>
  }
  
  return (
    <motion.button
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center font-semibold',
        'transition-all duration-200 outline-none overflow-hidden',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeStyles.height,
        sizeStyles.padding,
        sizeStyles.fontSize,
        sizeStyles.borderRadius,
        fullWidth && 'w-full',
        className,
      )}
      style={{
        background: isHovered ? styles.bgHover : styles.bg,
        color: styles.text,
        border: `1px solid ${styles.border}`,
        boxShadow: glow ? styles.shadow : 'none',
      }}
      whileHover={disabled ? {} : { y: -2, scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      disabled={disabled || loading}
      type={type}
      name={name}
      value={value}
      aria-label={ariaLabel}
      aria-disabled={ariaDisabled}
    >
      {/* Glow pulse effect */}
      {pulse && glow && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-inherit pointer-events-none"
          style={{ borderRadius: 'inherit' }}
          animate={{
            boxShadow: [
              `0 0 20px ${styles.glow}`,
              `0 0 40px ${styles.glow}`,
              `0 0 20px ${styles.glow}`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      
      {/* Shimmer effect on hover */}
      {variant !== 'ghost' && isHovered && !disabled && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          }}
        />
      )}
      
      {/* Ripples */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 10,
              height: 10,
              marginLeft: -5,
              marginTop: -5,
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 20, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
      
      {/* Top highlight line */}
      <div 
        className="absolute top-0 left-2 right-2 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        }}
      />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center">
        {loading ? (
          <Loader2 className="animate-spin" size={sizeStyles.iconSize} />
        ) : (
          <>
            {renderIcon(IconLeft, 'left')}
            {children}
            {renderIcon(IconRight, 'right')}
          </>
        )}
      </span>
    </motion.button>
  )
}))

ButtonUltra.displayName = 'ButtonUltra'

// ═══════════════════════════════════════════════════════════════════════════
// ICON BUTTON VARIANT
// ═══════════════════════════════════════════════════════════════════════════

interface IconButtonUltraProps extends Omit<ButtonUltraProps, 'children' | 'icon' | 'iconRight'> {
  icon: LucideIcon
  'aria-label': string
}

export const IconButtonUltra = memo(forwardRef<HTMLButtonElement, IconButtonUltraProps>(({
  icon: Icon,
  size = 'md',
  ...props
}, ref) => {
  const sizeStyles = SIZES[size]
  const squareSize = {
    xs: 'w-7',
    sm: 'w-8',
    md: 'w-10',
    lg: 'w-12',
    xl: 'w-14',
  }
  
  return (
    <ButtonUltra
      ref={ref}
      size={size}
      className={cn(squareSize[size], 'px-0')}
      {...props}
    >
      <Icon size={sizeStyles.iconSize} />
    </ButtonUltra>
  )
}))

IconButtonUltra.displayName = 'IconButtonUltra'

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default ButtonUltra
