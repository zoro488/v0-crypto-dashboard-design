'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — MODAL VENTA
// Wizard 4 pasos con distribución GYA automática usando Zustand
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ShoppingCart, 
  User, 
  Package, 
  DollarSign,
  Truck,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  PiggyBank,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/app/_lib/utils'
import { formatCurrency } from '@/app/_lib/utils/formatters'
import { Modal, Button, ModalFooter } from '../ui/Modal'
import { useChronosStore, type CrearVentaInput } from '@/app/lib/store'
import type { Cliente } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

const VentaSchema = z.object({
  clienteId: z.string().optional(),
  nuevoCliente: z.object({
    nombre: z.string().min(2, 'Nombre requerido'),
    telefono: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
  }).optional(),
  cantidad: z.number().min(1, 'Cantidad mínima: 1'),
  precioVentaUnidad: z.number().min(0.01, 'Precio venta requerido'),
  precioCompraUnidad: z.number().min(0.01, 'Precio compra requerido'),
  precioFlete: z.number().min(0),
  estadoPago: z.enum(['pendiente', 'parcial', 'completo']),
  montoPagado: z.number().min(0).optional(),
  observaciones: z.string().optional(),
})

type VentaFormData = z.infer<typeof VentaSchema>

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface VentaModalProps {
  isOpen: boolean
  onClose: () => void
  ocRelacionada?: string // ID de la OC para tomar precioCompra
}

// ═══════════════════════════════════════════════════════════════════════════
// DISTRIBUTION VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════

