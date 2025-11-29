"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useAnimation } from "framer-motion"
import { TrendingUp, DollarSign, Percent, Zap } from "lucide-react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  life: number
  maxLife: number
  color: string
}

interface MetricData {
  label: string
  value: number
  change: number
  icon: typeof TrendingUp
  color: string
}

interface InteractiveMetricsOrbProps {
  metrics: MetricData[]
  size?: number
  className?: string
}

export function InteractiveMetricsOrb({
  metrics = [
    { label: "Ventas", value: 1250000, change: 12.5, icon: DollarSign, color: "#10b981" },
    { label: "Ganancias", value: 380000, change: 8.3, icon: TrendingUp, color: "#3b82f6" },
    { label: "ROI", value: 34.5, change: 4.2, icon: Percent, color: "#f59e0b" },
    { label: "Eficiencia", value: 92, change: 2.1, icon: Zap, color: "#8b5cf6" }
  ],
  size = 400,
  className = ""
}: InteractiveMetricsOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const [hoveredMetric, setHoveredMetric] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const controls = useAnimation()

  // Formatear números
  const formatValue = (value: number, label: string) => {
    if (label === "ROI" || label === "Eficiencia") return `${value}%`
    return `$${(value / 1000).toFixed(0)}k`
  }

  // Crear partículas
  const createParticles = (count: number, centerX: number, centerY: number, color: string) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const velocity = 0.5 + Math.random() * 1.5
      particlesRef.current.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: 2 + Math.random() * 3,
        life: 100,
        maxLife: 100,
        color
      })
    }
  }

  // Animación del canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = size * 0.35
    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.01

      // Gradiente de fondo del orbe
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      
      if (hoveredMetric !== null) {
        const color = metrics[hoveredMetric].color
        gradient.addColorStop(0, `${color}40`)
        gradient.addColorStop(0.5, `${color}20`)
        gradient.addColorStop(1, `${color}05`)
      } else {
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)")
        gradient.addColorStop(0.5, "rgba(139, 92, 246, 0.15)")
        gradient.addColorStop(1, "rgba(16, 185, 129, 0.05)")
      }

      // Dibujar orbe principal con pulso
      const pulseScale = 1 + Math.sin(time * 2) * 0.03
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * pulseScale, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Anillos orbitales
      for (let i = 0; i < 3; i++) {
        const ringRadius = radius * (0.5 + i * 0.2)
        const ringOpacity = 0.3 - i * 0.1
        const ringOffset = time * (1 + i * 0.5)

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(ringOffset)
        
        ctx.strokeStyle = `rgba(100, 200, 255, ${ringOpacity})`
        ctx.lineWidth = 2
        ctx.setLineDash([10, 10])
        ctx.beginPath()
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2)
        ctx.stroke()
        
        ctx.restore()
      }

      // Dibujar y actualizar partículas
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life -= 1

        if (particle.life <= 0) return false

        const opacity = particle.life / particle.maxLife
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = `${particle.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`
        ctx.fill()

        // Agregar glow
        ctx.shadowBlur = 10
        ctx.shadowColor = particle.color
        ctx.fill()
        ctx.shadowBlur = 0

        return true
      })

      // Líneas de energía conectando al mouse
      if (hoveredMetric !== null) {
        const metric = metrics[hoveredMetric]
        const metricAngle = (hoveredMetric / metrics.length) * Math.PI * 2 - Math.PI / 2
        const metricX = centerX + Math.cos(metricAngle) * radius * 0.9
        const metricY = centerY + Math.sin(metricAngle) * radius * 0.9

        ctx.strokeStyle = `${metric.color}80`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(metricX, metricY)
        ctx.lineTo(mousePos.x, mousePos.y)
        ctx.stroke()

        // Crear partículas en la línea
        if (Math.random() > 0.7) {
          createParticles(2, metricX, metricY, metric.color)
        }
      }

      // Núcleo brillante central
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30)
      coreGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)")
      coreGradient.addColorStop(0.5, "rgba(100, 200, 255, 0.6)")
      coreGradient.addColorStop(1, "rgba(100, 200, 255, 0)")
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, 20 + Math.sin(time * 3) * 5, 0, Math.PI * 2)
      ctx.fillStyle = coreGradient
      ctx.fill()

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [hoveredMetric, mousePos, size, metrics])

  // Manejar hover de métricas
  const handleMetricHover = (index: number, event: React.MouseEvent) => {
    setHoveredMetric(index)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      setMousePos({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      })
      // Crear explosión de partículas
      const centerX = size / 2
      const centerY = size / 2
      createParticles(15, centerX, centerY, metrics[index].color)
    }
    controls.start({ scale: 1.05, transition: { duration: 0.3 } })
  }

  const handleMetricLeave = () => {
    setHoveredMetric(null)
    controls.start({ scale: 1, transition: { duration: 0.3 } })
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Canvas del orbe */}
      <motion.canvas
        ref={canvasRef}
        width={size}
        height={size}
        animate={controls}
        className="rounded-3xl"
        style={{
          filter: "drop-shadow(0 20px 60px rgba(59, 130, 246, 0.3))"
        }}
      />

      {/* Métricas orbitales */}
      <div className="absolute inset-0 pointer-events-none">
        {metrics.map((metric, index) => {
          const angle = (index / metrics.length) * Math.PI * 2 - Math.PI / 2
          const distance = size * 0.42
          const x = size / 2 + Math.cos(angle) * distance
          const y = size / 2 + Math.sin(angle) * distance

          const Icon = metric.icon

          return (
            <motion.div
              key={metric.label}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: "translate(-50%, -50%)"
              }}
              className="pointer-events-auto"
              onMouseEnter={(e) => handleMetricHover(index, e)}
              onMouseLeave={handleMetricLeave}
              onMouseMove={(e) => {
                const rect = canvasRef.current?.getBoundingClientRect()
                if (rect) {
                  setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                  })
                }
              }}
            >
              <motion.div
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`relative cursor-pointer ${
                  hoveredMetric === index ? "z-20" : "z-10"
                }`}
              >
                {/* Card de métrica */}
                <div
                  className="backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-2xl min-w-[140px]"
                  style={{
                    background: hoveredMetric === index
                      ? `linear-gradient(135deg, ${metric.color}40, ${metric.color}20)`
                      : "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))"
                  }}
                >
                  {/* Icono */}
                  <motion.div
                    animate={hoveredMetric === index ? {
                      rotate: [0, -10, 10, -10, 0],
                      transition: { duration: 0.5 }
                    } : {}}
                    className="flex items-center justify-center w-10 h-10 rounded-xl mb-2"
                    style={{ backgroundColor: `${metric.color}30` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: metric.color }} />
                  </motion.div>

                  {/* Label */}
                  <p className="text-xs text-white/60 font-medium mb-1">{metric.label}</p>

                  {/* Valor */}
                  <motion.p
                    animate={hoveredMetric === index ? { scale: [1, 1.1, 1] } : {}}
                    className="text-2xl font-bold text-white mb-1"
                  >
                    {formatValue(metric.value, metric.label)}
                  </motion.p>

                  {/* Cambio */}
                  <div className="flex items-center gap-1">
                    <TrendingUp
                      className={`w-3 h-3 ${metric.change >= 0 ? "text-green-400" : "text-red-400"}`}
                      style={{
                        transform: metric.change < 0 ? "rotate(180deg)" : "none"
                      }}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        metric.change >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {metric.change >= 0 ? "+" : ""}{metric.change}%
                    </span>
                  </div>

                  {/* Barra de progreso animada */}
                  <motion.div
                    className="mt-2 h-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: `${metric.color}20` }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.abs(metric.change) * 5}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                  </motion.div>
                </div>

                {/* Glow effect al hover */}
                {hoveredMetric === index && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 -z-10 rounded-2xl blur-xl"
                    style={{ backgroundColor: metric.color }}
                  />
                )}
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Tooltip flotante */}
      {hoveredMetric !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        >
          <div className="backdrop-blur-xl bg-black/80 rounded-xl px-6 py-3 border border-white/20 shadow-2xl">
            <p className="text-white text-sm font-medium">
              Click para ver detalles de {metrics[hoveredMetric].label}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
