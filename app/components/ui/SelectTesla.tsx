'use client'

/**
 * 📊 SELECT TESLA - Dropdown estilo Apple 2025
 * 
 * Características premium:
 * - Glassmorphism dropdown
 * - Animación spring para abrir/cerrar
 * - Búsqueda integrada
 * - Grupos de opciones
 * - Multi-select opcional
 */

import * as React from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { cn } from '@/app/lib/utils'
import { 
  ChevronDown, 
  Check, 
  Search,
  X,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  icon?: React.ReactNode
  description?: string
  group?: string
}

export interface SelectTeslaProps {
  options: SelectOption[]
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  searchable?: boolean
  multiple?: boolean
  className?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMACIONES
// ═══════════════════════════════════════════════════════════════════════════

const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.02,
      duration: 0.15,
    },
  }),
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export function SelectTesla({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  error,
  disabled,
  searchable = false,
  multiple = false,
  className,
}: SelectTeslaProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Cerrar al hacer clic fuera
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus en búsqueda al abrir
  React.useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [isOpen, searchable])

  // Filtrar opciones
  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.description?.toLowerCase().includes(searchLower),
    )
  }, [options, search])

  // Agrupar opciones
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, SelectOption[]> = {}
    filteredOptions.forEach((opt) => {
      const group = opt.group || ''
      if (!groups[group]) groups[group] = []
      groups[group].push(opt)
    })
    return groups
  }, [filteredOptions])

  // Obtener label seleccionado
  const selectedLabel = React.useMemo(() => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder
      if (value.length === 1) {
        return options.find((o) => o.value === value[0])?.label || placeholder
      }
      return `${value.length} seleccionados`
    }
    return options.find((o) => o.value === value)?.label || placeholder
  }, [value, options, placeholder, multiple])

  const handleSelect = (optValue: string) => {
    if (multiple && Array.isArray(value)) {
      const newValue = value.includes(optValue)
        ? value.filter((v) => v !== optValue)
        : [...value, optValue]
      onChange?.(newValue)
    } else {
      onChange?.(optValue)
      setIsOpen(false)
      setSearch('')
    }
  }

  const isSelected = (optValue: string) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optValue)
    }
    return value === optValue
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Label */}
      {label && (
        <label
          className={cn(
            'block mb-2 text-sm font-medium',
            error ? 'text-[#E31911]' : 'text-[#98989D]',
          )}
        >
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2',
          'px-4 py-3',
          'bg-transparent',
          'border-0 border-b',
          'text-left',
          'transition-all duration-200',
          'outline-none focus:outline-none',
          !error && 'border-white/20 focus:border-white',
          error && 'border-[#E31911]',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'border-white',
          value ? 'text-white' : 'text-[#98989D]',
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">{selectedLabel}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-[#98989D]" />
        </motion.div>
      </button>

      {/* Línea de foco */}
      <motion.div
        initial={false}
        animate={{
          scaleX: isOpen ? 1 : 0,
          backgroundColor: error ? '#E31911' : '#FFFFFF',
        }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-0 left-0 right-0 h-[2px] origin-center"
        style={{ bottom: label ? 0 : 0 }}
      />

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'absolute z-50 mt-2 w-full',
              'bg-[#1C1C1E]/95 backdrop-blur-[24px]',
              'border border-white/10',
              'rounded-2xl overflow-hidden',
              'shadow-2xl shadow-black/50',
            )}
            role="listbox"
          >
            {/* Search */}
            {searchable && (
              <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98989D]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar..."
                    className={cn(
                      'w-full pl-10 pr-4 py-2',
                      'bg-white/5 rounded-xl',
                      'text-white placeholder:text-[#98989D]',
                      'border border-white/10',
                      'outline-none focus:border-white/20',
                      'transition-colors duration-200',
                    )}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98989D] hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options */}
            <div className="max-h-[280px] overflow-y-auto overscroll-contain">
              {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <div key={group || 'default'}>
                  {/* Group header */}
                  {group && (
                    <div className="px-4 py-2 text-xs font-semibold text-[#98989D] uppercase tracking-wider">
                      {group}
                    </div>
                  )}

                  {/* Group items */}
                  {groupOptions.map((option, index) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      custom={index}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      disabled={option.disabled}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3',
                        'text-left transition-colors duration-150',
                        'hover:bg-white/5',
                        isSelected(option.value) && 'bg-white/10',
                        option.disabled && 'opacity-50 cursor-not-allowed',
                      )}
                      role="option"
                      aria-selected={isSelected(option.value)}
                    >
                      {/* Icon */}
                      {option.icon && (
                        <span className="shrink-0 text-[#98989D]">
                          {option.icon}
                        </span>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] text-white truncate">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-xs text-[#98989D] truncate mt-0.5">
                            {option.description}
                          </div>
                        )}
                      </div>

                      {/* Check */}
                      {isSelected(option.value) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-[#E31911]"
                        >
                          <Check className="w-5 h-5" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              ))}

              {/* Empty state */}
              {filteredOptions.length === 0 && (
                <div className="px-4 py-8 text-center text-[#98989D]">
                  No se encontraron resultados
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-[#E31911]"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}

export default SelectTesla
