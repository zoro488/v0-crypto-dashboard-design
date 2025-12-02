'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import * as RadixSwitch from '@radix-ui/react-switch'

/**
 * 🎨 SWITCH PREMIUM - Estilo iOS/Apple
 * 
 * Características:
 * - Toggle iOS-style
 * - Spring animation
 * - Glow effect cuando activo
 * - Label positions: left/right/top/bottom
 */

export interface SwitchPremiumProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  required?: boolean
  label?: string
  description?: string
  labelPosition?: 'left' | 'right' | 'top' | 'bottom'
  className?: string
}

const SwitchPremium = forwardRef<HTMLButtonElement, SwitchPremiumProps>(
  (
    {
      checked,
      defaultChecked,
      onCheckedChange,
      disabled = false,
      required = false,
      label,
      description,
      labelPosition = 'right',
      className,
    },
    ref,
  ) => {
    const SwitchElement = (
      <RadixSwitch.Root
        ref={ref}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        required={required}
        className={cn(
          'relative',
          'w-[52px] h-[32px]',
          'rounded-full',
          'transition-all duration-300',
          'apple-font-smoothing',
          'cursor-pointer',
          
          // Unchecked state
          'bg-white/20',
          
          // Checked state
          'data-[state=checked]:bg-[#0A84FF]',
          'data-[state=checked]:shadow-[0_0_20px_rgba(10,132,255,0.4)]',
          
          // Focus state
          'focus:outline-none',
          'focus:ring-2 focus:ring-[#0A84FF]/50',
          'focus:ring-offset-2 focus:ring-offset-transparent',
          
          // Disabled state
          'disabled:opacity-40',
          'disabled:cursor-not-allowed',
        )}
      >
        <RadixSwitch.Thumb asChild>
          <motion.span
            layout
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
            className={cn(
              'block',
              'w-[28px] h-[28px]',
              'rounded-full',
              'bg-white',
              'shadow-lg',
              'translate-x-0.5',
              'data-[state=checked]:translate-x-[22px]',
            )}
          />
        </RadixSwitch.Thumb>
      </RadixSwitch.Root>
    )

    // Si no hay label, retornar solo el switch
    if (!label && !description) {
      return <div className={className}>{SwitchElement}</div>
    }

    // Layout con label
    const labelContent = (
      <div className="flex-1">
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
      </div>
    )

    const layouts = {
      left: (
        <div className={cn('flex items-center gap-3', className)}>
          {labelContent}
          {SwitchElement}
        </div>
      ),
      right: (
        <div className={cn('flex items-center gap-3', className)}>
          {SwitchElement}
          {labelContent}
        </div>
      ),
      top: (
        <div className={cn('flex flex-col gap-2', className)}>
          {labelContent}
          {SwitchElement}
        </div>
      ),
      bottom: (
        <div className={cn('flex flex-col gap-2', className)}>
          {SwitchElement}
          {labelContent}
        </div>
      ),
    }

    return layouts[labelPosition]
  },
)

SwitchPremium.displayName = 'SwitchPremium'

export { SwitchPremium }
