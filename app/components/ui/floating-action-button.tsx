'use client'

/**
 * 💎 FLOATING ACTION BUTTON - Tesla/Apple 2025 Design
 * 
 * Botón flotante premium estilo Tesla/Apple para acciones principales.
 * 
 * Características:
 * - Posición fija flotante con sombra premium
 * - Efecto glow animado
 * - Haptic feedback opcional
 * - Variantes de color (primary, danger, success, etc.)
 * - Soporte para ícono y texto
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/app/lib/utils'

interface FloatingActionButtonProps {
  /** Variante de color */
  variant?: 'primary' | 'danger' | 'success' | 'warning' | 'secondary'
  /** Posición en la pantalla */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right'
  /** Icono a mostrar (por defecto Plus) */
  icon?: React.ReactNode
  /** Texto opcional (si se muestra, el botón se expande) */
  label?: string
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg'
  /** Si está en estado de carga */
  isLoading?: boolean
  /** Efecto pulse animado */
  pulse?: boolean
  /** Handler de click */
  onClick?: () => void
  /** Si está deshabilitado */
  disabled?: boolean
  /** Clases adicionales */
  className?: string
  /** Tipo del botón */
  type?: 'button' | 'submit' | 'reset'
  /** Aria label */
  'aria-label'?: string
}

const VARIANTS = {
  primary: {
    bg: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500',
    shadow: 'shadow-[0_8px_32px_rgba(59,130,246,0.4),0_0_0_1px_rgba(59,130,246,0.3)]',
    glow: 'from-blue-500/30 to-cyan-500/30',
  },
  danger: {
    bg: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500',
    shadow: 'shadow-[0_8px_32px_rgba(239,68,68,0.4),0_0_0_1px_rgba(239,68,68,0.3)]',
    glow: 'from-red-500/30 to-rose-500/30',
  },
  success: {
    bg: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500',
    shadow: 'shadow-[0_8px_32px_rgba(16,185,129,0.4),0_0_0_1px_rgba(16,185,129,0.3)]',
    glow: 'from-emerald-500/30 to-green-500/30',
  },
  warning: {
    bg: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500',
    shadow: 'shadow-[0_8px_32px_rgba(245,158,11,0.4),0_0_0_1px_rgba(245,158,11,0.3)]',
    glow: 'from-amber-500/30 to-orange-500/30',
  },
  secondary: {
    bg: 'bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500',
    shadow: 'shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.1)]',
    glow: 'from-white/10 to-white/5',
  },
}

const POSITIONS = {
  'bottom-right': 'fixed bottom-6 right-6 md:bottom-8 md:right-8',
  'bottom-left': 'fixed bottom-6 left-6 md:bottom-8 md:left-8',
  'bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2 md:bottom-8',
  'top-right': 'fixed top-6 right-6 md:top-8 md:right-8',
}

const SIZES = {
  sm: 'h-12 w-12 md:h-14 md:w-14',
  md: 'h-14 w-14 md:h-16 md:w-16',
  lg: 'h-16 w-16 md:h-20 md:w-20',
}

const ICON_SIZES = {
  sm: 'h-5 w-5 md:h-6 md:w-6',
  md: 'h-6 w-6 md:h-8 md:w-8',
  lg: 'h-8 w-8 md:h-10 md:w-10',
}

export function FloatingActionButton({
  variant = 'primary',
  position = 'bottom-right',
  icon,
  label,
  size = 'md',
  isLoading = false,
  pulse = false,
  className,
  disabled,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
}: FloatingActionButtonProps) {
  const variantStyles = VARIANTS[variant]
  const hasLabel = !!label
  
  return (
    <motion.button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-label={ariaLabel || label || 'Acción'}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        // Posición
        POSITIONS[position],
        'z-50',
        
        // Tamaño base (se expande con label)
        hasLabel ? 'h-14 px-6 rounded-full' : cn(SIZES[size], 'rounded-full'),
        
        // Colores y gradientes
        variantStyles.bg,
        
        // Sombra premium
        variantStyles.shadow,
        'hover:shadow-2xl',
        
        // Texto
        'text-white font-semibold',
        
        // Flex
        'flex items-center justify-center gap-2',
        
        // Transiciones
        'transition-all duration-200',
        
        // Estados
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-4 focus:ring-white/20',
        
        className,
      )}
    >
      {/* Glow effect de fondo */}
      <span 
        className={cn(
          'absolute inset-0 rounded-full blur-xl opacity-50',
          `bg-gradient-to-r ${variantStyles.glow}`,
          pulse && 'animate-pulse',
        )}
      />
      
      {/* Pulse ring animado */}
      {pulse && (
        <span 
          className={cn(
            'absolute inset-0 rounded-full',
            variantStyles.bg,
            'animate-ping opacity-20',
          )}
        />
      )}
      
      {/* Contenido */}
      <span className="relative flex items-center justify-center gap-2">
        {isLoading ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <svg 
              className={cn(ICON_SIZES[size])} 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </motion.span>
        ) : (
          icon || <Plus className={cn(ICON_SIZES[size])} />
        )}
        {hasLabel && (
          <span className="text-sm md:text-base">{label}</span>
        )}
      </span>
    </motion.button>
  )
}

/**
 * Hook para añadir haptic feedback al FAB
 */
export function useHapticFeedback() {
  const trigger = React.useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      const durations = {
        light: 10,
        medium: 20,
        heavy: 30,
      }
      navigator.vibrate(durations[type])
    }
  }, [])
  
  return { trigger }
}

export default FloatingActionButton
