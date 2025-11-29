"use client"

/**
 * 📝 FORMULARIOS CRUD COMPLETOS - CHRONOS SYSTEM
 * 
 * Formularios modales para todas las operaciones CRUD:
 * - FormVenta: Crear/Editar ventas con distribución automática a bancos
 * - FormOrdenCompra: Gestionar órdenes de compra
 * - FormGasto: Registrar gastos desde cualquier banco
 * - FormTransferencia: Transferencias entre bancos
 * - FormCliente: CRUD de clientes
 * - FormDistribuidor: CRUD de distribuidores
 * - FormPago: Pagos a distribuidores o cobros a clientes
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  X, 
  Save, 
  DollarSign, 
  Package, 
  User, 
  Truck, 
  Calendar,
  CreditCard,
  ArrowRight,
  Calculator,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus
} from 'lucide-react'
import { useFirestoreCRUD, useClientes, useDistribuidores } from '@/app/hooks/useFirestoreCRUD'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/app/components/ui/select'
import { Textarea } from '@/app/components/ui/textarea'
import { useToast } from '@/app/hooks/use-toast'
import { logger } from '@/app/lib/utils/logger'

// ============================================================================
// TIPOS Y SCHEMAS ZOD
// ============================================================================

// Schema de Venta
const VentaSchema = z.object({
  fecha: z.string().min(1, 'Fecha requerida'),
  clienteId: z.string().min(1, 'Cliente requerido'),
  clienteNombre: z.string().optional(),
  ocRelacionada: z.string().optional(),
  cantidad: z.number().min(1, 'Cantidad debe ser mayor a 0'),
  precioVentaUnidad: z.number().min(0, 'Precio debe ser positivo'),
  precioCompraUnidad: z.number().min(0, 'Costo debe ser positivo'),
  precioFlete: z.number().min(0, 'Flete debe ser positivo'),
  estadoPago: z.enum(['completo', 'parcial', 'pendiente']),
  montoPagado: z.number().min(0).optional(),
  observaciones: z.string().optional(),
})

type VentaFormData = z.infer<typeof VentaSchema>

// Schema de Orden de Compra
const OrdenCompraSchema = z.object({
  fecha: z.string().min(1, 'Fecha requerida'),
  distribuidorId: z.string().min(1, 'Distribuidor requerido'),
  distribuidorNombre: z.string().optional(),
  origen: z.string().min(1, 'Origen requerido'),
  cantidad: z.number().min(1, 'Cantidad debe ser mayor a 0'),
  costoDistribuidor: z.number().min(0, 'Costo debe ser positivo'),
  costoTransporte: z.number().min(0, 'Transporte debe ser positivo'),
  pagoInicial: z.number().min(0).optional(),
  observaciones: z.string().optional(),
})

type OrdenCompraFormData = z.infer<typeof OrdenCompraSchema>

// Schema de Gasto
const GastoSchema = z.object({
  fecha: z.string().min(1, 'Fecha requerida'),
  bancoOrigen: z.string().min(1, 'Banco origen requerido'),
  monto: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  concepto: z.string().min(1, 'Concepto requerido'),
  categoria: z.string().optional(),
  observaciones: z.string().optional(),
})

type GastoFormData = z.infer<typeof GastoSchema>

// Schema de Transferencia
const TransferenciaSchema = z.object({
  fecha: z.string().min(1, 'Fecha requerida'),
  bancoOrigen: z.string().min(1, 'Banco origen requerido'),
  bancoDestino: z.string().min(1, 'Banco destino requerido'),
  monto: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  concepto: z.string().min(1, 'Concepto requerido'),
}).refine(data => data.bancoOrigen !== data.bancoDestino, {
  message: 'Origen y destino deben ser diferentes',
  path: ['bancoDestino']
})

type TransferenciaFormData = z.infer<typeof TransferenciaSchema>

// Schema de Cliente
const ClienteSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  tipo: z.enum(['mayorista', 'regular', 'menudeo']).optional(),
  observaciones: z.string().optional(),
})

type ClienteFormData = z.infer<typeof ClienteSchema>

// Schema de Distribuidor
const DistribuidorSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  empresa: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  origen: z.string().optional(),
  observaciones: z.string().optional(),
})

type DistribuidorFormData = z.infer<typeof DistribuidorSchema>

// ============================================================================
// CONSTANTES
// ============================================================================

const BANCOS = [
  { id: 'boveda_monte', nombre: 'Bóveda Monte', icon: '⛰️', color: '#8b5cf6' },
  { id: 'boveda_usa', nombre: 'Bóveda USA', icon: '🗽', color: '#3b82f6' },
  { id: 'utilidades', nombre: 'Utilidades', icon: '💎', color: '#10b981' },
  { id: 'flete_sur', nombre: 'Flete Sur', icon: '🚚', color: '#f59e0b' },
  { id: 'azteca', nombre: 'Azteca', icon: '🏛️', color: '#ec4899' },
  { id: 'leftie', nombre: 'Leftie', icon: '🏦', color: '#6366f1' },
  { id: 'profit', nombre: 'Profit', icon: '💰', color: '#14b8a6' },
]

// ============================================================================
// MODAL WRAPPER COMPONENT
// ============================================================================

interface ModalWrapperProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  width?: 'sm' | 'md' | 'lg' | 'xl'
}

function ModalWrapper({ isOpen, onClose, title, icon, children, width = 'md' }: ModalWrapperProps) {
  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full ${widthClasses[width]} max-h-[90vh] overflow-hidden z-50`}
          >
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {icon}
                  </div>
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-5 max-h-[calc(90vh-140px)] overflow-y-auto">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// FORM FIELD COMPONENTS
// ============================================================================

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/80 text-sm">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}

// ============================================================================
// FORM: VENTA
// ============================================================================

interface FormVentaProps {
  isOpen: boolean
  onClose: () => void
  editData?: any
  onSuccess?: () => void
}

export function FormVenta({ isOpen, onClose, editData, onSuccess }: FormVentaProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: clientes, loading: loadingClientes } = useClientes()
  const { add, update } = useFirestoreCRUD<any>('ventas')
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<VentaFormData>({
    resolver: zodResolver(VentaSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      cantidad: 1,
      precioVentaUnidad: 0,
      precioCompraUnidad: 0,
      precioFlete: 0,
      estadoPago: 'pendiente',
      montoPagado: 0,
    }
  })
  
  // Watch values para cálculos en tiempo real
  const cantidad = watch('cantidad') || 0
  const precioVentaUnidad = watch('precioVentaUnidad') || 0
  const precioCompraUnidad = watch('precioCompraUnidad') || 0
  const precioFlete = watch('precioFlete') || 0
  const estadoPago = watch('estadoPago')
  const montoPagado = watch('montoPagado') || 0
  
  // Cálculos de distribución
  const calculos = useMemo(() => {
    const precioTotalVenta = precioVentaUnidad * cantidad
    const montoBovedaMonte = precioCompraUnidad * cantidad
    const montoFletes = precioFlete * cantidad
    const montoUtilidades = (precioVentaUnidad - precioCompraUnidad - precioFlete) * cantidad
    
    // Proporciones según estado de pago
    let proporcion = 1
    if (estadoPago === 'parcial' && precioTotalVenta > 0) {
      proporcion = montoPagado / precioTotalVenta
    } else if (estadoPago === 'pendiente') {
      proporcion = 0
    }
    
    return {
      precioTotalVenta,
      montoBovedaMonte,
      montoFletes,
      montoUtilidades,
      montoRestante: precioTotalVenta - montoPagado,
      // Distribución efectiva según proporción pagada
      efectivoBovedaMonte: montoBovedaMonte * proporcion,
      efectivoFletes: montoFletes * proporcion,
      efectivoUtilidades: montoUtilidades * proporcion,
    }
  }, [cantidad, precioVentaUnidad, precioCompraUnidad, precioFlete, estadoPago, montoPagado])
  
  // Cargar datos de edición
  useEffect(() => {
    if (editData) {
      reset({
        fecha: editData.fecha || new Date().toISOString().split('T')[0],
        clienteId: editData.clienteId || '',
        clienteNombre: editData.clienteNombre || '',
        ocRelacionada: editData.ocRelacionada || '',
        cantidad: editData.cantidad || 1,
        precioVentaUnidad: editData.precioVentaUnidad || 0,
        precioCompraUnidad: editData.precioCompraUnidad || 0,
        precioFlete: editData.precioFlete || 0,
        estadoPago: editData.estadoPago || 'pendiente',
        montoPagado: editData.montoPagado || 0,
        observaciones: editData.observaciones || '',
      })
    }
  }, [editData, reset])
  
  const onSubmit = async (data: VentaFormData) => {
    setIsSubmitting(true)
    
    try {
      // Encontrar nombre del cliente
      const cliente = clientes.find(c => c.id === data.clienteId)
      
      const ventaData = {
        ...data,
        clienteNombre: cliente?.nombre || data.clienteNombre || 'Cliente',
        precioTotalVenta: calculos.precioTotalVenta,
        montoBovedaMonte: calculos.montoBovedaMonte,
        montoFletes: calculos.montoFletes,
        montoUtilidades: calculos.montoUtilidades,
        montoRestante: calculos.montoRestante,
      }
      
      let success = false
      
      if (editData?.id) {
        success = await update(editData.id, ventaData)
      } else {
        const id = await add(ventaData)
        success = !!id
      }
      
      if (success) {
        toast({
          title: editData ? '✅ Venta actualizada' : '✅ Venta registrada',
          description: `Total: $${calculos.precioTotalVenta.toLocaleString('es-MX')}`
        })
        onSuccess?.()
        onClose()
        reset()
      }
    } catch (error) {
      logger.error('Error al guardar venta', error)
      toast({
        title: '❌ Error',
        description: 'No se pudo guardar la venta',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleClienteChange = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId)
    setValue('clienteId', clienteId)
    if (cliente) {
      setValue('clienteNombre', cliente.nombre)
    }
  }
  
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Editar Venta' : 'Nueva Venta'}
      icon={<DollarSign className="w-5 h-5 text-white" />}
      width="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Row 1: Fecha y Cliente */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha" error={errors.fecha?.message} required>
            <Input
              type="date"
              {...register('fecha')}
              className="bg-white/5 border-white/10 text-white"
            />
          </FormField>
          
          <FormField label="Cliente" error={errors.clienteId?.message} required>
            <Controller
              name="clienteId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={handleClienteChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingClientes ? (
                      <SelectItem value="loading" disabled>Cargando...</SelectItem>
                    ) : (
                      clientes.map(cliente => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </div>
        
        {/* Row 2: OC Relacionada y Cantidad */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="OC Relacionada">
            <Input
              {...register('ocRelacionada')}
              placeholder="Ej: OC0001"
              className="bg-white/5 border-white/10 text-white"
            />
          </FormField>
          
          <FormField label="Cantidad" error={errors.cantidad?.message} required>
            <Input
              type="number"
              {...register('cantidad', { valueAsNumber: true })}
              min={1}
              className="bg-white/5 border-white/10 text-white"
            />
          </FormField>
        </div>
        
        {/* Row 3: Precios */}
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Precio Venta/Unidad" error={errors.precioVentaUnidad?.message} required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <Input
                type="number"
                {...register('precioVentaUnidad', { valueAsNumber: true })}
                min={0}
                step="0.01"
                className="bg-white/5 border-white/10 text-white pl-7"
              />
            </div>
          </FormField>
          
          <FormField label="Costo Compra/Unidad" error={errors.precioCompraUnidad?.message} required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <Input
                type="number"
                {...register('precioCompraUnidad', { valueAsNumber: true })}
                min={0}
                step="0.01"
                className="bg-white/5 border-white/10 text-white pl-7"
              />
            </div>
          </FormField>
          
          <FormField label="Flete/Unidad" error={errors.precioFlete?.message}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <Input
                type="number"
                {...register('precioFlete', { valueAsNumber: true })}
                min={0}
                step="0.01"
                className="bg-white/5 border-white/10 text-white pl-7"
              />
            </div>
          </FormField>
        </div>
        
        {/* Row 4: Estado de Pago */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Estado de Pago" required>
            <Controller
              name="estadoPago"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completo">✅ Completo (100%)</SelectItem>
                    <SelectItem value="parcial">⏳ Parcial</SelectItem>
                    <SelectItem value="pendiente">❌ Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          
          {estadoPago === 'parcial' && (
            <FormField label="Monto Pagado">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <Input
                  type="number"
                  {...register('montoPagado', { valueAsNumber: true })}
                  min={0}
                  max={calculos.precioTotalVenta}
                  step="0.01"
                  className="bg-white/5 border-white/10 text-white pl-7"
                />
              </div>
            </FormField>
          )}
        </div>
        
        {/* Cálculos y Distribución */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-white font-medium">
            <Calculator className="w-4 h-4" />
            Distribución Automática
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between text-white/60">
                <span>Total Venta:</span>
                <span className="text-white font-medium">
                  ${calculos.precioTotalVenta.toLocaleString('es-MX')}
                </span>
              </div>
              {estadoPago !== 'completo' && (
                <div className="flex justify-between text-white/60">
                  <span>Restante por cobrar:</span>
                  <span className="text-orange-400 font-medium">
                    ${calculos.montoRestante.toLocaleString('es-MX')}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-white/60">
                <span>→ Bóveda Monte:</span>
                <span className="text-purple-400">${calculos.efectivoBovedaMonte.toLocaleString('es-MX')}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>→ Fletes:</span>
                <span className="text-yellow-400">${calculos.efectivoFletes.toLocaleString('es-MX')}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>→ Utilidades:</span>
                <span className="text-green-400">${calculos.efectivoUtilidades.toLocaleString('es-MX')}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Observaciones */}
        <FormField label="Observaciones">
          <Textarea
            {...register('observaciones')}
            placeholder="Notas adicionales..."
            className="bg-white/5 border-white/10 text-white min-h-[80px]"
          />
        </FormField>
        
        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-white/70 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editData ? 'Actualizar' : 'Guardar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// ============================================================================
// FORM: GASTO
// ============================================================================

interface FormGastoProps {
  isOpen: boolean
  onClose: () => void
  defaultBanco?: string
  onSuccess?: () => void
}

export function FormGasto({ isOpen, onClose, defaultBanco, onSuccess }: FormGastoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { add } = useFirestoreCRUD<any>('movimientos')
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<GastoFormData>({
    resolver: zodResolver(GastoSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      bancoOrigen: defaultBanco || '',
      monto: 0,
      concepto: '',
    }
  })
  
  useEffect(() => {
    if (defaultBanco) {
      reset(prev => ({ ...prev, bancoOrigen: defaultBanco }))
    }
  }, [defaultBanco, reset])
  
  const onSubmit = async (data: GastoFormData) => {
    setIsSubmitting(true)
    
    try {
      const banco = BANCOS.find(b => b.id === data.bancoOrigen)
      
      const gastoData = {
        ...data,
        tipo: 'gasto',
        tipoMovimiento: 'gasto',
        bancoNombre: banco?.nombre || data.bancoOrigen,
      }
      
      const id = await add(gastoData)
      
      if (id) {
        toast({
          title: '✅ Gasto registrado',
          description: `$${data.monto.toLocaleString('es-MX')} de ${banco?.nombre || data.bancoOrigen}`
        })
        onSuccess?.()
        onClose()
        reset()
      }
    } catch (error) {
      logger.error('Error al guardar gasto', error)
      toast({
        title: '❌ Error',
        description: 'No se pudo registrar el gasto',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Gasto"
      icon={<CreditCard className="w-5 h-5 text-white" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha" error={errors.fecha?.message} required>
            <Input
              type="date"
              {...register('fecha')}
              className="bg-white/5 border-white/10 text-white"
            />
          </FormField>
          
          <FormField label="Banco Origen" error={errors.bancoOrigen?.message} required>
            <Controller
              name="bancoOrigen"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Seleccionar banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANCOS.map(banco => (
                      <SelectItem key={banco.id} value={banco.id}>
                        <div className="flex items-center gap-2">
                          <span>{banco.icon}</span>
                          <span>{banco.nombre}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </div>
        
        <FormField label="Monto" error={errors.monto?.message} required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
            <Input
              type="number"
              {...register('monto', { valueAsNumber: true })}
              min={0}
              step="0.01"
              className="bg-white/5 border-white/10 text-white pl-7"
              placeholder="0.00"
            />
          </div>
        </FormField>
        
        <FormField label="Concepto" error={errors.concepto?.message} required>
          <Input
            {...register('concepto')}
            placeholder="Descripción del gasto..."
            className="bg-white/5 border-white/10 text-white"
          />
        </FormField>
        
        <FormField label="Categoría">
          <Controller
            name="categoria"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operativo">🔧 Operativo</SelectItem>
                  <SelectItem value="nomina">👥 Nómina</SelectItem>
                  <SelectItem value="servicios">⚡ Servicios</SelectItem>
                  <SelectItem value="transporte">🚚 Transporte</SelectItem>
                  <SelectItem value="mantenimiento">🛠️ Mantenimiento</SelectItem>
                  <SelectItem value="otro">📋 Otro</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        
        <FormField label="Observaciones">
          <Textarea
            {...register('observaciones')}
            placeholder="Notas adicionales..."
            className="bg-white/5 border-white/10 text-white min-h-[80px]"
          />
        </FormField>
        
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-white/70 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Registrar Gasto
              </>
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// ============================================================================
// FORM: TRANSFERENCIA
// ============================================================================

interface FormTransferenciaProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function FormTransferencia({ isOpen, onClose, onSuccess }: FormTransferenciaProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { add } = useFirestoreCRUD<any>('movimientos')
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors }
  } = useForm<TransferenciaFormData>({
    resolver: zodResolver(TransferenciaSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      monto: 0,
      concepto: 'Transferencia entre bancos',
    }
  })
  
  const bancoOrigen = watch('bancoOrigen')
  const bancoDestino = watch('bancoDestino')
  
  const onSubmit = async (data: TransferenciaFormData) => {
    setIsSubmitting(true)
    
    try {
      const origen = BANCOS.find(b => b.id === data.bancoOrigen)
      const destino = BANCOS.find(b => b.id === data.bancoDestino)
      
      // Crear dos movimientos: gasto en origen, ingreso en destino
      const movimientoSalida = {
        fecha: data.fecha,
        bancoId: data.bancoOrigen,
        bancoNombre: origen?.nombre,
        tipo: 'transferencia_salida',
        tipoMovimiento: 'gasto',
        monto: data.monto,
        concepto: `${data.concepto} → ${destino?.nombre}`,
        referenciaTransferencia: destino?.id,
      }
      
      const movimientoEntrada = {
        fecha: data.fecha,
        bancoId: data.bancoDestino,
        bancoNombre: destino?.nombre,
        tipo: 'transferencia_entrada',
        tipoMovimiento: 'ingreso',
        monto: data.monto,
        concepto: `${data.concepto} ← ${origen?.nombre}`,
        referenciaTransferencia: origen?.id,
      }
      
      await add(movimientoSalida)
      await add(movimientoEntrada)
      
      toast({
        title: '✅ Transferencia realizada',
        description: `$${data.monto.toLocaleString('es-MX')} de ${origen?.nombre} a ${destino?.nombre}`
      })
      onSuccess?.()
      onClose()
      reset()
    } catch (error) {
      logger.error('Error al realizar transferencia', error)
      toast({
        title: '❌ Error',
        description: 'No se pudo completar la transferencia',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Transferencia entre Bancos"
      icon={<ArrowRight className="w-5 h-5 text-white" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="Fecha" error={errors.fecha?.message} required>
          <Input
            type="date"
            {...register('fecha')}
            className="bg-white/5 border-white/10 text-white"
          />
        </FormField>
        
        {/* Selector visual de bancos */}
        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
          <FormField label="Banco Origen" error={errors.bancoOrigen?.message} required>
            <Controller
              name="bancoOrigen"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Desde" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANCOS.filter(b => b.id !== bancoDestino).map(banco => (
                      <SelectItem key={banco.id} value={banco.id}>
                        <div className="flex items-center gap-2">
                          <span>{banco.icon}</span>
                          <span>{banco.nombre}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          
          <div className="pt-6">
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <ArrowRight className="w-6 h-6 text-purple-400" />
            </motion.div>
          </div>
          
          <FormField label="Banco Destino" error={errors.bancoDestino?.message} required>
            <Controller
              name="bancoDestino"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Hacia" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANCOS.filter(b => b.id !== bancoOrigen).map(banco => (
                      <SelectItem key={banco.id} value={banco.id}>
                        <div className="flex items-center gap-2">
                          <span>{banco.icon}</span>
                          <span>{banco.nombre}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </div>
        
        <FormField label="Monto a Transferir" error={errors.monto?.message} required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
            <Input
              type="number"
              {...register('monto', { valueAsNumber: true })}
              min={0}
              step="0.01"
              className="bg-white/5 border-white/10 text-white pl-7 text-lg"
              placeholder="0.00"
            />
          </div>
        </FormField>
        
        <FormField label="Concepto" error={errors.concepto?.message} required>
          <Input
            {...register('concepto')}
            placeholder="Motivo de la transferencia..."
            className="bg-white/5 border-white/10 text-white"
          />
        </FormField>
        
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-white/70 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Transfiriendo...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Transferir
              </>
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// ============================================================================
// FORM: CLIENTE
// ============================================================================

interface FormClienteProps {
  isOpen: boolean
  onClose: () => void
  editData?: any
  onSuccess?: () => void
}

export function FormCliente({ isOpen, onClose, editData, onSuccess }: FormClienteProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { add, update } = useFirestoreCRUD<any>('clientes')
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<ClienteFormData>({
    resolver: zodResolver(ClienteSchema),
    defaultValues: {
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      tipo: 'regular',
      observaciones: '',
    }
  })
  
  useEffect(() => {
    if (editData) {
      reset({
        nombre: editData.nombre || '',
        telefono: editData.telefono || '',
        email: editData.email || '',
        direccion: editData.direccion || '',
        tipo: editData.tipo || 'regular',
        observaciones: editData.observaciones || '',
      })
    } else {
      reset({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        tipo: 'regular',
        observaciones: '',
      })
    }
  }, [editData, reset])
  
  const onSubmit = async (data: ClienteFormData) => {
    setIsSubmitting(true)
    
    try {
      const clienteData = {
        ...data,
        deudaTotal: editData?.deudaTotal || 0,
        totalComprado: editData?.totalComprado || 0,
        estado: 'activo',
      }
      
      let success = false
      
      if (editData?.id) {
        success = await update(editData.id, clienteData)
      } else {
        const id = await add(clienteData)
        success = !!id
      }
      
      if (success) {
        toast({
          title: editData ? '✅ Cliente actualizado' : '✅ Cliente registrado',
          description: data.nombre
        })
        onSuccess?.()
        onClose()
        reset()
      }
    } catch (error) {
      logger.error('Error al guardar cliente', error)
      toast({
        title: '❌ Error',
        description: 'No se pudo guardar el cliente',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Editar Cliente' : 'Nuevo Cliente'}
      icon={<User className="w-5 h-5 text-white" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nombre" error={errors.nombre?.message} required>
          <Input
            {...register('nombre')}
            placeholder="Nombre del cliente"
            className="bg-white/5 border-white/10 text-white"
          />
        </FormField>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Teléfono">
            <Input
              {...register('telefono')}
              placeholder="Ej: 555-123-4567"
              className="bg-white/5 border-white/10 text-white"
            />
          </FormField>
          
          <FormField label="Email" error={errors.email?.message}>
            <Input
              type="email"
              {...register('email')}
              placeholder="correo@ejemplo.com"
              className="bg-white/5 border-white/10 text-white"
            />
          </FormField>
        </div>
        
        <FormField label="Dirección">
          <Input
            {...register('direccion')}
            placeholder="Dirección del cliente"
            className="bg-white/5 border-white/10 text-white"
          />
        </FormField>
        
        <FormField label="Tipo de Cliente">
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mayorista">👑 Mayorista</SelectItem>
                  <SelectItem value="regular">👤 Regular</SelectItem>
                  <SelectItem value="menudeo">🛒 Menudeo</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        
        <FormField label="Observaciones">
          <Textarea
            {...register('observaciones')}
            placeholder="Notas sobre el cliente..."
            className="bg-white/5 border-white/10 text-white min-h-[80px]"
          />
        </FormField>
        
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-white/70 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editData ? 'Actualizar' : 'Guardar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// ============================================================================
// FORM: DISTRIBUIDOR
// ============================================================================

interface FormDistribuidorProps {
  isOpen: boolean
  onClose: () => void
  editData?: any
  onSuccess?: () => void
}

export function FormDistribuidor({ isOpen, onClose, editData, onSuccess }: FormDistribuidorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { add, update } = useFirestoreCRUD<any>('distribuidores')
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<DistribuidorFormData>({
    resolver: zodResolver(DistribuidorSchema),
    defaultValues: {
      nombre: '',
      empresa: '',
      telefono: '',
      email: '',
      origen: '',
      observaciones: '',
    }
  })
  
  useEffect(() => {
    if (editData) {
      reset({
        nombre: editData.nombre || '',
        empresa: editData.empresa || '',
        telefono: editData.telefono || '',
        email: editData.email || '',
        origen: editData.origen || '',
        observaciones: editData.observaciones || '',
      })
    } else {
      reset({
        nombre: '',
        empresa: '',
        telefono: '',
        email: '',
        origen: '',
        observaciones: '',
      })
    }
  }, [editData, reset])
  
  const onSubmit = async (data: DistribuidorFormData) => {
    setIsSubmitting(true)
    
    try {
      const distribuidorData = {
        ...data,
        deudaTotal: editData?.deudaTotal || 0,
        totalOrdenesCompra: editData?.totalOrdenesCompra || 0,
        estado: 'activo',
      }
      
      let success = false
      
      if (editData?.id) {
        success = await update(editData.id, distribuidorData)
      } else {
        const id = await add(distribuidorData)
        success = !!id
      }
      
      if (success) {
        toast({
          title: editData ? '✅ Distribuidor actualizado' : '✅ Distribuidor registrado',
          description: data.nombre
        })
        onSuccess?.()
        onClose()
        reset()
      }
    } catch (error) {
      logger.error('Error al guardar distribuidor', error)
      toast({
        title: '❌ Error',
        description: 'No se pudo guardar el distribuidor',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Editar Distribuidor' : 'Nuevo Distribuidor'}
      icon={<Truck className="w-5 h-5 text-white" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nombre / Alias" error={errors.nombre?.message} required>
          <Input
            {...register('nombre')}
            placeholder="Nombre o alias del distribuidor"
            className="bg-white/5 border-white/10 text-white"
          />
        </FormField>
        
        <FormField label="Empresa">
          <Input
            {...register('empresa')}
            placeholder="Nombre de la empresa"
            className="bg-white/5 border-white/10 text-white"
          />
        </FormField>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Teléfono">
            <Input
              {...register('telefono')}
              placeholder="Ej: 555-123-4567"
              className="bg-white/5 border-white/10 text-white"
            />
          </FormField>
          
          <FormField label="Email" error={errors.email?.message}>
            <Input
              type="email"
              {...register('email')}
              placeholder="correo@ejemplo.com"
              className="bg-white/5 border-white/10 text-white"
            />
          </FormField>
        </div>
        
        <FormField label="Origen / Ubicación">
          <Input
            {...register('origen')}
            placeholder="Ciudad o región del distribuidor"
            className="bg-white/5 border-white/10 text-white"
          />
        </FormField>
        
        <FormField label="Observaciones">
          <Textarea
            {...register('observaciones')}
            placeholder="Notas sobre el distribuidor..."
            className="bg-white/5 border-white/10 text-white min-h-[80px]"
          />
        </FormField>
        
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-white/70 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editData ? 'Actualizar' : 'Guardar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ModalWrapper,
  FormField,
  VentaSchema,
  OrdenCompraSchema,
  GastoSchema,
  TransferenciaSchema,
  ClienteSchema,
  DistribuidorSchema,
  BANCOS
}
