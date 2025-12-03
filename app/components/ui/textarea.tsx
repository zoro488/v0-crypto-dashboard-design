import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/app/lib/utils'

/**
 * 🎨 TEXTAREA OBSIDIAN - Sistema Premium
 * 
 * Textarea con estilo Obsidian Glass:
 * - Glassmorphism background
 * - Focus glow azul Apple
 * - Error states
 * - Label y helper text
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
  helperText?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label className="block text-sm font-semibold text-white/90 mb-2 tracking-tight apple-font-smoothing">
            {label}
          </label>
        )}
        
        <div className="relative">
          <textarea
            className={cn(
              // Base styles
              'flex min-h-[120px] w-full p-4',
              'rounded-xl',
              'text-white placeholder:text-white/40',
              'apple-font-smoothing',
              
              // Glassmorphism
              'bg-[rgba(10,10,15,0.6)] backdrop-blur-2xl',
              'border border-white/[0.08]',
              
              // Focus state
              'focus:outline-none focus:border-[#0A84FF]',
              'focus:shadow-[0_0_20px_-4px_rgba(10,132,255,0.4)]',
              
              // Hover
              'hover:border-white/[0.12]',
              
              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-40',
              
              // Resize
              'resize-none',
              
              // Scrollbar
              'scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent',
              
              // Error state
              error && 'border-[#FF453A] focus:border-[#FF453A] focus:shadow-[0_0_20px_-4px_rgba(255,69,58,0.4)]',
              
              // Transition
              'transition-all duration-200',
              
              className,
            )}
            ref={ref}
            {...props}
          />
          
          {/* Error icon */}
          {error && (
            <div className="absolute top-4 right-4 text-[#FF453A] pointer-events-none">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
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
Textarea.displayName = 'Textarea'

export { Textarea }
