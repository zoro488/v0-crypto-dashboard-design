"use client"

/**
 * DataVisualizationOrb - Componente premium para visualización de datos
 * Este NO es el widget flotante de IA (ese usa Spline).
 * Este es para mostrar métricas de forma interactiva en dashboards.
 */

import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion"
import { useState, useRef, useMemo } from "react"
import { cn } from "@/frontend/app/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface DataMetric {
  label: string
  value: number
  change?: number
  color?: string
  format?: "currency" | "number" | "percent"
}

interface DataVisualizationOrbProps {
  metrics: DataMetric[]
  size?: number
  title?: string
  subtitle?: string
  className?: string
  onMetricClick?: (metric: DataMetric) => void
}

// Partícula de datos orbital
const DataParticle = ({ 
  angle, 
  radius, 
  metric,
  isActive,
  onClick 
}: { 
  angle: number
  radius: number
  metric: DataMetric
  isActive: boolean
  onClick: () => void
}) => {
  const x = Math.cos((angle * Math.PI) / 180) * radius
  const y = Math.sin((angle * Math.PI) / 180) * radius
  const color = metric.color || "#3b82f6"
  
  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: "50%",
        top: "50%",
        x,
        y,
        translateX: "-50%",
        translateY: "-50%",
      }}
      whileHover={{ scale: 1.2, zIndex: 10 }}
      onClick={onClick}
    >
      {/* Partícula */}
      <motion.div
        className="relative"
        animate={{
          scale: isActive ? [1, 1.15, 1] : 1,
        }}
        transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
      >
        {/* Glow */}
        <div 
          className="absolute inset-0 rounded-full blur-md"
          style={{ backgroundColor: color, opacity: 0.5 }}
        />
        
        {/* Punto */}
        <div 
          className="relative w-4 h-4 rounded-full border-2 border-white/50"
          style={{ backgroundColor: color }}
        />
        
        {/* Tooltip en hover */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-20"
            >
              <div className="bg-black/90 backdrop-blur-xl rounded-lg px-3 py-2 border border-white/10 whitespace-nowrap">
                <p className="text-white/60 text-xs">{metric.label}</p>
                <p className="text-white font-bold text-sm">
                  {metric.format === "currency" ? `$${metric.value.toLocaleString()}` :
                   metric.format === "percent" ? `${metric.value}%` :
                   metric.value.toLocaleString()}
                </p>
                {metric.change !== undefined && (
                  <div className={`flex items-center gap-1 text-xs ${
                    metric.change > 0 ? "text-green-400" : 
                    metric.change < 0 ? "text-red-400" : 
                    "text-gray-400"
                  }`}>
                    {metric.change > 0 ? <TrendingUp className="w-3 h-3" /> :
                     metric.change < 0 ? <TrendingDown className="w-3 h-3" /> :
                     <Minus className="w-3 h-3" />}
                    {Math.abs(metric.change)}%
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export function DataVisualizationOrb({
  metrics,
  size = 300,
  title,
  subtitle,
  className,
  onMetricClick,
}: DataVisualizationOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeMetric, setActiveMetric] = useState<number | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  // Rotación 3D con mouse
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const rotateX = useSpring(useTransform(mouseY, [-size/2, size/2], [10, -10]), { stiffness: 100, damping: 20 })
  const rotateY = useSpring(useTransform(mouseX, [-size/2, size/2], [-10, 10]), { stiffness: 100, damping: 20 })
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }
  
  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
    setActiveMetric(null)
  }

  // Calcular posiciones de métricas
  const metricPositions = useMemo(() => {
    return metrics.map((_, index) => ({
      angle: (360 / metrics.length) * index - 90, // Empezar desde arriba
      radius: size * 0.35,
    }))
  }, [metrics.length, size])

  // Total para el centro
  const totalValue = useMemo(() => {
    return metrics.reduce((acc, m) => acc + m.value, 0)
  }, [metrics])

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center",
        className
      )}
      style={{
        width: size,
        height: size,
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Contenedor 3D */}
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Anillos orbitales */}
        {[0.6, 0.75, 0.9].map((scale, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-white/10"
            style={{
              transform: `scale(${scale})`,
            }}
            animate={{
              rotate: i % 2 === 0 ? 360 : -360,
              opacity: isHovered ? 0.3 : 0.1,
            }}
            transition={{
              rotate: { duration: 20 + i * 10, repeat: Infinity, ease: "linear" },
              opacity: { duration: 0.3 },
            }}
          />
        ))}

        {/* Orbe central con valor total */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `scale(0.4)` }}
        >
          {/* Glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-pink-500/30 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          {/* Esfera */}
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-white/20 backdrop-blur-xl flex flex-col items-center justify-center">
            {/* Reflejo */}
            <div className="absolute top-2 left-1/4 w-1/2 h-1/4 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
            
            {title && (
              <p className="text-white/50 text-xs font-medium mb-1">{title}</p>
            )}
            <motion.p 
              className="text-white text-2xl font-bold"
              key={totalValue}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              ${(totalValue / 1000000).toFixed(1)}M
            </motion.p>
            {subtitle && (
              <p className="text-white/40 text-[10px]">{subtitle}</p>
            )}
          </div>
        </motion.div>

        {/* Partículas de datos */}
        {metrics.map((metric, index) => (
          <DataParticle
            key={metric.label}
            angle={metricPositions[index].angle}
            radius={metricPositions[index].radius}
            metric={metric}
            isActive={activeMetric === index}
            onClick={() => {
              setActiveMetric(activeMetric === index ? null : index)
              onMetricClick?.(metric)
            }}
          />
        ))}

        {/* Líneas conectoras */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: "translateZ(-1px)" }}
        >
          {metrics.map((metric, index) => {
            const pos = metricPositions[index]
            const x = Math.cos((pos.angle * Math.PI) / 180) * pos.radius + size / 2
            const y = Math.sin((pos.angle * Math.PI) / 180) * pos.radius + size / 2
            return (
              <motion.line
                key={metric.label}
                x1={size / 2}
                y1={size / 2}
                x2={x}
                y2={y}
                stroke={metric.color || "#3b82f6"}
                strokeWidth={activeMetric === index ? 2 : 1}
                strokeOpacity={activeMetric === index ? 0.6 : 0.2}
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: index * 0.1 }}
              />
            )
          })}
        </svg>
      </motion.div>
    </motion.div>
  )
}

export default DataVisualizationOrb
