"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Users, 
  User, 
  DollarSign, 
  Building2, 
  CreditCard,
  FileText,
  Sparkles,
  Mic,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog"
import { cn } from "@/app/lib/utils"
import { firestoreService } from "@/app/lib/firebase/firestore-service"
import { useToast } from "@/app/hooks/use-toast"
import { useAppStore } from "@/app/lib/store/useAppStore"
import { logger } from "@/app/lib/utils/logger"
import { BANCOS } from "@/app/lib/constants"

// Schema de validación Zod
const abonoSchema = z.object({
  tipo: z.enum(["distribuidor", "cliente"]),
  entidadId: z.string().min(1, "Selecciona una entidad"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  bancoDestino: z.string().min(1, "Selecciona un banco destino"),
  metodo: z.enum(["efectivo", "transferencia", "cheque"]),
  referencia: z.string().optional(),
  notas: z.string().optional(),
})

type AbonoFormData = z.infer<typeof abonoSchema>

interface CreateAbonoModalSmartProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: AbonoFormData) => void
}

const METODO_PAGO_OPTIONS = [
  { value: "efectivo", label: "Efectivo", icon: "💵" },
  { value: "transferencia", label: "Transferencia", icon: "📲" },
  { value: "cheque", label: "Cheque", icon: "📝" },
]

