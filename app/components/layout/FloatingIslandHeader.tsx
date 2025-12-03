'use client'

import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useAppStore } from '@/app/lib/store/useAppStore'
import type { PanelId } from '@/app/types'
import {
  LayoutGrid,
  ShoppingCart,
  Package,
  Users,
  UserCheck,
  Building2,
  Warehouse,
  BarChart3,
  Sparkles,
  Search,
  Bell,
  Settings,
  Plus,
  DollarSign,
  ArrowRightLeft,
  ChevronDown,
  Menu,
  X,
  Command,
  Home,
  type LucideIcon,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { Button } from '@/app/components/ui/button'
import { CreateOrdenCompraModalPremium } from '@/app/components/modals/CreateOrdenCompraModalPremium'
import { CreateVentaModalPremium } from '@/app/components/modals/CreateVentaModalPremium'
import { CreateTransferenciaModalPremium } from '@/app/components/modals/CreateTransferenciaModalPremium'
import dynamic from 'next/dynamic'
import { cn } from '@/app/lib/utils'

// 🎨 Componentes 3D dinámicos
const GlassNavIcon = dynamic(
  () => import('@/app/components/3d/GlassNavIcons').then(mod => mod.GlassNavIcon),
  { ssr: false, loading: () => <div className="w-10 h-10 bg-white/5 rounded-xl animate-pulse" /> },
)

// ============================================================
// TIPOS
// ============================================================
interface PanelItem {
  id: PanelId
  label: string
  icon: LucideIcon
  color: string
  description?: string
}

// ============================================================
// CONFIGURACIÓN
// ============================================================

const mainPanels: PanelItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, color: 'from-blue-500 to-cyan-500', description: 'Vista general' },
  { id: 'ventas', label: 'Ventas', icon: ShoppingCart, color: 'from-emerald-500 to-green-500', description: 'Gestión de ventas' },
  { id: 'ordenes', label: 'Órdenes', icon: Package, color: 'from-violet-500 to-purple-500', description: 'Órdenes de compra' },
  { id: 'almacen', label: 'Almacén', icon: Warehouse, color: 'from-amber-500 to-orange-500', description: 'Inventario' },
]

const managementPanels: PanelItem[] = [
  { id: 'bancos', label: 'Bancos', icon: Building2, color: 'from-blue-500 to-indigo-500', description: 'Capital' },
  { id: 'distribuidores', label: 'Distribuidores', icon: Users, color: 'from-rose-500 to-pink-500', description: 'Proveedores' },
  { id: 'clientes', label: 'Clientes', icon: UserCheck, color: 'from-pink-500 to-rose-500', description: 'Clientes' },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, color: 'from-cyan-500 to-teal-500', description: 'Análisis' },
  { id: 'ia', label: 'IA', icon: Sparkles, color: 'from-purple-500 to-violet-500', description: 'Asistente' },
]

// ============================================================
// FLOATING ISLAND HEADER
// ============================================================

