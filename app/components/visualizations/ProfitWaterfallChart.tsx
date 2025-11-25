"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react"

interface WaterfallSegment {
  label: string
  value: number
  type: "positive" | "negative" | "total"
  color: string
}

interface ProfitWaterfallChartProps {
  segments?: WaterfallSegment[]
  width?: number
  height?: number
  className?: string
}

export function ProfitWaterfallChart({
  segments,
  width = 900,
  height = 600,
  className = ""
}: ProfitWaterfallChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [animationProgress, setAnimationProgress] = useState(0)

  // Datos por defecto
  const defaultSegments: WaterfallSegment[] = [
    { label: "Ingresos", value: 1500000, type: "positive", color: "#10b981" },
    { label: "Costo de Ventas", value: -450000, type: "negative", color: "#ef4444" },
    { label: "Gastos Operativos", value: -320000, type: "negative", color: "#f59e0b" },
    { label: "Impuestos", value: -180000, type: "negative", color: "#f97316" },
    { label: "Ganancia Neta", value: 550000, type: "total", color: "#8b5cf6" }
  ]

  const waterfallSegments = segments || defaultSegments

  // Calcular posiciones acumuladas
  const calculatePositions = () => {
    const positions: { x: number; y: number; height: number; cumulative: number }[] = []
    let cumulative = 0
    const maxValue = Math.max(...waterfallSegments.map(s => Math.abs(s.value))) * 1.5
    const barWidth = (width - 100) / waterfallSegments.length - 20
    const chartHeight = height - 150

    waterfallSegments.forEach((segment, i) => {
      const x = 50 + i * (barWidth + 20)
      const normalizedHeight = (Math.abs(segment.value) / maxValue) * chartHeight
      
      if (segment.type === "total") {
        const totalValue = waterfallSegments
          .slice(0, i)
          .reduce((acc, s) => acc + s.value, 0)
        const y = height - 80 - (totalValue / maxValue) * chartHeight
        positions.push({ x, y, height: normalizedHeight, cumulative: totalValue })
      } else {
        const y = segment.value > 0 
          ? height - 80 - cumulative - normalizedHeight
          : height - 80 - cumulative
        cumulative += segment.value / maxValue * chartHeight
        positions.push({ x, y, height: normalizedHeight, cumulative })
      }
    })

    return { positions, barWidth }
  }

  // Animación inicial
  useEffect(() => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 0.02
      if (progress >= 1) {
        progress = 1
        clearInterval(interval)
      }
      setAnimationProgress(progress)
    }, 16)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let time = 0
    const { positions, barWidth } = calculatePositions()

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.01

      // Gradiente de fondo
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      bgGradient.addColorStop(0, "rgba(10, 10, 30, 1)")
      bgGradient.addColorStop(1, "rgba(30, 20, 50, 1)")
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Línea base
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(30, height - 80)
      ctx.lineTo(width - 30, height - 80)
      ctx.stroke()
      ctx.setLineDash([])

      // Dibujar conexiones entre barras (líneas flotantes)
      for (let i = 0; i < positions.length - 1; i++) {
        const current = positions[i]
        const next = positions[i + 1]
        const segment = waterfallSegments[i]

        if (segment.type !== "total") {
          const startX = current.x + barWidth
          const startY = current.y + (segment.value < 0 ? current.height : 0)
          const endX = next.x
          const endY = next.y

          const gradient = ctx.createLinearGradient(startX, startY, endX, endY)
          gradient.addColorStop(0, `${segment.color}60`)
          gradient.addColorStop(1, `${waterfallSegments[i + 1].color}60`)

          ctx.strokeStyle = gradient
          ctx.lineWidth = 2
          ctx.setLineDash([5, 3])
          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.stroke()
          ctx.setLineDash([])

          // Partículas flotando en las conexiones
          if (Math.random() > 0.95) {
            const t = Math.random()
            const x = startX + (endX - startX) * t
            const y = startY + (endY - startY) * t

            ctx.beginPath()
            ctx.arc(x, y, 2, 0, Math.PI * 2)
            ctx.fillStyle = segment.color
            ctx.shadowBlur = 10
            ctx.shadowColor = segment.color
            ctx.fill()
            ctx.shadowBlur = 0
          }
        }
      }

      // Dibujar barras con efecto líquido
      waterfallSegments.forEach((segment, i) => {
        const position = positions[i]
        const isHovered = hoveredIndex === i
        const progress = Math.min(animationProgress * 1.5, 1)
        const currentHeight = position.height * progress

        const x = position.x
        const y = position.y + (position.height - currentHeight)

        // Sombra de la barra
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
        ctx.fillRect(x + 5, y + currentHeight + 5, barWidth, 10)

        // Gradiente líquido de la barra
        const barGradient = ctx.createLinearGradient(x, y, x, y + currentHeight)
        barGradient.addColorStop(0, `${segment.color}ff`)
        barGradient.addColorStop(0.5, `${segment.color}cc`)
        barGradient.addColorStop(1, `${segment.color}88`)

        // Barra principal
        ctx.fillStyle = barGradient
        ctx.fillRect(x, y, barWidth, currentHeight)

        // Efecto de líquido (ondas en la parte superior)
        if (progress >= 0.9) {
          const waveAmplitude = isHovered ? 4 : 2
          const waveFrequency = 4
          ctx.beginPath()
          for (let wx = 0; wx <= barWidth; wx += 2) {
            const waveY = y + Math.sin((wx / barWidth) * Math.PI * waveFrequency + time * 3) * waveAmplitude
            if (wx === 0) {
              ctx.moveTo(x + wx, waveY)
            } else {
              ctx.lineTo(x + wx, waveY)
            }
          }
          ctx.lineTo(x + barWidth, y)
          ctx.lineTo(x, y)
          ctx.closePath()
          ctx.fillStyle = `${segment.color}aa`
          ctx.fill()
        }

        // Reflejo brillante
        const highlightGradient = ctx.createLinearGradient(x, y, x + barWidth / 2, y)
        highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)")
        highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = highlightGradient
        ctx.fillRect(x, y, barWidth * 0.3, currentHeight)

        // Borde brillante si hover
        if (isHovered) {
          ctx.strokeStyle = "#ffffff"
          ctx.lineWidth = 3
          ctx.shadowBlur = 20
          ctx.shadowColor = segment.color
          ctx.strokeRect(x, y, barWidth, currentHeight)
          ctx.shadowBlur = 0
        }

        // Gotas cayendo (efecto de cascada)
        if (progress >= 0.9 && Math.random() > 0.85) {
          const dropX = x + Math.random() * barWidth
          const dropY = y + currentHeight + (Math.random() * 20)
          
          ctx.beginPath()
          ctx.arc(dropX, dropY, 3, 0, Math.PI * 2)
          ctx.fillStyle = `${segment.color}aa`
          ctx.fill()

          // Salpicadura al caer
          ctx.beginPath()
          ctx.arc(dropX, height - 80, 2, 0, Math.PI * 2)
          ctx.fillStyle = `${segment.color}40`
          ctx.fill()
        }

        // Label del segmento
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 12px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(segment.label, x + barWidth / 2, height - 60)

        // Valor
        ctx.font = "bold 14px sans-serif"
        ctx.fillStyle = segment.type === "total" ? segment.color : segment.value > 0 ? "#10b981" : "#ef4444"
        const valueText = `${segment.value > 0 ? "+" : ""}$${(Math.abs(segment.value) / 1000).toFixed(0)}k`
        ctx.fillText(valueText, x + barWidth / 2, y - 10)

        // Ícono
        const icon = segment.value > 0 ? "↑" : segment.value < 0 ? "↓" : "●"
        ctx.font = "20px sans-serif"
        ctx.fillStyle = segment.color
        ctx.fillText(icon, x + barWidth / 2, y - 30)
      })

      // Título
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 20px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("Cascada de Ganancias", width / 2, 30)

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [waterfallSegments, hoveredIndex, animationProgress, width, height])

  // Detectar hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const { positions, barWidth } = calculatePositions()

    let found = false
    positions.forEach((pos, i) => {
      const segment = waterfallSegments[i]
      const progress = Math.min(animationProgress * 1.5, 1)
      const currentHeight = pos.height * progress
      const barY = pos.y + (pos.height - currentHeight)

      if (x >= pos.x && x <= pos.x + barWidth && y >= barY && y <= barY + currentHeight) {
        setHoveredIndex(i)
        found = true
      }
    })

    if (!found) setHoveredIndex(null)
  }

  return (
    <div className={`relative ${className}`}>
      <motion.canvas
        ref={canvasRef}
        width={width}
        height={height}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl cursor-pointer"
        style={{ boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)" }}
        onMouseMove={handleMouseMove}
      />

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredIndex !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="backdrop-blur-xl bg-black/90 rounded-xl px-6 py-4 border border-white/20">
              {(() => {
                const segment = waterfallSegments[hoveredIndex]
                const Icon = segment.value > 0 ? TrendingUp : segment.value < 0 ? TrendingDown : DollarSign
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${segment.color}30` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: segment.color }} />
                      </div>
                      <div>
                        <p className="text-white font-bold">{segment.label}</p>
                        <p className="text-white/60 text-xs capitalize">{segment.type}</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold" style={{ color: segment.color }}>
                      {segment.value > 0 ? "+" : ""}${(Math.abs(segment.value) / 1000).toFixed(1)}k
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Percent className="w-3 h-3 text-white/60" />
                      <p className="text-white/60 text-xs">
                        {((Math.abs(segment.value) / 1500000) * 100).toFixed(1)}% del total
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leyenda */}
      <div className="absolute bottom-4 right-4 backdrop-blur-xl bg-black/60 rounded-xl p-4 border border-white/20">
        <p className="text-white text-xs font-semibold mb-2">Tipos</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <p className="text-white/80 text-xs">Positivo</p>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-3 h-3 text-red-500" />
            <p className="text-white/80 text-xs">Negativo</p>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-3 h-3 text-purple-500" />
            <p className="text-white/80 text-xs">Total</p>
          </div>
        </div>
      </div>
    </div>
  )
}
