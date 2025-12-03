'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { memo, forwardRef, ReactNode, useCallback } from 'react'
import { X } from 'lucide-react'

interface ObsidianModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
  className?: string
}

/**
 * ObsidianModal - La Bóveda de Cristal
 * 
 * Modal ultra-premium con:
 * - Entrada dramática con desenfoque masivo del fondo
 * - Animación elástica y suave
 * - Vidrio de Obsidiana grueso con bordes que captan la luz
 * - Sensación pesada y cara
 */
export const ObsidianModal = memo(forwardRef<HTMLDivElement, ObsidianModalProps>(
  function ObsidianModal(
    {
      isOpen,
      onClose,
      children,
      title,
      subtitle,
      size = 'md',
      showClose = true,
      className = ''
    },
    ref
  ) {
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    }, [onClose])
    
    const sizeClasses = {
      sm: 'max-w-[400px]',
      md: 'max-w-[560px]',
      lg: 'max-w-[720px]',
      xl: 'max-w-[900px]'
    }
    
    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop con desenfoque masivo */}
            <motion.div
              className="fixed inset-0 z-[100]"
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(60px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={handleBackdropClick}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              }}
            />
            
            {/* Modal Container */}
            <motion.div
              ref={ref}
              className={`
                fixed top-1/2 left-1/2 z-[101]
                w-[95%] ${sizeClasses[size]}
                max-h-[90vh] overflow-hidden
                ${className}
              `}
              initial={{ 
                opacity: 0, 
                scale: 0.9, 
                y: '-45%',
                x: '-50%',
                filter: 'blur(10px)'
              }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: '-50%',
                x: '-50%',
                filter: 'blur(0px)'
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.95, 
                y: '-48%',
                x: '-50%',
                filter: 'blur(8px)'
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }}
              style={{
                // Vidrio de Obsidiana grueso
                background: 'rgba(8, 8, 12, 0.92)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                borderRadius: '24px',
                // Bordes que captan la luz (rim light effect)
                boxShadow: `
                  inset 1px 1px 0 0 rgba(255, 255, 255, 0.1),
                  inset -1px -1px 0 0 rgba(0, 0, 0, 0.4),
                  0 50px 100px -20px rgba(0, 0, 0, 0.8),
                  0 30px 60px -15px rgba(0, 0, 0, 0.5),
                  0 0 0 1px rgba(255, 255, 255, 0.05)
                `
              }}
            >
              {/* Borde degradado superior (luz atrapada en el canto) */}
              <div 
                className="absolute inset-0 rounded-[24px] pointer-events-none"
                style={{
                  padding: '1px',
                  background: `linear-gradient(
                    135deg,
                    rgba(255, 255, 255, 0.15) 0%,
                    rgba(255, 255, 255, 0.03) 50%,
                    rgba(0, 0, 0, 0.3) 100%
                  )`,
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude'
                }}
              />
              
              {/* Header */}
              {(title || showClose) && (
                <div className="relative flex items-start justify-between p-6 pb-0">
                  <div className="flex-1">
                    {title && (
                      <motion.h2 
                        className="text-xl font-semibold text-white"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {title}
                      </motion.h2>
                    )}
                    {subtitle && (
                      <motion.p 
                        className="mt-1 text-sm text-white/50"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                      >
                        {subtitle}
                      </motion.p>
                    )}
                  </div>
                  
                  {showClose && (
                    <motion.button
                      onClick={onClose}
                      className="
                        relative p-2 rounded-xl
                        text-white/40 hover:text-white/80
                        bg-white/5 hover:bg-white/10
                        transition-all duration-200
                      "
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              )}
              
              {/* Content */}
              <motion.div 
                className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] scrollbar-obsidian"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {children}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    )
  }
))

export default ObsidianModal
