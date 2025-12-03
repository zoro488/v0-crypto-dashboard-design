'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Search, type LucideIcon } from 'lucide-react'
import { cn } from '@/app/lib/utils'

/**
 * 🎨 INPUT OBSIDIAN - Sistema Premium Unificado
 * 
 * Características:
 * - Height: 44px (táctil optimizado Apple)
 * - Border-radius: 12px
 * - Glassmorphism Obsidian background
 * - Focus: Blue glow
 * - Error states con icon
 * - Search variant
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  helperText?: string
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  variant?: 'default' | 'search' | 'minimal'
  inputSize?: 'sm' | 'md' | 'lg'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    error,
    label,
    helperText,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    variant = 'default',
    inputSize = 'md',
    ...props 
  }, ref) => {
    // Tamaños (Apple standards)
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

    // Variantes Obsidian Glass
    const variants = {
      default: `
        bg-[rgba(10,10,15,0.6)] backdrop-blur-2xl
        border border-white/[0.08]
        focus:border-[#0A84FF] focus:shadow-[0_0_20px_-4px_rgba(10,132,255,0.4)]
        hover:border-white/[0.12]
      `,
      search: `
        bg-[rgba(10,10,15,0.4)] backdrop-blur-2xl
        border border-white/[0.06]
        focus:border-[#0A84FF] focus:shadow-[0_0_20px_-4px_rgba(10,132,255,0.4)]
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
          <label className="block text-sm font-semibold text-white/90 mb-2 tracking-tight apple-font-smoothing">
            {label}
          </label>
        )}
        
        {/* Input Container */}
        <div className="relative">
          {/* Left Icon (Search variant) */}
          {variant === 'search' && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
              <Search className={iconSizes[inputSize]} />
            </div>
          )}
          
          {/* Left Custom Icon */}
          {LeftIcon && variant !== 'search' && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
              <LeftIcon className={iconSizes[inputSize]} />
            </div>
          )}
          
          <input
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
              
              // Size y variant
              sizes[inputSize],
              variants[variant],
              
              // Error state
              error && 'border-[#FF453A] focus:border-[#FF453A] focus:shadow-[0_0_20px_-4px_rgba(255,69,58,0.4)]',
              
              // Icon padding
              LeftIcon && variant !== 'search' && 'pl-11',
              (RightIcon || error) && 'pr-11',
              
              // File input
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              
              className,
            )}
            ref={ref}
            {...props}
          />
          
          {/* Right Icon o Error */}
          {error ? (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF453A] pointer-events-none">
              <AlertCircle className={iconSizes[inputSize]} />
            </div>
          ) : RightIcon ? (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
              <RightIcon className={iconSizes[inputSize]} />
            </div>
          ) : null}
        </div>
        
        {/* Helper Text o Error Message */}
        {(helperText || error) && (
          <p className={cn(
            'text-xs mt-2 tracking-tight',
            error ? 'text-[#FF453A]' : 'text-white/50',
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
