'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Command } from 'cmdk'
import { 
  Search, 
  Plus, 
  FileText, 
  DollarSign, 
  CreditCard, 
  Package,
  Users,
  Building2,
  LayoutDashboard,
  Warehouse,
  Settings,
  BarChart3,
  Sparkles,
  Keyboard,
  ArrowRight,
  User,
  Box,
  Truck,
  CircleDot,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import '@/app/styles/chronos-obsidian-os.css'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEURAL NEXUS - Global Command Palette
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Command Palette que controla TODA la aplicación:
 * - Acciones rápidas con atajos de teclado
 * - Navegación global
 * - Búsqueda en tiempo real (Clientes, Productos, Distribuidores)
 * - Modo AI cuando se escribe "?"
 */

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  shortcut?: string[]
  action: () => void
  category: 'action' | 'navigation' | 'search' | 'ai'
}

interface SearchResult {
  id: string
  type: 'cliente' | 'producto' | 'distribuidor'
  name: string
  subtitle?: string
  icon: React.ReactNode
}

// Datos de búsqueda simulados
const mockClientes = [
  { id: '1', name: 'Carlos López', subtitle: 'carlos@empresa.com' },
  { id: '2', name: 'María García', subtitle: 'maria@negocio.mx' },
  { id: '3', name: 'Juan Martínez', subtitle: 'juan@distribuidora.com' },
]

const mockProductos = [
  { id: '1', name: 'Producto Premium A', subtitle: 'SKU: PRD-001' },
  { id: '2', name: 'Producto Estándar B', subtitle: 'SKU: PRD-002' },
  { id: '3', name: 'Producto Básico C', subtitle: 'SKU: PRD-003' },
]

const mockDistribuidores = [
  { id: '1', name: 'Distribuidora Norte', subtitle: 'Monterrey, NL' },
  { id: '2', name: 'Logística Sur', subtitle: 'Guadalajara, JAL' },
  { id: '3', name: 'Express Centro', subtitle: 'CDMX' },
]

interface GlobalCommandMenuProps {
  isOpen: boolean
  onClose: () => void
  onActionSelect?: (action: string) => void
}

