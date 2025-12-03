'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🪟 CHRONOS MODAL & FORMS - Modales y Formularios Premium
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo, forwardRef, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHRONOS, ChronosButton } from './chronos-ui'

// ═══════════════════════════════════════════════════════════════════════════
// 🪟 MODAL - Modal Premium con Animaciones
// ═══════════════════════════════════════════════════════════════════════════

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlay?: boolean
  showCloseButton?: boolean
  footer?: ReactNode
}

const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
}

export const ChronosModal = memo(({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlay = true,
  showCloseButton = true,
  footer,
}: ModalProps) => {
  const prefersReducedMotion = useReducedMotion()
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])
  
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])
  
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
          />
          
          {/* Modal */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={CHRONOS.animation.spring}
            className={cn(
              'relative w-full rounded-2xl overflow-hidden',
              'max-h-[90vh] overflow-y-auto',
              modalSizes[size],
            )}
            style={{
              background: CHRONOS.colors.voidSoft,
              border: `1px solid ${CHRONOS.colors.glassBorder}`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div 
                className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
                style={{ 
                  background: CHRONOS.colors.voidSoft,
                  borderColor: CHRONOS.colors.glassBorder,
                }}
              >
                <div>
                  {title && (
                    <h2 
                      className="text-lg font-semibold"
                      style={{ color: CHRONOS.colors.textPrimary }}
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p 
                      className="text-sm mt-1"
                      style={{ color: CHRONOS.colors.textMuted }}
                    >
                      {description}
                    </p>
                  )}
                </div>
                
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" style={{ color: CHRONOS.colors.textMuted }} />
                  </button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="p-6">
              {children}
            </div>
            
            {/* Footer */}
            {footer && (
              <div 
                className="sticky bottom-0 px-6 py-4 border-t flex items-center justify-end gap-3"
                style={{ 
                  background: CHRONOS.colors.voidSoft,
                  borderColor: CHRONOS.colors.glassBorder,
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
})
ChronosModal.displayName = 'ChronosModal'

// ═══════════════════════════════════════════════════════════════════════════
// 🚨 ALERT DIALOG - Confirmación/Alerta
// ═══════════════════════════════════════════════════════════════════════════

interface AlertDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  type?: 'info' | 'warning' | 'error' | 'success'
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

const alertConfig = {
  info: { Icon: Info, color: CHRONOS.colors.info, bg: 'rgba(59, 130, 246, 0.15)' },
  warning: { Icon: AlertTriangle, color: CHRONOS.colors.warning, bg: 'rgba(245, 158, 11, 0.15)' },
  error: { Icon: AlertCircle, color: CHRONOS.colors.error, bg: 'rgba(239, 68, 68, 0.15)' },
  success: { Icon: CheckCircle, color: CHRONOS.colors.success, bg: 'rgba(16, 185, 129, 0.15)' },
}

export const AlertDialog = memo(({
  open,
  onClose,
  onConfirm,
  title,
  description,
  type = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
}: AlertDialogProps) => {
  const config = alertConfig[type]
  
  return (
    <ChronosModal
      open={open}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnOverlay={!isLoading}
    >
      <div className="text-center">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: config.bg }}
        >
          <config.Icon className="w-8 h-8" style={{ color: config.color }} />
        </div>
        
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ color: CHRONOS.colors.textPrimary }}
        >
          {title}
        </h3>
        
        {description && (
          <p 
            className="text-sm mb-6"
            style={{ color: CHRONOS.colors.textSecondary }}
          >
            {description}
          </p>
        )}
        
        <div className="flex items-center justify-center gap-3">
          <ChronosButton
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </ChronosButton>
          <ChronosButton
            variant={type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </ChronosButton>
        </div>
      </div>
    </ChronosModal>
  )
})
AlertDialog.displayName = 'AlertDialog'

// ═══════════════════════════════════════════════════════════════════════════
// 📝 SELECT - Select Premium
// ═══════════════════════════════════════════════════════════════════════════

interface ChronosSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const ChronosSelect = memo(forwardRef<HTMLSelectElement, ChronosSelectProps>(({
  label,
  error,
  options,
  placeholder,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-sm font-medium mb-2"
          style={{ color: CHRONOS.colors.textSecondary }}
        >
          {label}
        </label>
      )}
      
      <select
        ref={ref}
        className={cn(
          'w-full rounded-xl outline-none transition-all duration-200',
          'py-3 px-4 text-sm appearance-none',
          'bg-no-repeat bg-right',
          error && 'ring-2 ring-red-500/50',
          className,
        )}
        style={{
          background: CHRONOS.colors.glassBg,
          border: `1px solid ${error ? CHRONOS.colors.error : CHRONOS.colors.glassBorder}`,
          color: CHRONOS.colors.textPrimary,
          backdropFilter: CHRONOS.blur.lg,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,255,255,0.4)\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
          backgroundPosition: 'right 12px center',
          backgroundSize: '16px',
          paddingRight: '40px',
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-2 text-sm" style={{ color: CHRONOS.colors.error }}>
          {error}
        </p>
      )}
    </div>
  )
}))
ChronosSelect.displayName = 'ChronosSelect'

