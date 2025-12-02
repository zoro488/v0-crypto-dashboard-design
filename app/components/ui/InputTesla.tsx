'use client'

/**
 * 📝 INPUT TESLA - Campo de texto estilo Apple 2025
 * 
 * Características premium:
 * - Border-bottom only (sin bordes laterales/superiores)
 * - Label flotante que sube al escribir
 * - Transiciones suaves 200ms
 * - Error state con rojo Tesla
 * - Focus state con blanco
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/app/lib/utils'
import { AlertCircle, Check } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface InputTeslaProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  success?: boolean
  hint?: string
  size?: 'sm' | 'default' | 'lg'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export const InputTesla = React.forwardRef<HTMLInputElement, InputTeslaProps>(
  ({ 
    className, 
    type = 'text',
    label,
    error,
    success,
    hint,
    size = 'default',
    leftIcon,
    rightIcon,
    disabled,
    value,
    defaultValue,
    placeholder = ' ', // Necesario para :placeholder-shown
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const hasValue = value !== undefined ? Boolean(value) : Boolean(defaultValue)
    const isLabelFloating = isFocused || hasValue

    const sizeStyles = {
      sm: 'py-2 text-sm',
      default: 'py-3 text-base',
      lg: 'py-4 text-lg',
    }

    return (
      <div className={cn('relative', className)}>
        {/* Container del input */}
        <div className="relative">
          {/* Icono izquierdo */}
          {leftIcon && (
            <div className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2',
              'text-[#98989D] transition-colors duration-200',
              isFocused && 'text-white',
              error && 'text-[#E31911]',
            )}>
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={type}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            className={cn(
              'peer w-full bg-transparent',
              'border-0 border-b',
              'text-white placeholder:text-transparent',
              'outline-none focus:outline-none focus:ring-0',
              'transition-all duration-200',
              sizeStyles[size],
              leftIcon && 'pl-8',
              rightIcon && 'pr-8',
              // Estados
              !error && !success && 'border-white/20 focus:border-white',
              error && 'border-[#E31911]',
              success && 'border-[#10B981]',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            {...props}
          />

          {/* Label flotante */}
          {label && (
            <motion.label
              animate={{
                y: isLabelFloating ? -24 : 0,
                scale: isLabelFloating ? 0.85 : 1,
                color: error 
                  ? '#E31911' 
                  : isFocused 
                    ? '#FFFFFF' 
                    : '#98989D',
              }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'absolute left-0 origin-left',
                'pointer-events-none select-none',
                'font-medium',
                leftIcon && 'left-8',
                sizeStyles[size],
              )}
            >
              {label}
            </motion.label>
          )}

          {/* Icono derecho o estados */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {rightIcon && !error && !success && (
              <span className="text-[#98989D]">{rightIcon}</span>
            )}
            
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[#E31911]"
                >
                  <AlertCircle className="w-5 h-5" />
                </motion.div>
              )}
              
              {success && !error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[#10B981]"
                >
                  <Check className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Línea de foco animada */}
          <motion.div
            initial={false}
            animate={{
              scaleX: isFocused ? 1 : 0,
              backgroundColor: error ? '#E31911' : '#FFFFFF',
            }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 h-[2px] origin-center"
          />
        </div>

        {/* Mensaje de error o hint */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="mt-2 text-sm text-[#E31911]"
            >
              {error}
            </motion.p>
          )}
          
          {!error && hint && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-[#98989D]"
            >
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  },
)

InputTesla.displayName = 'InputTesla'

// ═══════════════════════════════════════════════════════════════════════════
// TEXTAREA TESLA
// ═══════════════════════════════════════════════════════════════════════════

export interface TextareaTeslaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const TextareaTesla = React.forwardRef<HTMLTextAreaElement, TextareaTeslaProps>(
  ({ 
    className, 
    label,
    error,
    hint,
    disabled,
    value,
    defaultValue,
    placeholder = ' ',
    rows = 3,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const hasValue = value !== undefined ? Boolean(value) : Boolean(defaultValue)
    const isLabelFloating = isFocused || hasValue

    return (
      <div className={cn('relative', className)}>
        <div className="relative">
          <textarea
            ref={ref}
            rows={rows}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            className={cn(
              'peer w-full bg-transparent',
              'border-0 border-b',
              'text-white placeholder:text-transparent',
              'outline-none focus:outline-none focus:ring-0',
              'transition-all duration-200',
              'py-3 text-base resize-none',
              !error && 'border-white/20 focus:border-white',
              error && 'border-[#E31911]',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            {...props}
          />

          {label && (
            <motion.label
              animate={{
                y: isLabelFloating ? -24 : 0,
                scale: isLabelFloating ? 0.85 : 1,
                color: error ? '#E31911' : isFocused ? '#FFFFFF' : '#98989D',
              }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-3 origin-left pointer-events-none font-medium"
            >
              {label}
            </motion.label>
          )}

          <motion.div
            initial={false}
            animate={{
              scaleX: isFocused ? 1 : 0,
              backgroundColor: error ? '#E31911' : '#FFFFFF',
            }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 h-[2px] origin-center"
          />
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2 text-sm text-[#E31911]"
            >
              {error}
            </motion.p>
          )}
          
          {!error && hint && (
            <motion.p className="mt-2 text-sm text-[#98989D]">
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  },
)

TextareaTesla.displayName = 'TextareaTesla'

export default InputTesla
