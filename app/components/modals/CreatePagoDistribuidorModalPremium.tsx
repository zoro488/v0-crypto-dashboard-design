'use client'

/**
 * 💎 CREATE PAGO DISTRIBUIDOR MODAL PREMIUM - Pagos a Proveedores
 * 
 * Form ultra-premium para registrar pagos a distribuidores:
 * 1. Selección de distribuidor con deuda pendiente
 * 2. Selección de OC relacionadas
 * 3. Banco de origen para el pago
 * 4. Reducción automática de deuda
 * 5. Validación con Zod
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import { Textarea } from '@/app/components/ui/textarea'
import {
  Truck,
  Building2,
  DollarSign,
  Calendar,
  Receipt,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Package,
  Zap,
  CreditCard,
  Banknote,
  FileText,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useToast } from '@/app/hooks/use-toast'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'
import { formatearMonto } from '@/app/lib/validations/smart-forms-schemas'
// ✅ USAR NUEVO SERVICIO DE BUSINESS OPERATIONS
import { pagarDistribuidor, type PagarDistribuidorInput as BizPagarDistInput } from '@/app/lib/services/business-operations.service'
import { useDistribuidores, useBancosData, useOrdenesCompra } from '@/app/lib/firebase/firestore-hooks.service'
import type { BancoId } from '@/app/types'

// ============================================
// SCHEMA ZOD
// ============================================

const pagoDistribuidorSchema = z.object({
  distribuidorId: z.string().min(1, 'Selecciona un distribuidor'),
  distribuidorNombre: z.string(),
  monto: z.number().min(1, 'El monto debe ser mayor a 0'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  bancoOrigen: z.enum([
    'boveda_monte', 'boveda_usa', 'profit', 'leftie', 
    'azteca', 'flete_sur', 'utilidades',
  ]),
  metodoPago: z.enum(['efectivo', 'transferencia']),
  ordenesRelacionadas: z.array(z.string()).optional(),
  referencia: z.string().optional(),
  concepto: z.string().optional(),
})

type PagoDistribuidorInput = z.infer<typeof pagoDistribuidorSchema>

// ============================================
// TIPOS Y CONSTANTES
// ============================================

interface CreatePagoDistribuidorModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  preselectedDistribuidor?: {
    id: string
    nombre: string
    deudaTotal: number
    ordenesAbiertas: number
  }
}

// Interfaz para distribuidores de Firestore
interface DistribuidorFirestore {
  id: string
  nombre: string
  deudaTotal?: number
  deudaActual?: number
  totalCompras?: number
  totalPagado?: number
  [key: string]: unknown
}

// Interfaz para órdenes de compra
interface OrdenCompraFirestore {
  id: string
  distribuidor?: string
  origen?: string
  estado?: 'pendiente' | 'parcial' | 'pagado'
  deuda?: number
  [key: string]: unknown
}

// Interfaz para bancos de Firestore
interface BancoFirestore {
  id: string
  nombre: string
  capitalActual?: number
  historicoIngresos?: number
  historicoGastos?: number
  [key: string]: unknown
}

// Iconos por defecto para distribuidores
const DIST_ICONOS: Record<string, string> = {
  'Q-MAYA': '🌴',
  'PACMAN': '🎮',
  'CH-MONTE': '⛰️',
  'VALLE-MONTE': '🏔️',
  'A/X': '🦀',
  'Q-MAYA-MP': '🌴',
}

// Iconos por defecto para bancos
const BANCO_ICONOS: Record<string, string> = {
  'boveda_monte': '🏦',
  'boveda_usa': '🇺🇸',
  'profit': '💰',
  'leftie': '🎯',
  'azteca': '🌮',
  'flete_sur': '🚚',
  'utilidades': '💎',
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { staggerChildren: 0.03 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CreatePagoDistribuidorModalPremium({ 
  open, 
  onClose, 
  onSuccess,
  preselectedDistribuidor, 
}: CreatePagoDistribuidorModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  // 🔥 Cargar distribuidores, bancos y órdenes de compra reales de Firestore
  const { data: distribuidoresRaw, loading: loadingDist } = useDistribuidores()
  const { data: bancosRaw, loading: loadingBancos } = useBancosData()
  const { data: ordenesCompraRaw } = useOrdenesCompra()
  
  // Contar órdenes abiertas por distribuidor
  const ordenesAbiertasPorDistribuidor = React.useMemo(() => {
    if (!ordenesCompraRaw) return new Map<string, number>()
    
    const contador = new Map<string, number>()
    ;(ordenesCompraRaw as OrdenCompraFirestore[]).forEach(orden => {
      const distribuidorId = orden.distribuidor || orden.origen || ''
      if (orden.estado !== 'pagado' && (orden.deuda ?? 0) > 0) {
        contador.set(distribuidorId, (contador.get(distribuidorId) || 0) + 1)
      }
    })
    return contador
  }, [ordenesCompraRaw])
  
  // Convertir distribuidores de Firestore al formato esperado
  const distribuidoresFormateados = React.useMemo(() => {
    if (!distribuidoresRaw) return []
    return (distribuidoresRaw as DistribuidorFirestore[]).map(d => ({
      id: d.id,
      nombre: d.nombre || d.id,
      icono: DIST_ICONOS[d.id] || '📦',
      deudaTotal: d.deudaTotal ?? d.deudaActual ?? ((d.totalCompras ?? 0) - (d.totalPagado ?? 0)),
      ordenesAbiertas: ordenesAbiertasPorDistribuidor.get(d.id) || ordenesAbiertasPorDistribuidor.get(d.nombre) || 0,
    }))
  }, [distribuidoresRaw, ordenesAbiertasPorDistribuidor])
  
  // Convertir bancos de Firestore al formato esperado
  const bancosFormateados = React.useMemo(() => {
    if (!bancosRaw) return []
    return (bancosRaw as BancoFirestore[]).map(b => ({
      id: b.id,
      nombre: b.nombre || b.id,
      icono: BANCO_ICONOS[b.id] || '🏦',
      capital: b.capitalActual ?? ((b.historicoIngresos ?? 0) - (b.historicoGastos ?? 0)),
    }))
  }, [bancosRaw])
  
  // Distribuidores con deuda
  const distribuidoresConDeuda = React.useMemo(() => {
    return distribuidoresFormateados.filter(d => d.deudaTotal > 0)
  }, [distribuidoresFormateados])
  
  const [selectedDistribuidor, setSelectedDistribuidor] = React.useState<typeof distribuidoresFormateados[0] | null>(
    preselectedDistribuidor ? {
      ...preselectedDistribuidor,
      icono: DIST_ICONOS[preselectedDistribuidor.id] || '📦',
    } : null,
  )

  const form = useForm<PagoDistribuidorInput>({
    resolver: zodResolver(pagoDistribuidorSchema),
    defaultValues: {
      distribuidorId: preselectedDistribuidor?.id || '',
      distribuidorNombre: preselectedDistribuidor?.nombre || '',
      monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      bancoOrigen: 'boveda_monte',
      metodoPago: 'transferencia',
      ordenesRelacionadas: [],
      referencia: '',
      concepto: '',
    },
  })

  const { watch, setValue, handleSubmit, reset, formState: { errors } } = form
  
  const monto = watch('monto')
  const bancoOrigen = watch('bancoOrigen')
  const metodoPago = watch('metodoPago')

  // Banco seleccionado
  const bancoSeleccionado = React.useMemo(() => {
    return bancosFormateados.find(b => b.id === bancoOrigen)
  }, [bancoOrigen, bancosFormateados])

  // Validar saldo
  const saldoSuficiente = React.useMemo(() => {
    if (!bancoSeleccionado) return true
    return bancoSeleccionado.capital >= monto
  }, [bancoSeleccionado, monto])

  // Nueva deuda del distribuidor
  const nuevaDeuda = React.useMemo(() => {
    if (!selectedDistribuidor) return 0
    return Math.max(0, selectedDistribuidor.deudaTotal - monto)
  }, [selectedDistribuidor, monto])

  // Porcentaje del pago
  const porcentajePago = React.useMemo(() => {
    if (!selectedDistribuidor || selectedDistribuidor.deudaTotal === 0) return 0
    return Math.min(100, (monto / selectedDistribuidor.deudaTotal) * 100)
  }, [selectedDistribuidor, monto])

  // Seleccionar distribuidor
  const handleSelectDistribuidor = (dist: typeof distribuidoresFormateados[0]) => {
    setSelectedDistribuidor(dist)
    setValue('distribuidorId', dist.id)
    setValue('distribuidorNombre', dist.nombre)
  }

  // Quick-set monto
  const setQuickMonto = (porcentaje: number) => {
    if (!selectedDistribuidor) return
    const montoCalculado = Math.round(selectedDistribuidor.deudaTotal * porcentaje)
    setValue('monto', montoCalculado)
  }

  // Reset
  React.useEffect(() => {
    if (open && !preselectedDistribuidor) {
      setSelectedDistribuidor(null)
      reset()
    }
  }, [open, preselectedDistribuidor, reset])

  // Submit
  const onSubmit = async (data: PagoDistribuidorInput) => {
    if (!saldoSuficiente) {
      toast({
        title: 'Saldo Insuficiente',
        description: `${bancoSeleccionado?.nombre} no tiene saldo suficiente`,
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // ✅ Usar el nuevo servicio de business operations
      const pagoInput: BizPagarDistInput = {
        distribuidorId: data.distribuidorId,
        ordenCompraId: data.ordenesRelacionadas?.[0],
        monto: data.monto,
        bancoOrigen: data.bancoOrigen as BancoId,
        notas: data.concepto || `Pago a ${data.distribuidorNombre}`,
      }

      logger.info('[CreatePagoDistribuidorModal] Registrando pago con business-operations', { 
        data: pagoInput,
        context: 'CreatePagoDistribuidorModalPremium',
      })

      // ✅ El servicio business-operations.service.ts maneja automáticamente:
      // - Actualización del perfil del distribuidor (reduce deuda)
      // - Actualización del banco origen (reduce capital, aumenta historicoGastos)
      // - Registro del movimiento como 'pago_distribuidor'
      // - Si hay OC específica, actualiza su estado
      const result = await pagarDistribuidor(pagoInput)

      if (result) {
        logger.info('[CreatePagoDistribuidorModal] Pago procesado exitosamente', {
          data: { distribuidorId: data.distribuidorId, monto: data.monto },
          context: 'CreatePagoDistribuidorModalPremium',
        })

        toast({
          title: '✅ Pago Registrado',
          description: (
            <div className="space-y-1">
              <p>{formatearMonto(data.monto)} pagado a {data.distribuidorNombre}</p>
              <p className="text-xs text-gray-400">
                Descontado de {bancoSeleccionado?.nombre} • Nueva deuda: {formatearMonto(nuevaDeuda)}
              </p>
            </div>
          ) as unknown as string,
        })

        onClose()
        onSuccess?.()
        useAppStore.getState().triggerDataRefresh()
      } else {
        throw new Error('No se pudo registrar el pago')
      }

    } catch (error) {
      logger.error('[CreatePagoDistribuidorModal] Error al registrar pago', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo registrar el pago',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'max-w-2xl max-h-[85vh] p-0 overflow-hidden',
          'bg-black/60 backdrop-blur-2xl',
          'border border-white/10',
          'text-white',
          'shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_100px_rgba(139,92,246,0.15)]',
        )}
      >
        <DialogTitle className="sr-only">Pago a Distribuidor</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para registrar pagos a distribuidores
        </DialogDescription>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative flex flex-col min-h-0 flex-1">
          {/* ===== HEADER ===== */}
          <div className="relative h-24 border-b border-white/10 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            
            <div className="relative h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Truck className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Pago a Distribuidor</h2>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    Liquidar deuda con proveedor
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* ===== BODY ===== */}
          <motion.div 
            className="flex-1 overflow-y-auto p-6 space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Sección 1: Selección de Distribuidor */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Distribuidor</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {distribuidoresConDeuda.map((dist) => (
                  <motion.button
                    key={dist.id}
                    type="button"
                    onClick={() => handleSelectDistribuidor(dist)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'relative p-4 rounded-xl border text-left transition-all',
                      selectedDistribuidor?.id === dist.id
                        ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{dist.icono}</span>
                      <span className={cn(
                        'font-bold',
                        selectedDistribuidor?.id === dist.id ? 'text-white' : 'text-gray-300',
                      )}>
                        {dist.nombre}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-red-400">
                        Deuda: {formatearMonto(dist.deudaTotal)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dist.ordenesAbiertas} OC abiertas
                      </p>
                    </div>
                    {selectedDistribuidor?.id === dist.id && (
                      <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-purple-400" />
                    )}
                  </motion.button>
                ))}
              </div>

              {distribuidoresConDeuda.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-400" />
                  <p>No hay distribuidores con deuda pendiente</p>
                </div>
              )}
            </motion.div>

            {/* Sección 2: Monto del Pago */}
            {selectedDistribuidor && (
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Monto del Pago</h3>
                </div>

                <div className={cn(
                  'p-5 rounded-2xl border',
                  'bg-gradient-to-br from-white/5 to-transparent',
                  'border-white/10',
                )}>
                  {/* Info de deuda */}
                  <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedDistribuidor.icono}</span>
                      <div>
                        <p className="font-medium text-white">{selectedDistribuidor.nombre}</p>
                        <p className="text-xs text-gray-400">Deuda pendiente</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-red-400">
                      {formatearMonto(selectedDistribuidor.deudaTotal)}
                    </p>
                  </div>

                  {/* Input de monto */}
                  <div className="relative mb-4">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-gray-500">$</span>
                    <Input
                      type="number"
                      {...form.register('monto', { valueAsNumber: true })}
                      className={cn(
                        'pl-12 h-16 text-3xl font-bold text-center',
                        'bg-purple-500/5 border-purple-500/20 text-purple-300',
                        '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                        !saldoSuficiente && 'border-red-500',
                        errors.monto && 'border-red-500/50',
                      )}
                      placeholder="0"
                    />
                  </div>

                  {/* Quick-set */}
                  <div className="flex gap-2 mb-4">
                    {[
                      { label: '25%', value: 0.25 },
                      { label: '50%', value: 0.5 },
                      { label: '75%', value: 0.75 },
                      { label: '100%', value: 1 },
                    ].map((opt) => (
                      <Button
                        key={opt.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickMonto(opt.value)}
                        className={cn(
                          'flex-1 border-white/10 hover:bg-white/10',
                          porcentajePago >= opt.value * 100 && 'bg-purple-500/20 border-purple-500/50 text-purple-400',
                        )}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>

                  {/* Barra de progreso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progreso del pago</span>
                      <span className={cn(
                        'font-bold',
                        porcentajePago >= 100 ? 'text-green-400' : 'text-purple-400',
                      )}>
                        {porcentajePago.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className={cn(
                          'h-full',
                          porcentajePago >= 100 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                            : 'bg-gradient-to-r from-purple-500 to-blue-500',
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, porcentajePago)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Nueva deuda */}
                  {monto > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <span className="text-sm text-gray-400">Nueva deuda:</span>
                      <motion.span 
                        className={cn(
                          'text-lg font-bold',
                          nuevaDeuda === 0 ? 'text-green-400' : 'text-yellow-400',
                        )}
                        key={nuevaDeuda}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                      >
                        {nuevaDeuda === 0 ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-5 h-5" /> Liquidado
                          </span>
                        ) : (
                          formatearMonto(nuevaDeuda)
                        )}
                      </motion.span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Sección 3: Banco Origen */}
            {selectedDistribuidor && monto > 0 && (
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Banco Origen</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {bancosFormateados.filter(b => b.capital >= monto || b.id === bancoOrigen).map((banco) => (
                    <motion.button
                      key={banco.id}
                      type="button"
                      onClick={() => setValue('bancoOrigen', banco.id as typeof bancoOrigen)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={banco.capital < monto}
                      className={cn(
                        'p-3 rounded-xl border text-center transition-all',
                        bancoOrigen === banco.id
                          ? 'bg-blue-500/20 border-blue-500'
                          : banco.capital < monto
                          ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                          : 'bg-white/5 border-white/10 hover:bg-white/10',
                      )}
                    >
                      <span className="text-xl">{banco.icono}</span>
                      <p className="text-xs font-medium mt-1 truncate">{banco.nombre}</p>
                      <p className={cn(
                        'text-[10px]',
                        banco.capital < monto ? 'text-red-400' : 'text-green-400',
                      )}>
                        {formatearMonto(banco.capital)}
                      </p>
                    </motion.button>
                  ))}
                </div>

                {!saldoSuficiente && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-red-300">
                      Saldo insuficiente en el banco seleccionado
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Sección 4: Detalles */}
            {selectedDistribuidor && monto > 0 && (
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Detalles</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Fecha</Label>
                    <Input
                      type="date"
                      {...form.register('fecha')}
                      className="h-11 bg-white/5 border-white/10 text-white [color-scheme:dark]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Método</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'transferencia', icon: CreditCard, label: 'Transfer' },
                        { id: 'efectivo', icon: Banknote, label: 'Efectivo' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setValue('metodoPago', m.id as 'efectivo' | 'transferencia')}
                          className={cn(
                            'p-2 rounded-lg border flex items-center justify-center gap-2',
                            metodoPago === m.id
                              ? 'bg-white/10 border-white/30'
                              : 'bg-white/5 border-white/10 hover:bg-white/10',
                          )}
                        >
                          <m.icon className="w-4 h-4" />
                          <span className="text-xs">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Referencia (opcional)</Label>
                  <Input
                    {...form.register('referencia')}
                    placeholder="No. de transferencia, comprobante..."
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Concepto (opcional)</Label>
                  <Textarea
                    {...form.register('concepto')}
                    placeholder="Pago de OC0001, OC0002..."
                    rows={2}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* Resumen Visual */}
            {selectedDistribuidor && monto > 0 && saldoSuficiente && (
              <motion.div 
                variants={itemVariants}
                className={cn(
                  'p-5 rounded-2xl border',
                  'bg-gradient-to-br from-purple-500/10 to-blue-500/10',
                  'border-purple-500/30',
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">Resumen del Pago</span>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Confirmación
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Desde</p>
                    <p className="text-lg font-bold text-blue-400 flex items-center gap-2">
                      <span>{bancoSeleccionado?.icono}</span>
                      {bancoSeleccionado?.nombre}
                    </p>
                  </div>

                  <div className="flex flex-col items-center px-4">
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-8 h-8 text-purple-400" />
                    </motion.div>
                    <Badge className="bg-purple-500 text-white mt-1">
                      {formatearMonto(monto)}
                    </Badge>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Para</p>
                    <p className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{selectedDistribuidor.icono}</span>
                      {selectedDistribuidor.nombre}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ===== FOOTER ===== */}
          <div className={cn(
            'shrink-0 h-20 border-t border-white/10',
            'bg-gradient-to-r from-black/50 via-white/5 to-black/50',
            'px-6 flex items-center justify-between',
          )}>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !selectedDistribuidor || monto <= 0 || !saldoSuficiente}
              className={cn(
                'min-w-[180px]',
                'bg-gradient-to-r from-purple-600 to-blue-600',
                'hover:from-purple-500 hover:to-blue-500',
                'text-white font-bold',
                'shadow-[0_0_30px_rgba(139,92,246,0.4)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Registrar Pago
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePagoDistribuidorModalPremium
