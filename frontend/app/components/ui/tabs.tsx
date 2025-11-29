'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/frontend/app/lib/utils'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
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
        'h-auto min-h-[40px] p-1',
        // Fondo y bordes
        'bg-muted text-muted-foreground rounded-xl',
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
        'inline-flex items-center justify-center gap-1.5',
        // Tamaño mínimo para touch
        'min-h-[32px] px-3 py-1.5',
        // Tipografía
        'text-sm font-medium whitespace-nowrap',
        // Bordes y redondeo
        'rounded-lg border border-transparent',
        // Colores base
        'text-foreground/70 dark:text-muted-foreground',
        // Estado activo
        'data-[state=active]:bg-background data-[state=active]:text-foreground',
        'data-[state=active]:shadow-sm data-[state=active]:border-white/10',
        'dark:data-[state=active]:bg-white/10',
        // Hover
        'hover:text-foreground hover:bg-white/5',
        // Focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        // Transición
        'transition-all duration-200',
        // Disabled
        'disabled:pointer-events-none disabled:opacity-50',
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
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
