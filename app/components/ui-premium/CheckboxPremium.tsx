'use client'

import { forwardRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as RadixCheckbox from '@radix-ui/react-checkbox'

/**
 * 🎨 CHECKBOX PREMIUM - Estilo Apple/Tesla
 * 
 * Variantes:
 * - default: Checkbox estándar 24px
 * - card: Checkbox con card seleccionable
 * 
 * Estados:
 * - unchecked: No seleccionado
 * - checked: Seleccionado
 * - indeterminate: Parcialmente seleccionado
 */

export interface CheckboxPremiumProps {
  checked?: boolean | 'indeterminate'
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean | 'indeterminate') => void
  disabled?: boolean
  required?: boolean
  label?: string
  description?: string
  error?: string
  variant?: 'default' | 'card'
  className?: string
}

const CheckboxPremium = forwardRef<HTMLButtonElement, CheckboxPremiumProps>(
  (
    {
      checked,
      defaultChecked,
      onCheckedChange,
      disabled = false,
      required = false,
      label,
      description,
      error,
      variant = 'default',
      className,
    },
    ref,
  ) => {
    const hasError = Boolean(error)

    if (variant === 'card') {
      return (
        <CheckboxCardVariant
          ref={ref}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          required={required}
          label={label}
          description={description}
          error={error}
          className={className}
        />
      )
    }

    return (
      <div className={cn('flex items-start gap-3', className)}>
        {/* Checkbox */}
        <RadixCheckbox.Root
          ref={ref}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          required={required}
          className={cn(
            'w-6 h-6',
            'flex items-center justify-center',
            'rounded-lg',
            'border-2',
            'transition-all duration-200',
            'apple-font-smoothing',
            
            // Unchecked state
            'bg-white/5',
            'border-white/20',
            
            // Checked state
            'data-[state=checked]:bg-[#0A84FF]',
            'data-[state=checked]:border-[#0A84FF]',
            'data-[state=checked]:shadow-[0_0_10px_rgba(10,132,255,0.3)]',
            
            // Indeterminate state
            'data-[state=indeterminate]:bg-[#0A84FF]',
            'data-[state=indeterminate]:border-[#0A84FF]',
            'data-[state=indeterminate]:shadow-[0_0_10px_rgba(10,132,255,0.3)]',
            
            // Hover state
            'hover:border-white/40',
            'data-[state=checked]:hover:bg-[#0A84FF]/90',
            
            // Focus state
            'focus:outline-none',
            'focus:ring-2 focus:ring-[#0A84FF]/50',
            'focus:ring-offset-2 focus:ring-offset-transparent',
            
            // Disabled state
            'disabled:opacity-40',
            'disabled:cursor-not-allowed',
            
            // Error state
            hasError && [
              'border-[#FF453A]/50',
              'focus:ring-[#FF453A]/50',
            ],
          )}
        >
          <RadixCheckbox.Indicator asChild>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {checked === 'indeterminate' ? (
                <Minus className="w-4 h-4 text-white" strokeWidth={3} />
              ) : (
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              )}
            </motion.div>
          </RadixCheckbox.Indicator>
        </RadixCheckbox.Root>

        {/* Label & Description */}
        {(label || description) && (
          <div className="flex-1 pt-0.5">
            {label && (
              <label className="block text-sm font-medium text-white/85 cursor-pointer apple-font-smoothing">
                {label}
                {required && <span className="text-[#FF453A] ml-1">*</span>}
              </label>
            )}
            {description && (
              <p className="mt-1 text-sm text-white/60 apple-font-smoothing">
                {description}
              </p>
            )}
            {error && (
              <p className="mt-1 text-sm text-[#FF453A] apple-font-smoothing">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    )
  },
)

CheckboxPremium.displayName = 'CheckboxPremium'

// Card Variant
const CheckboxCardVariant = forwardRef<HTMLButtonElement, CheckboxPremiumProps>(
  (
    {
      checked,
      defaultChecked,
      onCheckedChange,
      disabled,
      required,
      label,
      description,
      error,
      className,
    },
    ref,
  ) => {
    const hasError = Boolean(error)
    const isChecked = checked === true || checked === 'indeterminate'

    return (
      <div className={cn('relative', className)}>
        <RadixCheckbox.Root
          ref={ref}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          required={required}
          className={cn(
            'w-full p-4',
            'rounded-xl',
            'border-2',
            'backdrop-blur-xl',
            'transition-all duration-200',
            'apple-font-smoothing',
            'cursor-pointer',
            
            // Unchecked state
            'bg-white/5',
            'border-white/10',
            
            // Checked state
            'data-[state=checked]:bg-[#0A84FF]/10',
            'data-[state=checked]:border-[#0A84FF]',
            'data-[state=checked]:shadow-[0_0_20px_rgba(10,132,255,0.2)]',
            
            // Hover state
            'hover:bg-white/10',
            'hover:border-white/20',
            
            // Focus state
            'focus:outline-none',
            'focus:ring-2 focus:ring-[#0A84FF]/50',
            
            // Disabled state
            'disabled:opacity-40',
            'disabled:cursor-not-allowed',
            
            // Error state
            hasError && [
              'border-[#FF453A]/50',
              'focus:ring-[#FF453A]/50',
            ],
          )}
        >
          <div className="flex items-start gap-3">
            {/* Checkmark circle */}
            <div
              className={cn(
                'w-6 h-6 flex-shrink-0',
                'flex items-center justify-center',
                'rounded-full',
                'border-2',
                'transition-all duration-200',
                
                isChecked 
                  ? 'bg-[#0A84FF] border-[#0A84FF]' 
                  : 'bg-transparent border-white/40',
              )}
            >
              <RadixCheckbox.Indicator asChild>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </motion.div>
              </RadixCheckbox.Indicator>
            </div>

            {/* Content */}
            <div className="flex-1">
              {label && (
                <p className="text-base font-semibold text-white apple-font-smoothing">
                  {label}
                  {required && <span className="text-[#FF453A] ml-1">*</span>}
                </p>
              )}
              {description && (
                <p className="mt-1 text-sm text-white/60 apple-font-smoothing">
                  {description}
                </p>
              )}
            </div>
          </div>
        </RadixCheckbox.Root>

        {error && (
          <p className="mt-2 text-sm text-[#FF453A] apple-font-smoothing">
            {error}
          </p>
        )}
      </div>
    )
  },
)

CheckboxCardVariant.displayName = 'CheckboxCardVariant'

export { CheckboxPremium }
