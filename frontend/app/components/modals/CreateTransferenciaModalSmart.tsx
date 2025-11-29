"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  ArrowRightLeft, 
  DollarSign, 
  Building2, 
  FileText,
  Sparkles,
  Mic,
  AlertTriangle,
  ArrowRight,
  CheckCircle2
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { firestoreService } from "@/frontend/app/lib/firebase/firestore-service"
import { useToast } from "@/frontend/app/hooks/use-toast"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"
import { logger } from "@/frontend/app/lib/utils/logger"
import { BANCOS } from "@/frontend/app/lib/constants"

// Schema de validación Zod
const transferenciaSchema = z.object({
  bancoOrigen: z.string().min(1, "Selecciona un banco de origen"),
  bancoDestino: z.string().min(1, "Selecciona un banco de destino"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  concepto: z.string().optional(),
  referencia: z.string().optional(),
  notas: z.string().optional(),
}).refine((data) => data.bancoOrigen !== data.bancoDestino, {
  message: "Los bancos de origen y destino deben ser diferentes",
  path: ["bancoDestino"],
})

type TransferenciaFormData = z.infer<typeof transferenciaSchema>

interface CreateTransferenciaModalSmartProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: TransferenciaFormData) => void
}

export default function CreateTransferenciaModalSmart({ 
  isOpen, 
  onClose, 
  onSubmit 
}: CreateTransferenciaModalSmartProps) {
  const { toast } = useToast()
  const bancos = useAppStore((state) => state.bancos)
  const crearTransferencia = useAppStore((state) => state.crearTransferencia)
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
  } = useForm<TransferenciaFormData>({
    resolver: zodResolver(transferenciaSchema),
    mode: "onChange",
    defaultValues: {
      bancoOrigen: "",
      bancoDestino: "",
      monto: 0,
      concepto: "",
      referencia: "",
      notas: "",
    },
  })

  const watchedBancoOrigen = watch("bancoOrigen")
  const watchedBancoDestino = watch("bancoDestino")
  const watchedMonto = watch("monto")

  // Obtener bancos seleccionados
  const selectedBancoOrigen = useMemo(() => {
    return bancos.find(b => b.id === watchedBancoOrigen)
  }, [bancos, watchedBancoOrigen])

  const selectedBancoDestino = useMemo(() => {
    return bancos.find(b => b.id === watchedBancoDestino)
  }, [bancos, watchedBancoDestino])

  // Validar si hay saldo suficiente
  const hasSufficientFunds = useMemo(() => {
    if (!selectedBancoOrigen || !watchedMonto) return true
    return (selectedBancoOrigen.saldo ?? 0) >= watchedMonto
  }, [selectedBancoOrigen, watchedMonto])

  // Bancos disponibles para destino (excluye el origen)
  const bancosDestino = useMemo(() => {
    return BANCOS.filter(b => b.id !== watchedBancoOrigen)
  }, [watchedBancoOrigen])

  const handleVoiceFill = useCallback(() => {
    setIsVoiceActive(true)
    toast({
      title: "Modo Voz Activado",
      description: "Próximamente: Dicta la información de la transferencia",
    })
    setTimeout(() => setIsVoiceActive(false), 2000)
  }, [toast])

  const onFormSubmit = async (data: TransferenciaFormData) => {
    if (!hasSufficientFunds) {
      toast({
        title: "Saldo Insuficiente",
        description: "El banco de origen no tiene suficiente saldo para esta transferencia.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Persistir en Firestore
      await firestoreService.addTransferencia({
        bancoOrigenId: data.bancoOrigen,
        bancoDestinoId: data.bancoDestino,
        monto: data.monto,
        concepto: data.concepto || "Transferencia entre bancos",
        referencia: data.referencia || "",
        notas: data.notas || "",
      })

      // Actualizar estado local
      crearTransferencia(data.bancoOrigen, data.bancoDestino, data.monto)

      // Trigger para actualizar hooks de datos
      triggerDataRefresh()

      if (onSubmit) {
        onSubmit(data)
      }

      toast({
        title: "✅ Transferencia Exitosa",
        description: `Se transfirieron $${data.monto.toLocaleString()} correctamente.`,
      })

      // Limpiar formulario y cerrar
      reset()
      setStep(1)
      onClose()
    } catch (error) {
      logger.error("Error creating transferencia", error, { context: "CreateTransferenciaModalSmart" })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear la transferencia.",
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

  const canAdvanceStep1 = watchedBancoOrigen && watchedBancoOrigen.length > 0 && 
                          watchedBancoDestino && watchedBancoDestino.length > 0 &&
                          watchedBancoOrigen !== watchedBancoDestino
  const canAdvanceStep2 = watchedMonto > 0 && hasSufficientFunds

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop con blur premium */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-black/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-indigo-500/10 z-50"
          >
            {/* Header con gradiente premium */}
            <div className="relative p-6 sm:p-8 border-b border-white/10 bg-gradient-to-r from-indigo-900/30 via-violet-900/20 to-indigo-900/30">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-violet-500/5" />
              
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
                    ? "bg-indigo-500/30 text-indigo-300" 
                    : "hover:bg-white/10 text-gray-400 hover:text-white"
                }`}
              >
                <Mic className="w-5 h-5" />
              </motion.button>

              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                    <ArrowRightLeft className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Nueva Transferencia</h2>
                    <p className="text-gray-400 text-sm">Transfiere fondos entre bancos</p>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="flex gap-2 mt-6">
                  {[1, 2].map((s) => (
                    <div key={s} className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: step >= s ? "100%" : "0%" }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span className={step >= 1 ? "text-indigo-400" : ""}>Bancos</span>
                  <span className={step >= 2 ? "text-indigo-400" : ""}>Monto y Detalles</span>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {/* Step 1: Selección de bancos */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Banco Origen */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <Building2 className="w-4 h-4 mr-2 text-indigo-400" />
                        Banco Origen *
                      </label>
                      <select
                        {...register("bancoOrigen")}
                        onChange={(e) => {
                          setValue("bancoOrigen", e.target.value)
                          // Reset destino si es igual al nuevo origen
                          if (watchedBancoDestino === e.target.value) {
                            setValue("bancoDestino", "")
                          }
                        }}
                        className={`w-full px-5 py-4 bg-white/5 border rounded-xl text-white text-lg focus:outline-none focus:ring-2 transition-all appearance-none ${
                          errors.bancoOrigen 
                            ? "border-red-500/50 focus:ring-red-500" 
                            : "border-white/10 focus:ring-indigo-500 focus:border-transparent"
                        }`}
                      >
                        <option value="" className="bg-gray-900">Seleccionar banco origen...</option>
                        {BANCOS.map((banco) => {
                          const bancoData = bancos.find(b => b.id === banco.id)
                          return (
                            <option key={banco.id} value={banco.id} className="bg-gray-900">
                              {banco.nombre} - ${(bancoData?.saldo ?? 0).toLocaleString()}
                            </option>
                          )
                        })}
                      </select>
                      {errors.bancoOrigen && (
                        <p className="mt-2 text-sm text-red-400">{errors.bancoOrigen.message}</p>
                      )}
                    </div>

                    {/* Info de banco origen */}
                    {selectedBancoOrigen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{selectedBancoOrigen.nombre}</p>
                            <p className="text-sm text-gray-400">Capital disponible para transferir</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">
                              ${(selectedBancoOrigen.saldo ?? 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Arrow indicator */}
                    {selectedBancoOrigen && (
                      <div className="flex justify-center">
                        <div className="p-2 rounded-full bg-indigo-500/20">
                          <ArrowRight className="w-5 h-5 text-indigo-400" />
                        </div>
                      </div>
                    )}

                    {/* Banco Destino */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <Building2 className="w-4 h-4 mr-2 text-indigo-400" />
                        Banco Destino *
                      </label>
                      <select
                        {...register("bancoDestino")}
                        className={`w-full px-5 py-4 bg-white/5 border rounded-xl text-white text-lg focus:outline-none focus:ring-2 transition-all appearance-none ${
                          errors.bancoDestino 
                            ? "border-red-500/50 focus:ring-red-500" 
                            : "border-white/10 focus:ring-indigo-500 focus:border-transparent"
                        }`}
                      >
                        <option value="" className="bg-gray-900">Seleccionar banco destino...</option>
                        {bancosDestino.map((banco) => {
                          const bancoData = bancos.find(b => b.id === banco.id)
                          return (
                            <option key={banco.id} value={banco.id} className="bg-gray-900">
                              {banco.nombre} - ${(bancoData?.saldo ?? 0).toLocaleString()}
                            </option>
                          )
                        })}
                      </select>
                      {errors.bancoDestino && (
                        <p className="mt-2 text-sm text-red-400">{errors.bancoDestino.message}</p>
                      )}
                    </div>

                    {/* Info de banco destino */}
                    {selectedBancoDestino && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{selectedBancoDestino.nombre}</p>
                            <p className="text-sm text-gray-400">Capital actual</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">
                              ${(selectedBancoDestino.saldo ?? 0).toLocaleString()}
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
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
                      >
                        Continuar →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Monto y detalles */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Preview de transferencia */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-red-500/20">
                            <Building2 className="w-4 h-4 text-red-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{selectedBancoOrigen?.nombre}</p>
                            <p className="text-xs text-gray-400">Origen</p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-indigo-400" />
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-white font-medium text-right">{selectedBancoDestino?.nombre}</p>
                            <p className="text-xs text-gray-400 text-right">Destino</p>
                          </div>
                          <div className="p-2 rounded-lg bg-emerald-500/20">
                            <Building2 className="w-4 h-4 text-emerald-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Monto */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <DollarSign className="w-4 h-4 mr-2 text-indigo-400" />
                        Monto a Transferir *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                        <input
                          type="number"
                          step="0.01"
                          {...register("monto", { valueAsNumber: true })}
                          className={`w-full pl-10 pr-5 py-4 bg-white/5 border rounded-xl text-white text-2xl font-bold focus:outline-none focus:ring-2 transition-all ${
                            errors.monto || !hasSufficientFunds
                              ? "border-red-500/50 focus:ring-red-500" 
                              : "border-white/10 focus:ring-indigo-500 focus:border-transparent"
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                      {errors.monto && (
                        <p className="mt-2 text-sm text-red-400">{errors.monto.message}</p>
                      )}
                      {!hasSufficientFunds && watchedMonto > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-red-300">
                            Capital insuficiente en origen. Disponible: ${(selectedBancoOrigen?.saldo ?? 0).toLocaleString()}
                          </span>
                        </motion.div>
                      )}

                      {/* Quick amount buttons */}
                      {selectedBancoOrigen && (selectedBancoOrigen.saldo ?? 0) > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setValue("monto", selectedBancoOrigen.saldo ?? 0)}
                            className="px-3 py-1.5 text-xs bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors"
                          >
                            100% (${(selectedBancoOrigen.saldo ?? 0).toLocaleString()})
                          </button>
                          <button
                            type="button"
                            onClick={() => setValue("monto", (selectedBancoOrigen.saldo ?? 0) / 2)}
                            className="px-3 py-1.5 text-xs bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                          >
                            50%
                          </button>
                          <button
                            type="button"
                            onClick={() => setValue("monto", (selectedBancoOrigen.saldo ?? 0) / 4)}
                            className="px-3 py-1.5 text-xs bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                          >
                            25%
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Concepto */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <FileText className="w-4 h-4 mr-2 text-indigo-400" />
                        Concepto
                      </label>
                      <input
                        type="text"
                        {...register("concepto")}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Motivo de la transferencia"
                      />
                    </div>

                    {/* Referencia */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <FileText className="w-4 h-4 mr-2 text-indigo-400" />
                        Referencia
                      </label>
                      <input
                        type="text"
                        {...register("referencia")}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Número de referencia"
                      />
                    </div>

                    {/* Resumen del impacto */}
                    {watchedMonto > 0 && hasSufficientFunds && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm font-medium text-gray-300">Resumen de la Transferencia</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">{selectedBancoOrigen?.nombre}:</span>
                            <span className="text-white">
                              ${(selectedBancoOrigen?.saldo ?? 0).toLocaleString()} → 
                              <span className="text-red-400 ml-1">
                                ${((selectedBancoOrigen?.saldo ?? 0) - watchedMonto).toLocaleString()}
                              </span>
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">{selectedBancoDestino?.nombre}:</span>
                            <span className="text-white">
                              ${(selectedBancoDestino?.saldo ?? 0).toLocaleString()} → 
                              <span className="text-emerald-400 ml-1">
                                ${((selectedBancoDestino?.saldo ?? 0) + watchedMonto).toLocaleString()}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Suggestion */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-indigo-300 font-medium">Sugerencia IA</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Las transferencias entre bancos no afectan el capital total, solo redistribuyen los fondos. 
                            Considera agregar una referencia para facilitar la conciliación.
                          </p>
                        </div>
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
                        type="submit"
                        disabled={isSubmitting || !canAdvanceStep2}
                        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                        className="flex-1 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Transfiriendo...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <ArrowRightLeft className="w-4 h-4" />
                            Transferir
                          </span>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
