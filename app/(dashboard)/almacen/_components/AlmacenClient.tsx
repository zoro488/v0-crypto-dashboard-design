'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Download,
  Package,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Edit,
  Trash2,
  Eye,
  X,
  Check,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, cn } from '@/app/_lib/utils'
import { useChronosStore } from '@/app/lib/store'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ProductoFormState {
  nombre: string
  descripcion: string
  cantidad: number
  precioCompra: number
  precioVenta: number
  minimo: number
  ubicacion: string
}

const initialFormState: ProductoFormState = {
  nombre: '',
  descripcion: '',
  cantidad: 0,
  precioCompra: 0,
  precioVenta: 0,
  minimo: 10,
  ubicacion: '',
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AlmacenClient() {
  // Para futuro: conectar con store cuando se agregue almacen al store
  const [productos, setProductos] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<ProductoFormState>(initialFormState)

  // ═════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═════════════════════════════════════════════════════════════════════════
  const stats = useMemo(() => {
    const totalProductos = productos.length
    const stockTotal = productos.reduce((acc, p) => acc + (p.cantidad || 0), 0)
    const valorInventario = productos.reduce((acc, p) => acc + ((p.cantidad || 0) * (p.precioCompra || 0)), 0)
    const productosAgotados = productos.filter(p => (p.cantidad || 0) === 0).length
    const productosBajoStock = productos.filter(p => (p.cantidad || 0) <= (p.minimo || 0) && (p.cantidad || 0) > 0).length
    
    return {
      totalProductos,
      stockTotal,
      valorInventario,
      productosAgotados,
      productosBajoStock,
    }
  }, [productos])

  const filteredProductos = useMemo(() => {
    return productos.filter(prod => 
      prod.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [productos, searchQuery])

  // ═════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═════════════════════════════════════════════════════════════════════════
  const handleSubmit = async () => {
    if (!form.nombre) {
      toast.error('El nombre es requerido')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/almacen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!response.ok) throw new Error('Error al crear producto')

      const data = await response.json()
      toast.success('Producto creado', { description: form.nombre })
      setForm(initialFormState)
      setIsFormOpen(false)
      // Recargar productos
      loadProductos()
    } catch (error) {
      toast.error('Error al crear producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadProductos = async () => {
    try {
      const response = await fetch('/api/almacen')
      if (response.ok) {
        const data = await response.json()
        setProductos(data)
      }
    } catch (error) {
      console.error('Error loading productos:', error)
    }
  }

  // Load productos on mount
  useMemo(() => {
    loadProductos()
  }, [])

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-gray-400">Productos</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalProductos}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Boxes className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-gray-400">Stock Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.stockTotal.toLocaleString()}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-gray-400">Valor Inventario</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.valorInventario)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-gray-400">Agotados</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.productosAgotados}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-gray-400">Bajo Stock</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.productosBajoStock}</p>
        </motion.div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-violet-500/50 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredProductos.map((producto, index) => (
            <motion.div
              key={producto.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    (producto.cantidad || 0) === 0 
                      ? 'bg-red-500/20' 
                      : (producto.cantidad || 0) <= (producto.minimo || 0)
                        ? 'bg-amber-500/20'
                        : 'bg-violet-500/20'
                  )}>
                    <Package className={cn(
                      "h-5 w-5",
                      (producto.cantidad || 0) === 0 
                        ? 'text-red-400' 
                        : (producto.cantidad || 0) <= (producto.minimo || 0)
                          ? 'text-amber-400'
                          : 'text-violet-400'
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{producto.nombre}</h3>
                    <p className="text-xs text-muted-foreground">{producto.ubicacion || 'Sin ubicación'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Stock</p>
                  <p className="font-bold text-lg">{producto.cantidad || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Mínimo</p>
                  <p className="font-medium">{producto.minimo || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">P. Compra</p>
                  <p className="font-medium text-blue-400">{formatCurrency(producto.precioCompra || 0)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">P. Venta</p>
                  <p className="font-medium text-emerald-400">{formatCurrency(producto.precioVenta || 0)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredProductos.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay productos en el almacén</p>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="mt-4 text-violet-400 hover:text-violet-300"
            >
              Agregar primer producto
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setIsFormOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg mx-4 p-6 bg-gray-900 border border-white/10 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Nuevo Producto</h2>
                <button onClick={() => setIsFormOpen(false)}>
                  <X className="h-5 w-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Nombre</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full mt-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                    placeholder="Nombre del producto"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400">Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    className="w-full mt-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                    placeholder="Descripción opcional"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Cantidad Inicial</label>
                    <input
                      type="number"
                      value={form.cantidad}
                      onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })}
                      className="w-full mt-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Stock Mínimo</label>
                    <input
                      type="number"
                      value={form.minimo}
                      onChange={(e) => setForm({ ...form, minimo: Number(e.target.value) })}
                      className="w-full mt-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Precio Compra</label>
                    <input
                      type="number"
                      value={form.precioCompra}
                      onChange={(e) => setForm({ ...form, precioCompra: Number(e.target.value) })}
                      className="w-full mt-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Precio Venta</label>
                    <input
                      type="number"
                      value={form.precioVenta}
                      onChange={(e) => setForm({ ...form, precioVenta: Number(e.target.value) })}
                      className="w-full mt-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Ubicación</label>
                  <input
                    type="text"
                    value={form.ubicacion}
                    onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                    className="w-full mt-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                    placeholder="Ej: Estante A-1"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                  ) : (
                    'Crear Producto'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
