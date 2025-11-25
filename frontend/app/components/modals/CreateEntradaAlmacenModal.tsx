"use client"

import { useState } from "react"
import { X, PackagePlus, ChevronRight } from "lucide-react"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"
import { useToast } from "@/frontend/app/hooks/use-toast"
import { firestoreService } from "@/frontend/app/lib/firebase/firestore-service"

interface CreateEntradaAlmacenModalProps {
  onClose: () => void
}

export default function CreateEntradaAlmacenModal({ onClose }: CreateEntradaAlmacenModalProps) {
  const { toast } = useToast()
  const addEntradaAlmacen = useAppStore((state) => state.addEntradaAlmacen)

  const [formData, setFormData] = useState({
    productoNombre: "",
    cantidad: 1,
    origen: "",
    costoUnitario: 0,
    ordenCompraRef: "",
  })

  const handleSubmit = async () => {
    if (!formData.productoNombre || !formData.origen || formData.cantidad <= 0) {
      toast({ title: "Error", description: "Completa todos los campos requeridos", variant: "destructive" })
      return
    }

    try {
      const entradaData = {
        tipo: "entrada" as const,
        fecha: new Date().toISOString(),
        cantidad: formData.cantidad,
        origen: formData.origen,
        productoNombre: formData.productoNombre,
        costoUnitario: formData.costoUnitario,
        valorTotal: formData.cantidad * formData.costoUnitario,
        ordenCompraRef: formData.ordenCompraRef,
      }

      await firestoreService.addDocument("almacen_entradas", entradaData)

      // Then update local store
      addEntradaAlmacen(entradaData)

      toast({
        title: "✅ Entrada Registrada",
        description: `${formData.cantidad} unidades agregadas al inventario`,
      })
      onClose()
    } catch (error) {
      console.error("[v0] Error creating entrada:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la entrada. Intenta de nuevo.",
        variant: "destructive",
      })
    }
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
              <input
                type="text"
                value={formData.productoNombre}
                onChange={(e) => setFormData({ ...formData, productoNombre: e.target.value })}
                placeholder="Nombre del producto"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none"
              />
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
