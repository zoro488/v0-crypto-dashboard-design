'use client'

import { forwardRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import * as RadixTooltip from '@radix-ui/react-tooltip'

/**
 * 🎨 TOOLTIP PREMIUM - Estilo Apple/Tesla
 * 
 * Características:
 * - Arrow pointer
 * - Delay configurable
 * - Max-width responsive
 * - Smooth animations
 * - Multi-line support
 */

export interface TooltipPremiumProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
  maxWidth?: number
  showArrow?: boolean
  className?: string
}

const TooltipPremium = forwardRef<HTMLDivElement, TooltipPremiumProps>(
  (
    {
      content,
      children,
      side = 'top',
      align = 'center',
      delayDuration = 200,
      maxWidth = 320,
      showArrow = true,
      className,
    },
    ref,
  ) => {
    return (
      <RadixTooltip.Provider delayDuration={delayDuration}>
        <RadixTooltip.Root>
          <RadixTooltip.Trigger asChild>
            {children}
          </RadixTooltip.Trigger>

          <AnimatePresence>
            <RadixTooltip.Portal>
              <RadixTooltip.Content
                ref={ref}
                side={side}
                align={align}
                sideOffset={8}
                className={cn(
                  'px-3 py-2',
                  'rounded-lg',
                  'bg-[#1C1C1E]/95',
                  'backdrop-blur-3xl',
                  'border border-white/20',
                  'shadow-2xl',
                  'z-[100]',
                  'text-sm font-medium text-white',
                  'apple-font-smoothing',
                  'animate-in fade-in-0 zoom-in-95',
                  'data-[side=top]:slide-in-from-bottom-2',
                  'data-[side=right]:slide-in-from-left-2',
                  'data-[side=bottom]:slide-in-from-top-2',
                  'data-[side=left]:slide-in-from-right-2',
                  className,
                )}
                style={{ maxWidth }}
              >
                {content}
                
                {showArrow && (
                  <RadixTooltip.Arrow
                    className="fill-[#1C1C1E]/95"
                    width={12}
                    height={6}
                  />
                )}
              </RadixTooltip.Content>
            </RadixTooltip.Portal>
          </AnimatePresence>
        </RadixTooltip.Root>
      </RadixTooltip.Provider>
    )
  },
)

TooltipPremium.displayName = 'TooltipPremium'

// Simple tooltip variant (sin Radix, solo CSS hover)
export interface SimpleTooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function SimpleTooltip({
  content,
  children,
  position = 'top',
  className,
}: SimpleTooltipProps) {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  }

  return (
    <div className={cn('relative group', className)}>
      {children}
      <div
        className={cn(
          'absolute',
          positions[position],
          'px-3 py-2',
          'rounded-lg',
          'bg-[#1C1C1E]/95',
          'backdrop-blur-3xl',
          'border border-white/20',
          'shadow-2xl',
          'text-sm font-medium text-white whitespace-nowrap',
          'pointer-events-none',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-200',
          'apple-font-smoothing',
          'z-50',
        )}
      >
        {content}
      </div>
    </div>
  )
}

export { TooltipPremium }
