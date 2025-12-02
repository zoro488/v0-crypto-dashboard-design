'use client'

import { forwardRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as RadixRadio from '@radix-ui/react-radio-group'

/**
 * 🎨 RADIO PREMIUM - Estilo Apple/Tesla
 * 
 * Variantes:
 * - default: Radio buttons estándar 24px
 * - card: Radio con card seleccionable
 * 
 * Agrupación con RadioGroupPremium
 */

export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
  icon?: ReactNode
}

export interface RadioGroupPremiumProps {
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'card'
  required?: boolean
  error?: string
  label?: string
  className?: string
}

const RadioGroupPremium = forwardRef<HTMLDivElement, RadioGroupPremiumProps>(
  (
    {
      options,
      value,
      defaultValue,
      onValueChange,
      orientation = 'vertical',
      variant = 'default',
      required = false,
      error,
      label,
      className,
    },
    ref,
  ) => {
    const hasError = Boolean(error)

    return (
      <div className={cn('w-full', className)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-white/85 mb-3">
            {label}
            {required && <span className="text-[#FF453A] ml-1">*</span>}
          </label>
        )}

        {/* Radio Group */}
        <RadixRadio.Root
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange}
          orientation={orientation}
          required={required}
          className={cn(
            'flex gap-3',
            orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
          )}
        >
          {options.map((option) => (
            <RadioItemPremium
              key={option.value}
              value={option.value}
              label={option.label}
              description={option.description}
              disabled={option.disabled}
              icon={option.icon}
              variant={variant}
              hasError={hasError}
            />
          ))}
        </RadixRadio.Root>

        {/* Error */}
        {error && (
          <p className="mt-2 text-sm text-[#FF453A] apple-font-smoothing">
            {error}
          </p>
        )}
      </div>
    )
  },
)

RadioGroupPremium.displayName = 'RadioGroupPremium'

// Radio Item Component
interface RadioItemProps {
  value: string
  label: string
  description?: string
  disabled?: boolean
  icon?: ReactNode
  variant: 'default' | 'card'
  hasError: boolean
}

const RadioItemPremium = forwardRef<HTMLButtonElement, RadioItemProps>(
  ({ value, label, description, disabled, icon, variant, hasError }, ref) => {
    if (variant === 'card') {
      return (
        <RadixRadio.Item
          ref={ref}
          value={value}
          disabled={disabled}
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
            {/* Radio circle */}
            <div className="relative w-6 h-6 flex-shrink-0 flex items-center justify-center">
              <div
                className={cn(
                  'w-6 h-6',
                  'rounded-full',
                  'border-2',
                  'flex items-center justify-center',
                  'transition-all duration-200',
                  'bg-transparent border-white/40',
                  'group-data-[state=checked]/radio:border-[#0A84FF]',
                )}
              >
                <RadixRadio.Indicator asChild>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-3 h-3 rounded-full bg-[#0A84FF]"
                  />
                </RadixRadio.Indicator>
              </div>
            </div>

            {/* Icon */}
            {icon && (
              <div className="flex-shrink-0 w-6 h-6 text-white/60 data-[state=checked]:text-[#0A84FF]">
                {icon}
              </div>
            )}

            {/* Content */}
            <div className="flex-1">
              <p className="text-base font-semibold text-white apple-font-smoothing">
                {label}
              </p>
              {description && (
                <p className="mt-1 text-sm text-white/60 apple-font-smoothing">
                  {description}
                </p>
              )}
            </div>
          </div>
        </RadixRadio.Item>
      )
    }

    // Default variant
    return (
      <div className="flex items-start gap-3">
        <RadixRadio.Item
          ref={ref}
          value={value}
          disabled={disabled}
          className={cn(
            'w-6 h-6 flex-shrink-0',
            'flex items-center justify-center',
            'rounded-full',
            'border-2',
            'transition-all duration-200',
            'apple-font-smoothing',
            
            // Unchecked state
            'bg-white/5',
            'border-white/20',
            
            // Checked state
            'data-[state=checked]:border-[#0A84FF]',
            'data-[state=checked]:shadow-[0_0_10px_rgba(10,132,255,0.3)]',
            
            // Hover state
            'hover:border-white/40',
            
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
          <RadixRadio.Indicator asChild>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-3 h-3 rounded-full bg-[#0A84FF]"
            />
          </RadixRadio.Indicator>
        </RadixRadio.Item>

        {/* Label & Description */}
        <div className="flex-1 pt-0.5">
          <label className="block text-sm font-medium text-white/85 cursor-pointer apple-font-smoothing">
            {label}
          </label>
          {description && (
            <p className="mt-1 text-sm text-white/60 apple-font-smoothing">
              {description}
            </p>
          )}
        </div>
      </div>
    )
  },
)

RadioItemPremium.displayName = 'RadioItemPremium'

export { RadioGroupPremium }
