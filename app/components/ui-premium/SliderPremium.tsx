'use client'

import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'
import * as RadixSlider from '@radix-ui/react-slider'

/**
 * 🎨 SLIDER PREMIUM - Estilo Apple/Tesla
 * 
 * Características:
 * - Single/Range support
 * - Step marks opcionales
 * - Tooltip con valor actual
 * - Smooth animations
 */

export interface SliderPremiumProps {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
  onValueCommit?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  label?: string
  showValue?: boolean
  showSteps?: boolean
  formatValue?: (value: number) => string
  className?: string
}

const SliderPremium = forwardRef<HTMLSpanElement, SliderPremiumProps>(
  (
    {
      value,
      defaultValue = [50],
      onValueChange,
      onValueCommit,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      label,
      showValue = true,
      showSteps = false,
      formatValue = (v) => v.toString(),
      className,
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(value || defaultValue)
    const currentValue = value || internalValue

    const handleValueChange = (newValue: number[]) => {
      setInternalValue(newValue)
      onValueChange?.(newValue)
    }

    // Calcular steps
    const steps = showSteps ? Math.floor((max - min) / step) : 0
    const stepMarks = showSteps
      ? Array.from({ length: steps + 1 }, (_, i) => min + i * step)
      : []

    return (
      <div className={cn('w-full', className)}>
        {/* Header */}
        {(label || showValue) && (
          <div className="flex items-center justify-between mb-3">
            {label && (
              <label className="text-sm font-medium text-white/85 apple-font-smoothing">
                {label}
              </label>
            )}
            {showValue && (
              <span className="text-sm font-semibold text-[#0A84FF] apple-font-smoothing">
                {currentValue.map(formatValue).join(' - ')}
              </span>
            )}
          </div>
        )}

        {/* Slider */}
        <RadixSlider.Root
          ref={ref}
          value={currentValue}
          defaultValue={defaultValue}
          onValueChange={handleValueChange}
          onValueCommit={onValueCommit}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            'relative',
            'flex items-center',
            'w-full h-5',
            'touch-none select-none',
            'cursor-pointer',
            'disabled:opacity-40',
            'disabled:cursor-not-allowed',
          )}
        >
          {/* Track */}
          <RadixSlider.Track className="relative h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
            {/* Range (parte activa) */}
            <RadixSlider.Range className="absolute h-full bg-gradient-to-r from-[#0A84FF] to-[#5E5CE6] shadow-[0_0_10px_rgba(10,132,255,0.3)]" />
          </RadixSlider.Track>

          {/* Step Marks */}
          {showSteps && (
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
              {stepMarks.map((stepValue, i) => {
                const isInRange =
                  currentValue.length === 1
                    ? stepValue <= currentValue[0]
                    : stepValue >= currentValue[0] && stepValue <= currentValue[1]

                return (
                  <div
                    key={i}
                    className={cn(
                      'w-1 h-1 rounded-full transition-colors',
                      isInRange ? 'bg-white' : 'bg-white/40',
                    )}
                  />
                )
              })}
            </div>
          )}

          {/* Thumbs */}
          {currentValue.map((_, i) => (
            <RadixSlider.Thumb
              key={i}
              className={cn(
                'block',
                'w-5 h-5',
                'rounded-full',
                'bg-white',
                'shadow-lg',
                'border-2 border-[#0A84FF]',
                'transition-all duration-200',
                
                // Hover state
                'hover:scale-110',
                
                // Focus state
                'focus:outline-none',
                'focus:ring-2 focus:ring-[#0A84FF]/50',
                'focus:ring-offset-2 focus:ring-offset-transparent',
                
                // Active state
                'active:scale-95',
              )}
            />
          ))}
        </RadixSlider.Root>

        {/* Min/Max labels */}
        {showSteps && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-white/40 apple-font-smoothing">
              {formatValue(min)}
            </span>
            <span className="text-xs text-white/40 apple-font-smoothing">
              {formatValue(max)}
            </span>
          </div>
        )}
      </div>
    )
  },
)

SliderPremium.displayName = 'SliderPremium'

export { SliderPremium }