// ═══════════════════════════════════════════════════════════════════════════
// 📜 TEXTAREA - Textarea Premium
// ═══════════════════════════════════════════════════════════════════════════

interface ChronosTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const ChronosTextarea = memo(forwardRef<HTMLTextAreaElement, ChronosTextareaProps>(({
  label,
  error,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-sm font-medium mb-2"
          style={{ color: CHRONOS.colors.textSecondary }}
        >
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-xl outline-none transition-all duration-200',
          'py-3 px-4 text-sm min-h-[100px] resize-y',
          'placeholder:text-white/30',
          error && 'ring-2 ring-red-500/50',
          className,
        )}
        style={{
          background: CHRONOS.colors.glassBg,
          border: `1px solid ${error ? CHRONOS.colors.error : CHRONOS.colors.glassBorder}`,
          color: CHRONOS.colors.textPrimary,
          backdropFilter: CHRONOS.blur.lg,
        }}
        {...props}
      />
      
      {error && (
        <p className="mt-2 text-sm" style={{ color: CHRONOS.colors.error }}>
          {error}
        </p>
      )}
    </div>
  )
}))
ChronosTextarea.displayName = 'ChronosTextarea'

// ═══════════════════════════════════════════════════════════════════════════
// 📋 FORM FIELD - Wrapper para campos de formulario
// ═══════════════════════════════════════════════════════════════════════════

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}

export const FormField = memo(({ label, required, error, hint, children }: FormFieldProps) => {
  return (
    <div className="space-y-2">
      <label 
        className="flex items-center gap-1 text-sm font-medium"
        style={{ color: CHRONOS.colors.textSecondary }}
      >
        {label}
        {required && <span style={{ color: CHRONOS.colors.error }}>*</span>}
      </label>
      
      {children}
      
      {hint && !error && (
        <p className="text-xs" style={{ color: CHRONOS.colors.textMuted }}>
          {hint}
        </p>
      )}
      
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: CHRONOS.colors.error }}>
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
})
FormField.displayName = 'FormField'

// ═══════════════════════════════════════════════════════════════════════════
// 🎚️ SLIDER - Slider Premium (para distribución de valores)
// ═══════════════════════════════════════════════════════════════════════════

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  showValue?: boolean
  formatValue?: (value: number) => string
  color?: string
}

export const ChronosSlider = memo(({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  formatValue = (v) => `${v}`,
  color = CHRONOS.colors.cyan,
}: SliderProps) => {
  const percentage = ((value - min) / (max - min)) * 100
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }, [onChange])
  
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span 
              className="text-sm font-medium"
              style={{ color: CHRONOS.colors.textSecondary }}
            >
              {label}
            </span>
          )}
          {showValue && (
            <span 
              className="text-sm font-mono font-semibold"
              style={{ color }}
            >
              {formatValue(value)}
            </span>
          )}
        </div>
      )}
      
      <div className="relative h-2">
        {/* Track */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{ background: CHRONOS.colors.glassBg }}
        />
        
        {/* Fill */}
        <div 
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
          style={{ 
            background: color,
            width: `${percentage}%`,
          }}
        />
        
        {/* Thumb */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-lg transition-all duration-100"
          style={{ 
            background: color,
            left: `${percentage}%`,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
        
        {/* Input (invisible, for interaction) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
})
ChronosSlider.displayName = 'ChronosSlider'

// ═══════════════════════════════════════════════════════════════════════════
// ✅ CHECKBOX - Checkbox Premium
// ═══════════════════════════════════════════════════════════════════════════

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export const ChronosCheckbox = memo(({ checked, onChange, label, disabled }: CheckboxProps) => {
  return (
    <label 
      className={cn(
        'flex items-center gap-3 cursor-pointer group',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div 
        className={cn(
          'relative w-5 h-5 rounded-md transition-all duration-200',
          'flex items-center justify-center',
          !disabled && 'group-hover:border-cyan-500/50',
        )}
        style={{
          background: checked ? CHRONOS.colors.cyan : CHRONOS.colors.glassBg,
          border: `1px solid ${checked ? CHRONOS.colors.cyan : CHRONOS.colors.glassBorder}`,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        
        <motion.svg
          initial={false}
          animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          className="w-3 h-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke={CHRONOS.colors.void}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </motion.svg>
      </div>
      
      {label && (
        <span 
          className="text-sm"
          style={{ color: CHRONOS.colors.textSecondary }}
        >
          {label}
        </span>
      )}
    </label>
  )
})
ChronosCheckbox.displayName = 'ChronosCheckbox'

// ═══════════════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  ChronosModal,
  AlertDialog,
  ChronosSelect,
  ChronosTextarea,
  FormField,
  ChronosSlider,
  ChronosCheckbox,
}
