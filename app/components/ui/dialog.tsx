'use client'

/**
 * 💎 DIALOG COMPONENT - Apple Vision Pro + Tesla 2025 Design
 * 
 * Modal premium con:
 * - Centrado perfecto (vertical + horizontal)
 * - Glassmorphism ultra con backdrop-blur-2xl
 * - Scroll interno automático
 * - Animaciones fluidas spring
 * - Fondo oscuro semi-transparente con blur
 * - Mobile-first responsive
 */

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/app/lib/utils'

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // Overlay premium con glassmorphism
        'fixed inset-0 z-[10000]',
        'bg-black/80 backdrop-blur-sm',
        // Animaciones fluidas
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'duration-300 ease-out',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = 'default',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full'
}) {
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    default: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    full: 'sm:max-w-[90vw]',
  }

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // ═══════════════════════════════════════════════════════════════
          // CENTRADO PERFECTO - Apple/Tesla 2025 Style
          // ═══════════════════════════════════════════════════════════════
          'fixed left-1/2 top-1/2 z-[10001]',
          '-translate-x-1/2 -translate-y-1/2',
          
          // ═══════════════════════════════════════════════════════════════
          // DIMENSIONES RESPONSIVE
          // ═══════════════════════════════════════════════════════════════
          'w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] md:w-full',
          sizeClasses[size],
          
          // ═══════════════════════════════════════════════════════════════
          // ALTURA CON SCROLL INTERNO PERFECTO
          // ═══════════════════════════════════════════════════════════════
          'max-h-[90vh]',
          'flex flex-col',
          'overflow-hidden',
          
          // ═══════════════════════════════════════════════════════════════
          // GLASSMORPHISM ULTRA PREMIUM
          // ═══════════════════════════════════════════════════════════════
          'bg-black/95 backdrop-blur-2xl',
          'rounded-3xl',
          'border border-white/10',
          'shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_100px_rgba(0,0,0,0.5)]',
          
          // ═══════════════════════════════════════════════════════════════
          // ANIMACIONES FLUIDAS (Apple spring style)
          // ═══════════════════════════════════════════════════════════════
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          'duration-300 ease-out',
          
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              // Botón de cerrar premium
              'absolute top-4 right-4 z-10',
              'w-10 h-10 rounded-full',
              'flex items-center justify-center',
              'bg-white/5 hover:bg-white/10',
              'text-white/60 hover:text-white',
              'border border-white/5 hover:border-white/10',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-white/20',
              'disabled:pointer-events-none',
              '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-5',
            )}
          >
            <XIcon />
            <span className="sr-only">Cerrar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
