"use client"

import { useAppStore } from "@/frontend/app/lib/store/useAppStore"
import { AnimatePresence, motion } from "framer-motion"
import { X, Users, User } from "lucide-react"
import { useState } from "react"
import { BANCOS } from "@/frontend/app/lib/constants"
import { firestoreService } from "@/frontend/app/lib/firebase/firestore-service"
import { useToast } from "@/frontend/app/hooks/use-toast"
import { logger } from "@/frontend/app/lib/utils/logger"
import { validarAbono } from "@/frontend/app/lib/schemas/ventas.schema"

export default function CreateAbonoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast() // Initialize toast
  const distribuidores = useAppStore((state) => state.distribuidores)
  const clientes = useAppStore((state) => state.clientes)
  const abonarDistribuidor = useAppStore((state) => state.abonarDistribuidor)
  const abonarCliente = useAppStore((state) => state.abonarCliente)
  const triggerDataRefresh = useAppStore((state) => state.triggerDataRefresh)

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    tipo: "distribuidor" as "distribuidor" | "cliente",
    entidadId: "",
    monto: "",
    bancoDestino: "",
    metodo: "efectivo" as "efectivo" | "transferencia" | "cheque",
    referencia: "",
    notas: "",
  })

  const handleSubmit = async () => {
    if (!formData.entidadId || !formData.monto || !formData.bancoDestino) {
      toast({
        title: "Error de validación",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
      // </CHANGE>
    }

    const monto = Number.parseFloat(formData.monto)

    try {
      // Validar con Zod
      const validacion = validarAbono({
        clienteId: formData.entidadId,
        monto,
      })

      if (!validacion.success) {
        toast({
          title: "Error de Validación",
          description: validacion.errors?.join(", ") || "Datos inválidos",
          variant: "destructive",
        })
        return
      }

      // Persistir en Firestore
      await firestoreService.addAbono({
        tipo: formData.tipo,
        entidadId: formData.entidadId,
        monto,
        bancoDestino: formData.bancoDestino,
        metodo: formData.metodo,
        referencia: formData.referencia,
        notas: formData.notas,
      })

      // Actualizar estado local

      if (formData.tipo === "distribuidor") {
        abonarDistribuidor(formData.entidadId, monto, formData.bancoDestino)
      } else {
        abonarCliente(formData.entidadId, monto)
      }

      // 🔄 Trigger para actualizar hooks de datos
      triggerDataRefresh()

      toast({
        title: "Abono Registrado",
        description: `Se ha registrado el abono de $${monto.toLocaleString()} correctamente.`,
      })
      // </CHANGE>

      onClose()
      setStep(1)
      setFormData({
        tipo: "distribuidor",
        entidadId: "",
        monto: "",
        bancoDestino: "",
        metodo: "efectivo",
        referencia: "",
        notas: "",
      })
    } catch (error) {
      logger.error("Error creating abono", error, { context: "CreateAbonoModal" })
      toast({
        title: "Error",
        description: "Error al registrar el abono. Por favor intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  if (!isOpen) return null

  const entidades = formData.tipo === "distribuidor" ? distribuidores : clientes

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
          className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Registrar Abono</h2>
              <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all ${s <= step ? "bg-blue-500" : "bg-white/10"}`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Tipo de Entidad</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["distribuidor", "cliente"].map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setFormData({ ...formData, tipo: tipo as any, entidadId: "" })}
                        className={`p-4 rounded-xl border transition-all ${
                          formData.tipo === tipo
                            ? "bg-blue-500/20 border-blue-500"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        {tipo === "distribuidor" ? (
                          <Users className="w-6 h-6 mx-auto mb-2" />
                        ) : (
                          <User className="w-6 h-6 mx-auto mb-2" />
                        )}
                        <span className="capitalize">{tipo}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Seleccionar {formData.tipo}</label>
                  <select
                    value={formData.entidadId}
                    onChange={(e) => setFormData({ ...formData, entidadId: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    {entidades.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre} - Deuda: ${e.deudaTotal.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Monto del Abono *</label>
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
                  <label className="block text-sm font-medium text-white/80 mb-2">Método de Pago</label>
                  <select
                    value={formData.metodo}
                    onChange={(e) => setFormData({ ...formData, metodo: e.target.value as any })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Referencia</label>
                  <input
                    type="text"
                    value={formData.referencia}
                    onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Número de referencia o comprobante"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    rows={4}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              {step === 1 ? "Cancelar" : "Anterior"}
            </button>
            <button
              onClick={() => (step < 3 ? setStep(step + 1) : handleSubmit())}
              className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition-all"
            >
              {step === 3 ? "Registrar Abono" : "Siguiente"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
