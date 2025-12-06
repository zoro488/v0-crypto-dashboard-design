'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — FORMULARIO GASTO
// Registro de gastos desde cualquier banco
// ═══════════════════════════════════════════════════════════════

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Minus, 
  Building2,
  Check,
  Loader2,
  Receipt,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/app/_lib/utils'
import { formatCurrency } from '@/app/_lib/utils/formatters'
import { BANCOS_CONFIG } from '@/app/_lib/constants/bancos'
import type { Banco } from '@/database/schema'

const GastoSchema = z.object({
  bancoId: z.string().min(1, 'Selecciona un banco'),
  monto: z.number().positive('Monto debe ser positivo'),
  concepto: z.string().min(1, 'Concepto requerido'),
  categoria: z.string().optional(),
  observaciones: z.string().optional(),
})

type GastoInput = z.infer<typeof GastoSchema>

interface GastoFormProps {
  bancos: Banco[]
  onSuccess?: () => void
  onCancel?: () => void
}

const CATEGORIAS = [
  'Operaciones',
  'Transporte',
  'Servicios',
  'Nómina',
  'Impuestos',
  'Mantenimiento',
  'Marketing',
  'Otros',
]

export function GastoForm({ bancos, onSuccess, onCancel }: GastoFormProps) {
  const [isPending, startTransition] = useTransition()
  
  const form = useForm<GastoInput>({
    resolver: zodResolver(GastoSchema),
    defaultValues: {
      monto: 0,
      concepto: '',
      categoria: 'Operaciones',
    }
  })
  
  const watchedValues = form.watch()
  const bancoSeleccionado = bancos.find(b => b.id === watchedValues.bancoId)
  const hasEnoughCapital = bancoSeleccionado 
    ? (bancoSeleccionado.capitalActual || 0) >= (watchedValues.monto || 0) 
    : false
  
  const handleSubmit = form.handleSubmit(async (data) => {
    if (!hasEnoughCapital) {
      toast.error('Capital insuficiente')
      return
    }
    
    startTransition(async () => {
      try {
        const res = await fetch('/api/bancos/gasto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await res.json()
        if (!result.success) throw new Error(result.error)
        
        toast.success('Gasto registrado', {
          description: `${formatCurrency(data.monto)} - ${data.concepto}`,
        })
        onSuccess?.()
      } catch (error) {
        toast.error('Error al registrar gasto', {
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
      <div className="glass-panel rounded-3xl p-8 border border-red-500/20">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <Minus className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Registrar Gasto</h2>
          <p className="text-gray-400">Resta del capital del banco seleccionado</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banco */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Banco Origen del Gasto</label>
            <div className="grid grid-cols-3 gap-2">
              {bancos.map(banco => {
                const config = BANCOS_CONFIG[banco.id as keyof typeof BANCOS_CONFIG]
                const isSelected = watchedValues.bancoId === banco.id
                const hasCapital = (banco.capitalActual || 0) > 0
                
                return (
                  <button
                    key={banco.id}
                    type="button"
                    onClick={() => form.setValue('bancoId', banco.id)}
                    disabled={!hasCapital}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all",
                      isSelected 
                        ? 'bg-red-500/20 border-red-500' 
                        : 'bg-white/5 border-white/10 hover:border-white/20',
                      !hasCapital && 'opacity-30 cursor-not-allowed'
                    )}
                  >
                    <div 
                      className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: config?.color + '33' }}
                    >
                      <Building2 className="w-4 h-4" style={{ color: config?.color }} />
                    </div>
                    <p className="text-xs text-white truncate">{banco.nombre}</p>
                    <p className={cn(
                      "text-xs font-bold",
                      hasCapital ? 'text-green-400' : 'text-red-400'
                    )}>
                      {formatCurrency(banco.capitalActual || 0)}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Monto */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Monto del Gasto</label>
            <input
              type="number"
              {...form.register('monto', { valueAsNumber: true })}
              min={0}
              step="0.01"
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold text-center focus:border-red-500"
            />
            {bancoSeleccionado && !hasEnoughCapital && watchedValues.monto > 0 && (
              <p className="text-xs text-red-400">
                Capital insuficiente. Disponible: {formatCurrency(bancoSeleccionado.capitalActual || 0)}
              </p>
            )}
          </div>
          
          {/* Categoría */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => form.setValue('categoria', cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    watchedValues.categoria === cat
                      ? 'bg-red-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          {/* Concepto */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              <Receipt className="w-4 h-4" /> Concepto *
            </label>
            <input
              {...form.register('concepto')}
              placeholder="Ej: Pago de renta, Combustible, etc."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-red-500"
            />
          </div>
          
          {/* Observaciones */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Observaciones
            </label>
            <textarea
              {...form.register('observaciones')}
              rows={2}
              placeholder="Detalles adicionales..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-red-500 resize-none"
            />
          </div>
          
          {/* Preview */}
          {bancoSeleccionado && watchedValues.monto > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Nuevo saldo de {bancoSeleccionado.nombre}:</span>
                <span className="text-red-400 font-bold">
                  {formatCurrency((bancoSeleccionado.capitalActual || 0) - (watchedValues.monto || 0))}
                </span>
              </div>
            </div>
          )}
          
          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || !hasEnoughCapital}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Registrar Gasto
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

export default GastoForm