export function GlobalCommandMenu({ isOpen, onClose, onActionSelect }: GlobalCommandMenuProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [isAIMode, setIsAIMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Detectar modo AI
  useEffect(() => {
    if (search.startsWith('?')) {
      setIsAIMode(true)
    } else {
      setIsAIMode(false)
    }
  }, [search])
  
  // Focus input cuando se abre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])
  
  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setIsAIMode(false)
    }
  }, [isOpen])
  
  // Acciones rápidas
  const quickActions: CommandItem[] = useMemo(() => [
    {
      id: 'new-sale',
      label: 'Nueva Venta',
      description: 'Registrar una nueva venta',
      icon: <Plus className="w-4 h-4" />,
      shortcut: ['⌘', 'N'],
      action: () => { onActionSelect?.('new-sale'); onClose() },
      category: 'action',
    },
    {
      id: 'new-order',
      label: 'Crear Orden de Compra',
      description: 'Nueva OC para proveedores',
      icon: <FileText className="w-4 h-4" />,
      shortcut: ['⌘', 'O'],
      action: () => { onActionSelect?.('new-order'); onClose() },
      category: 'action',
    },
    {
      id: 'new-expense',
      label: 'Registrar Gasto',
      description: 'Agregar un gasto al sistema',
      icon: <CreditCard className="w-4 h-4" />,
      shortcut: ['⌘', 'G'],
      action: () => { onActionSelect?.('new-expense'); onClose() },
      category: 'action',
    },
    {
      id: 'new-transfer',
      label: 'Transferencia entre Bancos',
      description: 'Mover fondos entre bóvedas',
      icon: <DollarSign className="w-4 h-4" />,
      shortcut: ['⌘', 'T'],
      action: () => { onActionSelect?.('new-transfer'); onClose() },
      category: 'action',
    },
  ], [onActionSelect, onClose])
  
  // Navegación
  const navigation: CommandItem[] = useMemo(() => [
    {
      id: 'nav-dashboard',
      label: 'Ir a Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      action: () => { router.push('/'); onClose() },
      category: 'navigation',
    },
    {
      id: 'nav-banks',
      label: 'Ir a Bancos',
      icon: <Building2 className="w-4 h-4" />,
      action: () => { router.push('/bancos'); onClose() },
      category: 'navigation',
    },
    {
      id: 'nav-sales',
      label: 'Ir a Ventas',
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => { router.push('/ventas'); onClose() },
      category: 'navigation',
    },
    {
      id: 'nav-warehouse',
      label: 'Ir a Almacén',
      icon: <Warehouse className="w-4 h-4" />,
      action: () => { router.push('/almacen'); onClose() },
      category: 'navigation',
    },
    {
      id: 'nav-clients',
      label: 'Ir a Clientes',
      icon: <Users className="w-4 h-4" />,
      action: () => { router.push('/clientes'); onClose() },
      category: 'navigation',
    },
    {
      id: 'nav-settings',
      label: 'Ir a Configuración',
      icon: <Settings className="w-4 h-4" />,
      action: () => { router.push('/settings'); onClose() },
      category: 'navigation',
    },
  ], [router, onClose])
  
  // Búsqueda en tiempo real
  const searchResults = useMemo((): SearchResult[] => {
    if (!search || search.startsWith('?')) return []
    
    const query = search.toLowerCase()
    const results: SearchResult[] = []
    
    // Buscar clientes
    mockClientes
      .filter(c => c.name.toLowerCase().includes(query))
      .forEach(c => results.push({
        id: `cliente-${c.id}`,
        type: 'cliente',
        name: c.name,
        subtitle: c.subtitle,
        icon: <User className="w-4 h-4" />,
      }))
    
    // Buscar productos
    mockProductos
      .filter(p => p.name.toLowerCase().includes(query))
      .forEach(p => results.push({
        id: `producto-${p.id}`,
        type: 'producto',
        name: p.name,
        subtitle: p.subtitle,
        icon: <Box className="w-4 h-4" />,
      }))
    
    // Buscar distribuidores
    mockDistribuidores
      .filter(d => d.name.toLowerCase().includes(query))
      .forEach(d => results.push({
        id: `distribuidor-${d.id}`,
        type: 'distribuidor',
        name: d.name,
        subtitle: d.subtitle,
        icon: <Truck className="w-4 h-4" />,
      }))
    
    return results.slice(0, 8)
  }, [search])
  
  const handleSelect = useCallback((item: CommandItem | SearchResult) => {
    if ('action' in item) {
      item.action()
    } else {
      // Navegar al detalle del resultado
      router.push(`/${item.type}s/${item.id}`)
      onClose()
    }
  }, [router, onClose])
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop con blur del contenido */}
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            {/* Fondo oscuro con blur */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
              }}
            />
          </motion.div>
          
          {/* Command Palette */}
          <motion.div
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <Command
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(40px)',
                boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              }}
              shouldFilter={false}
            >
              {/* Input */}
              <div 
                className="flex items-center gap-3 px-5 py-4 border-b"
                style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <motion.div
                  animate={{
                    color: isAIMode ? '#f59e0b' : 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  {isAIMode ? (
                    <Sparkles className="w-5 h-5" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </motion.div>
                
                <Command.Input
                  ref={inputRef}
                  value={search}
                  onValueChange={setSearch}
                  placeholder={isAIMode ? 'Pregunta a Chronos AI...' : 'Buscar acciones, páginas, datos...'}
                  className="flex-1 bg-transparent outline-none text-white placeholder-white/30"
                  style={{
                    fontSize: '18px',
                    caretColor: isAIMode ? '#f59e0b' : '#06b6d4',
                  }}
                />
                
                <kbd 
                  className="hidden sm:flex items-center gap-1 px-2 py-1 rounded text-[11px] text-white/30"
                  style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  ESC
                </kbd>
              </div>
              
              {/* List */}
              <Command.List 
                className="max-h-[400px] overflow-y-auto p-2 scrollbar-obsidian"
              >
                <Command.Empty className="py-8 text-center text-white/40">
                  {isAIMode ? (
                    <div className="space-y-2">
                      <Sparkles className="w-8 h-8 mx-auto text-amber-400/40" />
                      <p>Escribe tu pregunta para Chronos AI</p>
                    </div>
                  ) : (
                    <p>No se encontraron resultados</p>
                  )}
                </Command.Empty>
                
                {/* AI Mode hint */}
                {!isAIMode && !search && (
                  <div className="px-3 py-2 mb-2">
                    <p className="text-xs text-white/30 flex items-center gap-2">
                      <span className="text-amber-400">?</span>
                      Escribe <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-amber-400">?</kbd> para preguntar a Chronos AI
                    </p>
                  </div>
                )}
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <Command.Group heading="Resultados de búsqueda">
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                      Resultados de búsqueda
                    </div>
                    {searchResults.map((result) => (
                      <Command.Item
                        key={result.id}
                        value={result.id}
                        onSelect={() => handleSelect(result)}
                        className="relative flex items-center gap-3 px-3 py-3 mx-1 rounded-xl cursor-pointer group"
                        style={{ height: '48px' }}
                      >
                        {/* Highlight gradient */}
                        <motion.div
                          className="absolute inset-0 rounded-xl opacity-0 group-data-[selected=true]:opacity-100"
                          style={{
                            background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, transparent 100%)',
                          }}
                          layoutId="command-highlight"
                        />
                        
                        {/* Left accent */}
                        <motion.div
                          className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full opacity-0 group-data-[selected=true]:opacity-100"
                          style={{
                            background: result.type === 'cliente' ? '#10b981' 
                              : result.type === 'producto' ? '#3b82f6' 
                              : '#8b5cf6',
                          }}
                        />
                        
                        <div 
                          className="relative z-10 p-2 rounded-lg"
                          style={{
                            background: result.type === 'cliente' ? 'rgba(16, 185, 129, 0.1)' 
                              : result.type === 'producto' ? 'rgba(59, 130, 246, 0.1)' 
                              : 'rgba(139, 92, 246, 0.1)',
                            color: result.type === 'cliente' ? '#10b981' 
                              : result.type === 'producto' ? '#3b82f6' 
                              : '#8b5cf6',
                          }}
                        >
                          {result.icon}
                        </div>
                        
                        <div className="relative z-10 flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{result.name}</p>
                          {result.subtitle && (
                            <p className="text-white/40 text-sm truncate">{result.subtitle}</p>
                          )}
                        </div>
                        
                        <span className="relative z-10 text-[10px] uppercase tracking-wider text-white/30 px-2 py-1 rounded bg-white/5">
                          {result.type}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
                
                {/* Quick Actions */}
                {!isAIMode && !search && (
                  <Command.Group>
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                      Acciones rápidas
                    </div>
                    {quickActions.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item)}
                        className="relative flex items-center gap-3 px-3 py-3 mx-1 rounded-xl cursor-pointer group"
                        style={{ height: '48px' }}
                      >
                        <motion.div
                          className="absolute inset-0 rounded-xl opacity-0 group-data-[selected=true]:opacity-100"
                          style={{
                            background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, transparent 100%)',
                          }}
                        />
                        
                        <motion.div
                          className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-cyan-400 opacity-0 group-data-[selected=true]:opacity-100"
                        />
                        
                        <div 
                          className="relative z-10 p-2 rounded-lg"
                          style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}
                        >
                          {item.icon}
                        </div>
                        
                        <div className="relative z-10 flex-1">
                          <p className="text-white font-medium">{item.label}</p>
                          {item.description && (
                            <p className="text-white/40 text-sm">{item.description}</p>
                          )}
                        </div>
                        
                        {item.shortcut && (
                          <div className="relative z-10 flex items-center gap-1">
                            {item.shortcut.map((key, i) => (
                              <kbd
                                key={i}
                                className="px-1.5 py-0.5 rounded text-[11px] text-white/40"
                                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
                
                {/* Navigation */}
                {!isAIMode && !search && (
                  <Command.Group>
                    <div className="px-2 py-1.5 mt-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                      Navegación
                    </div>
                    {navigation.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item)}
                        className="relative flex items-center gap-3 px-3 py-3 mx-1 rounded-xl cursor-pointer group"
                        style={{ height: '48px' }}
                      >
                        <motion.div
                          className="absolute inset-0 rounded-xl opacity-0 group-data-[selected=true]:opacity-100"
                          style={{
                            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%)',
                          }}
                        />
                        
                        <motion.div
                          className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-violet-400 opacity-0 group-data-[selected=true]:opacity-100"
                        />
                        
                        <div 
                          className="relative z-10 p-2 rounded-lg text-white/60"
                          style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                        >
                          {item.icon}
                        </div>
                        
                        <span className="relative z-10 text-white font-medium flex-1">
                          {item.label}
                        </span>
                        
                        <ArrowRight className="relative z-10 w-4 h-4 text-white/20 opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>
              
              {/* Footer */}
              <div 
                className="flex items-center justify-between px-4 py-3 border-t"
                style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="flex items-center gap-4 text-[11px] text-white/30">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5">↑↓</kbd>
                    navegar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5">↵</kbd>
                    seleccionar
                  </span>
                </div>
                
                <span className="text-[10px] text-white/20 uppercase tracking-wider">
                  Neural Nexus v1.0
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Hook para controlar el command menu
export function useCommandMenu() {
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return { isOpen, setIsOpen, toggle: () => setIsOpen(prev => !prev) }
}

export default GlobalCommandMenu
