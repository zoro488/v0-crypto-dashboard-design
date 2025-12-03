'use client'

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { memo, useRef, useEffect, useState, useMemo, ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREMIUM STAT CARD - Obsidian 3D Cards
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tarjeta KPI estilo Apple Vision Pro con:
 * - Tilt 3D que reacciona al mouse (Perspective Tilt)
 * - Iluminación ambiental que se mueve opuesta al cursor
 * - CountUp animado estilo odómetro
 * - Sparkline sutil detrás del número
 * - Rim light superior simulado
 */

interface PremiumStatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  trend?: number
  trendLabel?: string
  icon: ReactNode
  variant?: 'emerald' | 'sapphire' | 'amethyst' | 'cyan' | 'gold' | 'ruby'
  sparklineData?: number[]
  className?: string
  onClick?: () => void
}

// Hook para CountUp animado
function useCountUp(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  
  useEffect(() => {
    if (hasAnimated) return
    setHasAnimated(true)
    
    const startTime = Date.now()
    const startValue = 0
    
    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing: easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = startValue + (target - startValue) * eased
      
      setCount(current)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [target, duration, hasAnimated])
  
  return count
}

// Componente Sparkline SVG minimalista
const MiniSparkline = memo(function MiniSparkline({ 
  data, 
  color, 
}: { 
  data: number[]
  color: string 
}) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return ''
    
    const width = 200
    const height = 60
    const padding = 4
    
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((value - min) / range) * (height - 2 * padding)
      return { x, y }
    })
    
    // Smooth curve
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cpx = (prev.x + curr.x) / 2
      d += ` Q ${cpx} ${prev.y}, ${cpx} ${(prev.y + curr.y) / 2}`
    }
    d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`
    
    return d
  }, [data])
  
  if (!data || data.length < 2) return null
  
  return (
    <svg 
      viewBox="0 0 200 60" 
      className="absolute inset-0 w-full h-full opacity-20"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`sparkline-grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.4 }}
        transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
      />
    </svg>
  )
})

