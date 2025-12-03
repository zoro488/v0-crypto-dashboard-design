'use client'

import { motion } from 'framer-motion'
import { memo, forwardRef, ReactNode } from 'react'

type ButtonVariant = 'magma' | 'plasma' | 'obsidian' | 'sapphire' | 'amethyst' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ObsidianButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
  className?: string
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

/**
 * ObsidianButton - Botones Premium con efectos Magma/Plasma
 * 
 * Variantes:
 * - magma: Degradado rojo-naranja con brillo de magma líquido
 * - plasma: Verde esmeralda con energía eléctrica
 * - sapphire: Azul zafiro brillante
 * - amethyst: Púrpura amatista
 * - obsidian: Vidrio oscuro neutral
 * - ghost: Transparente con borde sutil
 */
export const ObsidianButton = memo(forwardRef<HTMLButtonElement, ObsidianButtonProps>(
  function ObsidianButton(
    {
      variant = 'plasma',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    const sizeStyles = {
      sm: 'px-4 py-2 text-sm gap-1.5',
      md: 'px-6 py-3 text-base gap-2',
      lg: 'px-8 py-4 text-lg gap-2.5',
      xl: 'px-10 py-5 text-xl gap-3',
    }
    
    const variantStyles = {
      magma: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
        glow: 'rgba(239, 68, 68, 0.5)',
        hoverGlow: 'rgba(239, 68, 68, 0.7)',
        shimmer: 'rgba(255, 200, 100, 0.3)',
      },
      plasma: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
        glow: 'rgba(16, 185, 129, 0.5)',
        hoverGlow: 'rgba(16, 185, 129, 0.7)',
        shimmer: 'rgba(150, 255, 200, 0.3)',
      },
      sapphire: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
        glow: 'rgba(59, 130, 246, 0.5)',
        hoverGlow: 'rgba(59, 130, 246, 0.7)',
        shimmer: 'rgba(150, 200, 255, 0.3)',
      },
      amethyst: {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
        glow: 'rgba(139, 92, 246, 0.5)',
        hoverGlow: 'rgba(139, 92, 246, 0.7)',
        shimmer: 'rgba(200, 150, 255, 0.3)',
      },
      obsidian: {
        background: 'rgba(20, 20, 28, 0.8)',
        glow: 'rgba(0, 0, 0, 0.3)',
        hoverGlow: 'rgba(255, 255, 255, 0.1)',
        shimmer: 'rgba(255, 255, 255, 0.1)',
      },
      ghost: {
        background: 'transparent',
        glow: 'transparent',
        hoverGlow: 'rgba(255, 255, 255, 0.05)',
        shimmer: 'rgba(255, 255, 255, 0.05)',
      },
    }
    
    const style = variantStyles[variant]
    const isGhost = variant === 'ghost'
    const isObsidian = variant === 'obsidian'
    const isPremium = !isGhost && !isObsidian
    
    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        className={`
          relative inline-flex items-center justify-center
          font-semibold rounded-2xl
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          outline-none focus:outline-none
          ${className}
        `}
        style={{
          background: style.background,
          backdropFilter: isObsidian || isGhost ? 'blur(16px)' : undefined,
          color: '#ffffff',
          boxShadow: isPremium
            ? `
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              0 8px 24px -4px ${style.glow},
              0 4px 12px -2px rgba(0, 0, 0, 0.3)
            `
            : isObsidian
            ? `
              inset 1px 1px 0 0 rgba(255, 255, 255, 0.08),
              inset -1px -1px 0 0 rgba(0, 0, 0, 0.3),
              0 4px 12px -4px rgba(0, 0, 0, 0.4)
            `
            : `
              inset 0 0 0 1px rgba(255, 255, 255, 0.1)
            `,
        }}
        whileHover={!disabled && !loading ? {
          y: -2,
          scale: 1.02,
          boxShadow: isPremium
            ? `
              inset 0 1px 0 rgba(255, 255, 255, 0.25),
              0 12px 32px -4px ${style.hoverGlow},
              0 6px 16px -2px rgba(0, 0, 0, 0.4)
            `
            : isObsidian
            ? `
              inset 1px 1px 0 0 rgba(255, 255, 255, 0.12),
              inset -1px -1px 0 0 rgba(0, 0, 0, 0.3),
              0 6px 16px -4px rgba(0, 0, 0, 0.5)
            `
            : `
              inset 0 0 0 1px rgba(255, 255, 255, 0.2),
              0 4px 12px -4px rgba(255, 255, 255, 0.1)
            `,
        } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.98, y: 0 } : undefined}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
        onClick={props.onClick}
        type={props.type || 'button'}
      >
        {/* Gradiente superior (brillo) */}
        {isPremium && (
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
            }}
          />
        )}
        
        {/* Efecto shimmer/magma pulse */}
        {isPremium && !loading && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <motion.div
              className="absolute inset-[-50%]"
              style={{
                background: `radial-gradient(circle at center, ${style.shimmer} 0%, transparent 50%)`,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        )}
        
        {/* Borde para obsidian/ghost */}
        {(isObsidian || isGhost) && (
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              padding: '1px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
        )}
        
        {/* Contenido */}
        <span className="relative flex items-center gap-2">
          {loading ? (
            <motion.span
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <span className="flex-shrink-0">{icon}</span>
              )}
              <span>{children}</span>
              {icon && iconPosition === 'right' && (
                <span className="flex-shrink-0">{icon}</span>
              )}
            </>
          )}
        </span>
      </motion.button>
    )
  },
))

export default ObsidianButton
