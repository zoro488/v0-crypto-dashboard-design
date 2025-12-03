'use client'

/**
 * 🎨 PREMIUM VISUALIZATIONS - CHRONOS
 * 
 * Visualizaciones premium con:
 * - Gráficos 3D-like con perspectiva
 * - Animaciones fluidas Framer Motion
 * - Gradientes dinámicos
 * - Efectos de partículas
 * - WebGL-ready (Three.js compatible)
 */

import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion'
import { useEffect, useRef, useState, useMemo } from 'react'
import { cn } from '@/app/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════════
// 3D CARD WITH PERSPECTIVE - Apple Vision Pro Style
// ═══════════════════════════════════════════════════════════════════════════════

interface Card3DProps {
  children: React.ReactNode
  className?: string
  depth?: number
  glare?: boolean
}

export const Card3D = ({ children, className, depth = 10, glare = true }: Card3DProps) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useTransform(y, [-100, 100], [depth, -depth])
  const rotateY = useTransform(x, [-100, 100], [-depth, depth])

  const springConfig = { stiffness: 300, damping: 30 }
  const springRotateX = useSpring(rotateX, springConfig)
  const springRotateY = useSpring(rotateY, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set(e.clientX - centerX)
    y.set(e.clientY - centerY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const glareX = useTransform(x, [-100, 100], [0, 100])
  const glareY = useTransform(y, [-100, 100], [0, 100])
  const glareBackground = useTransform(
    [glareX, glareY],
    ([gX, gY]) => `radial-gradient(circle at ${gX}% ${gY}%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
  )

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={cn(
        'relative rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10',
        'transition-shadow duration-300 hover:shadow-2xl hover:shadow-blue-500/10',
        className,
      )}
    >
      {/* Glare effect */}
      {glare && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
          style={{
            background: glareBackground,
          }}
        />
      )}
      
      <div style={{ transform: 'translateZ(30px)' }}>
        {children}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED BAR CHART - Premium Style
// ═══════════════════════════════════════════════════════════════════════════════

interface BarChartData {
  label: string
  value: number
  color?: string
}

interface AnimatedBarChartProps {
  data: BarChartData[]
  height?: number
  showValues?: boolean
  className?: string
  animated?: boolean
}

export const AnimatedBarChart = ({
  data,
  height = 200,
  showValues = true,
  className,
  animated = true,
}: AnimatedBarChartProps) => {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data])

  const defaultColors = [
    'from-blue-500 to-cyan-400',
    'from-purple-500 to-pink-400',
    'from-emerald-500 to-teal-400',
    'from-amber-500 to-orange-400',
    'from-rose-500 to-red-400',
    'from-indigo-500 to-blue-400',
  ]

  return (
    <div className={cn('w-full', className)}>
      <div 
        className="flex items-end gap-3 w-full"
        style={{ height }}
      >
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100
          const color = item.color || defaultColors[index % defaultColors.length]

          return (
            <motion.div
              key={item.label}
              className="flex-1 flex flex-col items-center gap-2"
              initial={animated ? { scaleY: 0 } : undefined}
              animate={{ scaleY: 1 }}
              transition={{ 
                delay: index * 0.1, 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1], 
              }}
              style={{ originY: 1 }}
            >
              {showValues && (
                <motion.span
                  className="text-sm font-bold text-white/80"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  ${item.value.toLocaleString()}
                </motion.span>
              )}
              
              <motion.div
                className={cn(
                  'w-full rounded-t-lg bg-gradient-to-t relative overflow-hidden',
                  color,
                )}
                style={{ height: `${percentage}%` }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 },
                }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
                  animate={{ y: ['-100%', '100%'] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatDelay: 3,
                    delay: index * 0.2,
                  }}
                />
                
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
              </motion.div>
              
              <span className="text-xs text-white/60 mt-2">{item.label}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED RING CHART - Donut Style Premium
// ═══════════════════════════════════════════════════════════════════════════════

interface RingChartData {
  label: string
  value: number
  color: string
}

interface AnimatedRingChartProps {
  data: RingChartData[]
  size?: number
  strokeWidth?: number
  className?: string
  centerContent?: React.ReactNode
}

export const AnimatedRingChart = ({
  data,
  size = 200,
  strokeWidth = 20,
  className,
  centerContent,
}: AnimatedRingChartProps) => {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  let currentOffset = 0

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        
        {/* Data rings */}
        {data.map((item, index) => {
          const percentage = item.value / total
          const strokeDasharray = circumference * percentage
          const strokeDashoffset = -currentOffset * circumference
          currentOffset += percentage

          return (
            <motion.circle
              key={item.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${strokeDasharray} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${strokeDasharray} ${circumference}` }}
              transition={{ 
                duration: 1.5, 
                delay: index * 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="drop-shadow-lg"
              style={{
                filter: `drop-shadow(0 0 8px ${item.color}40)`,
              }}
            />
          )
        })}
      </svg>
      
      {/* Center content */}
      {centerContent && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {centerContent}
        </motion.div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLE BACKGROUND - Ambient Effect
// ═══════════════════════════════════════════════════════════════════════════════

interface ParticleBackgroundProps {
  count?: number
  color?: string
  minSize?: number
  maxSize?: number
  className?: string
}

export const ParticleBackground = ({
  count = 50,
  color = 'rgba(59, 130, 246, 0.4)',
  minSize = 2,
  maxSize = 6,
  className,
}: ParticleBackgroundProps) => {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: minSize + Math.random() * (maxSize - minSize),
      duration: 10 + Math.random() * 20,
      delay: Math.random() * 5,
    })),
    [count, minSize, maxSize],
  )

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED STAT CARD - Tesla Dashboard Style
// ═══════════════════════════════════════════════════════════════════════════════