export default function CreateAbonoModalSmart({ 
  isOpen, 
  onClose, 
  onSubmit 
}: CreateAbonoModalSmartProps) {
  const { toast } = useToast()
  const distribuidores = useAppStore((state) => state.distribuidores)
  const clientes = useAppStore((state) => state.clientes)
  const abonarDistribuidor = useAppStore((state) => state.abonarDistribuidor)
  const abonarCliente = useAppStore((state) => state.abonarCliente)
  const triggerDataRefresh = useAppStore((state) => state.triggerDataRefresh)

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<AbonoFormData>({
    resolver: zodResolver(abonoSchema),
    mode: "onChange",
    defaultValues: {
      tipo: "distribuidor",
      entidadId: "",
      monto: 0,
      bancoDestino: "",
      metodo: "efectivo",
      referencia: "",
      notas: "",
    },
  })

  const watchedTipo = watch("tipo")
  const watchedEntidadId = watch("entidadId")
  const watchedMonto = watch("monto")
  const watchedBancoDestino = watch("bancoDestino")
  const watchedMetodo = watch("metodo")

  // Obtener entidades según el tipo seleccionado
  const entidades = useMemo(() => {
    return watchedTipo === "distribuidor" ? distribuidores : clientes
  }, [watchedTipo, distribuidores, clientes])

  // Obtener entidad seleccionada
  const selectedEntidad = useMemo(() => {
    return entidades.find(e => e.id === watchedEntidadId)
  }, [entidades, watchedEntidadId])

  const handleVoiceFill = useCallback(() => {
    setIsVoiceActive(true)
    toast({
      title: "Modo Voz Activado",
      description: "Próximamente: Dicta la información del abono",
    })
    setTimeout(() => setIsVoiceActive(false), 2000)
  }, [toast])

  const onFormSubmit = async (data: AbonoFormData) => {
    setIsSubmitting(true)

    try {
      // Persistir en Firestore
      await firestoreService.addAbono({
        tipo: data.tipo,
        entidadId: data.entidadId,
        monto: data.monto,
        bancoDestino: data.bancoDestino,
        metodo: data.metodo,
        referencia: data.referencia || "",
        notas: data.notas || "",
      })

      // Actualizar estado local
      if (data.tipo === "distribuidor") {
        abonarDistribuidor(data.entidadId, data.monto, data.bancoDestino)
      } else {
        abonarCliente(data.entidadId, data.monto)
      }

      // Trigger para actualizar hooks de datos
      triggerDataRefresh()

      if (onSubmit) {
        onSubmit(data)
      }

      toast({
        title: "✅ Abono Registrado",
        description: `Se ha registrado el abono de $${data.monto.toLocaleString()} correctamente.`,
      })

      // Limpiar formulario y cerrar
      reset()
      setStep(1)
      onClose()
    } catch (error) {
      logger.error("Error creating abono", error, { context: "CreateAbonoModalSmart" })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrar el abono.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = useCallback(() => {
    reset()
    setStep(1)
    onClose()
  }, [reset, onClose])

  const canAdvanceStep1 = watchedEntidadId && watchedEntidadId.length > 0
  const canAdvanceStep2 = watchedMonto > 0 && watchedBancoDestino.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "max-w-2xl max-h-[85vh] p-0",
          "bg-black/95 border-white/10 backdrop-blur-2xl",
          "text-white overflow-hidden flex flex-col",
          "shadow-2xl shadow-blue-500/10"
        )}
      >
        <DialogTitle className="sr-only">Registrar Abono</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para registrar un abono de distribuidor o cliente
        </DialogDescription>
            {/* Header con gradiente premium */}
            <div className="relative p-6 sm:p-8 border-b border-white/10 bg-gradient-to-r from-blue-900/30 via-cyan-900/20 to-blue-900/30">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5" />
              
              {/* Botón cerrar */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 hover:bg-white/10 rounded-xl transition-colors group"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </button>

              {/* Botón de voz */}
              <motion.button
                type="button"
                onClick={handleVoiceFill}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`absolute right-16 top-4 sm:right-20 sm:top-6 p-2 rounded-xl transition-all ${
                  isVoiceActive 
                    ? "bg-blue-500/30 text-blue-300" 
                    : "hover:bg-white/10 text-gray-400 hover:text-white"
                }`}
              >
                <Mic className="w-5 h-5" />
              </motion.button>

              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <DollarSign className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Registrar Abono</h2>
                    <p className="text-gray-400 text-sm">Registra un pago de distribuidor o cliente</p>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="flex gap-2 mt-6">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: step >= s ? "100%" : "0%" }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span className={step >= 1 ? "text-blue-400" : ""}>Entidad</span>
                  <span className={step >= 2 ? "text-blue-400" : ""}>Pago</span>
                  <span className={step >= 3 ? "text-blue-400" : ""}>Detalles</span>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {/* Step 1: Selección de entidad */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Tipo de entidad */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <Users className="w-4 h-4 mr-2 text-blue-400" />
                        Tipo de Entidad
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {["distribuidor", "cliente"].map((tipo) => (
                          <motion.button
                            key={tipo}
                            type="button"
                            onClick={() => {
                              setValue("tipo", tipo as "distribuidor" | "cliente")
                              setValue("entidadId", "") // Reset selection when changing type
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl border transition-all flex flex-col items-center ${
                              watchedTipo === tipo
                                ? "bg-blue-500/20 border-blue-500 text-white"
                                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                            }`}
                          >
                            {tipo === "distribuidor" ? (
                              <Users className="w-6 h-6 mb-2" />
                            ) : (
                              <User className="w-6 h-6 mb-2" />
                            )}
                            <span className="capitalize font-medium">{tipo}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Selección de entidad específica */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <User className="w-4 h-4 mr-2 text-blue-400" />
                        Seleccionar {watchedTipo} *
                      </label>
                      <select
                        {...register("entidadId")}
                        className={`w-full px-5 py-4 bg-white/5 border rounded-xl text-white text-lg focus:outline-none focus:ring-2 transition-all appearance-none ${
                          errors.entidadId 
                            ? "border-red-500/50 focus:ring-red-500" 
                            : "border-white/10 focus:ring-blue-500 focus:border-transparent"
                        }`}
                      >
                        <option value="" className="bg-gray-900">Seleccionar...</option>
                        {entidades.map((e) => (
                          <option key={e.id} value={e.id} className="bg-gray-900">
                            {e.nombre} - Deuda: ${e.deudaTotal?.toFixed(2) || "0.00"}
                          </option>
                        ))}
                      </select>
                      {errors.entidadId && (
                        <p className="mt-2 text-sm text-red-400">{errors.entidadId.message}</p>
                      )}
                    </div>

                    {/* Info de entidad seleccionada */}
                    {selectedEntidad && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{selectedEntidad.nombre}</p>
                            <p className="text-sm text-gray-400">
                              {watchedTipo === "distribuidor" ? "Distribuidor" : "Cliente"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Deuda actual</p>
                            <p className="text-xl font-bold text-red-400">
                              ${selectedEntidad.deudaTotal?.toLocaleString() || "0.00"}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-end pt-4">
                      <motion.button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!canAdvanceStep1}
                        whileHover={{ scale: canAdvanceStep1 ? 1.02 : 1 }}
                        whileTap={{ scale: canAdvanceStep1 ? 0.98 : 1 }}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
                      >
                        Continuar →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Información de pago */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Monto del abono */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <DollarSign className="w-4 h-4 mr-2 text-blue-400" />
                        Monto del Abono *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                        <input
                          type="number"
                          step="0.01"
                          {...register("monto", { valueAsNumber: true })}
                          className={`w-full pl-10 pr-5 py-4 bg-white/5 border rounded-xl text-white text-2xl font-bold focus:outline-none focus:ring-2 transition-all ${
                            errors.monto 
                              ? "border-red-500/50 focus:ring-red-500" 
                              : "border-white/10 focus:ring-blue-500 focus:border-transparent"
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                      {errors.monto && (
                        <p className="mt-2 text-sm text-red-400">{errors.monto.message}</p>
                      )}
                      
                      {/* Quick amount buttons */}
                      {selectedEntidad && selectedEntidad.deudaTotal && selectedEntidad.deudaTotal > 0 && (
                        <div className="flex gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => setValue("monto", selectedEntidad.deudaTotal || 0)}
                            className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                          >
                            Pago total (${selectedEntidad.deudaTotal?.toLocaleString()})
                          </button>
                          <button
                            type="button"
                            onClick={() => setValue("monto", (selectedEntidad.deudaTotal || 0) / 2)}
                            className="px-3 py-1.5 text-xs bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                          >
                            50%
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Banco destino */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <Building2 className="w-4 h-4 mr-2 text-blue-400" />
                        Banco Destino *
                      </label>
                      <select
                        {...register("bancoDestino")}
                        className={`w-full px-5 py-4 bg-white/5 border rounded-xl text-white text-lg focus:outline-none focus:ring-2 transition-all appearance-none ${
                          errors.bancoDestino 
                            ? "border-red-500/50 focus:ring-red-500" 
                            : "border-white/10 focus:ring-blue-500 focus:border-transparent"
                        }`}
                      >
                        <option value="" className="bg-gray-900">Seleccionar banco...</option>
                        {BANCOS.map((banco) => (
                          <option key={banco.id} value={banco.id} className="bg-gray-900">
                            {banco.nombre}
                          </option>
                        ))}
                      </select>
                      {errors.bancoDestino && (
                        <p className="mt-2 text-sm text-red-400">{errors.bancoDestino.message}</p>
                      )}
                    </div>

                    {/* Método de pago */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <CreditCard className="w-4 h-4 mr-2 text-blue-400" />
                        Método de Pago
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {METODO_PAGO_OPTIONS.map((option) => (
                          <motion.button
                            key={option.value}
                            type="button"
                            onClick={() => setValue("metodo", option.value as AbonoFormData["metodo"])}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-3 rounded-xl border text-sm transition-all ${
                              watchedMetodo === option.value
                                ? "bg-blue-500/20 border-blue-500 text-white"
                                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                            }`}
                          >
                            <span className="mr-1">{option.icon}</span> {option.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-4 pt-4">
                      <motion.button
                        type="button"
                        onClick={() => setStep(1)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-all"
                      >
                        ← Atrás
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => setStep(3)}
                        disabled={!canAdvanceStep2}
                        whileHover={{ scale: canAdvanceStep2 ? 1.02 : 1 }}
                        whileTap={{ scale: canAdvanceStep2 ? 0.98 : 1 }}
                        className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
                      >
                        Continuar →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Detalles adicionales y confirmación */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Preview card */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-white font-medium">{selectedEntidad?.nombre || "Entidad"}</p>
                            <p className="text-sm text-gray-400 capitalize">{watchedTipo}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-400">
                            ${watchedMonto?.toLocaleString() || "0.00"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {METODO_PAGO_OPTIONS.find(m => m.value === watchedMetodo)?.label}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Referencia */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <FileText className="w-4 h-4 mr-2 text-blue-400" />
                        Referencia
                      </label>
                      <input
                        type="text"
                        {...register("referencia")}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Número de referencia o comprobante"
                      />
                    </div>

                    {/* Notas */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <FileText className="w-4 h-4 mr-2 text-blue-400" />
                        Notas
                      </label>
                      <textarea
                        {...register("notas")}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        rows={3}
                        placeholder="Notas adicionales..."
                      />
                    </div>

                    {/* Resumen de deuda */}
                    {selectedEntidad && selectedEntidad.deudaTotal && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-medium text-gray-300">Resumen de Deuda</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Deuda actual:</span>
                            <span className="text-white">${selectedEntidad.deudaTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Abono:</span>
                            <span className="text-green-400">-${watchedMonto?.toLocaleString() || "0.00"}</span>
                          </div>
                          <div className="border-t border-white/10 pt-2 flex justify-between font-medium">
                            <span className="text-gray-300">Nueva deuda:</span>
                            <span className={`${(selectedEntidad.deudaTotal - (watchedMonto || 0)) <= 0 ? "text-green-400" : "text-yellow-400"}`}>
                              ${Math.max(0, selectedEntidad.deudaTotal - (watchedMonto || 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Suggestion */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-emerald-300 font-medium">Sugerencia IA</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {watchedMonto && selectedEntidad?.deudaTotal && watchedMonto >= selectedEntidad.deudaTotal
                              ? "¡Excelente! Este abono liquidará la deuda completa del " + watchedTipo + "."
                              : "Considera registrar la referencia del comprobante para mejor seguimiento."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-4 pt-4">
                      <motion.button
                        type="button"
                        onClick={() => setStep(2)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-all"
                      >
                        ← Atrás
                      </motion.button>
                      <motion.button
                        type="submit"
                        disabled={isSubmitting || !isValid}
                        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                        className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Registrando...
                          </span>
                        ) : (
                          "Registrar Abono ✓"
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
      </DialogContent>
    </Dialog>
  )
}
