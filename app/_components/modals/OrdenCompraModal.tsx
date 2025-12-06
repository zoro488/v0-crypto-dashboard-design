'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — MODAL ORDEN DE COMPRA
// Wizard con creación automática de distribuidor usando Zustand
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useTransition } from 'react'
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
  User,
  Phone,
  Mail,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/app/_lib/utils'
import { formatCurrency } from '@/app/_lib/utils/formatters'
import { Modal, Button, ModalFooter } from '../ui/Modal'
import { useChronosStore, type CrearOrdenCompraInput } from '@/app/lib/store'
import { BANCOS_CONFIG, BANCOS_ORDENADOS } from '@/app/_lib/constants/bancos'
import type { BancoId, Distribuidor } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

const OrdenCompraSchema = z.object({
  distribuidorId: z.string().optional(),
  nuevoDistribuidor: z.object({
    nombre: z.string().min(2, 'Nombre requerido'),
    empresa: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
  }).optional(),
  cantidad: z.number().min(1, 'Cantidad mínima: 1'),
  costoDistribuidor: z.number().min(0.01, 'Costo requerido'),
  costoTransporte: z.number().min(0),
  bancoOrigen: z.string().min(1, 'Selecciona un banco'),
  pagoInicial: z.number().min(0),
  notas: z.string().optional(),
})

