'use client'

/**
 * CHRONOS 2026 - Premium Input
 * Input con efectos de focus, validación y glassmorphism
 * 
 * Features:
 * - Glassmorphism
 * - Animated focus ring
 * - Validation states
 * - Icon support
 * - Label animado
 */

import { memo, forwardRef, useState, InputHTMLAttributes, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHRONOS_COLORS } from '@/app/lib/constants/chronos-2026'

interface PremiumInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  success?: string
  hint?: string
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyles = {
  sm: 'h-9 text-sm px-3',
  md: 'h-11 text-sm px-4',
  lg: 'h-13 text-base px-5',
}

const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(({
  label,
  error,
  success,
  hint,
  icon,
  iconPosition = 'left',
  size = 'md',
  className = '',
  disabled,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue)
  
  const hasError = !!error
  const hasSuccess = !!success && !hasError
  
  const getBorderColor = () => {
    if (hasError) return CHRONOS_COLORS.danger
    if (hasSuccess) return CHRONOS_COLORS.success
    if (isFocused) return CHRONOS_COLORS.primary
    return 'rgba(255,255,255,0.1)'
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value)
    props.onChange?.(e)
  }
  
  return (
    <div className={cn('relative', className)}>
      {/* Label */}
      {label && (
        <motion.label
          animate={{
            y: isFocused || hasValue ? -24 : 0,
            scale: isFocused || hasValue ? 0.85 : 1,
            color: isFocused 
              ? CHRONOS_COLORS.primary 
              : hasError 
                ? CHRONOS_COLORS.danger 
                : 'rgba(255,255,255,0.5)',
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2',
            'text-sm font-medium pointer-events-none origin-left',
            'transition-colors duration-200',
            icon && iconPosition === 'left' && 'left-11',
          )}
        >
          {label}
        </motion.label>
      )}
      
      {/* Input container */}
      <div className="relative">
        {/* Icon left */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            {icon}
          </div>
        )}
        
        {/* Input */}
        <input
          ref={ref}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={handleChange}
          className={cn(
            'w-full rounded-xl',
            'bg-white/[0.03] backdrop-blur-xl',
            'text-white placeholder:text-white/30',
            'border transition-all duration-200',
            'focus:outline-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            sizeStyles[size],
            icon && iconPosition === 'left' && 'pl-11',
            icon && iconPosition === 'right' && 'pr-11',
            (hasError || hasSuccess) && 'pr-11',
          )}
          style={{
            borderColor: getBorderColor(),
            boxShadow: isFocused 
              ? `0 0 0 3px ${getBorderColor()}20, 0 0 20px ${getBorderColor()}10` 
              : 'none',
          }}
          {...props}
        />
        
        {/* Icon right */}
        {icon && iconPosition === 'right' && !hasError && !hasSuccess && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
            {icon}
          </div>
        )}
        
        {/* Validation icon */}
        <AnimatePresence>
          {(hasError || hasSuccess) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {hasError && <AlertCircle className="w-5 h-5" style={{ color: CHRONOS_COLORS.danger }} />}
              {hasSuccess && <CheckCircle className="w-5 h-5" style={{ color: CHRONOS_COLORS.success }} />}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Focus glow */}
        <motion.div
          animate={{
            opacity: isFocused ? 1 : 0,
          }}
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${getBorderColor()}10 0%, transparent 70%)`,
          }}
        />
      </div>
      
      {/* Helper text */}
      <AnimatePresence mode="wait">
        {(error || success || hint) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'mt-1.5 text-xs',
              hasError && 'text-red-400',
              hasSuccess && 'text-green-400',
              !hasError && !hasSuccess && 'text-white/50',
            )}
          >
            {error || success || hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
})

PremiumInput.displayName = 'PremiumInput'

export default memo(PremiumInput)
