/**
 * 🗑️ CONFIRMATION DIALOG - CHRONOS SYSTEM
 * 
 * Modal de confirmación reutilizable que reemplaza window.confirm()
 * Usa AlertDialog de shadcn/ui para mejor UX y accesibilidad
 * 
 * @module components/ui/confirmation-dialog
 */

'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog'
import { AlertTriangle, Trash2, Info, CheckCircle } from 'lucide-react'

export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'success'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmationVariant
  loading?: boolean
}

const variantConfig: Record<ConfirmationVariant, {
  icon: React.ReactNode
  confirmClass: string
}> = {
  danger: {
    icon: <Trash2 className="h-5 w-5 text-red-500" />,
    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    confirmClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  },
  info: {
    icon: <Info className="h-5 w-5 text-blue-500" />,
    confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  success: {
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    confirmClass: 'bg-green-600 hover:bg-green-700 text-white',
  },
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmationDialogProps) {
  const config = variantConfig[variant]
  const [isLoading, setIsLoading] = React.useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = loading || isLoading

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {config.icon}
            <AlertDialogTitle className="text-white">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-zinc-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
            disabled={isDisabled}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={config.confirmClass}
            disabled={isDisabled}
          >
            {isDisabled ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Procesando...
              </span>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Hook para usar el modal de confirmación de forma imperativa
 * 
 * @example
 * const { confirm, ConfirmDialog } = useConfirmation()
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: '¿Eliminar registro?',
 *     description: 'Esta acción no se puede deshacer.',
 *     variant: 'danger',
 *   })
 *   if (confirmed) {
 *     // Ejecutar eliminación
 *   }
 * }
 */
export function useConfirmation() {
  const [state, setState] = React.useState<{
    open: boolean
    title: string
    description: string
    variant: ConfirmationVariant
    confirmText?: string
    cancelText?: string
    resolve?: (value: boolean) => void
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'danger',
  })

  const confirm = React.useCallback((options: {
    title: string
    description: string
    variant?: ConfirmationVariant
    confirmText?: string
    cancelText?: string
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: options.title,
        description: options.description,
        variant: options.variant || 'danger',
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        resolve,
      })
    })
  }, [])

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open && state.resolve) {
      state.resolve(false)
    }
    setState((prev) => ({ ...prev, open }))
  }, [state.resolve])

  const handleConfirm = React.useCallback(() => {
    if (state.resolve) {
      state.resolve(true)
    }
  }, [state.resolve])

  const ConfirmDialog = React.useMemo(() => (
    <ConfirmationDialog
      open={state.open}
      onOpenChange={handleOpenChange}
      onConfirm={handleConfirm}
      title={state.title}
      description={state.description}
      variant={state.variant}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
    />
  ), [state, handleOpenChange, handleConfirm])

  return { confirm, ConfirmDialog }
}
