"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, FileText, TrendingUp, DollarSign, Package, Users, ChevronLeft, ChevronRight } from "lucide-react"

interface TimelineEvent {
  id: string
  date: Date
  title: string
  description: string
  type: "venta" | "compra" | "reporte" | "cliente" | "inventario"
  value?: number
  icon: typeof FileText
  color: string
}

interface ReportsTimelineProps {
  events?: TimelineEvent[]
  width?: number
  height?: number
  className?: string
}

export function ReportsTimeline({
  events,
  width = 1000,
  height = 700,
  className = ""
}: ReportsTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [timeOffset, setTimeOffset] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Generar eventos por defecto
  const generateDefaultEvents = (): TimelineEvent[] => {
    const types = [
      { type: "venta", icon: DollarSign, color: "#10b981" },
      { type: "compra", icon: Package, color: "#3b82f6" },
      { type: "reporte", icon: FileText, color: "#8b5cf6" },
      { type: "cliente", icon: Users, color: "#f59e0b" },
      { type: "inventario", icon: Package, color: "#ef4444" }
    ]

    const defaultEvents: TimelineEvent[] = []
    const now = new Date()

    for (let i = 0; i < 30; i++) {
      const daysAgo = Math.floor(Math.random() * 90)
      const date = new Date(now)
      date.setDate(date.getDate() - daysAgo)

      const typeData = types[Math.floor(Math.random() * types.length)]

      defaultEvents.push({
        id: `event-${i}`,
        date,
        title: `${typeData.type.charAt(0).toUpperCase() + typeData.type.slice(1)} #${i + 1}`,
        description: `Evento generado automáticamente`,
        type: typeData.type as any,
        value: Math.random() * 100000,
        icon: typeData.icon,
        color: typeData.color
      })
    }

    return defaultEvents.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const timelineEvents = events || generateDefaultEvents()

  // Calcular posición en espiral
  const getSpiralPosition = (index: number, totalEvents: number) => {
    const angle = (index / totalEvents) * Math.PI * 8 + timeOffset
    const radius = 100 + (index / totalEvents) * 250 * zoomLevel
    const centerX = width / 2
    const centerY = height / 2

    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      angle
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.005

      // Gradiente de fondo
      const bgGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width / 2
      )
      bgGradient.addColorStop(0, "rgba(20, 20, 40, 1)")
      bgGradient.addColorStop(1, "rgba(10, 10, 20, 1)")
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Dibujar espiral de fondo
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < 100; i++) {
        const pos = getSpiralPosition(i, 100)
        if (i === 0) {
          ctx.moveTo(pos.x, pos.y)
        } else {
          ctx.lineTo(pos.x, pos.y)
        }
      }
      ctx.stroke()

      // Dibujar línea de tiempo
      timelineEvents.forEach((event, index) => {
        const pos = getSpiralPosition(index, timelineEvents.length)
        
        if (index < timelineEvents.length - 1) {
          const nextPos = getSpiralPosition(index + 1, timelineEvents.length)
          
          const gradient = ctx.createLinearGradient(pos.x, pos.y, nextPos.x, nextPos.y)
          gradient.addColorStop(0, `${event.color}40`)
          gradient.addColorStop(1, `${timelineEvents[index + 1].color}40`)
          
          ctx.strokeStyle = gradient
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(pos.x, pos.y)
          ctx.lineTo(nextPos.x, nextPos.y)
          ctx.stroke()

          // Partículas fluyendo en la línea
          if (Math.random() > 0.95) {
            const t = Math.random()
            const particleX = pos.x + (nextPos.x - pos.x) * t
            const particleY = pos.y + (nextPos.y - pos.y) * t

            ctx.beginPath()
            ctx.arc(particleX, particleY, 2, 0, Math.PI * 2)
            ctx.fillStyle = event.color
            ctx.shadowBlur = 10
            ctx.shadowColor = event.color
            ctx.fill()
            ctx.shadowBlur = 0
          }
        }
      })

      // Dibujar eventos
      timelineEvents.forEach((event, index) => {
        const pos = getSpiralPosition(index, timelineEvents.length)
        const isHovered = hoveredEvent?.id === event.id
        const isSelected = selectedEvent?.id === event.id
        const isActive = isHovered || isSelected

        // Pulso
        const pulseScale = isActive ? 1 + Math.sin(time * 5) * 0.15 : 1
        const radius = (20 + (event.value || 0) / 5000) * pulseScale

        // Glow
        if (isActive) {
          ctx.shadowBlur = 30
          ctx.shadowColor = event.color
        }

        // Gradiente del nodo
        const nodeGradient = ctx.createRadialGradient(
          pos.x - radius * 0.3, pos.y - radius * 0.3, 0,
          pos.x, pos.y, radius
        )
        nodeGradient.addColorStop(0, "#ffffff")
        nodeGradient.addColorStop(0.4, event.color)
        nodeGradient.addColorStop(1, `${event.color}cc`)

        ctx.beginPath()
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = nodeGradient
        ctx.fill()

        // Borde
        ctx.strokeStyle = isActive ? "#ffffff" : `${event.color}80`
        ctx.lineWidth = isActive ? 3 : 2
        ctx.stroke()

        ctx.shadowBlur = 0

        // Anillos orbitales si seleccionado
        if (isSelected) {
          for (let i = 1; i <= 2; i++) {
            ctx.strokeStyle = `${event.color}${(60 - i * 20).toString(16)}`
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(pos.x, pos.y, radius + i * 15, 0, Math.PI * 2)
            ctx.stroke()
          }
        }

        // Ícono (emoji según tipo)
        const icon = 
          event.type === "venta" ? "💰" :
          event.type === "compra" ? "📦" :
          event.type === "reporte" ? "📄" :
          event.type === "cliente" ? "👤" : "📊"

        ctx.font = `${radius * 0.8}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(icon, pos.x, pos.y)

        // Fecha si es activo
        if (isActive) {
          ctx.fillStyle = "#ffffff"
          ctx.font = "bold 11px sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "top"
          const dateStr = event.date.toLocaleDateString("es", { month: "short", day: "numeric" })
          ctx.fillText(dateStr, pos.x, pos.y + radius + 8)
        }

        // Indicador de profundidad (sombra)
        const depth = index / timelineEvents.length
        ctx.fillStyle = `rgba(0, 0, 0, ${depth * 0.3})`
        ctx.beginPath()
        ctx.ellipse(pos.x, pos.y + radius + 5, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2)
        ctx.fill()
      })

      // Centro de la espiral (punto focal)
      const centerGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, 50
      )
      centerGradient.addColorStop(0, "rgba(139, 92, 246, 0.8)")
      centerGradient.addColorStop(1, "rgba(139, 92, 246, 0)")

      ctx.beginPath()
      ctx.arc(width / 2, height / 2, 30, 0, Math.PI * 2)
      ctx.fillStyle = centerGradient
      ctx.fill()

      ctx.strokeStyle = "#8b5cf6"
      ctx.lineWidth = 3
      ctx.stroke()

      // Icono central
      ctx.font = "20px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = "#ffffff"
      ctx.fillText("📅", width / 2, height / 2)

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [timelineEvents, hoveredEvent, selectedEvent, timeOffset, zoomLevel, width, height])

  // Detectar hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let found = false
    timelineEvents.forEach((event, index) => {
      const pos = getSpiralPosition(index, timelineEvents.length)
      const radius = 20 + (event.value || 0) / 5000
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)

      if (distance < radius) {
        setHoveredEvent(event)
        found = true
      }
    })

    if (!found) setHoveredEvent(null)
  }

  const handleClick = () => {
    if (hoveredEvent) {
      setSelectedEvent(selectedEvent?.id === hoveredEvent.id ? null : hoveredEvent)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Controles de navegación */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTimeOffset(prev => prev - 0.5)}
          className="backdrop-blur-xl bg-black/60 rounded-xl p-3 border border-white/20 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTimeOffset(prev => prev + 0.5)}
          className="backdrop-blur-xl bg-black/60 rounded-xl p-3 border border-white/20 hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2))}
          className="backdrop-blur-xl bg-black/60 rounded-xl p-3 border border-white/20 hover:bg-white/10 transition-colors"
        >
          <p className="text-white text-sm font-bold">+</p>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
          className="backdrop-blur-xl bg-black/60 rounded-xl p-3 border border-white/20 hover:bg-white/10 transition-colors"
        >
          <p className="text-white text-sm font-bold">-</p>
        </motion.button>
      </div>

      <motion.canvas
        ref={canvasRef}
        width={width}
        height={height}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl cursor-pointer"
        style={{ boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)" }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-4 right-4 z-20 pointer-events-none max-w-sm"
          >
            <div className="backdrop-blur-xl bg-black/90 rounded-xl px-6 py-4 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${hoveredEvent.color}30` }}
                >
                  <hoveredEvent.icon className="w-6 h-6" style={{ color: hoveredEvent.color }} />
                </div>
                <div>
                  <p className="text-white font-bold">{hoveredEvent.title}</p>
                  <p className="text-white/60 text-xs">
                    {hoveredEvent.date.toLocaleDateString("es", { 
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
              </div>
              <p className="text-white/80 text-sm mb-3">{hoveredEvent.description}</p>
              {hoveredEvent.value && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" style={{ color: hoveredEvent.color }} />
                  <p className="text-white font-bold">
                    ${(hoveredEvent.value / 1000).toFixed(1)}k
                  </p>
                </div>
              )}
              <p className="text-white/40 text-xs mt-3">Click para detalles</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel de información */}
      <div className="absolute bottom-4 left-4 backdrop-blur-xl bg-black/60 rounded-xl p-4 border border-white/20">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-purple-500" />
          <p className="text-white font-bold text-sm">Timeline de Eventos</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <p className="text-white/60 text-xs">Total eventos:</p>
            <p className="text-white text-xs font-bold">{timelineEvents.length}</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-white/60 text-xs">Zoom:</p>
            <p className="text-white text-xs font-bold">{(zoomLevel * 100).toFixed(0)}%</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
          {["venta", "compra", "reporte", "cliente", "inventario"].map(type => {
            const count = timelineEvents.filter(e => e.type === type).length
            const color = 
              type === "venta" ? "#10b981" :
              type === "compra" ? "#3b82f6" :
              type === "reporte" ? "#8b5cf6" :
              type === "cliente" ? "#f59e0b" : "#ef4444"
            
            return (
              <div key={type} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <p className="text-white/80 text-xs capitalize">{type}</p>
                </div>
                <p className="text-white text-xs font-bold">{count}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
