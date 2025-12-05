'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — MODAL INGRESO
// Registro de ingresos a cualquier banco
// ═══════════════════════════════════════════════════════════════════════════

import { useTransition } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Plus, 
  Check,
  Wallet,
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

const IngresoSchema = z.object({
  bancoId: z.string().min(1, 'Selecciona un banco'),
  monto: z.number().positive('Monto debe ser positivo'),
  concepto: z.string().min(1, 'Concepto requerido'),
  categoria: z.string().optional(),
})

type IngresoFormData = z.infer<typeof IngresoSchema>

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface IngresoModalProps {
  isOpen: boolean
  onClose: () => void
  bancoPreseleccionado?: BancoId
}

const CATEGORIAS = [
  'Ventas',
  'Cobros',
  'Inversiones',
  'Préstamos',
  'Devoluciones',
  'Intereses',
  'Otros',
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function IngresoModal({ isOpen, onClose, bancoPreseleccionado }: IngresoModalProps) {
  const [isPending, startTransition] = useTransition()
  
  // Zustand store
  const { bancos, registrarIngreso } = useChronosStore()
  
  const form = useForm<IngresoFormData>({
    resolver: zodResolver(IngresoSchema),
    defaultValues: {
      bancoId: bancoPreseleccionado || '',
      monto: 0,
      concepto: '',
      categoria: 'Ventas',
    }
  })
  
  const watchedValues = form.watch()
  const bancoSeleccionado = bancos[watchedValues.bancoId as BancoId]
  
  const handleReset = () => {
    form.reset({
      bancoId: bancoPreseleccionado || '',
      monto: 0,
      concepto: '',
      categoria: 'Ventas',
    })
  }
  
  const handleSubmit = form.handleSubmit(async (data) => {
    startTransition(() => {
      try {
        const conceptoCompleto = data.categoria 
          ? `[${data.categoria}] ${data.concepto}`
          : data.concepto
          
        registrarIngreso(
          data.bancoId as BancoId,
          data.monto,
          conceptoCompleto
        )
        
        toast.success('Ingreso registrado', {
          description: `${formatCurrency(data.monto)} agregado a ${BANCOS_CONFIG[data.bancoId as BancoId]?.nombre}`,
        })
        
        handleReset()
        onClose()
      } catch (error) {
        toast.error('Error al registrar ingreso', {
          description: error instanceof Error ? error.message : 'Intenta de nuevo',
        })
      }
    })
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Ingreso"
      subtitle="Agrega fondos a un banco"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Banco */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Seleccionar Banco</label>
          <div className="grid grid-cols-2 gap-2">
            {BANCOS_ORDENADOS.map(config => {
              const bancoId = config.id
              const banco = bancos[bancoId]
              const isSelected = watchedValues.bancoId === bancoId
              
              return (
                <button
                  key={bancoId}
                  type="button"
                  onClick={() => form.setValue('bancoId', bancoId)}
                  className={cn(
                    "p-3 rounded-xl border transition-all text-left",
                    isSelected 
                      ? 'border-green-500 bg-green-500/10' 
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
          <label className="text-sm text-gray-400">Monto del Ingreso</label>
          <input
            type="number"
            {...form.register('monto', { valueAsNumber: true })}
            min={0}
            step="0.01"
            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold text-center focus:border-green-500"
          />
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
                  "px-3 py-1.5 rounded-lg text-sm transition-all",
                  watchedValues.categoria === cat
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {/* Concepto */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Concepto / Descripción</label>
          <input
            {...form.register('concepto')}
            placeholder="Describe el ingreso..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500"
          />
        </div>
        
        {/* Preview */}
        {bancoSeleccionado && (watchedValues.monto || 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-green-500/10 border border-green-500/20"
          >
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Capital actual:</span>
              <span className="text-white">{formatCurrency(bancoSeleccionado.capitalActual || 0)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Después del ingreso:</span>
              <span className="text-green-400 font-bold">
                {formatCurrency((bancoSeleccionado.capitalActual || 0) + (watchedValues.monto || 0))}
              </span>
            </div>
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
            disabled={!watchedValues.bancoId || (watchedValues.monto || 0) <= 0}
            icon={<Plus className="w-4 h-4" />}
          >
            Registrar Ingreso
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
