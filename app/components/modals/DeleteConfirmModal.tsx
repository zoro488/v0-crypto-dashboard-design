'use client'

/**
 * 🗑️ DELETE CONFIRM MODAL - Confirmación de eliminación Premium
 * 
 * Modal reutilizable para confirmar eliminación de cualquier registro
 * Con animaciones y feedback visual claro
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import {
  AlertTriangle,
  Trash2,
  Loader2,
  X,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'

interface DeleteConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: string
  description: string
  itemName?: string
  itemType?: string // 'cliente' | 'venta' | 'orden' | etc.
  dangerLevel?: 'normal' | 'high' // Para eliminaciones críticas
}

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType = 'registro',
  dangerLevel = 'normal',
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsDeleting(false)
    }
  }

  const isHighDanger = dangerLevel === 'high'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        size="sm"
        className={cn(
          'p-0',
          'bg-black/90 backdrop-blur-2xl',
          'border',
          isHighDanger ? 'border-red-500/30' : 'border-white/10',
          'text-white',
          'shadow-[0_0_60px_rgba(0,0,0,0.5)]',
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>

        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className={cn(
              'absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-[80px]',
              isHighDanger ? 'bg-red-500/30' : 'bg-orange-500/20',
            )}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        <div className="relative p-6 space-y-6">
          {/* Header Icon */}
          <div className="flex justify-center">
            <motion.div
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center',
                isHighDanger
                  ? 'bg-red-500/20 border-2 border-red-500/50'
                  : 'bg-orange-500/20 border-2 border-orange-500/50',
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {isHighDanger ? (
                <ShieldAlert className="w-10 h-10 text-red-400" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-orange-400" />
              )}
            </motion.div>
          </div>

          {/* Content */}
          <div className="text-center space-y-2">
            <motion.h3
              className="text-xl font-bold text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {title}
            </motion.h3>
            
            <motion.p
              className="text-gray-400 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {description}
            </motion.p>

            {itemName && (
              <motion.div
                className={cn(
                  'mt-4 p-3 rounded-lg border',
                  isHighDanger
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-orange-500/10 border-orange-500/20',
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {itemType} a eliminar
                </p>
                <p className={cn(
                  'font-semibold',
                  isHighDanger ? 'text-red-300' : 'text-orange-300',
                )}>
                  {itemName}
                </p>
              </motion.div>
            )}
          </div>

          {/* Warning */}
          <motion.div
            className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-400">
              <strong className="text-yellow-400">Advertencia:</strong>{' '}
              Esta acción no se puede deshacer. Todos los datos relacionados 
              con este {itemType} serán eliminados permanentemente.
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className={cn(
                'flex-1',
                isHighDanger
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white',
              )}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteConfirmModal
