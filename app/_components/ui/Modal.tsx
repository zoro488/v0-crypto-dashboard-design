'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — MODAL PREMIUM
// Diseño Apple Vision Pro + Tesla 2025
// Centrado automático + scroll interno + glassmorphism
// Sin dependencia de headlessui - Solo Framer Motion
// ═══════════════════════════════════════════════════════════════════════════

import { ReactNode, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/app/_lib/utils'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] w-full',
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
  showCloseButton = true,
  className,
}: ModalProps) {
  // Cerrar con ESC
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])
  
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  // SSR safe portal
  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay con blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Container centrado */}
          <div className="fixed inset-0 z-[101] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  'relative w-full transform rounded-3xl',
                  'bg-gradient-to-b from-zinc-900/95 to-black/95',
                  'border border-white/10',
                  'shadow-2xl shadow-purple-500/10',
                  'backdrop-blur-2xl',
                  'max-h-[90vh] overflow-hidden',
                  sizeClasses[size],
                  className
                )}
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-zinc-900/80 backdrop-blur-xl">
                    <div>
                      {title && (
                        <h2 className="text-xl font-bold text-white">
                          {title}
                        </h2>
                      )}
                      {subtitle && (
                        <p className="text-sm text-gray-400 mt-0.5">
                          {subtitle}
                        </p>
                      )}
                    </div>
                    
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content con scroll interno */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL FOOTER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn(
      'flex items-center justify-end gap-3 pt-6 mt-6 border-t border-white/5',
      className
    )}>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  icon?: ReactNode
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:opacity-90',
  secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
  ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
  danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20',
}

const sizeButtonClasses = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200',
        variantClasses[variant],
        sizeButtonClasses[size],
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      ) : icon}
      {children}
    </button>
  )
}
