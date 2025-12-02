'use client'

/**
 * 🪟 APPLE MODAL - Premium 2025
 * 
 * Modal estilo Apple:
 * - Centrado, ancho máximo 640px
 * - Fondo #0A0A0A con blur
 * - Border-radius 24px
 * - Campos con border-bottom (label flotante)
 * - Botón primario rojo Tesla solo cuando form válido
 * - Animaciones spring suaves
 */

import { motion, AnimatePresence } from 'framer-motion'
import { 
  useState, 
  useCallback, 
  forwardRef,
  type ReactNode,
  type FormEvent,
} from 'react'
import { X, Loader2, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/app/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface AppleModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  closable?: boolean
}

interface AppleInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'email' | 'password' | 'tel'
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
  prefix?: string
  suffix?: string
}

interface AppleSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

interface AppleButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
  className?: string
  fullWidth?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Apple Modal
// ═══════════════════════════════════════════════════════════════════════════════

export function AppleModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closable = true,
}: AppleModalProps) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closable ? onClose : undefined}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn(
                'w-full rounded-[24px] overflow-hidden',
                'bg-[#0A0A0A] border border-white/10',
                'shadow-2xl shadow-black/50',
                sizes[size]
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-semibold text-white">{title}</h2>
                  {description && (
                    <p className="text-sm text-white/50 mt-1">{description}</p>
                  )}
                </div>
                {closable && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors -m-2"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </motion.button>
                )}
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="p-6 border-t border-white/5 bg-black/30">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Apple Input (Border Bottom Style)
// ═══════════════════════════════════════════════════════════════════════════════

export const AppleInput = forwardRef<HTMLInputElement, AppleInputProps>(
  ({ 
    label, 
    value, 
    onChange, 
    type = 'text', 
    placeholder,
    error, 
    required,
    disabled,
    className,
    prefix,
    suffix,
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const hasValue = value.length > 0
    const isActive = isFocused || hasValue

    return (
      <div className={cn('relative', className)}>
        {/* Label flotante */}
        <motion.label
          animate={{
            y: isActive ? -24 : 0,
            scale: isActive ? 0.85 : 1,
            color: isFocused ? '#FFFFFF' : error ? '#FF453A' : 'rgba(255,255,255,0.5)',
          }}
          className="absolute left-0 top-4 origin-left text-sm font-medium pointer-events-none"
        >
          {label}
          {required && <span className="text-[#E31911] ml-0.5">*</span>}
        </motion.label>

        <div className="flex items-center gap-2 pt-4">
          {prefix && (
            <span className="text-white/40 text-sm">{prefix}</span>
          )}
          
          <input
            ref={ref}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isActive ? placeholder : ''}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full bg-transparent py-2',
              'text-white text-base outline-none',
              'border-b-2 transition-colors duration-200',
              error 
                ? 'border-red-500/50' 
                : isFocused 
                  ? 'border-white' 
                  : 'border-white/20',
              disabled && 'opacity-50 cursor-not-allowed',
              'placeholder-white/30'
            )}
          />

          {suffix && (
            <span className="text-white/40 text-sm">{suffix}</span>
          )}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-1.5 mt-2"
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-red-400">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

AppleInput.displayName = 'AppleInput'

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Apple Select
// ═══════════════════════════════════════════════════════════════════════════════

export const AppleSelect = forwardRef<HTMLSelectElement, AppleSelectProps>(
  ({
    label,
    value,
    onChange,
    options,
    placeholder = 'Seleccionar...',
    error,
    required,
    disabled,
    className,
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const hasValue = value.length > 0
    const isActive = isFocused || hasValue

    return (
      <div className={cn('relative', className)}>
        {/* Label flotante */}
        <motion.label
          animate={{
            y: isActive ? -24 : 0,
            scale: isActive ? 0.85 : 1,
            color: isFocused ? '#FFFFFF' : error ? '#FF453A' : 'rgba(255,255,255,0.5)',
          }}
          className="absolute left-0 top-4 origin-left text-sm font-medium pointer-events-none"
        >
          {label}
          {required && <span className="text-[#E31911] ml-0.5">*</span>}
        </motion.label>

        <select
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'w-full bg-transparent pt-4 py-2',
            'text-white text-base outline-none appearance-none cursor-pointer',
            'border-b-2 transition-colors duration-200',
            error 
              ? 'border-red-500/50' 
              : isFocused 
                ? 'border-white' 
                : 'border-white/20',
            disabled && 'opacity-50 cursor-not-allowed',
            !hasValue && 'text-white/30'
          )}
        >
          <option value="" disabled className="bg-[#0A0A0A] text-white/50">
            {placeholder}
          </option>
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              className="bg-[#0A0A0A] text-white"
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Chevron icon */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
          <motion.svg
            animate={{ rotate: isFocused ? 180 : 0 }}
            className="w-4 h-4 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-1.5 mt-2"
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-red-400">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

AppleSelect.displayName = 'AppleSelect'

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Apple Button (Tesla Red Primary)
// ═══════════════════════════════════════════════════════════════════════════════

export function AppleButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className,
  fullWidth = false,
}: AppleButtonProps) {
  const variants = {
    primary: cn(
      'bg-[#E31911] hover:bg-[#CC1510] text-white',
      'shadow-lg shadow-red-500/20 hover:shadow-red-500/30',
      'disabled:bg-[#E31911]/30 disabled:shadow-none'
    ),
    secondary: cn(
      'bg-transparent text-white border border-white/20',
      'hover:bg-white/5 hover:border-white/30'
    ),
    ghost: cn(
      'bg-transparent text-white/70 hover:text-white hover:bg-white/5'
    ),
    danger: cn(
      'bg-red-500/10 text-red-400 border border-red-500/20',
      'hover:bg-red-500/20'
    ),
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  }

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'font-semibold rounded-xl transition-all duration-200',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Procesando...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Form Footer (Standard layout)
// ═══════════════════════════════════════════════════════════════════════════════

interface FormFooterProps {
  onCancel: () => void
  onSubmit?: () => void
  submitLabel?: string
  cancelLabel?: string
  loading?: boolean
  disabled?: boolean
}

export function AppleFormFooter({
  onCancel,
  onSubmit,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  loading = false,
  disabled = false,
}: FormFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3">
      <AppleButton
        variant="ghost"
        onClick={onCancel}
        disabled={loading}
      >
        {cancelLabel}
      </AppleButton>
      <AppleButton
        variant="primary"
        type="submit"
        onClick={onSubmit}
        loading={loading}
        disabled={disabled}
      >
        {submitLabel}
      </AppleButton>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default AppleModal
