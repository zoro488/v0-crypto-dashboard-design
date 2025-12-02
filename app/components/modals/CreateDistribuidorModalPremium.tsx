'use client'

/**
 * 💎 CREATE DISTRIBUIDOR MODAL PREMIUM - Simplificado
 * 
 * Modal para crear distribuidores con campos esenciales:
 * - Nombre (requerido)
 * - Observaciones (opcional)
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { Badge } from '@/app/components/ui/badge'
import {
  Building2,
  FileText,
  Loader2,
  X,
  CheckCircle2,
  Sparkles,
  Zap,
  Truck,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useToast } from '@/app/hooks/use-toast'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'
import { crearDistribuidor } from '@/app/lib/services/unified-data-service'

// ============================================
// SCHEMA ZOD - Simplificado
// ============================================

const distribuidorSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  observaciones: z.string().max(500).optional(),
})

type DistribuidorInput = z.infer<typeof distribuidorSchema>

// ============================================
// TIPOS
// ============================================

interface CreateDistribuidorModalPremiumProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

// Distribuidores existentes del sistema
const DISTRIBUIDORES_EXISTENTES = [
  'Q-MAYA', 'PACMAN', 'CH-MONTE', 'VALLE-MONTE', 'A/X🌶️🦀', 'Q-MAYA-MP',
]

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CreateDistribuidorModalPremium({ 
  open, 
  onClose, 
  onSuccess, 
}: CreateDistribuidorModalPremiumProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showSuccess, setShowSuccess] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<DistribuidorInput>({
    resolver: zodResolver(distribuidorSchema),
    mode: 'onChange',
    defaultValues: {
      nombre: '',
      observaciones: '',
    },
  })

  const watchedNombre = watch('nombre')

  // Reset form cuando se abre el modal
  React.useEffect(() => {
    if (open) {
      reset({ nombre: '', observaciones: '' })
      setShowSuccess(false)
    }
  }, [open, reset])

  // Submit
  const onSubmit = async (data: DistribuidorInput) => {
    setIsSubmitting(true)

    try {
      const distribuidorData = {
        nombre: data.nombre.trim().toUpperCase(),
        observaciones: data.observaciones?.trim() || undefined,
      }

      const docId = await crearDistribuidor(distribuidorData)

      logger.info('Distribuidor creado exitosamente', {
        context: 'CreateDistribuidorModalPremium',
        data: { id: docId, nombre: data.nombre },
      })

      setShowSuccess(true)

      setTimeout(() => {
        toast({
          title: '✅ Distribuidor Creado',
          description: `${data.nombre.toUpperCase()} agregado al sistema`,
        })
        onClose()
        onSuccess?.()
        useAppStore.getState().triggerDataRefresh()
      }, 1200)

    } catch (error) {
      logger.error('Error al crear distribuidor', error, {
        context: 'CreateDistribuidorModalPremium',
      })
      toast({
        title: 'Error',
        description: 'No se pudo crear el distribuidor',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        size="default"
        className={cn(
          'p-0',
          'bg-black/90 backdrop-blur-2xl',
          'border border-white/10',
          'text-white',
          'shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_100px_rgba(168,85,247,0.15)]',
        )}
      >
        <DialogTitle className="sr-only">Nuevo Distribuidor</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para agregar un nuevo distribuidor al sistema
        </DialogDescription>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
          <motion.div 
            className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-32 -left-32 w-64 h-64 bg-pink-500/20 rounded-full blur-[80px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </div>

        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-white mb-2"
              >
                ¡Distribuidor Creado!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400"
              >
                {watchedNombre?.toUpperCase()} agregado al sistema
              </motion.p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit(onSubmit)}
              className="relative flex flex-col"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Header */}
              <div className="relative h-20 border-b border-white/10 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10">
                <div className="relative h-full px-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                      <Truck className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Nuevo Distribuidor</h2>
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-yellow-400" />
                        Agregar proveedor
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="w-10 h-10 rounded-full hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Distribuidores existentes */}
                <motion.div variants={itemVariants}>
                  <Label className="text-xs text-gray-500 mb-2 block">Distribuidores Actuales</Label>
                  <div className="flex flex-wrap gap-2">
                    {DISTRIBUIDORES_EXISTENTES.map((d) => (
                      <Badge
                        key={d}
                        variant="outline"
                        className="border-purple-500/30 text-purple-400 bg-purple-500/10"
                      >
                        {d}
                      </Badge>
                    ))}
                  </div>
                </motion.div>

                {/* Nombre del distribuidor */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    Nombre del Distribuidor *
                  </Label>
                  <Input
                    {...register('nombre')}
                    placeholder="Ej: NUEVO-PROVEEDOR"
                    autoFocus
                    className={cn(
                      'h-14 text-lg bg-white/5 border-white/10 text-white uppercase',
                      'placeholder:text-gray-500',
                      'focus:border-purple-500/50',
                      errors.nombre && 'border-red-500',
                    )}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-red-400">{errors.nombre.message}</p>
                  )}
                </motion.div>

                {/* Observaciones */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Observaciones
                    <span className="text-gray-600 text-xs">(opcional)</span>
                  </Label>
                  <Textarea
                    {...register('observaciones')}
                    placeholder="Notas sobre el distribuidor, ubicación, contacto, etc..."
                    rows={4}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none focus:border-cyan-500/50"
                  />
                </motion.div>

                {/* Preview Card */}
                {watchedNombre && watchedNombre.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{watchedNombre.toUpperCase()}</p>
                        <p className="text-sm text-gray-400">Distribuidor nuevo</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="ml-auto border-green-500/50 text-green-400 bg-green-500/10"
                      >
                        Activo
                      </Badge>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className={cn(
                'h-20 border-t border-white/10',
                'bg-gradient-to-r from-black/50 via-white/5 to-black/50',
                'px-6 flex items-center justify-between',
              )}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-white"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || !watchedNombre || watchedNombre.length < 2}
                  className={cn(
                    'min-w-[180px]',
                    'bg-gradient-to-r from-purple-600 to-pink-600',
                    'hover:from-purple-500 hover:to-pink-500',
                    'text-white font-bold',
                    'shadow-[0_0_30px_rgba(168,85,247,0.4)]',
                    'disabled:opacity-50',
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Crear Distribuidor
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export default CreateDistribuidorModalPremium
