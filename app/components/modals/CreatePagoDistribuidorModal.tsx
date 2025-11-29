/**
 * ====================================================================
 * MODAL PARA REGISTRAR PAGO A DISTRIBUIDOR - LÓGICA CORREGIDA
 * ====================================================================
 * 
 * ⚠️ IMPORTANTE: Los pagos a distribuidores son GASTOS, no abonos.
 * El dinero SALE del banco seleccionado hacia el distribuidor.
 * 
 * FLUJO CORRECTO:
 * 1. Seleccionar distribuidor con deuda pendiente
 * 2. Seleccionar banco de ORIGEN (de dónde sale el dinero)
 * 3. Especificar monto a pagar
 * 4. Se ejecuta:
 *    - banco.capitalActual -= monto
 *    - banco.historicoGastos += monto
 *    - distribuidor.deudaTotal -= monto
 *    - distribuidor.totalPagado += monto
 *    - Se registra en gastos_abonos como tipo 'gasto'
 * 
 * @author Chronos System
 * @version 2.0
 */

"use client"

import type React from "react"
import { useState, useCallback, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Users, 
  DollarSign, 
  CreditCard,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Banknote,
  TrendingDown,
  Wallet,
  ArrowUpRight
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
import { useToast } from "@/app/hooks/use-toast"
import { useAppStore } from "@/app/lib/store/useAppStore"
import { logger } from "@/app/lib/utils/logger"
import { usePagoDistribuidor } from "@/app/hooks/useBusinessOperations"
import { useBancosData } from "@/app/lib/firebase/firestore-hooks.service"
import type { Distribuidor, BancoId } from "@/app/types"
import { BANCOS } from "@/app/lib/constants"

// Schema de validación
const pagoDistribuidorSchema = z.object({
  distribuidorId: z.string().min(1, "Selecciona un distribuidor"),
  bancoOrigen: z.string().min(1, "Selecciona el banco de origen"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  metodo: z.enum(["efectivo", "transferencia", "cheque"]),
  referencia: z.string().optional(),
  notas: z.string().optional(),
})

type PagoDistribuidorFormData = z.infer<typeof pagoDistribuidorSchema>

interface CreatePagoDistribuidorModalProps {
  isOpen: boolean
  onClose: () => void
  distribuidorPreseleccionado?: string
}

const METODO_PAGO_OPTIONS = [
  { value: "efectivo", label: "Efectivo", icon: "💵" },
  { value: "transferencia", label: "Transferencia", icon: "📲" },
  { value: "cheque", label: "Cheque", icon: "📝" },
]

export default function CreatePagoDistribuidorModal({ 
  isOpen, 
  onClose,
  distribuidorPreseleccionado
}: CreatePagoDistribuidorModalProps) {
  const { toast } = useToast()
  const distribuidores = useAppStore((state) => state.distribuidores)
  const triggerDataRefresh = useAppStore((state) => state.triggerDataRefresh)
  
  // Hook para obtener bancos con saldo
  const { data: bancosData, loading: bancosLoading } = useBancosData()
  
  // Hook de negocio para registrar pago
  const { execute: registrarPago, loading: isSubmitting, error: submitError } = usePagoDistribuidor()

  const [step, setStep] = useState(1)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<PagoDistribuidorFormData>({
    resolver: zodResolver(pagoDistribuidorSchema),
    mode: "onChange",
    defaultValues: {
      distribuidorId: distribuidorPreseleccionado || "",
      bancoOrigen: "",
      monto: 0,
      metodo: "efectivo",
      referencia: "",
      notas: "",
    },
  })

  // Actualizar distribuidor preseleccionado
  useEffect(() => {
    if (distribuidorPreseleccionado) {
      setValue("distribuidorId", distribuidorPreseleccionado)
    }
  }, [distribuidorPreseleccionado, setValue])

  const watchedDistribuidorId = watch("distribuidorId")
  const watchedBancoOrigen = watch("bancoOrigen")
  const watchedMonto = watch("monto")
  const watchedMetodo = watch("metodo")

  // Distribuidor seleccionado
  const selectedDistribuidor = useMemo(() => {
    return distribuidores.find(d => d.id === watchedDistribuidorId) as Distribuidor | undefined
  }, [distribuidores, watchedDistribuidorId])

  // Banco seleccionado
  const selectedBanco = useMemo(() => {
    if (!bancosData || !watchedBancoOrigen) return null
    return bancosData.find(b => b.id === watchedBancoOrigen)
  }, [bancosData, watchedBancoOrigen])

  // Verificar si hay saldo suficiente
  const saldoSuficiente = useMemo(() => {
    if (!selectedBanco || !watchedMonto) return true
    return (selectedBanco.capitalActual || 0) >= watchedMonto
  }, [selectedBanco, watchedMonto])

  // Bancos filtrados (solo los que tienen saldo)
  const bancosDisponibles = useMemo(() => {
    if (!bancosData) return []
    return bancosData
      .filter(b => (b.capitalActual || 0) > 0)
      .sort((a, b) => (b.capitalActual || 0) - (a.capitalActual || 0))
  }, [bancosData])

  const onFormSubmit = async (data: PagoDistribuidorFormData) => {
    // Validar saldo suficiente
    if (!saldoSuficiente) {
      toast({
        title: "Error",
        description: "El banco seleccionado no tiene saldo suficiente",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await registrarPago({
        distribuidorId: data.distribuidorId,
        bancoOrigen: data.bancoOrigen as BancoId,
        monto: data.monto,
        metodo: data.metodo,
        referencia: data.referencia,
        notas: data.notas,
      })

      if (result.success) {
        toast({
          title: "✅ Pago Registrado",
          description: `Se registró el pago de $${data.monto.toLocaleString()} al distribuidor desde ${selectedBanco?.nombre || data.bancoOrigen}.`,
        })

        triggerDataRefresh()
        reset()
        setStep(1)
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo registrar el pago",
          variant: "destructive",
        })
      }
    } catch (error) {
      logger.error("Error en formulario de pago", error, { context: "CreatePagoDistribuidorModal" })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrar el pago",
        variant: "destructive",
      })
    }
  }

  const handleClose = useCallback(() => {
    reset()
    setStep(1)
    onClose()
  }, [reset, onClose])

  const canAdvanceStep1 = watchedDistribuidorId && watchedDistribuidorId.length > 0
  const canAdvanceStep2 = watchedMonto > 0 && watchedBancoOrigen.length > 0 && saldoSuficiente

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "max-w-2xl max-h-[85vh] p-0",
          "bg-black/95 border-white/10 backdrop-blur-2xl",
          "text-white overflow-hidden flex flex-col",
          "shadow-2xl shadow-red-500/10"
        )}
      >
        <DialogTitle className="sr-only">Registrar Pago a Distribuidor</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para registrar un pago a distribuidor (gasto)
        </DialogDescription>

        {/* Header */}
        <div className="relative p-6 sm:p-8 border-b border-white/10 bg-gradient-to-r from-red-900/30 via-orange-900/20 to-red-900/30">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5" />
          
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 hover:bg-white/10 rounded-xl transition-colors group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>

          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
                <Wallet className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Pago a Distribuidor</h2>
                <p className="text-gray-400 text-sm">Registrar pago/abono a un distribuidor</p>
              </div>
            </div>

            {/* Info box - GASTO */}
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-red-400 mt-0.5" />
                <p className="text-xs text-red-300">
                  <strong>Este es un GASTO.</strong> El dinero saldrá del banco seleccionado y se reducirá la deuda del distribuidor.
                </p>
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
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span className={step >= 1 ? "text-red-400" : ""}>Distribuidor</span>
              <span className={step >= 2 ? "text-red-400" : ""}>Pago</span>
              <span className={step >= 3 ? "text-red-400" : ""}>Confirmar</span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 sm:p-8 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {/* Step 1: Selección de distribuidor */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <Users className="w-4 h-4 mr-2 text-red-400" />
                    Seleccionar Distribuidor *
                  </label>
                  <select
                    {...register("distribuidorId")}
                    className={`w-full px-5 py-4 bg-white/5 border rounded-xl text-white text-lg focus:outline-none focus:ring-2 transition-all appearance-none ${
                      errors.distribuidorId 
                        ? "border-red-500/50 focus:ring-red-500" 
                        : "border-white/10 focus:ring-red-500 focus:border-transparent"
                    }`}
                  >
                    <option value="" className="bg-gray-900">Seleccionar distribuidor...</option>
                    {distribuidores
                      .filter(d => (d.deudaTotal || 0) > 0)
                      .sort((a, b) => (b.deudaTotal || 0) - (a.deudaTotal || 0))
                      .map((d) => (
                        <option key={d.id} value={d.id} className="bg-gray-900">
                          {d.nombre} - Deuda: ${(d.deudaTotal || 0).toLocaleString()}
                        </option>
                      ))}
                  </select>
                  {errors.distribuidorId && (
                    <p className="mt-2 text-sm text-red-400">{errors.distribuidorId.message}</p>
                  )}
                </div>

                {/* Info del distribuidor */}
                {selectedDistribuidor && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white font-medium">{selectedDistribuidor.nombre}</p>
                        <p className="text-sm text-gray-400">Distribuidor</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Deuda pendiente</p>
                        <p className="text-xl font-bold text-red-400">
                          ${(selectedDistribuidor.deudaTotal || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Total Pagado</p>
                        <p className="text-green-400 font-bold">
                          ${(selectedDistribuidor.totalPagado || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Órdenes Activas</p>
                        <p className="text-white font-bold">
                          {typeof selectedDistribuidor.ordenesActivas === 'number' 
                            ? selectedDistribuidor.ordenesActivas 
                            : Array.isArray(selectedDistribuidor.ordenesActivas) 
                              ? selectedDistribuidor.ordenesActivas.length 
                              : 0}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-end pt-4">
                  <motion.button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canAdvanceStep1}
                    whileHover={{ scale: canAdvanceStep1 ? 1.02 : 1 }}
                    whileTap={{ scale: canAdvanceStep1 ? 0.98 : 1 }}
                    className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/25"
                  >
                    Continuar →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Monto y banco origen */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Banco de origen */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <Building2 className="w-4 h-4 mr-2 text-red-400" />
                    Banco de Origen (de dónde sale el dinero) *
                  </label>
                  <select
                    {...register("bancoOrigen")}
                    className={`w-full px-5 py-4 bg-white/5 border rounded-xl text-white text-lg focus:outline-none focus:ring-2 transition-all appearance-none ${
                      errors.bancoOrigen 
                        ? "border-red-500/50 focus:ring-red-500" 
                        : "border-white/10 focus:ring-red-500 focus:border-transparent"
                    }`}
                  >
                    <option value="" className="bg-gray-900">Seleccionar banco...</option>
                    {bancosDisponibles.map((b) => (
                      <option key={b.id} value={b.id} className="bg-gray-900">
                        {b.nombre} - Saldo: ${(b.capitalActual || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {errors.bancoOrigen && (
                    <p className="mt-2 text-sm text-red-400">{errors.bancoOrigen.message}</p>
                  )}
                </div>

                {/* Info del banco seleccionado */}
                {selectedBanco && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Saldo disponible:</span>
                      <span className="text-lg font-bold text-white">
                        ${(selectedBanco.capitalActual || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Monto del pago */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <DollarSign className="w-4 h-4 mr-2 text-red-400" />
                    Monto del Pago *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register("monto", { valueAsNumber: true })}
                      className={`w-full pl-10 pr-5 py-4 bg-white/5 border rounded-xl text-white text-2xl font-bold focus:outline-none focus:ring-2 transition-all ${
                        errors.monto || !saldoSuficiente
                          ? "border-red-500/50 focus:ring-red-500" 
                          : "border-white/10 focus:ring-red-500 focus:border-transparent"
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.monto && (
                    <p className="mt-2 text-sm text-red-400">{errors.monto.message}</p>
                  )}
                  {!saldoSuficiente && watchedMonto > 0 && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Saldo insuficiente en el banco seleccionado
                    </p>
                  )}
                  
                  {/* Botones de monto rápido */}
                  {selectedDistribuidor && (selectedDistribuidor.deudaTotal || 0) > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setValue("monto", selectedDistribuidor.deudaTotal || 0)}
                        className="px-3 py-1.5 text-xs bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        Pago total (${(selectedDistribuidor.deudaTotal || 0).toLocaleString()})
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue("monto", Math.round((selectedDistribuidor.deudaTotal || 0) / 2))}
                        className="px-3 py-1.5 text-xs bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        50%
                      </button>
                    </div>
                  )}
                </div>

                {/* Método de pago */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <CreditCard className="w-4 h-4 mr-2 text-red-400" />
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {METODO_PAGO_OPTIONS.map((option) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => setValue("metodo", option.value as PagoDistribuidorFormData["metodo"])}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-3 rounded-xl border text-sm transition-all ${
                          watchedMetodo === option.value
                            ? "bg-red-500/20 border-red-500 text-white"
                            : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        <span className="mr-1">{option.icon}</span> {option.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

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
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/25"
                  >
                    Continuar →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirmación */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Preview card - GASTO */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <ArrowUpRight className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-white font-medium">{selectedDistribuidor?.nombre || "Distribuidor"}</p>
                        <p className="text-sm text-gray-400">Pago a distribuidor</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-400">
                        -${watchedMonto?.toLocaleString() || "0.00"}
                      </p>
                      <p className="text-xs text-gray-400">
                        Desde: {selectedBanco?.nombre || watchedBancoOrigen}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-red-300 bg-red-500/10 p-2 rounded-lg">
                    ⚠️ Este monto se descontará de {selectedBanco?.nombre}
                  </div>
                </div>

                {/* Referencia */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <FileText className="w-4 h-4 mr-2 text-red-400" />
                    Referencia
                  </label>
                  <input
                    type="text"
                    {...register("referencia")}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    placeholder="Número de referencia o comprobante"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <FileText className="w-4 h-4 mr-2 text-red-400" />
                    Notas
                  </label>
                  <textarea
                    {...register("notas")}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
                    rows={2}
                    placeholder="Notas adicionales..."
                  />
                </div>

                {/* Resumen de cambios */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-300">Resumen de Cambios</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-red-500/10">
                      <span className="text-gray-400">{selectedBanco?.nombre}:</span>
                      <span className="text-red-400 font-mono">
                        ${(selectedBanco?.capitalActual || 0).toLocaleString()} → ${((selectedBanco?.capitalActual || 0) - watchedMonto).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-green-500/10">
                      <span className="text-gray-400">Deuda {selectedDistribuidor?.nombre}:</span>
                      <span className="text-green-400 font-mono">
                        ${(selectedDistribuidor?.deudaTotal || 0).toLocaleString()} → ${Math.max(0, (selectedDistribuidor?.deudaTotal || 0) - watchedMonto).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sugerencia */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-orange-300 font-medium">Sugerencia</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {watchedMonto && selectedDistribuidor?.deudaTotal && watchedMonto >= (selectedDistribuidor.deudaTotal || 0)
                          ? "Este pago liquidará completamente la deuda con el distribuidor."
                          : "Guarda el comprobante de pago para tu registro contable."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error display */}
                {submitError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {submitError}
                  </div>
                )}

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
                    disabled={isSubmitting || !isValid || !saldoSuficiente}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/25"
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
                      "Registrar Pago ✓"
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
