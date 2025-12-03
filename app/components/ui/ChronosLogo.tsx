'use client'

import { motion } from 'framer-motion'
import { cn } from '@/app/lib/utils'

interface ChronosLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  animated?: boolean
  glow?: boolean
  className?: string
  color?: string
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
  '2xl': 128,
}

/**
 * 🌟 CHRONOS Logo - Símbolo Premium
 * 
 * Estrella con líneas verticales atravesando un aro orbital
 * Inspiración: Diseño minimalista futurista estilo Apple/Tesla
 */
export function ChronosLogo({
  size = 'md',
  animated = true,
  glow = true,
  className,
  color = '#FFFFFF',
}: ChronosLogoProps) {
  const dimension = sizeMap[size]
  const strokeWidth = dimension < 48 ? 1.5 : 2

  return (
    <motion.div
      className={cn('relative inline-flex items-center justify-center', className)}
      initial={animated ? { opacity: 0, scale: 0.8 } : false}
      animate={animated ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Glow effect */}
      {glow && (
        <div
          className="absolute inset-0 blur-xl opacity-30"
          style={{
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          }}
        />
      )}

      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Estrella superior - 4 puntas */}
        <motion.path
          d="M50 8 L53 20 L50 32 L47 20 Z"
          fill={color}
          initial={animated ? { opacity: 0, y: -10 } : false}
          animate={animated ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.1, duration: 0.4 }}
        />
        <motion.path
          d="M50 20 L62 23 L50 26 L38 23 Z"
          fill={color}
          initial={animated ? { opacity: 0, scale: 0 } : false}
          animate={animated ? { opacity: 1, scale: 1 } : false}
          transition={{ delay: 0.2, duration: 0.4 }}
        />

        {/* Líneas verticales principales */}
        <motion.line
          x1="50"
          y1="26"
          x2="50"
          y2="92"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={animated ? { pathLength: 0 } : false}
          animate={animated ? { pathLength: 1 } : false}
          transition={{ delay: 0.3, duration: 0.6 }}
        />
        <motion.line
          x1="42"
          y1="35"
          x2="42"
          y2="85"
          stroke={color}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          opacity={0.7}
          initial={animated ? { pathLength: 0 } : false}
          animate={animated ? { pathLength: 1 } : false}
          transition={{ delay: 0.4, duration: 0.5 }}
        />
        <motion.line
          x1="58"
          y1="35"
          x2="58"
          y2="85"
          stroke={color}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          opacity={0.7}
          initial={animated ? { pathLength: 0 } : false}
          animate={animated ? { pathLength: 1 } : false}
          transition={{ delay: 0.4, duration: 0.5 }}
        />

        {/* Líneas exteriores más sutiles */}
        <motion.line
          x1="35"
          y1="42"
          x2="35"
          y2="78"
          stroke={color}
          strokeWidth={strokeWidth * 0.5}
          strokeLinecap="round"
          opacity={0.4}
          initial={animated ? { pathLength: 0 } : false}
          animate={animated ? { pathLength: 1 } : false}
          transition={{ delay: 0.5, duration: 0.4 }}
        />
        <motion.line
          x1="65"
          y1="42"
          x2="65"
          y2="78"
          stroke={color}
          strokeWidth={strokeWidth * 0.5}
          strokeLinecap="round"
          opacity={0.4}
          initial={animated ? { pathLength: 0 } : false}
          animate={animated ? { pathLength: 1 } : false}
          transition={{ delay: 0.5, duration: 0.4 }}
        />

        {/* Aro orbital */}
        <motion.ellipse
          cx="50"
          cy="55"
          rx="28"
          ry="8"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          initial={animated ? { opacity: 0, scale: 0.8 } : false}
          animate={animated ? { opacity: 1, scale: 1 } : false}
          transition={{ delay: 0.6, duration: 0.5 }}
        />
      </svg>
    </motion.div>
  )
}

/**
 * Logo con texto CHRONOS
 */
export function ChronosLogoFull({
  size = 'md',
  animated = true,
  className,
}: Omit<ChronosLogoProps, 'glow'>) {
  const textSize = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
  }

  return (
    <motion.div
      className={cn('flex items-center gap-2', className)}
      initial={animated ? { opacity: 0 } : false}
      animate={animated ? { opacity: 1 } : false}
    >
      <ChronosLogo size={size} animated={animated} glow />
      <motion.span
        className={cn(
          'font-bold tracking-[0.2em] text-white',
          textSize[size],
        )}
        initial={animated ? { opacity: 0, x: -10 } : false}
        animate={animated ? { opacity: 1, x: 0 } : false}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        CHRONOS
      </motion.span>
    </motion.div>
  )
}

export default ChronosLogo
