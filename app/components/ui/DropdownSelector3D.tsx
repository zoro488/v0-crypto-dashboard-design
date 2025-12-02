'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import { logger } from '@/app/lib/utils/logger'

export interface DropdownOption {
  id: string
  label: string
  value: string
  icon?: React.ReactNode
  description?: string
  color?: string
  badge?: string
  disabled?: boolean
}

interface DropdownSelector3DProps {
  options: DropdownOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  searchable?: boolean
  multiple?: boolean
  className?: string
  error?: string
  disabled?: boolean
}

export function DropdownSelector3D({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  searchable = false,
  multiple = false,
  className = '',
  error,
  disabled = false,
}: DropdownSelector3DProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus en search cuando se abre
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen, searchable])

  // Filtrar opciones
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Opción seleccionada
  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = (optionValue: string) => {
    logger.info('Dropdown option selected', { context: 'DropdownSelector3D', data: { value: optionValue } })
    onChange(optionValue)
    if (!multiple) {
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHoveredIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev,
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHoveredIndex(prev => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
        e.preventDefault()
        if (hoveredIndex >= 0 && hoveredIndex < filteredOptions.length) {
          handleSelect(filteredOptions[hoveredIndex].value)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        break
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-white/90 mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        whileHover={{ scale: disabled ? 1 : 1.01 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={`
          relative w-full px-5 py-4 rounded-2xl
          backdrop-blur-xl border-2 transition-all duration-300
          flex items-center justify-between gap-3
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${error 
            ? 'border-red-500/50 bg-red-500/10' 
            : isOpen
              ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 shadow-lg shadow-cyan-500/20'
              : 'border-white/20 bg-gradient-to-br from-white/10 to-white/5 hover:border-cyan-500/30'
          }
        `}
      >
        {/* Selected Content */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedOption?.icon && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="shrink-0"
            >
              {selectedOption.icon}
            </motion.div>
          )}
          
          <div className="flex-1 min-w-0 text-left">
            {selectedOption ? (
              <>
                <p className="text-white font-semibold truncate">
                  {selectedOption.label}
                </p>
                {selectedOption.description && (
                  <p className="text-white/60 text-xs truncate">
                    {selectedOption.description}
                  </p>
                )}
              </>
            ) : (
              <p className="text-white/50">{placeholder}</p>
            )}
          </div>

          {selectedOption?.badge && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="shrink-0 px-2 py-1 rounded-lg text-xs font-bold"
              style={{
                backgroundColor: `${selectedOption.color || '#06b6d4'}40`,
                color: selectedOption.color || '#06b6d4',
              }}
            >
              {selectedOption.badge}
            </motion.span>
          )}
        </div>

        {/* Arrow Icon */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-white/60" />
        </motion.div>

        {/* Glow effect cuando está abierto */}
        {isOpen && (
          <motion.div
            layoutId="dropdown-glow"
            className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </motion.button>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-400 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          {error}
        </motion.p>
      )}

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 w-full mt-2 p-2 rounded-2xl backdrop-blur-2xl bg-gradient-to-b from-slate-900/95 to-black/95 border border-white/20 shadow-2xl shadow-black/50"
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-2 mb-2 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    onKeyDown={handleKeyDown}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-white/50">
                  No se encontraron opciones
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredOptions.map((option, index) => {
                    const isSelected = value === option.value
                    const isHovered = hoveredIndex === index

                    return (
                      <motion.button
                        key={option.id}
                        type="button"
                        onClick={() => !option.disabled && handleSelect(option.value)}
                        onMouseEnter={() => setHoveredIndex(index)}
                        disabled={option.disabled}
                        whileHover={{ x: option.disabled ? 0 : 4 }}
                        className={`
                          relative w-full px-4 py-3 rounded-xl
                          flex items-center gap-3 transition-all duration-200
                          ${option.disabled 
                            ? 'opacity-40 cursor-not-allowed' 
                            : 'cursor-pointer'
                          }
                          ${isSelected
                            ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border border-cyan-500/50'
                            : isHovered
                              ? 'bg-white/10 border border-white/20'
                              : 'border border-transparent hover:bg-white/5'
                          }
                        `}
                      >
                        {/* Icon */}
                        {option.icon && (
                          <div className="shrink-0">{option.icon}</div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`font-medium truncate ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                            {option.label}
                          </p>
                          {option.description && (
                            <p className="text-white/60 text-xs truncate">
                              {option.description}
                            </p>
                          )}
                        </div>

                        {/* Badge */}
                        {option.badge && (
                          <span
                            className="shrink-0 px-2 py-1 rounded-lg text-xs font-bold"
                            style={{
                              backgroundColor: `${option.color || '#06b6d4'}40`,
                              color: option.color || '#06b6d4',
                            }}
                          >
                            {option.badge}
                          </span>
                        )}

                        {/* Check Icon */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="shrink-0"
                          >
                            <Check className="w-5 h-5 text-cyan-400" />
                          </motion.div>
                        )}

                        {/* Hover glow */}
                        {(isHovered || isSelected) && (
                          <motion.div
                            layoutId={`option-glow-${option.id}`}
                            className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer Info */}
            {filteredOptions.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10 px-2">
                <p className="text-xs text-white/40">
                  {filteredOptions.length} {filteredOptions.length === 1 ? 'opción' : 'opciones'}
                  {searchQuery && ' encontradas'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </div>
  )
}
