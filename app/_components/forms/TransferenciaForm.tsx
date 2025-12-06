'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — FORMULARIO TRANSFERENCIA
// Transferencia animada entre bancos con línea 3D
// ═══════════════════════════════════════════════════════════════

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ArrowRightLeft, 
  Building2,
  Check,
  Loader2,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/app/_lib/utils'
import { formatCurrency } from '@/app/_lib/utils/formatters'
import { BANCOS_CONFIG } from '@/app/_lib/constants/bancos'
import type { Banco } from '@/database/schema'

const TransferenciaSchema = z.object({
  bancoOrigenId: z.string().min(1, 'Selecciona banco origen'),
  bancoDestinoId: z.string().min(1, 'Selecciona banco destino'),
  monto: z.number().positive('Monto debe ser positivo'),
  concepto: z.string().min(1, 'Concepto requerido'),
  observaciones: z.string().optional(),
}).refine(data => data.bancoOrigenId !== data.bancoDestinoId, {
  message: 'Origen y destino deben ser diferentes',
  path: ['bancoDestinoId'],
})

type TransferenciaInput = z.infer<typeof TransferenciaSchema>

interface TransferenciaFormProps {
  bancos: Banco[]
  onSuccess?: () => void
  onCancel?: () => void
}

export function TransferenciaForm({ bancos, onSuccess, onCancel }: TransferenciaFormProps) {
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)
  
  const form = useForm<TransferenciaInput>({
    resolver: zodResolver(TransferenciaSchema),
    defaultValues: {
      monto: 0,
      concepto: '',
    }
  })
  
  const watchedValues = form.watch()
  const bancoOrigen = bancos.find(b => b.id === watchedValues.bancoOrigenId)
  const bancoDestino = bancos.find(b => b.id === watchedValues.bancoDestinoId)
  const hasEnoughCapital = bancoOrigen ? (bancoOrigen.capitalActual || 0) >= (watchedValues.monto || 0) : false
  
  const handleSubmit = form.handleSubmit(async (data) => {
    if (!hasEnoughCapital) {
      toast.error('Capital insuficiente en banco origen')
      return
    }
    
    startTransition(async () => {
      try {
        const res = await fetch('/api/bancos/transferir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await res.json()
        if (!result.success) throw new Error(result.error)
        
        setShowSuccess(true)
        setTimeout(() => {
          toast.success('Transferencia completada', {
            description: `${formatCurrency(data.monto)} transferido exitosamente`,
          })
          onSuccess?.()
        }, 1500)
      } catch (error) {
        toast.error('Error en transferencia', {
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
      <div className="glass-panel rounded-3xl p-8 border border-cyan-500/20">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: showSuccess ? 360 : 0 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center"
          >
            {showSuccess ? (
              <Check className="w-8 h-8 text-green-400" />
            ) : (
              <ArrowRightLeft className="w-8 h-8 text-cyan-400" />
            )}
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Transferencia entre Bancos</h2>
          <p className="text-gray-400">Mueve capital entre tus bóvedas</p>
        </div>
        
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <Check className="w-12 h-12 text-green-400" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">¡Transferencia Exitosa!</h3>
              <p className="text-gray-400">
                {formatCurrency(watchedValues.monto || 0)} transferido de {bancoOrigen?.nombre} a {bancoDestino?.nombre}
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Banco Origen */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Banco Origen</label>
                <div className="grid grid-cols-3 gap-2">
                  {bancos.map(banco => {
                    const config = BANCOS_CONFIG[banco.id as keyof typeof BANCOS_CONFIG]
                    const isSelected = watchedValues.bancoOrigenId === banco.id
                    const isDestino = watchedValues.bancoDestinoId === banco.id
                    
                    return (
                      <button
                        key={banco.id}
                        type="button"
                        onClick={() => form.setValue('bancoOrigenId', banco.id)}
                        disabled={isDestino}
                        className={cn(
                          "p-3 rounded-xl border text-center transition-all",
                          isSelected 
                            ? 'bg-cyan-500/20 border-cyan-500' 
                            : 'bg-white/5 border-white/10 hover:border-white/20',
                          isDestino && 'opacity-30 cursor-not-allowed'
                        )}
                      >
                        <div 
                          className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: config?.color + '33' }}
                        >
                          <Building2 className="w-4 h-4" style={{ color: config?.color }} />
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
              
              {/* Arrow animation */}
              {watchedValues.bancoOrigenId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center"
                >
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="w-8 h-8 text-cyan-400" />
                  </motion.div>
                </motion.div>
              )}
              
              {/* Banco Destino */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Banco Destino</label>
                <div className="grid grid-cols-3 gap-2">
                  {bancos.map(banco => {
                    const config = BANCOS_CONFIG[banco.id as keyof typeof BANCOS_CONFIG]
                    const isSelected = watchedValues.bancoDestinoId === banco.id
                    const isOrigen = watchedValues.bancoOrigenId === banco.id
                    
                    return (
                      <button
                        key={banco.id}
                        type="button"
                        onClick={() => form.setValue('bancoDestinoId', banco.id)}
                        disabled={isOrigen}
                        className={cn(
                          "p-3 rounded-xl border text-center transition-all",
                          isSelected 
                            ? 'bg-green-500/20 border-green-500' 
                            : 'bg-white/5 border-white/10 hover:border-white/20',
                          isOrigen && 'opacity-30 cursor-not-allowed'
                        )}
                      >
                        <div 
                          className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: config?.color + '33' }}
                        >
                          <Building2 className="w-4 h-4" style={{ color: config?.color }} />
                        </div>
                        <p className="text-xs text-white truncate">{banco.nombre}</p>
                        <p className="text-xs text-gray-400 font-bold">
                          {formatCurrency(banco.capitalActual || 0)}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {/* Monto */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Monto a Transferir</label>
                <input
                  type="number"
                  {...form.register('monto', { valueAsNumber: true })}
                  min={0}
                  step="0.01"
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold text-center focus:border-cyan-500"
                />
                {bancoOrigen && !hasEnoughCapital && watchedValues.monto > 0 && (
                  <p className="text-xs text-red-400">
                    Capital insuficiente. Disponible: {formatCurrency(bancoOrigen.capitalActual || 0)}
                  </p>
                )}
              </div>
              
              {/* Concepto */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Concepto *</label>
                <input
                  {...form.register('concepto')}
                  placeholder="Ej: Reposición de caja, Inversión, etc."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-cyan-500"
                />
              </div>
              
              {/* Submit */}
              <button
                type="submit"
                disabled={isPending || !hasEnoughCapital}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-5 h-5" />
                    Realizar Transferencia
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
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default TransferenciaForm
