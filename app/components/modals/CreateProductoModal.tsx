"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Package, DollarSign, Tag } from "lucide-react"
import { useAppStore } from "@/app/lib/store/useAppStore"
import { firestoreService } from "@/app/lib/firebase/firestore-service"
import { useToast } from "@/app/hooks/use-toast"
import { logger } from "@/app/lib/utils/logger"

interface CreateProductoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateProductoModal({ isOpen, onClose }: CreateProductoModalProps) {
  const { toast } = useToast()
  const triggerDataRefresh = useAppStore((state) => state.triggerDataRefresh)
  // const addProducto = useAppStore((state) => state.addProducto) // TODO: Implement in store

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precioCompra: "",
    precioVenta: "",
    sku: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido"
    if (!formData.precioCompra || Number.parseFloat(formData.precioCompra) <= 0) {
      newErrors.precioCompra = "El precio de compra debe ser mayor a 0"
    }
    if (!formData.precioVenta || Number.parseFloat(formData.precioVenta) <= 0) {
      newErrors.precioVenta = "El precio de venta debe ser mayor a 0"
    }
    if (Number.parseFloat(formData.precioVenta) <= Number.parseFloat(formData.precioCompra)) {
      newErrors.precioVenta = "El precio de venta debe ser mayor al precio de compra"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      // Crear producto usando el servicio de Firestore
      const productoId = await firestoreService.crearProducto({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        valorUnitario: Number.parseFloat(formData.precioVenta),
        stockInicial: 0,
        categoria: "General",
      })

      // 🔄 Trigger para actualizar hooks de datos
      triggerDataRefresh()

      toast({
        title: "Producto Creado",
        description: `"${formData.nombre}" ha sido agregado al catálogo correctamente.`,
      })
      onClose()
      setFormData({ nombre: "", descripcion: "", precioCompra: "", precioVenta: "", sku: "" })
    } catch (error) {
      logger.error("Error creating producto", error, { context: "CreateProductoModal" })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el producto. Por favor intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl glass-card border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
              <Package className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Crear Producto</h2>
              <p className="text-sm text-white/60">Registra un nuevo producto en el catálogo</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Nombre del Producto *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Ej: Producto Premium"
              />
              {errors.nombre && <p className="mt-1 text-sm text-red-400">{errors.nombre}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">SKU (Opcional)</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="SKU-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Precio de Compra *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precioCompra}
                    onChange={(e) => setFormData({ ...formData, precioCompra: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="0.00"
                  />
                </div>
                {errors.precioCompra && <p className="mt-1 text-sm text-red-400">{errors.precioCompra}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Precio de Venta *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precioVenta}
                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="0.00"
                  />
                </div>
                {errors.precioVenta && <p className="mt-1 text-sm text-red-400">{errors.precioVenta}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Descripción (Opcional)</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                placeholder="Descripción detallada del producto..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
              >
                Crear Producto
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
