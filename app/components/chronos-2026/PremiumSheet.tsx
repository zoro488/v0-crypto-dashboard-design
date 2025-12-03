'use client'

/**
 * CHRONOS 2026 - Premium Sheet/Modal
 * Modal desde abajo con animaciones de física real
 * 
 * Features:
 * - Spring physics para apertura/cierre
 * - Drag to dismiss
 * - Backdrop blur animado
 * - Glassmorphism
 * - Keyboard navigation
 */

import { memo, ReactNode, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHRONOS_COLORS, CHRONOS_ANIMATIONS } from '@/app/lib/constants/chronos-2026'
import { useReducedMotionSafe } from './hooks'

interface PremiumSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  title?: string
  description?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
}

const sizeConfig = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  full: 'max-w-4xl',
}

function PremiumSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  className = '',
  size = 'md',
}: PremiumSheetProps) {
  const prefersReducedMotion = useReducedMotionSafe()
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange])
  
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])
  
  // Handle drag to dismiss
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onOpenChange(false)
    }
  }, [onOpenChange])
  
  const sheetVariants = {
    hidden: { 
      y: '100%', 
      opacity: 0,
      scale: 0.95,
    },
    visible: { 
      y: 0, 
      opacity: 1,
      scale: 1,
      transition: prefersReducedMotion 
        ? { duration: 0.1 } 
        : { type: 'spring' as const, stiffness: 280, damping: 30 },
    },
    exit: { 
      y: '100%', 
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
    },
  }
  
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.15 },
    },
  }
  
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          
          {/* Sheet container */}
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
            <motion.div
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag={prefersReducedMotion ? false : 'y'}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={handleDragEnd}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'sheet-title' : undefined}
              aria-describedby={description ? 'sheet-description' : undefined}
              className={cn(
                'relative w-full',
                sizeConfig[size],
                // Glassmorphism
                'bg-black/90 backdrop-blur-2xl',
                'border border-white/10',
                'rounded-t-3xl sm:rounded-3xl',
                // Shadow
                'shadow-2xl',
                // Max height
                'max-h-[90vh] overflow-hidden',
                className,
              )}
              style={{
                boxShadow: `0 -20px 60px ${CHRONOS_COLORS.primary}20`,
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2 sm:hidden">
                <div className="w-12 h-1 rounded-full bg-white/20" />
              </div>
              
              {/* Header */}
              {(title || description) && (
                <div className="px-6 pt-4 pb-2 border-b border-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {title && (
                        <h2 
                          id="sheet-title"
                          className="text-xl font-bold text-white"
                        >
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p 
                          id="sheet-description"
                          className="text-sm text-white/60 mt-1"
                        >
                          {description}
                        </p>
                      )}
                    </div>
                    
                    <motion.button
                      onClick={() => onOpenChange(false)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex-shrink-0 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      aria-label="Cerrar"
                    >
                      <X className="w-5 h-5 text-white/60" />
                    </motion.button>
                  </div>
                </div>
              )}
              
              {/* Close button (if no header) */}
              {!title && !description && (
                <motion.button
                  onClick={() => onOpenChange(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5 text-white/60" />
                </motion.button>
              )}
              
              {/* Content */}
              <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                {children}
              </div>
              
              {/* Bottom safe area for mobile */}
              <div className="h-safe-area-inset-bottom" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default memo(PremiumSheet)
