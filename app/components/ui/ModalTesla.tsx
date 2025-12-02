'use client'

/**
 * 🪟 MODAL TESLA - Modal glassmorphism estilo Apple 2025
 * 
 * Características premium:
 * - Backdrop blur(50px) con opacidad progresiva
 * - Animación spring para entrada/salida
 * - Glassmorphism premium en el contenido
 * - Focus trap y accesibilidad
 * - Cierre con ESC y click fuera
 */

import * as React from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { createPortal } from 'react-dom'
import { cn } from '@/app/lib/utils'
import { X } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface ModalTeslaProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  description?: string
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full'
  closeOnOverlay?: boolean
  closeOnEsc?: boolean
  showClose?: boolean
  className?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMACIONES
// ═══════════════════════════════════════════════════════════════════════════

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15, delay: 0.1 },
  },
}

const modalVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.15,
    },
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export function ModalTesla({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = 'default',
  closeOnOverlay = true,
  closeOnEsc = true,
  showClose = true,
  className,
}: ModalTeslaProps) {
  const [mounted, setMounted] = React.useState(false)
  const modalRef = React.useRef<HTMLDivElement>(null)

  // Montar en cliente
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Cerrar con ESC
  React.useEffect(() => {
    if (!isOpen || !closeOnEsc) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, closeOnEsc, onClose])

  // Bloquear scroll del body
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Focus trap
  React.useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTab)
    firstElement?.focus()
    
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  const sizeStyles = {
    sm: 'max-w-md',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => closeOnOverlay && onClose()}
            className={cn(
              'absolute inset-0',
              'bg-black/60 backdrop-blur-[50px]',
            )}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'relative w-full',
              'bg-[#1C1C1E]/95 backdrop-blur-[24px]',
              'border border-white/10',
              'rounded-[24px]',
              'shadow-2xl shadow-black/50',
              'overflow-hidden',
              sizeStyles[size],
              className,
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-description' : undefined}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-start justify-between gap-4 p-6 pb-0">
                <div>
                  {title && (
                    <h2 
                      id="modal-title"
                      className="text-xl font-semibold text-white"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p 
                      id="modal-description"
                      className="mt-1 text-sm text-[#98989D]"
                    >
                      {description}
                    </p>
                  )}
                </div>
                
                {showClose && (
                  <motion.button
                    onClick={onClose}
                    className={cn(
                      'shrink-0 w-8 h-8 rounded-full',
                      'flex items-center justify-center',
                      'bg-white/5 hover:bg-white/10',
                      'text-[#98989D] hover:text-white',
                      'transition-all duration-200',
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Cerrar modal"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL FOOTER
// ═══════════════════════════════════════════════════════════════════════════

interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  border?: boolean
}

export function ModalFooter({
  className,
  children,
  border = true,
  ...props
}: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 mt-6',
        border && 'pt-6 border-t border-white/8',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  loading = false,
}: ConfirmModalProps) {
  return (
    <ModalTesla
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <div className="text-center">
        {/* Icon */}
        <div className={cn(
          'w-16 h-16 mx-auto rounded-full',
          'flex items-center justify-center mb-4',
          variant === 'danger' 
            ? 'bg-[#E31911]/10 text-[#E31911]' 
            : 'bg-white/10 text-white',
        )}>
          {variant === 'danger' ? (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <h3 className="text-lg font-semibold text-white mb-2">
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-[#98989D] mb-6">
            {description}
          </p>
        )}

        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={loading}
            className={cn(
              'px-6 py-2.5 rounded-xl',
              'bg-white/5 hover:bg-white/10',
              'text-white font-medium',
              'transition-colors duration-200',
              'disabled:opacity-50',
            )}
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-6 py-2.5 rounded-xl font-medium',
              'transition-all duration-200',
              'disabled:opacity-50',
              variant === 'danger'
                ? 'bg-[#E31911] hover:bg-[#FF453A] text-white'
                : 'bg-white hover:bg-white/90 text-black',
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" cy="12" r="10" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none" 
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" 
                  />
                </svg>
                Procesando...
              </span>
            ) : confirmText}
          </button>
        </div>
      </div>
    </ModalTesla>
  )
}

export default ModalTesla
