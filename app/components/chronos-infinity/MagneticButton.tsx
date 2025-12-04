'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🎯 MAGNETIC BUTTON - BOTÓN PREMIUM CON EFECTO MAGNÉTICO
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Botón interactivo con efecto magnético que "atrae" el cursor
 * Glow dinámico, ripple effect y haptic feedback visual
 * 
 * PALETA CHRONOS INFINITY (CYAN PROHIBIDO):
 * - Violeta Real: #8B00FF
 * - Oro Líquido: #FFD700
 * - Rosa Eléctrico: #FF1493
 * 
 * Inspirado en: Apple Vision Pro + Linear + Arc Browser
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { 
  useRef, 
  useState, 
  useCallback, 
  memo,
  ReactNode,
  ButtonHTMLAttributes,
  forwardRef,
} from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════════════════
export interface MagneticButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  children: ReactNode
  /** Variante de color */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'gold'
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Intensidad del efecto magnético */
  magneticIntensity?: number
  /** Mostrar efecto ripple */
  showRipple?: boolean
  /** Mostrar glow */
  showGlow?: boolean
  /** Estado de carga */
  isLoading?: boolean
  /** Icono izquierdo */
  leftIcon?: ReactNode
  /** Icono derecho */
  rightIcon?: ReactNode
  /** Variante de borde */
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

// ════════════════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE ESTILOS
// ════════════════════════════════════════════════════════════════════════════════════════
const VARIANT_STYLES = {
  primary: {
    background: 'linear-gradient(135deg, #8B00FF 0%, #6B00CC 100%)',
    hoverBackground: 'linear-gradient(135deg, #9B10FF 0%, #7B10DC 100%)',
    borderColor: 'rgba(139, 0, 255, 0.5)',
    glowColor: 'rgba(139, 0, 255, 0.5)',
    textColor: '#FFFFFF',
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.05)',
    hoverBackground: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    glowColor: 'rgba(255, 255, 255, 0.2)',
    textColor: '#FFFFFF',
  },
  ghost: {
    background: 'transparent',
    hoverBackground: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'transparent',
    glowColor: 'rgba(139, 0, 255, 0.3)',
    textColor: 'rgba(255, 255, 255, 0.8)',
  },
  danger: {
    background: 'linear-gradient(135deg, #FF1493 0%, #CC1076 100%)',
    hoverBackground: 'linear-gradient(135deg, #FF24A3 0%, #DC2086 100%)',
    borderColor: 'rgba(255, 20, 147, 0.5)',
    glowColor: 'rgba(255, 20, 147, 0.5)',
    textColor: '#FFFFFF',
  },
  success: {
    background: 'linear-gradient(135deg, #00FF87 0%, #00CC6B 100%)',
    hoverBackground: 'linear-gradient(135deg, #10FF97 0%, #10DC7B 100%)',
    borderColor: 'rgba(0, 255, 135, 0.5)',
    glowColor: 'rgba(0, 255, 135, 0.5)',
    textColor: '#000000',
  },
  gold: {
    background: 'linear-gradient(135deg, #FFD700 0%, #CCA800 100%)',
    hoverBackground: 'linear-gradient(135deg, #FFE710 0%, #DCB810 100%)',
    borderColor: 'rgba(255, 215, 0, 0.5)',
    glowColor: 'rgba(255, 215, 0, 0.5)',
    textColor: '#000000',
  },
} as const

const SIZE_STYLES = {
  sm: { 
    padding: '8px 16px', 
    fontSize: '13px', 
    height: '32px',
    iconSize: 14,
  },
  md: { 
    padding: '10px 20px', 
    fontSize: '14px', 
    height: '40px',
    iconSize: 16,
  },
  lg: { 
    padding: '12px 24px', 
    fontSize: '16px', 
    height: '48px',
    iconSize: 18,
  },
  xl: { 
    padding: '16px 32px', 
    fontSize: '18px', 
    height: '56px',
    iconSize: 20,
  },
} as const

const ROUNDED_STYLES = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  full: '9999px',
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// SPRING CONFIG
// ════════════════════════════════════════════════════════════════════════════════════════
const SPRING_CONFIG = {
  stiffness: 200,
  damping: 20,
  mass: 0.5,
}

// ════════════════════════════════════════════════════════════════════════════════════════
// RIPPLE COMPONENT
// ════════════════════════════════════════════════════════════════════════════════════════
interface Ripple {
  id: number
  x: number
  y: number
}

