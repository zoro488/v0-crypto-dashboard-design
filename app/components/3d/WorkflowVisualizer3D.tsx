'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Card } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  Circle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GitBranch,
  ArrowRight,
} from 'lucide-react'
import { logger } from '@/app/lib/utils/logger'

// ============================================
// INTERFACES Y TIPOS
// ============================================
export interface WorkflowNode {
  id: string;
  name: string;
  type: 'start' | 'process' | 'decision' | 'end' | 'wait' | 'parallel';
  status: 'pending' | 'active' | 'completed' | 'error' | 'skipped';
  data?: Record<string, unknown>;
  position?: { x: number; y: number };
  duration?: number; // milisegundos
  description?: string;
}

export interface WorkflowConnection {
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

export interface WorkflowVisualizer3DProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  title?: string;
  height?: number;
  onNodeClick?: (node: WorkflowNode) => void;
  autoPlay?: boolean;
  playSpeed?: number;
}

// ============================================
// CONFIGURACIÓN DE COLORES Y ESTILOS
// ============================================
const STATUS_CONFIG = {
  pending: {
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.2)',
    borderColor: 'rgba(107, 114, 128, 0.5)',
    icon: Clock,
    label: 'Pendiente',
  },
  active: {
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    icon: Loader2,
    label: 'En proceso',
  },
  completed: {
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
    icon: CheckCircle,
    label: 'Completado',
  },
  error: {
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    icon: XCircle,
    label: 'Error',
  },
  skipped: {
    color: '#9ca3af',
    bgColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: 'rgba(156, 163, 175, 0.3)',
    icon: Circle,
    label: 'Omitido',
  },
}

