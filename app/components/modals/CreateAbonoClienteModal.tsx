/**
 * ====================================================================
 * MODAL PARA REGISTRAR ABONO DE CLIENTE - LÓGICA CORREGIDA
 * ====================================================================
 * 
 * Este modal maneja EXCLUSIVAMENTE abonos de clientes.
 * Los abonos de clientes son pagos que el cliente nos hace.
 * El dinero se DISTRIBUYE proporcionalmente a los 3 bancos de venta.
 * 
 * FLUJO CORRECTO:
 * 1. Cliente selecciona monto a abonar
 * 2. Se calcula distribución proporcional a bóveda monte, fletes, utilidades
 * 3. Se actualiza el perfil del cliente:
 *    - cliente.abonos += monto
 *    - cliente.pendiente = cliente.deuda - cliente.abonos
 *    - cliente.estadoPago se actualiza
 * 4. Se registra en gastos_abonos como tipo 'abono'
 * 5. Se registra movimiento en cada banco
 * 
 * @author Chronos System
 * @version 2.0
 */

'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  User, 
  DollarSign, 
  CreditCard,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Banknote,
  Building2,
  Calculator,
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
import { useToast } from '@/app/hooks/use-toast'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'
import { useRegistrarAbonoCliente, useEstadoPago } from '@/app/hooks/useBusinessOperations'
import type { Cliente } from '@/app/types'

// Schema de validación
const abonoClienteSchema = z.object({
  clienteId: z.string().min(1, 'Selecciona un cliente'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  metodo: z.enum(['efectivo', 'transferencia', 'cheque']),
  referencia: z.string().optional(),
  notas: z.string().optional(),
})

type AbonoClienteFormData = z.infer<typeof abonoClienteSchema>

interface CreateAbonoClienteModalProps {
  isOpen: boolean
  onClose: () => void
  clientePreseleccionado?: string
}

const METODO_PAGO_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'transferencia', label: 'Transferencia', icon: '📲' },
  { value: 'cheque', label: 'Cheque', icon: '📝' },
]

// Nombres legibles de bancos
const BANCO_NOMBRES: Record<string, string> = {
  'boveda_monte': 'Bóveda Monte',
  'flete_sur': 'Fletes Sur',
  'utilidades': 'Utilidades',
}

