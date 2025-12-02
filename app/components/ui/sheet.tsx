'use client'

/**
 * 💎 SHEET COMPONENT - Apple Vision Pro + Tesla 2025 Design
 * 
 * Panel deslizable premium con:
 * - Soporte para 4 direcciones (top, right, bottom, left)
 * - Glassmorphism ultra con backdrop-blur-2xl
 * - Scroll interno automático
 * - Animaciones fluidas spring
 * - Mobile-first: desde abajo en móvil, desde derecha en desktop
 */

import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { XIcon } from 'lucide-react'

import { cn } from '@/app/lib/utils'

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      // Overlay premium con blur
      'fixed inset-0 z-[10000]',
      'bg-black/80 backdrop-blur-sm',
      // Animaciones
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'duration-300',
      className,
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  cn(
    // Base
    'fixed z-[10001] gap-4 p-6',
    'flex flex-col',
    // Glassmorphism premium
    'bg-black/95 backdrop-blur-2xl',
    'border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_25px_50px_-12px_rgba(0,0,0,0.7)]',
    // Animaciones
    'transition-all duration-300 ease-out',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:duration-200',
  ),
  {
    variants: {
      side: {
        top: cn(
          'inset-x-0 top-0',
          'border-b rounded-b-3xl',
          'max-h-[90vh]',
          'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        ),
        bottom: cn(
          'inset-x-0 bottom-0',
          'border-t rounded-t-3xl',
          'max-h-[90vh]',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        ),
        left: cn(
          'inset-y-0 left-0 h-full w-3/4 sm:max-w-sm',
          'border-r rounded-r-3xl',
          'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        ),
        right: cn(
          'inset-y-0 right-0 h-full w-3/4 sm:max-w-md lg:max-w-lg',
          'border-l rounded-l-3xl',
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        ),
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  showCloseButton?: boolean
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, showCloseButton = true, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {/* Handle indicator para bottom sheet (mobile UX) */}
      {side === 'bottom' && (
        <div className="flex justify-center mb-2">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>
      )}
      
      {children}
      
      {showCloseButton && (
        <SheetPrimitive.Close
          className={cn(
            'absolute top-4 right-4 z-10',
            'w-10 h-10 rounded-full',
            'flex items-center justify-center',
            'bg-white/5 hover:bg-white/10',
            'text-white/60 hover:text-white',
            'border border-white/5 hover:border-white/10',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-white/20',
            'disabled:pointer-events-none',
          )}
        >
          <XIcon className="h-5 w-5" />
          <span className="sr-only">Cerrar</span>
        </SheetPrimitive.Close>
      )}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-2 text-center sm:text-left',
      className,
    )}
    {...props}
  />
)
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      'mt-auto pt-4 border-t border-white/10',
      className,
    )}
    {...props}
  />
)
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('text-xl font-bold text-white', className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-sm text-white/60', className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
