'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { memo, useState, useCallback, ReactNode } from 'react'
import { Check } from 'lucide-react'

interface MetalCardOption {
  id: string
  label: string
  sublabel?: string
  icon?: ReactNode
  color?: 'sapphire' | 'emerald' | 'amethyst' | 'ruby' | 'gold' | 'cyan'
}

interface MetalCardSelectorProps {
  options: MetalCardOption[]
  value: string | null
  onChange: (id: string) => void
  className?: string
  columns?: 2 | 3 | 4
}

/**
 * MetalCardSelector - Selector de opciones como Tarjetas de Crédito Virtual de Metal
 * 
 * Reemplaza selectores aburridos con tarjetas metálicas premium:
 * - Degradado metálico oscuro sutil
 * - Estado activo con elevación y borde brillante
 * - Efecto de luz irradiando sobre tarjetas adyacentes
 */
export const MetalCardSelector = memo(function MetalCardSelector({
  options,
  value,
  onChange,
  className = '',
  columns = 2
}: MetalCardSelectorProps) {
  
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  
  const handleSelect = useCallback((id: string) => {
    onChange(id)
  }, [onChange])
  
  const colorAccents = {
    sapphire: {
      glow: 'rgba(59, 130, 246, 0.4)',
      border: '#3b82f6',
      text: '#60a5fa'
    },
    emerald: {
      glow: 'rgba(16, 185, 129, 0.4)',
      border: '#10b981',
      text: '#34d399'
    },
    amethyst: {
      glow: 'rgba(139, 92, 246, 0.4)',
      border: '#8b5cf6',
      text: '#a78bfa'
    },
    ruby: {
      glow: 'rgba(239, 68, 68, 0.4)',
      border: '#ef4444',
      text: '#f87171'
    },
    gold: {
      glow: 'rgba(245, 158, 11, 0.4)',
      border: '#f59e0b',
      text: '#fbbf24'
    },
    cyan: {
      glow: 'rgba(6, 182, 212, 0.4)',
      border: '#06b6d4',
      text: '#22d3ee'
    }
  }
  
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }
  
  return (
    <div className={`grid ${gridCols[columns]} gap-3 ${className}`}>
      <AnimatePresence mode="popLayout">
        {options.map((option, index) => {
          const isActive = value === option.id
          const isHovered = hoveredId === option.id
          const accent = colorAccents[option.color || 'sapphire']
          
          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              onMouseEnter={() => setHoveredId(option.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative text-left outline-none focus:outline-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                delay: index * 0.05,
                type: 'spring',
                stiffness: 400,
                damping: 25
              }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="relative p-4 rounded-2xl overflow-hidden cursor-pointer"
                animate={{
                  y: isActive ? -4 : isHovered ? -2 : 0,
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25
                }}
                style={{
                  // Degradado metálico oscuro
                  background: `linear-gradient(
                    135deg,
                    rgba(30, 30, 40, 0.95) 0%,
                    rgba(20, 20, 28, 0.98) 50%,
                    rgba(15, 15, 22, 1) 100%
                  )`,
                  // Sombras y bordes
                  boxShadow: isActive
                    ? `
                      inset 1px 1px 0 0 rgba(255, 255, 255, 0.15),
                      inset -1px -1px 0 0 rgba(0, 0, 0, 0.3),
                      0 0 0 2px ${accent.border},
                      0 0 40px -10px ${accent.glow},
                      0 15px 40px -10px rgba(0, 0, 0, 0.6)
                    `
                    : isHovered
                    ? `
                      inset 1px 1px 0 0 rgba(255, 255, 255, 0.12),
                      inset -1px -1px 0 0 rgba(0, 0, 0, 0.3),
                      0 8px 24px -6px rgba(0, 0, 0, 0.5)
                    `
                    : `
                      inset 1px 1px 0 0 rgba(255, 255, 255, 0.08),
                      inset -1px -1px 0 0 rgba(0, 0, 0, 0.3),
                      0 4px 16px -4px rgba(0, 0, 0, 0.4)
                    `
                }}
              >
                {/* Borde degradado */}
                <div 
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    padding: '1px',
                    background: isActive
                      ? `linear-gradient(135deg, ${accent.border} 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%)`
                      : `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%)`,
                    opacity: isActive ? 0.8 : 1,
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude'
                  }}
                />
                
                {/* Resplandor interior cuando activo */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background: `radial-gradient(ellipse at center, ${accent.glow} 0%, transparent 70%)`
                    }}
                  />
                )}
                
                {/* Contenido */}
                <div className="relative flex items-center gap-3">
                  {/* Icono */}
                  {option.icon && (
                    <div 
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: isActive 
                          ? `rgba(${option.color === 'emerald' ? '16, 185, 129' : option.color === 'sapphire' ? '59, 130, 246' : option.color === 'amethyst' ? '139, 92, 246' : '59, 130, 246'}, 0.15)`
                          : 'rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <span style={{ color: isActive ? accent.text : 'rgba(255, 255, 255, 0.6)' }}>
                        {option.icon}
                      </span>
                    </div>
                  )}
                  
                  {/* Texto */}
                  <div className="flex-1 min-w-0">
                    <p 
                      className="font-medium truncate"
                      style={{ 
                        color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.8)'
                      }}
                    >
                      {option.label}
                    </p>
                    {option.sublabel && (
                      <p 
                        className="text-xs truncate mt-0.5"
                        style={{ 
                          color: isActive ? accent.text : 'rgba(255, 255, 255, 0.4)'
                        }}
                      >
                        {option.sublabel}
                      </p>
                    )}
                  </div>
                  
                  {/* Indicador de selección */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{
                          background: accent.border,
                          boxShadow: `0 0 20px ${accent.glow}`
                        }}
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
})

export default MetalCardSelector
