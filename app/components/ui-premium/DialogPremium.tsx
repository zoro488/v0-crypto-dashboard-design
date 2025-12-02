'use client'

import { forwardRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModalPremium, type ModalPremiumProps } from './ModalPremium'
import { ButtonPremium } from './ButtonPremium'

/**
 * 🎨 DIALOG PREMIUM - Estilo Apple/Tesla
 * 
 * Variantes especializadas de modales:
 * - Confirm: Confirmación de acción
 * - Alert: Alerta importante
 * - Warning: Advertencia
 * - Success: Confirmación exitosa
 * 
 * Basado en ModalPremium con estilos predefinidos
 */

export type DialogVariant = 'confirm' | 'alert' | 'warning' | 'success'

export interface DialogPremiumProps extends Omit<ModalPremiumProps, 'children'> {
  variant?: DialogVariant
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  destructive?: boolean
}

const DialogPremium = forwardRef<HTMLDivElement, DialogPremiumProps>(
  (
    {
      variant = 'confirm',
      title,
      description,
      confirmLabel = 'Confirmar',
      cancelLabel = 'Cancelar',
      onConfirm,
      onCancel,
      loading = false,
      destructive = false,
      size = 'sm',
      ...modalProps
    },
    ref,
  ) => {
    // Icons y colores por variante
    const variantConfig = {
      confirm: {
        icon: Info,
        iconColor: 'text-[#0A84FF]',
        iconBg: 'bg-[#0A84FF]/10',
        iconBorder: 'border-[#0A84FF]/30',
        iconGlow: 'shadow-[0_0_20px_rgba(10,132,255,0.2)]',
      },
      alert: {
        icon: AlertCircle,
        iconColor: 'text-[#FF453A]',
        iconBg: 'bg-[#FF453A]/10',
        iconBorder: 'border-[#FF453A]/30',
        iconGlow: 'shadow-[0_0_20px_rgba(255,69,58,0.2)]',
      },
      warning: {
        icon: AlertTriangle,
        iconColor: 'text-[#FF9F0A]',
        iconBg: 'bg-[#FF9F0A]/10',
        iconBorder: 'border-[#FF9F0A]/30',
        iconGlow: 'shadow-[0_0_20px_rgba(255,159,10,0.2)]',
      },
      success: {
        icon: CheckCircle2,
        iconColor: 'text-[#30D158]',
        iconBg: 'bg-[#30D158]/10',
        iconBorder: 'border-[#30D158]/30',
        iconGlow: 'shadow-[0_0_20px_rgba(48,209,88,0.2)]',
      },
    }

    const config = variantConfig[variant]
    const Icon = config.icon

    const handleConfirm = async () => {
      if (onConfirm) {
        await onConfirm()
      }
    }

    const handleCancel = () => {
      if (onCancel) {
        onCancel()
      }
      modalProps.onOpenChange(false)
    }

    return (
      <ModalPremium
        {...modalProps}
        ref={ref}
        size={size}
        showClose={false}
      >
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className={cn(
              'w-16 h-16',
              'rounded-2xl',
              'flex items-center justify-center',
              'border',
              'backdrop-blur-xl',
              config.iconBg,
              config.iconBorder,
              config.iconGlow,
              'mb-6',
            )}
          >
            <Icon className={cn('w-8 h-8', config.iconColor)} />
          </motion.div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3 apple-font-smoothing">
            {title}
          </h2>

          {/* Description */}
          <p className="text-base text-white/60 mb-8 apple-font-smoothing max-w-md">
            {description}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full">
            {/* Cancel Button */}
            <ButtonPremium
              variant="secondary"
              size="lg"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              {cancelLabel}
            </ButtonPremium>

            {/* Confirm Button */}
            <ButtonPremium
              variant={destructive || variant === 'alert' ? 'destructive' : 'primary'}
              size="lg"
              onClick={handleConfirm}
              loading={loading}
              className="flex-1"
            >
              {confirmLabel}
            </ButtonPremium>
          </div>
        </div>
      </ModalPremium>
    )
  },
)

DialogPremium.displayName = 'DialogPremium'

// Hook for programmatic dialogs
export function useDialog() {
  // Implementation would use React state + Context
  // For now, return a basic API
  
  const confirm = (props: Omit<DialogPremiumProps, 'open' | 'onOpenChange'>) => {
    return new Promise<boolean>((resolve) => {
      // Implementation would mount a DialogPremium with these props
      // and resolve when user clicks confirm/cancel
      console.log('Dialog confirm:', props)
      resolve(true)
    })
  }

  const alert = (title: string, description: string) => {
    return confirm({
      variant: 'alert',
      title,
      description,
      confirmLabel: 'Aceptar',
      cancelLabel: 'Cancelar',
    })
  }

  const warning = (title: string, description: string) => {
    return confirm({
      variant: 'warning',
      title,
      description,
      confirmLabel: 'Continuar',
      cancelLabel: 'Cancelar',
    })
  }

  return { confirm, alert, warning }
}

export { DialogPremium }
