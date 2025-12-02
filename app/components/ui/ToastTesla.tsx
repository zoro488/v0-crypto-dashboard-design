'use client'

/**
 * 🍞 TOAST TESLA - Notificaciones estilo Apple 2025
 * 
 * Características premium:
 * - Glassmorphism sutil con blur(16px)
 * - Animaciones spring physics
 * - Variantes: success, error, warning, info
 * - Auto-dismiss con progress bar
 * - Apilamiento inteligente
 */

import * as React from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { cn } from '@/app/lib/utils'
import { 
  Check, 
  X, 
  AlertTriangle, 
  Info,
  Loader2,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
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

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface ToastProviderProps {
  children: React.ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxToasts?: number
}

export function ToastProvider({ 
  children, 
  position = 'bottom-right',
  maxToasts = 5, 
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newToast: Toast = { 
      id, 
      duration: toast.variant === 'loading' ? Infinity : 5000,
      ...toast, 
    }
    
    setToasts((prev) => {
      const updated = [newToast, ...prev]
      return updated.slice(0, maxToasts)
    })

    return id
  }, [maxToasts])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const clearToasts = React.useCallback(() => {
    setToasts([])
  }, [])

  const positionStyles: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      
      {/* Toast Container */}
      <div 
        className={cn(
          'fixed z-[100] flex flex-col gap-3 pointer-events-none',
          'pb-safe', // Para mobile bottom bar
          positionStyles[position],
        )}
        aria-live="polite"
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast, index) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST ITEM
// ═══════════════════════════════════════════════════════════════════════════

interface ToastItemProps {
  toast: Toast
  onDismiss: () => void
  index: number
}

const toastVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 50, 
    scale: 0.9,
    filter: 'blur(4px)',
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: { 
    opacity: 0, 
    x: 100,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.32, 0, 0.67, 0],
    },
  },
}

function ToastItem({ toast, onDismiss, index }: ToastItemProps) {
  const [progress, setProgress] = React.useState(100)
  const [isPaused, setIsPaused] = React.useState(false)

  const icons = {
    success: Check,
    error: X,
    warning: AlertTriangle,
    info: Info,
    loading: Loader2,
  }

  const iconColors = {
    success: 'text-[#10B981] bg-[#10B981]/10',
    error: 'text-[#E31911] bg-[#E31911]/10',
    warning: 'text-[#F59E0B] bg-[#F59E0B]/10',
    info: 'text-white bg-white/10',
    loading: 'text-white bg-white/10',
  }

  const Icon = icons[toast.variant || 'info']

  // Auto-dismiss timer
  React.useEffect(() => {
    if (toast.duration === Infinity || isPaused) return

    const duration = toast.duration || 5000
    const interval = 50
    const decrement = (interval / duration) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          onDismiss()
          return 0
        }
        return prev - decrement
      })
    }, interval)

    return () => clearInterval(timer)
  }, [toast.duration, isPaused, onDismiss])

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ 
        zIndex: 100 - index,
        // Efecto apilamiento
        scale: 1 - index * 0.03,
        opacity: 1 - index * 0.1,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        'pointer-events-auto',
        'relative overflow-hidden',
        'w-[360px] max-w-[calc(100vw-2rem)]',
        'bg-[#1C1C1E]/95 backdrop-blur-[16px]',
        'border border-white/10',
        'rounded-2xl shadow-2xl shadow-black/50',
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icono */}
        <div className={cn(
          'flex items-center justify-center',
          'w-9 h-9 rounded-xl shrink-0',
          iconColors[toast.variant || 'info'],
        )}>
          <Icon className={cn(
            'w-5 h-5',
            toast.variant === 'loading' && 'animate-spin',
          )} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-white leading-snug">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-sm text-[#98989D] leading-snug">
              {toast.description}
            </p>
          )}
          
          {/* Action button */}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={cn(
                'mt-3 text-sm font-semibold',
                'text-[#E31911] hover:text-[#FF453A]',
                'transition-colors duration-200',
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className={cn(
            'shrink-0 w-6 h-6 rounded-lg',
            'flex items-center justify-center',
            'text-[#98989D] hover:text-white',
            'hover:bg-white/10',
            'transition-all duration-200',
          )}
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration !== Infinity && (
        <div className="h-[2px] bg-white/5">
          <motion.div
            className={cn(
              'h-full',
              toast.variant === 'error' && 'bg-[#E31911]',
              toast.variant === 'success' && 'bg-[#10B981]',
              toast.variant === 'warning' && 'bg-[#F59E0B]',
              (!toast.variant || toast.variant === 'info') && 'bg-white/40',
            )}
            style={{ width: `${progress}%` }}
            initial={false}
            transition={{ duration: 0.05 }}
          />
        </div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook para acciones rápidas de toast
 */
export function useToastActions() {
  const { addToast, removeToast } = useToast()

  return {
    success: (title: string, description?: string) => 
      addToast({ title, description, variant: 'success' }),
    
    error: (title: string, description?: string) => 
      addToast({ title, description, variant: 'error' }),
    
    warning: (title: string, description?: string) => 
      addToast({ title, description, variant: 'warning' }),
    
    info: (title: string, description?: string) => 
      addToast({ title, description, variant: 'info' }),
    
    loading: (title: string, description?: string) => 
      addToast({ title, description, variant: 'loading', duration: Infinity }),
    
    promise: async <T,>(
      promise: Promise<T>,
      messages: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((err: Error) => string)
      },
    ): Promise<T> => {
      const id = addToast({ 
        title: messages.loading, 
        variant: 'loading', 
        duration: Infinity, 
      })

      try {
        const data = await promise
        removeToast(id)
        addToast({ 
          title: typeof messages.success === 'function' 
            ? messages.success(data) 
            : messages.success, 
          variant: 'success', 
        })
        return data
      } catch (err) {
        removeToast(id)
        addToast({ 
          title: typeof messages.error === 'function' 
            ? messages.error(err as Error) 
            : messages.error, 
          variant: 'error', 
        })
        throw err
      }
    },
    
    dismiss: removeToast,
  }
}

export default ToastProvider