export const PremiumStatCard = memo(function PremiumStatCard({
  title,
  value,
  prefix = '$',
  suffix,
  trend,
  trendLabel,
  icon,
  variant = 'emerald',
  sparklineData,
  className = '',
  onClick,
}: PremiumStatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Motion values para el tilt 3D
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Transformaciones suaves con spring
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 150,
    damping: 20,
  })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 150,
    damping: 20,
  })
  
  // Movimiento de luz ambiental (opuesto al mouse)
  const ambientX = useSpring(useTransform(mouseX, [-0.5, 0.5], ['60%', '40%']), {
    stiffness: 100,
    damping: 30,
  })
  const ambientY = useSpring(useTransform(mouseY, [-0.5, 0.5], ['60%', '40%']), {
    stiffness: 100,
    damping: 30,
  })
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    // Normalizar posición del mouse (-0.5 a 0.5)
    const x = (e.clientX - centerX) / rect.width
    const y = (e.clientY - centerY) / rect.height
    
    mouseX.set(x)
    mouseY.set(y)
  }
  
  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }
  
  // Colores por variante
  const colorMap = {
    emerald: { 
      primary: '#10b981', 
      glow: 'rgba(16, 185, 129, 0.4)',
      light: '#34d399',
      rgb: '16, 185, 129',
    },
    sapphire: { 
      primary: '#3b82f6', 
      glow: 'rgba(59, 130, 246, 0.4)',
      light: '#60a5fa',
      rgb: '59, 130, 246',
    },
    amethyst: { 
      primary: '#8b5cf6', 
      glow: 'rgba(139, 92, 246, 0.4)',
      light: '#a78bfa',
      rgb: '139, 92, 246',
    },
    cyan: { 
      primary: '#06b6d4', 
      glow: 'rgba(6, 182, 212, 0.4)',
      light: '#22d3ee',
      rgb: '6, 182, 212',
    },
    gold: { 
      primary: '#f59e0b', 
      glow: 'rgba(245, 158, 11, 0.4)',
      light: '#fbbf24',
      rgb: '245, 158, 11',
    },
    ruby: { 
      primary: '#ef4444', 
      glow: 'rgba(239, 68, 68, 0.4)',
      light: '#f87171',
      rgb: '239, 68, 68',
    },
  }
  
  const colors = colorMap[variant]
  const animatedValue = useCountUp(value, 2000)
  const isTrendPositive = trend !== undefined && trend >= 0
  
  // Formatear valor
  const formattedValue = useMemo(() => {
    const val = animatedValue
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M'
    } else if (val >= 1000) {
      return (val / 1000).toFixed(0) + 'k'
    }
    return Math.round(val).toLocaleString()
  }, [animatedValue])
  
  // Generar sparkline data si no se proporciona
  const sparkData = useMemo(() => {
    if (sparklineData && sparklineData.length > 0) return sparklineData
    // Generar datos aleatorios
    const data = []
    let current = 50
    for (let i = 0; i < 20; i++) {
      current += (Math.random() - 0.45) * 20
      current = Math.max(10, Math.min(90, current))
      data.push(current)
    }
    return data
  }, [sparklineData])
  
  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden rounded-3xl cursor-pointer ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Tarjeta con Tilt 3D */}
      <motion.div
        className="relative h-full"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Fondo principal - Vidrio oscuro profundo */}
        <div 
          className="relative h-full p-6 rounded-3xl"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          }}
        >
          {/* Rim Light Superior (borde brillante simulado) */}
          <div 
            className="absolute inset-x-0 top-0 h-[1px] rounded-t-3xl"
            style={{
              background: `linear-gradient(90deg, 
                transparent 0%, 
                rgba(255,255,255,0.2) 20%, 
                rgba(255,255,255,0.4) 50%, 
                rgba(255,255,255,0.2) 80%, 
                transparent 100%
              )`,
            }}
          />
          
          {/* Borde degradado completo */}
          <div 
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              padding: '1px',
              background: `linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.15) 0%,
                rgba(255, 255, 255, 0.05) 50%,
                rgba(0, 0, 0, 0.3) 100%
              )`,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
          
          {/* Iluminación Ambiental (se mueve opuesta al mouse) */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              width: '150%',
              height: '150%',
              left: ambientX,
              top: ambientY,
              x: '-50%',
              y: '-50%',
              background: `radial-gradient(circle at center, ${colors.glow} 0%, transparent 60%)`,
              filter: 'blur(60px)',
              opacity: 0.4,
            }}
          />
          
          {/* Sparkline de fondo */}
          <MiniSparkline data={sparkData} color={colors.primary} />
          
          {/* Contenido */}
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Header: Icono y Trend */}
            <div className="flex items-start justify-between">
              {/* Icono en glass pill */}
              <motion.div
                className="relative p-3 rounded-2xl"
                style={{
                  background: `rgba(${colors.rgb}, 0.15)`,
                  boxShadow: `0 0 20px rgba(${colors.rgb}, 0.2)`,
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                {/* Glow detrás del icono */}
                <div 
                  className="absolute inset-0 rounded-2xl blur-xl opacity-50"
                  style={{ background: colors.glow }}
                />
                <span className="relative" style={{ color: colors.light }}>
                  {icon}
                </span>
              </motion.div>
              
              {/* Trend Badge */}
              {trend !== undefined && (
                <motion.div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    background: isTrendPositive 
                      ? 'rgba(16, 185, 129, 0.15)' 
                      : 'rgba(239, 68, 68, 0.15)',
                    color: isTrendPositive ? '#10b981' : '#ef4444',
                    boxShadow: isTrendPositive
                      ? '0 0 15px rgba(16, 185, 129, 0.2)'
                      : '0 0 15px rgba(239, 68, 68, 0.2)',
                  }}
                >
                  {isTrendPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{isTrendPositive ? '+' : ''}{trend.toFixed(1)}%</span>
                </motion.div>
              )}
            </div>
            
            {/* Valor Principal - GIGANTE con CountUp */}
            <div className="mt-4">
              <p className="text-white/40 text-sm font-medium mb-1 tracking-wide">
                {title}
              </p>
              <div className="flex items-baseline gap-1">
                {prefix && (
                  <span 
                    className="text-2xl font-semibold"
                    style={{ 
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    {prefix}
                  </span>
                )}
                <motion.span 
                  className="text-4xl md:text-5xl font-bold tracking-tight"
                  style={{ 
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontVariantNumeric: 'tabular-nums',
                    color: '#ffffff',
                    textShadow: `0 0 30px ${colors.glow}`,
                  }}
                >
                  {formattedValue}
                </motion.span>
                {suffix && (
                  <span 
                    className="text-lg font-medium ml-1"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                  >
                    {suffix}
                  </span>
                )}
              </div>
              
              {trendLabel && (
                <p className="text-white/30 text-xs mt-2">{trendLabel}</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
})

export default PremiumStatCard
