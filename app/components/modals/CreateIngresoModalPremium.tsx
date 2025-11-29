'use client'

/**
 * 💎 CREATE INGRESO MODAL PREMIUM
 * 
 * Modal premium para registrar ingresos/depósitos a los 7 bancos.
 * Con diseño glassmorphism y animaciones fluidas.
 * 
 * Bancos disponibles: Bóveda Monte, USA, Profit, Leftie, Azteca, Flete Sur, Utilidades
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
import { Textarea } from '@/app/components/ui/textarea'
import { Badge } from '@/app/components/ui/badge'
import {
  ArrowDownCircle,
  Loader2,
  X,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Wallet,
  Tag,
  FileText,
  Calendar,
  TrendingUp,
  Building2,
  Landmark,
  Banknote,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useToast } from '@/app/hooks/use-toast'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'
import { crearIngreso } from '@/app/lib/firebase/firestore-service'
import type { BancoId } from '@/app/types'

// ============================================
// SCHEMA ZOD
// ============================================

const ingresoPremiumSchema = z.object({
  bancoDestino: z.string().min(1, 'Selecciona un banco de destino'),
  monto: z.number()
    .min(1, 'El monto debe ser mayor a 0')
    .max(100000000, 'Monto excede el límite'),
  categoria: z.string().min(1, 'Selecciona una categoría'),
  referencia: z.string().optional(),
  concepto: z.string().min(3, 'El concepto debe tener al menos 3 caracteres'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  notas: z.string().optional(),
})

type IngresoPremiumInput = z.infer<typeof ingresoPremiumSchema>

// ============================================
// TIPOS Y CONSTANTES
// ============================================

interface CreateIngresoModalPremiumProps {
  open: boolean
  onClose: () => void
  bancoPreseleccionado?: BancoId
  onSuccess?: () => void
}

// Configuración de bancos
const BANCOS_CONFIG: Record<BancoId, { 
  nombre: string; 
  color: string; 
  bgColor: string;
  icon: React.ReactNode;
}> = {
  boveda_monte: { 
    nombre: 'Bóveda Monte', 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/20',
    icon: <Wallet className="w-5 h-5" />,
  },
  boveda_usa: { 
    nombre: 'Bóveda USA', 
    color: 'text-green-400', 
    bgColor: 'bg-green-500/20',
    icon: <DollarSign className="w-5 h-5" />,
  },
  profit: { 
    nombre: 'Profit', 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500/20',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  leftie: { 
    nombre: 'Leftie', 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/20',
    icon: <Building2 className="w-5 h-5" />,
  },
  azteca: { 
    nombre: 'Azteca', 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/20',
    icon: <Landmark className="w-5 h-5" />,
  },
  flete_sur: { 
    nombre: 'Flete Sur', 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/20',
    icon: <Banknote className="w-5 h-5" />,
  },
  utilidades: { 
    nombre: 'Utilidades', 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/20',
    icon: <CreditCard className="w-5 h-5" />,
  },
}

const BANCO_IDS: BancoId[] = [
  'boveda_monte', 'boveda_usa', 'profit', 'leftie', 'azteca', 'flete_sur', 'utilidades',
]

// Categorías de ingreso
const CATEGORIAS_INGRESO = [
  { id: 'venta', nombre: 'Venta', icon: '💰', color: 'emerald' },
  { id: 'cobro_cliente', nombre: 'Cobro a Cliente', icon: '🤝', color: 'blue' },
  { id: 'transferencia', nombre: 'Transferencia Recibida', icon: '↘️', color: 'purple' },
  { id: 'devolucion', nombre: 'Devolución', icon: '↩️', color: 'yellow' },
  { id: 'prestamo', nombre: 'Préstamo Recibido', icon: '🏦', color: 'orange' },
  { id: 'inversion', nombre: 'Inversión', icon: '📈', color: 'cyan' },
  { id: 'otro', nombre: 'Otro Ingreso', icon: '📥', color: 'gray' },
]

// Montos rápidos
const MONTOS_RAPIDOS = [1000, 5000, 10000, 25000, 50000, 100000]

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

export function CreateIngresoModalPremium({ 
  open, 
  onClose, 
  bancoPreseleccionado,
  onSuccess, 
}: CreateIngresoModalPremiumProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showSuccess, setShowSuccess] = React.useState(false)

  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<IngresoPremiumInput>({
    resolver: zodResolver(ingresoPremiumSchema),
    mode: 'onChange',
    defaultValues: {
      bancoDestino: bancoPreseleccionado || '',
      monto: 0,
      categoria: '',
      referencia: '',
      concepto: '',
      fecha: today,
      notas: '',
    },
  })

  const watchedMonto = watch('monto')
  const watchedBanco = watch('bancoDestino') as BancoId
  const watchedCategoria = watch('categoria')

  const bancoSeleccionado = watchedBanco ? BANCOS_CONFIG[watchedBanco] : null
  const categoriaSeleccionada = CATEGORIAS_INGRESO.find(c => c.id === watchedCategoria)

  // Reset form cuando se abre el modal
  React.useEffect(() => {
    if (open) {
      reset({
        bancoDestino: bancoPreseleccionado || '',
        monto: 0,
        categoria: '',
        referencia: '',
        concepto: '',
        fecha: today,
        notas: '',
      })
      setShowSuccess(false)
    }
  }, [open, reset, bancoPreseleccionado, today])

  // Submit
  const onSubmit = async (data: IngresoPremiumInput) => {
    setIsSubmitting(true)

    try {
      const ingresoData = {
        bancoDestino: data.bancoDestino,
        monto: data.monto,
        concepto: data.concepto.trim(),
        categoria: data.categoria || undefined,
        referencia: data.referencia?.trim() || undefined,
        notas: data.notas?.trim() || undefined,
      }

      await crearIngreso(ingresoData)

      logger.info('Ingreso registrado exitosamente', {
        context: 'CreateIngresoModalPremium',
        data: { banco: data.bancoDestino, monto: data.monto },
      })

      setShowSuccess(true)

      setTimeout(() => {
        toast({
          title: '✅ Ingreso Registrado',
          description: `$${data.monto.toLocaleString()} a ${BANCOS_CONFIG[data.bancoDestino as BancoId]?.nombre}`,
        })
        onClose()
        onSuccess?.()
        useAppStore.getState().triggerDataRefresh()
      }, 1500)

    } catch (error) {
      logger.error('Error al registrar ingreso', error, {
        context: 'CreateIngresoModalPremium',
      })
      toast({
        title: 'Error',
        description: 'No se pudo registrar el ingreso',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'max-w-2xl max-h-[90vh] p-0 overflow-hidden',
          'bg-black/60 backdrop-blur-2xl',
          'border border-white/10',
          'text-white',
          'shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_100px_rgba(16,185,129,0.15)]',
        )}
      >
        <DialogTitle className="sr-only">Nuevo Ingreso</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para registrar un ingreso o depósito
        </DialogDescription>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </div>

        <AnimatePresence mode="wait">
          {showSuccess ? (
            // ===== PANTALLA DE ÉXITO =====
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white mb-2"
              >
                ¡Ingreso Registrado!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400"
              >
                ${watchedMonto?.toLocaleString()} depositado
              </motion.p>
            </motion.div>
          ) : (
            // ===== FORMULARIO =====
            <motion.form
              key="form"
              onSubmit={handleSubmit(onSubmit)}
              className="relative flex flex-col h-full"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Header */}
              <div className="relative h-20 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                
                <div className="relative h-full px-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                      <ArrowDownCircle className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Nuevo Ingreso</h2>
                      <p className="text-sm text-gray-400">Registrar depósito o entrada</p>
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

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Selector de Banco */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    Banco Destino *
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {BANCO_IDS.map((bancoId) => {
                      const config = BANCOS_CONFIG[bancoId]
                      const isSelected = watchedBanco === bancoId
                      return (
                        <motion.button
                          key={bancoId}
                          type="button"
                          onClick={() => setValue('bancoDestino', bancoId)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            'p-3 rounded-xl border transition-all text-left',
                            isSelected 
                              ? `${config.bgColor} border-emerald-500/50 shadow-lg` 
                              : 'bg-white/5 border-white/10 hover:bg-white/10',
                          )}
                        >
                          <div className={cn('mb-1', config.color)}>
                            {config.icon}
                          </div>
                          <p className={cn(
                            'text-xs font-medium truncate',
                            isSelected ? 'text-white' : 'text-gray-400',
                          )}>
                            {config.nombre}
                          </p>
                        </motion.button>
                      )
                    })}
                  </div>
                  {errors.bancoDestino && (
                    <p className="text-xs text-red-400">{errors.bancoDestino.message}</p>
                  )}
                </motion.div>

                {/* Monto */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Monto *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-emerald-400">$</span>
                    <Input
                      type="number"
                      {...register('monto', { valueAsNumber: true })}
                      placeholder="0.00"
                      className={cn(
                        'h-16 text-3xl font-bold pl-10 pr-4 text-center',
                        'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
                        errors.monto && 'border-red-500',
                      )}
                    />
                  </div>
                  {errors.monto && (
                    <p className="text-xs text-red-400">{errors.monto.message}</p>
                  )}
                  
                  {/* Montos rápidos */}
                  <div className="flex flex-wrap gap-2">
                    {MONTOS_RAPIDOS.map((monto) => (
                      <Button
                        key={monto}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setValue('monto', monto)}
                        className={cn(
                          'border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/50',
                          watchedMonto === monto && 'bg-emerald-500/20 border-emerald-500/50',
                        )}
                      >
                        ${monto.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </motion.div>

                {/* Categoría */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    Categoría *
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIAS_INGRESO.map((cat) => {
                      const isSelected = watchedCategoria === cat.id
                      return (
                        <motion.button
                          key={cat.id}
                          type="button"
                          onClick={() => setValue('categoria', cat.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            'p-3 rounded-xl border transition-all flex flex-col items-center gap-1',
                            isSelected 
                              ? `bg-${cat.color}-500/20 border-${cat.color}-500/50 shadow-lg` 
                              : 'bg-white/5 border-white/10 hover:bg-white/10',
                          )}
                        >
                          <span className="text-xl">{cat.icon}</span>
                          <span className={cn(
                            'text-xs font-medium text-center',
                            isSelected ? 'text-white' : 'text-gray-400',
                          )}>
                            {cat.nombre}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                  {errors.categoria && (
                    <p className="text-xs text-red-400">{errors.categoria.message}</p>
                  )}
                </motion.div>

                {/* Concepto */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Concepto *
                  </Label>
                  <Input
                    {...register('concepto')}
                    placeholder="Descripción del ingreso..."
                    className={cn(
                      'h-12 bg-white/5 border-white/10 text-white',
                      errors.concepto && 'border-red-500',
                    )}
                  />
                  {errors.concepto && (
                    <p className="text-xs text-red-400">{errors.concepto.message}</p>
                  )}
                </motion.div>

                {/* Fecha y Referencia */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      Fecha *
                    </Label>
                    <Input
                      type="date"
                      {...register('fecha')}
                      className={cn(
                        'h-11 bg-white/5 border-white/10 text-white',
                        '[color-scheme:dark]',
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">
                      Referencia (opcional)
                    </Label>
                    <Input
                      {...register('referencia')}
                      placeholder="# de referencia"
                      className="h-11 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </motion.div>

                {/* Notas */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label className="text-sm text-gray-400">
                    Notas (opcional)
                  </Label>
                  <Textarea
                    {...register('notas')}
                    placeholder="Observaciones adicionales..."
                    rows={2}
                    className="bg-white/5 border-white/10 text-white resize-none"
                  />
                </motion.div>

                {/* Preview Card */}
                {watchedMonto > 0 && bancoSeleccionado && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400">Vista Previa</span>
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center',
                        'bg-gradient-to-br from-emerald-500 to-teal-500',
                      )}>
                        <ArrowDownCircle className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-2xl font-bold text-emerald-400">
                          +${watchedMonto.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400">
                          → {bancoSeleccionado.nombre}
                        </p>
                      </div>
                      {categoriaSeleccionada && (
                        <Badge 
                          variant="outline" 
                          className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                        >
                          {categoriaSeleccionada.icon} {categoriaSeleccionada.nombre}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className={cn(
                'h-20 border-t border-white/10',
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
                  disabled={isSubmitting || !isValid}
                  className={cn(
                    'min-w-[180px]',
                    'bg-gradient-to-r from-emerald-600 to-teal-600',
                    'hover:from-emerald-500 hover:to-teal-500',
                    'text-white font-bold',
                    'shadow-[0_0_30px_rgba(16,185,129,0.4)]',
                    'disabled:opacity-50',
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Registrar Ingreso
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export default CreateIngresoModalPremium
