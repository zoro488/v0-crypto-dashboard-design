'use client'

import type React from 'react'
import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Receipt, 
  DollarSign, 
  Building2, 
  FileText,
  Sparkles,
  Mic,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog'
import { cn } from '@/app/lib/utils'
import { firestoreService } from '@/app/lib/firebase/firestore-service'
import { useToast } from '@/app/hooks/use-toast'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'

// Schema de validación Zod
const gastoSchema = z.object({
  bancoId: z.string().min(1, 'Selecciona un banco'),
  concepto: z.string().min(2, 'El concepto es requerido'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  descripcion: z.string().optional(),
  categoria: z.string().optional(),
})

type GastoFormData = z.infer<typeof gastoSchema>

interface CreateGastoModalSmartProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: GastoFormData) => void
}

const CATEGORIA_OPTIONS = [
  { value: 'operativo', label: 'Operativo', icon: '⚙️' },
  { value: 'nomina', label: 'Nómina', icon: '👥' },
  { value: 'servicios', label: 'Servicios', icon: '💡' },
  { value: 'insumos', label: 'Insumos', icon: '📦' },
  { value: 'transporte', label: 'Transporte', icon: '🚚' },
  { value: 'otros', label: 'Otros', icon: '📋' },
]

export default function CreateGastoModalSmart({ 
  isOpen, 
  onClose, 
  onSubmit, 
}: CreateGastoModalSmartProps) {
  const { toast } = useToast()
  const bancos = useAppStore((state) => state.bancos)
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
  } = useForm<GastoFormData>({
    resolver: zodResolver(gastoSchema),
    mode: 'onChange',
    defaultValues: {
      bancoId: '',
      concepto: '',
      monto: 0,
      descripcion: '',
      categoria: '',
    },
  })

  const watchedBancoId = watch('bancoId')
  const watchedMonto = watch('monto')
  const watchedConcepto = watch('concepto')
  const watchedCategoria = watch('categoria')

  // Obtener banco seleccionado
  const selectedBanco = useMemo(() => {
    return bancos.find(b => b.id === watchedBancoId)
  }, [bancos, watchedBancoId])

  // Validar si hay saldo suficiente
  const hasSufficientFunds = useMemo(() => {
    if (!selectedBanco || !watchedMonto) return true
    return (selectedBanco.saldo ?? 0) >= watchedMonto
  }, [selectedBanco, watchedMonto])

  const handleVoiceFill = useCallback(() => {
    setIsVoiceActive(true)
    toast({
      title: 'Modo Voz Activado',
      description: 'Próximamente: Dicta la información del gasto',
    })
    setTimeout(() => setIsVoiceActive(false), 2000)
  }, [toast])

  const onFormSubmit = async (data: GastoFormData) => {
    if (!hasSufficientFunds) {
      toast({
        title: 'Saldo Insuficiente',
        description: 'El banco seleccionado no tiene suficiente saldo para este gasto.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await firestoreService.crearGasto({
        monto: data.monto,
        concepto: data.concepto,
        bancoOrigen: data.bancoId,
        notas: data.descripcion || '',
      })

      // Trigger para actualizar hooks de datos
      triggerDataRefresh()

      if (onSubmit) {
        onSubmit(data)
      }

      toast({
        title: '✅ Gasto Registrado',
        description: `Se ha registrado el gasto de $${data.monto.toLocaleString()} correctamente.`,
      })

      // Limpiar formulario y cerrar
      reset()
      setStep(1)
      onClose()
    } catch (error) {
      logger.error('Error creating gasto', error, { context: 'CreateGastoModalSmart' })
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al registrar el gasto.',
        variant: 'destructive',
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

  const canAdvanceStep1 = watchedBancoId && watchedBancoId.length > 0
  const canAdvanceStep2 = watchedConcepto && watchedConcepto.length >= 2 && watchedMonto > 0 && hasSufficientFunds

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          'max-w-2xl max-h-[85vh] p-0',
          'bg-black/95 border-white/10 backdrop-blur-2xl',
          'text-white overflow-hidden flex flex-col',
          'shadow-2xl shadow-red-500/10',
        )}
      >
        <DialogTitle className="sr-only">Registrar Gasto</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para registrar un nuevo gasto
        </DialogDescription>
            {/* Header con gradiente premium */}
            <div className="relative p-6 sm:p-8 border-b border-white/10 bg-gradient-to-r from-red-900/30 via-orange-900/20 to-red-900/30">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5" />
              
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
                    ? 'bg-red-500/30 text-red-300' 
                    : 'hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <Mic className="w-5 h-5" />
              </motion.button>

              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
                    <Receipt className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Registrar Gasto</h2>
                    <p className="text-gray-400 text-sm">Registra un egreso desde un banco</p>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="flex gap-2 mt-6">
                  {[1, 2].map((s) => (
                    <div key={s} className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: step >= s ? '100%' : '0%' }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span className={step >= 1 ? 'text-red-400' : ''}>Banco</span>
                  <span className={step >= 2 ? 'text-red-400' : ''}>Detalles</span>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {/* Step 1: Selección de banco */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Selección de banco */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <Building2 className="w-4 h-4 mr-2 text-red-400" />
                        Banco Origen *
                      </label>
                      <select
                        {...register('bancoId')}
                        className={`w-full px-5 py-4 bg-white/5 border rounded-xl text-white text-lg focus:outline-none focus:ring-2 transition-all appearance-none ${
                          errors.bancoId 
                            ? 'border-red-500/50 focus:ring-red-500' 
                            : 'border-white/10 focus:ring-red-500 focus:border-transparent'
                        }`}
                      >
                        <option value="" className="bg-gray-900">Seleccionar banco...</option>
                        {bancos.map((banco) => (
                          <option key={banco.id} value={banco.id} className="bg-gray-900">
                            {banco.nombre} - ${(banco.saldo ?? 0).toLocaleString()}
                          </option>
                        ))}
                      </select>
                      {errors.bancoId && (
                        <p className="mt-2 text-sm text-red-400">{errors.bancoId.message}</p>
                      )}
                    </div>

                    {/* Info de banco seleccionado */}
                    {selectedBanco && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{selectedBanco.nombre}</p>
                            <p className="text-sm text-gray-400">Capital disponible</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">
                              ${(selectedBanco.saldo ?? 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Categoría */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <Receipt className="w-4 h-4 mr-2 text-red-400" />
                        Categoría (opcional)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORIA_OPTIONS.map((option) => (
                          <motion.button
                            key={option.value}
                            type="button"
                            onClick={() => setValue('categoria', option.value)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-3 rounded-xl border text-xs transition-all ${
                              watchedCategoria === option.value
                                ? 'bg-red-500/20 border-red-500 text-white'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                            }`}
                          >
                            <span className="mr-1">{option.icon}</span> {option.label}
                          </motion.button>
                        ))}
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
                        className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/25"
                      >
                        Continuar →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Detalles del gasto */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Info del banco */}
                    {selectedBanco && (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-red-400" />
                          <span className="text-white font-medium">{selectedBanco.nombre}</span>
                        </div>
                        <span className="text-gray-400">
                          Disponible: ${(selectedBanco.saldo ?? 0).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Concepto */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <FileText className="w-4 h-4 mr-2 text-red-400" />
                        Concepto *
                      </label>
                      <input
                        type="text"
                        {...register('concepto')}
                        className={`w-full px-5 py-4 bg-white/5 border rounded-xl text-white text-lg focus:outline-none focus:ring-2 transition-all ${
                          errors.concepto 
                            ? 'border-red-500/50 focus:ring-red-500' 
                            : 'border-white/10 focus:ring-red-500 focus:border-transparent'
                        }`}
                        placeholder="Ej: Pago de servicios"
                      />
                      {errors.concepto && (
                        <p className="mt-2 text-sm text-red-400">{errors.concepto.message}</p>
                      )}
                    </div>

                    {/* Monto */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <DollarSign className="w-4 h-4 mr-2 text-red-400" />
                        Monto *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                        <input
                          type="number"
                          step="0.01"
                          {...register('monto', { valueAsNumber: true })}
                          className={`w-full pl-10 pr-5 py-4 bg-white/5 border rounded-xl text-white text-2xl font-bold focus:outline-none focus:ring-2 transition-all ${
                            errors.monto || !hasSufficientFunds
                              ? 'border-red-500/50 focus:ring-red-500' 
                              : 'border-white/10 focus:ring-red-500 focus:border-transparent'
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
                            Capital insuficiente. Disponible: ${(selectedBanco?.saldo ?? 0).toLocaleString()}
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        <FileText className="w-4 h-4 mr-2 text-red-400" />
                        Descripción (Opcional)
                      </label>
                      <textarea
                        {...register('descripcion')}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                        rows={3}
                        placeholder="Detalles adicionales..."
                      />
                    </div>

                    {/* Resumen del impacto */}
                    {selectedBanco && watchedMonto > 0 && hasSufficientFunds && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingDown className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-medium text-gray-300">Impacto en el Capital</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Capital actual:</span>
                            <span className="text-white">${(selectedBanco.saldo ?? 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Gasto:</span>
                            <span className="text-red-400">-${watchedMonto?.toLocaleString() || '0.00'}</span>
                          </div>
                          <div className="border-t border-white/10 pt-2 flex justify-between font-medium">
                            <span className="text-gray-300">Nuevo capital:</span>
                            <span className="text-white">
                              ${((selectedBanco.saldo ?? 0) - (watchedMonto || 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Suggestion */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-yellow-300 font-medium">Sugerencia IA</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {watchedCategoria 
                              ? `Los gastos de tipo "${CATEGORIA_OPTIONS.find(c => c.value === watchedCategoria)?.label}" suelen ser recurrentes. Considera programar alertas.`
                              : 'Categorizar tus gastos te ayudará a obtener mejores reportes de análisis financiero.'}
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
                        className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/25"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Registrando...
                          </span>
                        ) : (
                          'Registrar Gasto ✓'
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
