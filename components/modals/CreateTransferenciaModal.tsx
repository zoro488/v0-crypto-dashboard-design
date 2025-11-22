"use client"

import { useAppStore } from "@/lib/store/useAppStore" // Fixed import path
import { AnimatePresence, motion } from "framer-motion"
import { X, ArrowRightLeft } from "lucide-react" // Fixed import to use lucide-react
import { BANCOS } from "@/lib/constants" // Fixed import path
import { useState } from "react"
import { firestoreService } from "@/lib/firebase/firestore-service"
import { useToast } from "@/hooks/use-toast"

export default function CreateTransferenciaModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast()
  const crearTransferencia = useAppStore((state) => state.crearTransferencia)
  const bancos = useAppStore((state) => state.bancos)

  const [formData, setFormData] = useState({
    bancoOrigen: "",
    bancoDestino: "",
    monto: "",
    concepto: "",
    referencia: "",
    notas: "",
  })

  const handleSubmit = async () => {
    if (!formData.bancoOrigen || !formData.bancoDestino || !formData.monto) {
      toast({
        title: "Error de validación",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    if (formData.bancoOrigen === formData.bancoDestino) {
      toast({
        title: "Error de validación",
        description: "Los bancos de origen y destino deben ser diferentes",
        variant: "destructive",
      })
      return
    }

    const monto = Number.parseFloat(formData.monto)
    const bancoOrigen = bancos.find((b) => b.id === formData.bancoOrigen)

    if (bancoOrigen && (bancoOrigen.saldo ?? 0) < monto) {
      toast({
        title: "Saldo Insuficiente",
        description: "No hay suficiente saldo en el banco de origen",
        variant: "destructive",
      })
      return
    }

    try {
      const transferencia = {
        id: `TRANS_${Date.now()}`,
        bancoOrigen: formData.bancoOrigen,
        bancoDestino: formData.bancoDestino,
        monto,
        concepto: formData.concepto,
        referencia: formData.referencia,
        notas: formData.notas,
        fecha: new Date(),
        createdAt: new Date(),
      }

      await firestoreService.addTransferencia(transferencia)
      crearTransferencia(formData.bancoOrigen, formData.bancoDestino, monto)

      toast({
        title: "Transferencia Exitosa",
        description: `Se transfirieron $${monto.toLocaleString()} correctamente.`,
      })

      onClose()
      setFormData({
        bancoOrigen: "",
        bancoDestino: "",
        monto: "",
        concepto: "",
        referencia: "",
        notas: "",
      })
    } catch (error) {
      console.error("Error creating transferencia:", error)
      toast({
        title: "Error",
        description: "Error al crear la transferencia. Por favor intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="glass-card max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Nueva Transferencia</h2>
              <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Banco Origen *</label>
              <select
                value={formData.bancoOrigen}
                onChange={(e) => setFormData({ ...formData, bancoOrigen: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Seleccionar banco...</option>
                {BANCOS.map((banco) => (
                  <option key={banco.id} value={banco.id}>
                    {banco.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Banco Destino *</label>
              <select
                value={formData.bancoDestino}
                onChange={(e) => setFormData({ ...formData, bancoDestino: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Seleccionar banco...</option>
                {BANCOS.map((banco) => (
                  <option key={banco.id} value={banco.id}>
                    {banco.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Monto *</label>
              <input
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Concepto</label>
              <input
                type="text"
                value={formData.concepto}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="Motivo de la transferencia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Referencia</label>
              <input
                type="text"
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="Número de referencia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Notas</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>

          <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition-all flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transferir
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
