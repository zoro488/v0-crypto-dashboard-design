"use client"

import { useState } from "react"
import { X, PackagePlus, ChevronRight } from "lucide-react"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"
import { useToast } from "@/frontend/app/hooks/use-toast"
import { firestoreService } from "@/frontend/app/lib/firebase/firestore-service"
import { useAlmacenData } from "@/frontend/app/lib/firebase/firestore-hooks.service"
import { logger } from "@/frontend/app/lib/utils/logger"

interface CreateEntradaAlmacenModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateEntradaAlmacenModal({ isOpen, onClose }: CreateEntradaAlmacenModalProps) {
  const { toast } = useToast()
  const addEntradaAlmacen = useAppStore((state) => state.addEntradaAlmacen)
  const { data: productos = [] } = useAlmacenData()

  const [formData, setFormData] = useState({
    productoId: "",
    productoNombre: "",
    cantidad: 1,
    origen: "",
    costoUnitario: 0,
    ordenCompraRef: "",
  })

  const handleSubmit = async () => {
    if (!formData.productoId || !formData.origen || formData.cantidad <= 0) {
      toast({ title: "Error", description: "Completa todos los campos requeridos", variant: "destructive" })
      return
    }

    try {
      // Registrar entrada usando el servicio de Firestore
      await firestoreService.crearEntradaAlmacen({
        productoId: formData.productoId,
        cantidad: formData.cantidad,
        origen: formData.origen,
        costoUnitario: formData.costoUnitario,
        ordenCompraId: formData.ordenCompraRef || undefined,
      })

      // Actualizar store local para UI inmediata
      addEntradaAlmacen({
        tipo: "entrada",
        fecha: new Date().toISOString(),
        cantidad: formData.cantidad,
        origen: formData.origen,
        productoNombre: formData.productoNombre,
        costoUnitario: formData.costoUnitario,
        valorTotal: formData.cantidad * formData.costoUnitario,
        ordenCompraRef: formData.ordenCompraRef,
      })

      toast({
        title: "✅ Entrada Registrada",
        description: `${formData.cantidad} unidades de "${formData.productoNombre}" agregadas al inventario`,
      })
      
      // Resetear formulario
      setFormData({
        productoId: "",
        productoNombre: "",
        cantidad: 1,
        origen: "",
        costoUnitario: 0,
        ordenCompraRef: "",
      })
      onClose()
    } catch (error) {
      logger.error("Error creating entrada", error, { context: "CreateEntradaAlmacenModal" })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar la entrada. Intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleProductoChange = (productoId: string) => {
    const producto = productos.find((p) => (p as Record<string, unknown>).id === productoId) as Record<string, unknown> | undefined
    setFormData({
      ...formData,
      productoId,
      productoNombre: (producto?.nombre as string) || "",
      costoUnitario: (producto?.valorUnitario as number) || 0,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-2xl w-full mx-4 bg-black/95 border border-white/10 rounded-3xl text-white p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <PackagePlus className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-xl font-bold">Nueva Entrada al Almacén</h2>
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
                onChange={(e) => handleProductoChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none"
              >
                <option value="" className="bg-gray-900">Seleccionar producto</option>
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Origen</label>
              <input
                type="text"
                value={formData.origen}
                onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                placeholder="Distribuidor/Proveedor"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Costo Unitario</label>
              <input
                type="number"
                value={formData.costoUnitario}
                onChange={(e) => setFormData({ ...formData, costoUnitario: Number(e.target.value) })}
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Referencia OC (Opcional)</label>
            <input
              type="text"
              value={formData.ordenCompraRef}
              onChange={(e) => setFormData({ ...formData, ordenCompraRef: e.target.value })}
              placeholder="OC0001"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none"
            />
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-white/60">Valor Total</span>
              <span className="text-green-400">${(formData.cantidad * formData.costoUnitario).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-6 py-2 rounded-xl text-white/60 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            Registrar Entrada
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
