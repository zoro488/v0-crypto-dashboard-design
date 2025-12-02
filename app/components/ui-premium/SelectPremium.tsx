'use client'

import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as RadixSelect from '@radix-ui/react-select'

/**
 * 🎨 SELECT PREMIUM - Estilo Apple/Tesla
 * 
 * Características:
 * - 44px altura (Apple standard)
 * - Glassmorphism background
 * - Smooth animations
 * - Error states
 * - Disabled states
 * - Custom scrollbar
 * 
 * Basado en Radix UI Select
 */

export interface SelectPremiumOption {
  value: string
  label: string
  disabled?: boolean
  icon?: ReactNode
}

export interface SelectPremiumProps {
  options: SelectPremiumOption[]
  value?: string
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  helperText?: string
  label?: string
  required?: boolean
  onValueChange?: (value: string) => void
  className?: string
}

const SelectPremium = forwardRef<HTMLButtonElement, SelectPremiumProps>(
  (
    {
      options,
      value,
      defaultValue,
      placeholder = 'Seleccionar...',
      disabled = false,
      error,
      helperText,
      label,
      required = false,
      onValueChange,
      className,
    },
    ref,
  ) => {
    const hasError = Boolean(error)

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-white/85 mb-2">
            {label}
            {required && <span className="text-[#FF453A] ml-1">*</span>}
          </label>
        )}

        <RadixSelect.Root
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange}
          disabled={disabled}
        >
          <RadixSelect.Trigger
            ref={ref}
            className={cn(
              // Base styles
              'w-full h-11',
              'px-4',
              'rounded-xl',
              'font-medium text-base',
              'text-left',
              'inline-flex items-center justify-between gap-2',
              'transition-all duration-200',
              'apple-font-smoothing',
              
              // Glassmorphism
              'bg-white/5',
              'backdrop-blur-xl',
              'border border-white/10',
              
              // Focus state
              'focus:outline-none',
              'focus:ring-2 focus:ring-[#0A84FF]/50',
              'focus:border-[#0A84FF]/50',
              'focus:shadow-[0_0_20px_rgba(10,132,255,0.2)]',
              
              // Hover state
              'hover:bg-white/10',
              'hover:border-white/20',
              
              // Disabled state
              'disabled:opacity-40',
              'disabled:cursor-not-allowed',
              'disabled:hover:bg-white/5',
              
              // Error state
              hasError && [
                'border-[#FF453A]/50',
                'focus:ring-[#FF453A]/50',
                'focus:border-[#FF453A]/50',
                'focus:shadow-[0_0_20px_rgba(255,69,58,0.2)]',
              ],
              
              className,
            )}
          >
            <RadixSelect.Value placeholder={placeholder} />
            <RadixSelect.Icon>
              <ChevronDown className="w-5 h-5 text-white/60 transition-transform duration-200 ui-expanded:rotate-180" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>

          <AnimatePresence>
            <RadixSelect.Portal>
              <RadixSelect.Content
                className={cn(
                  'overflow-hidden',
                  'rounded-xl',
                  'bg-[#1C1C1E]/95',
                  'backdrop-blur-3xl',
                  'border border-white/10',
                  'shadow-2xl',
                  'z-50',
                )}
                position="popper"
                sideOffset={8}
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <RadixSelect.Viewport className="p-2">
                    {options.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        icon={option.icon}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </RadixSelect.Viewport>
                </motion.div>
              </RadixSelect.Content>
            </RadixSelect.Portal>
          </AnimatePresence>
        </RadixSelect.Root>

        {/* Error or Helper Text */}
        <AnimatePresence mode="wait">
          {(error || helperText) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="mt-2 flex items-start gap-1.5"
            >
              {error && <AlertCircle className="w-4 h-4 text-[#FF453A] mt-0.5 flex-shrink-0" />}
              <p
                className={cn(
                  'text-sm',
                  error ? 'text-[#FF453A]' : 'text-white/60',
                )}
              >
                {error || helperText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  },
)

SelectPremium.displayName = 'SelectPremium'

// Select Item Component
interface SelectItemProps {
  value: string
  disabled?: boolean
  icon?: ReactNode
  children: ReactNode
}

const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value, disabled, icon, children }, ref) => {
    return (
      <RadixSelect.Item
        value={value}
        disabled={disabled}
        className={cn(
          'relative',
          'flex items-center gap-3',
          'px-3 py-2.5',
          'rounded-lg',
          'text-base font-medium',
          'text-white/85',
          'cursor-pointer',
          'outline-none',
          'select-none',
          
          // Hover state
          'hover:bg-white/10',
          
          // Focus state
          'focus:bg-white/10',
          
          // Selected state
          'data-[state=checked]:bg-[#0A84FF]/20',
          'data-[state=checked]:text-[#0A84FF]',
          
          // Disabled state
          'disabled:opacity-40',
          'disabled:cursor-not-allowed',
          'disabled:hover:bg-transparent',
          
          'transition-colors duration-150',
          'apple-font-smoothing',
        )}
        ref={ref}
      >
        {/* Icon */}
        {icon && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
        
        {/* Text */}
        <RadixSelect.ItemText className="flex-1">
          {children}
        </RadixSelect.ItemText>
        
        {/* Checkmark */}
        <RadixSelect.ItemIndicator className="flex-shrink-0">
          <Check className="w-5 h-5" />
        </RadixSelect.ItemIndicator>
      </RadixSelect.Item>
    )
  },
)

SelectItem.displayName = 'SelectItem'

export { SelectPremium }
