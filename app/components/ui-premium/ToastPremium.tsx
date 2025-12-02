'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 🎨 TOAST PREMIUM - Estilo Apple/Tesla
 * 
 * Sistema de notificaciones:
 * - success: Verde con check
 * - error: Rojo con alerta
 * - warning: Naranja con triángulo
 * - info: Azul con info
 * 
 * Características:
 * - Auto-dismiss (configurable)
 * - Stacking múltiple
 * - Swipe to dismiss
 * - Posición configurable
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

// Provider Component
export function ToastProvider({ 
  children, 
  position = 'bottom-right',
  maxToasts = 5, 
}: { 
  children: ReactNode
  position?: ToastPosition
  maxToasts?: number
}) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id }
    
    setToasts((prev) => {
      const updated = [newToast, ...prev]
      return updated.slice(0, maxToasts)
    })

    // Auto-dismiss
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Position styles
  const positions = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      
      {/* Toast Container */}
      <div className={cn('fixed z-[100] flex flex-col gap-3 pointer-events-none', positions[position])}>
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// Toast Item Component
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const icons: Record<ToastType, LucideIcon> = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const colors = {
    success: {
      bg: 'bg-[#30D158]/10',
      border: 'border-[#30D158]/30',
      icon: 'text-[#30D158]',
      glow: 'shadow-[0_0_20px_rgba(48,209,88,0.2)]',
    },
    error: {
      bg: 'bg-[#FF453A]/10',
      border: 'border-[#FF453A]/30',
      icon: 'text-[#FF453A]',
      glow: 'shadow-[0_0_20px_rgba(255,69,58,0.2)]',
    },
    warning: {
      bg: 'bg-[#FF9F0A]/10',
      border: 'border-[#FF9F0A]/30',
      icon: 'text-[#FF9F0A]',
      glow: 'shadow-[0_0_20px_rgba(255,159,10,0.2)]',
    },
    info: {
      bg: 'bg-[#0A84FF]/10',
      border: 'border-[#0A84FF]/30',
      icon: 'text-[#0A84FF]',
      glow: 'shadow-[0_0_20px_rgba(10,132,255,0.2)]',
    },
  }

  const Icon = icons[toast.type]
  const colorScheme = colors[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100) {
          onDismiss(toast.id)
        }
      }}
      className={cn(
        'pointer-events-auto',
        'w-[400px] max-w-[calc(100vw-2rem)]',
        'p-4',
        'rounded-xl',
        'backdrop-blur-3xl',
        'border',
        colorScheme.bg,
        colorScheme.border,
        colorScheme.glow,
        'flex items-start gap-3',
        'cursor-pointer',
      )}
    >
      {/* Icon */}
      <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', colorScheme.icon)} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-semibold text-white apple-font-smoothing">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="mt-1 text-sm text-white/60 apple-font-smoothing">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toast.action!.onClick()
              onDismiss(toast.id)
            }}
            className={cn(
              'mt-3 text-sm font-semibold',
              colorScheme.icon,
              'hover:opacity-70',
              'transition-opacity',
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDismiss(toast.id)
        }}
        className="flex-shrink-0 text-white/40 hover:text-white/70 transition-colors"
        aria-label="Cerrar notificación"
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  )
}

// Helper hooks
export function useToastHelpers() {
  const { addToast } = useToast()

  const success = useCallback((title: string, description?: string) => {
    return addToast({ type: 'success', title, description })
  }, [addToast])

  const error = useCallback((title: string, description?: string) => {
    return addToast({ type: 'error', title, description })
  }, [addToast])

  const warning = useCallback((title: string, description?: string) => {
    return addToast({ type: 'warning', title, description })
  }, [addToast])

  const info = useCallback((title: string, description?: string) => {
    return addToast({ type: 'info', title, description })
  }, [addToast])

  return { success, error, warning, info }
}
