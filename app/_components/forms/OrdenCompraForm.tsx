'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — FORMULARIO ORDEN DE COMPRA
// Wizard premium con creación automática de distribuidor
// ═══════════════════════════════════════════════════════════════

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Package, 
  Truck, 
  DollarSign, 
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  User,
  Phone,
  Mail,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/app/_lib/utils'
import { formatCurrency } from '@/app/_lib/utils/formatters'
import { BANCOS_CONFIG, BANCOS_ORDENADOS } from '@/app/_lib/constants/bancos'
import type { Distribuidor, Banco } from '@/database/schema'

// ═══════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════

const OrdenCompraSchema = z.object({
  // Distribuidor (nuevo o existente)
  distribuidorId: z.string().optional(),
  nuevoDistribuidor: z.object({
    nombre: z.string().min(2, 'Nombre requerido'),
    empresa: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    tipoProductos: z.string().optional(),
  }).optional(),
  
  // Orden de compra
  cantidad: z.number().min(1, 'Cantidad mínima: 1'),
  precioUnitario: z.number().min(0.01, 'Precio requerido'),
  bancoOrigenId: z.string().min(1, 'Selecciona banco origen'),
  observaciones: z.string().optional(),
})

type OrdenCompraInput = z.infer<typeof OrdenCompraSchema>

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════

interface OrdenCompraFormProps {
  distribuidores: Distribuidor[]
  bancos: Banco[]
  onSuccess?: () => void
  onCancel?: () => void
}

// ═══════════════════════════════════════════════════════════════
// STEP INDICATOR
// ═══════════════════════════════════════════════════════════════

