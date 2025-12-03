'use client'

/**
 * 💎 CREATE CLIENTE MODAL PREMIUM - Simplificado
 * 
 * Modal para crear/editar clientes con campos esenciales:
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
import {
  User,
  FileText,
  Loader2,
  X,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useToast } from '@/app/hooks/use-toast'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'
import { crearCliente, actualizarCliente } from '@/app/lib/services/unified-data-service'

// ============================================
// SCHEMA ZOD - Simplificado
// ============================================

const clienteSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  observaciones: z.string().max(500).optional(),
})

type ClienteInput = z.infer<typeof clienteSchema>

// ============================================
// TIPOS
// ============================================

interface CreateClienteModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editData?: { id?: string; nombre?: string; observaciones?: string } | null
}

// Animaciones
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.4, staggerChildren: 0.08 },
  },
  exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CreateClienteModalPremium({ 
  open, 
  onClose, 
  onSuccess,
  editData, 
}: CreateClienteModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showSuccess, setShowSuccess] = React.useState(false)
  
  const isEdit = !!editData?.id

  const form = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: editData?.nombre || '',
      observaciones: editData?.observaciones || '',
    },
  })

  const { watch, handleSubmit, reset, formState: { errors } } = form
  const watchedNombre = watch('nombre')

  // Reset form cuando se abre/cierra
  React.useEffect(() => {
    if (open) {
      setShowSuccess(false)
      if (editData) {
        reset({
          nombre: editData.nombre || '',
          observaciones: editData.observaciones || '',
        })
      } else {
        reset({ nombre: '', observaciones: '' })
      }
    }
  }, [open, editData, reset])

  // Submit handler
  const onSubmit = async (data: ClienteInput) => {
    setIsSubmitting(true)

    try {
      const clienteData = {
        nombre: data.nombre.trim(),
        observaciones: data.observaciones?.trim() || undefined,
      }

      let result: string | null = null

      if (isEdit && editData?.id) {
        logger.info('Actualizando cliente', { 
          context: 'CreateClienteModalPremium',
          data: { clienteId: editData.id },
        })
        await actualizarCliente(editData.id, clienteData)
        result = editData.id // Usar el ID existente como resultado
      } else {
        logger.info('Creando cliente', { 
          context: 'CreateClienteModalPremium',
          data: clienteData,
        })
        result = await crearCliente(clienteData)
      }

      if (result) {
        setShowSuccess(true)
        
        setTimeout(() => {
          toast({
            title: isEdit ? '✅ Cliente Actualizado' : '✅ Cliente Creado',
            description: `${data.nombre} guardado exitosamente`,
          })
          onClose()
          onSuccess?.()
          useAppStore.getState().triggerDataRefresh()
        }, 1200)
      } else {
        throw new Error('No se pudo guardar el cliente')
      }

    } catch (error) {
      logger.error('Error al guardar cliente', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar el cliente',
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
          'shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_100px_rgba(59,130,246,0.15)]',
        )}
      >
        <DialogTitle className="sr-only">
          {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para gestionar datos del cliente
        </DialogDescription>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
          <motion.div 
            className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
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
                className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-white mb-2"
              >
                {isEdit ? '¡Cliente Actualizado!' : '¡Cliente Creado!'}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400"
              >
                {watchedNombre} guardado exitosamente
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
              <div className="relative h-20 border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10">
                <div className="relative h-full px-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <User className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
                      </h2>
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-yellow-400" />
                        Información del cliente
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
                {/* Nombre */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    Nombre del Cliente *
                  </Label>
                  <div className="relative">
                    <Input
                      {...form.register('nombre')}
                      placeholder="Ej: Juan Pérez, Valle, Distribuidora ABC..."
                      autoFocus
                      className={cn(
                        'h-14 text-lg bg-white/5 border-white/10 text-white',
                        'placeholder:text-gray-500',
                        'focus:border-blue-500/50 focus:ring-blue-500/20',
                        errors.nombre && 'border-red-500/50',
                      )}
                    />
                    {errors.nombre && (
                      <p className="text-xs text-red-400 mt-2">{errors.nombre.message}</p>
                    )}
                  </div>
                </motion.div>

                {/* Observaciones */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    Observaciones
                    <span className="text-gray-600 text-xs">(opcional)</span>
                  </Label>
                  <Textarea
                    {...form.register('observaciones')}
                    placeholder="Notas adicionales sobre el cliente..."
                    rows={4}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none focus:border-purple-500/50"
                  />
                </motion.div>

                {/* Preview */}
                {watchedNombre && watchedNombre.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{watchedNombre}</p>
                        <p className="text-sm text-gray-400">Cliente {isEdit ? 'actualizado' : 'nuevo'}</p>
                      </div>
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
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || !watchedNombre || watchedNombre.length < 2}
                  className={cn(
                    'min-w-[160px]',
                    'bg-gradient-to-r from-blue-600 to-cyan-600',
                    'hover:from-blue-500 hover:to-cyan-500',
                    'text-white font-bold',
                    'shadow-[0_0_30px_rgba(59,130,246,0.4)]',
                    'transition-all duration-300',
                    'disabled:opacity-50',
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      {isEdit ? 'Actualizar' : 'Crear Cliente'}
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

export default CreateClienteModalPremium
