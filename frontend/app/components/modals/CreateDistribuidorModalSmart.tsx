"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase,
  Sparkles,
  Mic,
  CheckCircle2,
  DollarSign,
  CreditCard
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { firestoreService } from "@/frontend/app/lib/firebase/firestore-service"
import { useToast } from "@/frontend/app/hooks/use-toast"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"
import { logger } from "@/frontend/app/lib/utils/logger"

// Schema de validación Zod
const distribuidorSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  empresa: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
  tipoProveedor: z.enum(["mayorista", "minorista", "fabricante", "importador", ""]).optional(),
  saldoInicial: z.number().min(0, "El saldo inicial no puede ser negativo").optional(),
  limiteCredito: z.number().min(0, "El límite de crédito no puede ser negativo").optional(),
})

type DistribuidorFormData = z.infer<typeof distribuidorSchema>

interface CreateDistribuidorModalSmartProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: DistribuidorFormData) => void
}

const TIPO_PROVEEDOR_OPTIONS = [
  { value: "mayorista", label: "Mayorista", icon: "📦" },
  { value: "minorista", label: "Minorista", icon: "🏪" },
  { value: "fabricante", label: "Fabricante", icon: "🏭" },
  { value: "importador", label: "Importador", icon: "🚢" },
]

export default function CreateDistribuidorModalSmart({ 
  isOpen, 
  onClose, 
  onSubmit 
}: CreateDistribuidorModalSmartProps) {
  const { toast } = useToast()
  const { triggerDataRefresh } = useAppStore()
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
  } = useForm<DistribuidorFormData>({
    resolver: zodResolver(distribuidorSchema),
    mode: "onChange",
    defaultValues: {
      nombre: "",
      empresa: "",
      telefono: "",
      email: "",
      direccion: "",
      tipoProveedor: "",
      saldoInicial: 0,
      limiteCredito: 0,
    },
  })

  const watchedNombre = watch("nombre")
  const watchedTipoProveedor = watch("tipoProveedor")

  const handleVoiceFill = useCallback(() => {
    setIsVoiceActive(true)
    toast({
      title: "Modo Voz Activado",
      description: "Próximamente: Dicta la información del distribuidor",
    })
    setTimeout(() => setIsVoiceActive(false), 2000)
  }, [toast])

  const onFormSubmit = async (data: DistribuidorFormData) => {
    setIsSubmitting(true)

    try {
      const distribuidorData = {
        nombre: data.nombre,
        empresa: data.empresa || "",
        telefono: data.telefono || "",
        email: data.email || "",
        direccion: data.direccion || "",
        saldoInicial: data.saldoInicial || 0,
        limiteCredito: data.limiteCredito || 0,
      }

      // Crear distribuidor en Firestore
      await firestoreService.crearDistribuidor(distribuidorData)

      // Trigger para actualizar hooks de datos
      triggerDataRefresh()

      if (onSubmit) {
        onSubmit(data)
      }

      toast({
        title: "✅ Distribuidor Creado",
        description: `El distribuidor "${data.nombre}" ha sido registrado exitosamente.`,
      })

      // Limpiar formulario y cerrar
      reset()
      setStep(1)
      onClose()
    } catch (error) {
      logger.error("Error creating distribuidor", error, { context: "CreateDistribuidorModalSmart" })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el distribuidor.",
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

  const canAdvanceStep1 = watchedNombre && watchedNombre.length >= 2
  const canAdvanceStep2 = true // Los campos del paso 2 son opcionales

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-black/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-purple-500/10 z-50"
          >
            {/* Header con gradiente premium */}
            <div className="relative p-6 sm:p-8 border-b border-white/10 bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-purple-900/30">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5" />
              
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
                    ? "bg-purple-500/30 text-purple-300" 
                    : "hover:bg-white/10 text-gray-400 hover:text-white"
                }`}
              >
                <Mic className="w-5 h-5" />
              </motion.button>

              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Building2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Nuevo Distribuidor</h2>
                    <p className="text-gray-400 text-sm">Registra un nuevo proveedor en el sistema</p>
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
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span className={step >= 1 ? "text-purple-400" : ""}>Información</span>
                  <span className={step >= 2 ? "text-purple-400" : ""}>Contacto</span>
                  <span className={step >= 3 ? "text-purple-400" : ""}>Crédito</span>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {/* Step 1: Información básica */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Nombre del Distribuidor */}
                      <div className="sm:col-span-2">
                        <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                          <User className="w-4 h-4 mr-2 text-purple-400" />
                          Nombre del Distribuidor *
                        </label>
                        <input
                          type="text"
                          {...register("nombre")}
                          className={`w-full px-5 py-4 bg-white/5 border rounded-xl text-white text-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.nombre 
                              ? "border-red-500/50 focus:ring-red-500" 
                              : "border-white/10 focus:ring-purple-500 focus:border-transparent"
                          }`}
                          placeholder="Ej: MONTE SUPPLY"
                        />
                        {errors.nombre && (
                          <p className="mt-2 text-sm text-red-400">{errors.nombre.message}</p>
                        )}
                      </div>

                      {/* Empresa */}
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                          <Building2 className="w-4 h-4 mr-2 text-purple-400" />
                          Empresa
                        </label>
                        <input
                          type="text"
                          {...register("empresa")}
                          className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Razón social"
                        />
                      </div>

                      {/* Tipo de Proveedor */}
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                          <Briefcase className="w-4 h-4 mr-2 text-purple-400" />
                          Tipo de Proveedor
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {TIPO_PROVEEDOR_OPTIONS.map((option) => (
                            <motion.button
                              key={option.value}
                              type="button"
                              onClick={() => setValue("tipoProveedor", option.value as DistribuidorFormData["tipoProveedor"])}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`p-3 rounded-xl border text-sm transition-all ${
                                watchedTipoProveedor === option.value
                                  ? "bg-purple-500/20 border-purple-500 text-white"
                                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                              }`}
                            >
                              <span className="mr-1">{option.icon}</span> {option.label}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-end pt-4">
                      <motion.button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!canAdvanceStep1}
                        whileHover={{ scale: canAdvanceStep1 ? 1.02 : 1 }}
                        whileTap={{ scale: canAdvanceStep1 ? 0.98 : 1 }}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25"
                      >
                        Continuar →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Información de contacto */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Teléfono */}
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                          <Phone className="w-4 h-4 mr-2 text-purple-400" />
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          {...register("telefono")}
                          className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="+52 ..."
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                          <Mail className="w-4 h-4 mr-2 text-purple-400" />
                          Email
                        </label>
                        <input
                          type="email"
                          {...register("email")}
                          className={`w-full px-5 py-4 bg-white/5 border rounded-xl text-white text-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.email 
                              ? "border-red-500/50 focus:ring-red-500" 
                              : "border-white/10 focus:ring-purple-500 focus:border-transparent"
                          }`}
                          placeholder="email@ejemplo.com"
                        />
                        {errors.email && (
                          <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
                        )}
                      </div>

                      {/* Dirección */}
                      <div className="sm:col-span-2">
                        <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                          <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                          Dirección
                        </label>
                        <textarea
                          {...register("direccion")}
                          className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                          placeholder="Dirección completa (opcional)"
                          rows={3}
                        />
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
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25"
                      >
                        Continuar →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Información de crédito */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Preview card */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-white font-medium">{watchedNombre || "Distribuidor"}</p>
                          <p className="text-sm text-gray-400">
                            {watchedTipoProveedor 
                              ? TIPO_PROVEEDOR_OPTIONS.find(o => o.value === watchedTipoProveedor)?.label 
                              : "Sin tipo especificado"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Saldo Inicial */}
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                          <DollarSign className="w-4 h-4 mr-2 text-purple-400" />
                          Saldo Inicial
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            {...register("saldoInicial", { valueAsNumber: true })}
                            className="w-full pl-8 pr-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Deuda inicial si existe</p>
                      </div>

                      {/* Límite de Crédito */}
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                          <CreditCard className="w-4 h-4 mr-2 text-purple-400" />
                          Límite de Crédito
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            {...register("limiteCredito", { valueAsNumber: true })}
                            className="w-full pl-8 pr-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Máximo crédito permitido</p>
                      </div>
                    </div>

                    {/* AI Suggestion */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-300 font-medium">Sugerencia IA</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Para distribuidores nuevos, recomendamos comenzar con un límite de crédito 
                            conservador y ajustarlo según el historial de pagos.
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
                        className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Creando...
                          </span>
                        ) : (
                          "Crear Distribuidor ✓"
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
