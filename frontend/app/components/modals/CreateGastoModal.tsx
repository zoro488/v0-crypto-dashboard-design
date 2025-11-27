"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Receipt, DollarSign, Building2 } from "lucide-react"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"
import { firestoreService } from "@/frontend/app/lib/firebase/firestore-service"
import { useToast } from "@/frontend/app/hooks/use-toast"
import { logger } from "@/frontend/app/lib/utils/logger"

interface CreateGastoModalProps {
  isOpen: boolean
  onClose: () => void
}

const BANCOS = ["Bóveda Monte", "Bóveda USA", "Utilidades", "Fletes", "Azteca", "Leftie", "Profit"]

export default function CreateGastoModal({ isOpen, onClose }: CreateGastoModalProps) {
  const bancos = useAppStore((state) => state.bancos)
  // const addGasto = useAppStore((state) => state.addGasto) // TODO: Implement in store
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    bancoId: "",
    concepto: "",
    monto: "",
    descripcion: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.bancoId) newErrors.bancoId = "Selecciona un banco"
    if (!formData.concepto.trim()) newErrors.concepto = "El concepto es requerido"
    if (!formData.monto || Number.parseFloat(formData.monto) <= 0) {
      newErrors.monto = "El monto debe ser mayor a 0"
    }

    const banco = bancos.find((b) => b.id === formData.bancoId)
    if (banco && Number.parseFloat(formData.monto) > (banco.saldo ?? 0)) {
      newErrors.monto = "Capital insuficiente en el banco seleccionado"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const gasto = {
      id: `GASTO_${Date.now()}`,
      bancoId: formData.bancoId,
      concepto: formData.concepto,
      monto: Number.parseFloat(formData.monto),
      descripcion: formData.descripcion,
      fecha: new Date(),
      createdAt: new Date(),
    }

    try {
      // TODO: Implement addGasto method in firestoreService
      // await firestoreService.addGasto(gasto)
      // addGasto(gasto) // TODO: Implement addGasto in store
      toast({
        title: "Gasto Registrado",
        description: `Se ha registrado el gasto de $${gasto.monto.toLocaleString()} correctamente.`,
      })
      onClose()
      setFormData({ bancoId: "", concepto: "", monto: "", descripcion: "" })
      
      // Refrescar datos en la UI
      useAppStore.getState().triggerDataRefresh()
    } catch (error) {
      logger.error("Error creating gasto:", error)
      toast({
        title: "Error",
        description: "Error al registrar el gasto. Por favor intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  const selectedBanco = bancos.find((b) => b.id === formData.bancoId)

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
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
              <Receipt className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Registrar Gasto</h2>
              <p className="text-sm text-white/60">Registra un gasto desde un banco</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Banco *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                <select
                  value={formData.bancoId}
                  onChange={(e) => setFormData({ ...formData, bancoId: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 appearance-none"
                >
                  <option value="" className="bg-gray-900">
                    Seleccionar banco
                  </option>
                  {bancos.map((banco) => (
                    <option key={banco.id} value={banco.id} className="bg-gray-900">
                      {banco.nombre} - ${(banco.saldo ?? 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              {errors.bancoId && <p className="mt-1 text-sm text-red-400">{errors.bancoId}</p>}

              {selectedBanco && (
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-white/60">Capital disponible:</p>
                  <p className="text-lg font-semibold text-white">
                    ${(selectedBanco.saldo ?? 0).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Concepto *</label>
              <input
                type="text"
                value={formData.concepto}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                placeholder="Ej: Pago de servicios"
              />
              {errors.concepto && <p className="mt-1 text-sm text-red-400">{errors.concepto}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Monto *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="0.00"
                />
              </div>
              {errors.monto && <p className="mt-1 text-sm text-red-400">{errors.monto}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Descripción (Opcional)</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                placeholder="Detalles adicionales..."
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
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all"
              >
                Registrar Gasto
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
