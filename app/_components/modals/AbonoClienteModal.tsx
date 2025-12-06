'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — MODAL ABONO CLIENTE
// Cobrar deuda de cliente con distribución automática
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useTransition, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  DollarSign, 
  User,
  Check,
  ArrowDown,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/app/_lib/utils'
import { formatCurrency } from '@/app/_lib/utils/formatters'
import { Modal, Button, ModalFooter } from '../ui/Modal'
import { useChronosStore } from '@/app/lib/store'

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

const AbonoClienteSchema = z.object({
  clienteId: z.string().min(1, 'Selecciona un cliente'),
  monto: z.number().positive('Monto debe ser positivo'),
  concepto: z.string().optional(),
})

type AbonoClienteFormData = z.infer<typeof AbonoClienteSchema>

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface AbonoClienteModalProps {
  isOpen: boolean
  onClose: () => void
  clientePreseleccionado?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AbonoClienteModal({ isOpen, onClose, clientePreseleccionado }: AbonoClienteModalProps) {
  const [isPending, startTransition] = useTransition()
  
  // Zustand store
  const { clientes, ventas, abonarVenta } = useChronosStore()
  
  // Solo clientes con deuda
  const clientesConDeuda = useMemo(() => 
    clientes.filter(c => (c.deuda || c.deudaTotal || c.pendiente || 0) > 0),
    [clientes]
  )
  
  const form = useForm<AbonoClienteFormData>({
    resolver: zodResolver(AbonoClienteSchema),
    defaultValues: {
      clienteId: clientePreseleccionado || '',
      monto: 0,
      concepto: 'Abono a cuenta',
    }
  })
  
  const watchedValues = form.watch()
  const clienteSeleccionado = clientes.find(c => c.id === watchedValues.clienteId)
  const deudaCliente = clienteSeleccionado?.deuda || clienteSeleccionado?.deudaTotal || clienteSeleccionado?.pendiente || 0
  const montoValido = (watchedValues.monto || 0) <= deudaCliente
  
  // Ventas pendientes del cliente
  const ventasPendientes = useMemo(() => 
    ventas.filter(v => 
      v.clienteId === watchedValues.clienteId && 
      (v.estadoPago === 'pendiente' || v.estadoPago === 'parcial')
    ).sort((a, b) => {
      const dateA = typeof a.fecha === 'string' ? new Date(a.fecha) : new Date()
      const dateB = typeof b.fecha === 'string' ? new Date(b.fecha) : new Date()
      return dateA.getTime() - dateB.getTime()
    }),
    [ventas, watchedValues.clienteId]
  )
  
  const handleSaldarCompleto = () => {
    if (deudaCliente > 0) {
      form.setValue('monto', deudaCliente)
    }
  }
  
  const handleReset = () => {
    form.reset({
      clienteId: clientePreseleccionado || '',
      monto: 0,
      concepto: 'Abono a cuenta',
    })
  }
  
  const handleSubmit = form.handleSubmit(async (data) => {
    if (!montoValido) {
      toast.error('El monto excede la deuda del cliente')
      return
    }
    
    startTransition(() => {
      try {
        // Aplicar abono a ventas pendientes (FIFO)
        let montoRestante = data.monto
        
        for (const venta of ventasPendientes) {
          if (montoRestante <= 0) break
          
          const deudaVenta = venta.montoRestante || (venta.precioTotalVenta - venta.montoPagado) || 0
          const abonoVenta = Math.min(montoRestante, deudaVenta)
          
          if (abonoVenta > 0) {
            abonarVenta(venta.id, abonoVenta)
            montoRestante -= abonoVenta
          }
        }
        
        toast.success('Abono registrado', {
          description: `${formatCurrency(data.monto)} cobrado de ${clienteSeleccionado?.nombre}`,
        })
        
        handleReset()
        onClose()
      } catch (error) {
        toast.error('Error al registrar abono', {
          description: error instanceof Error ? error.message : 'Intenta de nuevo',
        })
      }
    })
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cobrar a Cliente"
      subtitle="Registra abono de deuda"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Cliente */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Seleccionar Cliente</label>
          <select
            {...form.register('clienteId')}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-green-500"
          >
            <option value="">Seleccionar cliente con deuda...</option>
            {clientesConDeuda.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre} — Deuda: {formatCurrency(c.deuda || c.deudaTotal || c.pendiente || 0)}
              </option>
            ))}
          </select>
        </div>
        
        {/* Info Cliente */}
        {clienteSeleccionado && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white">{clienteSeleccionado.nombre}</p>
                <p className="text-xs text-gray-400">{clienteSeleccionado.telefono || clienteSeleccionado.email || 'Sin contacto'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-gray-400 text-xs">Deuda Total</p>
                <p className="text-red-400 font-bold">{formatCurrency(deudaCliente)}</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-gray-400 text-xs">Ventas Pendientes</p>
                <p className="text-white font-medium">{ventasPendientes.length}</p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Monto */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Monto a Cobrar</label>
          <input
            type="number"
            {...form.register('monto', { valueAsNumber: true })}
            min={0}
            max={deudaCliente}
            step="0.01"
            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold text-center focus:border-green-500"
          />
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => form.setValue('monto', deudaCliente * 0.25)}
              className="flex-1 py-1.5 text-xs bg-white/5 rounded-lg text-gray-400 hover:text-white"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => form.setValue('monto', deudaCliente * 0.5)}
              className="flex-1 py-1.5 text-xs bg-white/5 rounded-lg text-gray-400 hover:text-white"
            >
              50%
            </button>
            <button
              type="button"
              onClick={handleSaldarCompleto}
              className="flex-1 py-1.5 text-xs bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30"
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
            placeholder="Abono a cuenta..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500"
          />
        </div>
        
        {/* Warning */}
        {!montoValido && (watchedValues.monto || 0) > 0 && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">
              ⚠️ El monto excede la deuda. Máximo: {formatCurrency(deudaCliente)}
            </p>
          </div>
        )}
        
        {/* Preview distribución */}
        {(watchedValues.monto || 0) > 0 && montoValido && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-green-500/10 border border-green-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Distribución automática GYA</span>
            </div>
            <p className="text-xs text-gray-400">
              El abono se distribuirá proporcionalmente a los 3 bancos según las ventas originales
            </p>
          </motion.div>
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
            disabled={!watchedValues.clienteId || !montoValido || (watchedValues.monto || 0) <= 0}
            icon={<ArrowDown className="w-4 h-4" />}
          >
            Cobrar Abono
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
