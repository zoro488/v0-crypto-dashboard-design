'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — FORMULARIO VENTA PREMIUM
// Wizard 4 pasos con distribución GYA automática
// ═══════════════════════════════════════════════════════════════

import { useState, useTransition, useMemo } from 'react'
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
  Percent
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/app/_lib/utils'
import { formatCurrency } from '@/app/_lib/utils/formatters'
import type { Cliente, Almacen } from '@/database/schema'

// ═══════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════

const VentaSchema = z.object({
  // Cliente
  clienteId: z.string().optional(),
  nuevoCliente: z.object({
    nombre: z.string().min(2, 'Nombre requerido'),
    email: z.string().email().optional().or(z.literal('')),
    telefono: z.string().optional(),
    direccion: z.string().optional(),
  }).optional(),
  
  // Producto
  cantidad: z.number().min(1, 'Cantidad mínima: 1'),
  precioVentaUnidad: z.number().min(0.01, 'Precio venta requerido'),
  precioCompraUnidad: z.number().min(0.01, 'Precio compra requerido'),
  precioFlete: z.number().min(0),
  
  // Pago
  estadoPago: z.enum(['pendiente', 'parcial', 'completo']),
  montoPagado: z.number().min(0).optional(),
  
  observaciones: z.string().optional(),
})

type VentaInput = z.infer<typeof VentaSchema>

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════

interface VentaFormProps {
  clientes: Cliente[]
  productos?: Almacen[]
  onSuccess?: () => void
  onCancel?: () => void
}

