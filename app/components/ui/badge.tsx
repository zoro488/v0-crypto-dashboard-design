import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/app/lib/utils'

/**
 * 🎨 BADGE OBSIDIAN - Sistema Premium
 * 
 * Badges con estilo Obsidian Glass:
 * - Glassmorphism
 * - Glow effects
 * - Variantes semánticas
 */

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-lg border px-3 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden backdrop-blur-xl apple-font-smoothing',
  {
    variants: {
      variant: {
        // 🔵 Default - Apple Blue
        default:
          'border-[#0A84FF]/30 bg-[#0A84FF]/15 text-[#0A84FF] shadow-[0_0_12px_-4px_rgba(10,132,255,0.4)] hover:bg-[#0A84FF]/20 hover:border-[#0A84FF]/40',
        
        // ⚫ Secondary - Neutral
        secondary:
          'border-white/[0.1] bg-white/[0.08] text-white/80 hover:bg-white/[0.12] hover:border-white/[0.15]',
        
        // ✅ Success - Green
        success:
          'border-[#30D158]/30 bg-[#30D158]/15 text-[#30D158] shadow-[0_0_12px_-4px_rgba(48,209,88,0.4)] hover:bg-[#30D158]/20 hover:border-[#30D158]/40',
        
        // 🔴 Destructive - Red  
        destructive:
          'border-[#FF453A]/30 bg-[#FF453A]/15 text-[#FF453A] shadow-[0_0_12px_-4px_rgba(255,69,58,0.4)] hover:bg-[#FF453A]/20 hover:border-[#FF453A]/40',
        
        // 🟡 Warning - Amber
        warning:
          'border-[#FF9F0A]/30 bg-[#FF9F0A]/15 text-[#FF9F0A] shadow-[0_0_12px_-4px_rgba(255,159,10,0.4)] hover:bg-[#FF9F0A]/20 hover:border-[#FF9F0A]/40',
        
        // 🟣 Purple - Premium
        purple:
          'border-purple-500/30 bg-purple-500/15 text-purple-400 shadow-[0_0_12px_-4px_rgba(168,85,247,0.4)] hover:bg-purple-500/20 hover:border-purple-500/40',
        
        // 🔮 Cyan - Tech
        cyan:
          'border-cyan-500/30 bg-cyan-500/15 text-cyan-400 shadow-[0_0_12px_-4px_rgba(6,182,212,0.4)] hover:bg-cyan-500/20 hover:border-cyan-500/40',
        
        // ⬜ Outline - Minimal
        outline:
          'border-white/[0.15] bg-transparent text-white/60 hover:bg-white/[0.05] hover:text-white/80 hover:border-white/[0.25]',
        
        // 🌈 Gradient - Premium
        gradient:
          'border-transparent bg-gradient-to-r from-[#0A84FF]/20 via-purple-500/20 to-[#0A84FF]/20 text-white shadow-[0_0_16px_-4px_rgba(10,132,255,0.3)]',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        default: 'px-3 py-1 text-xs',
        lg: 'px-4 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
