'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import * as d3 from 'd3'
import {
  ShoppingCart, Package, DollarSign, TrendingUp, Users,
  FileText, CheckCircle, AlertCircle, Clock, ArrowRight,
} from 'lucide-react'
import { PremiumCard } from '@/app/components/ui/PremiumCard'
import { logger } from '@/app/lib/utils/logger'

interface FlowNode {
  id: string
  name: string
  type: 'orden' | 'venta' | 'banco' | 'cliente' | 'stock'
  value: number
  status: 'completed' | 'pending' | 'processing' | 'warning'
  x?: number
  y?: number
}

interface FlowLink {
  source: string
  target: string
  value: number
  type: 'ingreso' | 'egreso' | 'transferencia'
}

interface OperationFlowProps {
  ventas: any[]
  clientes: any[]
  ordenes: any[]
  bancos: any[]
  className?: string
}

export function AutomatedOperationFlow({
  ventas = [],
  clientes = [],
  ordenes = [],
  bancos = [],
  className = '',
}: OperationFlowProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [flowData, setFlowData] = useState<{ nodes: FlowNode[]; links: FlowLink[] }>({
    nodes: [],
    links: [],
  })

  // GENERAR DATOS DEL FLUJO AUTOMÁTICAMENTE
  useEffect(() => {
    logger.info('Generando datos de flujo operacional', {
      context: 'AutomatedOperationFlow',
      data: { ventas: ventas.length, ordenes: ordenes.length },
    })

    const nodes: FlowNode[] = []
    const links: FlowLink[] = []

    // 1. NODO: ÓRDENES DE COMPRA
    const totalOrdenesCompra = ordenes.reduce((sum, o) => sum + ((o.cantidad || 0) * (o.costoDistribuidor || 0)), 0)
    const ordenesActivas = ordenes.filter(o => (o.deuda || 0) > 0).length
    nodes.push({
      id: 'ordenes',
      name: 'Órdenes de Compra',
      type: 'orden',
      value: totalOrdenesCompra,
      status: ordenesActivas > 0 ? 'processing' : 'completed',
    })

    // 2. NODO: STOCK/ALMACÉN
    const totalUnidadesCompradas = ordenes.reduce((sum, o) => sum + (o.cantidad || 0), 0)
    const totalUnidadesVendidas = ventas.reduce((sum, v) => sum + (v.cantidad || 0), 0)
    const stockDisponible = totalUnidadesCompradas - totalUnidadesVendidas
    nodes.push({
      id: 'stock',
      name: 'Almacén',
      type: 'stock',
      value: stockDisponible,
      status: stockDisponible < 100 ? 'warning' : 'completed',
    })

    // Link: Órdenes → Stock
    links.push({
      source: 'ordenes',
      target: 'stock',
      value: totalUnidadesCompradas,
      type: 'transferencia',
    })

    // 3. NODO: VENTAS
    const totalIngresos = ventas.reduce((sum, v) => sum + (v.ingreso || 0), 0)
    const ventasPendientes = ventas.filter(v => v.estatus === 'Pendiente').length
    nodes.push({
      id: 'ventas',
      name: 'Ventas',
      type: 'venta',
      value: totalIngresos,
      status: ventasPendientes > 10 ? 'warning' : 'completed',
    })

    // Link: Stock → Ventas
    links.push({
      source: 'stock',
      target: 'ventas',
      value: totalUnidadesVendidas,
      type: 'transferencia',
    })

    // 4. NODOS: DISTRIBUCIÓN AUTOMÁTICA (3 BANCOS)
    const totalBovedaMonte = ventas.reduce((sum, v) => sum + (v.bovedaMonte || 0), 0)
    const totalFletes = ventas.reduce((sum, v) => sum + (v.flete || 0), 0)
    const totalUtilidades = ventas.reduce((sum, v) => sum + (v.utilidad || 0), 0)

    nodes.push(
      {
        id: 'boveda_monte',
        name: 'Bóveda Monte',
        type: 'banco',
        value: totalBovedaMonte,
        status: 'completed',
      },
      {
        id: 'fletes',
        name: 'Fletes',
        type: 'banco',
        value: totalFletes,
        status: 'completed',
      },
      {
        id: 'utilidades',
        name: 'Utilidades',
        type: 'banco',
        value: totalUtilidades,
        status: 'completed',
      },
    )

    // Links: Ventas → 3 Bancos (Distribución Automática)
    links.push(
      {
        source: 'ventas',
        target: 'boveda_monte',
        value: totalBovedaMonte,
        type: 'ingreso',
      },
      {
        source: 'ventas',
        target: 'fletes',
        value: totalFletes,
        type: 'ingreso',
      },
      {
        source: 'ventas',
        target: 'utilidades',
        value: totalUtilidades,
        type: 'ingreso',
      },
    )

    // 5. NODO: CLIENTES (Deuda)
    const totalDeuda = clientes.reduce((sum, c) => sum + (c.deuda || 0), 0)
    const clientesConDeuda = clientes.filter(c => (c.deuda || 0) > 0).length
    nodes.push({
      id: 'clientes',
      name: 'Clientes',
      type: 'cliente',
      value: totalDeuda,
      status: clientesConDeuda > 5 ? 'warning' : 'completed',
    })

    // Link: Ventas → Clientes (Pendiente de cobro)
    const ingresoPendiente = ventas
      .filter(v => v.estatus === 'Pendiente')
      .reduce((sum, v) => sum + (v.ingreso || 0), 0)
    if (ingresoPendiente > 0) {
      links.push({
        source: 'ventas',
        target: 'clientes',
        value: ingresoPendiente,
        type: 'egreso',
      })
    }

    setFlowData({ nodes, links })
  }, [ventas, clientes, ordenes, bancos])

  // RENDERIZAR DIAGRAMA DE FLUJO CON D3.js
  useEffect(() => {
    if (!svgRef.current || flowData.nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Limpiar SVG previo
    svg.selectAll('*').remove()

    // Configurar posiciones en columnas (flujo de izquierda a derecha)
    const columns: Record<string, number> = {
      ordenes: 0,
      stock: 1,
      ventas: 2,
      boveda_monte: 3,
      fletes: 3,
      utilidades: 3,
      clientes: 3,
    }

    const columnWidth = width / 4
    const nodeHeight = 80
    const nodeWidth = 180

    // Calcular posiciones Y para nodos en la misma columna
    const nodesByColumn: Record<number, FlowNode[]> = {}
    flowData.nodes.forEach(node => {
      const col = columns[node.id]
      if (!nodesByColumn[col]) nodesByColumn[col] = []
      nodesByColumn[col].push(node)
    })

    flowData.nodes.forEach(node => {
      const col = columns[node.id]
      const nodesInColumn = nodesByColumn[col]
      const index = nodesInColumn.indexOf(node)
      const totalInColumn = nodesInColumn.length
      const ySpacing = height / (totalInColumn + 1)

      node.x = col * columnWidth + columnWidth / 2
      node.y = ySpacing * (index + 1)
    })

    // Crear grupo para links
    const linkGroup = svg.append('g').attr('class', 'links')

    // Dibujar links (flechas animadas)
    flowData.links.forEach(link => {
      const sourceNode = flowData.nodes.find(n => n.id === link.source)
      const targetNode = flowData.nodes.find(n => n.id === link.target)

      if (!sourceNode || !targetNode) return

      const linkColor = link.type === 'ingreso' ? '#10b981' : link.type === 'egreso' ? '#ef4444' : '#06b6d4'

      // Línea curva
      const path = linkGroup
        .append('path')
        .attr('d', () => {
          const x1 = sourceNode.x! + nodeWidth / 2
          const y1 = sourceNode.y!
          const x2 = targetNode.x! - nodeWidth / 2
          const y2 = targetNode.y!
          const midX = (x1 + x2) / 2
          return `M ${x1} ${y1} Q ${midX} ${y1}, ${midX} ${(y1 + y2) / 2} T ${x2} ${y2}`
        })
        .attr('fill', 'none')
        .attr('stroke', linkColor)
        .attr('stroke-width', Math.max(2, Math.min(10, link.value / 100000)))
        .attr('opacity', 0.6)
        .attr('stroke-dasharray', '5,5')

      // Animación de flujo
      path
        .attr('stroke-dashoffset', 10)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0)
        .on('end', function repeat() {
          d3.select(this)
            .attr('stroke-dashoffset', 10)
            .transition()
            .duration(2000)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0)
            .on('end', repeat)
        })
    })

    // Crear grupo para nodos
    const nodeGroup = svg.append('g').attr('class', 'nodes')

    // Dibujar nodos
    const nodes = nodeGroup
      .selectAll('.node')
      .data(flowData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x! - nodeWidth / 2}, ${d.y! - nodeHeight / 2})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNode(d)
      })

    // Rectángulos de nodos
    nodes
      .append('rect')
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 12)
      .attr('fill', d => {
        switch (d.status) {
          case 'completed': return 'rgba(16, 185, 129, 0.2)'
          case 'processing': return 'rgba(6, 182, 212, 0.2)'
          case 'warning': return 'rgba(245, 158, 11, 0.2)'
          default: return 'rgba(107, 114, 128, 0.2)'
        }
      })
      .attr('stroke', d => {
        switch (d.status) {
          case 'completed': return '#10b981'
          case 'processing': return '#06b6d4'
          case 'warning': return '#f59e0b'
          default: return '#6b7280'
        }
      })
      .attr('stroke-width', 2)
      .style('backdrop-filter', 'blur(10px)')

    // Nombre del nodo
    nodes
      .append('text')
      .attr('x', nodeWidth / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(d => d.name)

    // Valor del nodo
    nodes
      .append('text')
      .attr('x', nodeWidth / 2)
      .attr('y', 52)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('opacity', 0.8)
      .text(d => {
        if (d.type === 'stock') return `${d.value} unidades`
        return `$${(d.value / 1000).toFixed(0)}k`
      })

    logger.info('Diagrama de flujo renderizado', {
      context: 'AutomatedOperationFlow',
      data: { nodes: flowData.nodes.length, links: flowData.links.length },
    })
  }, [flowData])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'processing': return <Clock className="w-5 h-5 text-cyan-400" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-400" />
      default: return null
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <PremiumCard variant="glass" className="relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Flujo de Operaciones Automatizado</h2>
              <p className="text-white/60">Visualización en tiempo real del ciclo completo</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-white/60">Ingreso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-white/60">Egreso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span className="text-sm text-white/60">Transferencia</span>
            </div>
          </div>
        </div>

        {/* Diagrama SVG */}
        <div className="relative w-full h-[600px] rounded-xl bg-black/20 overflow-hidden">
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ minHeight: '600px' }}
          />
        </div>

        {/* Panel de información del nodo seleccionado */}
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 rounded-xl backdrop-blur-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/50"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(selectedNode.status)}
                  <h3 className="text-xl font-bold text-white">{selectedNode.name}</h3>
                </div>
                <p className="text-2xl font-bold text-cyan-400 mb-2">
                  {selectedNode.type === 'stock'
                    ? `${selectedNode.value} unidades`
                    : `$${(selectedNode.value / 1000000).toFixed(2)}M`}
                </p>
                <p className="text-sm text-white/60">
                  Estado:{' '}
                  <span className="font-semibold text-white">
                    {selectedNode.status === 'completed' && 'Completado'}
                    {selectedNode.status === 'processing' && 'En proceso'}
                    {selectedNode.status === 'warning' && 'Atención requerida'}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        )}
      </PremiumCard>

      {/* Resumen del Flujo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PremiumCard variant="neon" hover>
          <div className="flex items-center gap-4">
            <ShoppingCart className="w-12 h-12 text-cyan-400" />
            <div>
              <p className="text-white/60 text-sm mb-1">Órdenes Activas</p>
              <p className="text-2xl font-bold text-white">
                {ordenes.filter(o => (o.deuda || 0) > 0).length}
              </p>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard variant="gradient" hover>
          <div className="flex items-center gap-4">
            <Package className="w-12 h-12 text-purple-400" />
            <div>
              <p className="text-white/60 text-sm mb-1">Stock Disponible</p>
              <p className="text-2xl font-bold text-white">
                {flowData.nodes.find(n => n.id === 'stock')?.value || 0} unidades
              </p>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard variant="solid" hover>
          <div className="flex items-center gap-4">
            <DollarSign className="w-12 h-12 text-green-400" />
            <div>
              <p className="text-white/60 text-sm mb-1">Ingresos Totales</p>
              <p className="text-2xl font-bold text-white">
                ${((flowData.nodes.find(n => n.id === 'ventas')?.value || 0) / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
        </PremiumCard>
      </div>
    </div>
  )
}
