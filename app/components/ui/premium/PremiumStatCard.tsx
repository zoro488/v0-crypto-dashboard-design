'use client'

import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion'
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { useEffect, useRef, useState, memo, useCallback } from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// ANIMATED COUNTER HOOK
// ============================================================
function useAnimatedCounter(value: number, duration: number = 1500) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(value)

  useEffect(() => {
    const startValue = prevValue.current
    const endValue = value
    const startTime = Date.now()

    const animateValue = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      
      // Easing function (ease-out-expo)
      const easeOutExpo = 1 - Math.pow(2, -10 * progress)
      const current = startValue + (endValue - startValue) * easeOutExpo

      setDisplayValue(Math.round(current))

      if (progress < 1) {
        requestAnimationFrame(animateValue)
      }
    }

    requestAnimationFrame(animateValue)
    prevValue.current = value

    return () => {
      prevValue.current = value
    }
  }, [value, duration])

  return displayValue
}

// ============================================================
// SPARKLINE COMPONENT
// ============================================================
interface SparklineProps {
  data: number[]
  trend: 'up' | 'down'
  height?: number
}

const Sparkline = memo(function Sparkline({ data, trend, height = 40 }: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const progressRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.offsetWidth
    const canvasHeight = height

    canvas.width = width * dpr
    canvas.height = canvasHeight * dpr
    ctx.scale(dpr, dpr)

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const color = trend === 'up' ? '#10b981' : '#ef4444'
    const colorLight = trend === 'up' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'

    const animate = (timestamp: number) => {
      progressRef.current = Math.min(progressRef.current + 0.03, 1)
      const progress = progressRef.current

      ctx.clearRect(0, 0, width, canvasHeight)

      // Create gradient fill
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight)
      gradient.addColorStop(0, colorLight)
      gradient.addColorStop(1, 'rgba(0,0,0,0)')

      const points: [number, number][] = data.slice(0, Math.floor(data.length * progress) + 1).map((value, i) => {
        const x = (i / (data.length - 1)) * width
        const y = canvasHeight - ((value - min) / range) * (canvasHeight * 0.8) - canvasHeight * 0.1
        return [x, y]
      })

      if (points.length < 2) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      // Draw filled area
      ctx.beginPath()
      ctx.moveTo(points[0][0], canvasHeight)
      points.forEach(([x, y]) => ctx.lineTo(x, y))
      ctx.lineTo(points[points.length - 1][0], canvasHeight)
      ctx.fillStyle = gradient
      ctx.fill()

      // Draw line with glow
      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])

      // Smooth curve through points
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i][0] + points[i + 1][0]) / 2
        const yc = (points[i][1] + points[i + 1][1]) / 2
        ctx.quadraticCurveTo(points[i][0], points[i][1], xc, yc)
      }
      if (points.length > 1) {
        ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1])
      }

      // Glow effect
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.strokeStyle = color
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()

      // Draw end dot
      const lastPoint = points[points.length - 1]
      ctx.beginPath()
      ctx.arc(lastPoint[0], lastPoint[1], 4, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.shadowBlur = 12
      ctx.fill()

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    progressRef.current = 0
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [data, trend, height])

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  )
})

// ============================================================
// PREMIUM STAT CARD
// ============================================================
interface PremiumStatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  change: number
  icon: LucideIcon
  gradient: string
  sparklineData?: number[]
  index?: number
  onClick?: () => void
}

export const PremiumStatCard = memo(function PremiumStatCard({
  title,
  value,
  prefix = '$',
  suffix = '',
  change,
  icon: Icon,
  gradient,
  sparklineData = [],
  index = 0,
  onClick,
}: PremiumStatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  // Mouse tracking for 3D effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 })

  const animatedValue = useAnimatedCounter(value, 1500)
  const trend = change >= 0 ? 'up' : 'down'

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set((e.clientX - centerX) / rect.width)
    mouseY.set((e.clientY - centerY) / rect.height)
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }, [mouseX, mouseY])

  // Format number with commas
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    return num.toLocaleString()
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1, 
        ease: [0.16, 1, 0.3, 1] 
      }}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformPerspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer",
        "will-change-transform"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glassmorphism Card */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl md:rounded-3xl",
        "bg-white/[0.03] backdrop-blur-xl",
        "border border-white/[0.08]",
        "p-4 md:p-6",
        "transition-all duration-500",
        isHovered && "bg-white/[0.05] border-white/[0.12]"
      )}>
        {/* Animated Gradient Background */}
        <motion.div
          className={cn(
            "absolute -top-20 -right-20 w-40 h-40",
            "rounded-full blur-3xl opacity-30",
            "transition-opacity duration-500",
            `bg-gradient-to-br ${gradient}`
          )}
          animate={{
            scale: isHovered ? 1.3 : 1,
            opacity: isHovered ? 0.5 : 0.3,
          }}
        />

        {/* Noise Texture */}
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            {/* Icon */}
            <motion.div
              className={cn(
                "p-2.5 md:p-3 rounded-xl md:rounded-2xl",
                "shadow-lg",
                `bg-gradient-to-br ${gradient}`
              )}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              style={{ 
                boxShadow: isHovered 
                  ? '0 8px 32px -8px rgba(59, 130, 246, 0.4)' 
                  : '0 4px 16px -4px rgba(0, 0, 0, 0.3)',
              }}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </motion.div>

            {/* Change Badge */}
            <motion.div
              className={cn(
                "flex items-center gap-1",
                "px-2 md:px-3 py-1 rounded-full",
                "text-[10px] md:text-xs font-semibold",
                trend === 'up' 
                  ? "bg-emerald-500/15 text-emerald-400" 
                  : "bg-rose-500/15 text-rose-400"
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              {trend === 'up' 
                ? <TrendingUp className="w-3 h-3" /> 
                : <TrendingDown className="w-3 h-3" />
              }
              {Math.abs(change).toFixed(1)}%
            </motion.div>
          </div>

          {/* Title */}
          <p className="text-white/50 text-xs md:text-sm mb-1 font-medium tracking-wide">
            {title}
          </p>

          {/* Value */}
          <motion.h3 
            className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            {prefix}{formatNumber(animatedValue)}{suffix}
          </motion.h3>

          {/* Sparkline */}
          {sparklineData.length > 0 && (
            <motion.div 
              className="mt-3 md:mt-4 h-8 md:h-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.4 }}
            >
              <Sparkline data={sparklineData} trend={trend} height={40} />
            </motion.div>
          )}
        </div>

        {/* Hover Glow Border */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-2xl md:rounded-3xl",
            "opacity-0 transition-opacity duration-500",
            isHovered && "opacity-100"
          )}
          style={{
            background: `linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)`,
            backgroundSize: '200% 200%',
          }}
          animate={{
            backgroundPosition: isHovered ? ['200% 200%', '0% 0%'] : '200% 200%',
          }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  )
})

export default PremiumStatCard
