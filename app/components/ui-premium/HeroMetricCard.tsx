'use client'

import { motion } from 'framer-motion'
import { memo, useMemo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { SparklineBackground } from './SparklineBackground'

interface HeroMetricCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  trend?: number
  trendLabel?: string
  icon: React.ReactNode
  variant?: 'sapphire' | 'emerald' | 'amethyst' | 'cyan' | 'gold' | 'ruby'
  sparklineData?: number[]
  className?: string
  onClick?: () => void
}

/**
 * HeroMetricCard - Tarjeta Héroe con métrica gigante y Sparkline de fondo
 * 
 * La tarjeta principal que ocupa 2 espacios:
 * - Vidrio ahumado premium
 * - Icono 3D flotante con luz
 * - Monto GIGANTE monospaced
 * - Sparkline sutil que cruza toda la tarjeta
 */
export const HeroMetricCard = memo(function HeroMetricCard({
  title,
  value,
  prefix = '$',
  suffix,
  trend,
  trendLabel,
  icon,
  variant = 'sapphire',
  sparklineData,
  className = '',
  onClick,
}: HeroMetricCardProps) {
  
  const colorMap = {
    sapphire: {
      glow: 'rgba(59, 130, 246, 0.4)',
      accent: '#3b82f6',
      light: '#60a5fa',
    },
    emerald: {
      glow: 'rgba(16, 185, 129, 0.4)',
      accent: '#10b981',
      light: '#34d399',
    },
    amethyst: {
      glow: 'rgba(139, 92, 246, 0.4)',
      accent: '#8b5cf6',
      light: '#a78bfa',
    },
    cyan: {
      glow: 'rgba(6, 182, 212, 0.4)',
      accent: '#06b6d4',
      light: '#22d3ee',
    },
    gold: {
      glow: 'rgba(245, 158, 11, 0.4)',
      accent: '#f59e0b',
      light: '#fbbf24',
    },
    ruby: {
      glow: 'rgba(239, 68, 68, 0.4)',
      accent: '#ef4444',
      light: '#f87171',
    },
  }
  
  const colors = colorMap[variant]
  
  // Formatear valor
  const formattedValue = useMemo(() => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M'
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'k'
    }
    return value.toLocaleString()
  }, [value])
  
  const isTrendPositive = trend !== undefined && trend >= 0
  
  return (
    <motion.div
      className={`relative col-span-2 overflow-hidden rounded-3xl ${className}`}
      style={{
        background: 'rgba(8, 8, 12, 0.85)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        minHeight: '280px',
        boxShadow: `
          inset 1px 1px 0 0 rgba(255, 255, 255, 0.1),
          inset -1px -1px 0 0 rgba(0, 0, 0, 0.4),
          inset 0 0 80px -30px ${colors.glow},
          0 20px 60px -20px rgba(0, 0, 0, 0.6),
          0 10px 30px -10px rgba(0, 0, 0, 0.4)
        `,
      }}
      whileHover={{
        y: -6,
        boxShadow: `
          inset 1px 1px 0 0 rgba(255, 255, 255, 0.15),
          inset -1px -1px 0 0 rgba(0, 0, 0, 0.4),
          inset 0 0 100px -30px ${colors.glow},
          0 30px 80px -20px ${colors.glow},
          0 15px 40px -10px rgba(0, 0, 0, 0.5)
        `,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {/* Borde degradado premium */}
      <div 
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          padding: '1px',
          background: `linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.03) 50%,
            rgba(0, 0, 0, 0.3) 100%
          )`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      
      {/* Sparkline Background */}
      <SparklineBackground 
        data={sparklineData ? { values: sparklineData, color: colors.accent } : undefined}
        variant={variant}
      />
      
      {/* Contenido */}
      <div className="relative h-full p-8 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between">
          {/* Icono 3D con glow */}
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            {/* Glow detrás */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `radial-gradient(circle at center, ${colors.glow} 0%, transparent 70%)`,
                filter: 'blur(20px)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            
            {/* Container del icono */}
            <div 
              className="relative p-4 rounded-2xl"
              style={{
                background: `rgba(${variant === 'sapphire' ? '59, 130, 246' : variant === 'emerald' ? '16, 185, 129' : variant === 'amethyst' ? '139, 92, 246' : variant === 'cyan' ? '6, 182, 212' : variant === 'gold' ? '245, 158, 11' : '239, 68, 68'}, 0.15)`,
                boxShadow: `0 0 30px ${colors.glow}`,
              }}
            >
              <span style={{ color: colors.light }}>
                {icon}
              </span>
            </div>
          </motion.div>
          
          {/* Trend Badge */}
          {trend !== undefined && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: isTrendPositive 
                  ? 'rgba(16, 185, 129, 0.15)' 
                  : 'rgba(239, 68, 68, 0.15)',
                color: isTrendPositive ? '#10b981' : '#ef4444',
              }}
            >
              {isTrendPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {isTrendPositive ? '+' : ''}{trend.toFixed(1)}%
              </span>
            </motion.div>
          )}
        </div>
        
        {/* Main Value */}
        <div className="flex-1 flex flex-col justify-center">
          <motion.p
            className="text-white/50 text-sm font-medium mb-2"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {title}
          </motion.p>
          
          <motion.div
            className="flex items-baseline gap-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            {prefix && (
              <span 
                className="text-3xl md:text-4xl font-semibold"
                style={{ 
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                {prefix}
              </span>
            )}
            <span 
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
              style={{ 
                fontFamily: "'JetBrains Mono', monospace",
                fontFeatureSettings: "'tnum' 1",
                letterSpacing: '-0.02em',
                color: '#ffffff',
                textShadow: `0 0 40px ${colors.glow}`,
              }}
            >
              {formattedValue}
            </span>
            {suffix && (
              <span 
                className="text-xl font-medium"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                {suffix}
              </span>
            )}
          </motion.div>
          
          {trendLabel && (
            <motion.p
              className="text-white/40 text-sm mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {trendLabel}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  )
})

export default HeroMetricCard
