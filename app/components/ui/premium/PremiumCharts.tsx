'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect, useMemo, memo, useCallback } from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// CANVAS CHART - HIGH PERFORMANCE
// ============================================================
interface DataPoint {
  label: string
  value: number
  color?: string
}

interface PremiumAreaChartProps {
  data: DataPoint[]
  height?: number
  showGrid?: boolean
  showLabels?: boolean
  showTooltip?: boolean
  gradientFrom?: string
  gradientTo?: string
  strokeColor?: string
  animated?: boolean
  className?: string
}

export const PremiumAreaChart = memo(function PremiumAreaChart({
  data,
  height = 280,
  showGrid = true,
  showLabels = true,
  showTooltip = true,
  gradientFrom = 'rgba(59, 130, 246, 0.3)',
  gradientTo = 'rgba(59, 130, 246, 0)',
  strokeColor = '#3b82f6',
  animated = true,
  className,
}: PremiumAreaChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const progressRef = useRef(0)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })
  
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 0, height })

  // Handle resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect
      setDimensions({ width, height })
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [height])

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2 || dimensions.width === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const { width, height } = dimensions
    const padding = { top: 20, right: 20, bottom: 40, left: 50 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const maxValue = Math.max(...data.map(d => d.value)) * 1.1
    const minValue = Math.min(...data.map(d => d.value)) * 0.9

    const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth
    const getY = (value: number) => {
      const normalized = (value - minValue) / (maxValue - minValue)
      return padding.top + chartHeight - (normalized * chartHeight)
    }

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, width, height)

      // Draw grid
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
        ctx.lineWidth = 1

        // Horizontal lines
        for (let i = 0; i <= 5; i++) {
          const y = padding.top + (chartHeight / 5) * i
          ctx.beginPath()
          ctx.moveTo(padding.left, y)
          ctx.lineTo(width - padding.right, y)
          ctx.stroke()

          // Y-axis labels
          if (showLabels) {
            const value = maxValue - ((maxValue - minValue) / 5) * i
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
            ctx.font = '10px Inter, sans-serif'
            ctx.textAlign = 'right'
            ctx.fillText(`$${(value / 1000).toFixed(0)}k`, padding.left - 8, y + 4)
          }
        }

        // Vertical lines
        for (let i = 0; i < data.length; i++) {
          const x = getX(i)
          ctx.beginPath()
          ctx.setLineDash([2, 4])
          ctx.moveTo(x, padding.top)
          ctx.lineTo(x, height - padding.bottom)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      // Calculate points up to current progress
      const visibleCount = Math.ceil(data.length * progress)
      const points: [number, number][] = []

      for (let i = 0; i < visibleCount; i++) {
        const x = getX(i)
        let y = getY(data[i].value)
        
        // Animate last point
        if (i === visibleCount - 1 && animated) {
          const localProgress = (progress * data.length) - (visibleCount - 1)
          const prevY = i > 0 ? getY(data[i - 1].value) : getY(data[i].value)
          y = prevY + (y - prevY) * localProgress
        }
        
        points.push([x, y])
      }

      if (points.length < 2) return

      // Draw gradient fill
      const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
      gradient.addColorStop(0, gradientFrom)
      gradient.addColorStop(1, gradientTo)

      ctx.beginPath()
      ctx.moveTo(points[0][0], height - padding.bottom)
      
      // Draw curve through points
      for (let i = 0; i < points.length; i++) {
        if (i === 0) {
          ctx.lineTo(points[i][0], points[i][1])
        } else {
          const xMid = (points[i - 1][0] + points[i][0]) / 2
          const yMid = (points[i - 1][1] + points[i][1]) / 2
          ctx.quadraticCurveTo(points[i - 1][0], points[i - 1][1], xMid, yMid)
        }
      }
      ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1])
      ctx.lineTo(points[points.length - 1][0], height - padding.bottom)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      // Draw stroke with glow
      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])
      
      for (let i = 1; i < points.length; i++) {
        const xMid = (points[i - 1][0] + points[i][0]) / 2
        const yMid = (points[i - 1][1] + points[i][1]) / 2
        ctx.quadraticCurveTo(points[i - 1][0], points[i - 1][1], xMid, yMid)
      }
      ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1])

      // Glow effect
      ctx.shadowColor = strokeColor
      ctx.shadowBlur = 12
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.shadowBlur = 0

      // Draw data points
      points.forEach(([x, y], i) => {
        const isHovered = i === hoveredIndex

        // Point glow
        if (isHovered) {
          ctx.beginPath()
          ctx.arc(x, y, 12, 0, Math.PI * 2)
          ctx.fillStyle = `${strokeColor}33`
          ctx.fill()
        }

        // Point
        ctx.beginPath()
        ctx.arc(x, y, isHovered ? 6 : 4, 0, Math.PI * 2)
        ctx.fillStyle = strokeColor
        ctx.fill()
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.stroke()
      })

      // Draw X-axis labels
      if (showLabels) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.font = '11px Inter, sans-serif'
        ctx.textAlign = 'center'

        data.forEach((d, i) => {
          const x = getX(i)
          ctx.fillText(d.label, x, height - padding.bottom + 20)
        })
      }
    }

    // Animation loop
    if (animated && isInView) {
      progressRef.current = 0
      const animate = () => {
        progressRef.current = Math.min(progressRef.current + 0.025, 1)
        draw(progressRef.current)

        if (progressRef.current < 1) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }
      animationRef.current = requestAnimationFrame(animate)
    } else {
      draw(1)
    }

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [data, dimensions, showGrid, showLabels, gradientFrom, gradientTo, strokeColor, animated, hoveredIndex, isInView])

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !showTooltip) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const padding = { left: 50, right: 20 }
    const chartWidth = dimensions.width - padding.left - padding.right
    const relX = x - padding.left

    if (relX < 0 || relX > chartWidth) {
      setHoveredIndex(null)
      return
    }

    const index = Math.round((relX / chartWidth) * (data.length - 1))
    setHoveredIndex(Math.max(0, Math.min(index, data.length - 1)))
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [data.length, dimensions.width, showTooltip])

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null)
  }, [])

  return (
    <div ref={containerRef} className={cn("relative w-full", className)} style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{ width: dimensions.width, height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Tooltip */}
      {showTooltip && hoveredIndex !== null && data[hoveredIndex] && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={cn(
            "absolute pointer-events-none z-50",
            "bg-black/90 backdrop-blur-xl",
            "border border-white/10 rounded-xl",
            "px-3 py-2 shadow-2xl"
          )}
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 60,
            transform: 'translateX(-50%)',
          }}
        >
          <p className="text-white/60 text-xs mb-1">{data[hoveredIndex].label}</p>
          <p className="text-white font-bold text-sm">${data[hoveredIndex].value.toLocaleString()}</p>
        </motion.div>
      )}
    </div>
  )
})