function GYADistribution({ 
  bovedaMonte, 
  fletes, 
  utilidades 
}: { 
  bovedaMonte: number
  fletes: number
  utilidades: number
}) {
  const total = bovedaMonte + fletes + utilidades
  
  const items = [
    { name: 'Bóveda Monte', value: bovedaMonte, color: '#3B82F6', icon: Building2 },
    { name: 'Fletes', value: fletes, color: '#06B6D4', icon: Truck },
    { name: 'Utilidades', value: utilidades, color: '#22C55E', icon: PiggyBank },
  ]
  
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20">
      <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-400" />
        Distribución GYA Automática
      </h4>
      
      <div className="space-y-3">
        {items.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0
          const Icon = item.icon
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-1"
            >
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-300">
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-white">{formatCurrency(item.value)}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
      
      <div className="pt-3 mt-3 border-t border-white/10 flex justify-between">
        <span className="text-gray-400 text-sm">Total:</span>
        <span className="text-lg font-bold text-violet-400">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function VentaModal({ isOpen, onClose, ocRelacionada }: VentaModalProps) {
  const [step, setStep] = useState(0)
  const [isNewCliente, setIsNewCliente] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  // Zustand store
  const { clientes, ordenesCompra, crearVenta, crearCliente } = useChronosStore()
  
  // OC relacionada para tomar precioCompra
  const ocData = ocRelacionada ? ordenesCompra.find(o => o.id === ocRelacionada) : null
  
  const steps = ['Cliente', 'Producto', 'Precios', 'Confirmar']
  
  const form = useForm<VentaFormData>({
    resolver: zodResolver(VentaSchema),
    defaultValues: {
      cantidad: 1,
      precioVentaUnidad: 0,
      precioCompraUnidad: ocData?.costoPorUnidad || 0,
      precioFlete: 500,
      estadoPago: 'pendiente',
      montoPagado: 0,
    }
  })
  
  const watchedValues = form.watch()
  
  // ═══════════════════════════════════════════════════════════════════════
  // CÁLCULOS GYA
  // ═══════════════════════════════════════════════════════════════════════
  
  const calculos = useMemo(() => {
    const cantidad = watchedValues.cantidad || 0
    const precioVenta = watchedValues.precioVentaUnidad || 0
    const precioCompra = watchedValues.precioCompraUnidad || 0
    const flete = watchedValues.precioFlete || 0
    
    const precioTotalVenta = precioVenta * cantidad
    const montoBovedaMonte = precioCompra * cantidad
    const montoFletes = flete * cantidad
    const montoUtilidades = (precioVenta - precioCompra - flete) * cantidad
    
    let montoPagadoReal = 0
    if (watchedValues.estadoPago === 'completo') {
      montoPagadoReal = precioTotalVenta
    } else if (watchedValues.estadoPago === 'parcial') {
      montoPagadoReal = watchedValues.montoPagado || 0
    }
    
    const montoRestante = precioTotalVenta - montoPagadoReal
    const proporcion = precioTotalVenta > 0 ? montoPagadoReal / precioTotalVenta : 0
    
    return {
      precioTotalVenta,
      montoBovedaMonte,
      montoFletes,
      montoUtilidades,
      montoPagadoReal,
      montoRestante,
      proporcion,
      capitalBovedaMonte: montoBovedaMonte * proporcion,
      capitalFletes: montoFletes * proporcion,
      capitalUtilidades: montoUtilidades * proporcion,
      margenPorcentaje: precioVenta > 0 ? ((precioVenta - precioCompra - flete) / precioVenta) * 100 : 0,
    }
  }, [watchedValues])
  
  const handleNext = async () => {
    let isValid = true
    
    if (step === 0) {
      if (isNewCliente) {
        isValid = await form.trigger('nuevoCliente')
      } else {
        isValid = !!watchedValues.clienteId
      }
    } else if (step === 1) {
      isValid = await form.trigger('cantidad')
    } else if (step === 2) {
      isValid = await form.trigger(['precioVentaUnidad', 'precioCompraUnidad', 'precioFlete', 'estadoPago'])
      if (watchedValues.estadoPago === 'parcial') {
        isValid = isValid && (watchedValues.montoPagado || 0) > 0
      }
    }
    
    if (isValid && step < steps.length - 1) {
      setStep(step + 1)
    }
  }
  
  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }
  
  const handleReset = () => {
    form.reset()
    setStep(0)
    setIsNewCliente(false)
  }
  
  const handleSubmit = form.handleSubmit(async (data) => {
    startTransition(async () => {
      try {
        // Crear cliente si es nuevo
        let clienteId = data.clienteId
        let clienteNombre = ''
        
        if (isNewCliente && data.nuevoCliente) {
          // Primero crear en la API
          const clienteResponse = await fetch('/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre: data.nuevoCliente.nombre,
              telefono: data.nuevoCliente.telefono || '',
              email: data.nuevoCliente.email || '',
            }),
          })
          
          if (!clienteResponse.ok) {
            throw new Error('Error al crear cliente')
          }
          
          const clienteData = await clienteResponse.json()
          clienteId = clienteData.clienteId
          clienteNombre = data.nuevoCliente.nombre
          
          // También crear en Zustand para UI inmediata
          crearCliente({
            nombre: data.nuevoCliente.nombre,
            telefono: data.nuevoCliente.telefono || '',
            email: data.nuevoCliente.email || '',
            direccion: '',
            actual: 0,
            deuda: 0,
            abonos: 0,
            pendiente: 0,
            totalVentas: 0,
            totalPagado: 0,
            deudaTotal: 0,
            numeroCompras: 0,
            keywords: [data.nuevoCliente.nombre.toLowerCase()],
            estado: 'activo',
          } as Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>)
        } else {
          const cliente = clientes.find(c => c.id === clienteId)
          clienteNombre = cliente?.nombre || 'Cliente'
        }
        
        // Determinar monto pagado
        let montoPagado = 0
        if (data.estadoPago === 'completo') {
          montoPagado = calculos.precioTotalVenta
        } else if (data.estadoPago === 'parcial') {
          montoPagado = data.montoPagado || 0
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // PERSISTIR EN API (Turso/Drizzle) con distribución GYA automática
        // ═══════════════════════════════════════════════════════════════════
        
        const ventaResponse = await fetch('/api/ventas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteId: clienteId || '',
            cantidad: data.cantidad,
            precioVentaUnidad: data.precioVentaUnidad,
            precioCompraUnidad: data.precioCompraUnidad,
            precioFlete: data.precioFlete,
            montoPagado,
            observaciones: data.observaciones,
            ocRelacionada: ocRelacionada,
          }),
        })
        
        if (!ventaResponse.ok) {
          const errorData = await ventaResponse.json()
          throw new Error(errorData.error || 'Error al crear venta')
        }
        
        const ventaData = await ventaResponse.json()
        
        // También crear en Zustand para UI inmediata
        const ventaInput: CrearVentaInput = {
          cliente: clienteNombre,
          clienteId: clienteId || '',
          cantidad: data.cantidad,
          precioVenta: data.precioVentaUnidad,
          precioCompra: data.precioCompraUnidad,
          flete: data.precioFlete > 0 ? 'Aplica' : 'NoAplica',
          fleteUtilidad: data.precioFlete * data.cantidad,
          ocRelacionada: ocRelacionada,
          estadoPago: data.estadoPago,
          estatus: data.estadoPago === 'completo' ? 'Pagado' : data.estadoPago === 'parcial' ? 'Parcial' : 'Pendiente',
          montoPagado,
          montoRestante: calculos.montoRestante,
          fecha: new Date().toISOString().split('T')[0],
          notas: data.observaciones,
        }
        
        crearVenta(ventaInput)
        
        toast.success('Venta registrada exitosamente', {
          description: `${data.cantidad} unidades por ${formatCurrency(calculos.precioTotalVenta)} - Distribuido a 3 bancos`,
        })
        
        handleReset()
        onClose()
      } catch (error) {
        toast.error('Error al registrar venta', {
          description: error instanceof Error ? error.message : 'Intenta de nuevo',
        })
      }
    })
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Venta"
      subtitle="Registra venta con distribución automática a 3 bancos"
      size="lg"
    >
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((stepName, index) => (
          <div key={stepName} className="flex items-center">
            <motion.div
              animate={{
                scale: index === step ? 1.1 : 1,
                backgroundColor: index <= step ? '#22C55E' : 'rgba(255,255,255,0.1)',
              }}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                index <= step ? 'text-white' : 'text-gray-500'
              )}
            >
              {index < step ? <Check className="w-4 h-4" /> : index + 1}
            </motion.div>
            {index < steps.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 mx-1 transition-all",
                index < step ? 'bg-green-500' : 'bg-white/10'
              )} />
            )}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {/* Step 0: Cliente */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsNewCliente(false)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                    !isNewCliente ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'
                  )}
                >
                  Existente
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewCliente(true)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                    isNewCliente ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'
                  )}
                >
                  Nuevo
                </button>
              </div>
              
              {!isNewCliente ? (
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Seleccionar Cliente</label>
                  <select
                    {...form.register('clienteId')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-green-500"
                  >
                    <option value="">Seleccionar...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {(c.deuda || 0) > 0 ? `(Deuda: ${formatCurrency(c.deuda || 0)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Nombre *</label>
                    <input
                      {...form.register('nuevoCliente.nombre')}
                      placeholder="Nombre completo"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Teléfono</label>
                      <input
                        {...form.register('nuevoCliente.telefono')}
                        placeholder="+52 555 123 4567"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Email</label>
                      <input
                        {...form.register('nuevoCliente.email')}
                        type="email"
                        placeholder="email@ejemplo.com"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Step 1: Producto */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Cantidad de Productos</label>
                <input
                  type="number"
                  {...form.register('cantidad', { valueAsNumber: true })}
                  min={1}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-3xl font-bold text-center focus:border-green-500"
                />
              </div>
              
              {ocData && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-400 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Stock disponible (OC): {ocData.stockActual || 0} unidades
                  </p>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Step 2: Precios */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Precio Venta/Unidad</label>
                  <input
                    type="number"
                    {...form.register('precioVentaUnidad', { valueAsNumber: true })}
                    min={0}
                    step="0.01"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-bold focus:border-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Precio Compra/Unidad</label>
                  <input
                    type="number"
                    {...form.register('precioCompraUnidad', { valueAsNumber: true })}
                    min={0}
                    step="0.01"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-bold focus:border-green-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Flete por Unidad</label>
                <input
                  type="number"
                  {...form.register('precioFlete', { valueAsNumber: true })}
                  min={0}
                  step="0.01"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-green-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Estado de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pendiente', 'parcial', 'completo'] as const).map(estado => (
                    <button
                      key={estado}
                      type="button"
                      onClick={() => form.setValue('estadoPago', estado)}
                      className={cn(
                        "py-2 px-3 rounded-lg text-sm font-medium transition-all capitalize",
                        watchedValues.estadoPago === estado
                          ? estado === 'completo' ? 'bg-green-500 text-white'
                          : estado === 'parcial' ? 'bg-yellow-500 text-black'
                          : 'bg-red-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:text-white'
                      )}
                    >
                      {estado}
                    </button>
                  ))}
                </div>
              </div>
              
              {watchedValues.estadoPago === 'parcial' && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Monto Pagado</label>
                  <input
                    type="number"
                    {...form.register('montoPagado', { valueAsNumber: true })}
                    min={0}
                    max={calculos.precioTotalVenta}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-yellow-500"
                  />
                </div>
              )}
            </motion.div>
          )}
          
          {/* Step 3: Confirmar */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              {/* Resumen */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cantidad:</span>
                  <span className="text-white font-medium">{watchedValues.cantidad} unidades</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Venta:</span>
                  <span className="text-white font-bold">{formatCurrency(calculos.precioTotalVenta)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estado:</span>
                  <span className={cn(
                    "font-medium capitalize",
                    watchedValues.estadoPago === 'completo' ? 'text-green-400'
                    : watchedValues.estadoPago === 'parcial' ? 'text-yellow-400'
                    : 'text-red-400'
                  )}>
                    {watchedValues.estadoPago}
                  </span>
                </div>
                {watchedValues.estadoPago !== 'pendiente' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pagado:</span>
                    <span className="text-green-400 font-medium">{formatCurrency(calculos.montoPagadoReal)}</span>
                  </div>
                )}
                {calculos.montoRestante > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Restante:</span>
                    <span className="text-red-400 font-medium">{formatCurrency(calculos.montoRestante)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                  <span className="text-gray-400">Margen:</span>
                  <span className="text-violet-400 font-medium">{calculos.margenPorcentaje.toFixed(1)}%</span>
                </div>
              </div>
              
              {/* Distribución GYA */}
              <GYADistribution 
                bovedaMonte={calculos.montoBovedaMonte}
                fletes={calculos.montoFletes}
                utilidades={calculos.montoUtilidades}
              />
              
              {/* Observaciones */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Observaciones (opcional)</label>
                <textarea
                  {...form.register('observaciones')}
                  rows={2}
                  placeholder="Notas adicionales..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500 resize-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <ModalFooter>
          {step > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Anterior
            </Button>
          )}
          
          {step < steps.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              type="submit"
              isLoading={isPending}
              icon={<Check className="w-4 h-4" />}
            >
              Registrar Venta
            </Button>
          )}
        </ModalFooter>
      </form>
    </Modal>
  )
}
