'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — MODAL TRANSFERENCIA
// Transferencia entre bancos con visualización animada
// ═══════════════════════════════════════════════════════════════════════════

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
import { Modal, Button, ModalFooter } from '../ui/Modal'
import { useChronosStore } from '@/app/lib/store'
import { BANCOS_CONFIG, BANCOS_ORDENADOS } from '@/app/_lib/constants/bancos'
import type { BancoId } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

const TransferenciaSchema = z.object({
  bancoOrigenId: z.string().min(1, 'Selecciona banco origen'),
  bancoDestinoId: z.string().min(1, 'Selecciona banco destino'),
  monto: z.number().positive('Monto debe ser positivo'),
  concepto: z.string().min(1, 'Concepto requerido'),
}).refine(data => data.bancoOrigenId !== data.bancoDestinoId, {
  message: 'Origen y destino deben ser diferentes',
  path: ['bancoDestinoId'],
})

type TransferenciaFormData = z.infer<typeof TransferenciaSchema>

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface TransferenciaModalProps {
  isOpen: boolean
  onClose: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function TransferenciaModal({ isOpen, onClose }: TransferenciaModalProps) {
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Zustand store
  const { bancos, transferir } = useChronosStore()
  
  const form = useForm<TransferenciaFormData>({
    resolver: zodResolver(TransferenciaSchema),
    defaultValues: {
      bancoOrigenId: '',
      bancoDestinoId: '',
      monto: 0,
      concepto: 'Transferencia entre cuentas',
    }
  })
  
  const watchedValues = form.watch()
  const bancoOrigen = bancos[watchedValues.bancoOrigenId as BancoId]
  const bancoDestino = bancos[watchedValues.bancoDestinoId as BancoId]
  const capitalDisponible = bancoOrigen?.capitalActual || 0
  const hasEnoughCapital = capitalDisponible >= (watchedValues.monto || 0)
  
  const handleReset = () => {
    form.reset()
    setShowSuccess(false)
  }
  
  const handleSubmit = form.handleSubmit(async (data) => {
    if (!hasEnoughCapital) {
      toast.error('Capital insuficiente en banco origen')
      return
    }
    
    startTransition(() => {
      try {
        transferir(
          data.bancoOrigenId as BancoId,
          data.bancoDestinoId as BancoId,
          data.monto,
          data.concepto
        )
        
        setShowSuccess(true)
        setTimeout(() => {
          toast.success('Transferencia completada', {
            description: `${formatCurrency(data.monto)} transferido exitosamente`,
          })
          handleReset()
          onClose()
        }, 1500)
      } catch (error) {
        toast.error('Error en transferencia', {
          description: error instanceof Error ? error.message : 'Intenta de nuevo',
        })
      }
    })
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transferencia entre Bancos"
      subtitle="Mueve fondos entre tus cuentas"
      size="md"
    >
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <Check className="w-10 h-10 text-green-400" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">¡Transferencia Exitosa!</h3>
            <p className="text-gray-400">{formatCurrency(watchedValues.monto)} transferido</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Banco Origen */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Banco Origen</label>
              <div className="grid grid-cols-2 gap-2">
                {BANCOS_ORDENADOS.map(config => {
                  const bancoId = config.id
                  const banco = bancos[bancoId]
                  const isSelected = watchedValues.bancoOrigenId === bancoId
                  const isDestino = watchedValues.bancoDestinoId === bancoId
                  
                  return (
                    <button
                      key={bancoId}
                      type="button"
                      disabled={isDestino}
                      onClick={() => form.setValue('bancoOrigenId', bancoId)}
                      className={cn(
                        "p-3 rounded-xl border transition-all text-left",
                        isSelected 
                          ? 'border-cyan-500 bg-cyan-500/10' 
                          : isDestino
                          ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
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
            
            {/* Flecha animada */}
            {watchedValues.bancoOrigenId && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="p-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30"
                >
                  <ArrowRightLeft className="w-5 h-5 text-cyan-400 rotate-90" />
                </motion.div>
              </motion.div>
            )}
            
            {/* Banco Destino */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Banco Destino</label>
              <div className="grid grid-cols-2 gap-2">
                {BANCOS_ORDENADOS.map(config => {
                  const bancoId = config.id
                  const banco = bancos[bancoId]
                  const isSelected = watchedValues.bancoDestinoId === bancoId
                  const isOrigen = watchedValues.bancoOrigenId === bancoId
                  
                  return (
                    <button
                      key={bancoId}
                      type="button"
                      disabled={isOrigen}
                      onClick={() => form.setValue('bancoDestinoId', bancoId)}
                      className={cn(
                        "p-3 rounded-xl border transition-all text-left",
                        isSelected 
                          ? 'border-purple-500 bg-purple-500/10' 
                          : isOrigen
                          ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
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
            
            {/* Monto */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Monto a Transferir</label>
              <input
                type="number"
                {...form.register('monto', { valueAsNumber: true })}
                min={0}
                max={capitalDisponible}
                step="0.01"
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold text-center focus:border-cyan-500"
              />
              {bancoOrigen && (
                <p className="text-xs text-gray-500 text-center">
                  Disponible: {formatCurrency(capitalDisponible)}
                </p>
              )}
            </div>
            
            {/* Concepto */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Concepto</label>
              <input
                {...form.register('concepto')}
                placeholder="Razón de la transferencia"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-cyan-500"
              />
            </div>
            
            {/* Warning */}
            {!hasEnoughCapital && (watchedValues.monto || 0) > 0 && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">
                  ⚠️ Capital insuficiente. Disponible: {formatCurrency(capitalDisponible)}
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
                disabled={!hasEnoughCapital || !watchedValues.bancoOrigenId || !watchedValues.bancoDestinoId}
                icon={<ArrowRightLeft className="w-4 h-4" />}
              >
                Transferir
              </Button>
            </ModalFooter>
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  )
}