// ============================================================
// PREMIUM PIE CHART
// ============================================================
interface PieDataPoint {
  name: string
  value: number
  color: string
}

interface PremiumPieChartProps {
  data: PieDataPoint[]
  size?: number
  innerRadius?: number
  showLegend?: boolean
  animated?: boolean
  className?: string
}

export const PremiumPieChart = memo(function PremiumPieChart({
  data,
  size = 200,
  innerRadius = 0.6,
  showLegend = true,
  animated = true,
  className,
}: PremiumPieChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.5 })

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])

  const segments = useMemo(() => {
    let currentAngle = -90 // Start from top

    return data.map((d, i) => {
      const angle = (d.value / total) * 360
      const segment = {
        ...d,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        percentage: (d.value / total) * 100,
      }
      currentAngle += angle
      return segment
    })
  }, [data, total])

  const radius = size / 2
  const innerR = radius * innerRadius

  return (
    <div ref={containerRef} className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={radius}
            cy={radius}
            r={radius - 4}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />

          {/* Segments */}
          {segments.map((segment, i) => {
            const isHovered = hoveredIndex === i
            const startAngle = (segment.startAngle * Math.PI) / 180
            const endAngle = (segment.endAngle * Math.PI) / 180

            const x1 = radius + (isHovered ? radius + 4 : radius - 4) * Math.cos(startAngle)
            const y1 = radius + (isHovered ? radius + 4 : radius - 4) * Math.sin(startAngle)
            const x2 = radius + (isHovered ? radius + 4 : radius - 4) * Math.cos(endAngle)
            const y2 = radius + (isHovered ? radius + 4 : radius - 4) * Math.sin(endAngle)

            const ix1 = radius + innerR * Math.cos(startAngle)
            const iy1 = radius + innerR * Math.sin(startAngle)
            const ix2 = radius + innerR * Math.cos(endAngle)
            const iy2 = radius + innerR * Math.sin(endAngle)

            const largeArc = segment.endAngle - segment.startAngle > 180 ? 1 : 0

            const d = [
              `M ${ix1} ${iy1}`,
              `L ${x1} ${y1}`,
              `A ${isHovered ? radius + 4 : radius - 4} ${isHovered ? radius + 4 : radius - 4} 0 ${largeArc} 1 ${x2} ${y2}`,
              `L ${ix2} ${iy2}`,
              `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`,
              'Z',
            ].join(' ')

            return (
              <motion.path
                key={i}
                d={d}
                fill={segment.color}
                initial={{ scale: animated && isInView ? 0 : 1, opacity: animated && isInView ? 0 : 1 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-all duration-200"
                style={{
                  filter: isHovered ? `drop-shadow(0 0 12px ${segment.color}80)` : 'none',
                  transformOrigin: 'center',
                }}
              />
            )
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center rotate-0">
          <div className="text-center">
            {hoveredIndex !== null ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <p className="text-2xl font-bold text-white">{segments[hoveredIndex].percentage.toFixed(1)}%</p>
                <p className="text-xs text-white/50">{segments[hoveredIndex].name}</p>
              </motion.div>
            ) : (
              <div>
                <p className="text-lg font-bold text-white/80">Total</p>
                <p className="text-xs text-white/40">${total.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
          {segments.map((segment, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                hoveredIndex === i ? "bg-white/10" : "hover:bg-white/5"
              )}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-white/60 truncate">{segment.name}</span>
              <span className="text-xs font-bold text-white ml-auto">{segment.percentage.toFixed(0)}%</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
})

export default { PremiumAreaChart, PremiumPieChart }
