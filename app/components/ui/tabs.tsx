'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/app/lib/utils'

/**
 * 🎨 TABS OBSIDIAN - Sistema Premium
 * 
 * Tabs con estilo Obsidian Glass:
 * - Glassmorphism background
 * - Glow en tab activo
 * - Animaciones fluidas
 */

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Base - contenedor flexible
        'inline-flex items-center justify-start',
        // Altura y padding
        'h-auto min-h-[44px] p-1.5',
        // Glassmorphism Obsidian
        'bg-[rgba(10,10,15,0.6)] backdrop-blur-2xl',
        'border border-white/[0.08]',
        'rounded-2xl',
        // Shadow
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
        // Scroll horizontal en móvil
        'overflow-x-auto overflow-y-hidden scrollbar-hide',
        // Gap entre tabs
        'gap-1',
        // Asegurar que no se rompa el layout
        'flex-nowrap',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base - inline flex centrado
        'inline-flex items-center justify-center gap-2',
        // Tamaño mínimo para touch (Apple 44px)
        'min-h-[36px] px-4 py-2',
        // Tipografía
        'text-sm font-semibold whitespace-nowrap',
        'apple-font-smoothing',
        // Bordes y redondeo
        'rounded-xl',
        // Colores base
        'text-white/50',
        // Estado activo - Obsidian Glass
        'data-[state=active]:bg-white/[0.1]',
        'data-[state=active]:text-white',
        'data-[state=active]:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4),0_0_12px_-4px_rgba(10,132,255,0.2)]',
        'data-[state=active]:border data-[state=active]:border-white/[0.1]',
        // Hover
        'hover:text-white/80 hover:bg-white/[0.05]',
        // Focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50',
        // Transición
        'transition-all duration-200',
        // Disabled
        'disabled:pointer-events-none disabled:opacity-40',
        // Íconos
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        'flex-1 outline-none',
        // Animación de entrada
        'data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2',
        'duration-200',
        className,
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
