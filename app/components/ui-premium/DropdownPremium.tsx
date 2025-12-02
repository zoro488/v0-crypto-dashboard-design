'use client'

import { forwardRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as RadixDropdown from '@radix-ui/react-dropdown-menu'

/**
 * 🎨 DROPDOWN PREMIUM - Estilo Apple/Tesla
 * 
 * Características:
 * - Sub-menus con chevron
 * - Checkboxes y radios integrados
 * - Keyboard navigation
 * - Separadores y labels
 * - Icon support
 */

export interface DropdownItem {
  type: 'item' | 'checkbox' | 'radio' | 'separator' | 'label' | 'sub'
  label?: string
  value?: string
  icon?: ReactNode
  shortcut?: string
  checked?: boolean
  disabled?: boolean
  onSelect?: () => void
  subItems?: DropdownItem[]
}

export interface DropdownPremiumProps {
  items: DropdownItem[]
  trigger: ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

const DropdownPremium = forwardRef<HTMLDivElement, DropdownPremiumProps>(
  (
    {
      items,
      trigger,
      align = 'start',
      side = 'bottom',
      className,
    },
    ref,
  ) => {
    return (
      <RadixDropdown.Root>
        <RadixDropdown.Trigger asChild>
          {trigger}
        </RadixDropdown.Trigger>

        <RadixDropdown.Portal>
          <RadixDropdown.Content
            ref={ref}
            align={align}
            side={side}
            sideOffset={8}
            className={cn(
              'min-w-[220px]',
              'p-2',
              'rounded-xl',
              'bg-[#1C1C1E]/95',
              'backdrop-blur-3xl',
              'border border-white/10',
              'shadow-2xl',
              'z-50',
              'animate-in fade-in-0 zoom-in-95',
              'data-[side=top]:slide-in-from-bottom-2',
              'data-[side=right]:slide-in-from-left-2',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=left]:slide-in-from-right-2',
              className,
            )}
          >
            {items.map((item, index) => (
              <DropdownItemRenderer key={index} item={item} />
            ))}
          </RadixDropdown.Content>
        </RadixDropdown.Portal>
      </RadixDropdown.Root>
    )
  },
)

DropdownPremium.displayName = 'DropdownPremium'

// Item Renderer
function DropdownItemRenderer({ item }: { item: DropdownItem }) {
  switch (item.type) {
    case 'separator':
      return <RadixDropdown.Separator className="h-px bg-white/10 my-2" />

    case 'label':
      return (
        <RadixDropdown.Label className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
          {item.label}
        </RadixDropdown.Label>
      )

    case 'checkbox':
      return (
        <RadixDropdown.CheckboxItem
          checked={item.checked}
          onCheckedChange={item.onSelect}
          disabled={item.disabled}
          className={cn(
            'relative',
            'flex items-center gap-3',
            'px-3 py-2.5',
            'rounded-lg',
            'text-sm font-medium text-white/85',
            'cursor-pointer',
            'outline-none',
            'select-none',
            
            // Hover/focus
            'hover:bg-white/10',
            'focus:bg-white/10',
            
            // Disabled
            'disabled:opacity-40',
            'disabled:cursor-not-allowed',
            
            'transition-colors duration-150',
            'apple-font-smoothing',
          )}
        >
          {/* Checkmark */}
          <span className="w-4 h-4 flex items-center justify-center">
            <RadixDropdown.ItemIndicator>
              <Check className="w-4 h-4 text-[#0A84FF]" strokeWidth={2.5} />
            </RadixDropdown.ItemIndicator>
          </span>

          {/* Icon */}
          {item.icon && (
            <span className="w-5 h-5 flex-shrink-0 text-white/60">
              {item.icon}
            </span>
          )}

          {/* Label */}
          <span className="flex-1">{item.label}</span>

          {/* Shortcut */}
          {item.shortcut && (
            <span className="text-xs text-white/40">{item.shortcut}</span>
          )}
        </RadixDropdown.CheckboxItem>
      )

    case 'radio':
      return (
        <RadixDropdown.RadioItem
          value={item.value || ''}
          disabled={item.disabled}
          className={cn(
            'relative',
            'flex items-center gap-3',
            'px-3 py-2.5',
            'rounded-lg',
            'text-sm font-medium text-white/85',
            'cursor-pointer',
            'outline-none',
            'select-none',
            'hover:bg-white/10',
            'focus:bg-white/10',
            'disabled:opacity-40',
            'disabled:cursor-not-allowed',
            'transition-colors duration-150',
            'apple-font-smoothing',
          )}
        >
          <span className="w-4 h-4 flex items-center justify-center">
            <RadixDropdown.ItemIndicator>
              <div className="w-2 h-2 rounded-full bg-[#0A84FF]" />
            </RadixDropdown.ItemIndicator>
          </span>

          {item.icon && (
            <span className="w-5 h-5 flex-shrink-0 text-white/60">
              {item.icon}
            </span>
          )}

          <span className="flex-1">{item.label}</span>

          {item.shortcut && (
            <span className="text-xs text-white/40">{item.shortcut}</span>
          )}
        </RadixDropdown.RadioItem>
      )

    case 'sub':
      return (
        <RadixDropdown.Sub>
          <RadixDropdown.SubTrigger
            className={cn(
              'relative',
              'flex items-center gap-3',
              'px-3 py-2.5',
              'rounded-lg',
              'text-sm font-medium text-white/85',
              'cursor-pointer',
              'outline-none',
              'select-none',
              'hover:bg-white/10',
              'focus:bg-white/10',
              'transition-colors duration-150',
              'apple-font-smoothing',
            )}
          >
            {item.icon && (
              <span className="w-5 h-5 flex-shrink-0 text-white/60">
                {item.icon}
              </span>
            )}
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-white/40" />
          </RadixDropdown.SubTrigger>

          <RadixDropdown.Portal>
            <RadixDropdown.SubContent
              className={cn(
                'min-w-[220px]',
                'p-2',
                'rounded-xl',
                'bg-[#1C1C1E]/95',
                'backdrop-blur-3xl',
                'border border-white/10',
                'shadow-2xl',
                'animate-in fade-in-0 zoom-in-95',
              )}
              sideOffset={8}
            >
              {item.subItems?.map((subItem, subIndex) => (
                <DropdownItemRenderer key={subIndex} item={subItem} />
              ))}
            </RadixDropdown.SubContent>
          </RadixDropdown.Portal>
        </RadixDropdown.Sub>
      )

    case 'item':
    default:
      return (
        <RadixDropdown.Item
          onSelect={item.onSelect}
          disabled={item.disabled}
          className={cn(
            'relative',
            'flex items-center gap-3',
            'px-3 py-2.5',
            'rounded-lg',
            'text-sm font-medium text-white/85',
            'cursor-pointer',
            'outline-none',
            'select-none',
            'hover:bg-white/10',
            'focus:bg-white/10',
            'disabled:opacity-40',
            'disabled:cursor-not-allowed',
            'transition-colors duration-150',
            'apple-font-smoothing',
          )}
        >
          {item.icon && (
            <span className="w-5 h-5 flex-shrink-0 text-white/60">
              {item.icon}
            </span>
          )}
          <span className="flex-1">{item.label}</span>
          {item.shortcut && (
            <span className="text-xs text-white/40">{item.shortcut}</span>
          )}
        </RadixDropdown.Item>
      )
  }
}

export { DropdownPremium }
