'use client'

import { forwardRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import * as RadixTabs from '@radix-ui/react-tabs'

/**
 * 🎨 TABS PREMIUM - Estilo Apple/Tesla
 * 
 * Variantes:
 * - line: Línea animada debajo del tab activo
 * - pill: Background pill estilo iOS
 * - card: Cards elevados
 * 
 * Orientación: horizontal/vertical
 */

export interface TabsPremiumProps {
  tabs: Array<{
    value: string
    label: string
    icon?: ReactNode
    disabled?: boolean
  }>
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  variant?: 'line' | 'pill' | 'card'
  orientation?: 'horizontal' | 'vertical'
  fullWidth?: boolean
  className?: string
  children: ReactNode
}

const TabsPremium = forwardRef<HTMLDivElement, TabsPremiumProps>(
  (
    {
      tabs,
      defaultValue,
      value,
      onValueChange,
      variant = 'line',
      orientation = 'horizontal',
      fullWidth = false,
      className,
      children,
    },
    ref,
  ) => {
    return (
      <RadixTabs.Root
        ref={ref}
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
        orientation={orientation}
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-row gap-6' : 'flex-col',
          className,
        )}
      >
        {/* Tabs List */}
        <RadixTabs.List
          className={cn(
            'flex gap-2',
            orientation === 'vertical' ? 'flex-col' : 'flex-row',
            variant === 'line' && orientation === 'horizontal' && 'border-b border-white/10',
            variant === 'line' && orientation === 'vertical' && 'border-r border-white/10',
            variant === 'pill' && 'bg-white/5 backdrop-blur-xl rounded-xl p-1',
            fullWidth && 'w-full',
          )}
        >
          {tabs.map((tab) => (
            <TabTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              variant={variant}
              orientation={orientation}
              fullWidth={fullWidth}
              icon={tab.icon}
            >
              {tab.label}
            </TabTrigger>
          ))}
        </RadixTabs.List>

        {/* Tab Content */}
        {children}
      </RadixTabs.Root>
    )
  },
)

TabsPremium.displayName = 'TabsPremium'

// Tab Trigger Component
interface TabTriggerProps {
  value: string
  disabled?: boolean
  variant: 'line' | 'pill' | 'card'
  orientation: 'horizontal' | 'vertical'
  fullWidth: boolean
  icon?: ReactNode
  children: ReactNode
}

const TabTrigger = forwardRef<HTMLButtonElement, TabTriggerProps>(
  ({ value, disabled, variant, orientation, fullWidth, icon, children }, ref) => {
    return (
      <RadixTabs.Trigger
        ref={ref}
        value={value}
        disabled={disabled}
        className={cn(
          'relative',
          'px-4 py-2.5',
          'text-base font-semibold',
          'text-white/60',
          'transition-all duration-200',
          'apple-font-smoothing',
          'focus:outline-none',
          'disabled:opacity-40',
          'disabled:cursor-not-allowed',
          
          // Hover state
          'hover:text-white/85',
          
          // Active state
          'data-[state=active]:text-white',
          
          // Variant styles
          variant === 'line' && [
            'rounded-t-lg',
            orientation === 'horizontal' ? '-mb-px' : '-mr-px',
          ],
          
          variant === 'pill' && [
            'rounded-lg',
            'data-[state=active]:bg-white/10',
            'data-[state=active]:shadow-lg',
          ],
          
          variant === 'card' && [
            'rounded-xl',
            'bg-white/5',
            'border border-white/10',
            'data-[state=active]:bg-white/10',
            'data-[state=active]:border-[#0A84FF]/50',
            'data-[state=active]:shadow-[0_0_20px_rgba(10,132,255,0.2)]',
          ],
          
          fullWidth && 'flex-1',
          
          'inline-flex items-center justify-center gap-2',
        )}
      >
        {icon && (
          <span className="w-5 h-5 flex-shrink-0">
            {icon}
          </span>
        )}
        <span>{children}</span>
        
        {/* Animated indicator for line variant */}
        {variant === 'line' && (
          <motion.div
            layoutId="tab-indicator"
            className={cn(
              'absolute bg-[#0A84FF]',
              orientation === 'horizontal' 
                ? 'bottom-0 left-0 right-0 h-0.5' 
                : 'right-0 top-0 bottom-0 w-0.5',
            )}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </RadixTabs.Trigger>
    )
  },
)

TabTrigger.displayName = 'TabTrigger'

// Tab Content Component
export const TabsContentPremium = forwardRef<
  HTMLDivElement,
  { value: string; children: ReactNode; className?: string }
>(({ value, children, className }, ref) => (
  <RadixTabs.Content
    ref={ref}
    value={value}
    className={cn(
      'mt-6',
      'focus:outline-none',
      'animate-in fade-in-0 slide-in-from-bottom-2',
      'duration-300',
      className,
    )}
  >
    {children}
  </RadixTabs.Content>
))

TabsContentPremium.displayName = 'TabsContentPremium'

export { TabsPremium }
