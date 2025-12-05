'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — MODAL ABONO DISTRIBUIDOR
// Pagar deuda a distribuidor desde cualquier banco
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useTransition, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  DollarSign, 
  Truck,
  Check,
  ArrowUp,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/app/_lib/utils'
import { formatCurrency } from '@/app/_lib/utils/formatters'
import { Modal, Button, ModalFooter } from '../ui/Modal'
import { useChronosStore } from '@/app/lib/store'
import { BANCOS_CONFIG, BANCOS_ORDENADOS } from '@/app/_lib/constants/bancos'
import type { BancoId } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

const AbonoDistribuidorSchema = z.object({
  distribuidorId: z.string().min(1, 'Selecciona un distribuidor'),
  monto: z.number().positive('Monto debe ser positivo'),
  bancoOrigenId: z.string().min(1, 'Selecciona un banco'),
  concepto: z.string().optional(),
})

type AbonoDistribuidorFormData = z.infer<typeof AbonoDistribuidorSchema>

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface AbonoDistribuidorModalProps {
  isOpen: boolean
  onClose: () => void
  distribuidorPreseleccionado?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AbonoDistribuidorModal({ isOpen, onClose, distribuidorPreseleccionado }: AbonoDistribuidorModalProps) {
  const [isPending, startTransition] = useTransition()
  
  // Zustand store
  const { distribuidores, ordenesCompra, bancos, abonarOrdenCompra } = useChronosStore()
  
  // Solo distribuidores con deuda
  const distribuidoresConDeuda = useMemo(() => 
    distribuidores.filter(d => (d.pendiente || d.deudaTotal || 0) > 0),
    [distribuidores]
  )
  
  const form = useForm<AbonoDistribuidorFormData>({
    resolver: zodResolver(AbonoDistribuidorSchema),
    defaultValues: {
      distribuidorId: distribuidorPreseleccionado || '',
      monto: 0,
      bancoOrigenId: 'boveda_monte',
      concepto: 'Pago a distribuidor',
    }
  })
  
  const watchedValues = form.watch()
  const distribuidorSeleccionado = distribuidores.find(d => d.id === watchedValues.distribuidorId)
  const deudaDistribuidor = distribuidorSeleccionado?.pendiente || distribuidorSeleccionado?.deudaTotal || 0
  const montoValido = (watchedValues.monto || 0) <= deudaDistribuidor
  
  // Capital del banco seleccionado
  const bancoOrigen = bancos[watchedValues.bancoOrigenId as BancoId]
  const capitalDisponible = bancoOrigen?.capitalActual || 0
  const haySuficienteCapital = capitalDisponible >= (watchedValues.monto || 0)
  
  // OC pendientes del distribuidor
  const ocPendientes = useMemo(() => 
    ordenesCompra.filter(oc => 
      oc.distribuidorId === watchedValues.distribuidorId && 
      (oc.deuda || 0) > 0
    ).sort((a, b) => {
      const dateA = typeof a.fecha === 'string' ? new Date(a.fecha) : new Date()
      const dateB = typeof b.fecha === 'string' ? new Date(b.fecha) : new Date()
      return dateA.getTime() - dateB.getTime()
    }),
    [ordenesCompra, watchedValues.distribuidorId]
  )
  
  const handleSaldarCompleto = () => {
    if (deudaDistribuidor > 0) {
      const montoMaximo = Math.min(deudaDistribuidor, capitalDisponible)
      form.setValue('monto', montoMaximo)
    }
  }
  
  const handleReset = () => {
    form.reset({
      distribuidorId: distribuidorPreseleccionado || '',
      monto: 0,
      bancoOrigenId: 'boveda_monte',
      concepto: 'Pago a distribuidor',
    })
  }
  
  const handleSubmit = form.handleSubmit(async (data) => {
    if (!montoValido) {
      toast.error('El monto excede la deuda del distribuidor')
      return
    }
    if (!haySuficienteCapital) {
      toast.error('Capital insuficiente en el banco seleccionado')
      return
    }
    
    startTransition(() => {
      try {
        // Aplicar pago a OC pendientes (FIFO)
        let montoRestante = data.monto
        
        for (const oc of ocPendientes) {
          if (montoRestante <= 0) break
          
          const deudaOC = oc.deuda || 0
          const pagoOC = Math.min(montoRestante, deudaOC)
          
          if (pagoOC > 0) {
            abonarOrdenCompra(oc.id, pagoOC, data.bancoOrigenId as BancoId)
            montoRestante -= pagoOC
          }
        }
        
        toast.success('Pago registrado', {
          description: `${formatCurrency(data.monto)} pagado a ${distribuidorSeleccionado?.nombre}`,
        })
        
        handleReset()
        onClose()
      } catch (error) {
        toast.error('Error al registrar pago', {
          description: error instanceof Error ? error.message : 'Intenta de nuevo',
        })
      }
    })
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pagar a Distribuidor"
      subtitle="Registra pago de deuda"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Distribuidor */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Seleccionar Distribuidor</label>
          <select
            {...form.register('distribuidorId')}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500"
          >
            <option value="">Seleccionar distribuidor con deuda...</option>
            {distribuidoresConDeuda.map(d => (
              <option key={d.id} value={d.id}>
                {d.nombre} {d.empresa ? `(${d.empresa})` : ''} — Deuda: {formatCurrency(d.pendiente || d.deudaTotal || 0)}
              </option>
            ))}
          </select>
        </div>
        
        {/* Info Distribuidor */}
        {distribuidorSeleccionado && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Truck className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-white">{distribuidorSeleccionado.nombre}</p>
                <p className="text-xs text-gray-400">{distribuidorSeleccionado.empresa || distribuidorSeleccionado.contacto || 'Sin empresa'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-gray-400 text-xs">Deuda Total</p>
                <p className="text-red-400 font-bold">{formatCurrency(deudaDistribuidor)}</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-gray-400 text-xs">OC Pendientes</p>
                <p className="text-white font-medium">{ocPendientes.length}</p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Banco Origen */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Pagar desde Banco</label>
          <div className="grid grid-cols-2 gap-2">
            {BANCOS_ORDENADOS.map(config => {
              const bancoId = config.id
              const banco = bancos[bancoId]
              const isSelected = watchedValues.bancoOrigenId === bancoId
              
              return (
                <button
                  key={bancoId}
                  type="button"
                  onClick={() => form.setValue('bancoOrigenId', bancoId)}
                  className={cn(
                    "p-2 rounded-xl border transition-all text-left",
                    isSelected 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{config.icono}</span>
                    <span className="text-xs font-medium text-white">{config.nombre}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatCurrency(banco?.capitalActual || 0)}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Monto */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Monto a Pagar</label>
          <input
            type="number"
            {...form.register('monto', { valueAsNumber: true })}
            min={0}
            max={Math.min(deudaDistribuidor, capitalDisponible)}
            step="0.01"
            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold text-center focus:border-blue-500"
          />
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => form.setValue('monto', Math.min(deudaDistribuidor * 0.25, capitalDisponible))}
              className="flex-1 py-1.5 text-xs bg-white/5 rounded-lg text-gray-400 hover:text-white"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => form.setValue('monto', Math.min(deudaDistribuidor * 0.5, capitalDisponible))}
              className="flex-1 py-1.5 text-xs bg-white/5 rounded-lg text-gray-400 hover:text-white"
            >
              50%
            </button>
            <button
              type="button"
              onClick={handleSaldarCompleto}
              className="flex-1 py-1.5 text-xs bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/30"
            >
              Saldar Todo
            </button>
          </div>
        </div>
        
        {/* Concepto */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Concepto (opcional)</label>
          <input
            {...form.register('concepto')}
            placeholder="Pago a distribuidor..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-blue-500"
          />
        </div>
        
        {/* Warnings */}
        {!montoValido && (watchedValues.monto || 0) > 0 && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">
              ⚠️ El monto excede la deuda. Máximo: {formatCurrency(deudaDistribuidor)}
            </p>
          </div>
        )}
        
        {!haySuficienteCapital && (watchedValues.monto || 0) > 0 && montoValido && (
          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-400">
              ⚠️ Capital insuficiente en {BANCOS_CONFIG[watchedValues.bancoOrigenId as BancoId]?.nombre}. Disponible: {formatCurrency(capitalDisponible)}
            </p>
          </div>
        )}
        
        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isPending}
            disabled={!watchedValues.distribuidorId || !montoValido || !haySuficienteCapital || (watchedValues.monto || 0) <= 0}
            icon={<ArrowUp className="w-4 h-4" />}
          >
            Realizar Pago
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
