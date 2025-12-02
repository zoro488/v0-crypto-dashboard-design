'use client'

import { useState } from 'react'
import { X, PackageMinus, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { useToast } from '@/app/hooks/use-toast'
import { crearSalidaAlmacen } from '@/app/lib/services/unified-data-service'
import { useAlmacenData } from '@/app/lib/firebase/firestore-hooks.service'
import { logger } from '@/app/lib/utils/logger'

interface CreateSalidaAlmacenModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ProductoAlmacen {
  id: string
  nombre: string
  stockActual: number
  [key: string]: unknown
}

export default function CreateSalidaAlmacenModal({ isOpen, onClose }: CreateSalidaAlmacenModalProps) {
  const { toast } = useToast()
  const triggerDataRefresh = useAppStore((state) => state.triggerDataRefresh)
  const { data: productosFirestore = [] } = useAlmacenData()
  
  // Usar productos de Firestore
  const productos: ProductoAlmacen[] = productosFirestore.map(p => ({
    id: p.id || '',
    nombre: (p as Record<string, unknown>).nombre as string || '',
    stockActual: ((p as Record<string, unknown>).stock_actual as number) || ((p as Record<string, unknown>).stockActual as number) || 0,
  }))

  const [formData, setFormData] = useState({
    productoId: '',
    cantidad: 1,
    destino: '',
    ventaRef: '',
    motivo: '',
  })

  const productoSeleccionado = productos.find((p) => p.id === formData.productoId)

  const handleSubmit = async () => {
    if (!formData.productoId || !formData.destino || formData.cantidad <= 0) {
      toast({ title: 'Error', description: 'Completa todos los campos requeridos', variant: 'destructive' })
      return
    }

    const stockActual = productoSeleccionado?.stockActual || 0
    if (formData.cantidad > stockActual) {
      toast({
        title: 'Stock Insuficiente',
        description: `Solo hay ${stockActual} unidades disponibles`,
        variant: 'destructive',
      })
      return
    }

    try {
      // Registrar salida usando el servicio unificado
      await crearSalidaAlmacen({
        productoId: formData.productoId,
        cantidad: formData.cantidad,
        destino: formData.destino,
        ventaId: formData.ventaRef || undefined,
        motivo: formData.motivo || 'Salida manual',
      })

      // 🔄 Trigger para actualizar hooks de datos
      triggerDataRefresh()

      toast({
        title: '✅ Salida Registrada',
        description: `${formData.cantidad} unidades de "${productoSeleccionado?.nombre || ''}" retiradas del inventario`,
      })
      
      // Resetear formulario
      setFormData({
        productoId: '',
        cantidad: 1,
        destino: '',
        ventaRef: '',
        motivo: '',
      })
      onClose()
    } catch (error) {
      logger.error('Error creating salida', error, { context: 'CreateSalidaAlmacenModal' })
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo registrar la salida. Intenta de nuevo.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-2xl w-full mx-4 bg-black/95 border border-white/10 rounded-3xl text-white p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <PackageMinus className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-xl font-bold">Nueva Salida del Almacén</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Producto</label>
              <select
                value={formData.productoId}
                onChange={(e) => setFormData({ ...formData, productoId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none"
              >
                <option value="" className="bg-gray-900">Seleccionar producto...</option>
                {productos.map((producto) => {
                  const p = producto as Record<string, unknown>
                  return (
                    <option key={p.id as string} value={p.id as string} className="bg-gray-900">
                      {p.nombre as string} (Stock: {(p.stockActual as number) || 0})
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Cantidad</label>
              <input
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                max={(productoSeleccionado?.stockActual as number) || 0}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-white/60 mb-2">Destino</label>
              <input
                type="text"
                value={formData.destino}
                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                placeholder="Cliente/Ubicación"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-white/60 mb-2">Referencia Venta (Opcional)</label>
              <input
                type="text"
                value={formData.ventaRef}
                onChange={(e) => setFormData({ ...formData, ventaRef: e.target.value })}
                placeholder="VENTA-001"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {productoSeleccionado && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Stock Disponible</span>
                <span className="text-lg font-bold">{(productoSeleccionado as { stockActual?: number }).stockActual || 0} unidades</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white/60">Stock Después</span>
                <span
                  className={`text-lg font-bold ${(((productoSeleccionado as { stockActual?: number }).stockActual || 0) - formData.cantidad) < 10 ? 'text-red-400' : 'text-green-400'}`}
                >
                  {((productoSeleccionado as { stockActual?: number }).stockActual || 0) - formData.cantidad} unidades
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-6 py-2 rounded-xl text-white/60 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            Registrar Salida
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
