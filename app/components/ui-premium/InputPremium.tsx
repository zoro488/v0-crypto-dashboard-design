'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Search, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 🎨 INPUT PREMIUM - Estilo Apple/Tesla
 * 
 * Características:
 * - Height: 44px (táctil optimizado)
 * - Border-radius: 12px
 * - Glassmorphism background
 * - Focus: Blue glow
 * - Error states con icon
 * - Search variant con icon
 */

export interface InputPremiumProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  variant?: 'default' | 'search' | 'minimal'
  inputSize?: 'sm' | 'md' | 'lg'
}

const InputPremium = forwardRef<HTMLInputElement, InputPremiumProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      variant = 'default',
      inputSize = 'md',
      className,
      type = 'text',
      disabled,
      ...props
    },
    ref,
  ) => {
    // Tamaños
    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-4 text-base', // 44px Apple
      lg: 'h-13 px-5 text-lg',
    }

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }

    // Variantes
    const variants = {
      default: `
        bg-white/5 
        border border-white/10
        focus:border-[#0A84FF] focus:shadow-[0_0_20px_rgba(10,132,255,0.3)]
      `,
      search: `
        bg-white/[0.03]
        border border-white/10
        focus:border-[#0A84FF] focus:shadow-[0_0_20px_rgba(10,132,255,0.3)]
        pl-11
      `,
      minimal: `
        bg-transparent
        border-b border-white/20
        rounded-none
        focus:border-[#0A84FF]
        px-0
      `,
    }

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <motion.label
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="block text-sm font-semibold text-white mb-2 tracking-tight"
          >
            {label}
          </motion.label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon (Search variant) */}
          {variant === 'search' && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <Search className={iconSizes[inputSize]} />
            </div>
          )}

          {/* Left Custom Icon */}
          {LeftIcon && variant !== 'search' && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <LeftIcon className={iconSizes[inputSize]} />
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={type}
            className={cn(
              // Base styles
              'w-full',
              'rounded-xl',
              'text-white placeholder:text-white/40',
              'transition-all duration-200',
              'focus:outline-none focus:ring-0',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'apple-font-smoothing',
              'backdrop-blur-xl',
              
              // Size y variant
              sizes[inputSize],
              variants[variant],
              
              // Error state
              error && 'border-[#FF453A] focus:border-[#FF453A] focus:shadow-[0_0_20px_rgba(255,69,58,0.3)]',
              
              // Icon padding
              LeftIcon && variant !== 'search' && 'pl-11',
              (RightIcon || error) && 'pr-11',
              
              className,
            )}
            disabled={disabled}
            {...props}
          />

          {/* Right Icon o Error */}
          {error ? (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF453A]">
              <AlertCircle className={iconSizes[inputSize]} />
            </div>
          ) : RightIcon ? (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
              <RightIcon className={iconSizes[inputSize]} />
            </div>
          ) : null}
        </div>

        {/* Helper Text o Error Message */}
        {(helperText || error) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'text-xs mt-2 tracking-tight',
              error ? 'text-[#FF453A]' : 'text-white/55',
            )}
          >
            {error || helperText}
          </motion.p>
        )}
      </div>
    )
  },
)

InputPremium.displayName = 'InputPremium'

// Textarea variant
export interface TextareaPremiumProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  rows?: number
}

const TextareaPremium = forwardRef<HTMLTextAreaElement, TextareaPremiumProps>(
  (
    {
      label,
      error,
      helperText,
      rows = 4,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <motion.label
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="block text-sm font-semibold text-white mb-2 tracking-tight"
          >
            {label}
          </motion.label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            // Base styles
            'w-full p-4',
            'rounded-xl',
            'text-white placeholder:text-white/40',
            'bg-white/5 backdrop-blur-xl',
            'border border-white/10',
            'transition-all duration-200',
            'focus:outline-none focus:border-[#0A84FF] focus:shadow-[0_0_20px_rgba(10,132,255,0.3)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'apple-font-smoothing',
            'resize-none',
            
            // Error state
            error && 'border-[#FF453A] focus:border-[#FF453A] focus:shadow-[0_0_20px_rgba(255,69,58,0.3)]',
            
            className,
          )}
          disabled={disabled}
          {...props}
        />

        {/* Helper Text o Error Message */}
        {(helperText || error) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'text-xs mt-2 tracking-tight',
              error ? 'text-[#FF453A]' : 'text-white/55',
            )}
          >
            {error || helperText}
          </motion.p>
        )}
      </div>
    )
  },
)

TextareaPremium.displayName = 'TextareaPremium'

export { InputPremium, TextareaPremium }