interface StatCardProps {
  title: string
  value: number
  format?: 'number' | 'currency' | 'percentage'
  trend?: number
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'rose'
  className?: string
}

export const AnimatedStatCard = ({
  title,
  value,
  format = 'number',
  trend,
  icon,
  color = 'blue',
  className,
}: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayValue(v),
    })
    return controls.stop
  }, [value])

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
      case 'percentage':
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString('es-MX', { maximumFractionDigits: 0 })
    }
  }

  const colorStyles = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    green: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    amber: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    rose: 'from-rose-500/20 to-red-500/20 border-rose-500/30',
  }

  const iconColors = {
    blue: 'text-blue-400',
    green: 'text-emerald-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        'relative p-6 rounded-2xl bg-gradient-to-br border backdrop-blur-xl',
        'transition-all duration-300 overflow-hidden group',
        colorStyles[color],
        className,
      )}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-white/60">{title}</span>
          {icon && (
            <div className={cn('p-2 rounded-lg bg-white/10', iconColors[color])}>
              {icon}
            </div>
          )}
        </div>
        
        <motion.div
          className="text-3xl font-bold text-white mb-2"
          key={value}
        >
          {formatValue(displayValue)}
        </motion.div>
        
        {trend !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className={cn(
              'inline-flex items-center gap-1 text-sm font-medium',
              trend >= 0 ? 'text-emerald-400' : 'text-rose-400',
            )}
          >
            <svg
              className={cn('w-4 h-4', trend < 0 && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {Math.abs(trend).toFixed(1)}%
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// WAVE ANIMATION - Decorative
// ═══════════════════════════════════════════════════════════════════════════════

interface WaveAnimationProps {
  color?: string
  height?: number
  className?: string
}

export const WaveAnimation = ({
  color = 'rgba(59, 130, 246, 0.3)',
  height = 100,
  className,
}: WaveAnimationProps) => {
  return (
    <div className={cn('relative overflow-hidden', className)} style={{ height }}>
      <motion.svg
        viewBox="0 0 1440 100"
        className="absolute bottom-0 w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,50 C360,100 720,0 1080,50 C1260,75 1380,25 1440,50 L1440,100 L0,100 Z"
          fill={color}
          animate={{
            d: [
              'M0,50 C360,100 720,0 1080,50 C1260,75 1380,25 1440,50 L1440,100 L0,100 Z',
              'M0,50 C360,0 720,100 1080,50 C1260,25 1380,75 1440,50 L1440,100 L0,100 Z',
              'M0,50 C360,100 720,0 1080,50 C1260,75 1380,25 1440,50 L1440,100 L0,100 Z',
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.svg>
      
      <motion.svg
        viewBox="0 0 1440 100"
        className="absolute bottom-0 w-full"
        style={{ height: height * 0.8 }}
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,50 C360,0 720,100 1080,50 C1260,25 1380,75 1440,50 L1440,100 L0,100 Z"
          fill={color.replace('0.3', '0.2')}
          animate={{
            d: [
              'M0,50 C360,0 720,100 1080,50 C1260,25 1380,75 1440,50 L1440,100 L0,100 Z',
              'M0,50 C360,100 720,0 1080,50 C1260,75 1380,25 1440,50 L1440,100 L0,100 Z',
              'M0,50 C360,0 720,100 1080,50 C1260,25 1380,75 1440,50 L1440,100 L0,100 Z',
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
      </motion.svg>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT ORB - Decorative Background
// ═══════════════════════════════════════════════════════════════════════════════

interface GradientOrbProps {
  colors?: string[]
  size?: number
  blur?: number
  className?: string
  animate?: boolean
}

export const GradientOrb = ({
  colors = ['#3b82f6', '#8b5cf6', '#ec4899'],
  size = 400,
  blur = 100,
  className,
  animate = true,
}: GradientOrbProps) => {
  return (
    <motion.div
      className={cn('absolute rounded-full pointer-events-none', className)}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(from 0deg, ${colors.join(', ')}, ${colors[0]})`,
        filter: `blur(${blur}px)`,
        opacity: 0.4,
      }}
      animate={animate ? {
        rotate: [0, 360],
        scale: [1, 1.1, 1],
      } : undefined}
      transition={{
        rotate: {
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        },
        scale: {
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MORPHING BLOB - Organic Shape Animation
// ═══════════════════════════════════════════════════════════════════════════════

interface MorphingBlobProps {
  color?: string
  size?: number
  className?: string
}

export const MorphingBlob = ({
  color = 'rgba(59, 130, 246, 0.3)',
  size = 300,
  className,
}: MorphingBlobProps) => {
  const blobPaths = [
    'M47.4,-64.2C61.4,-55.2,72.8,-41.5,78.3,-25.5C83.8,-9.5,83.5,8.9,77.4,24.6C71.4,40.4,59.6,53.5,45.2,62.6C30.8,71.7,13.8,76.8,-3.1,80.8C-20,84.8,-36.9,87.7,-50.7,80.1C-64.5,72.4,-75.2,54.2,-80.8,35.2C-86.5,16.2,-87.1,-3.5,-81.8,-21.4C-76.5,-39.3,-65.3,-55.4,-50.8,-64.2C-36.3,-73,-18.2,-74.5,-0.4,-74C17.4,-73.5,34.7,-71,47.4,-64.2Z',
    'M42.1,-56.1C54.7,-48.2,65,-35.5,71.3,-20.5C77.5,-5.5,79.6,11.9,74.4,27.1C69.2,42.3,56.6,55.3,42,63.1C27.4,70.9,10.9,73.4,-5.4,80.1C-21.7,86.8,-37.8,97.7,-51.6,93.8C-65.4,89.8,-76.8,71.1,-82.1,51.8C-87.4,32.5,-86.5,12.6,-81.4,-4.5C-76.3,-21.6,-67,-35.9,-54.7,-45.4C-42.3,-54.9,-26.9,-59.7,-11.6,-66.2C3.6,-72.7,18.9,-80.8,31.5,-78.9C44.1,-77,52.8,-65.1,42.1,-56.1Z',
    'M37.5,-51.8C48.4,-43.8,56.8,-32.3,62.5,-18.7C68.2,-5.2,71.2,10.4,67.1,23.7C63,37,51.8,47.9,39,55.8C26.2,63.7,11.9,68.5,-3.3,72.9C-18.5,77.3,-34.7,81.3,-47.6,74.8C-60.5,68.3,-70.1,51.4,-75.2,33.7C-80.3,16,-80.9,-2.5,-75.8,-18.8C-70.6,-35.1,-59.7,-49.2,-46.1,-56.8C-32.5,-64.4,-16.3,-65.5,-1.3,-63.9C13.7,-62.2,27.4,-57.8,37.5,-51.8Z',
  ]

  return (
    <motion.div
      className={cn('absolute pointer-events-none', className)}
      style={{ width: size, height: size }}
    >
      <motion.svg
        viewBox="-100 -100 200 200"
        className="w-full h-full"
      >
        <motion.path
          fill={color}
          animate={{
            d: blobPaths,
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      </motion.svg>
    </motion.div>
  )
}

// Components already exported with their definitions above
