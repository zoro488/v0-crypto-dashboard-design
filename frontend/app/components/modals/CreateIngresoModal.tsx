"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, TrendingUp, DollarSign, Building2, FileText } from "lucide-react"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"
import { firestoreService } from "@/frontend/app/lib/firebase/firestore-service"
import { useToast } from "@/frontend/app/hooks/use-toast"

import { logger } from "@/frontend/app/lib/utils/logger"

interface CreateIngresoModalProps {
  isOpen: boolean
  onClose: () => void
}

const BANCOS = ["Bóveda Monte", "Bóveda USA", "Utilidades", "Fletes", "Azteca", "Leftie", "Profit"]

export default function CreateIngresoModal({ isOpen, onClose }: CreateIngresoModalProps) {
  const { toast } = useToast()
  const bancos = useAppStore((state) => state.bancos)
  const triggerDataRefresh = useAppStore((state) => state.triggerDataRefresh)

  const [formData, setFormData] = useState({
    bancoId: "",
    concepto: "",
    monto: "",
    descripcion: "",
    referencia: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.bancoId) newErrors.bancoId = "Selecciona un banco"
    if (!formData.concepto.trim()) newErrors.concepto = "El concepto es requerido"
    if (!formData.monto || Number.parseFloat(formData.monto) <= 0) {
      newErrors.monto = "El monto debe ser mayor a 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      // Crear ingreso usando el servicio de Firestore
      await firestoreService.crearIngreso({
        monto: Number.parseFloat(formData.monto),
        concepto: formData.concepto,
        bancoDestino: formData.bancoId,
        referencia: formData.referencia,
        notas: formData.descripcion,
      })

      // 🔄 Trigger para actualizar hooks de datos
      triggerDataRefresh()

      toast({
        title: "Ingreso Registrado",
        description: `Se ha registrado el ingreso de $${Number.parseFloat(formData.monto).toLocaleString()} correctamente.`,
      })

      onClose()
      setFormData({ bancoId: "", concepto: "", monto: "", descripcion: "", referencia: "" })
    } catch (error) {
      logger.error("Error creating ingreso", error, { context: "CreateIngresoModal" })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrar el ingreso. Por favor intenta de nuevo.",
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
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Registrar Ingreso</h2>
              <p className="text-sm text-white/60">Registra un ingreso a un banco</p>
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
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
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
                  <p className="text-sm text-white/60">Capital actual:</p>
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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Ej: Venta de productos"
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
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="0.00"
                />
              </div>
              {errors.monto && <p className="mt-1 text-sm text-red-400">{errors.monto}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Referencia</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={formData.referencia}
                  onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Número de referencia"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Descripción (Opcional)</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
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
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
              >
                Registrar Ingreso
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
