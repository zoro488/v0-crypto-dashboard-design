'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Users, Package, TrendingUp } from 'lucide-react'

interface FlowNode {
  id: string
  label: string
  value: number
  x: number
  y: number
  color: string
  icon: typeof ShoppingCart
}

interface FlowLink {
  source: string
  target: string
  value: number
  particles: FlowParticle[]
}

interface FlowParticle {
  progress: number
  speed: number
  size: number
}

interface SalesFlowDiagramProps {
  data?: {
    nodes: FlowNode[]
    links: FlowLink[]
  }
  width?: number
  height?: number
  className?: string
}

export function SalesFlowDiagram({
  data,
  width = 800,
  height = 500,
  className = '',
}: SalesFlowDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Datos por defecto
  const defaultData = {
    nodes: [
      { id: 'productos', label: 'Productos', value: 100, x: 100, y: 250, color: '#8b5cf6', icon: Package },
      { id: 'ventas', label: 'Ventas', value: 80, x: 300, y: 200, color: '#3b82f6', icon: ShoppingCart },
      { id: 'distribuidores', label: 'Distribuidores', value: 50, x: 300, y: 300, color: '#10b981', icon: Users },
      { id: 'clientes', label: 'Clientes', value: 120, x: 500, y: 250, color: '#f59e0b', icon: Users },
      { id: 'ganancias', label: 'Ganancias', value: 65, x: 700, y: 250, color: '#ef4444', icon: TrendingUp },
    ],
    links: [
      { source: 'productos', target: 'ventas', value: 60, particles: [] },
      { source: 'productos', target: 'distribuidores', value: 40, particles: [] },
      { source: 'ventas', target: 'clientes', value: 50, particles: [] },
      { source: 'distribuidores', target: 'clientes', value: 30, particles: [] },
      { source: 'clientes', target: 'ganancias', value: 65, particles: [] },
    ],
  }

  const flowData = data || defaultData

  // Inicializar partículas en los enlaces
  useEffect(() => {
    flowData.links.forEach(link => {
      if (link.particles.length === 0) {
        const particleCount = Math.ceil(link.value / 10)
        for (let i = 0; i < particleCount; i++) {
          link.particles.push({
            progress: Math.random(),
            speed: 0.002 + Math.random() * 0.003,
            size: 3 + Math.random() * 4,
          })
        }
      }
    })
  }, [flowData])

  // Encontrar nodo por ID
  const getNode = (id: string) => flowData.nodes.find(n => n.id === id)

  // Calcular posición de Bézier
  const getBezierPoint = (t: number, p0: {x: number, y: number}, p1: {x: number, y: number}) => {
    const cp1x = p0.x + (p1.x - p0.x) * 0.3
    const cp1y = p0.y
    const cp2x = p0.x + (p1.x - p0.x) * 0.7
    const cp2y = p1.y

    const x = Math.pow(1 - t, 3) * p0.x +
              3 * Math.pow(1 - t, 2) * t * cp1x +
              3 * (1 - t) * Math.pow(t, 2) * cp2x +
              Math.pow(t, 3) * p1.x

    const y = Math.pow(1 - t, 3) * p0.y +
              3 * Math.pow(1 - t, 2) * t * cp1y +
              3 * (1 - t) * Math.pow(t, 2) * cp2y +
              Math.pow(t, 3) * p1.y

    return { x, y }
  }

  // Animación del canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Dibujar enlaces con curvas Bézier
      flowData.links.forEach(link => {
        const source = getNode(link.source)
        const target = getNode(link.target)
        if (!source || !target) return

        const isHovered = hoveredLink === `${link.source}-${link.target}`
        const isRelated = hoveredNode === link.source || hoveredNode === link.target

        // Curva del enlace
        const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y)
        gradient.addColorStop(0, source.color)
        gradient.addColorStop(1, target.color)

        ctx.strokeStyle = isHovered || isRelated
          ? gradient
          : `${source.color}40`
        ctx.lineWidth = isHovered ? Math.log(link.value) * 3 : Math.log(link.value) * 2
        ctx.lineCap = 'round'

        // Dibujar curva Bézier
        const cp1x = source.x + (target.x - source.x) * 0.3
        const cp1y = source.y
        const cp2x = source.x + (target.x - source.x) * 0.7
        const cp2y = target.y

        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, target.x, target.y)
        ctx.stroke()

        // Dibujar partículas en movimiento
        link.particles.forEach(particle => {
          particle.progress += particle.speed
          if (particle.progress > 1) particle.progress = 0

          const pos = getBezierPoint(particle.progress, source, target)

          // Glow de la partícula
          const particleGradient = ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, particle.size * 2,
          )
          particleGradient.addColorStop(0, `${target.color}ff`)
          particleGradient.addColorStop(0.5, `${target.color}80`)
          particleGradient.addColorStop(1, `${target.color}00`)

          ctx.beginPath()
          ctx.arc(pos.x, pos.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = particleGradient
          ctx.fill()

          // Shadow/glow effect
          ctx.shadowBlur = 15
          ctx.shadowColor = target.color
          ctx.fill()
          ctx.shadowBlur = 0
        })

        // Flecha al final del enlace
        if (isHovered || isRelated) {
          const endPos = getBezierPoint(0.95, source, target)
          const beforeEnd = getBezierPoint(0.9, source, target)
          const angle = Math.atan2(endPos.y - beforeEnd.y, endPos.x - beforeEnd.x)

          ctx.save()
          ctx.translate(endPos.x, endPos.y)
          ctx.rotate(angle)
          ctx.fillStyle = target.color
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(-10, -5)
          ctx.lineTo(-10, 5)
          ctx.closePath()
          ctx.fill()
          ctx.restore()
        }
      })

      // Dibujar nodos
      flowData.nodes.forEach(node => {
        const isHovered = hoveredNode === node.id
        const isSelected = selectedNode === node.id
        const nodeRadius = 30 + (node.value / 10)

        // Shadow/glow del nodo
        if (isHovered || isSelected) {
          ctx.shadowBlur = 30
          ctx.shadowColor = node.color
        }

        // Círculo exterior (anillo pulsante)
        if (isHovered) {
          ctx.strokeStyle = `${node.color}60`
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.arc(node.x, node.y, nodeRadius + 10, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Gradiente del nodo
        const nodeGradient = ctx.createRadialGradient(
          node.x - nodeRadius * 0.3,
          node.y - nodeRadius * 0.3,
          0,
          node.x,
          node.y,
          nodeRadius,
        )
        nodeGradient.addColorStop(0, `${node.color}ff`)
        nodeGradient.addColorStop(1, `${node.color}cc`)

        // Círculo del nodo
        ctx.beginPath()
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2)
        ctx.fillStyle = nodeGradient
        ctx.fill()

        // Borde del nodo
        ctx.strokeStyle = isHovered || isSelected ? '#ffffff' : `${node.color}40`
        ctx.lineWidth = isHovered || isSelected ? 3 : 2
        ctx.stroke()

        ctx.shadowBlur = 0

        // Valor del nodo (texto)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${node.value}`, node.x, node.y)

        // Label debajo del nodo
        ctx.font = '12px sans-serif'
        ctx.fillStyle = isHovered ? '#ffffff' : '#ffffff99'
        ctx.fillText(node.label, node.x, node.y + nodeRadius + 20)
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [flowData, hoveredNode, hoveredLink, selectedNode])

  // Detectar hover sobre nodos
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Detectar hover sobre nodos
    let foundNode = false
    for (const node of flowData.nodes) {
      const nodeRadius = 30 + (node.value / 10)
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      if (distance < nodeRadius) {
        setHoveredNode(node.id)
        foundNode = true
        break
      }
    }
    if (!foundNode) setHoveredNode(null)

    // Detectar hover sobre enlaces
    let foundLink = false
    for (const link of flowData.links) {
      const source = getNode(link.source)
      const target = getNode(link.target)
      if (!source || !target) continue

      // Simplificado: detectar proximidad a la línea
      for (let t = 0; t <= 1; t += 0.05) {
        const pos = getBezierPoint(t, source, target)
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)
        if (distance < 15) {
          setHoveredLink(`${link.source}-${link.target}`)
          foundLink = true
          break
        }
      }
      if (foundLink) break
    }
    if (!foundLink) setHoveredLink(null)
  }

  const handleCanvasClick = () => {
    if (hoveredNode) {
      setSelectedNode(selectedNode === hoveredNode ? null : hoveredNode)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <motion.canvas
        ref={canvasRef}
        width={width}
        height={height}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, rgba(10, 10, 30, 0.95), rgba(30, 20, 50, 0.95))',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onMouseMove={handleCanvasMouseMove}
        onClick={handleCanvasClick}
      />

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="backdrop-blur-xl bg-black/80 rounded-xl px-6 py-3 border border-white/20">
              {(() => {
                const node = getNode(hoveredNode)
                if (!node) return null
                const Icon = node.icon
                return (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${node.color}30` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: node.color }} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{node.label}</p>
                      <p className="text-white/60 text-xs">Volumen: ${node.value}k</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </motion.div>
        )}
        
        {hoveredLink && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="backdrop-blur-xl bg-black/80 rounded-xl px-6 py-3 border border-white/20">
              {(() => {
                const [sourceId, targetId] = hoveredLink.split('-')
                const link = flowData.links.find(l => l.source === sourceId && l.target === targetId)
                const source = getNode(sourceId)
                const target = getNode(targetId)
                if (!link || !source || !target) return null
                return (
                  <p className="text-white text-sm">
                    {source.label} → {target.label}: <span className="font-bold">${link.value}k</span>
                  </p>
                )
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leyenda */}
      <div className="absolute top-4 right-4 backdrop-blur-xl bg-black/60 rounded-xl p-4 border border-white/20">
        <p className="text-white text-xs font-semibold mb-2">Leyenda</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <p className="text-white/80 text-xs">Productos</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <p className="text-white/80 text-xs">Ventas</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <p className="text-white/80 text-xs">Distribuidores</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <p className="text-white/80 text-xs">Clientes</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <p className="text-white/80 text-xs">Ganancias</p>
          </div>
        </div>
      </div>
    </div>
  )
}