const RippleEffect = memo(function RippleEffect({ 
  ripples, 
  color,
}: { 
  ripples: Ripple[]
  color: string
}) {
  return (
    <AnimatePresence>
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            backgroundColor: color,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{ width: 400, height: 400, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      ))}
    </AnimatePresence>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// LOADING SPINNER
// ════════════════════════════════════════════════════════════════════════════════════════
const LoadingSpinner = memo(function LoadingSpinner({ size }: { size: number }) {
  return (
    <motion.svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </motion.svg>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════
const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  function MagneticButton(
    {
      children,
      variant = 'primary',
      size = 'md',
      magneticIntensity = 0.4,
      showRipple = true,
      showGlow = true,
      isLoading = false,
      leftIcon,
      rightIcon,
      rounded = 'md',
      className = '',
      disabled,
      onClick,
      onMouseMove,
      onMouseLeave,
      ...props
    },
    ref
  ) {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [ripples, setRipples] = useState<Ripple[]>([])
    
    // Motion values para efecto magnético
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    
    // Springs para movimiento suave
    const springX = useSpring(mouseX, SPRING_CONFIG)
    const springY = useSpring(mouseY, SPRING_CONFIG)
    
    // Estilos
    const variantStyles = VARIANT_STYLES[variant]
    const sizeStyles = SIZE_STYLES[size]
    const borderRadius = ROUNDED_STYLES[rounded]
    
    // Handlers
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return
      
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const deltaX = (e.clientX - centerX) * magneticIntensity
      const deltaY = (e.clientY - centerY) * magneticIntensity
      
      mouseX.set(deltaX)
      mouseY.set(deltaY)
      
      onMouseMove?.(e)
    }, [disabled, isLoading, magneticIntensity, mouseX, mouseY, onMouseMove])
    
    const handleMouseEnter = useCallback(() => {
      if (!disabled && !isLoading) {
        setIsHovered(true)
      }
    }, [disabled, isLoading])
    
    const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovered(false)
      mouseX.set(0)
      mouseY.set(0)
      onMouseLeave?.(e)
    }, [mouseX, mouseY, onMouseLeave])
    
    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return
      
      // Crear ripple
      if (showRipple) {
        const rect = buttonRef.current?.getBoundingClientRect()
        if (rect) {
          const ripple: Ripple = {
            id: Date.now(),
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          }
          setRipples((prev) => [...prev, ripple])
          setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
          }, 800)
        }
      }
      
      onClick?.(e)
    }, [disabled, isLoading, showRipple, onClick])
    
    return (
      <motion.button
        ref={(node) => {
          (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        className={`
          relative inline-flex items-center justify-center gap-2
          font-medium transition-colors
          outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          focus-visible:ring-offset-black focus-visible:ring-violet-500
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        style={{
          padding: sizeStyles.padding,
          height: sizeStyles.height,
          fontSize: sizeStyles.fontSize,
          borderRadius,
          background: isHovered ? variantStyles.hoverBackground : variantStyles.background,
          border: `1px solid ${variantStyles.borderColor}`,
          color: variantStyles.textColor,
          boxShadow: showGlow && isHovered
            ? `0 0 30px ${variantStyles.glowColor}, 0 4px 20px rgba(0, 0, 0, 0.3)`
            : '0 2px 10px rgba(0, 0, 0, 0.2)',
          x: springX,
          y: springY,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        disabled={disabled || isLoading}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        type={props.type}
        aria-label={props['aria-label']}
        aria-disabled={props['aria-disabled']}
        tabIndex={props.tabIndex}
      >
        {/* Ripple container */}
        {showRipple && (
          <span className="absolute inset-0 overflow-hidden" style={{ borderRadius }}>
            <RippleEffect 
              ripples={ripples} 
              color={`${variantStyles.glowColor.replace('0.5', '0.3')}`} 
            />
          </span>
        )}
        
        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? (
            <LoadingSpinner size={sizeStyles.iconSize} />
          ) : (
            leftIcon && (
              <span className="flex-shrink-0" style={{ fontSize: sizeStyles.iconSize }}>
                {leftIcon}
              </span>
            )
          )}
          
          <span>{children}</span>
          
          {rightIcon && !isLoading && (
            <span className="flex-shrink-0" style={{ fontSize: sizeStyles.iconSize }}>
              {rightIcon}
            </span>
          )}
        </span>
        
        {/* Shine effect on hover */}
        <motion.span
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius,
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
          }}
          initial={{ x: '-100%' }}
          animate={{ x: isHovered ? '100%' : '-100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </motion.button>
    )
  }
)

export default memo(MagneticButton)

// ════════════════════════════════════════════════════════════════════════════════════════
// VARIANTES ESPECIALIZADAS
// ════════════════════════════════════════════════════════════════════════════════════════

export const PrimaryButton = memo(function PrimaryButton(
  props: Omit<MagneticButtonProps, 'variant'>
) {
  return <MagneticButton {...props} variant="primary" />
})

export const SecondaryButton = memo(function SecondaryButton(
  props: Omit<MagneticButtonProps, 'variant'>
) {
  return <MagneticButton {...props} variant="secondary" />
})

export const GhostButton = memo(function GhostButton(
  props: Omit<MagneticButtonProps, 'variant'>
) {
  return <MagneticButton {...props} variant="ghost" />
})

export const GoldButton = memo(function GoldButton(
  props: Omit<MagneticButtonProps, 'variant'>
) {
  return <MagneticButton {...props} variant="gold" />
})

export const DangerButton = memo(function DangerButton(
  props: Omit<MagneticButtonProps, 'variant'>
) {
  return <MagneticButton {...props} variant="danger" />
})

// Export named para compatibilidad
export { MagneticButton }