export default function FloatingIslandHeader() {
  const { currentPanel, setCurrentPanel } = useAppStore()
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  
  // Modales
  const [showOrdenModal, setShowOrdenModal] = useState(false)
  const [showVentaModal, setShowVentaModal] = useState(false)
  const [showTransferenciaModal, setShowTransferenciaModal] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  
  // Efecto de scroll - el header se compacta sutilmente
  const headerPadding = useTransform(scrollY, [0, 100], [16, 10])
  const headerBlur = useTransform(scrollY, [0, 100], [40, 60])

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }
    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeDropdown])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setActiveDropdown(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleAction = useCallback((action: string) => {
    switch (action) {
      case 'venta':
        setShowVentaModal(true)
        break
      case 'orden':
        setShowOrdenModal(true)
        break
      case 'transferencia':
        setShowTransferenciaModal(true)
        break
    }
  }, [])

  return (
    <>
      {/* FLOATING ISLAND HEADER */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
        style={{ paddingTop: headerPadding }}
      >
        <motion.nav
          ref={dropdownRef}
          className={cn(
            'pointer-events-auto',
            'flex items-center gap-1',
            'px-2 py-1.5',
            'rounded-full',
            'border border-white/[0.08]',
            'transition-all duration-500',
            // Obsidian Glass effect
            isScrolled
              ? 'bg-[rgba(10,10,15,0.85)] shadow-[0_16px_48px_-8px_rgba(0,0,0,0.7)]'
              : 'bg-[rgba(10,10,15,0.6)] shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)]',
          )}
          style={{
            backdropFilter: `blur(${headerBlur}px) saturate(180%)`,
            WebkitBackdropFilter: `blur(${headerBlur}px) saturate(180%)`,
          }}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <motion.button
            onClick={() => setCurrentPanel('dashboard')}
            className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/5 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center relative overflow-hidden"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <div className="absolute inset-[2px] bg-[#0a0a0f] rounded-[10px] flex items-center justify-center">
                <span className="font-bold text-white text-sm">C</span>
              </div>
            </motion.div>
            <span className="hidden sm:block font-semibold text-white text-sm">Chronos</span>
          </motion.button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Main Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {/* Home */}
            <NavItem
              icon={Home}
              label="Inicio"
              isActive={currentPanel === 'dashboard'}
              onClick={() => setCurrentPanel('dashboard')}
            />

            {/* Operations Dropdown */}
            <NavDropdown
              label="Operaciones"
              isOpen={activeDropdown === 'ops'}
              onToggle={() => setActiveDropdown(activeDropdown === 'ops' ? null : 'ops')}
              items={mainPanels}
              currentPanel={currentPanel}
              onSelect={(id) => {
                setCurrentPanel(id)
                setActiveDropdown(null)
              }}
            />

            {/* Management Dropdown */}
            <NavDropdown
              label="Gestión"
              isOpen={activeDropdown === 'mgmt'}
              onToggle={() => setActiveDropdown(activeDropdown === 'mgmt' ? null : 'mgmt')}
              items={managementPanels}
              currentPanel={currentPanel}
              onSelect={(id) => {
                setCurrentPanel(id)
                setActiveDropdown(null)
              }}
            />
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-6 bg-white/10 mx-1" />

          {/* Quick Actions */}
          <div className="hidden xl:flex items-center gap-1">
            <motion.button
              onClick={() => setShowVentaModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:from-emerald-500/30 hover:to-green-500/30 transition-all"
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px -5px rgba(4, 120, 87, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Venta</span>
            </motion.button>

            <motion.button
              onClick={() => setShowOrdenModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium hover:bg-white/10 hover:text-white transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Orden</span>
            </motion.button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Right Actions */}
          <div className="flex items-center gap-0.5">
            {/* Search */}
            <IconButton
              icon={Search}
              onClick={() => setShowSearch(true)}
              tooltip="Buscar (⌘K)"
            />

            {/* Notifications */}
            <IconButton
              icon={Bell}
              onClick={() => {}}
              badge
            />

            {/* Settings - Desktop only */}
            <div className="hidden md:block">
              <IconButton
                icon={Settings}
                onClick={() => {}}
                rotateOnHover
              />
            </div>

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden">
              <IconButton
                icon={Menu}
                onClick={() => setShowMobileMenu(true)}
              />
            </div>

            {/* User Avatar */}
            <motion.button
              className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center ml-1"
              whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white/80 font-medium text-xs">A</span>
            </motion.button>
          </div>
        </motion.nav>
      </motion.header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        currentPanel={currentPanel}
        onPanelSelect={(id) => {
          setCurrentPanel(id)
          setShowMobileMenu(false)
        }}
        onAction={(action) => {
          handleAction(action)
          setShowMobileMenu(false)
        }}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={(id) => {
          setCurrentPanel(id)
          setShowSearch(false)
        }}
        currentPanel={currentPanel}
      />

      {/* Modales */}
      <CreateOrdenCompraModalPremium open={showOrdenModal} onClose={() => setShowOrdenModal(false)} />
      <CreateVentaModalPremium open={showVentaModal} onClose={() => setShowVentaModal(false)} />
      <CreateTransferenciaModalPremium open={showTransferenciaModal} onClose={() => setShowTransferenciaModal(false)} />
    </>
  )
}

// ============================================================
// SUBCOMPONENTES
// ============================================================

interface NavItemProps {
  icon: LucideIcon
  label: string
  isActive: boolean
  onClick: () => void
}

const NavItem = ({ icon: Icon, label, isActive, onClick }: NavItemProps) => (
  <motion.button
    onClick={onClick}
    className={cn(
      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
      isActive
        ? 'bg-white/10 text-white'
        : 'text-white/60 hover:text-white hover:bg-white/5',
    )}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
    {isActive && (
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-blue-500"
        layoutId="activeIndicator"
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    )}
  </motion.button>
)

interface NavDropdownProps {
  label: string
  isOpen: boolean
  onToggle: () => void
  items: PanelItem[]
  currentPanel: PanelId
  onSelect: (id: PanelId) => void
}

const NavDropdown = ({ label, isOpen, onToggle, items, currentPanel, onSelect }: NavDropdownProps) => (
  <div className="relative">
    <motion.button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        isOpen
          ? 'bg-white/10 text-white'
          : 'text-white/60 hover:text-white hover:bg-white/5',
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span>{label}</span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="w-3 h-3" />
      </motion.div>
    </motion.button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute top-full left-0 mt-2 w-56 p-2 rounded-2xl bg-[rgba(10,10,15,0.95)] backdrop-blur-2xl border border-white/10 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.7)]"
        >
          {items.map((item) => {
            const Icon = item.icon
            const isActive = currentPanel === item.id
            return (
              <motion.button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/5',
                )}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                  item.color,
                )}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  {item.description && (
                    <p className="text-[10px] text-white/40 truncate">{item.description}</p>
                  )}
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </motion.button>
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

interface IconButtonProps {
  icon: LucideIcon
  onClick: () => void
  tooltip?: string
  badge?: boolean
  rotateOnHover?: boolean
}

const IconButton = ({ icon: Icon, onClick, tooltip, badge, rotateOnHover }: IconButtonProps) => (
  <motion.button
    onClick={onClick}
    className="relative p-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors"
    whileHover={{ scale: 1.05, ...(rotateOnHover && { rotate: 90 }) }}
    whileTap={{ scale: 0.95 }}
    title={tooltip}
  >
    <Icon className="w-4 h-4" />
    {badge && (
      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#0a0a0f]" />
    )}
  </motion.button>
)

// Mobile Menu Component
interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  currentPanel: PanelId
  onPanelSelect: (id: PanelId) => void
  onAction: (action: string) => void
}

const MobileMenu = ({ isOpen, onClose, currentPanel, onPanelSelect, onAction }: MobileMenuProps) => {
  const allPanels = [...mainPanels, ...managementPanels]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-sm z-[101] bg-[rgba(10,10,15,0.98)] backdrop-blur-2xl border-l border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="font-bold text-white text-lg">C</span>
                </div>
                <div>
                  <h2 className="font-bold text-white">Chronos</h2>
                  <p className="text-xs text-white/40">Sistema de Gestión</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-white/10">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Acciones Rápidas</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Nueva Venta', icon: DollarSign, action: 'venta', color: 'from-emerald-500 to-green-500' },
                  { label: 'Nueva Orden', icon: Plus, action: 'orden', color: 'from-blue-500 to-cyan-500' },
                  { label: 'Transferencia', icon: ArrowRightLeft, action: 'transferencia', color: 'from-purple-500 to-pink-500' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <motion.button
                      key={item.action}
                      onClick={() => onAction(item.action)}
                      className={`flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r ${item.color} text-white text-sm font-medium`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Panels */}
            <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Paneles</p>
              <div className="space-y-1">
                {allPanels.map((panel) => {
                  const Icon = panel.icon
                  const isActive = currentPanel === panel.id
                  return (
                    <motion.button
                      key={panel.id}
                      onClick={() => onPanelSelect(panel.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                        isActive
                          ? 'bg-white/10 border border-white/10'
                          : 'hover:bg-white/5',
                      )}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br',
                        panel.color,
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={cn(
                          'font-medium',
                          isActive ? 'text-white' : 'text-white/70',
                        )}>{panel.label}</p>
                        {panel.description && (
                          <p className="text-xs text-white/40">{panel.description}</p>
                        )}
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Search Modal Component
interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (id: PanelId) => void
  currentPanel: PanelId
}

const SearchModal = ({ isOpen, onClose, onSelect, currentPanel }: SearchModalProps) => {
  const allPanels = [...mainPanels, ...managementPanels]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-xl flex items-start justify-center pt-24 px-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[rgba(10,10,15,0.95)] backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Search Input */}
            <div className="relative p-4 border-b border-white/10">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Buscar en Chronos..."
                autoFocus
                className="w-full bg-transparent border-none outline-none pl-10 pr-16 py-2 text-lg text-white placeholder:text-white/30"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <kbd className="px-2 py-1 text-[10px] text-white/40 bg-white/5 rounded border border-white/10">
                  ESC
                </kbd>
              </div>
            </div>

            {/* Quick Access */}
            <div className="p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Acceso Rápido</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allPanels.slice(0, 6).map((panel) => {
                  const Icon = panel.icon
                  const isActive = currentPanel === panel.id
                  return (
                    <motion.button
                      key={panel.id}
                      onClick={() => onSelect(panel.id)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-xl transition-all',
                        isActive
                          ? 'bg-white/10 border border-white/10'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent',
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                        panel.color,
                      )}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-white/80 truncate">{panel.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Keyboard Hint */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-4 text-[10px] text-white/30">
                <span className="flex items-center gap-1">
                  <Command className="w-3 h-3" />
                  <span>+K para buscar</span>
                </span>
                <span>↑↓ para navegar</span>
                <span>Enter para seleccionar</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
