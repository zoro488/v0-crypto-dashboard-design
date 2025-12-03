'use client'

/**
 * CHRONOS 2026 - FAB (Floating Action Button) Premium
 * Botón flotante principal con animación de entrada épica
 * 
 * Features:
 * - Spring animation entrada
 * - Rotación al abrir
 * - Glow pulsante
 * - Ripple effect
 * - Haptic feedback ready
 */

import { memo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHRONOS_COLORS, CHRONOS_ANIMATIONS } from '@/app/lib/constants/chronos-2026'

interface FABProps {
  onClick?: () => void
  isOpen?: boolean
  className?: string
  size?: 'md' | 'lg'
  variant?: 'primary' | 'accent'
}

function FAB({
  onClick,
  isOpen = false,
  className = '',
  size = 'lg',
  variant = 'primary',
}: FABProps) {
  const [isPressed, setIsPressed] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  
  const sizeConfig = {
    md: 'h-12 w-12 lg:h-14 lg:w-14',
    lg: 'h-14 w-14 lg:h-16 lg:w-16',
  }
  
  const iconSize = {
    md: 'w-6 h-6',
    lg: 'w-7 h-7 lg:w-8 lg:h-8',
  }
  
  const gradient = variant === 'primary' 
    ? CHRONOS_COLORS.gradientPrimary 
    : `linear-gradient(135deg, ${CHRONOS_COLORS.accent} 0%, ${CHRONOS_COLORS.primary} 100%)`
  
  const glowColor = variant === 'primary' 
    ? CHRONOS_COLORS.primary 
    : CHRONOS_COLORS.accent
  
  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={prefersReducedMotion ? {} : {
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: 0.3,
      }}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        className,
      )}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: glowColor }}
        animate={prefersReducedMotion ? {} : {
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Ripple on press */}
      <AnimatePresence>
        {isPressed && !prefersReducedMotion && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 rounded-full bg-white"
          />
        )}
      </AnimatePresence>
      
      {/* Button */}
      <motion.button
        onClick={onClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        className={cn(
          'relative rounded-full',
          'flex items-center justify-center',
          'text-white shadow-2xl',
          'focus:outline-none focus:ring-2 focus:ring-white/30',
          'transition-shadow duration-300',
          sizeConfig[size],
        )}
        style={{ 
          background: gradient,
          boxShadow: `0 8px 32px ${glowColor}40`,
        }}
        aria-label={isOpen ? 'Cerrar' : 'Nuevo registro'}
      >
        {/* Icon with rotation */}
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 20, 
          }}
        >
          {isOpen ? (
            <X className={iconSize[size]} />
          ) : (
            <Plus className={iconSize[size]} />
          )}
        </motion.div>
        
        {/* Inner highlight */}
        <div 
          className="absolute inset-0 rounded-full opacity-50"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }}
        />
      </motion.button>
    </motion.div>
  )
}

export default memo(FAB)
