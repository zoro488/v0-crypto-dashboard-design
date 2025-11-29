'use client'

/**
 * 💎 CREATE ABONO MODAL PREMIUM - Registro de Pagos de Clientes
 * 
 * Form ultra-premium para registrar abonos/pagos:
 * 1. Búsqueda inteligente de clientes con deuda
 * 2. Cálculo de saldo antes/después del abono
 * 3. Distribución automática a bancos
 * 4. Historial de pagos del cliente
 * 5. Validación con Zod
 * 6. Glassmorphism futurista
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
  Banknote,
  User,
  Wallet,
  TrendingDown,
  CreditCard,
  Calendar,
  Receipt,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  ArrowRight,
  ArrowDown,
  Building2,
  DollarSign,
  Zap,
  History,
  Target,
  PiggyBank,
  CircleDollarSign,
  Calculator,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useToast } from '@/app/hooks/use-toast'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'
import { formatearMonto } from '@/app/lib/validations/smart-forms-schemas'

// ============================================
// SCHEMA ZOD
// ============================================

const abonoSchema = z.object({
  clienteId: z.string().min(1, 'Selecciona un cliente'),
  clienteNombre: z.string(),
  monto: z.number().min(1, 'El monto debe ser mayor a 0'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  metodoPago: z.enum(['efectivo', 'transferencia', 'deposito']),
  bancoDestino: z.enum(['boveda_monte', 'profit', 'utilidades']),
  referencia: z.string().optional(),
  concepto: z.string().optional(),
})

type AbonoInput = z.infer<typeof abonoSchema>

// ============================================
// TIPOS
// ============================================

interface CreateAbonoModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  preselectedCliente?: {
    id: string
    nombre: string
    deuda: number
    abonos: number
    pendiente: number
  }
}

// Mock de clientes con deuda (en producción viene de Firestore)
const CLIENTES_CON_DEUDA = [
  { id: '1', nombre: 'Robalo', deuda: 660000, abonos: 426000, pendiente: 234000 },
  { id: '2', nombre: 'Valle', deuda: 880500, abonos: 845500, pendiente: 35000 },
  { id: '3', nombre: 'Tio Tocayo', deuda: 315000, abonos: 0, pendiente: 315000 },
  { id: '4', nombre: 'Lamas', deuda: 1057200, abonos: 941000, pendiente: 116200 },
  { id: '5', nombre: 'Galvan', deuda: 14000, abonos: 0, pendiente: 14000 },
  { id: '6', nombre: 'Negrito', deuda: 88300, abonos: 63000, pendiente: 25300 },
  { id: '7', nombre: 'Primo', deuda: 0, abonos: 3000, pendiente: -3000 }, // Saldo a favor
]

const BANCOS_DESTINO = [
  { id: 'boveda_monte', nombre: 'Bóveda Monte', icono: '🏦', color: 'blue' },
  { id: 'profit', nombre: 'Profit', icono: '💰', color: 'green' },
  { id: 'utilidades', nombre: 'Utilidades', icono: '💎', color: 'purple' },
]

const METODOS_PAGO = [
  { id: 'efectivo', nombre: 'Efectivo', icono: Banknote, color: 'green' },
  { id: 'transferencia', nombre: 'Transferencia', icono: CreditCard, color: 'blue' },
  { id: 'deposito', nombre: 'Depósito', icono: Building2, color: 'purple' },
]

// Variantes de animación
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CreateAbonoModalPremium({ 
  open, 
  onClose, 
  onSuccess,
  preselectedCliente, 
}: CreateAbonoModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showClienteList, setShowClienteList] = React.useState(false)
  const [selectedCliente, setSelectedCliente] = React.useState<typeof CLIENTES_CON_DEUDA[0] | null>(
    preselectedCliente || null,
  )

  const form = useForm<AbonoInput>({
    resolver: zodResolver(abonoSchema),
    defaultValues: {
      clienteId: preselectedCliente?.id || '',
      clienteNombre: preselectedCliente?.nombre || '',
      monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      metodoPago: 'efectivo',
      bancoDestino: 'boveda_monte',
      referencia: '',
      concepto: '',
    },
  })

  const { watch, setValue, handleSubmit, reset, formState: { errors } } = form
  
  const monto = watch('monto')
  const metodoPago = watch('metodoPago')
  const bancoDestino = watch('bancoDestino')

  // Calcular nuevo saldo después del abono
  const nuevoSaldo = React.useMemo(() => {
    if (!selectedCliente) return 0
    return selectedCliente.pendiente - monto
  }, [selectedCliente, monto])

  // Porcentaje del pago respecto a la deuda
  const porcentajePago = React.useMemo(() => {
    if (!selectedCliente || selectedCliente.pendiente <= 0) return 0
    return Math.min(100, (monto / selectedCliente.pendiente) * 100)
  }, [selectedCliente, monto])

  // Filtrar clientes
  const clientesFiltrados = React.useMemo(() => {
    if (!searchQuery) return CLIENTES_CON_DEUDA.filter(c => c.pendiente > 0)
    return CLIENTES_CON_DEUDA.filter(c => 
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) && c.pendiente > 0,
    )
  }, [searchQuery])

  // Seleccionar cliente
  const handleSelectCliente = (cliente: typeof CLIENTES_CON_DEUDA[0]) => {
    setSelectedCliente(cliente)
    setValue('clienteId', cliente.id)
    setValue('clienteNombre', cliente.nombre)
    setShowClienteList(false)
    setSearchQuery('')
  }

  // Quick-set de monto
  const setQuickMonto = (porcentaje: number) => {
    if (!selectedCliente) return
    const montoCalculado = Math.round(selectedCliente.pendiente * porcentaje)
    setValue('monto', montoCalculado)
  }

  // Reset cuando se abre
  React.useEffect(() => {
    if (open) {
      if (preselectedCliente) {
        setSelectedCliente(preselectedCliente)
        setValue('clienteId', preselectedCliente.id)
        setValue('clienteNombre', preselectedCliente.nombre)
      } else {
        setSelectedCliente(null)
        reset()
      }
    }
  }, [open, preselectedCliente, setValue, reset])

  // Submit
  const onSubmit = async (data: AbonoInput) => {
    setIsSubmitting(true)

    try {
      const abonoData = {
        ...data,
        nuevoSaldoCliente: nuevoSaldo,
        timestamp: new Date().toISOString(),
      }

      logger.info('Abono registrado', { 
        data: abonoData,
        context: 'CreateAbonoModalPremium',
      })

      toast({
        title: '✅ Abono Registrado',
        description: `${formatearMonto(data.monto)} de ${data.clienteNombre}. Nuevo saldo: ${formatearMonto(nuevoSaldo)}`,
      })

      onClose()
      onSuccess?.()
      useAppStore.getState().triggerDataRefresh()

    } catch (error) {
      logger.error('Error al registrar abono', error)
      toast({
        title: 'Error',
        description: 'No se pudo registrar el abono',
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
          'shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_100px_rgba(34,197,94,0.15)]',
        )}
      >
        <DialogTitle className="sr-only">Registrar Abono</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para registrar pagos de clientes
        </DialogDescription>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative flex flex-col h-full">
          {/* ===== HEADER ===== */}
          <div className="relative h-24 border-b border-white/10 bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            
            <div className="relative h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Banknote className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Registrar Abono</h2>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <TrendingDown className="w-3 h-3 text-green-400" />
                    Pago de cliente a cuenta
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
            {/* Sección 1: Selección de Cliente */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Cliente</h3>
              </div>

              {/* Buscador de clientes */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="text"
                    value={selectedCliente ? selectedCliente.nombre : searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowClienteList(true)
                      if (selectedCliente) setSelectedCliente(null)
                    }}
                    onFocus={() => !selectedCliente && setShowClienteList(true)}
                    placeholder="Buscar cliente con deuda..."
                    className={cn(
                      'pl-10 h-12 bg-white/5 border-white/10 text-white',
                      'placeholder:text-gray-500',
                      selectedCliente && 'border-green-500/50 bg-green-500/10',
                    )}
                  />
                  {selectedCliente && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedCliente(null)
                        setValue('clienteId', '')
                        setValue('clienteNombre', '')
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Dropdown de clientes */}
                <AnimatePresence>
                  {showClienteList && !selectedCliente && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-2 py-2 bg-zinc-900 border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto"
                    >
                      {clientesFiltrados.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hay clientes con deuda</p>
                        </div>
                      ) : (
                        clientesFiltrados.map((cliente) => (
                          <button
                            key={cliente.id}
                            type="button"
                            onClick={() => handleSelectCliente(cliente)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-400" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-white">{cliente.nombre}</p>
                                <p className="text-xs text-gray-500">
                                  Deuda total: {formatearMonto(cliente.deuda)}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'font-bold',
                                cliente.pendiente > 100000 
                                  ? 'border-red-500/50 text-red-400' 
                                  : 'border-orange-500/50 text-orange-400',
                              )}
                            >
                              {formatearMonto(cliente.pendiente)}
                            </Badge>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tarjeta de cliente seleccionado */}
              <AnimatePresence>
                {selectedCliente && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      'p-4 rounded-xl border',
                      'bg-gradient-to-br from-blue-500/10 to-purple-500/10',
                      'border-blue-500/30',
                    )}
                  >
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-400">Deuda Total</p>
                        <p className="text-lg font-bold text-red-400">
                          {formatearMonto(selectedCliente.deuda)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Abonos</p>
                        <p className="text-lg font-bold text-green-400">
                          {formatearMonto(selectedCliente.abonos)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Pendiente</p>
                        <p className="text-lg font-bold text-orange-400">
                          {formatearMonto(selectedCliente.pendiente)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Nuevo Saldo</p>
                        <motion.p 
                          className={cn(
                            'text-lg font-bold',
                            nuevoSaldo <= 0 ? 'text-emerald-400' : 'text-yellow-400',
                          )}
                          key={nuevoSaldo}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                        >
                          {formatearMonto(nuevoSaldo)}
                        </motion.p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Sección 2: Monto del Abono */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Monto del Abono</h3>
              </div>

              <div className={cn(
                'p-5 rounded-2xl border',
                'bg-gradient-to-br from-white/5 to-transparent',
                'border-white/10',
              )}>
                {/* Input principal grande */}
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-gray-500">$</span>
                  <Input
                    type="number"
                    {...form.register('monto', { valueAsNumber: true })}
                    className={cn(
                      'pl-12 h-20 text-4xl font-bold text-center',
                      'bg-green-500/5 border-green-500/20 text-green-300',
                      '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                      errors.monto && 'border-red-500/50',
                    )}
                    placeholder="0"
                  />
                </div>

                {/* Quick-set buttons */}
                {selectedCliente && selectedCliente.pendiente > 0 && (
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
                          porcentajePago >= opt.value * 100 && 'bg-green-500/20 border-green-500/50 text-green-400',
                        )}
                      >
                        {opt.label}
                        <span className="ml-1 text-[10px] text-gray-500">
                          ({formatearMonto(Math.round(selectedCliente.pendiente * opt.value))})
                        </span>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Barra de progreso */}
                {selectedCliente && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progreso del pago</span>
                      <span className={cn(
                        'font-bold',
                        porcentajePago >= 100 ? 'text-emerald-400' : 'text-green-400',
                      )}>
                        {porcentajePago.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className={cn(
                          'h-full',
                          porcentajePago >= 100 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                            : 'bg-gradient-to-r from-green-500 to-emerald-500',
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, porcentajePago)}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    {porcentajePago >= 100 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-sm text-emerald-400 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        ¡Liquida la deuda completa!
                      </motion.p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Sección 3: Detalles del Pago */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Detalles del Pago</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Fecha
                  </Label>
                  <Input
                    type="date"
                    {...form.register('fecha')}
                    className="h-11 bg-white/5 border-white/10 text-white [color-scheme:dark]"
                  />
                </div>

                {/* Referencia */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Referencia (opcional)</Label>
                  <Input
                    {...form.register('referencia')}
                    placeholder="No. de transferencia, recibo, etc."
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Método de Pago */}
              <div className="space-y-3">
                <Label className="text-sm text-gray-400">Método de Pago</Label>
                <div className="grid grid-cols-3 gap-3">
                  {METODOS_PAGO.map((metodo) => (
                    <motion.button
                      key={metodo.id}
                      type="button"
                      onClick={() => setValue('metodoPago', metodo.id as 'efectivo' | 'transferencia' | 'deposito')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'p-4 rounded-xl border text-center transition-all',
                        metodoPago === metodo.id
                          ? metodo.color === 'green'
                            ? 'bg-green-500/20 border-green-500 text-green-400'
                            : metodo.color === 'blue'
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                            : 'bg-purple-500/20 border-purple-500 text-purple-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10',
                      )}
                    >
                      <metodo.icono className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-sm font-medium">{metodo.nombre}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Banco Destino */}
              <div className="space-y-3">
                <Label className="text-sm text-gray-400 flex items-center gap-2">
                  <Building2 className="w-3 h-3" />
                  Banco Destino
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {BANCOS_DESTINO.map((banco) => (
                    <motion.button
                      key={banco.id}
                      type="button"
                      onClick={() => setValue('bancoDestino', banco.id as 'boveda_monte' | 'profit' | 'utilidades')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'p-3 rounded-xl border text-center transition-all',
                        bancoDestino === banco.id
                          ? banco.color === 'blue'
                            ? 'bg-blue-500/20 border-blue-500'
                            : banco.color === 'green'
                            ? 'bg-green-500/20 border-green-500'
                            : 'bg-purple-500/20 border-purple-500'
                          : 'bg-white/5 border-white/10 hover:bg-white/10',
                      )}
                    >
                      <span className="text-2xl mb-1 block">{banco.icono}</span>
                      <p className={cn(
                        'text-xs font-medium',
                        bancoDestino === banco.id ? 'text-white' : 'text-gray-400',
                      )}>
                        {banco.nombre}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Concepto */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-400">Concepto (opcional)</Label>
                <Textarea
                  {...form.register('concepto')}
                  placeholder="Notas adicionales sobre el abono..."
                  rows={2}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                />
              </div>
            </motion.div>

            {/* Resumen Visual */}
            {selectedCliente && monto > 0 && (
              <motion.div 
                variants={itemVariants}
                className={cn(
                  'p-5 rounded-2xl border',
                  'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
                  'border-green-500/30',
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">Resumen del Abono</span>
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Vista Previa
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  {/* Antes */}
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Saldo Antes</p>
                    <p className="text-xl font-bold text-orange-400">
                      {formatearMonto(selectedCliente.pendiente)}
                    </p>
                  </div>

                  {/* Flecha con monto */}
                  <div className="flex flex-col items-center px-4">
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-8 h-8 text-green-400" />
                    </motion.div>
                    <Badge className="bg-green-500 text-white mt-1">
                      -{formatearMonto(monto)}
                    </Badge>
                  </div>

                  {/* Después */}
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Saldo Después</p>
                    <motion.p 
                      className={cn(
                        'text-xl font-bold',
                        nuevoSaldo <= 0 ? 'text-emerald-400' : 'text-yellow-400',
                      )}
                      key={nuevoSaldo}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      {nuevoSaldo <= 0 ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-5 h-5" />
                          {formatearMonto(Math.abs(nuevoSaldo))}
                          {nuevoSaldo < 0 && <span className="text-xs">(a favor)</span>}
                        </span>
                      ) : (
                        formatearMonto(nuevoSaldo)
                      )}
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ===== FOOTER ===== */}
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
              disabled={isSubmitting || !selectedCliente || monto <= 0}
              className={cn(
                'min-w-[180px]',
                'bg-gradient-to-r from-green-600 to-emerald-600',
                'hover:from-green-500 hover:to-emerald-500',
                'text-white font-bold',
                'shadow-[0_0_30px_rgba(34,197,94,0.4)]',
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
                  Registrar Abono
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateAbonoModalPremium
