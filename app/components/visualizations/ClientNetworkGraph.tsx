"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Building2, Search } from "lucide-react"

interface ClientNode {
  id: string
  name: string
  type: "cliente" | "distribuidor" | "empresa"
  value: number
  connections: string[]
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

interface ClientNetworkGraphProps {
  nodes?: ClientNode[]
  width?: number
  height?: number
  className?: string
}

export function ClientNetworkGraph({
  nodes,
  width = 900,
  height = 700,
  className = ""
}: ClientNetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const nodesRef = useRef<ClientNode[]>([])
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Generar nodos por defecto
  const generateDefaultNodes = (): ClientNode[] => {
    const colors = {
      cliente: "#3b82f6",
      distribuidor: "#10b981",
      empresa: "#8b5cf6"
    }

    const defaultNodes: ClientNode[] = []
    const centerX = width / 2
    const centerY = height / 2

    for (let i = 0; i < 30; i++) {
      const type = i < 10 ? "cliente" : i < 20 ? "distribuidor" : "empresa"
      const angle = (i / 30) * Math.PI * 2
      const distance = 150 + Math.random() * 150

      defaultNodes.push({
        id: `node-${i}`,
        name: `${type === "cliente" ? "Cliente" : type === "distribuidor" ? "Distribuidor" : "Empresa"} ${i + 1}`,
        type: type as any,
        value: Math.random() * 100000 + 10000,
        connections: [],
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: 15 + Math.random() * 15,
        color: colors[type as keyof typeof colors]
      })
    }

    // Crear conexiones aleatorias
    defaultNodes.forEach(node => {
      const connectionCount = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < connectionCount; i++) {
        const targetNode = defaultNodes[Math.floor(Math.random() * defaultNodes.length)]
        if (targetNode.id !== node.id && !node.connections.includes(targetNode.id)) {
          node.connections.push(targetNode.id)
        }
      }
    })

    return defaultNodes
  }

  useEffect(() => {
    nodesRef.current = nodes || generateDefaultNodes()
  }, [nodes])

  // Simulación de física (force-directed graph)
  const applyForces = () => {
    const centerX = width / 2
    const centerY = height / 2

    nodesRef.current.forEach(node => {
      // Repulsión entre nodos
      nodesRef.current.forEach(other => {
        if (node.id === other.id) return

        const dx = node.x - other.x
        const dy = node.y - other.y
        const distance = Math.sqrt(dx ** 2 + dy ** 2) || 1

        if (distance < 200) {
          const force = (200 - distance) / 200 * 0.5
          node.vx += (dx / distance) * force
          node.vy += (dy / distance) * force
        }
      })

      // Atracción hacia el centro
      const dx = centerX - node.x
      const dy = centerY - node.y
      const distance = Math.sqrt(dx ** 2 + dy ** 2)
      node.vx += (dx / distance) * 0.01
      node.vy += (dy / distance) * 0.01

      // Aplicar fricción
      node.vx *= 0.9
      node.vy *= 0.9

      // Actualizar posición
      node.x += node.vx
      node.y += node.vy

      // Mantener dentro del canvas
      const margin = node.radius + 10
      if (node.x < margin) { node.x = margin; node.vx *= -0.5 }
      if (node.x > width - margin) { node.x = width - margin; node.vx *= -0.5 }
      if (node.y < margin) { node.y = margin; node.vy *= -0.5 }
      if (node.y > height - margin) { node.y = height - margin; node.vy *= -0.5 }
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.01

      // Fondo
      const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2)
      bgGradient.addColorStop(0, "rgba(20, 20, 40, 1)")
      bgGradient.addColorStop(1, "rgba(10, 10, 20, 1)")
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Actualizar física
      applyForces()

      // Filtrar nodos por búsqueda
      const filteredNodes = searchTerm
        ? nodesRef.current.filter(n => n.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : nodesRef.current

      // Dibujar conexiones
      nodesRef.current.forEach(node => {
        node.connections.forEach((connId: string) => {
          const connNode = nodesRef.current.find(n => n.id === connId)
          if (!connNode) return

          const isHighlighted = hoveredNode === node.id || hoveredNode === connId ||
                               selectedNode === node.id || selectedNode === connId ||
                               (searchTerm && (filteredNodes.includes(node) || filteredNodes.includes(connNode)))

          // Gradiente de conexión
          const gradient = ctx.createLinearGradient(node.x, node.y, connNode.x, connNode.y)
          gradient.addColorStop(0, `${node.color}${isHighlighted ? '80' : '20'}`)
          gradient.addColorStop(1, `${connNode.color}${isHighlighted ? '80' : '20'}`)

          ctx.strokeStyle = gradient
          ctx.lineWidth = isHighlighted ? 2 : 1
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(connNode.x, connNode.y)
          ctx.stroke()

          // Partículas en conexiones activas
          if (isHighlighted && Math.random() > 0.9) {
            const t = Math.random()
            const x = node.x + (connNode.x - node.x) * t
            const y = node.y + (connNode.y - node.y) * t

            ctx.beginPath()
            ctx.arc(x, y, 2, 0, Math.PI * 2)
            ctx.fillStyle = node.color
            ctx.shadowBlur = 10
            ctx.shadowColor = node.color
            ctx.fill()
            ctx.shadowBlur = 0
          }
        })
      })

      // Dibujar nodos
      nodesRef.current.forEach(node => {
        const isHovered = hoveredNode === node.id
        const isSelected = selectedNode === node.id
        const isHighlighted = searchTerm && filteredNodes.includes(node)
        const isActive = isHovered || isSelected || isHighlighted

        // Pulso si está activo
        const pulseScale = isActive ? 1 + Math.sin(time * 5) * 0.1 : 1
        const radius = node.radius * pulseScale

        // Glow
        if (isActive) {
          ctx.shadowBlur = 30
          ctx.shadowColor = node.color
        }

        // Gradiente del nodo
        const nodeGradient = ctx.createRadialGradient(
          node.x - radius * 0.3, node.y - radius * 0.3, 0,
          node.x, node.y, radius
        )
        nodeGradient.addColorStop(0, `${node.color}ff`)
        nodeGradient.addColorStop(1, `${node.color}cc`)

        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = nodeGradient
        ctx.fill()

        // Borde
        ctx.strokeStyle = isActive ? "#ffffff" : `${node.color}60`
        ctx.lineWidth = isActive ? 3 : 1.5
        ctx.stroke()

        ctx.shadowBlur = 0

        // Icono
        const icon = node.type === "cliente" ? "👤" : node.type === "distribuidor" ? "🏢" : "🏭"
        ctx.font = `${radius * 0.8}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(icon, node.x, node.y)

        // Label si está activo
        if (isActive) {
          ctx.fillStyle = "#ffffff"
          ctx.font = "bold 11px sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "top"
          ctx.fillText(node.name, node.x, node.y + radius + 8)
        }
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [hoveredNode, selectedNode, searchTerm, width, height])

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
      if (distance < node.radius) {
        setHoveredNode(node.id)
        found = true
        break
      }
    }
    if (!found) setHoveredNode(null)
  }

  const handleClick = () => {
    if (hoveredNode) {
      setSelectedNode(selectedNode === hoveredNode ? null : hoveredNode)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Barra de búsqueda */}
      <div className="absolute top-4 left-4 z-20">
        <div className="backdrop-blur-xl bg-black/60 rounded-xl px-4 py-2 border border-white/20 flex items-center gap-2">
          <Search className="w-4 h-4 text-white/60" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-white text-sm outline-none placeholder-white/40 w-48"
          />
        </div>
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
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="backdrop-blur-xl bg-black/90 rounded-xl px-6 py-4 border border-white/20">
              {(() => {
                const node = nodesRef.current.find(n => n.id === hoveredNode)
                if (!node) return null
                const Icon = node.type === "cliente" ? User : Building2
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${node.color}30` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: node.color }} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{node.name}</p>
                        <p className="text-white/60 text-xs capitalize">{node.type}</p>
                      </div>
                    </div>
                    <div className="text-white text-lg font-bold">
                      ${(node.value / 1000).toFixed(1)}k
                    </div>
                    <p className="text-white/60 text-xs mt-1">
                      {node.connections.length} conexiones
                    </p>
                  </div>
                )
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="absolute bottom-4 right-4 backdrop-blur-xl bg-black/60 rounded-xl p-4 border border-white/20">
        <p className="text-white text-xs font-semibold mb-2">Red de Clientes</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <p className="text-white/80 text-xs">Clientes</p>
            </div>
            <p className="text-white text-xs font-bold">
              {nodesRef.current.filter(n => n.type === "cliente").length}
            </p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <p className="text-white/80 text-xs">Distribuidores</p>
            </div>
            <p className="text-white text-xs font-bold">
              {nodesRef.current.filter(n => n.type === "distribuidor").length}
            </p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <p className="text-white/80 text-xs">Empresas</p>
            </div>
            <p className="text-white text-xs font-bold">
              {nodesRef.current.filter(n => n.type === "empresa").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
