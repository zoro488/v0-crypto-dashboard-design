"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Box, Package, AlertTriangle, TrendingUp } from "lucide-react"

interface InventoryItem {
  id: string
  product: string
  stock: number
  minStock: number
  maxStock: number
  movement: number // velocidad de rotación
  category: string
  gridX: number
  gridY: number
}

interface InventoryHeatGridProps {
  items?: InventoryItem[]
  gridSize?: number
  cellSize?: number
  className?: string
}

export function InventoryHeatGrid({
  items,
  gridSize = 8,
  cellSize = 80,
  className = ""
}: InventoryHeatGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null)
  const [rotation, setRotation] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const width = gridSize * cellSize + 100
  const height = gridSize * cellSize + 100

  // Generar items por defecto
  const defaultItems: InventoryItem[] = []
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const stock = Math.floor(Math.random() * 200)
      const minStock = 20
      const maxStock = 150
      defaultItems.push({
        id: `item-${x}-${y}`,
        product: `Producto ${x * gridSize + y + 1}`,
        stock,
        minStock,
        maxStock,
        movement: Math.random() * 10 + 1,
        category: ["Electrónica", "Ropa", "Alimentos", "Hogar"][Math.floor(Math.random() * 4)],
        gridX: x,
        gridY: y
      })
    }
  }

  const inventoryItems = items || defaultItems

  // Calcular color según stock
  const getStockColor = (item: InventoryItem) => {
    const ratio = item.stock / item.maxStock
    if (ratio < 0.2) return "#ef4444" // Rojo - stock crítico
    if (ratio < 0.5) return "#f59e0b" // Amarillo - stock bajo
    if (ratio < 0.8) return "#10b981" // Verde - stock normal
    return "#3b82f6" // Azul - stock alto
  }

  // Calcular altura isométrica
  const getIsoHeight = (stock: number, maxStock: number) => {
    return (stock / maxStock) * cellSize * 0.8
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

      // Gradiente de fondo
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      bgGradient.addColorStop(0, "rgba(15, 15, 30, 1)")
      bgGradient.addColorStop(1, "rgba(30, 20, 50, 1)")
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Dibujar grid isométrico
      const offsetX = 50
      const offsetY = 50
      const isoAngle = Math.PI / 6 // 30 grados

      inventoryItems.forEach(item => {
        // Posición isométrica
        const x = offsetX + (item.gridX - item.gridY) * (cellSize * Math.cos(isoAngle))
        const y = offsetY + (item.gridX + item.gridY) * (cellSize * Math.sin(isoAngle))
        const height = getIsoHeight(item.stock, item.maxStock)
        const color = getStockColor(item)

        const isHovered = hoveredItem?.id === item.id
        const pulseScale = isHovered ? 1 + Math.sin(time * 5) * 0.05 : 1

        // Sombra
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
        ctx.beginPath()
        ctx.ellipse(x, y + height, cellSize * 0.3 * pulseScale, cellSize * 0.15 * pulseScale, 0, 0, Math.PI * 2)
        ctx.fill()

        // Cara frontal (isométrica)
        ctx.save()
        ctx.translate(x, y)

        // Top face
        ctx.beginPath()
        ctx.moveTo(0, -height)
        ctx.lineTo(cellSize * 0.4, -height - cellSize * 0.2)
        ctx.lineTo(0, -height - cellSize * 0.4)
        ctx.lineTo(-cellSize * 0.4, -height - cellSize * 0.2)
        ctx.closePath()

        const topGradient = ctx.createLinearGradient(0, -height, 0, -height - cellSize * 0.4)
        topGradient.addColorStop(0, color)
        topGradient.addColorStop(1, `${color}cc`)
        ctx.fillStyle = topGradient
        ctx.fill()

        // Left face
        ctx.beginPath()
        ctx.moveTo(-cellSize * 0.4, -height - cellSize * 0.2)
        ctx.lineTo(-cellSize * 0.4, -cellSize * 0.2)
        ctx.lineTo(0, 0)
        ctx.lineTo(0, -height)
        ctx.closePath()

        ctx.fillStyle = `${color}99`
        ctx.fill()

        // Right face  
        ctx.beginPath()
        ctx.moveTo(cellSize * 0.4, -height - cellSize * 0.2)
        ctx.lineTo(cellSize * 0.4, -cellSize * 0.2)
        ctx.lineTo(0, 0)
        ctx.lineTo(0, -height)
        ctx.closePath()

        ctx.fillStyle = `${color}66`
        ctx.fill()

        // Borde brillante si hover
        if (isHovered) {
          ctx.strokeStyle = "#ffffff"
          ctx.lineWidth = 3
          ctx.shadowBlur = 20
          ctx.shadowColor = color
          ctx.stroke()
          ctx.shadowBlur = 0
        }

        ctx.restore()

        // Partículas si stock crítico
        if (item.stock < item.minStock && Math.random() > 0.8) {
          for (let i = 0; i < 3; i++) {
            const px = x + (Math.random() - 0.5) * cellSize
            const py = y - height + (Math.random() - 0.5) * cellSize

            ctx.beginPath()
            ctx.arc(px, py, 2, 0, Math.PI * 2)
            ctx.fillStyle = "#ef4444"
            ctx.shadowBlur = 10
            ctx.shadowColor = "#ef4444"
            ctx.fill()
            ctx.shadowBlur = 0
          }
        }

        // Label si hover
        if (isHovered) {
          ctx.fillStyle = "#ffffff"
          ctx.font = "bold 10px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText(`${item.stock}`, x, y - height - cellSize * 0.5)
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
  }, [inventoryItems, hoveredItem, cellSize, gridSize])

  // Detectar hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setMousePos({ x, y })

    const offsetX = 50
    const offsetY = 50
    const isoAngle = Math.PI / 6

    let found = false
    for (const item of inventoryItems) {
      const itemX = offsetX + (item.gridX - item.gridY) * (cellSize * Math.cos(isoAngle))
      const itemY = offsetY + (item.gridX + item.gridY) * (cellSize * Math.sin(isoAngle))
      const height = getIsoHeight(item.stock, item.maxStock)

      const distance = Math.sqrt((x - itemX) ** 2 + (y - (itemY - height / 2)) ** 2)
      if (distance < cellSize * 0.5) {
        setHoveredItem(item)
        found = true
        break
      }
    }
    if (!found) setHoveredItem(null)
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
        style={{
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)"
        }}
        onMouseMove={handleMouseMove}
      />

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: "absolute",
              left: mousePos.x,
              top: mousePos.y - 100,
              transform: "translate(-50%, 0)"
            }}
            className="z-20 pointer-events-none"
          >
            <div className="backdrop-blur-xl bg-black/90 rounded-xl px-4 py-3 border border-white/20">
              <p className="text-white font-bold text-sm mb-1">{hoveredItem.product}</p>
              <p className="text-white/60 text-xs mb-2">{hoveredItem.category}</p>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" style={{ color: getStockColor(hoveredItem) }} />
                <span className="text-white text-sm font-semibold">
                  Stock: {hoveredItem.stock}/{hoveredItem.maxStock}
                </span>
              </div>
              {hoveredItem.stock < hoveredItem.minStock && (
                <div className="flex items-center gap-1 mt-2 text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-xs">¡Stock crítico!</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leyenda */}
      <div className="absolute top-4 right-4 backdrop-blur-xl bg-black/60 rounded-xl p-4 border border-white/20">
        <p className="text-white text-xs font-semibold mb-2">Niveles de Stock</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ef4444" }} />
            <p className="text-white/80 text-xs">Crítico (&lt;20%)</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#f59e0b" }} />
            <p className="text-white/80 text-xs">Bajo (20-50%)</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#10b981" }} />
            <p className="text-white/80 text-xs">Normal (50-80%)</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#3b82f6" }} />
            <p className="text-white/80 text-xs">Alto (&gt;80%)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
