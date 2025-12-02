'use client'

/**
 * 🔴 BUTTON TESLA - Botón Premium Rojo Tesla 2025
 * 
 * Estándares Apple/Tesla:
 * - Ghost por defecto (texto + icono)
 * - Filled primario solo para acciones principales
 * - Rojo Tesla #E31911 para botón primario
 * - Loading spinner estilo Apple (rotating dash)
 * - Border-radius 12px
 * - Padding 10px 24px
 */

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/app/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface ButtonTeslaProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'primary' | 'secondary' | 'destructive' | 'outline'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  isLoading?: boolean
  asChild?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// SPINNER APPLE STYLE
// ═══════════════════════════════════════════════════════════════════════════

function AppleSpinner({ className }: { className?: string }) {
  return (
    <svg 
      className={cn('animate-spin', className)} 
      width="20" 
      height="20" 
      viewBox="0 0 20 20"
    >
      <circle
        cx="10"
        cy="10"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="50"
        strokeDashoffset="15"
        className="opacity-25"
      />
      <circle
        cx="10"
        cy="10"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="25 75"
        className="opacity-75"
        style={{
          transformOrigin: 'center',
          animation: 'tesla-spinner 1.4s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes tesla-spinner {
          0% { 
            stroke-dasharray: 1, 100;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 50, 100;
            stroke-dashoffset: -15;
          }
          100% {
            stroke-dasharray: 50, 100;
            stroke-dashoffset: -100;
          }
        }
      `}</style>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTILOS BASE
// ═══════════════════════════════════════════════════════════════════════════

const baseStyles = cn(
  'inline-flex items-center justify-center gap-2',
  'font-semibold text-[0.9375rem] leading-none',
  'tracking-[-0.01em]',
  'rounded-xl',
  'transition-all duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
  'disabled:pointer-events-none disabled:opacity-50',
  'active:scale-[0.98]',
  '[&_svg]:w-5 [&_svg]:h-5 [&_svg]:shrink-0',
)

const variantStyles = {
  ghost: cn(
    'bg-transparent text-[#E5E5E5]',
    'hover:bg-white/[0.06] hover:text-white',
    'focus-visible:ring-white/30',
  ),
  primary: cn(
    'bg-[#E31911] text-white',
    'shadow-[0_4px_16px_rgba(227,25,17,0.4)]',
    'hover:bg-[#FF2D22]',
    'hover:shadow-[0_8px_28px_rgba(227,25,17,0.5)]',
    'hover:-translate-y-0.5',
    'active:translate-y-0',
    'active:shadow-[0_2px_8px_rgba(227,25,17,0.4)]',
    'focus-visible:ring-[#E31911]/50',
  ),
  secondary: cn(
    'bg-transparent text-white',
    'border border-white/20',
    'hover:bg-white/[0.06] hover:border-white/30',
    'focus-visible:ring-white/30',
  ),
  destructive: cn(
    'bg-transparent text-[#E31911]',
    'border border-[#E31911]/50',
    'hover:bg-[#E31911]/10',
    'focus-visible:ring-[#E31911]/50',
  ),
  outline: cn(
    'bg-transparent text-[#E5E5E5]',
    'border border-white/10',
    'hover:bg-white/[0.04] hover:border-white/20',
    'focus-visible:ring-white/20',
  ),
}

const sizeStyles = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  default: 'h-11 px-6',
  lg: 'h-13 px-8 text-base',
  icon: 'h-11 w-11 p-0',
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export const ButtonTesla = React.forwardRef<HTMLButtonElement, ButtonTeslaProps>(
  ({ 
    className, 
    variant = 'ghost', 
    size = 'default', 
    isLoading = false,
    asChild = false,
    disabled,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          isLoading && 'cursor-wait',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <AppleSpinner className="mr-2" />
            <span className="opacity-80">
              {typeof children === 'string' ? children : 'Cargando...'}
            </span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  },
)

ButtonTesla.displayName = 'ButtonTesla'

// ═══════════════════════════════════════════════════════════════════════════
// VARIANTES MOTION (para animaciones avanzadas)
// ═══════════════════════════════════════════════════════════════════════════

interface MotionButtonTeslaProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'ghost' | 'primary' | 'secondary' | 'destructive' | 'outline'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  isLoading?: boolean
  children?: React.ReactNode
}

export const MotionButtonTesla = React.forwardRef<HTMLButtonElement, MotionButtonTeslaProps>(
  ({ 
    className, 
    variant = 'ghost', 
    size = 'default', 
    isLoading = false,
    disabled,
    children,
    ...props 
  }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          isLoading && 'cursor-wait',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <AppleSpinner className="mr-2" />
            <span className="opacity-80">
              {typeof children === 'string' ? children : 'Cargando...'}
            </span>
          </>
        ) : (
          children
        )}
      </motion.button>
    )
  },
)

MotionButtonTesla.displayName = 'MotionButtonTesla'

export default ButtonTesla