// ═══════════════════════════════════════════════════════════════
// DISTRIBUTION VISUALIZATION
// ═══════════════════════════════════════════════════════════════

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
    <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20">
      <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-400" />
        Distribución GYA Automática
      </h4>
      
      {/* Visual bars */}
      <div className="space-y-4 mb-6">
        {items.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0
          const Icon = item.icon
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-300">
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-white">{formatCurrency(item.value)}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
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
      
      {/* Total */}
      <div className="pt-4 border-t border-white/10 flex justify-between">
        <span className="text-gray-400">Total Distribución:</span>
        <span className="text-xl font-bold text-violet-400">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function VentaForm({ 
  clientes, 
  productos,
  onSuccess, 
  onCancel 
}: VentaFormProps) {
  const [step, setStep] = useState(0)
  const [isNewCliente, setIsNewCliente] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const steps = ['Cliente', 'Producto', 'Precios', 'Confirmar']
  
  const form = useForm<VentaInput>({
    resolver: zodResolver(VentaSchema),
    defaultValues: {
      cantidad: 1,
      precioVentaUnidad: 0,
      precioCompraUnidad: 0,
      precioFlete: 500,
      estadoPago: 'pendiente',
      montoPagado: 0,
    }
  })
  
  const watchedValues = form.watch()
  
  // ═══════════════════════════════════════════════════════════════
  // CÁLCULOS GYA (Fórmulas Verificadas)
  // ═══════════════════════════════════════════════════════════════
  
  const calculos = useMemo(() => {
    const cantidad = watchedValues.cantidad || 0
    const precioVenta = watchedValues.precioVentaUnidad || 0
    const precioCompra = watchedValues.precioCompraUnidad || 0
    const flete = watchedValues.precioFlete || 0
    
    // Precio total (precio venta ya incluye todo para el cliente)
    const precioTotalVenta = precioVenta * cantidad
    
    // Distribución GYA:
    // Bóveda Monte = Costo × Cantidad (lo que pagamos al distribuidor)
    const montoBovedaMonte = precioCompra * cantidad
    
    // Fletes = Flete × Cantidad
    const montoFletes = flete * cantidad
    
    // Utilidades = (Precio Venta - Costo - Flete) × Cantidad
    const montoUtilidades = (precioVenta - precioCompra - flete) * cantidad
    
    // Monto pagado según estado
    let montoPagadoReal = 0
    if (watchedValues.estadoPago === 'completo') {
      montoPagadoReal = precioTotalVenta
    } else if (watchedValues.estadoPago === 'parcial') {
      montoPagadoReal = watchedValues.montoPagado || 0
    }
    
    const montoRestante = precioTotalVenta - montoPagadoReal
    
    // Proporción para distribución según pago
    const proporcion = precioTotalVenta > 0 ? montoPagadoReal / precioTotalVenta : 0
    
    // Lo que realmente entra al capital (según pago)
    const capitalBovedaMonte = montoBovedaMonte * proporcion
    const capitalFletes = montoFletes * proporcion
    const capitalUtilidades = montoUtilidades * proporcion
    
    return {
      precioTotalVenta,
      montoBovedaMonte,
      montoFletes,
      montoUtilidades,
      montoPagadoReal,
      montoRestante,
      proporcion,
      capitalBovedaMonte,
      capitalFletes,
      capitalUtilidades,
      margenUnitario: precioVenta - precioCompra - flete,
      margenTotal: montoUtilidades,
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
  
  const handleSubmit = form.handleSubmit(async (data) => {
    startTransition(async () => {
      try {
        // Crear cliente si es nuevo
        let clienteId = data.clienteId
        
        if (isNewCliente && data.nuevoCliente) {
          const res = await fetch('/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.nuevoCliente),
          })
          const result = await res.json()
          if (!result.success) throw new Error(result.error)
          clienteId = result.data.id
        }
        
        // Determinar monto pagado
        let montoPagado = 0
        if (data.estadoPago === 'completo') {
          montoPagado = calculos.precioTotalVenta
        } else if (data.estadoPago === 'parcial') {
          montoPagado = data.montoPagado || 0
        }
        
        // Crear venta
        const ventaRes = await fetch('/api/ventas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteId,
            cantidad: data.cantidad,
            precioVentaUnidad: data.precioVentaUnidad,
            precioCompraUnidad: data.precioCompraUnidad,
            precioFlete: data.precioFlete,
            estadoPago: data.estadoPago,
            montoPagado,
            observaciones: data.observaciones,
          }),
        })
        const ventaResult = await ventaRes.json()
        if (!ventaResult.success) throw new Error(ventaResult.error)
        
        toast.success('Venta registrada exitosamente', {
          description: `${data.cantidad} unidades por ${formatCurrency(calculos.precioTotalVenta)}`,
        })
        onSuccess?.()
      } catch (error) {
        toast.error('Error al registrar venta', {
          description: error instanceof Error ? error.message : 'Intenta de nuevo',
        })
      }
    })
  })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="glass-panel rounded-3xl p-8 border border-violet-500/20">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center"
          >
            <ShoppingCart className="w-8 h-8 text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Nueva Venta</h2>
          <p className="text-gray-400">Registra venta con distribución automática a 3 bancos</p>
        </div>
        
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <motion.div
                animate={{
                  scale: index === step ? 1.1 : 1,
                  backgroundColor: index <= step ? '#22C55E' : 'rgba(255,255,255,0.1)',
                }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  index <= step ? 'text-white' : 'text-gray-500'
                )}
              >
                {index < step ? <Check className="w-5 h-5" /> : index + 1}
              </motion.div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-12 h-0.5 mx-2 transition-all",
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
                className="space-y-6"
              >
                <div className="flex gap-4 p-1 bg-white/5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsNewCliente(false)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all",
                      !isNewCliente ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'
                    )}
                  >
                    Cliente Existente
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewCliente(true)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all",
                      isNewCliente ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'
                    )}
                  >
                    Nuevo Cliente
                  </button>
                </div>
                
                {!isNewCliente ? (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Seleccionar Cliente</label>
                    <select
                      {...form.register('clienteId')}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    >
                      <option value="">Seleccionar...</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} {c.saldoPendiente ? `(Deuda: ${formatCurrency(c.saldoPendiente)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Nombre del Cliente *</label>
                      <input
                        {...form.register('nuevoCliente.nombre')}
                        placeholder="Nombre completo"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">Teléfono</label>
                        <input
                          {...form.register('nuevoCliente.telefono')}
                          placeholder="+52 555 123 4567"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">Email</label>
                        <input
                          {...form.register('nuevoCliente.email')}
                          type="email"
                          placeholder="email@ejemplo.com"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
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
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Cantidad de Productos</label>
                  <input
                    type="number"
                    {...form.register('cantidad', { valueAsNumber: true })}
                    min={1}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-3xl font-bold text-center focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
                
                {productos && productos.length > 0 && (
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-sm text-yellow-400 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Stock disponible: {productos[0]?.cantidad || 0} unidades
                    </p>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Step 2: Precios y Pago */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Precio Venta/Unidad *</label>
                    <input
                      type="number"
                      {...form.register('precioVentaUnidad', { valueAsNumber: true })}
                      min={0}
                      step="0.01"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xl font-bold focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Precio Compra/Unidad *</label>
                    <input
                      type="number"
                      {...form.register('precioCompraUnidad', { valueAsNumber: true })}
                      min={0}
                      step="0.01"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xl font-bold focus:border-green-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Flete por Unidad (USD)
                  </label>
                  <input
                    type="number"
                    {...form.register('precioFlete', { valueAsNumber: true })}
                    min={0}
                    step="0.01"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-green-500"
                  />
                  <p className="text-xs text-gray-500">Default: $500 USD por unidad</p>
                </div>
                
                {/* Margen info */}
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Margen por unidad:</span>
                    <span className={cn(
                      "font-bold",
                      calculos.margenUnitario >= 0 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {formatCurrency(calculos.margenUnitario)} ({calculos.margenPorcentaje.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                
                {/* Estado de pago */}
                <div className="space-y-4">
                  <label className="text-sm text-gray-400">Estado del Pago</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['completo', 'parcial', 'pendiente'] as const).map(estado => (
                      <button
                        key={estado}
                        type="button"
                        onClick={() => form.setValue('estadoPago', estado)}
                        className={cn(
                          "py-3 px-4 rounded-xl text-sm font-medium transition-all capitalize",
                          watchedValues.estadoPago === estado
                            ? estado === 'completo' ? 'bg-green-500 text-white'
                            : estado === 'parcial' ? 'bg-yellow-500 text-black'
                            : 'bg-red-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        )}
                      >
                        {estado}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Monto parcial */}
                <AnimatePresence>
                  {watchedValues.estadoPago === 'parcial' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-sm text-gray-400">Monto Abonado</label>
                      <input
                        type="number"
                        {...form.register('montoPagado', { valueAsNumber: true })}
                        min={0}
                        max={calculos.precioTotalVenta}
                        step="0.01"
                        className="w-full px-4 py-3 bg-white/5 border border-yellow-500/50 rounded-xl text-white focus:border-yellow-500"
                      />
                      <p className="text-xs text-gray-500">
                        Restante: {formatCurrency(calculos.montoRestante)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
            
            {/* Step 3: Confirmación */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                {/* Resumen */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Cliente:</span>
                    <span className="text-white font-medium">
                      {isNewCliente 
                        ? watchedValues.nuevoCliente?.nombre 
                        : clientes.find(c => c.id === watchedValues.clienteId)?.nombre
                      }
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Cantidad:</span>
                    <span className="text-white font-medium">{watchedValues.cantidad} unidades</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Precio Total:</span>
                    <span className="text-white font-bold">{formatCurrency(calculos.precioTotalVenta)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Estado:</span>
                    <span className={cn(
                      "font-medium capitalize",
                      watchedValues.estadoPago === 'completo' ? 'text-green-400' :
                      watchedValues.estadoPago === 'parcial' ? 'text-yellow-400' : 'text-red-400'
                    )}>
                      {watchedValues.estadoPago}
                    </span>
                  </div>
                  {watchedValues.estadoPago !== 'pendiente' && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-400">Pagado:</span>
                      <span className="text-green-400 font-bold">{formatCurrency(calculos.montoPagadoReal)}</span>
                    </div>
                  )}
                  {calculos.montoRestante > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-400">Pendiente:</span>
                      <span className="text-red-400 font-bold">{formatCurrency(calculos.montoRestante)}</span>
                    </div>
                  )}
                </div>
                
                {/* Distribución GYA */}
                <GYADistribution
                  bovedaMonte={calculos.capitalBovedaMonte}
                  fletes={calculos.capitalFletes}
                  utilidades={calculos.capitalUtilidades}
                />
                
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
          
          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 px-6 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>
            )}
            
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Registrar Venta
                  </>
                )}
              </button>
            )}
          </div>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Cancelar
            </button>
          )}
        </form>
      </div>
    </motion.div>
  )
}

export default VentaForm
