'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — MODAL GASTO
// Registro de gastos desde cualquier banco
// ═══════════════════════════════════════════════════════════════════════════

import { useTransition } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Minus, 
  Check,
  Receipt,
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

const GastoSchema = z.object({
  bancoId: z.string().min(1, 'Selecciona un banco'),
  monto: z.number().positive('Monto debe ser positivo'),
  concepto: z.string().min(1, 'Concepto requerido'),
  categoria: z.string().optional(),
})

type GastoFormData = z.infer<typeof GastoSchema>

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface GastoModalProps {
  isOpen: boolean
  onClose: () => void
  bancoPreseleccionado?: BancoId
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

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function GastoModal({ isOpen, onClose, bancoPreseleccionado }: GastoModalProps) {
  const [isPending, startTransition] = useTransition()
  
  // Zustand store
  const { bancos, registrarGasto } = useChronosStore()
  
  const form = useForm<GastoFormData>({
    resolver: zodResolver(GastoSchema),
    defaultValues: {
      bancoId: bancoPreseleccionado || '',
      monto: 0,
      concepto: '',
      categoria: 'Operaciones',
    }
  })
  
  const watchedValues = form.watch()
  const bancoSeleccionado = bancos[watchedValues.bancoId as BancoId]
  const capitalDisponible = bancoSeleccionado?.capitalActual || 0
  const hasEnoughCapital = capitalDisponible >= (watchedValues.monto || 0)
  
  const handleReset = () => {
    form.reset({
      bancoId: bancoPreseleccionado || '',
      monto: 0,
      concepto: '',
      categoria: 'Operaciones',
    })
  }
  
  const handleSubmit = form.handleSubmit(async (data) => {
    if (!hasEnoughCapital) {
      toast.error('Capital insuficiente')
      return
    }
    
    startTransition(() => {
      try {
        const conceptoCompleto = data.categoria 
          ? `[${data.categoria}] ${data.concepto}`
          : data.concepto
          
        registrarGasto(
          data.bancoId as BancoId,
          data.monto,
          conceptoCompleto
        )
        
        toast.success('Gasto registrado', {
          description: `${formatCurrency(data.monto)} - ${data.concepto}`,
        })
        
        handleReset()
        onClose()
      } catch (error) {
        toast.error('Error al registrar gasto', {
          description: error instanceof Error ? error.message : 'Intenta de nuevo',
        })
      }
    })
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Gasto"
      subtitle="Retira fondos de un banco"
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
                      ? 'border-red-500 bg-red-500/10' 
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
          <label className="text-sm text-gray-400">Monto del Gasto</label>
          <input
            type="number"
            {...form.register('monto', { valueAsNumber: true })}
            min={0}
            max={capitalDisponible}
            step="0.01"
            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold text-center focus:border-red-500"
          />
          {bancoSeleccionado && (
            <p className="text-xs text-gray-500 text-center">
              Disponible: {formatCurrency(capitalDisponible)}
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
                  "px-3 py-1.5 rounded-lg text-sm transition-all",
                  watchedValues.categoria === cat
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
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
            placeholder="Describe el gasto..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-red-500"
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
            variant="danger"
            isLoading={isPending}
            disabled={!hasEnoughCapital || !watchedValues.bancoId}
            icon={<Minus className="w-4 h-4" />}
          >
            Registrar Gasto
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