export default function CreateAbonoClienteModal({ 
  isOpen, 
  onClose,
  clientePreseleccionado,
}: CreateAbonoClienteModalProps) {
  const { toast } = useToast()
  const clientes = useAppStore((state) => state.clientes)
  const triggerDataRefresh = useAppStore((state) => state.triggerDataRefresh)
  
  // Hook de negocio para registrar abono
  const { execute: registrarAbono, loading: isSubmitting, error: submitError } = useRegistrarAbonoCliente()
  const { calcular: calcularEstado, getColorEstado, getIconEstado } = useEstadoPago()

  const [step, setStep] = useState(1)
  const [previewDistribucion, setPreviewDistribucion] = useState<{
    bovedaMonte: number
    fletes: number
    utilidades: number
  } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<AbonoClienteFormData>({
    resolver: zodResolver(abonoClienteSchema),
    mode: 'onChange',
    defaultValues: {
      clienteId: clientePreseleccionado || '',
      monto: 0,
      metodo: 'efectivo',
      referencia: '',
      notas: '',
    },
  })

  // Actualizar cliente preseleccionado cuando cambie
  useEffect(() => {
    if (clientePreseleccionado) {
      setValue('clienteId', clientePreseleccionado)
    }
  }, [clientePreseleccionado, setValue])

  const watchedClienteId = watch('clienteId')
  const watchedMonto = watch('monto')
  const watchedMetodo = watch('metodo')

  // Cliente seleccionado con datos completos
  const selectedCliente = useMemo(() => {
    return clientes.find(c => c.id === watchedClienteId) as Cliente | undefined
  }, [clientes, watchedClienteId])

  // Calcular preview de distribución cuando cambia el monto
  useEffect(() => {
    if (watchedMonto > 0 && selectedCliente) {
      // La distribución proporcional se hace en el backend
      // Aquí mostramos un estimado basado en la proporción típica 60/20/20
      // (esto es solo para visualización, el cálculo real está en business-logic.service)
      const deudaTotal = selectedCliente.deudaTotal || selectedCliente.pendiente || 0
      
      if (deudaTotal > 0) {
        // Simular distribución proporcional
        // En realidad, el servicio calcula esto basado en las ventas del cliente
        setPreviewDistribucion({
          bovedaMonte: watchedMonto * 0.5, // ~50% a costo
          fletes: watchedMonto * 0.15,     // ~15% a fletes
          utilidades: watchedMonto * 0.35, // ~35% a utilidad
        })
      }
    } else {
      setPreviewDistribucion(null)
    }
  }, [watchedMonto, selectedCliente])

  // Estado de pago calculado
  const estadoPagoActual = useMemo(() => {
    if (!selectedCliente) return null
    const deuda = selectedCliente.deudaTotal || selectedCliente.pendiente || 0
    const pagado = selectedCliente.totalPagado || selectedCliente.abonos || 0
    return calcularEstado(pagado, deuda + pagado)
  }, [selectedCliente, calcularEstado])

  // Estado de pago después del abono
  const estadoPagoDespues = useMemo(() => {
    if (!selectedCliente || !watchedMonto) return null
    const deuda = selectedCliente.deudaTotal || selectedCliente.pendiente || 0
    const pagado = (selectedCliente.totalPagado || selectedCliente.abonos || 0) + watchedMonto
    return calcularEstado(pagado, deuda + (selectedCliente.totalPagado || selectedCliente.abonos || 0))
  }, [selectedCliente, watchedMonto, calcularEstado])

  const onFormSubmit = async (data: AbonoClienteFormData) => {
    try {
      const result = await registrarAbono({
        clienteId: data.clienteId,
        monto: data.monto,
        metodo: data.metodo,
        referencia: data.referencia,
        notas: data.notas,
      })

      if (result.success) {
        toast({
          title: '✅ Abono Registrado',
          description: `Se registró el abono de $${data.monto.toLocaleString()} y se distribuyó a los bancos.`,
        })

        triggerDataRefresh()
        reset()
        setStep(1)
        onClose()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo registrar el abono',
          variant: 'destructive',
        })
      }
    } catch (error) {
      logger.error('Error en formulario de abono', error, { context: 'CreateAbonoClienteModal' })
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al registrar el abono',
        variant: 'destructive',
      })
    }
  }

  const handleClose = useCallback(() => {
    reset()
    setStep(1)
    setPreviewDistribucion(null)
    onClose()
  }, [reset, onClose])

  const canAdvanceStep1 = watchedClienteId && watchedClienteId.length > 0
  const canAdvanceStep2 = watchedMonto > 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          'max-w-2xl max-h-[85vh] p-0',
          'bg-black/95 border-white/10 backdrop-blur-2xl',
          'text-white overflow-hidden flex flex-col',
          'shadow-2xl shadow-green-500/10',
        )}
      >
        <DialogTitle className="sr-only">Registrar Abono de Cliente</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para registrar un pago/abono de cliente
        </DialogDescription>

        {/* Header */}
        <div className="relative p-6 sm:p-8 border-b border-white/10 bg-gradient-to-r from-green-900/30 via-emerald-900/20 to-green-900/30">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5" />
          
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 hover:bg-white/10 rounded-xl transition-colors group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>

          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <Banknote className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Abono de Cliente</h2>
                <p className="text-gray-400 text-sm">Registra un pago recibido de cliente</p>
              </div>
            </div>

            {/* Info box sobre distribución */}
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-400 mt-0.5" />
                <p className="text-xs text-green-300">
                  El abono se distribuirá automáticamente a Bóveda Monte, Fletes y Utilidades según la proporción de las ventas.
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex gap-2 mt-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: step >= s ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span className={step >= 1 ? 'text-green-400' : ''}>Cliente</span>
              <span className={step >= 2 ? 'text-green-400' : ''}>Monto</span>
              <span className={step >= 3 ? 'text-green-400' : ''}>Confirmar</span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 sm:p-8 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {/* Step 1: Selección de cliente */}
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
                    <User className="w-4 h-4 mr-2 text-green-400" />
                    Seleccionar Cliente *
                  </label>
                  <select
                    {...register('clienteId')}
                    className={`w-full px-5 py-4 bg-white/5 border rounded-xl text-white text-lg focus:outline-none focus:ring-2 transition-all appearance-none ${
                      errors.clienteId 
                        ? 'border-red-500/50 focus:ring-red-500' 
                        : 'border-white/10 focus:ring-green-500 focus:border-transparent'
                    }`}
                  >
                    <option value="" className="bg-gray-900">Seleccionar cliente...</option>
                    {clientes
                      .filter(c => (c.deudaTotal || c.pendiente || 0) > 0)
                      .sort((a, b) => (b.deudaTotal || b.pendiente || 0) - (a.deudaTotal || a.pendiente || 0))
                      .map((c) => (
                        <option key={c.id} value={c.id} className="bg-gray-900">
                          {c.nombre} - Pendiente: ${(c.deudaTotal || c.pendiente || 0).toLocaleString()}
                        </option>
                      ))}
                  </select>
                  {errors.clienteId && (
                    <p className="mt-2 text-sm text-red-400">{errors.clienteId.message}</p>
                  )}
                </div>

                {/* Info del cliente seleccionado */}
                {selectedCliente && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white font-medium">{selectedCliente.nombre}</p>
                        <p className="text-sm text-gray-400">Cliente</p>
                      </div>
                      {estadoPagoActual && (
                        <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getColorEstado(estadoPagoActual.estado))}>
                          {getIconEstado(estadoPagoActual.estado)} {estadoPagoActual.estado.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Total Ventas</p>
                        <p className="text-white font-bold">
                          ${(selectedCliente.totalVentas || selectedCliente.deuda || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Pagado</p>
                        <p className="text-green-400 font-bold">
                          ${(selectedCliente.totalPagado || selectedCliente.abonos || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Pendiente</p>
                        <p className="text-red-400 font-bold">
                          ${(selectedCliente.deudaTotal || selectedCliente.pendiente || 0).toLocaleString()}
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
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/25"
                  >
                    Continuar →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Monto y método */}
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
                    <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                    Monto del Abono *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('monto', { valueAsNumber: true })}
                      className={`w-full pl-10 pr-5 py-4 bg-white/5 border rounded-xl text-white text-2xl font-bold focus:outline-none focus:ring-2 transition-all ${
                        errors.monto 
                          ? 'border-red-500/50 focus:ring-red-500' 
                          : 'border-white/10 focus:ring-green-500 focus:border-transparent'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.monto && (
                    <p className="mt-2 text-sm text-red-400">{errors.monto.message}</p>
                  )}
                  
                  {/* Botones de monto rápido */}
                  {selectedCliente && (selectedCliente.deudaTotal || selectedCliente.pendiente || 0) > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setValue('monto', selectedCliente.deudaTotal || selectedCliente.pendiente || 0)}
                        className="px-3 py-1.5 text-xs bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors"
                      >
                        Pago total (${(selectedCliente.deudaTotal || selectedCliente.pendiente || 0).toLocaleString()})
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue('monto', Math.round((selectedCliente.deudaTotal || selectedCliente.pendiente || 0) / 2))}
                        className="px-3 py-1.5 text-xs bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue('monto', Math.round((selectedCliente.deudaTotal || selectedCliente.pendiente || 0) / 4))}
                        className="px-3 py-1.5 text-xs bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        25%
                      </button>
                    </div>
                  )}
                </div>

                {/* Preview de distribución */}
                {previewDistribucion && watchedMonto > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-gray-300">Distribución Estimada</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <p className="text-orange-300 text-xs">Bóveda Monte</p>
                        <p className="text-white font-bold">${previewDistribucion.bovedaMonte.toLocaleString()}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-yellow-300 text-xs">Fletes</p>
                        <p className="text-white font-bold">${previewDistribucion.fletes.toLocaleString()}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-green-300 text-xs">Utilidades</p>
                        <p className="text-white font-bold">${previewDistribucion.utilidades.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      * La distribución real se calcula según las ventas del cliente
                    </p>
                  </motion.div>
                )}

                {/* Método de pago */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <CreditCard className="w-4 h-4 mr-2 text-green-400" />
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {METODO_PAGO_OPTIONS.map((option) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => setValue('metodo', option.value as AbonoClienteFormData['metodo'])}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-3 rounded-xl border text-sm transition-all ${
                          watchedMetodo === option.value
                            ? 'bg-green-500/20 border-green-500 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
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
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/25"
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
                {/* Preview card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-white font-medium">{selectedCliente?.nombre || 'Cliente'}</p>
                        <p className="text-sm text-gray-400">Abono de cliente</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">
                        +${watchedMonto?.toLocaleString() || '0.00'}
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
                    <FileText className="w-4 h-4 mr-2 text-green-400" />
                    Referencia
                  </label>
                  <input
                    type="text"
                    {...register('referencia')}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="Número de referencia o comprobante"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <FileText className="w-4 h-4 mr-2 text-green-400" />
                    Notas
                  </label>
                  <textarea
                    {...register('notas')}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
                    rows={2}
                    placeholder="Notas adicionales..."
                  />
                </div>

                {/* Resumen antes/después */}
                {selectedCliente && estadoPagoActual && estadoPagoDespues && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-300">Cambio en Estado</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Antes</p>
                        <p className="text-lg font-bold text-red-400">
                          ${estadoPagoActual.montoPendiente.toLocaleString()} pendiente
                        </p>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', getColorEstado(estadoPagoActual.estado))}>
                          {estadoPagoActual.estado}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Después</p>
                        <p className={cn('text-lg font-bold', estadoPagoDespues.montoPendiente <= 0 ? 'text-green-400' : 'text-yellow-400')}>
                          ${Math.max(0, estadoPagoDespues.montoPendiente).toLocaleString()} pendiente
                        </p>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', getColorEstado(estadoPagoDespues.estado))}>
                          {estadoPagoDespues.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info de distribución */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-300 font-medium">Distribución Automática</p>
                      <p className="text-xs text-gray-400 mt-1">
                        El abono se distribuirá automáticamente a los 3 bancos de ventas 
                        (Bóveda Monte, Fletes, Utilidades) según la proporción de las ventas originales.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sugerencia IA */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-emerald-300 font-medium">Sugerencia IA</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {watchedMonto && selectedCliente?.deudaTotal && watchedMonto >= (selectedCliente.deudaTotal || selectedCliente.pendiente || 0)
                          ? '¡Excelente! Este abono liquidará la deuda completa del cliente.'
                          : 'Registra el comprobante de pago para mejor trazabilidad contable.'}
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
                    disabled={isSubmitting || !isValid}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/25"
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
                      'Registrar Abono ✓'
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
