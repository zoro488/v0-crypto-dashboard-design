'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
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
  ChevronLeft,
  Command,
} from 'lucide-react'
import { cn } from '@/app/_lib/utils'

interface SidebarProps {
  onCommandOpen?: () => void
}

const NAVIGATION = [
  { 
    section: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
      { href: '/clientes', label: 'Clientes', icon: Users },
    ]
  },
  {
    section: 'Operaciones',
    items: [
      { href: '/distribuidores', label: 'Distribuidores', icon: Truck },
      { href: '/ordenes', label: 'Órdenes', icon: FileText },
      { href: '/movimientos', label: 'Movimientos', icon: Package },
    ]
  },
  {
    section: 'Finanzas',
    items: [
      { href: '/bancos', label: 'Bancos', icon: Building2 },
      { href: '/reportes', label: 'Reportes', icon: BarChart3 },
    ]
  },
  {
    section: 'Sistema',
    items: [
      { href: '/ia', label: 'Asistente IA', icon: Sparkles },
      { href: '/configuracion', label: 'Configuración', icon: Settings },
    ]
  },
]

export function Sidebar({ onCommandOpen }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <aside 
      className={cn(
        "h-screen flex flex-col",
        "bg-zinc-950 border-r border-white/5",
        "transition-all duration-300 ease-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn(
        "h-16 flex items-center px-4",
        "border-b border-white/5",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-white">CHRONOS</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-2 rounded-lg",
            "text-zinc-400 hover:text-white hover:bg-white/5",
            "transition-colors"
          )}
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform",
            collapsed && "rotate-180"
          )} />
        </button>
      </div>

      {/* Command Trigger */}
      <div className="p-3">
        <button
          onClick={onCommandOpen}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-white/5 hover:bg-white/10",
            "text-zinc-400 hover:text-white",
            "border border-white/5",
            "transition-colors",
            collapsed ? "justify-center" : ""
          )}
        >
          <Command className="h-4 w-4" />
          {!collapsed && (
            <>
              <span className="text-sm flex-1 text-left">Buscar...</span>
              <kbd className="text-xs px-1.5 py-0.5 bg-zinc-800 rounded">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAVIGATION.map((section) => (
          <div key={section.section} className="mb-4">
            {!collapsed && (
              <p className="px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                {section.section}
              </p>
            )}
            <div className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                      "transition-all duration-150",
                      isActive 
                        ? "bg-white/10 text-white" 
                        : "text-zinc-400 hover:text-white hover:bg-white/5",
                      collapsed && "justify-center"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 shrink-0",
                      isActive && "text-violet-400"
                    )} />
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn(
        "p-4 border-t border-white/5",
        collapsed && "flex justify-center"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <span className="text-white text-xs font-medium">A</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-zinc-500 truncate">admin@chronos.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
