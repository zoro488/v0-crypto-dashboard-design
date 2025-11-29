'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface HybridComboboxOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface HybridComboboxProps {
  /** Lista de opciones disponibles */
  options: HybridComboboxOption[]
  /** Valor seleccionado actualmente */
  value?: string
  /** Callback cuando se selecciona una opción */
  onValueChange?: (value: string) => void
  /** Placeholder cuando no hay selección */
  placeholder?: string
  /** Placeholder del campo de búsqueda */
  searchPlaceholder?: string
  /** Mensaje cuando no hay resultados */
  emptyMessage?: string
  /** Clases CSS adicionales para el trigger */
  className?: string
  /** Si el combobox está deshabilitado */
  disabled?: boolean
  /** Título del grupo de opciones */
  groupTitle?: string
  /** Permitir limpiar la selección */
  allowClear?: boolean
  /** Nombre del campo (para accesibilidad) */
  name?: string
  /** Ancho del popover */
  popoverWidth?: string
}

/**
 * HybridCombobox - Componente Combobox con búsqueda y filtrado
 * 
 * Características:
 * - Búsqueda en tiempo real
 * - Navegación con teclado (↑↓ para navegar, Enter para seleccionar, Escape para cerrar)
 * - Dark theme styling
 * - Soporte para opciones deshabilitadas
 * - Accesibilidad completa
 */
function HybridCombobox({
  options,
  value,
  onValueChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados.',
  className,
  disabled = false,
  groupTitle,
  allowClear = false,
  name,
  popoverWidth = 'w-[300px]',
}: HybridComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      if (allowClear && selectedValue === value) {
        onValueChange?.('')
      } else {
        onValueChange?.(selectedValue)
      }
      setOpen(false)
      setSearchQuery('')
    },
    [allowClear, value, onValueChange]
  )

  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={name || placeholder}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            'justify-between font-normal',
            'bg-background/50 border-border/50',
            'hover:bg-accent/50 hover:border-accent',
            'dark:bg-zinc-900/50 dark:border-zinc-700/50',
            'dark:hover:bg-zinc-800/50 dark:hover:border-zinc-600',
            'focus:ring-2 focus:ring-primary/20',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'p-0',
          'bg-popover/95 backdrop-blur-sm',
          'dark:bg-zinc-900/95 dark:border-zinc-700',
          'shadow-lg',
          popoverWidth
        )}
        align="start"
      >
        <Command
          className="dark:bg-transparent"
          filter={(value, search) => {
            const option = options.find((o) => o.value === value)
            if (!option) return 0
            const searchLower = search.toLowerCase()
            const labelMatch = option.label.toLowerCase().includes(searchLower)
            const descMatch = option.description?.toLowerCase().includes(searchLower)
            return labelMatch || descMatch ? 1 : 0
          }}
        >
          <div className="flex items-center border-b border-border/50 dark:border-zinc-700/50 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-0 focus:ring-0 dark:bg-transparent"
            />
          </div>
          <CommandList className="max-h-[200px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup heading={groupTitle}>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                  disabled={option.disabled}
                  className={cn(
                    'cursor-pointer',
                    'dark:hover:bg-zinc-800/50',
                    'dark:data-[selected=true]:bg-zinc-800',
                    option.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground dark:text-zinc-500">
                        {option.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { HybridCombobox }
