'use client'

/**
 * CHRONOS 2026 - Status Indicator Premium
 * Indicador de estado del sistema con animación
 * 
 * Features:
 * - Pulse animation
 * - Estados múltiples
 * - Tooltip integrado
 */

import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CHRONOS_COLORS } from '@/app/lib/constants/chronos-2026'

type Status = 'online' | 'offline' | 'warning' | 'loading'

interface StatusIndicatorProps {
  status?: Status
  label?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusConfig = {
  online: {
    color: CHRONOS_COLORS.success,
    label: 'Sistema ONLINE',
    pulseColor: `${CHRONOS_COLORS.success}40`,
  },
  offline: {
    color: CHRONOS_COLORS.danger,
    label: 'Sistema OFFLINE',
    pulseColor: `${CHRONOS_COLORS.danger}40`,
  },
  warning: {
    color: CHRONOS_COLORS.warning,
    label: 'Atención',
    pulseColor: `${CHRONOS_COLORS.warning}40`,
  },
  loading: {
    color: CHRONOS_COLORS.primary,
    label: 'Cargando...',
    pulseColor: `${CHRONOS_COLORS.primary}40`,
  },
}

const sizeConfig = {
  sm: { dot: 'w-1.5 h-1.5', text: 'text-xs' },
  md: { dot: 'w-2 h-2', text: 'text-sm' },
  lg: { dot: 'w-2.5 h-2.5', text: 'text-base' },
}

function StatusIndicator({
  status = 'online',
  label,
  showLabel = true,
  size = 'md',
  className = '',
}: StatusIndicatorProps) {
  const prefersReducedMotion = useReducedMotion()
  const config = statusConfig[status]
  const sizes = sizeConfig[size]
  const displayLabel = label || config.label
  
  return (
    <div 
      className={cn(
        'flex items-center gap-2',
        className,
      )}
      role="status"
      aria-label={displayLabel}
    >
      {/* Dot with pulse */}
      <div className="relative">
        {/* Pulse ring */}
        {!prefersReducedMotion && status !== 'offline' && (
          <motion.div
            className={cn('absolute inset-0 rounded-full', sizes.dot)}
            style={{ backgroundColor: config.pulseColor }}
            animate={{
              scale: [1, 2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        
        {/* Main dot */}
        <motion.div
          className={cn('rounded-full', sizes.dot)}
          style={{ backgroundColor: config.color }}
          animate={!prefersReducedMotion && status === 'loading' ? {
            scale: [1, 1.2, 1],
          } : {}}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
      </div>
      
      {/* Label */}
      {showLabel && (
        <span 
          className={cn('font-medium', sizes.text)}
          style={{ color: config.color }}
        >
          {displayLabel}
        </span>
      )}
    </div>
  )
}

export default memo(StatusIndicator)
