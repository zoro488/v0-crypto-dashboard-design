'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — COMMAND MENU PORTAL
// Command menu con morphing 3D y búsqueda inteligente
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Fuse from 'fuse.js'

interface CommandItem {
  id: string
  icon: string
  label: string
  description?: string
  shortcut?: string[]
  category: 'navigation' | 'action' | 'banco' | 'quick'
  action: () => void
}

interface CommandMenuProps {
  onClose: () => void
}

export function CommandMenu({ onClose }: CommandMenuProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  
  // Definir comandos
  const commands: CommandItem[] = useMemo(() => [
    // Navegación
    {
      id: 'nav-dashboard',
      icon: '🏠',
      label: 'Dashboard',
      description: 'Vista principal con orbes 3D',
      category: 'navigation',
      action: () => router.push('/dashboard'),
    },
    {
      id: 'nav-ventas',
      icon: '💰',
      label: 'Ventas',
      description: 'Gestionar ventas y pagos',
      category: 'navigation',
      action: () => router.push('/ventas'),
    },
    {
      id: 'nav-clientes',
      icon: '👥',
      label: 'Clientes',
      description: 'Administrar clientes',
      category: 'navigation',
      action: () => router.push('/clientes'),
    },
    {
      id: 'nav-distribuidores',
      icon: '📦',
      label: 'Distribuidores',
      description: 'Gestionar distribuidores',
      category: 'navigation',
      action: () => router.push('/distribuidores'),
    },
    {
      id: 'nav-bancos',
      icon: '🏦',
      label: 'Bancos',
      description: 'Ver todos los bancos',
      category: 'navigation',
      action: () => router.push('/bancos'),
    },
    {
      id: 'nav-ordenes',
      icon: '📋',
      label: 'Órdenes de Compra',
      description: 'Gestionar órdenes',
      category: 'navigation',
      action: () => router.push('/ordenes'),
    },
    {
      id: 'nav-almacen',
      icon: '📦',
      label: 'Almacén',
      description: 'Inventario y stock',
      category: 'navigation',
      action: () => router.push('/almacen'),
    },
    {
      id: 'nav-reportes',
      icon: '📊',
      label: 'Reportes',
      description: 'Análisis y estadísticas',
      category: 'navigation',
      action: () => router.push('/reportes'),
    },
    
    // Acciones rápidas
    {
      id: 'action-nueva-venta',
      icon: '➕',
      label: 'Nueva Venta',
      description: 'Registrar venta rápidamente',
      shortcut: ['⌘', 'N'],
      category: 'action',
      action: () => console.log('Nueva venta'),
    },
    {
      id: 'action-nuevo-cliente',
      icon: '👤',
      label: 'Nuevo Cliente',
      description: 'Agregar cliente',
      category: 'action',
      action: () => console.log('Nuevo cliente'),
    },
    {
      id: 'action-transferencia',
      icon: '🔄',
      label: 'Transferencia',
      description: 'Mover dinero entre bancos',
      category: 'action',
      action: () => console.log('Transferencia'),
    },
    {
      id: 'action-buscar',
      icon: '🔍',
      label: 'Búsqueda Global',
      description: 'Buscar en todo el sistema',
      shortcut: ['⌘', 'F'],
      category: 'action',
      action: () => console.log('Búsqueda'),
    },
    
    // Bancos directos
    {
      id: 'banco-boveda-monte',
      icon: '🏔️',
      label: 'Bóveda Monte',
      description: 'Ver detalles del banco',
      category: 'banco',
      action: () => router.push('/bancos/boveda_monte'),
    },
    {
      id: 'banco-boveda-usa',
      icon: '🇺🇸',
      label: 'Bóveda USA',
      description: 'Ver detalles del banco',
      category: 'banco',
      action: () => router.push('/bancos/boveda_usa'),
    },
    {
      id: 'banco-utilidades',
      icon: '💎',
      label: 'Utilidades',
      description: 'Ver ganancias',
      category: 'banco',
      action: () => router.push('/bancos/utilidades'),
    },
    {
      id: 'banco-fletes',
      icon: '🚚',
      label: 'Fletes',
      description: 'Ver gastos de transporte',
      category: 'banco',
      action: () => router.push('/bancos/flete_sur'),
    },
  ], [router])
  
  // Búsqueda con Fuse.js
  const fuse = useMemo(() => {
    return new Fuse(commands, {
      keys: ['label', 'description', 'category'],
      threshold: 0.3,
    })
  }, [commands])
  
  const filteredCommands = useMemo(() => {
    if (!search) return commands
    return fuse.search(search).map(result => result.item)
  }, [search, fuse, commands])
  
  // Agrupar por categoría
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = []
      }
      groups[cmd.category].push(cmd)
    })
    return groups
  }, [filteredCommands])
  
  const categoryLabels: Record<string, string> = {
    navigation: 'Navegación',
    action: 'Acciones',
    banco: 'Bancos',
    quick: 'Acceso Rápido',
  }
  
  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          onClose()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredCommands, selectedIndex, onClose])
  
  // Focus automático
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  
  // Reset selection cuando cambia la búsqueda
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: -20 }}
        transition={{
          type: 'spring',
          stiffness: 800,
          damping: 40,
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl"
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
      >
        {/* Portal con efecto 3D */}
        <div
          className="glass-panel rounded-3xl overflow-hidden border border-violet-500/30 shadow-2xl"
          style={{
            transform: 'translateZ(50px)',
          }}
        >
          {/* Header con búsqueda */}
          <div className="p-6 border-b border-white/5">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">
                🔍
              </div>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar comandos..."
                className="w-full bg-white/5 border-2 border-violet-500/20 rounded-2xl pl-14 pr-6 py-4 text-white placeholder-gray-400 focus:border-violet-500/50 focus:outline-none transition-colors"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-gray-400">
                <kbd className="px-2 py-1 bg-white/5 rounded border border-white/10">ESC</kbd>
              </div>
            </div>
          </div>
          
          {/* Comandos */}
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-4">
            {Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 px-4">
                  {categoryLabels[category] || category}
                </h3>
                
                <div className="space-y-1">
                  {items.map((cmd, index) => {
                    const globalIndex = filteredCommands.indexOf(cmd)
                    const isSelected = globalIndex === selectedIndex
                    
                    return (
                      <motion.button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action()
                          onClose()
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          w-full flex items-center gap-4 px-4 py-3 rounded-xl
                          transition-all duration-200
                          ${isSelected 
                            ? 'bg-violet-500/20 border-2 border-violet-500/50' 
                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                          }
                        `}
                      >
                        <span className="text-2xl">{cmd.icon}</span>
                        
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">
                              {cmd.label}
                            </span>
                            {cmd.shortcut && (
                              <div className="flex items-center gap-1">
                                {cmd.shortcut.map((key, i) => (
                                  <kbd
                                    key={i}
                                    className="px-1.5 py-0.5 text-xs bg-white/5 rounded border border-white/10 text-gray-400"
                                  >
                                    {key}
                                  </kbd>
                                ))}
                              </div>
                            )}
                          </div>
                          {cmd.description && (
                            <p className="text-xs text-gray-400 truncate">
                              {cmd.description}
                            </p>
                          )}
                        </div>
                        
                        {isSelected && (
                          <motion.div
                            layoutId="selected-indicator"
                            className="w-2 h-2 rounded-full bg-violet-500"
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            ))}
            
            {filteredCommands.length === 0 && (
              <div className="py-12 text-center">
                <span className="text-4xl mb-4 block">🔍</span>
                <p className="text-gray-400">No se encontraron comandos</p>
                <p className="text-sm text-gray-500 mt-2">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            )}
          </div>
          
          {/* Footer con atajos */}
          <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↑↓</kbd>
                Navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↵</kbd>
                Seleccionar
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">ESC</kbd>
              Cerrar
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
