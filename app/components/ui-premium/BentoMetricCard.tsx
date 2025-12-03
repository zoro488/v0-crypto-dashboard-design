'use client'

import { motion } from 'framer-motion'
import { memo, ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface BentoMetricCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: number
  variant?: 'sapphire' | 'emerald' | 'amethyst' | 'cyan' | 'gold' | 'ruby'
  className?: string
  onClick?: () => void
}

/**
 * BentoMetricCard - Tarjeta secundaria 1x1 para métricas
 * 
 * Tarjeta compacta con:
 * - Vidrio ahumado sutil
 * - Icono discreto
 * - Elevación física al hover
 * - Sombra de color
 */
export const BentoMetricCard = memo(function BentoMetricCard({
  title,
  value,
  icon,
  trend,
  variant = 'sapphire',
  className = '',
  onClick
}: BentoMetricCardProps) {
  
  const colorMap = {
    sapphire: {
      glow: 'rgba(59, 130, 246, 0.3)',
      accent: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)'
    },
    emerald: {
      glow: 'rgba(16, 185, 129, 0.3)',
      accent: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)'
    },
    amethyst: {
      glow: 'rgba(139, 92, 246, 0.3)',
      accent: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)'
    },
    cyan: {
      glow: 'rgba(6, 182, 212, 0.3)',
      accent: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)'
    },
    gold: {
      glow: 'rgba(245, 158, 11, 0.3)',
      accent: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)'
    },
    ruby: {
      glow: 'rgba(239, 68, 68, 0.3)',
      accent: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)'
    }
  }
  
  const colors = colorMap[variant]
  const isTrendPositive = trend !== undefined && trend >= 0
  
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl cursor-pointer ${className}`}
      style={{
        background: 'rgba(8, 8, 12, 0.8)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        minHeight: '180px',
        boxShadow: `
          inset 1px 1px 0 0 rgba(255, 255, 255, 0.08),
          inset -1px -1px 0 0 rgba(0, 0, 0, 0.4),
          0 8px 32px -8px rgba(0, 0, 0, 0.5)
        `
      }}
      whileHover={{
        y: -4,
        scale: 1.02,
        boxShadow: `
          inset 1px 1px 0 0 rgba(255, 255, 255, 0.12),
          inset -1px -1px 0 0 rgba(0, 0, 0, 0.4),
          0 20px 50px -15px ${colors.glow},
          0 10px 30px -10px rgba(0, 0, 0, 0.5)
        `
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
    >
      {/* Borde degradado */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          padding: '1px',
          background: `linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.02) 50%,
            rgba(0, 0, 0, 0.3) 100%
          )`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude'
        }}
      />
      
      {/* Resplandor de color sutil en hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background: `radial-gradient(ellipse at bottom right, ${colors.glow} 0%, transparent 70%)`
        }}
      />
      
      {/* Contenido */}
      <div className="relative h-full p-6 flex flex-col justify-between">
        {/* Header con icono y trend */}
        <div className="flex items-start justify-between">
          {/* Icono */}
          <motion.div
            className="p-3 rounded-xl"
            style={{ background: colors.bg }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <span style={{ color: colors.accent }}>
              {icon}
            </span>
          </motion.div>
          
          {/* Trend */}
          {trend !== undefined && (
            <div 
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: isTrendPositive ? '#10b981' : '#ef4444' }}
            >
              {isTrendPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{isTrendPositive ? '+' : ''}{trend.toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        {/* Valor y título */}
        <div>
          <p className="text-white/40 text-sm mb-1">{title}</p>
          <p 
            className="text-2xl md:text-3xl font-bold text-white"
            style={{ 
              fontFamily: "'JetBrains Mono', monospace",
              fontFeatureSettings: "'tnum' 1"
            }}
          >
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  )
})

export default BentoMetricCard
