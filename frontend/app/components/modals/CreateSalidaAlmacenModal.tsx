"use client"

import { useState } from "react"
import { X, PackageMinus, ChevronRight } from "lucide-react"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"
import { useToast } from "@/frontend/app/hooks/use-toast"
import { firestoreService } from "@/frontend/app/lib/firebase/firestore-service"

interface CreateSalidaAlmacenModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateSalidaAlmacenModal({ isOpen, onClose }: CreateSalidaAlmacenModalProps) {
  const { toast } = useToast()
  const addSalidaAlmacen = useAppStore((state) => state.addSalidaAlmacen)
  const productos = useAppStore((state) => state.productos)

  const [formData, setFormData] = useState({
    productoId: "",
    cantidad: 1,
    destino: "",
    ventaRef: "",
  })

  const productoSeleccionado = productos.find((p) => p.id === formData.productoId)

  const handleSubmit = async () => {
    if (!formData.productoId || !formData.destino || formData.cantidad <= 0) {
      toast({ title: "Error", description: "Completa todos los campos requeridos", variant: "destructive" })
      return
    }

    if (productoSeleccionado && formData.cantidad > productoSeleccionado.stockActual) {
      toast({
        title: "Stock Insuficiente",
        description: `Solo hay ${productoSeleccionado.stockActual} unidades disponibles`,
        variant: "destructive",
      })
      return
    }

    try {
      const salidaData = {
        tipo: "salida" as const,
        fecha: new Date().toISOString(),
        cantidad: formData.cantidad,
        destino: formData.destino,
        productoId: formData.productoId,
        productoNombre: productoSeleccionado?.nombre || "",
        ventaRef: formData.ventaRef,
      }

      // TODO: Implement addDocument method in firestoreService
      // await firestoreService.addDocument("almacen_salidas", salidaData)

      // Then update local store
      addSalidaAlmacen(salidaData)

      toast({
        title: "✅ Salida Registrada",
        description: `${formData.cantidad} unidades retiradas del inventario`,
      })
      onClose()
    } catch (error) {
      console.error("[v0] Error creating salida:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la salida. Intenta de nuevo.",
        variant: "destructive",
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
                <option value="">Seleccionar producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (Stock: {p.stockActual})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Cantidad</label>
              <input
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                max={productoSeleccionado?.stockActual || 0}
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
                <span className="text-lg font-bold">{productoSeleccionado.stockActual} unidades</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white/60">Stock Después</span>
                <span
                  className={`text-lg font-bold ${(productoSeleccionado.stockActual - formData.cantidad) < 10 ? "text-red-400" : "text-green-400"}`}
                >
                  {productoSeleccionado.stockActual - formData.cantidad} unidades
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
