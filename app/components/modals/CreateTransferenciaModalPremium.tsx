'use client'

/**
 * 💎 CREATE TRANSFERENCIA MODAL PREMIUM - Transferencias entre Bancos
 * 
 * Form ultra-premium para transferencias entre los 7 bancos:
 * 1. Banco origen y destino con visualización de saldos
 * 2. Validación de saldo suficiente
 * 3. Animación de flujo de dinero
 * 4. Registro de historial
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
  ArrowLeftRight,
  Building2,
  DollarSign,
  Calendar,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Zap,
  RefreshCw,
  ArrowDown,
  Lock,
  Unlock,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useToast } from '@/app/hooks/use-toast'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'
import { formatearMonto } from '@/app/lib/validations/smart-forms-schemas'
// ✅ USAR NUEVO SERVICIO DE BUSINESS OPERATIONS
import { realizarTransferencia, type TransferenciaInput as BizTransferenciaInput } from '@/app/lib/services/business-operations.service'
import { useBancosData } from '@/app/lib/firebase/firestore-hooks.service'
import type { BancoId as SystemBancoId } from '@/app/types'

// ============================================
// SCHEMA ZOD
// ============================================

const transferenciaSchema = z.object({
  bancoOrigen: z.enum([
    'boveda_monte', 'boveda_usa', 'profit', 'leftie', 
    'azteca', 'flete_sur', 'utilidades',
  ]),
  bancoDestino: z.enum([
    'boveda_monte', 'boveda_usa', 'profit', 'leftie', 
    'azteca', 'flete_sur', 'utilidades',
  ]),
  monto: z.number().min(1, 'El monto debe ser mayor a 0'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  concepto: z.string().optional(),
  referencia: z.string().optional(),
}).refine(data => data.bancoOrigen !== data.bancoDestino, {
  message: 'El banco origen y destino deben ser diferentes',
  path: ['bancoDestino'],
})

type TransferenciaInput = z.infer<typeof transferenciaSchema>

// ============================================
// TIPOS Y CONSTANTES
// ============================================

interface CreateTransferenciaModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
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

// Colores por banco
const BANCO_COLORES: Record<string, string> = {
  'boveda_monte': 'purple',
  'boveda_usa': 'blue',
  'profit': 'green',
  'leftie': 'orange',
  'azteca': 'yellow',
  'flete_sur': 'cyan',
  'utilidades': 'pink',
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

// Interfaz para el formato de banco usado en el componente
interface BancoDisplay {
  id: string
  nombre: string
  icono: string
  color: string
  capital: number
}

type BancoId = 'boveda_monte' | 'boveda_usa' | 'profit' | 'leftie' | 'azteca' | 'flete_sur' | 'utilidades'

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
// COMPONENTE BANCO CARD
// ============================================

interface BancoCardProps {
  banco: BancoDisplay
  tipo: 'origen' | 'destino'
  selected: boolean
  disabled?: boolean
  onClick: () => void
  cambioMonto?: number
}

function BancoCard({ banco, tipo, selected, disabled, onClick, cambioMonto }: BancoCardProps) {
  const colorMap: Record<string, string> = {
    purple: 'purple',
    blue: 'blue',
    green: 'green',
    orange: 'orange',
    yellow: 'amber',
    cyan: 'cyan',
    pink: 'pink',
  }
  const color = colorMap[banco.color] || 'gray'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={cn(
        'relative p-4 rounded-xl border transition-all text-left w-full',
        selected
          ? `bg-${color}-500/20 border-${color}-500 shadow-lg shadow-${color}-500/20`
          : disabled
          ? 'bg-white/5 border-white/5 opacity-40 cursor-not-allowed'
          : 'bg-white/5 border-white/10 hover:bg-white/10',
      )}
      style={{
        background: selected ? `rgba(var(--${color}-rgb), 0.2)` : undefined,
        borderColor: selected ? `rgb(var(--${color}-rgb))` : undefined,
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{banco.icono}</span>
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-bold truncate',
            selected ? 'text-white' : 'text-gray-300',
          )}>
            {banco.nombre}
          </p>
          <p className="text-sm text-gray-500">
            Capital: {formatearMonto(banco.capital)}
          </p>
        </div>
      </div>

      {/* Indicador de cambio */}
      {cambioMonto && cambioMonto !== 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold',
            cambioMonto > 0 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30',
          )}
        >
          {cambioMonto > 0 ? '+' : ''}{formatearMonto(cambioMonto)}
        </motion.div>
      )}

      {/* Check de selección */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center',
            tipo === 'origen' ? 'bg-purple-500' : 'bg-green-500',
          )}
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
        </motion.div>
      )}

      {/* Etiqueta de tipo */}
      <div className={cn(
        'absolute bottom-2 right-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded',
        tipo === 'origen' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400',
      )}>
        {tipo}
      </div>
    </motion.button>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CreateTransferenciaModalPremium({ 
  open, 
  onClose, 
  onSuccess, 
}: CreateTransferenciaModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showAnimation, setShowAnimation] = React.useState(false)

  // 🔥 Cargar bancos reales de Firestore
  const { data: bancosRaw, loading: loadingBancos } = useBancosData()
  
  // Convertir bancos de Firestore al formato esperado
  const BANCOS = React.useMemo(() => {
    if (!bancosRaw) return []
    return (bancosRaw as BancoFirestore[]).map(b => ({
      id: b.id,
      nombre: b.nombre || b.id,
      icono: BANCO_ICONOS[b.id] || '🏦',
      color: BANCO_COLORES[b.id] || 'gray',
      capital: b.capitalActual ?? ((b.historicoIngresos ?? 0) - (b.historicoGastos ?? 0)),
    }))
  }, [bancosRaw])

  const form = useForm<TransferenciaInput>({
    resolver: zodResolver(transferenciaSchema),
    defaultValues: {
      bancoOrigen: 'boveda_monte',
      bancoDestino: 'utilidades',
      monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      referencia: '',
    },
  })

  const { watch, setValue, handleSubmit, reset, formState: { errors } } = form
  
  const bancoOrigen = watch('bancoOrigen')
  const bancoDestino = watch('bancoDestino')
  const monto = watch('monto')

  // Bancos seleccionados
  const origenData = React.useMemo(() => BANCOS.find(b => b.id === bancoOrigen), [bancoOrigen])
  const destinoData = React.useMemo(() => BANCOS.find(b => b.id === bancoDestino), [bancoDestino])

  // Validaciones
  const saldoSuficiente = React.useMemo(() => {
    return origenData ? origenData.capital >= monto : true
  }, [origenData, monto])

  const bancosIguales = bancoOrigen === bancoDestino

  // Intercambiar bancos
  const intercambiarBancos = () => {
    const tempOrigen = bancoOrigen
    setValue('bancoOrigen', bancoDestino)
    setValue('bancoDestino', tempOrigen)
  }

  // Reset al abrir
  React.useEffect(() => {
    if (open) {
      reset()
      setShowAnimation(false)
    }
  }, [open, reset])

  // Submit
  const onSubmit = async (data: TransferenciaInput) => {
    if (!saldoSuficiente || bancosIguales) {
      toast({
        title: 'Error de Validación',
        description: !saldoSuficiente ? 'Saldo insuficiente' : 'Los bancos deben ser diferentes',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    setShowAnimation(true)

    // Animación de transferencia
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      // ✅ Usar el nuevo servicio de business operations
      const transferenciaInput: BizTransferenciaInput = {
        bancoOrigen: data.bancoOrigen as SystemBancoId,
        bancoDestino: data.bancoDestino as SystemBancoId,
        monto: data.monto,
        concepto: data.concepto || `Transferencia de ${origenData?.nombre} a ${destinoData?.nombre}`,
        descripcion: data.referencia,
      }

      logger.info('[CreateTransferenciaModal] Creando transferencia con business-operations', { 
        data: transferenciaInput,
        context: 'CreateTransferenciaModalPremium',
      })

      // ✅ El servicio business-operations.service.ts maneja automáticamente:
      // - Descuento del banco origen
      // - Suma al banco destino
      // - Registro de movimientos en ambos bancos
      // - Actualización de históricos
      const result = await realizarTransferencia(transferenciaInput)

      if (result) {
        logger.info('[CreateTransferenciaModal] Transferencia completada', {
          data: { transferenciaId: result },
          context: 'CreateTransferenciaModalPremium',
        })

        toast({
          title: '✅ Transferencia Completada',
          description: (
            <div className="space-y-1">
              <p>{formatearMonto(data.monto)} transferido</p>
              <p className="text-xs text-gray-400">
                De {origenData?.nombre} → {destinoData?.nombre}
              </p>
            </div>
          ) as unknown as string,
        })

        onClose()
        onSuccess?.()
        useAppStore.getState().triggerDataRefresh()
      } else {
        throw new Error('No se pudo completar la transferencia')
      }

    } catch (error) {
      logger.error('[CreateTransferenciaModal] Error en transferencia', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo completar la transferencia',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
      setShowAnimation(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'max-w-3xl max-h-[85vh] p-0 overflow-hidden',
          'bg-black/60 backdrop-blur-2xl',
          'border border-white/10',
          'text-white',
          'shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_100px_rgba(16,185,129,0.15)]',
        )}
      >
        <DialogTitle className="sr-only">Transferencia entre Bancos</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para transferir fondos entre bancos del sistema
        </DialogDescription>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </div>

        {/* Animación de transferencia en progreso */}
        <AnimatePresence>
          {showAnimation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center flex-col gap-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="w-16 h-16 text-green-400" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Procesando Transferencia</h3>
                <p className="text-gray-400">
                  Moviendo {formatearMonto(monto)} de {origenData?.nombre} a {destinoData?.nombre}
                </p>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="text-center">
                  <span className="text-4xl">{origenData?.icono}</span>
                  <p className="text-xs text-gray-500 mt-1">{origenData?.nombre}</p>
                </div>
                <motion.div
                  className="flex items-center"
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-green-500 rounded" />
                  <ArrowRight className="w-6 h-6 text-green-400" />
                </motion.div>
                <div className="text-center">
                  <span className="text-4xl">{destinoData?.icono}</span>
                  <p className="text-xs text-gray-500 mt-1">{destinoData?.nombre}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="relative flex flex-col min-h-0 flex-1">
          {/* ===== HEADER ===== */}
          <div className="relative h-24 border-b border-white/10 bg-gradient-to-r from-green-500/10 via-transparent to-cyan-500/10">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            
            <div className="relative h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-green-500/30"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <ArrowLeftRight className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Transferencia entre Bancos</h2>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <Building2 className="w-3 h-3" />
                    Mover fondos internos
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
            {/* Selección de Bancos */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-400" />
                  Bancos
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={intercambiarBancos}
                  className="border-white/10 hover:bg-white/10"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-1" />
                  Intercambiar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Banco Origen */}
                <div className="space-y-3">
                  <Label className="text-sm text-purple-400 font-bold flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    BANCO ORIGEN
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {BANCOS.map((banco) => (
                      <BancoCard
                        key={`origen-${banco.id}`}
                        banco={banco}
                        tipo="origen"
                        selected={bancoOrigen === banco.id}
                        disabled={banco.id === bancoDestino}
                        onClick={() => setValue('bancoOrigen', banco.id as BancoId)}
                        cambioMonto={bancoOrigen === banco.id && monto > 0 ? -monto : undefined}
                      />
                    ))}
                  </div>
                </div>

                {/* Banco Destino */}
                <div className="space-y-3">
                  <Label className="text-sm text-green-400 font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    BANCO DESTINO
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {BANCOS.map((banco) => (
                      <BancoCard
                        key={`destino-${banco.id}`}
                        banco={banco}
                        tipo="destino"
                        selected={bancoDestino === banco.id}
                        disabled={banco.id === bancoOrigen}
                        onClick={() => setValue('bancoDestino', banco.id as BancoId)}
                        cambioMonto={bancoDestino === banco.id && monto > 0 ? monto : undefined}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {bancosIguales && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
                >
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-yellow-300">
                    Los bancos origen y destino deben ser diferentes
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Monto de Transferencia */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Monto a Transferir</h3>
              </div>

              <div className={cn(
                'p-5 rounded-2xl border',
                'bg-gradient-to-br from-white/5 to-transparent',
                'border-white/10',
              )}>
                {/* Capital disponible */}
                {origenData && (
                  <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{origenData.icono}</span>
                      <div>
                        <p className="text-sm text-gray-400">Disponible en {origenData.nombre}</p>
                        <p className="text-lg font-bold text-white">{formatearMonto(origenData.capital)}</p>
                      </div>
                    </div>
                    {saldoSuficiente ? (
                      <Unlock className="w-5 h-5 text-green-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                )}

                {/* Input de monto */}
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-gray-500">$</span>
                  <Input
                    type="number"
                    {...form.register('monto', { valueAsNumber: true })}
                    className={cn(
                      'pl-12 h-16 text-3xl font-bold text-center',
                      'bg-green-500/5 border-green-500/20 text-green-300',
                      '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                      !saldoSuficiente && 'border-red-500',
                      errors.monto && 'border-red-500/50',
                    )}
                    placeholder="0"
                  />
                </div>

                {/* Quick-set */}
                {origenData && (
                  <div className="flex gap-2">
                    {[
                      { label: '10%', value: 0.1 },
                      { label: '25%', value: 0.25 },
                      { label: '50%', value: 0.5 },
                      { label: '100%', value: 1 },
                    ].map((opt) => (
                      <Button
                        key={opt.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setValue('monto', Math.round(origenData.capital * opt.value))}
                        className="flex-1 border-white/10 hover:bg-white/10"
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Advertencia de saldo */}
                {!saldoSuficiente && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-red-300">
                      El monto excede el saldo disponible en {origenData?.nombre}
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Detalles */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-cyan-400" />
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
                  <Label className="text-sm text-gray-400">Referencia (opcional)</Label>
                  <Input
                    {...form.register('referencia')}
                    placeholder="REF-001..."
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-400">Concepto (opcional)</Label>
                <Textarea
                  {...form.register('concepto')}
                  placeholder="Motivo de la transferencia..."
                  rows={2}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                />
              </div>
            </motion.div>

            {/* Resumen Visual */}
            {monto > 0 && !bancosIguales && saldoSuficiente && (
              <motion.div 
                variants={itemVariants}
                className={cn(
                  'p-5 rounded-2xl border',
                  'bg-gradient-to-br from-green-500/10 to-cyan-500/10',
                  'border-green-500/30',
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">Resumen de Transferencia</span>
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Listo
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Origen */}
                  <div className="text-center">
                    <span className="text-4xl">{origenData?.icono}</span>
                    <p className="text-sm font-medium text-white mt-2">{origenData?.nombre}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Saldo: {formatearMonto(origenData?.capital || 0)}
                    </p>
                    <p className="text-xs text-red-400 mt-1">
                      -{formatearMonto(monto)}
                    </p>
                    <p className="text-sm text-purple-400 font-bold mt-1">
                      = {formatearMonto((origenData?.capital || 0) - monto)}
                    </p>
                  </div>

                  {/* Flecha */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{ 
                        x: [0, 10, 0],
                        opacity: [0.5, 1, 0.5], 
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="relative"
                    >
                      <ArrowRight className="w-12 h-12 text-green-400" />
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ x: [0, 30, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <DollarSign className="w-5 h-5 text-yellow-400" />
                      </motion.div>
                    </motion.div>
                    <Badge className="bg-gradient-to-r from-green-500 to-cyan-500 text-white mt-2">
                      {formatearMonto(monto)}
                    </Badge>
                  </div>

                  {/* Destino */}
                  <div className="text-center">
                    <span className="text-4xl">{destinoData?.icono}</span>
                    <p className="text-sm font-medium text-white mt-2">{destinoData?.nombre}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Saldo: {formatearMonto(destinoData?.capital || 0)}
                    </p>
                    <p className="text-xs text-green-400 mt-1">
                      +{formatearMonto(monto)}
                    </p>
                    <p className="text-sm text-green-400 font-bold mt-1">
                      = {formatearMonto((destinoData?.capital || 0) + monto)}
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
              disabled={isSubmitting || bancosIguales || monto <= 0 || !saldoSuficiente}
              className={cn(
                'min-w-[180px]',
                'bg-gradient-to-r from-green-600 to-cyan-600',
                'hover:from-green-500 hover:to-cyan-500',
                'text-white font-bold',
                'shadow-[0_0_30px_rgba(16,185,129,0.4)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Transfiriendo...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Ejecutar Transferencia
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTransferenciaModalPremium
