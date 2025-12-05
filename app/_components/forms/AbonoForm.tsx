'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — FORMULARIO ABONO/PAGO
// Para clientes (cobrar) y distribuidores (pagar)
// ═══════════════════════════════════════════════════════════════

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  DollarSign, 
  Building2,
  Check,
  Loader2,
  User,
  Truck,
  ArrowDown,
  ArrowUp
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/app/_lib/utils'
import { formatCurrency } from '@/app/_lib/utils/formatters'
import { BANCOS_CONFIG } from '@/app/_lib/constants/bancos'
import type { Banco, Cliente, Distribuidor } from '@/database/schema'

// ═══════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════

const AbonoClienteSchema = z.object({
  clienteId: z.string().min(1, 'Cliente requerido'),
  monto: z.number().positive('Monto debe ser positivo'),
  concepto: z.string().optional(),
})

const PagoDistribuidorSchema = z.object({
  distribuidorId: z.string().min(1, 'Distribuidor requerido'),
  monto: z.number().positive('Monto debe ser positivo'),
  bancoOrigenId: z.string().min(1, 'Selecciona banco'),
  concepto: z.string().optional(),
})

type AbonoClienteInput = z.infer<typeof AbonoClienteSchema>
type PagoDistribuidorInput = z.infer<typeof PagoDistribuidorSchema>

// ═══════════════════════════════════════════════════════════════
// ABONO CLIENTE (Cobrar deuda)
// ═══════════════════════════════════════════════════════════════

interface AbonoClienteFormProps {
  clientes: Cliente[]
  clientePreseleccionado?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function AbonoClienteForm({ 
  clientes, 
  clientePreseleccionado,
  onSuccess, 
  onCancel 
}: AbonoClienteFormProps) {
  const [isPending, startTransition] = useTransition()
  
  const clientesConDeuda = clientes.filter(c => (c.saldoPendiente || 0) > 0)
  
  const form = useForm<AbonoClienteInput>({
    resolver: zodResolver(AbonoClienteSchema),
    defaultValues: {
      clienteId: clientePreseleccionado || '',
      monto: 0,
      concepto: 'Abono a cuenta',
    }
  })
  
  const watchedValues = form.watch()
  const clienteSeleccionado = clientes.find(c => c.id === watchedValues.clienteId)
  const deudaCliente = clienteSeleccionado?.saldoPendiente || 0
  const montoValido = (watchedValues.monto || 0) <= deudaCliente
  
  const handleSaldarCompleto = () => {
    if (clienteSeleccionado) {
      form.setValue('monto', clienteSeleccionado.saldoPendiente || 0)
    }
  }
  
  const handleSubmit = form.handleSubmit(async (data) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/clientes/abonar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await res.json()
        if (!result.success) throw new Error(result.error)
        
        toast.success('Abono registrado', {
          description: `${formatCurrency(data.monto)} recibido de ${clienteSeleccionado?.nombre}`,
        })
        onSuccess?.()
      } catch (error) {
        toast.error('Error al registrar abono', {
          description: error instanceof Error ? error.message : 'Intenta de nuevo',
        })
      }
    })
  })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="glass-panel rounded-3xl p-8 border border-green-500/20">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <ArrowDown className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Recibir Abono</h2>
          <p className="text-gray-400">Registra pago del cliente a su deuda</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Cliente</label>
            <select
              {...form.register('clienteId')}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-green-500"
            >
              <option value="">Seleccionar cliente...</option>
              {clientesConDeuda.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — Deuda: {formatCurrency(c.saldoPendiente || 0)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Info deuda */}
          {clienteSeleccionado && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white font-medium">{clienteSeleccionado.nombre}</p>
                    <p className="text-xs text-gray-400">{clienteSeleccionado.telefono || 'Sin teléfono'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Deuda actual</p>
                  <p className="text-xl font-bold text-red-400">
                    {formatCurrency(deudaCliente)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Monto */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Monto a Abonar</label>
              {clienteSeleccionado && (
                <button
                  type="button"
                  onClick={handleSaldarCompleto}
                  className="text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                  Saldar completo
                </button>
              )}
            </div>
            <input
              type="number"
              {...form.register('monto', { valueAsNumber: true })}
              min={0}
              max={deudaCliente}
              step="0.01"
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold text-center focus:border-green-500"
            />
            {!montoValido && watchedValues.monto > 0 && (
              <p className="text-xs text-red-400">
                El monto no puede exceder la deuda ({formatCurrency(deudaCliente)})
              </p>
            )}
          </div>
          
          {/* Preview */}
          {clienteSeleccionado && watchedValues.monto > 0 && montoValido && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Nueva deuda del cliente:</span>
                <span className={cn(
                  "font-bold",
                  deudaCliente - watchedValues.monto === 0 ? 'text-green-400' : 'text-yellow-400'
                )}>
                  {formatCurrency(deudaCliente - watchedValues.monto)}
                </span>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isPending || !montoValido || !clienteSeleccionado}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Registrar Abono
              </>
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Cancelar
            </button>
          )}
        </form>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PAGO DISTRIBUIDOR (Pagar deuda que tenemos)
// ═══════════════════════════════════════════════════════════════

interface PagoDistribuidorFormProps {
  distribuidores: Distribuidor[]
  bancos: Banco[]
  distribuidorPreseleccionado?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function PagoDistribuidorForm({ 
  distribuidores, 
  bancos,
  distribuidorPreseleccionado,
  onSuccess, 
  onCancel 
}: PagoDistribuidorFormProps) {
  const [isPending, startTransition] = useTransition()
  
  const distribuidoresConDeuda = distribuidores.filter(d => (d.saldoPendiente || 0) > 0)
  
  const form = useForm<PagoDistribuidorInput>({
    resolver: zodResolver(PagoDistribuidorSchema),
    defaultValues: {
      distribuidorId: distribuidorPreseleccionado || '',
      monto: 0,
      bancoOrigenId: 'boveda_monte',
      concepto: 'Pago a proveedor',
    }
  })
  
  const watchedValues = form.watch()
  const distribuidorSeleccionado = distribuidores.find(d => d.id === watchedValues.distribuidorId)
  const bancoSeleccionado = bancos.find(b => b.id === watchedValues.bancoOrigenId)
  const deudaDistribuidor = distribuidorSeleccionado?.saldoPendiente || 0
  const capitalBanco = bancoSeleccionado?.capitalActual || 0
  
  const montoValido = (watchedValues.monto || 0) <= deudaDistribuidor && (watchedValues.monto || 0) <= capitalBanco
  
  const handleSaldarCompleto = () => {
    if (distribuidorSeleccionado) {
      form.setValue('monto', distribuidorSeleccionado.saldoPendiente || 0)
    }
  }
  
  const handleSubmit = form.handleSubmit(async (data) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/distribuidores/pagar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await res.json()
        if (!result.success) throw new Error(result.error)
        
        toast.success('Pago registrado', {
          description: `${formatCurrency(data.monto)} pagado a ${distribuidorSeleccionado?.nombre}`,
        })
        onSuccess?.()
      } catch (error) {
        toast.error('Error al registrar pago', {
          description: error instanceof Error ? error.message : 'Intenta de nuevo',
        })
      }
    })
  })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="glass-panel rounded-3xl p-8 border border-orange-500/20">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
            <ArrowUp className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Pagar a Distribuidor</h2>
          <p className="text-gray-400">Registra pago desde un banco a tu proveedor</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Distribuidor */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Distribuidor</label>
            <select
              {...form.register('distribuidorId')}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-orange-500"
            >
              <option value="">Seleccionar distribuidor...</option>
              {distribuidoresConDeuda.map(d => (
                <option key={d.id} value={d.id}>
                  {d.nombre} — Adeudo: {formatCurrency(d.saldoPendiente || 0)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Info adeudo */}
          {distribuidorSeleccionado && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white font-medium">{distribuidorSeleccionado.nombre}</p>
                    <p className="text-xs text-gray-400">{distribuidorSeleccionado.empresa || 'Sin empresa'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Le debemos</p>
                  <p className="text-xl font-bold text-orange-400">
                    {formatCurrency(deudaDistribuidor)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Banco origen */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Pagar desde</label>
            <div className="grid grid-cols-3 gap-2">
              {bancos.filter(b => (b.capitalActual || 0) > 0).map(banco => {
                const config = BANCOS_CONFIG[banco.id as keyof typeof BANCOS_CONFIG]
                const isSelected = watchedValues.bancoOrigenId === banco.id
                
                return (
                  <button
                    key={banco.id}
                    type="button"
                    onClick={() => form.setValue('bancoOrigenId', banco.id)}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all",
                      isSelected 
                        ? 'bg-orange-500/20 border-orange-500' 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    )}
                  >
                    <div 
                      className="w-6 h-6 mx-auto mb-1 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: config?.color + '33' }}
                    >
                      <Building2 className="w-3 h-3" style={{ color: config?.color }} />
                    </div>
                    <p className="text-xs text-white truncate">{banco.nombre}</p>
                    <p className="text-xs text-green-400 font-bold">
                      {formatCurrency(banco.capitalActual || 0)}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Monto */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Monto a Pagar</label>
              {distribuidorSeleccionado && (
                <button
                  type="button"
                  onClick={handleSaldarCompleto}
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Saldar completo
                </button>
              )}
            </div>
            <input
              type="number"
              {...form.register('monto', { valueAsNumber: true })}
              min={0}
              step="0.01"
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold text-center focus:border-orange-500"
            />
            {watchedValues.monto > capitalBanco && (
              <p className="text-xs text-red-400">
                Capital insuficiente en {bancoSeleccionado?.nombre}
              </p>
            )}
            {watchedValues.monto > deudaDistribuidor && (
              <p className="text-xs text-yellow-400">
                El monto excede el adeudo
              </p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isPending || !montoValido || !distribuidorSeleccionado}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Realizar Pago
              </>
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Cancelar
            </button>
          )}
        </form>
      </div>
    </motion.div>
  )
}

export default { AbonoClienteForm, PagoDistribuidorForm }
