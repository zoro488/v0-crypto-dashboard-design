'use client'

import * as React from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Home, 
  ShoppingCart, 
  Users, 
  Truck, 
  Package, 
  FileText,
  Building2,
  BarChart3,
  Settings,
  Wallet,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/app/_lib/utils'

interface CommandMenuProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const NAVIGATION_ITEMS = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: Home, 
    href: '/dashboard',
    keywords: ['inicio', 'home', 'panel', 'principal']
  },
  { 
    id: 'ventas', 
    label: 'Ventas', 
    icon: ShoppingCart, 
    href: '/ventas',
    keywords: ['vender', 'factura', 'cobrar', 'venta']
  },
  { 
    id: 'clientes', 
    label: 'Clientes', 
    icon: Users, 
    href: '/clientes',
    keywords: ['cliente', 'comprador', 'customer']
  },
  { 
    id: 'distribuidores', 
    label: 'Distribuidores', 
    icon: Truck, 
    href: '/distribuidores',
    keywords: ['proveedor', 'supplier', 'distribuidor']
  },
  { 
    id: 'almacen', 
    label: 'Almacén', 
    icon: Package, 
    href: '/almacen',
    keywords: ['inventario', 'stock', 'bodega', 'productos']
  },
  { 
    id: 'ordenes', 
    label: 'Órdenes de Compra', 
    icon: FileText, 
    href: '/ordenes',
    keywords: ['orden', 'compra', 'pedido', 'purchase']
  },
  { 
    id: 'bancos', 
    label: 'Bancos / Bóvedas', 
    icon: Building2, 
    href: '/bancos',
    keywords: ['banco', 'boveda', 'capital', 'dinero', 'finanzas']
  },
  { 
    id: 'reportes', 
    label: 'Reportes', 
    icon: BarChart3, 
    href: '/reportes',
    keywords: ['reporte', 'informe', 'analytics', 'estadisticas']
  },
  { 
    id: 'gastos', 
    label: 'Gastos y Admin', 
    icon: Wallet, 
    href: '/gastos',
    keywords: ['gasto', 'egreso', 'administracion', 'gya']
  },
  { 
    id: 'ia', 
    label: 'Asistente IA', 
    icon: Sparkles, 
    href: '/ia',
    keywords: ['ia', 'ai', 'asistente', 'chat', 'ayuda']
  },
  { 
    id: 'config', 
    label: 'Configuración', 
    icon: Settings, 
    href: '/configuracion',
    keywords: ['config', 'ajustes', 'settings', 'preferencias']
  },
]

const QUICK_ACTIONS = [
  { id: 'new-venta', label: 'Nueva Venta', keywords: ['crear venta', 'agregar venta'] },
  { id: 'new-cliente', label: 'Nuevo Cliente', keywords: ['crear cliente', 'agregar cliente'] },
  { id: 'new-orden', label: 'Nueva Orden', keywords: ['crear orden', 'agregar orden'] },
  { id: 'transfer', label: 'Transferencia entre Bancos', keywords: ['transferir', 'mover dinero'] },
]

export function CommandMenu({ open: controlledOpen, onOpenChange }: CommandMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const router = useRouter()

  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  // Keyboard shortcut: Cmd+K or Ctrl+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, setOpen])

  const handleSelect = React.useCallback((href: string) => {
    setOpen(false)
    setSearch('')
    router.push(href)
  }, [router, setOpen])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setOpen(false)}
      />
      
      {/* Command Dialog */}
      <div className="fixed left-1/2 top-1/4 -translate-x-1/2 w-full max-w-xl">
        <Command
          className={cn(
            "rounded-2xl border border-white/10",
            "bg-zinc-900/95 backdrop-blur-xl",
            "shadow-2xl shadow-black/50",
            "overflow-hidden",
            "animate-in slide-in-from-top-4 fade-in duration-200"
          )}
          loop
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-white/10 px-4">
            <Search className="h-5 w-5 text-zinc-400 shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Buscar o escribe un comando..."
              className={cn(
                "flex-1 h-14 px-3",
                "bg-transparent text-white placeholder:text-zinc-500",
                "focus:outline-none",
                "text-base"
              )}
            />
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          {/* Command List */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-zinc-500">
              No se encontraron resultados.
            </Command.Empty>

            {/* Navigation */}
            <Command.Group heading="Navegación" className="px-2">
              <p className="text-xs font-medium text-zinc-500 px-2 py-1.5">
                Navegación
              </p>
              {NAVIGATION_ITEMS.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`${item.label} ${item.keywords.join(' ')}`}
                  onSelect={() => handleSelect(item.href)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                    "text-zinc-300 hover:text-white",
                    "hover:bg-white/5",
                    "aria-selected:bg-white/10 aria-selected:text-white",
                    "transition-colors duration-150"
                  )}
                >
                  <item.icon className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm">{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Quick Actions */}
            <Command.Group heading="Acciones Rápidas" className="px-2 mt-2">
              <p className="text-xs font-medium text-zinc-500 px-2 py-1.5">
                Acciones Rápidas
              </p>
              {QUICK_ACTIONS.map((action) => (
                <Command.Item
                  key={action.id}
                  value={`${action.label} ${action.keywords.join(' ')}`}
                  onSelect={() => {
                    setOpen(false)
                    // TODO: Open modal for action
                    console.log('Action:', action.id)
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                    "text-zinc-300 hover:text-white",
                    "hover:bg-white/5",
                    "aria-selected:bg-white/10 aria-selected:text-white",
                    "transition-colors duration-150"
                  )}
                >
                  <span className="text-sm">+ {action.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">↵</kbd>
                seleccionar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">esc</kbd>
                cerrar
              </span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  )
}

export default CommandMenu