type OrdenCompraFormData = z.infer<typeof OrdenCompraSchema>

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface OrdenCompraModalProps {
  isOpen: boolean
  onClose: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function OrdenCompraModal({ isOpen, onClose }: OrdenCompraModalProps) {
  const [step, setStep] = useState(0)
  const [isNewDistribuidor, setIsNewDistribuidor] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  // Zustand store
  const { distribuidores, bancos, crearOrdenCompra, crearDistribuidor } = useChronosStore()
  
  const steps = ['Distribuidor', 'Producto', 'Pago', 'Confirmar']
  
  const form = useForm<OrdenCompraFormData>({
    resolver: zodResolver(OrdenCompraSchema),
    defaultValues: {
      cantidad: 1,
      costoDistribuidor: 0,
      costoTransporte: 0,
      bancoOrigen: 'boveda_monte',
      pagoInicial: 0,
    }
  })
  
  const watchedValues = form.watch()
  
  // ═══════════════════════════════════════════════════════════════════════
  // CÁLCULOS
  // ═══════════════════════════════════════════════════════════════════════
  
  const calculos = useMemo(() => {
    const cantidad = watchedValues.cantidad || 0
    const costoDistribuidor = watchedValues.costoDistribuidor || 0
    const costoTransporte = watchedValues.costoTransporte || 0
    const pagoInicial = watchedValues.pagoInicial || 0
    
    const costoTotal = (costoDistribuidor * cantidad) + costoTransporte
    const deuda = costoTotal - pagoInicial
    const costoPorUnidad = cantidad > 0 ? costoTotal / cantidad : 0
    
    return {
      costoTotal,
      costoPorUnidad,
      deuda,
      pagoInicial,
    }
  }, [watchedValues])
  
  // Banco seleccionado
  const bancoSeleccionado = bancos[watchedValues.bancoOrigen as BancoId]
  const capitalDisponible = bancoSeleccionado?.capitalActual || 0
  const haySuficienteCapital = capitalDisponible >= (watchedValues.pagoInicial || 0)
  
  const handleNext = async () => {
    let isValid = true
    
    if (step === 0) {
      if (isNewDistribuidor) {
        isValid = await form.trigger('nuevoDistribuidor')
      } else {
        isValid = !!watchedValues.distribuidorId
      }
    } else if (step === 1) {
      isValid = await form.trigger(['cantidad', 'costoDistribuidor'])
    } else if (step === 2) {
      isValid = await form.trigger(['bancoOrigen', 'pagoInicial'])
      if (!haySuficienteCapital) {
        toast.error('Capital insuficiente en el banco seleccionado')
        isValid = false
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
    setIsNewDistribuidor(false)
  }
  
  const handleSubmit = form.handleSubmit(async (data) => {
    startTransition(async () => {
      try {
        // Crear distribuidor si es nuevo
        let distribuidorId = data.distribuidorId
        let distribuidorNombre = ''
        
        if (isNewDistribuidor && data.nuevoDistribuidor) {
          // Primero crear en la API
          const distribuidorResponse = await fetch('/api/distribuidores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre: data.nuevoDistribuidor.nombre,
              empresa: data.nuevoDistribuidor.empresa || '',
              telefono: data.nuevoDistribuidor.telefono || '',
              email: data.nuevoDistribuidor.email || '',
            }),
          })
          
          if (!distribuidorResponse.ok) {
            throw new Error('Error al crear distribuidor')
          }
          
          const distribuidorData = await distribuidorResponse.json()
          distribuidorId = distribuidorData.distribuidorId
          distribuidorNombre = data.nuevoDistribuidor.nombre
          
          // También crear en Zustand para UI inmediata (usando propiedades del tipo local)
          crearDistribuidor({
            nombre: data.nuevoDistribuidor.nombre,
            empresa: data.nuevoDistribuidor.empresa || '',
            contacto: data.nuevoDistribuidor.telefono || '',
            telefono: data.nuevoDistribuidor.telefono || '',
            email: data.nuevoDistribuidor.email || '',
            direccion: '',
            costoTotal: 0,
            abonos: 0,
            pendiente: 0,
            totalOrdenesCompra: 0,
            totalPagado: 0,
            deudaTotal: 0,
            numeroOrdenes: 0,
            keywords: [data.nuevoDistribuidor.nombre.toLowerCase()],
            estado: 'activo',
          } as Omit<Distribuidor, 'id' | 'createdAt' | 'updatedAt'>)
        } else {
          const distribuidor = distribuidores.find(d => d.id === distribuidorId)
          distribuidorNombre = distribuidor?.nombre || 'Distribuidor'
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // PERSISTIR EN API (Turso/Drizzle) con descuento automático de banco
        // ═══════════════════════════════════════════════════════════════════
        
        const ocResponse = await fetch('/api/ordenes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            distribuidorId: distribuidorId || '',
            cantidad: data.cantidad,
            precioUnitario: data.costoDistribuidor,
            pagoInicial: data.pagoInicial,
            bancoOrigenId: data.bancoOrigen,
            observaciones: data.notas,
          }),
        })
        
        if (!ocResponse.ok) {
          const errorData = await ocResponse.json()
          throw new Error(errorData.error || 'Error al crear orden de compra')
        }
        
        const ocData = await ocResponse.json()
        
        // También crear en Zustand para UI inmediata
        const ocInput: CrearOrdenCompraInput = {
          distribuidor: distribuidorNombre,
          distribuidorId: distribuidorId || '',
          cantidad: data.cantidad,
          costoDistribuidor: data.costoDistribuidor,
          costoTransporte: data.costoTransporte,
          bancoOrigen: data.bancoOrigen as BancoId,
          pagoInicial: data.pagoInicial,
          fecha: new Date().toISOString().split('T')[0],
          notas: data.notas,
        }
        
        crearOrdenCompra(ocInput)
        
        toast.success('Orden de compra creada', {
          description: `${data.cantidad} unidades por ${formatCurrency(calculos.costoTotal)} - Stock: ${ocData.stockInicial}`,
        })
        
        handleReset()
        onClose()
      } catch (error) {
        toast.error('Error al crear orden', {
          description: error instanceof Error ? error.message : 'Intenta de nuevo',
        })
      }
    })
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Orden de Compra"
      subtitle="Registra compra a distribuidor"
      size="lg"
    >
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((stepName, index) => (
          <div key={stepName} className="flex items-center">
            <motion.div
              animate={{
                scale: index === step ? 1.1 : 1,
                backgroundColor: index <= step ? '#3B82F6' : 'rgba(255,255,255,0.1)',
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
                index < step ? 'bg-blue-500' : 'bg-white/10'
              )} />
            )}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {/* Step 0: Distribuidor */}
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
                  onClick={() => setIsNewDistribuidor(false)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                    !isNewDistribuidor ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  )}
                >
                  Existente
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewDistribuidor(true)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                    isNewDistribuidor ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  )}
                >
                  Nuevo
                </button>
              </div>
              
              {!isNewDistribuidor ? (
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Seleccionar Distribuidor</label>
                  <select
                    {...form.register('distribuidorId')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500"
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
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Nombre *</label>
                    <input
                      {...form.register('nuevoDistribuidor.nombre')}
                      placeholder="Nombre del distribuidor"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Empresa</label>
                    <input
                      {...form.register('nuevoDistribuidor.empresa')}
                      placeholder="Nombre de empresa"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Teléfono</label>
                      <input
                        {...form.register('nuevoDistribuidor.telefono')}
                        placeholder="+52 555 123 4567"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Email</label>
                      <input
                        {...form.register('nuevoDistribuidor.email')}
                        type="email"
                        placeholder="email@ejemplo.com"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-blue-500"
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
                <label className="text-sm text-gray-400">Cantidad</label>
                <input
                  type="number"
                  {...form.register('cantidad', { valueAsNumber: true })}
                  min={1}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-3xl font-bold text-center focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Costo/Unidad</label>
                  <input
                    type="number"
                    {...form.register('costoDistribuidor', { valueAsNumber: true })}
                    min={0}
                    step="0.01"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-bold focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Transporte Total</label>
                  <input
                    type="number"
                    {...form.register('costoTransporte', { valueAsNumber: true })}
                    min={0}
                    step="0.01"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex justify-between">
                  <span className="text-gray-400">Costo Total:</span>
                  <span className="text-blue-400 font-bold">{formatCurrency(calculos.costoTotal)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Costo por Unidad:</span>
                  <span className="text-gray-400">{formatCurrency(calculos.costoPorUnidad)}</span>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Step 2: Pago */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Banco Origen</label>
                <div className="grid grid-cols-2 gap-2">
                  {BANCOS_ORDENADOS.map(config => {
                    const bancoId = config.id
                    const banco = bancos[bancoId]
                    const isSelected = watchedValues.bancoOrigen === bancoId
                    
                    return (
                      <button
                        key={bancoId}
                        type="button"
                        onClick={() => form.setValue('bancoOrigen', bancoId)}
                        className={cn(
                          "p-3 rounded-xl border transition-all text-left",
                          isSelected 
                            ? 'border-blue-500 bg-blue-500/10' 
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{config.icono}</span>
                          <span className="text-sm font-medium text-white">{config.nombre}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {formatCurrency(banco?.capitalActual || 0)}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Pago Inicial (Anticipo)</label>
                <input
                  type="number"
                  {...form.register('pagoInicial', { valueAsNumber: true })}
                  min={0}
                  max={calculos.costoTotal}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:border-blue-500"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => form.setValue('pagoInicial', 0)}
                    className="px-3 py-1 text-xs bg-white/5 rounded-lg text-gray-400 hover:text-white"
                  >
                    Sin pago
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setValue('pagoInicial', calculos.costoTotal * 0.5)}
                    className="px-3 py-1 text-xs bg-white/5 rounded-lg text-gray-400 hover:text-white"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setValue('pagoInicial', calculos.costoTotal)}
                    className="px-3 py-1 text-xs bg-white/5 rounded-lg text-gray-400 hover:text-white"
                  >
                    100%
                  </button>
                </div>
              </div>
              
              {!haySuficienteCapital && (watchedValues.pagoInicial || 0) > 0 && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">
                    ⚠️ Capital insuficiente. Disponible: {formatCurrency(capitalDisponible)}
                  </p>
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
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cantidad:</span>
                  <span className="text-white font-medium">{watchedValues.cantidad} unidades</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Costo Total:</span>
                  <span className="text-white font-bold">{formatCurrency(calculos.costoTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Pago Inicial:</span>
                  <span className="text-green-400 font-medium">{formatCurrency(calculos.pagoInicial)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                  <span className="text-gray-400">Deuda Restante:</span>
                  <span className={cn(
                    "font-bold",
                    calculos.deuda > 0 ? 'text-red-400' : 'text-green-400'
                  )}>
                    {formatCurrency(calculos.deuda)}
                  </span>
                </div>
              </div>
              
              {/* Notas */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Notas (opcional)</label>
                <textarea
                  {...form.register('notas')}
                  rows={2}
                  placeholder="Notas adicionales..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-blue-500 resize-none"
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
              Crear Orden
            </Button>
          )}
        </ModalFooter>
      </form>
    </Modal>
  )
}
