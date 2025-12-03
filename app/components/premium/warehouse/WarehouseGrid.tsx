'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { 
  Package, Search, Grid3X3, List, Plus, Minus, AlertTriangle,
  TrendingUp, TrendingDown, Box, History, Edit3, X, Filter,
  ArrowUpRight, ArrowDownLeft, RotateCcw, Eye,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import type { Producto, MovimientoAlmacen } from '@/app/types'

// Tipo para el estado del stock
type StockStatus = {
  color: string
  glow: string
  textColor: string
  label: string
  level: 'critical' | 'optimal' | 'excess'
  pulse: boolean
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📦 WAREHOUSE GRID - The Inventory Grid
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sistema de visualización de inventario estilo videojuego Sci-Fi con:
 * - Vista de Lista Cuántica y Mapa de Calor
 * - Celdas con código de colores según nivel de stock
 * - Drawer lateral para detalles con timeline de trazabilidad
 * - FABs para Entrada/Salida Rápida
 */

interface WarehouseGridProps {
  products: Producto[]
  movements: MovimientoAlmacen[]
  onQuickEntry?: (productId: string, cantidad: number) => void
  onQuickExit?: (productId: string, cantidad: number) => void
  onProductEdit?: (product: Producto) => void
  onProductView?: (product: Producto) => void
  gridRows?: number
  gridCols?: number
}

type ViewMode = 'list' | 'heatmap'

export default function WarehouseGrid({
  products,
  movements,
  onQuickEntry,
  onQuickExit,
  onProductEdit,
  onProductView,
  gridRows = 6,
  gridCols = 8,
}: WarehouseGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [quickActionModal, setQuickActionModal] = useState<'entry' | 'exit' | null>(null)
  const [filter, setFilter] = useState<'all' | 'critical' | 'optimal' | 'excess'>('all')
  
  // Mouse position para efectos de luz
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 200, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 200, damping: 30 })

  // Filtrar y ordenar productos
  const filteredProducts = useMemo(() => {
    let result = [...products]
    
    // Búsqueda
    if (searchQuery) {
      const lower = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.nombre.toLowerCase().includes(lower) ||
        p.sku?.toLowerCase().includes(lower),
      )
    }
    
    // Filtros
    if (filter !== 'all') {
      result = result.filter(p => {
        const status = getStockStatus(p)
        return status.level === filter
      })
    }
    
    return result
  }, [products, searchQuery, filter])

  // Estadísticas globales
  const stats = useMemo(() => {
    const total = products.length
    const critical = products.filter(p => p.stockActual <= (p.stockMinimo || 5)).length
    const optimal = products.filter(p => {
      const min = p.stockMinimo || 5
      const max = p.stockMaximo || min * 5
      return p.stockActual > min && p.stockActual <= max
    }).length
    const excess = products.filter(p => p.stockActual > (p.stockMaximo || (p.stockMinimo || 5) * 5)).length
    
    return { total, critical, optimal, excess }
  }, [products])

  // Obtener estado del stock
  const getStockStatus = useCallback((product: Producto): StockStatus => {
    const { stockActual, stockMinimo = 5, stockMaximo = stockMinimo * 5 } = product
    
    if (stockActual <= 0) {return { 
      color: 'bg-red-500', 
      glow: 'shadow-red-500/50',
      textColor: 'text-red-400',
      label: 'Sin stock', 
      level: 'critical' as const,
      pulse: true, 
    }}
    if (stockActual <= stockMinimo) {return { 
      color: 'bg-red-500', 
      glow: 'shadow-red-500/50',
      textColor: 'text-red-400',
      label: 'Crítico', 
      level: 'critical' as const,
      pulse: true, 
    }}
    if (stockActual > stockMaximo) {return { 
      color: 'bg-blue-500', 
      glow: 'shadow-blue-500/50',
      textColor: 'text-blue-400',
      label: 'Exceso', 
      level: 'excess' as const,
      pulse: false, 
    }}
    return { 
      color: 'bg-emerald-500', 
      glow: 'shadow-emerald-500/50',
      textColor: 'text-emerald-400',
      label: 'Óptimo', 
      level: 'optimal' as const,
      pulse: false, 
    }
  }, [])

  // Obtener movimientos de un producto
  const getProductMovements = useCallback((productId: string) => {
    return movements
      .filter(m => m.productoId === productId)
      .sort((a, b) => {
        const dateA = a.fecha instanceof Date ? a.fecha : new Date(a.fecha as unknown as string)
        const dateB = b.fecha instanceof Date ? b.fecha : new Date(b.fecha as unknown as string)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 10)
  }, [movements])

  const handleProductClick = useCallback((product: Producto) => {
    setSelectedProduct(product)
    setDrawerOpen(true)
  }, [])

  return (
    <div 
      className="relative h-full"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
      }}
    >
      {/* Header con controles */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        {/* Estadísticas rápidas */}
        <div className="flex items-center gap-4">
          <StatsCard icon={Box} label="Total" value={stats.total} color="white" />
          <StatsCard icon={AlertTriangle} label="Crítico" value={stats.critical} color="red" pulse />
          <StatsCard icon={TrendingUp} label="Óptimo" value={stats.optimal} color="emerald" />
          <StatsCard icon={TrendingDown} label="Exceso" value={stats.excess} color="blue" />
        </div>

        {/* Controles */}
        <div className="flex items-center gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto..."
              className={cn(
                'w-48 h-10 pl-10 pr-4 rounded-xl',
                'bg-black/40 border border-white/10',
                'text-white text-sm placeholder:text-white/30',
                'focus:outline-none focus:border-white/20',
              )}
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-1">
            {(['all', 'critical', 'optimal', 'excess'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  filter === f 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/40 hover:text-white/60',
                )}
              >
                {f === 'all' ? 'Todos' : f === 'critical' ? 'Crítico' : f === 'optimal' ? 'Óptimo' : 'Exceso'}
              </button>
            ))}
          </div>

          {/* Toggle Vista */}
          <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'list' 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/40 hover:text-white/60',
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'heatmap' 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/40 hover:text-white/60',
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Vista Principal */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {viewMode === 'heatmap' ? (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${Math.ceil(filteredProducts.length / gridCols)}, minmax(80px, auto))`,
              }}
            >
              {filteredProducts.map((product, index) => (
                <HeatmapCell
                  key={product.id}
                  product={product}
                  status={getStockStatus(product)}
                  index={index}
                  onClick={() => handleProductClick(product)}
                  springX={springX}
                  springY={springY}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-2"
            >
              {filteredProducts.map((product, index) => (
                <ListRow
                  key={product.id}
                  product={product}
                  status={getStockStatus(product)}
                  index={index}
                  onClick={() => handleProductClick(product)}
                  onEdit={() => onProductEdit?.(product)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <Package className="w-16 h-16 text-white/20 mb-4" />
            <p className="text-white/40 text-lg">No se encontraron productos</p>
            <p className="text-white/20 text-sm mt-1">Intenta con otro término de búsqueda</p>
          </motion.div>
        )}
      </div>

      {/* FAB Actions */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-40">
        <motion.button
          onClick={() => setQuickActionModal('entry')}
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center',
            'bg-gradient-to-br from-emerald-500 to-teal-600',
            'shadow-lg shadow-emerald-500/30',
            'hover:shadow-xl hover:shadow-emerald-500/40 transition-shadow',
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
        
        <motion.button
          onClick={() => setQuickActionModal('exit')}
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center',
            'bg-gradient-to-br from-red-500 to-rose-600',
            'shadow-lg shadow-red-500/30',
            'hover:shadow-xl hover:shadow-red-500/40 transition-shadow',
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Minus className="w-6 h-6 text-white" />
        </motion.button>
      </div>

      {/* Drawer de Detalles */}
      <AnimatePresence>
        {drawerOpen && selectedProduct && (
          <ProductDrawer
            product={selectedProduct}
            movements={getProductMovements(selectedProduct.id)}
            status={getStockStatus(selectedProduct)}
            onClose={() => {
              setDrawerOpen(false)
              setSelectedProduct(null)
            }}
            onEdit={() => onProductEdit?.(selectedProduct)}
            onQuickEntry={() => {
              setQuickActionModal('entry')
            }}
            onQuickExit={() => {
              setQuickActionModal('exit')
            }}
          />
        )}
      </AnimatePresence>

      {/* Quick Action Modal */}
      <AnimatePresence>
        {quickActionModal && (
          <QuickActionModal
            type={quickActionModal}
            product={selectedProduct}
            products={products}
            onClose={() => setQuickActionModal(null)}
            onConfirm={(productId, cantidad) => {
              if (quickActionModal === 'entry') {
                onQuickEntry?.(productId, cantidad)
              } else {
                onQuickExit?.(productId, cantidad)
              }
              setQuickActionModal(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTES
// ═══════════════════════════════════════════════════════════════════════════

function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  color,
  pulse, 
}: { 
  icon: typeof Box
  label: string
  value: number
  color: 'white' | 'red' | 'emerald' | 'blue'
  pulse?: boolean
}) {
  const colorClasses = {
    white: 'text-white/80',
    red: 'text-red-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
      <Icon className={cn('w-4 h-4', colorClasses[color], pulse && 'animate-pulse')} />
      <div>
        <div className="text-xs text-white/40">{label}</div>
        <div className={cn('text-lg font-bold font-mono', colorClasses[color])}>{value}</div>
      </div>
    </div>
  )
}

interface HeatmapCellProps {
  product: Producto
  status: StockStatus
  index: number
  onClick: () => void
  springX: ReturnType<typeof useSpring>
  springY: ReturnType<typeof useSpring>
}

function HeatmapCell({ product, status, index, onClick, springX, springY }: HeatmapCellProps) {
  const cellRef = useRef<HTMLButtonElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.button
      ref={cellRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        'relative p-3 rounded-xl overflow-hidden',
        'bg-black/40 border border-white/10',
        'hover:border-white/20 transition-all cursor-pointer',
        'group',
      )}
    >
      {/* Indicador de color de stock */}
      <motion.div
        className={cn(
          'absolute inset-0 opacity-20',
          status.color,
        )}
        animate={status.pulse ? { opacity: [0.1, 0.3, 0.1] } : undefined}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between">
          <Package className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" />
          <motion.div 
            className={cn('w-2 h-2 rounded-full', status.color)}
            animate={status.pulse ? { scale: [1, 1.3, 1] } : undefined}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ boxShadow: isHovered ? '0 0 8px 2px currentColor' : 'none' }}
          />
        </div>
        
        <div className="mt-auto">
          <div className="text-xs text-white/80 truncate font-medium">
            {product.nombre}
          </div>
          <div className={cn('text-lg font-bold font-mono', status.textColor)}>
            {product.stockActual}
          </div>
        </div>
      </div>

      {/* Tooltip on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className={cn(
              'absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2',
              'p-3 rounded-xl',
              'bg-black/90 backdrop-blur-xl border border-white/20',
              'shadow-xl min-w-[180px]',
            )}
          >
            {product.imagenUrl && (
              <img 
                src={product.imagenUrl} 
                alt={product.nombre}
                className="w-full h-20 object-cover rounded-lg mb-2"
              />
            )}
            <div className="text-white font-medium">{product.nombre}</div>
            {product.sku && (
              <div className="text-xs text-white/40 font-mono">{product.sku}</div>
            )}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
              <span className="text-xs text-white/40">Stock</span>
              <span className={cn('text-sm font-mono font-bold', status.textColor)}>
                {product.stockActual} / {product.stockMaximo || '∞'}
              </span>
            </div>
            <div className="text-xs text-white/40 mt-1">{status.label}</div>
            
            {/* Flecha del tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-3 bg-black/90 border-r border-b border-white/20 transform rotate-45 -mt-1.5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function ListRow({ 
  product, 
  status, 
  index, 
  onClick,
  onEdit,
}: { 
  product: Producto
  status: StockStatus
  index: number
  onClick: () => void
  onEdit?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl',
        'bg-black/40 border border-white/10',
        'hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer',
        'group',
      )}
      onClick={onClick}
    >
      {/* Imagen/Icon */}
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
        {product.imagenUrl ? (
          <img src={product.imagenUrl} alt={product.nombre} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-6 h-6 text-white/40" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium truncate">{product.nombre}</span>
          {product.sku && (
            <span className="text-xs text-white/30 font-mono">{product.sku}</span>
          )}
        </div>
        <div className="text-sm text-white/40">{product.origen || 'Sin origen'}</div>
      </div>

      {/* Stock */}
      <div className="text-right">
        <div className="flex items-center gap-2">
          <motion.div 
            className={cn('w-2 h-2 rounded-full', status.color)}
            animate={status.pulse ? { scale: [1, 1.3, 1] } : undefined}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <span className={cn('text-xl font-bold font-mono', status.textColor)}>
            {product.stockActual}
          </span>
        </div>
        <div className="text-xs text-white/30">
          Mín: {product.stockMinimo || 5} | Máx: {product.stockMaximo || '∞'}
        </div>
      </div>

      {/* Precio */}
      <div className="text-right hidden md:block">
        <div className="text-white font-mono">${product.precioVenta?.toLocaleString('es-MX') || '0'}</div>
        <div className="text-xs text-white/30">Precio venta</div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit?.() }}
          className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onClick() }}
          className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

// Drawer de Detalles del Producto
interface ProductDrawerProps {
  product: Producto
  movements: MovimientoAlmacen[]
  status: StockStatus
  onClose: () => void
  onEdit: () => void
  onQuickEntry: () => void
  onQuickExit: () => void
}

function ProductDrawer({ 
  product, 
  movements, 
  status, 
  onClose, 
  onEdit,
  onQuickEntry,
  onQuickExit,
}: ProductDrawerProps) {
  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 w-full max-w-md',
          'bg-[rgba(8,8,12,0.95)] backdrop-blur-2xl',
          'border-l border-white/10 overflow-hidden flex flex-col',
        )}
      >
        {/* Header con Imagen */}
        <div className="relative h-48 overflow-hidden">
          {product.imagenUrl ? (
            <img 
              src={product.imagenUrl} 
              alt={product.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
              <Package className="w-16 h-16 text-white/20" />
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,8,12,0.95)] via-transparent to-transparent" />
          
          {/* Reflejo */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto scrollbar-obsidian">
          {/* Info Principal */}
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{product.nombre}</h2>
                {product.sku && (
                  <div className="text-sm text-white/40 font-mono mt-1">{product.sku}</div>
                )}
              </div>
              <div className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                status.color.replace('bg-', 'bg-opacity-20 text-').replace('-500', '-400'),
              )}>
                {status.label}
              </div>
            </div>

            {/* Stock Visual */}
            <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/40 text-sm">Stock Actual</span>
                <span className={cn('text-3xl font-bold font-mono', status.textColor)}>
                  {product.stockActual}
                </span>
              </div>
              
              {/* Barra de stock */}
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', status.color)}
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${Math.min((product.stockActual / (product.stockMaximo || 100)) * 100, 100)}%`, 
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-white/30 mt-2 font-mono">
                <span>Mín: {product.stockMinimo || 5}</span>
                <span>Máx: {product.stockMaximo || '∞'}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={onQuickEntry}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl',
                  'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400',
                  'border border-emerald-500/30 transition-colors',
                )}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Entrada</span>
              </button>
              <button
                onClick={onQuickExit}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl',
                  'bg-red-500/20 hover:bg-red-500/30 text-red-400',
                  'border border-red-500/30 transition-colors',
                )}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Salida</span>
              </button>
            </div>
          </div>

          {/* Timeline de Trazabilidad */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-white/40" />
              <span className="text-sm font-medium text-white/60">Trazabilidad</span>
            </div>

            {movements.length === 0 ? (
              <div className="text-center py-8 text-white/30">
                Sin movimientos registrados
              </div>
            ) : (
              <div className="relative">
                {/* Línea vertical */}
                <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500 via-white/20 to-transparent" />

                <div className="space-y-4">
                  {movements.map((mov, i) => {
                    const isEntry = mov.tipo === 'entrada'
                    const date = mov.fecha instanceof Date ? mov.fecha : new Date(mov.fecha as unknown as string)
                    
                    return (
                      <motion.div
                        key={mov.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-4 pl-1"
                      >
                        {/* Dot */}
                        <div className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                          isEntry ? 'bg-emerald-500' : mov.tipo === 'salida' ? 'bg-red-500' : 'bg-blue-500',
                        )}>
                          {isEntry ? (
                            <ArrowDownLeft className="w-3 h-3 text-white" />
                          ) : mov.tipo === 'salida' ? (
                            <ArrowUpRight className="w-3 h-3 text-white" />
                          ) : (
                            <RotateCcw className="w-3 h-3 text-white" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium capitalize">{mov.tipo}</span>
                            <span className={cn(
                              'font-mono font-bold',
                              isEntry ? 'text-emerald-400' : 'text-red-400',
                            )}>
                              {isEntry ? '+' : '-'}{Math.abs(mov.cantidad)}
                            </span>
                          </div>
                          <div className="text-xs text-white/40 mt-1">
                            {mov.referenciaTipo && (
                              <span className="mr-2">
                                {mov.referenciaTipo === 'orden_compra' ? 'OC' : mov.referenciaTipo}: {mov.referenciaId}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/30 mt-1">
                            {date.toLocaleDateString('es-MX')} {date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {mov.motivo && (
                            <div className="text-xs text-white/50 mt-1 italic">"{mov.motivo}"</div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5">
          <button
            onClick={onEdit}
            className={cn(
              'w-full py-3 rounded-xl font-medium',
              'bg-gradient-to-r from-indigo-500 to-purple-600',
              'hover:from-indigo-400 hover:to-purple-500',
              'text-white transition-colors',
            )}
          >
            Editar Producto
          </button>
        </div>
      </motion.div>
    </>
  )
}

// Modal de Acción Rápida
interface QuickActionModalProps {
  type: 'entry' | 'exit'
  product: Producto | null
  products: Producto[]
  onClose: () => void
  onConfirm: (productId: string, cantidad: number) => void
}

function QuickActionModal({ type, product, products, onClose, onConfirm }: QuickActionModalProps) {
  const [selectedProductId, setSelectedProductId] = useState(product?.id || '')
  const [cantidad, setCantidad] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  const isEntry = type === 'entry'
  const title = isEntry ? 'Entrada Rápida' : 'Salida Rápida'
  const color = isEntry ? 'emerald' : 'red'

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products.slice(0, 10)
    const lower = searchQuery.toLowerCase()
    return products.filter(p => 
      p.nombre.toLowerCase().includes(lower) ||
      p.sku?.toLowerCase().includes(lower),
    ).slice(0, 10)
  }, [products, searchQuery])

  const selectedProduct = products.find(p => p.id === selectedProductId)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={cn(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
          'w-full max-w-md p-6',
          'bg-[rgba(8,8,12,0.95)] backdrop-blur-2xl',
          'rounded-3xl border border-white/10',
          'shadow-2xl',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              isEntry ? 'bg-emerald-500/20' : 'bg-red-500/20',
            )}>
              {isEntry ? (
                <ArrowDownLeft className={cn('w-5 h-5', `text-${color}-400`)} />
              ) : (
                <ArrowUpRight className={cn('w-5 h-5', `text-${color}-400`)} />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-white/40">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Búsqueda de Producto */}
        {!product && (
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto..."
              className={cn(
                'w-full h-12 px-4 rounded-xl',
                'bg-black/40 border border-white/10',
                'text-white placeholder:text-white/30',
                'focus:outline-none focus:border-white/20',
              )}
            />
            
            {filteredProducts.length > 0 && !selectedProductId && (
              <div className="mt-2 max-h-40 overflow-y-auto scrollbar-obsidian space-y-1">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={cn(
                      'w-full p-3 rounded-xl text-left',
                      'hover:bg-white/5 transition-colors',
                      'flex items-center gap-3',
                    )}
                  >
                    <Package className="w-4 h-4 text-white/40" />
                    <span className="text-white">{p.nombre}</span>
                    <span className="ml-auto text-white/40 font-mono text-sm">{p.stockActual}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Producto Seleccionado */}
        {selectedProduct && (
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-white/40" />
              <div className="flex-1">
                <div className="text-white font-medium">{selectedProduct.nombre}</div>
                <div className="text-sm text-white/40">Stock actual: {selectedProduct.stockActual}</div>
              </div>
              {!product && (
                <button
                  onClick={() => setSelectedProductId('')}
                  className="text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cantidad */}
        <div className="mb-6">
          <label className="block text-sm text-white/40 mb-2">Cantidad</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCantidad(Math.max(1, cantidad - 1))}
              className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
              className={cn(
                'flex-1 h-12 text-center text-2xl font-mono font-bold',
                'bg-black/40 border border-white/10 rounded-xl',
                'text-white focus:outline-none focus:border-white/20',
              )}
            />
            <button
              onClick={() => setCantidad(cantidad + 1)}
              className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resultado */}
        {selectedProduct && (
          <div className="mb-6 p-4 rounded-xl bg-white/5 text-center">
            <div className="text-white/40 text-sm mb-1">Nuevo Stock</div>
            <div className={cn('text-3xl font-bold font-mono', `text-${color}-400`)}>
              {isEntry 
                ? selectedProduct.stockActual + cantidad
                : Math.max(0, selectedProduct.stockActual - cantidad)
              }
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (selectedProductId) {
                onConfirm(selectedProductId, cantidad)
              }
            }}
            disabled={!selectedProductId}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-colors',
              isEntry 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white',
              !selectedProductId && 'opacity-50 cursor-not-allowed',
            )}
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </>
  )
}
