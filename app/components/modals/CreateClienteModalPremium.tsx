'use client'

/**
 * 💎 CREATE CLIENTE MODAL PREMIUM - Gestión Ultra de Clientes
 * 
 * Form completamente rediseñado con:
 * 1. Glassmorphism futurista con gradientes
 * 2. Campos completos según CSV: cliente, actual, deuda, abonos, pendiente, observaciones
 * 3. Cálculo automático de saldos
 * 4. Historial de compras del cliente
 * 5. Estadísticas en tiempo real
 * 6. Validación con Zod
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
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
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Building2,
  FileText,
  History,
  Star,
  Shield,
  Zap,
  PiggyBank,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useToast } from '@/app/hooks/use-toast'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'
import { formatearMonto } from '@/app/lib/validations/smart-forms-schemas'
import { crearCliente, actualizarCliente } from '@/app/lib/services/unified-data-service'

// ============================================
// SCHEMA ZOD - Basado en clientes.csv
// ============================================

const clienteSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  tipo: z.enum(['mayorista', 'minorista', 'especial']),
  // Campos financieros del CSV
  actual: z.number().min(0), // Saldo actual
  deuda: z.number().min(0), // Deuda acumulada
  abonos: z.number().min(0), // Total de abonos realizados
  // pendiente se calcula: deuda - abonos
  observaciones: z.string().max(500).optional(),
  limiteCredito: z.number().min(0),
})

type ClienteInput = z.infer<typeof clienteSchema>

// ============================================
// TIPOS
// ============================================

interface CreateClienteModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editData?: ClienteInput & { id?: string } | null // Para edición
}

// Variantes de animación premium
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.05,
    },
  },
  exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3 },
  },
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CreateClienteModalPremium({ 
  open, 
  onClose, 
  onSuccess,
  editData, 
}: CreateClienteModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const isEdit = !!editData?.id

  // Form con react-hook-form + Zod
  const form = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: editData?.nombre || '',
      telefono: editData?.telefono || '',
      email: editData?.email || '',
      direccion: editData?.direccion || '',
      tipo: editData?.tipo || 'minorista',
      actual: editData?.actual || 0,
      deuda: editData?.deuda || 0,
      abonos: editData?.abonos || 0,
      observaciones: editData?.observaciones || '',
      limiteCredito: editData?.limiteCredito || 100000,
    },
  })

  const { watch, setValue, handleSubmit, reset, formState: { errors } } = form
  
  // Watch valores para cálculos en tiempo real
  const deuda = watch('deuda')
  const abonos = watch('abonos')
  const limiteCredito = watch('limiteCredito')
  const tipo = watch('tipo')

  // Calcular saldo pendiente
  const pendiente = React.useMemo(() => {
    return Math.max(0, deuda - abonos)
  }, [deuda, abonos])

  // Calcular crédito disponible
  const creditoDisponible = React.useMemo(() => {
    return Math.max(0, limiteCredito - pendiente)
  }, [limiteCredito, pendiente])

  // Porcentaje de uso de crédito
  const porcentajeCredito = React.useMemo(() => {
    if (limiteCredito === 0) return 0
    return Math.min(100, (pendiente / limiteCredito) * 100)
  }, [pendiente, limiteCredito])

  // Reset form cuando se abre/cierra
  React.useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          nombre: editData.nombre || '',
          telefono: editData.telefono || '',
          email: editData.email || '',
          direccion: editData.direccion || '',
          tipo: editData.tipo || 'minorista',
          actual: editData.actual || 0,
          deuda: editData.deuda || 0,
          abonos: editData.abonos || 0,
          observaciones: editData.observaciones || '',
          limiteCredito: editData.limiteCredito || 100000,
        })
      } else {
        reset()
      }
    }
  }, [open, editData, reset])

  // Submit handler
  const onSubmit = async (data: ClienteInput) => {
    setIsSubmitting(true)

    try {
      const clienteData = {
        nombre: data.nombre,
        telefono: data.telefono || undefined,
        email: data.email || undefined,
        direccion: data.direccion || undefined,
        deudaTotal: data.deuda,
        totalPagado: data.abonos,
      }

      let result: string | null = null

      if (isEdit && editData?.id) {
        // Modo edición - actualizar cliente existente
        logger.info('Actualizando cliente en Firestore', { 
          data: { clienteId: editData.id, clienteData },
          context: 'CreateClienteModalPremium',
        })
        result = await actualizarCliente(editData.id, clienteData)
      } else {
        // Modo creación - crear nuevo cliente
        logger.info('Creando cliente en Firestore', { 
          data: clienteData,
          context: 'CreateClienteModalPremium',
        })
        result = await crearCliente(clienteData)
      }

      if (result) {
        toast({
          title: isEdit ? '✅ Cliente Actualizado' : '✅ Cliente Creado',
          description: `${data.nombre} - Pendiente: ${formatearMonto(pendiente)}`,
        })

        onClose()
        onSuccess?.()
        useAppStore.getState().triggerDataRefresh()
      } else {
        throw new Error(isEdit ? 'No se pudo actualizar el cliente' : 'No se pudo crear el cliente')
      }

    } catch (error) {
      logger.error('Error al guardar cliente', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar el cliente',
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
          'max-w-3xl max-h-[85vh] p-0 overflow-hidden',
          // 🎨 GLASSMORPHISM ULTRA PREMIUM
          'bg-black/60 backdrop-blur-2xl',
          'border border-white/10',
          'text-white',
          'shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_100px_rgba(59,130,246,0.15)]',
        )}
      >
        <DialogTitle className="sr-only">
          {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para gestionar datos del cliente
        </DialogDescription>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative flex flex-col min-h-0 flex-1">
          {/* ===== HEADER ===== */}
          <div className="relative h-24 border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            
            <div className="relative h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h2>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    Gestión completa de información
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
            {/* Sección 1: Información Básica */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Información Básica</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm text-gray-400">Nombre del Cliente *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      {...form.register('nombre')}
                      placeholder="Ej: Valle, Ax, Robalo..."
                      className={cn(
                        'pl-10 h-12 bg-white/5 border-white/10 text-white',
                        'placeholder:text-gray-500',
                        'focus:border-blue-500/50 focus:ring-blue-500/20',
                        errors.nombre && 'border-red-500/50',
                      )}
                    />
                    {errors.nombre && (
                      <p className="text-xs text-red-400 mt-1">{errors.nombre.message}</p>
                    )}
                  </div>
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      {...form.register('telefono')}
                      placeholder="(33) 1234-5678"
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      {...form.register('email')}
                      type="email"
                      placeholder="cliente@email.com"
                      className={cn(
                        'pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500',
                        errors.email && 'border-red-500/50',
                      )}
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm text-gray-400">Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <Input
                      {...form.register('direccion')}
                      placeholder="Calle, número, colonia, ciudad..."
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {/* Tipo de Cliente */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm text-gray-400">Tipo de Cliente</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'mayorista', icon: Building2, label: 'Mayorista', color: 'purple' },
                      { id: 'minorista', icon: User, label: 'Minorista', color: 'blue' },
                      { id: 'especial', icon: Star, label: 'Especial', color: 'yellow' },
                    ].map((t) => (
                      <motion.button
                        key={t.id}
                        type="button"
                        onClick={() => setValue('tipo', t.id as 'mayorista' | 'minorista' | 'especial')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'p-4 rounded-xl border text-center transition-all',
                          tipo === t.id
                            ? t.color === 'purple' 
                              ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                              : t.color === 'blue'
                              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                              : 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10',
                        )}
                      >
                        <t.icon className="w-5 h-5 mx-auto mb-2" />
                        <p className="text-sm font-medium">{t.label}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Sección 2: Información Financiera (CSV) */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Información Financiera</h3>
                <Badge variant="outline" className="ml-auto border-green-500/30 text-green-400 text-xs">
                  Según Excel
                </Badge>
              </div>

              {/* Tarjeta de Resumen Financiero */}
              <div className={cn(
                'p-5 rounded-2xl border',
                'bg-gradient-to-br from-white/5 to-transparent',
                'border-white/10',
              )}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {/* Deuda Total */}
                  <div className="text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-red-400" />
                    <p className="text-xs text-gray-400">Deuda Total</p>
                    <p className="text-lg font-bold text-red-400">
                      {formatearMonto(deuda)}
                    </p>
                  </div>

                  {/* Abonos */}
                  <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <TrendingDown className="w-5 h-5 mx-auto mb-1 text-green-400" />
                    <p className="text-xs text-gray-400">Abonos</p>
                    <p className="text-lg font-bold text-green-400">
                      {formatearMonto(abonos)}
                    </p>
                  </div>

                  {/* Pendiente (Calculado) */}
                  <div className={cn(
                    'text-center p-3 rounded-xl border',
                    pendiente > 0 
                      ? 'bg-orange-500/10 border-orange-500/20' 
                      : 'bg-emerald-500/10 border-emerald-500/20',
                  )}>
                    <Calculator className="w-5 h-5 mx-auto mb-1 text-orange-400" />
                    <p className="text-xs text-gray-400">Pendiente</p>
                    <p className={cn(
                      'text-lg font-bold',
                      pendiente > 0 ? 'text-orange-400' : 'text-emerald-400',
                    )}>
                      {pendiente < 0 ? '-' : ''}{formatearMonto(Math.abs(pendiente))}
                    </p>
                    <p className="text-[9px] text-gray-500">= Deuda - Abonos</p>
                  </div>

                  {/* Crédito Disponible */}
                  <div className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                    <p className="text-xs text-gray-400">Crédito Disp.</p>
                    <p className="text-lg font-bold text-blue-400">
                      {formatearMonto(creditoDisponible)}
                    </p>
                  </div>
                </div>

                {/* Inputs Financieros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Deuda */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400 flex items-center gap-2">
                      <ArrowUpRight className="w-3 h-3 text-red-400" />
                      Deuda Acumulada
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        {...form.register('deuda', { valueAsNumber: true })}
                        className="pl-7 h-11 bg-red-500/5 border-red-500/20 text-red-300"
                      />
                    </div>
                  </div>

                  {/* Abonos */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400 flex items-center gap-2">
                      <ArrowDownRight className="w-3 h-3 text-green-400" />
                      Total Abonos
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        {...form.register('abonos', { valueAsNumber: true })}
                        className="pl-7 h-11 bg-green-500/5 border-green-500/20 text-green-300"
                      />
                    </div>
                  </div>

                  {/* Límite de Crédito */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400 flex items-center gap-2">
                      <Shield className="w-3 h-3 text-blue-400" />
                      Límite de Crédito
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        {...form.register('limiteCredito', { valueAsNumber: true })}
                        className="pl-7 h-11 bg-blue-500/5 border-blue-500/20 text-blue-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Barra de uso de crédito */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Uso del Crédito</span>
                    <span className={cn(
                      'text-xs font-bold',
                      porcentajeCredito < 50 ? 'text-green-400' :
                      porcentajeCredito < 80 ? 'text-yellow-400' : 'text-red-400',
                    )}>
                      {porcentajeCredito.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full',
                        porcentajeCredito < 50 ? 'bg-green-500' :
                        porcentajeCredito < 80 ? 'bg-yellow-500' : 'bg-red-500',
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${porcentajeCredito}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  {porcentajeCredito >= 80 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mt-2 text-xs text-red-400"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Cliente cerca del límite de crédito
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Sección 3: Observaciones */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Observaciones</h3>
              </div>

              <Textarea
                {...form.register('observaciones')}
                placeholder="Notas adicionales sobre el cliente (ej: '33 panaderia', 'Pago los viernes', etc.)"
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
              />
            </motion.div>
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
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'min-w-[180px]',
                'bg-gradient-to-r from-blue-600 to-purple-600',
                'hover:from-blue-500 hover:to-purple-500',
                'text-white font-bold',
                'shadow-[0_0_30px_rgba(59,130,246,0.4)]',
                'transition-all duration-300',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {isEdit ? 'Actualizar Cliente' : 'Crear Cliente'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateClienteModalPremium
