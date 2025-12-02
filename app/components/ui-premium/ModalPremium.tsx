'use client'

import { forwardRef, type ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as RadixDialog from '@radix-ui/react-dialog'

/**
 * 🎨 MODAL PREMIUM - Estilo Apple/Tesla
 * 
 * Características:
 * - Backdrop glassmorphism
 * - Smooth animations (Apple easing)
 * - Responsive sizes
 * - Close on escape/outside click
 * - Scroll lock
 * - Custom close button position
 * 
 * Basado en Radix UI Dialog
 */

export interface ModalPremiumProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose?: boolean
  closeOnOutsideClick?: boolean
  closeOnEscape?: boolean
  className?: string
}

const ModalPremium = forwardRef<HTMLDivElement, ModalPremiumProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      children,
      size = 'md',
      showClose = true,
      closeOnOutsideClick = true,
      closeOnEscape = true,
      className,
    },
    ref,
  ) => {
    // Lock body scroll when modal is open
    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }
      return () => {
        document.body.style.overflow = 'unset'
      }
    }, [open])

    // Sizes
    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-2xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
    }

    return (
      <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
        <AnimatePresence>
          {open && (
            <RadixDialog.Portal forceMount>
              {/* Overlay */}
              <RadixDialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'fixed inset-0 z-50',
                    'bg-black/60',
                    'backdrop-blur-xl',
                    'overflow-y-auto',
                    'flex items-center justify-center p-4',
                  )}
                  onClick={closeOnOutsideClick ? () => onOpenChange(false) : undefined}
                />
              </RadixDialog.Overlay>

              {/* Content */}
              <RadixDialog.Content
                ref={ref}
                onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
                asChild
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'fixed left-1/2 top-1/2 z-50',
                    '-translate-x-1/2 -translate-y-1/2',
                    'w-full',
                    sizes[size],
                    'rounded-2xl',
                    'bg-[#1C1C1E]/95',
                    'backdrop-blur-3xl',
                    'border border-white/10',
                    'shadow-2xl',
                    'overflow-hidden',
                    'flex flex-col',
                    className,
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  {(title || showClose) && (
                    <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-6 border-b border-white/10 bg-[#1C1C1E]/80 backdrop-blur-xl">
                      <div className="flex-1">
                        {title && (
                          <RadixDialog.Title className="text-2xl font-bold text-white apple-font-smoothing">
                            {title}
                          </RadixDialog.Title>
                        )}
                        {description && (
                          <RadixDialog.Description className="mt-2 text-sm text-white/60 apple-font-smoothing">
                            {description}
                          </RadixDialog.Description>
                        )}
                      </div>

                      {showClose && (
                        <RadixDialog.Close asChild>
                          <button
                            className={cn(
                              'flex items-center justify-center',
                              'w-10 h-10',
                              'rounded-full',
                              'bg-white/5',
                              'border border-white/10',
                              'text-white/60',
                              'hover:bg-white/10',
                              'hover:text-white/85',
                              'hover:border-white/20',
                              'transition-all duration-200',
                              'focus:outline-none',
                              'focus:ring-2 focus:ring-[#0A84FF]/50',
                            )}
                            aria-label="Cerrar modal"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </RadixDialog.Close>
                      )}
                    </div>
                  )}

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {children}
                  </div>
                </motion.div>
              </RadixDialog.Content>
            </RadixDialog.Portal>
          )}
        </AnimatePresence>
      </RadixDialog.Root>
    )
  },
)

ModalPremium.displayName = 'ModalPremium'

// Modal Header Component
export const ModalHeaderPremium = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string }
>(({ children, className }, ref) => (
  <div
    ref={ref}
    className={cn(
      'mb-6',
      className,
    )}
  >
    {children}
  </div>
))
ModalHeaderPremium.displayName = 'ModalHeaderPremium'

// Modal Footer Component
export const ModalFooterPremium = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string }
>(({ children, className }, ref) => (
  <div
    ref={ref}
    className={cn(
      'sticky bottom-0',
      'flex items-center justify-end gap-3',
      'p-6',
      'border-t border-white/10',
      'bg-[#1C1C1E]/80 backdrop-blur-xl',
      className,
    )}
  >
    {children}
  </div>
))
ModalFooterPremium.displayName = 'ModalFooterPremium'

export { ModalPremium }
