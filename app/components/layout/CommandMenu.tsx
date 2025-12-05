'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🎯 CHRONOS INFINITY - COMMAND MENU PORTAL
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Command Menu inmersivo con:
 * - Portal completo (Cmd+K)
 * - Blur 80px + morphing animation
 * - Preview orbs 3D para resultados
 * - Búsqueda instantánea
 * - Navegación con teclado
 * 
 * Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef, memo, Suspense, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Canvas } from '@react-three/fiber'
import {
  Search,
  Command,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Truck,
  Package,
  Wallet,
  FileText,
  Receipt,
  Settings,
  User,
  Moon,
  Sun,
  Sparkles,
  ArrowRight,
  CornerDownLeft,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react'
import InfinityOrb from '@/app/components/3d/InfinityOrb'
import { portalVariants, breatheVariants } from '@/app/lib/motion/easings'
import { INFINITY_COLORS, INFINITY_GRADIENTS } from '@/app/lib/constants/infinity-design-system'

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════════════════

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: typeof LayoutDashboard
  href?: string
  action?: () => void
  category: 'navigation' | 'action' | 'settings'
  keywords?: string[]
}

// ════════════════════════════════════════════════════════════════════════════════════════
// COMANDOS DISPONIBLES
// ════════════════════════════════════════════════════════════════════════════════════════

const COMMANDS: CommandItem[] = [
  // Navegación
  { id: 'dashboard', label: 'Dashboard', description: 'Panel principal', icon: LayoutDashboard, href: '/dashboard', category: 'navigation', keywords: ['home', 'inicio', 'principal'] },
  { id: 'ventas', label: 'Ventas', description: 'Gestión de ventas', icon: ShoppingCart, href: '/dashboard/ventas', category: 'navigation', keywords: ['sales', 'pedidos', 'ordenes'] },
  { id: 'clientes', label: 'Clientes', description: 'Listado de clientes', icon: Users, href: '/dashboard/clientes', category: 'navigation', keywords: ['customers', 'contactos'] },
  { id: 'distribuidores', label: 'Distribuidores', description: 'Red de distribución', icon: Truck, href: '/dashboard/distribuidores', category: 'navigation', keywords: ['suppliers', 'proveedores'] },
  { id: 'almacen', label: 'Almacén', description: 'Inventario', icon: Package, href: '/dashboard/almacen', category: 'navigation', keywords: ['inventory', 'stock', 'productos'] },
  { id: 'bancos', label: 'Bancos', description: 'Gestión bancaria', icon: Wallet, href: '/dashboard/bancos', category: 'navigation', keywords: ['banks', 'cuentas', 'dinero', 'boveda'] },
  { id: 'reportes', label: 'Reportes', description: 'Análisis y estadísticas', icon: FileText, href: '/dashboard/reportes', category: 'navigation', keywords: ['reports', 'analytics', 'estadisticas'] },
  { id: 'ordenes', label: 'Órdenes de Compra', description: 'Pedidos a distribuidores', icon: Receipt, href: '/dashboard/ordenes', category: 'navigation', keywords: ['purchase', 'compras'] },
  
  // Acciones
  { id: 'new-venta', label: 'Nueva Venta', description: 'Registrar venta', icon: ShoppingCart, category: 'action', keywords: ['crear', 'add', 'registrar'] },
  { id: 'new-cliente', label: 'Nuevo Cliente', description: 'Agregar cliente', icon: Users, category: 'action', keywords: ['crear', 'add', 'registrar'] },
  
  // Configuración
  { id: 'settings', label: 'Configuración', description: 'Ajustes del sistema', icon: Settings, href: '/dashboard/settings', category: 'settings', keywords: ['config', 'ajustes', 'preferencias'] },
  { id: 'profile', label: 'Mi Perfil', description: 'Datos personales', icon: User, href: '/dashboard/profile', category: 'settings', keywords: ['cuenta', 'usuario'] },
  { id: 'theme', label: 'Cambiar Tema', description: 'Claro / Oscuro', icon: Moon, category: 'settings', keywords: ['dark', 'light', 'modo'] },
]

// ════════════════════════════════════════════════════════════════════════════════════════
// MINI ORB PREVIEW
// ════════════════════════════════════════════════════════════════════════════════════════

