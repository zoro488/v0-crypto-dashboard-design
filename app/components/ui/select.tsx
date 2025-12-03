'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/app/lib/utils'

/**
 * 🎨 SELECT OBSIDIAN - Sistema Premium
 * 
 * Select con estilo Obsidian Glass:
 * - 44px altura (Apple standard)
 * - Glassmorphism background
 * - Animaciones fluidas
 * - Glow en hover/focus
 */

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base
      'flex h-11 w-full items-center justify-between',
      'px-4 py-2',
      'text-sm font-medium text-white',
      'apple-font-smoothing',
      
      // Glassmorphism Obsidian
      'bg-[rgba(10,10,15,0.6)] backdrop-blur-2xl',
      'rounded-xl',
      'border border-white/[0.08]',
      
      // Placeholder
      'placeholder:text-white/40',
      '[&>span]:line-clamp-1',
      
      // Focus state
      'focus:outline-none',
      'focus:border-[#0A84FF]',
      'focus:shadow-[0_0_20px_-4px_rgba(10,132,255,0.4)]',
      
      // Hover
      'hover:border-white/[0.12]',
      
      // Disabled
      'disabled:cursor-not-allowed disabled:opacity-40',
      
      // Transition
      'transition-all duration-200',
      
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-5 w-5 text-white/50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-2',
      'text-white/50 hover:text-white/80',
      className,
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-2',
      'text-white/50 hover:text-white/80',
      className,
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        // Base
        'relative z-[10002] max-h-96 min-w-[8rem] overflow-hidden',
        
        // Glassmorphism Obsidian
        'bg-[rgba(15,15,20,0.95)] backdrop-blur-2xl',
        'border border-white/[0.1]',
        'rounded-xl',
        
        // Shadow
        'shadow-[0_16px_48px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)]',
        
        // Animations
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-2',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'py-2 px-3 text-xs font-semibold text-white/50 uppercase tracking-wider',
      className,
    )}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      // Base
      'relative flex w-full cursor-pointer select-none items-center',
      'rounded-lg py-2.5 pl-10 pr-3',
      'text-sm font-medium text-white/80',
      'apple-font-smoothing',
      'outline-none',
      
      // Focus/Hover
      'focus:bg-white/[0.08] focus:text-white',
      'hover:bg-white/[0.05]',
      
      // Selected
      'data-[state=checked]:bg-[#0A84FF]/15 data-[state=checked]:text-[#0A84FF]',
      
      // Disabled
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      
      // Transition
      'transition-colors duration-150',
      
      className,
    )}
    {...props}
  >
    <span className="absolute left-3 flex h-5 w-5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-white/[0.08]', className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
