"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Zap, Activity, Sparkles } from "lucide-react"

interface NeuralNode {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  activity: number
  layer: number
  connections: string[]
}

interface AIBrainVisualizerProps {
  isThinking?: boolean
  activityLevel?: number
  width?: number
  height?: number
  className?: string
}

export function AIBrainVisualizer({
  isThinking = false,
  activityLevel = 0.5,
  width = 900,
  height = 700,
  className = ""
}: AIBrainVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const nodesRef = useRef<NeuralNode[]>([])
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [pulseIntensity, setPulseIntensity] = useState(0)

  // Generar red neuronal
  const generateNeuralNetwork = () => {
    const nodes: NeuralNode[] = []
    const layers = 5
    const nodesPerLayer = [8, 12, 16, 12, 8]

    nodesPerLayer.forEach((count, layer) => {
      const layerX = (width / (layers + 1)) * (layer + 1)
      const spacing = height / (count + 1)

      for (let i = 0; i < count; i++) {
        const node: NeuralNode = {
          id: `node-${layer}-${i}`,
          x: layerX + (Math.random() - 0.5) * 40,
          y: spacing * (i + 1) + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          radius: 8 + Math.random() * 6,
          activity: Math.random(),
          layer,
          connections: []
        }
        nodes.push(node)
      }
    })

    // Crear conexiones entre capas adyacentes
    nodes.forEach(node => {
      const nextLayerNodes = nodes.filter(n => n.layer === node.layer + 1)
      const connectionCount = Math.floor(Math.random() * 4) + 2

      for (let i = 0; i < Math.min(connectionCount, nextLayerNodes.length); i++) {
        const targetNode = nextLayerNodes[Math.floor(Math.random() * nextLayerNodes.length)]
        if (!node.connections.includes(targetNode.id)) {
          node.connections.push(targetNode.id)
        }
      }
    })

    return nodes
  }

  useEffect(() => {
    nodesRef.current = generateNeuralNetwork()
  }, [])

  // Actualizar actividad neuronal
  useEffect(() => {
    if (isThinking) {
      const interval = setInterval(() => {
        setPulseIntensity(prev => (prev + 0.1) % 1)
        
        nodesRef.current.forEach(node => {
          node.activity = Math.min(1, node.activity + (Math.random() - 0.3) * 0.3)
          if (node.activity < 0) node.activity = 0
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isThinking])

  // Animación del cerebro
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.02

      // Fondo con efecto cerebral
      const bgGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width / 2
      )
      bgGradient.addColorStop(0, "rgba(30, 20, 50, 1)")
      bgGradient.addColorStop(0.5, "rgba(20, 15, 40, 1)")
      bgGradient.addColorStop(1, "rgba(10, 10, 25, 1)")
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Ondas cerebrales de fondo
      if (isThinking) {
        for (let i = 0; i < 3; i++) {
          const waveY = height / 2 + Math.sin(time + i * 2) * 100
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 - i * 0.03})`
          ctx.lineWidth = 2
          ctx.beginPath()
          
          for (let x = 0; x <= width; x += 10) {
            const y = waveY + Math.sin((x / 50) + time * 2 + i) * 30
            if (x === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
          ctx.stroke()
        }
      }

      // Dibujar conexiones sinápticas
      nodesRef.current.forEach(node => {
        node.connections.forEach(connId => {
          const targetNode = nodesRef.current.find(n => n.id === connId)
          if (!targetNode) return

          const isActive = node.activity > 0.5 && targetNode.activity > 0.5
          const isPulsing = isThinking && Math.sin(time * 5 + node.activity * 10) > 0

          // Gradiente de conexión
          const gradient = ctx.createLinearGradient(node.x, node.y, targetNode.x, targetNode.y)
          const opacity = isActive ? '60' : '20'
          gradient.addColorStop(0, `rgba(139, 92, 246, 0.${opacity})`)
          gradient.addColorStop(0.5, `rgba(59, 130, 246, 0.${opacity})`)
          gradient.addColorStop(1, `rgba(16, 185, 129, 0.${opacity})`)

          ctx.strokeStyle = gradient
          ctx.lineWidth = isActive ? 2 : 1
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(targetNode.x, targetNode.y)
          ctx.stroke()

          // Pulsos eléctricos en las conexiones
          if (isPulsing && isActive) {
            const pulseProgress = (time * 2 + node.activity) % 1
            const pulseX = node.x + (targetNode.x - node.x) * pulseProgress
            const pulseY = node.y + (targetNode.y - node.y) * pulseProgress

            // Chispa eléctrica
            ctx.beginPath()
            ctx.arc(pulseX, pulseY, 4, 0, Math.PI * 2)
            ctx.fillStyle = "#ffffff"
            ctx.shadowBlur = 20
            ctx.shadowColor = "#8b5cf6"
            ctx.fill()
            ctx.shadowBlur = 0

            // Rastro de la chispa
            for (let i = 1; i <= 3; i++) {
              const trailProgress = Math.max(0, pulseProgress - i * 0.05)
              const trailX = node.x + (targetNode.x - node.x) * trailProgress
              const trailY = node.y + (targetNode.y - node.y) * trailProgress
              
              ctx.beginPath()
              ctx.arc(trailX, trailY, 2, 0, Math.PI * 2)
              ctx.fillStyle = `rgba(139, 92, 246, ${0.6 - i * 0.2})`
              ctx.fill()
            }
          }
        })
      })

      // Actualizar y dibujar nodos
      nodesRef.current.forEach(node => {
        // Física suave
        node.x += node.vx
        node.y += node.vy

        // Fricción
        node.vx *= 0.95
        node.vy *= 0.95

        // Mantener dentro del canvas
        const margin = 50
        if (node.x < margin || node.x > width - margin) node.vx *= -1
        if (node.y < margin || node.y > height - margin) node.vy *= -1

        const isHovered = hoveredNode === node.id
        const isActive = node.activity > 0.6
        const pulseScale = isThinking ? 1 + Math.sin(time * 3 + node.activity * 5) * 0.15 : 1
        const radius = node.radius * (isHovered ? 1.3 : 1) * pulseScale

        // Glow si activo
        if (isActive) {
          ctx.shadowBlur = 25
          ctx.shadowColor = "#8b5cf6"
        }

        // Color según actividad
        const activityColor = 
          node.activity > 0.7 ? "#8b5cf6" :
          node.activity > 0.4 ? "#3b82f6" :
          node.activity > 0.2 ? "#10b981" : "#6b7280"

        // Gradiente del nodo
        const nodeGradient = ctx.createRadialGradient(
          node.x - radius * 0.3, node.y - radius * 0.3, 0,
          node.x, node.y, radius
        )
        nodeGradient.addColorStop(0, "#ffffff")
        nodeGradient.addColorStop(0.4, activityColor)
        nodeGradient.addColorStop(1, `${activityColor}cc`)

        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = nodeGradient
        ctx.fill()

        // Anillo exterior si muy activo
        if (node.activity > 0.8) {
          ctx.strokeStyle = `${activityColor}60`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2)
          ctx.stroke()
        }

        ctx.shadowBlur = 0

        // Partículas emanando si thinking
        if (isThinking && isActive && Math.random() > 0.9) {
          const angle = Math.random() * Math.PI * 2
          const distance = radius + 10 + Math.random() * 20
          const px = node.x + Math.cos(angle) * distance
          const py = node.y + Math.sin(angle) * distance

          ctx.beginPath()
          ctx.arc(px, py, 2, 0, Math.PI * 2)
          ctx.fillStyle = activityColor
          ctx.shadowBlur = 10
          ctx.shadowColor = activityColor
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })

      // Indicador de actividad
      if (isThinking) {
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 14px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("🧠 Procesando...", width / 2, 40)

        // Barra de actividad
        const barWidth = 200
        const barX = (width - barWidth) / 2
        const barY = 60

        ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
        ctx.fillRect(barX, barY, barWidth, 6)

        ctx.fillStyle = "#8b5cf6"
        ctx.fillRect(barX, barY, barWidth * activityLevel, 6)

        ctx.shadowBlur = 10
        ctx.shadowColor = "#8b5cf6"
        ctx.fillRect(barX, barY, barWidth * activityLevel, 6)
        ctx.shadowBlur = 0
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isThinking, activityLevel, hoveredNode, pulseIntensity, width, height])

  // Detectar hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let found = false
    for (const node of nodesRef.current) {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      if (distance < node.radius * 1.5) {
        setHoveredNode(node.id)
        found = true
        break
      }
    }
    if (!found) setHoveredNode(null)
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

      {/* Controles */}
      <div className="absolute top-4 left-4 backdrop-blur-xl bg-black/60 rounded-xl p-4 border border-white/20">
        <div className="flex items-center gap-3 mb-3">
          <Brain className="w-5 h-5 text-purple-500" />
          <p className="text-white font-bold text-sm">Red Neural IA</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <p className="text-white/60 text-xs">Nodos activos:</p>
            <p className="text-white text-xs font-bold">
              {nodesRef.current.filter(n => n.activity > 0.5).length}/{nodesRef.current.length}
            </p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-white/60 text-xs">Conexiones:</p>
            <p className="text-white text-xs font-bold">
              {nodesRef.current.reduce((acc, n) => acc + n.connections.length, 0)}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {isThinking ? (
              <>
                <Activity className="w-4 h-4 text-purple-500 animate-pulse" />
                <p className="text-purple-400 text-xs font-semibold">Pensando...</p>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-green-500" />
                <p className="text-green-400 text-xs font-semibold">En espera</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="backdrop-blur-xl bg-black/90 rounded-xl px-6 py-3 border border-white/20">
              {(() => {
                const node = nodesRef.current.find(n => n.id === hoveredNode)
                if (!node) return null
                return (
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-white text-xs">
                        Capa {node.layer + 1} • Actividad: {(node.activity * 100).toFixed(0)}%
                      </p>
                      <p className="text-white/60 text-xs">
                        {node.connections.length} conexiones
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