const OrbPreview = memo(function OrbPreview() {
  return (
    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 opacity-60 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 3] }} gl={{ alpha: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[2, 2, 2]} intensity={0.5} color="#8B00FF" />
          <InfinityOrb state="thinking" scale={0.4} />
        </Suspense>
      </Canvas>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// COMMAND ITEM
// ════════════════════════════════════════════════════════════════════════════════════════

const CommandItemRow = memo(function CommandItemRow({
  item,
  isSelected,
  onSelect,
  onExecute,
}: {
  item: CommandItem
  isSelected: boolean
  onSelect: () => void
  onExecute: () => void
}) {
  const Icon = item.icon
  
  return (
    <motion.div
      className={`
        relative flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer
        transition-colors duration-200
        ${isSelected ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'}
      `}
      onClick={onExecute}
      onMouseEnter={onSelect}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Indicador activo */}
      {isSelected && (
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
          style={{ background: INFINITY_GRADIENTS.primary }}
          layoutId="commandIndicator"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      
      {/* Icono */}
      <div 
        className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          ${isSelected ? 'bg-white/10' : 'bg-white/5'}
        `}
        style={isSelected ? { boxShadow: `0 0 15px ${INFINITY_COLORS.violetGlow}` } : {}}
      >
        <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-white/60'}`} />
      </div>
      
      {/* Texto */}
      <div className="flex-1">
        <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/80'}`}>
          {item.label}
        </p>
        {item.description && (
          <p className="text-xs text-white/40">{item.description}</p>
        )}
      </div>
      
      {/* Shortcut visual */}
      {isSelected && (
        <motion.div
          className="flex items-center gap-1 text-xs text-white/40"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <CornerDownLeft className="w-3 h-3" />
          <span>Enter</span>
        </motion.div>
      )}
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════

interface CommandMenuProps {
  isOpen: boolean
  onClose: () => void
}

function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  // Filtrar comandos
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return COMMANDS
    
    const lowerQuery = query.toLowerCase()
    return COMMANDS.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.description?.toLowerCase().includes(lowerQuery) ||
      cmd.keywords?.some(k => k.includes(lowerQuery))
    )
  }, [query])
  
  // Agrupar por categoría
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      action: [],
      settings: [],
    }
    
    filteredCommands.forEach(cmd => {
      groups[cmd.category].push(cmd)
    })
    
    return groups
  }, [filteredCommands])
  
  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])
  
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          executeCommand(filteredCommands[selectedIndex])
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, onClose])
  
  // Ejecutar comando
  const executeCommand = useCallback((item: CommandItem) => {
    if (item.href) {
      router.push(item.href)
    } else if (item.action) {
      item.action()
    }
    onClose()
  }, [router, onClose])
  
  // Contador para índice global
  let globalIndex = -1
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop con blur extremo */}
          <motion.div
            className="fixed inset-0 z-[100]"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(80px) saturate(150%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-2xl rounded-3xl overflow-hidden"
              style={{
                background: INFINITY_COLORS.glassBg,
                border: `1px solid ${INFINITY_COLORS.glassBorder}`,
                boxShadow: `
                  0 0 80px ${INFINITY_COLORS.violetGlow},
                  0 40px 80px rgba(0,0,0,0.5),
                  inset 0 1px 1px rgba(255,255,255,0.1)
                `,
              }}
              {...portalVariants}
            >
              {/* Header con input */}
              <div 
                className="flex items-center gap-4 px-6 py-4 border-b"
                style={{ borderColor: INFINITY_COLORS.glassBorder }}
              >
                <Search className="w-5 h-5 text-white/40" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSelectedIndex(0)
                  }}
                  placeholder="Buscar comandos, páginas, acciones..."
                  className="flex-1 bg-transparent text-white text-lg placeholder:text-white/30 outline-none"
                />
                <kbd className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-xs text-white/40">
                  ESC
                </kbd>
              </div>
              
              {/* Resultados */}
              <div className="max-h-[60vh] overflow-y-auto p-4">
                {filteredCommands.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 mx-auto text-white/20 mb-4" />
                    <p className="text-white/40">No se encontraron resultados</p>
                    <p className="text-sm text-white/20 mt-1">Intenta con otros términos</p>
                  </div>
                ) : (
                  <>
                    {/* Navegación */}
                    {groupedCommands.navigation.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-white/30 uppercase tracking-wider px-4 mb-2">
                          Navegación
                        </p>
                        {groupedCommands.navigation.map((item) => {
                          globalIndex++
                          const currentIndex = globalIndex
                          return (
                            <CommandItemRow
                              key={item.id}
                              item={item}
                              isSelected={selectedIndex === currentIndex}
                              onSelect={() => setSelectedIndex(currentIndex)}
                              onExecute={() => executeCommand(item)}
                            />
                          )
                        })}
                      </div>
                    )}
                    
                    {/* Acciones */}
                    {groupedCommands.action.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-white/30 uppercase tracking-wider px-4 mb-2">
                          Acciones Rápidas
                        </p>
                        {groupedCommands.action.map((item) => {
                          globalIndex++
                          const currentIndex = globalIndex
                          return (
                            <CommandItemRow
                              key={item.id}
                              item={item}
                              isSelected={selectedIndex === currentIndex}
                              onSelect={() => setSelectedIndex(currentIndex)}
                              onExecute={() => executeCommand(item)}
                            />
                          )
                        })}
                      </div>
                    )}
                    
                    {/* Settings */}
                    {groupedCommands.settings.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-white/30 uppercase tracking-wider px-4 mb-2">
                          Configuración
                        </p>
                        {groupedCommands.settings.map((item) => {
                          globalIndex++
                          const currentIndex = globalIndex
                          return (
                            <CommandItemRow
                              key={item.id}
                              item={item}
                              isSelected={selectedIndex === currentIndex}
                              onSelect={() => setSelectedIndex(currentIndex)}
                              onExecute={() => executeCommand(item)}
                            />
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Footer con hints */}
              <div 
                className="flex items-center justify-between px-6 py-3 border-t text-xs text-white/30"
                style={{ borderColor: INFINITY_COLORS.glassBorder }}
              >
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <ChevronUp className="w-3 h-3" />
                    <ChevronDown className="w-3 h-3" />
                    navegar
                  </span>
                  <span className="flex items-center gap-1">
                    <CornerDownLeft className="w-3 h-3" />
                    seleccionar
                  </span>
                </div>
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  CHRONOS INFINITY
                </span>
              </div>
              
              {/* Orb decorativo */}
              <OrbPreview />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default memo(CommandMenu)