function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <motion.div
            animate={{
              scale: index === currentStep ? 1.1 : 1,
              backgroundColor: index <= currentStep ? '#8B00FF' : 'rgba(255,255,255,0.1)',
            }}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
              index <= currentStep ? 'text-white' : 'text-gray-500'
            )}
          >
            {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
          </motion.div>
          {index < steps.length - 1 && (
            <div 
              className={cn(
                "w-12 h-0.5 mx-2 transition-all",
                index < currentStep ? 'bg-violet-500' : 'bg-white/10'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function OrdenCompraForm({ 
  distribuidores, 
  bancos, 
  onSuccess, 
  onCancel 
}: OrdenCompraFormProps) {
  const [step, setStep] = useState(0)
  const [isNewDistribuidor, setIsNewDistribuidor] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const steps = ['Distribuidor', 'Productos', 'Pago', 'Confirmar']
  
  const form = useForm<OrdenCompraInput>({
    resolver: zodResolver(OrdenCompraSchema),
    defaultValues: {
      cantidad: 1,
      precioUnitario: 0,
      bancoOrigenId: 'boveda_monte',
    }
  })
  
  const watchedValues = form.watch()
  
  // Cálculos
  const total = (watchedValues.cantidad || 0) * (watchedValues.precioUnitario || 0)
  
  const selectedBanco = bancos.find(b => b.id === watchedValues.bancoOrigenId)
  const hasEnoughCapital = selectedBanco ? (selectedBanco.capitalActual || 0) >= total : false
  
  const handleNext = async () => {
    let isValid = true
    
    if (step === 0) {
      if (isNewDistribuidor) {
        isValid = await form.trigger('nuevoDistribuidor')
      } else {
        isValid = !!watchedValues.distribuidorId
      }
    } else if (step === 1) {
      isValid = await form.trigger(['cantidad', 'precioUnitario'])
    } else if (step === 2) {
      isValid = await form.trigger('bancoOrigenId') && hasEnoughCapital
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
        // Crear distribuidor si es nuevo
        let distribuidorId = data.distribuidorId
        
        if (isNewDistribuidor && data.nuevoDistribuidor) {
          const res = await fetch('/api/distribuidores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.nuevoDistribuidor),
          })
          const result = await res.json()
          if (!result.success) throw new Error(result.error)
          distribuidorId = result.data.id
        }
        
        // Crear orden de compra
        const ordenRes = await fetch('/api/ordenes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            distribuidorId,
            cantidad: data.cantidad,
            precioUnitario: data.precioUnitario,
            bancoOrigenId: data.bancoOrigenId,
            observaciones: data.observaciones,
          }),
        })
        const ordenResult = await ordenRes.json()
        if (!ordenResult.success) throw new Error(ordenResult.error)
        
        toast.success('Orden de compra creada exitosamente', {
          description: `OC ${ordenResult.data.numeroOrden} registrada`,
        })
        onSuccess?.()
      } catch (error) {
        toast.error('Error al crear orden', {
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
      {/* Glass container */}
      <div className="glass-panel rounded-3xl p-8 border border-violet-500/20">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center"
          >
            <Package className="w-8 h-8 text-violet-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Nueva Orden de Compra</h2>
          <p className="text-gray-400">Registra compra y actualiza inventario automáticamente</p>
        </div>
        
        {/* Step indicator */}
        <StepIndicator currentStep={step} steps={steps} />
        
        {/* Form content */}
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {/* Step 0: Distribuidor */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                {/* Toggle nuevo/existente */}
                <div className="flex gap-4 p-1 bg-white/5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsNewDistribuidor(false)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all",
                      !isNewDistribuidor 
                        ? 'bg-violet-500 text-white' 
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    Distribuidor Existente
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewDistribuidor(true)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all",
                      isNewDistribuidor 
                        ? 'bg-violet-500 text-white' 
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    Nuevo Distribuidor
                  </button>
                </div>
                
                {!isNewDistribuidor ? (
                  // Selector de distribuidor existente
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Seleccionar Distribuidor</label>
                    <select
                      {...form.register('distribuidorId')}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    >
                      <option value="">Seleccionar...</option>
                      {distribuidores.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.nombre} {d.empresa ? `(${d.empresa})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  // Formulario nuevo distribuidor
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                          <User className="w-4 h-4" /> Nombre *
                        </label>
                        <input
                          {...form.register('nuevoDistribuidor.nombre')}
                          placeholder="Nombre del distribuidor"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                          <Building2 className="w-4 h-4" /> Empresa
                        </label>
                        <input
                          {...form.register('nuevoDistribuidor.empresa')}
                          placeholder="Nombre de empresa"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                          <Phone className="w-4 h-4" /> Teléfono
                        </label>
                        <input
                          {...form.register('nuevoDistribuidor.telefono')}
                          placeholder="+52 555 123 4567"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                          <Mail className="w-4 h-4" /> Email
                        </label>
                        <input
                          {...form.register('nuevoDistribuidor.email')}
                          type="email"
                          placeholder="email@ejemplo.com"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Tipo de Productos
                      </label>
                      <input
                        {...form.register('nuevoDistribuidor.tipoProductos')}
                        placeholder="Ej: Electrónicos, Ropa, Alimentos..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Step 1: Productos */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Cantidad *</label>
                    <input
                      type="number"
                      {...form.register('cantidad', { valueAsNumber: true })}
                      min={1}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold text-center focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Precio Unitario (USD) *</label>
                    <input
                      type="number"
                      {...form.register('precioUnitario', { valueAsNumber: true })}
                      min={0}
                      step="0.01"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold text-center focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                  </div>
                </div>
                
                {/* Resumen de cálculo */}
                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-violet-400">{formatCurrency(total)}</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Step 2: Banco origen */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <p className="text-center text-gray-400 mb-4">
                  Selecciona el banco desde donde se pagará la orden
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {bancos.map(banco => {
                    const config = BANCOS_CONFIG[banco.id as keyof typeof BANCOS_CONFIG]
                    const isSelected = watchedValues.bancoOrigenId === banco.id
                    const hasEnough = (banco.capitalActual || 0) >= total
                    
                    return (
                      <button
                        key={banco.id}
                        type="button"
                        onClick={() => form.setValue('bancoOrigenId', banco.id)}
                        disabled={!hasEnough}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all",
                          isSelected 
                            ? 'bg-violet-500/20 border-violet-500' 
                            : 'bg-white/5 border-white/10 hover:border-white/20',
                          !hasEnough && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: config?.color + '33' }}
                          >
                            <Building2 className="w-4 h-4" style={{ color: config?.color }} />
                          </div>
                          <span className="font-medium text-white">{banco.nombre}</span>
                        </div>
                        <p className={cn(
                          "text-lg font-bold",
                          hasEnough ? 'text-green-400' : 'text-red-400'
                        )}>
                          {formatCurrency(banco.capitalActual || 0)}
                        </p>
                        {!hasEnough && (
                          <p className="text-xs text-red-400 mt-1">Capital insuficiente</p>
                        )}
                      </button>
                    )
                  })}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Observaciones (opcional)</label>
                  <textarea
                    {...form.register('observaciones')}
                    rows={3}
                    placeholder="Notas adicionales sobre la orden..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-none"
                  />
                </div>
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
                <div className="text-center mb-6">
                  <Sparkles className="w-12 h-12 text-violet-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white">Confirmar Orden de Compra</h3>
                </div>
                
                <div className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Distribuidor:</span>
                    <span className="text-white font-medium">
                      {isNewDistribuidor 
                        ? watchedValues.nuevoDistribuidor?.nombre 
                        : distribuidores.find(d => d.id === watchedValues.distribuidorId)?.nombre
                      }
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Cantidad:</span>
                    <span className="text-white font-medium">{watchedValues.cantidad} unidades</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Precio Unitario:</span>
                    <span className="text-white font-medium">{formatCurrency(watchedValues.precioUnitario || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Banco origen:</span>
                    <span className="text-white font-medium">{selectedBanco?.nombre}</span>
                  </div>
                  <div className="flex justify-between py-4 mt-4 bg-violet-500/10 rounded-xl px-4">
                    <span className="text-white font-bold">TOTAL A PAGAR:</span>
                    <span className="text-2xl font-bold text-violet-400">{formatCurrency(total)}</span>
                  </div>
                </div>
                
                <p className="text-center text-sm text-gray-400">
                  Al confirmar, se creará la orden, se actualizará el stock y se registrará el adeudo al distribuidor.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Navigation buttons */}
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
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar Orden
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Cancel button */}
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

export default OrdenCompraForm
