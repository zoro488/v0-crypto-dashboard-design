'use client'

import React, { useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, AlertCircle, CheckCircle2, X, Sparkles } from 'lucide-react'
import { cn } from '@/app/lib/utils'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔮 HOLOGRAPHIC PRODUCT SEARCH
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Buscador de productos estilo holográfico con:
 * - Input flotante con spotlight que sigue el foco
 * - Resultados como tarjetas flotantes 3D
 * - Indicador de stock en vivo (círculo de color)
 * - Animación de "vuelo" al seleccionar producto
 */

export interface ProductOption {
  id: string
  nombre: string
  sku?: string
  precioVenta: number
  stockActual: number
  stockMinimo?: number
  imagen?: string
  origen?: string
}

interface HolographicProductSearchProps {
  products: ProductOption[]
  selectedProducts: SelectedProduct[]
  onProductSelect: (product: ProductOption, cantidad: number) => void
  onProductRemove: (productId: string) => void
  placeholder?: string
  maxItems?: number
}

export interface SelectedProduct extends ProductOption {
  cantidad: number
  subtotal: number
}

export default function HolographicProductSearch({
  products,
  selectedProducts,
  onProductSelect,
  onProductRemove,
  placeholder = "Buscar producto por nombre o SKU...",
  maxItems = 10
}: HolographicProductSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [flyingProduct, setFlyingProduct] = useState<ProductOption | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    if (!query.trim()) return products.slice(0, 6)
    
    const lowerQuery = query.toLowerCase()
    return products
      .filter(p => 
        p.nombre.toLowerCase().includes(lowerQuery) ||
        p.sku?.toLowerCase().includes(lowerQuery) ||
        p.origen?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 8)
  }, [query, products])

  // Stock status
  const getStockStatus = useCallback((product: ProductOption) => {
    const { stockActual, stockMinimo = 10 } = product
    if (stockActual <= 0) return { color: 'bg-red-500', label: 'Sin stock', level: 'critical' }
    if (stockActual <= stockMinimo) return { color: 'bg-orange-500', label: 'Bajo', level: 'warning' }
    if (stockActual > stockMinimo * 3) return { color: 'bg-blue-500', label: 'Exceso', level: 'excess' }
    return { color: 'bg-emerald-500', label: 'Óptimo', level: 'optimal' }
  }, [])

  // Seleccionar producto con animación de vuelo
  const handleSelect = useCallback((product: ProductOption) => {
    if (product.stockActual <= 0) return
    
    setFlyingProduct(product)
    setTimeout(() => {
      onProductSelect(product, 1)
      setFlyingProduct(null)
      setQuery('')
      setIsOpen(false)
    }, 400)
  }, [onProductSelect])

  // Navegación con teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(i => Math.min(i + 1, filteredProducts.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredProducts[highlightedIndex]) {
          handleSelect(filteredProducts[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }, [isOpen, filteredProducts, highlightedIndex, handleSelect])

  return (
    <div className="space-y-4">
      {/* Input Principal con Spotlight */}
      <div 
        ref={containerRef}
        className="relative"
      >
        <motion.div
          className="relative"
          animate={{
            boxShadow: isOpen 
              ? '0 0 40px rgba(99, 102, 241, 0.2), 0 0 80px rgba(99, 102, 241, 0.1)'
              : '0 0 0px transparent'
          }}
          style={{ borderRadius: '1rem' }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setIsOpen(true)
                setHighlightedIndex(0)
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "w-full h-14 pl-12 pr-4 rounded-2xl",
                "bg-black/40 backdrop-blur-xl border border-white/10",
                "text-white placeholder:text-white/30",
                "focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20",
                "transition-all duration-300",
                "text-lg font-light tracking-wide"
              )}
            />
            
            {/* Indicador de búsqueda activa */}
            {isOpen && query && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Resultados Flotantes */}
        <AnimatePresence>
          {isOpen && filteredProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
                "absolute z-50 w-full mt-2 p-2",
                "bg-black/80 backdrop-blur-2xl",
                "border border-white/10 rounded-2xl",
                "shadow-2xl shadow-black/50",
                "max-h-[400px] overflow-y-auto scrollbar-obsidian"
              )}
            >
              <div className="grid gap-2">
                {filteredProducts.map((product, index) => {
                  const status = getStockStatus(product)
                  const isHighlighted = index === highlightedIndex
                  const isOutOfStock = product.stockActual <= 0
                  
                  return (
                    <motion.button
                      key={product.id}
                      onClick={() => handleSelect(product)}
                      disabled={isOutOfStock}
                      className={cn(
                        "relative w-full p-3 rounded-xl text-left",
                        "transition-all duration-200",
                        isHighlighted && !isOutOfStock && "bg-white/10",
                        !isHighlighted && "hover:bg-white/5",
                        isOutOfStock && "opacity-50 cursor-not-allowed"
                      )}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={!isOutOfStock ? { x: 4 } : undefined}
                    >
                      <div className="flex items-center gap-4">
                        {/* Imagen o placeholder */}
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          "bg-gradient-to-br from-white/10 to-white/5",
                          "border border-white/10"
                        )}>
                          {product.imagen ? (
                            <img 
                              src={product.imagen} 
                              alt={product.nombre}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-white/40" />
                          )}
                        </div>

                        {/* Info del producto */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium truncate">{product.nombre}</span>
                            {product.sku && (
                              <span className="text-xs text-white/30 font-mono">{product.sku}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-lg font-semibold text-white font-mono">
                              ${product.precioVenta.toLocaleString('es-MX')}
                            </span>
                            {product.origen && (
                              <span className="text-xs text-white/40">{product.origen}</span>
                            )}
                          </div>
                        </div>

                        {/* Indicador de Stock */}
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <motion.div 
                              className={cn("w-2.5 h-2.5 rounded-full", status.color)}
                              animate={status.level === 'critical' ? { 
                                scale: [1, 1.3, 1],
                                opacity: [1, 0.5, 1]
                              } : undefined}
                              transition={{ duration: 0.8, repeat: Infinity }}
                            />
                            <span className="text-sm font-mono text-white/60">
                              {product.stockActual}
                            </span>
                          </div>
                          <span className="text-[10px] text-white/30 uppercase tracking-wide">
                            {status.label}
                          </span>
                        </div>
                      </div>

                      {/* Borde neón en highlight */}
                      {isHighlighted && !isOutOfStock && (
                        <motion.div
                          layoutId="product-highlight"
                          className="absolute inset-0 rounded-xl border-2 border-indigo-500/50 pointer-events-none"
                          style={{ boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)' }}
                        />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Producto volando hacia la lista */}
        <AnimatePresence>
          {flyingProduct && (
            <motion.div
              initial={{ opacity: 1, scale: 1, y: 0 }}
              animate={{ 
                opacity: 0, 
                scale: 0.5, 
                y: 100,
                x: 200,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeIn" }}
              className="absolute z-60 top-0 left-0 w-full h-14 pointer-events-none"
            >
              <div className="h-full bg-indigo-500/20 rounded-2xl border border-indigo-500/50 flex items-center justify-center">
                <span className="text-indigo-300 font-medium">{flyingProduct.nombre}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lista de Productos Seleccionados */}
      {selectedProducts.length > 0 && (
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">
              Productos Seleccionados
            </span>
            <span className="text-xs text-white/60 font-mono">
              {selectedProducts.length} items
            </span>
          </div>
          
          <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-obsidian">
            <AnimatePresence mode="popLayout">
              {selectedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, x: 50, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl",
                    "bg-white/5 border border-white/10",
                    "group hover:bg-white/10 transition-colors"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Package className="w-4 h-4 text-indigo-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{product.nombre}</div>
                    <div className="text-xs text-white/40">
                      {product.cantidad} × ${product.precioVenta.toLocaleString('es-MX')}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white font-mono">
                      ${product.subtotal.toLocaleString('es-MX')}
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={() => onProductRemove(product.id)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  )
}