const NODE_TYPE_CONFIG = {
  start: { shape: 'circle', size: 40 },
  process: { shape: 'rect', size: 60 },
  decision: { shape: 'diamond', size: 50 },
  end: { shape: 'circle', size: 40 },
  wait: { shape: 'rect', size: 50 },
  parallel: { shape: 'rect', size: 70 },
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const WorkflowVisualizer3D = ({
  nodes,
  connections,
  title = 'Flujo de Trabajo',
  height = 500,
  onNodeClick,
  autoPlay = false,
  playSpeed = 1000,
}: WorkflowVisualizer3DProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentStep, setCurrentStep] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [animatedConnections, setAnimatedConnections] = useState<Set<string>>(new Set())

  // Calcular estadísticas
  const statusCounts = {
    pending: nodes.filter(n => n.status === 'pending').length,
    active: nodes.filter(n => n.status === 'active').length,
    completed: nodes.filter(n => n.status === 'completed').length,
    error: nodes.filter(n => n.status === 'error').length,
  }

  const completionRate = nodes.length > 0 
    ? Math.round((statusCounts.completed / nodes.length) * 100) 
    : 0

  // ============================================
  // CÁLCULO DE POSICIONES DE NODOS
  // ============================================
  const calculateNodePositions = useCallback(() => {
    const positions: Map<string, { x: number; y: number }> = new Map()
    const canvas = canvasRef.current
    if (!canvas) return positions

    const width = canvas.width / (window.devicePixelRatio || 1)
    const height = canvas.height / (window.devicePixelRatio || 1)
    const centerX = width / 2
    const centerY = height / 2

    // Si los nodos tienen posiciones definidas, usarlas
    const hasDefinedPositions = nodes.some(n => n.position)

    if (hasDefinedPositions) {
      nodes.forEach(node => {
        if (node.position) {
          positions.set(node.id, {
            x: node.position.x * zoom + offset.x + centerX,
            y: node.position.y * zoom + offset.y + centerY,
          })
        }
      })
    } else {
      // Layout automático en forma de flujo horizontal
      const levels = organizeNodesInLevels(nodes, connections)
      const levelSpacing = 150 * zoom
      const nodeSpacing = 100 * zoom

      levels.forEach((level, levelIndex) => {
        const levelX = (levelIndex - levels.length / 2) * levelSpacing + centerX + offset.x
        const startY = -(level.length - 1) * nodeSpacing / 2 + centerY + offset.y

        level.forEach((nodeId, nodeIndex) => {
          positions.set(nodeId, {
            x: levelX,
            y: startY + nodeIndex * nodeSpacing,
          })
        })
      })
    }

    return positions
  }, [nodes, connections, zoom, offset])

  // Organizar nodos en niveles para layout automático
  const organizeNodesInLevels = (nodes: WorkflowNode[], connections: WorkflowConnection[]): string[][] => {
    const levels: string[][] = []
    const visited = new Set<string>()
    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    // Encontrar nodos de inicio
    const startNodes = nodes.filter(n => 
      n.type === 'start' || 
      !connections.some(c => c.to === n.id),
    )

    const queue = startNodes.map(n => ({ id: n.id, level: 0 }))

    while (queue.length > 0) {
      const { id, level } = queue.shift()!

      if (visited.has(id)) continue
      visited.add(id)

      if (!levels[level]) levels[level] = []
      levels[level].push(id)

      // Encontrar nodos conectados
      const nextNodes = connections
        .filter(c => c.from === id)
        .map(c => c.to)
        .filter(nextId => !visited.has(nextId))

      nextNodes.forEach(nextId => {
        queue.push({ id: nextId, level: level + 1 })
      })
    }

    // Agregar nodos no visitados
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        if (!levels[0]) levels[0] = []
        levels[0].push(node.id)
      }
    })

    return levels
  }

  // ============================================
  // RENDERIZADO DEL CANVAS
  // ============================================
  const drawWorkflow = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height)

    // Fondo con gradiente
    const bgGradient = ctx.createLinearGradient(0, 0, width, height)
    bgGradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)')
    bgGradient.addColorStop(0.5, 'rgba(30, 41, 59, 0.95)')
    bgGradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // Grid de fondo
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)'
    ctx.lineWidth = 1
    const gridSize = 30 * zoom
    for (let x = offset.x % gridSize; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = offset.y % gridSize; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    const positions = calculateNodePositions()

    // Dibujar conexiones
    connections.forEach((conn, index) => {
      const fromPos = positions.get(conn.from)
      const toPos = positions.get(conn.to)

      if (!fromPos || !toPos) return

      const fromNode = nodes.find(n => n.id === conn.from)
      const toNode = nodes.find(n => n.id === conn.to)

      // Color de la conexión basado en el estado
      let connectionColor = 'rgba(148, 163, 184, 0.3)'
      if (fromNode?.status === 'completed' && toNode?.status === 'completed') {
        connectionColor = 'rgba(16, 185, 129, 0.5)'
      } else if (fromNode?.status === 'completed' && toNode?.status === 'active') {
        connectionColor = 'rgba(59, 130, 246, 0.5)'
      } else if (fromNode?.status === 'error' || toNode?.status === 'error') {
        connectionColor = 'rgba(239, 68, 68, 0.3)'
      }

      // Dibujar línea curva
      ctx.beginPath()
      ctx.strokeStyle = connectionColor
      ctx.lineWidth = 2 * zoom

      const midX = (fromPos.x + toPos.x) / 2
      const controlOffset = Math.abs(fromPos.y - toPos.y) * 0.3

      ctx.moveTo(fromPos.x, fromPos.y)
      ctx.bezierCurveTo(
        midX - controlOffset, fromPos.y,
        midX + controlOffset, toPos.y,
        toPos.x, toPos.y,
      )
      ctx.stroke()

      // Flecha al final
      const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x)
      const arrowSize = 8 * zoom

      ctx.beginPath()
      ctx.fillStyle = connectionColor
      ctx.moveTo(
        toPos.x - arrowSize * Math.cos(angle - Math.PI / 6),
        toPos.y - arrowSize * Math.sin(angle - Math.PI / 6),
      )
      ctx.lineTo(toPos.x, toPos.y)
      ctx.lineTo(
        toPos.x - arrowSize * Math.cos(angle + Math.PI / 6),
        toPos.y - arrowSize * Math.sin(angle + Math.PI / 6),
      )
      ctx.closePath()
      ctx.fill()

      // Etiqueta de conexión
      if (conn.label) {
        ctx.font = `${10 * zoom}px Inter, sans-serif`
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)'
        ctx.textAlign = 'center'
        ctx.fillText(conn.label, midX, (fromPos.y + toPos.y) / 2 - 5)
      }
    })

    // Dibujar nodos
    nodes.forEach(node => {
      const pos = positions.get(node.id)
      if (!pos) return

      const config = STATUS_CONFIG[node.status]
      const typeConfig = NODE_TYPE_CONFIG[node.type]
      const size = typeConfig.size * zoom
      const isSelected = selectedNode?.id === node.id

      // Sombra y glow
      if (node.status === 'active' || isSelected) {
        ctx.shadowColor = config.color
        ctx.shadowBlur = 20
      }

      // Dibujar forma según tipo
      ctx.beginPath()

      switch (typeConfig.shape) {
        case 'circle':
          ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2)
          break
        case 'diamond':
          ctx.moveTo(pos.x, pos.y - size / 2)
          ctx.lineTo(pos.x + size / 2, pos.y)
          ctx.lineTo(pos.x, pos.y + size / 2)
          ctx.lineTo(pos.x - size / 2, pos.y)
          ctx.closePath()
          break
        case 'rect':
        default:
          const radius = 8 * zoom
          ctx.roundRect(
            pos.x - size / 2,
            pos.y - size / 3,
            size,
            size * 0.66,
            radius,
          )
          break
      }

      // Relleno y borde
      ctx.fillStyle = config.bgColor
      ctx.fill()
      ctx.strokeStyle = isSelected ? config.color : config.borderColor
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.stroke()

      ctx.shadowBlur = 0

      // Icono del estado
      const IconComponent = config.icon
      ctx.fillStyle = config.color
      ctx.font = `${14 * zoom}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Simular icono con texto (en producción usaríamos imágenes o SVG)
      const iconSymbols = {
        pending: '⏳',
        active: '⚡',
        completed: '✓',
        error: '✕',
        skipped: '○',
      }
      ctx.fillText(iconSymbols[node.status], pos.x, pos.y)

      // Nombre del nodo
      ctx.font = `bold ${11 * zoom}px Inter, sans-serif`
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.fillText(
        node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name,
        pos.x,
        pos.y + size / 2 + 15 * zoom,
      )

      // Indicador de pulso para nodos activos
      if (node.status === 'active') {
        const pulseSize = size / 2 + Math.sin(Date.now() / 200) * 5
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, pulseSize, 0, Math.PI * 2)
        ctx.strokeStyle = `${config.color}40`
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })

  }, [nodes, connections, calculateNodePositions, selectedNode, zoom, offset])

  // ============================================
  // EFECTOS Y ANIMACIÓN
  // ============================================
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Configurar tamaño
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const animate = () => {
      drawWorkflow(ctx, rect.width, rect.height)
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [drawWorkflow])

  // Auto-play del flujo
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1
        if (next >= nodes.length) {
          setIsPlaying(false)
          return 0
        }
        return next
      })
    }, playSpeed)

    return () => clearInterval(interval)
  }, [isPlaying, nodes.length, playSpeed])

  // ============================================
  // HANDLERS
  // ============================================
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const positions = calculateNodePositions()

    // Buscar nodo clickeado
    let clickedNode: WorkflowNode | null = null
    nodes.forEach(node => {
      const pos = positions.get(node.id)
      if (!pos) return

      const typeConfig = NODE_TYPE_CONFIG[node.type]
      const size = typeConfig.size * zoom
      const distance = Math.sqrt((clickX - pos.x) ** 2 + (clickY - pos.y) ** 2)

      if (distance < size / 2 + 10) {
        clickedNode = node
      }
    })

    if (clickedNode) {
      setSelectedNode(clickedNode)
      onNodeClick?.(clickedNode)
    } else {
      setSelectedNode(null)
    }
  }

  const handleZoomIn = () => setZoom(prev => Math.min(2, prev + 0.2))
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.2))
  const handleReset = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setSelectedNode(null)
    setCurrentStep(0)
    setIsPlaying(false)
  }

  const togglePlay = () => setIsPlaying(prev => !prev)

  // ============================================
  // RENDER
  // ============================================
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-700/50">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <GitBranch className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                {nodes.length} pasos • {connections.length} conexiones
              </p>
            </div>
          </div>

          {/* Controles de reproducción */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlay}
              className="bg-slate-800/50 border-slate-700 hover:bg-slate-700"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 mr-1" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              {isPlaying ? 'Pausar' : 'Reproducir'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="bg-slate-800/50 border-slate-700 hover:bg-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3 mt-4">
          {Object.entries(statusCounts).map(([status, count]) => {
            if (count === 0) return null
            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
            const Icon = config.icon
            return (
              <Badge
                key={status}
                variant="secondary"
                className="flex items-center gap-1.5 px-2 py-1"
                style={{
                  backgroundColor: config.bgColor,
                  borderColor: config.borderColor,
                  color: config.color,
                }}
              >
                <Icon className={`w-3 h-3 ${status === 'active' ? 'animate-spin' : ''}`} />
                {count} {config.label}
              </Badge>
            )
          })}

          {/* Barra de progreso */}
          <div className="flex-1 ml-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-sm font-medium text-white">{completionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas del Workflow */}
      <div className="relative" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
        />

        {/* Controles de zoom */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomIn}
            className="p-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition border border-white/10"
            title="Acercar"
          >
            <ZoomIn className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomOut}
            className="p-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition border border-white/10"
            title="Alejar"
          >
            <ZoomOut className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setZoom(1)
              setOffset({ x: 0, y: 0 })
            }}
            className="p-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition border border-white/10"
            title="Ajustar"
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Panel de nodo seleccionado */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-xl p-4 rounded-xl border border-slate-700"
          >
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition"
            >
              ✕
            </button>

            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: STATUS_CONFIG[selectedNode.status].bgColor,
                  borderColor: STATUS_CONFIG[selectedNode.status].borderColor,
                }}
              >
                {(() => {
                  const Icon = STATUS_CONFIG[selectedNode.status].icon
                  return (
                    <Icon
                      className={`w-6 h-6 ${selectedNode.status === 'active' ? 'animate-spin' : ''}`}
                      style={{ color: STATUS_CONFIG[selectedNode.status].color }}
                    />
                  )
                })()}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-white font-semibold">{selectedNode.name}</h4>
                  <Badge
                    className="text-xs"
                    style={{
                      backgroundColor: STATUS_CONFIG[selectedNode.status].bgColor,
                      color: STATUS_CONFIG[selectedNode.status].color,
                    }}
                  >
                    {STATUS_CONFIG[selectedNode.status].label}
                  </Badge>
                </div>

                <p className="text-sm text-slate-400">
                  Tipo: <span className="capitalize">{selectedNode.type}</span>
                </p>

                {selectedNode.description && (
                  <p className="text-sm text-slate-300 mt-2">{selectedNode.description}</p>
                )}

                {selectedNode.duration && (
                  <p className="text-xs text-slate-500 mt-2">
                    Duración: {(selectedNode.duration / 1000).toFixed(2)}s
                  </p>
                )}

                {selectedNode.data && (
                  <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs font-mono text-slate-400 overflow-auto max-h-32">
                    <pre>{JSON.stringify(selectedNode.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export default WorkflowVisualizer3D
