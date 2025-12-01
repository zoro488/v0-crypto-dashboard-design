'use client'

import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useAppStore } from '@/app/lib/store/useAppStore'
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
  FileText,
  ChevronDown,
  Menu,
  X,
  Zap,
  TrendingUp,
  Activity,
  CreditCard,
  Wallet,
  PiggyBank,
  Globe,
  Layers,
  Box,
  Eye,
  Command,
  Home,
  Cpu,
  type LucideIcon,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { Button } from '@/app/components/ui/button'
import { CreateOrdenCompraModalPremium } from '@/app/components/modals/CreateOrdenCompraModalPremium'
import { CreateVentaModalPremium } from '@/app/components/modals/CreateVentaModalPremium'
import { CreateTransferenciaModalPremium } from '@/app/components/modals/CreateTransferenciaModalPremium'
import dynamic from 'next/dynamic'

// 🎨 Importar componentes 3D dinámicamente para mejor performance
const GlassNavIcon = dynamic(
  () => import('@/app/components/3d/GlassNavIcons').then(mod => mod.GlassNavIcon),
  { ssr: false, loading: () => <div className="w-10 h-10 bg-white/5 rounded-xl animate-pulse" /> }
)

// ============================================================
// TIPOS
// ============================================================
interface PanelItem {
  id: string
  label: string
  icon: LucideIcon
  color: string
  description?: string
}

interface DropdownItem {
  id: string
  label: string
  icon: LucideIcon
  onClick?: () => void
  color?: string
  badge?: string
}

// ============================================================
// CONFIGURACIÓN DE PANELES
// ============================================================

// Mapeo de IDs de panel a iconos 3D GlassNavIcon
type Glass3DIconName = 'dashboard' | 'analytics' | 'inventory' | 'orders' | 'clients' | 'distributors' | 'banks' | 'vault' | 'expenses' | 'profits' | 'settings' | 'notifications' | 'user' | 'search' | 'menu'

const panelTo3DIcon: Record<string, Glass3DIconName> = {
  dashboard: 'dashboard',
  ventas: 'analytics',
  ordenes: 'orders',
  almacen: 'inventory',
  banco: 'banks',
  boveda_monte: 'vault',
  boveda_usa: 'vault',
  utilidades: 'profits',
  flete_sur: 'orders',
  azteca: 'banks',
  leftie: 'vault',
  profit: 'profits',
  gya: 'expenses',
  distribuidores: 'distributors',
  clientes: 'clients',
  reportes: 'analytics',
  ia: 'search',
}

const panelTo3DColor: Record<string, 'blue' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose'> = {
  dashboard: 'blue',
  ventas: 'emerald',
  ordenes: 'purple',
  almacen: 'amber',
  banco: 'blue',
  boveda_monte: 'cyan',
  boveda_usa: 'rose',
  utilidades: 'emerald',
  flete_sur: 'amber',
  azteca: 'purple',
  leftie: 'amber',
  profit: 'purple',
  gya: 'emerald',
  distribuidores: 'rose',
  clientes: 'rose',
  reportes: 'cyan',
  ia: 'purple',
}

const mainPanels: PanelItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, color: 'from-blue-500 to-cyan-500', description: 'Vista general del sistema' },
  { id: 'ventas', label: 'Ventas', icon: ShoppingCart, color: 'from-green-500 to-emerald-500', description: 'Gestión de ventas' },
  { id: 'ordenes', label: 'Órdenes', icon: Package, color: 'from-purple-500 to-violet-500', description: 'Órdenes de compra' },
  { id: 'almacen', label: 'Almacén', icon: Warehouse, color: 'from-amber-500 to-yellow-600', description: 'Control de inventario' },
]

const bancosItems: PanelItem[] = [
  { id: 'banco', label: 'Todos los Bancos', icon: Building2, color: 'from-blue-600 to-indigo-600', description: 'Vista consolidada' },
  { id: 'boveda_monte', label: 'Bóveda Monte', icon: Wallet, color: 'from-blue-500 to-cyan-500', description: 'Capital principal MXN' },
  { id: 'boveda_usa', label: 'Bóveda USA', icon: Globe, color: 'from-red-500 to-blue-500', description: 'Capital en USD' },
  { id: 'utilidades', label: 'Utilidades', icon: TrendingUp, color: 'from-green-500 to-emerald-500', description: 'Ganancias netas' },
  { id: 'flete_sur', label: 'Flete Sur', icon: Package, color: 'from-orange-500 to-amber-500', description: 'Transporte' },
  { id: 'azteca', label: 'Azteca', icon: CreditCard, color: 'from-purple-500 to-pink-500', description: 'Cuenta externa' },
  { id: 'leftie', label: 'Leftie', icon: PiggyBank, color: 'from-yellow-500 to-orange-500', description: 'Capital secundario' },
  { id: 'profit', label: 'Profit', icon: DollarSign, color: 'from-indigo-500 to-purple-500', description: 'Banco operativo' },
]

const gestionItems: PanelItem[] = [
  { id: 'gya', label: 'Gastos y Abonos', icon: Wallet, color: 'from-emerald-500 to-green-500', description: 'Gestión de egresos e ingresos' },
  { id: 'distribuidores', label: 'Distribuidores', icon: Users, color: 'from-orange-500 to-red-500', description: 'Proveedores' },
  { id: 'clientes', label: 'Clientes', icon: UserCheck, color: 'from-pink-500 to-rose-500', description: 'Cartera de clientes' },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, color: 'from-teal-500 to-cyan-600', description: 'Análisis y reportes' },
  { id: 'ia', label: 'Asistente IA', icon: Sparkles, color: 'from-violet-500 to-purple-600', description: 'Inteligencia artificial' },
]

// Componentes 3D Spline ahora están integrados directamente en los paneles principales
// Ver: BentoIA (AI Voice Orb), BentoDashboard (Glass Buttons), BentoVentas (Fire Portal), etc.

// ============================================================
// COMPONENTE: Dropdown Mega Menu con Iconos 3D
// ============================================================
interface MegaDropdownProps {
  title: string
  icon: LucideIcon
  items: PanelItem[]
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  onSelect: (id: string) => void
  currentPanel: string
  columns?: number
  use3D?: boolean // Habilitar iconos 3D Spline
}

const MegaDropdown = ({ 
  title, 
  icon: Icon, 
  items, 
  isOpen, 
  onToggle, 
  onClose, 
  onSelect, 
  currentPanel,
  columns = 2,
  use3D = true, // Por defecto usar iconos 3D
}: MegaDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  return (
    <div ref={dropdownRef} className="relative">
      <motion.button
        onClick={onToggle}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
          ${isOpen 
            ? 'bg-white/10 text-white' 
            : 'text-white/60 hover:text-white hover:bg-white/5'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{title}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-2 z-50"
          >
            <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden min-w-[320px]">
              {/* Header del dropdown con efecto 3D */}
              <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
                <div className="flex items-center gap-3">
                  {/* Orbe 3D decorativo en header */}
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse" />
                      <Icon className="w-4 h-4 text-white relative z-10" />
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-md opacity-50" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">{title}</span>
                    <p className="text-[10px] text-white/40">Spline 3D Enhanced</p>
                  </div>
                </div>
              </div>

              {/* Items Grid con Iconos 3D */}
              <div className={`p-3 grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {items.map((item) => {
                  const ItemIcon = item.icon
                  const isActive = currentPanel === item.id
                  const icon3D = panelTo3DIcon[item.id] || 'dashboard'
                  const color3D = panelTo3DColor[item.id] || 'blue'
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => {
                        onSelect(item.id)
                        onClose()
                      }}
                      className={`
                        group flex items-center gap-3 p-3 rounded-xl text-left transition-all w-full relative overflow-hidden
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30' 
                          : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                        }
                      `}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Icono 3D Spline o Fallback */}
                      <div className="relative flex-shrink-0">
                        {use3D ? (
                          <Suspense fallback={
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} shadow-lg flex items-center justify-center`}>
                              <ItemIcon className="w-4 h-4 text-white" />
                            </div>
                          }>
                            <GlassNavIcon
                              icon={icon3D}
                              size="xs"
                              colorScheme={color3D}
                              isActive={isActive}
                            />
                          </Suspense>
                        ) : (
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} shadow-lg`}>
                            <ItemIcon className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        {/* Glow effect para items activos */}
                        {isActive && (
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-xl blur-md opacity-60 -z-10" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                          {item.label}
                        </p>
                        {item.description && (
                          <p className="text-xs text-white/40 truncate">{item.description}</p>
                        )}
                      </div>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// COMPONENTE: Mobile Menu
// ============================================================
interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  currentPanel: string
  onPanelSelect: (id: string) => void
  onAction: (action: string) => void
}

const MobileMenu = ({ isOpen, onClose, currentPanel, onPanelSelect, onAction }: MobileMenuProps) => {
  const allPanels = [...mainPanels, ...gestionItems]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-black/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-black/80 backdrop-blur-xl">
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
                  { label: 'Nueva Venta', icon: DollarSign, action: 'venta', color: 'from-green-500 to-emerald-500' },
                  { label: 'Nueva Orden', icon: Plus, action: 'orden', color: 'from-blue-500 to-cyan-500' },
                  { label: 'Transferencia', icon: ArrowRightLeft, action: 'transferencia', color: 'from-purple-500 to-pink-500' },
                  { label: 'Reporte', icon: FileText, action: 'reporte', color: 'from-orange-500 to-amber-500' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <motion.button
                      key={item.action}
                      onClick={() => {
                        onAction(item.action)
                        onClose()
                      }}
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
            <div className="p-4 border-b border-white/10">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Paneles</p>
              <div className="space-y-1">
                {allPanels.map((panel) => {
                  const Icon = panel.icon
                  const isActive = currentPanel === panel.id
                  return (
                    <motion.button
                      key={panel.id}
                      onClick={() => {
                        onPanelSelect(panel.id)
                        onClose()
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30' 
                          : 'hover:bg-white/5'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${panel.color}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className={isActive ? 'text-white font-medium' : 'text-white/70'}>
                        {panel.label}
                      </span>
                      {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Bancos */}
            <div className="p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Bancos</p>
              <div className="grid grid-cols-2 gap-2">
                {bancosItems.slice(1).map((banco) => {
                  const Icon = banco.icon
                  return (
                    <motion.button
                      key={banco.id}
                      onClick={() => {
                        onPanelSelect('banco')
                        onClose()
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${banco.color}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs text-white/70 text-center">{banco.label}</span>
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

// ============================================================
// COMPONENTE PRINCIPAL: ChronosHeader
// ============================================================
export default function ChronosHeader() {
  const { currentPanel, setCurrentPanel } = useAppStore()
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  
  // Modales
  const [showOrdenModal, setShowOrdenModal] = useState(false)
  const [showVentaModal, setShowVentaModal] = useState(false)
  const [showTransferenciaModal, setShowTransferenciaModal] = useState(false)

  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 50], [1, 0.98])

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Keyboard shortcut: Cmd+K
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

  const handleDropdownToggle = useCallback((dropdown: string) => {
    setActiveDropdown(prev => prev === dropdown ? null : dropdown)
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
      case 'reporte':
        setCurrentPanel('reportes')
        break
    }
  }, [setCurrentPanel])

  return (
    <>
      <motion.header
        style={{ opacity: headerOpacity }}
        className={`
          fixed top-0 left-0 right-0 z-50 
          transition-all duration-500 ease-out
          ${isScrolled
            ? 'bg-black/80 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-black/50'
            : 'bg-black/40 backdrop-blur-xl'
          }
        `}
      >
        <div className="h-16 md:h-[72px] max-w-[2000px] mx-auto px-3 md:px-6 flex items-center justify-between gap-2 md:gap-4">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2 md:gap-3 cursor-pointer group shrink-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentPanel('dashboard')}
          >
            <motion.div
              className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl md:rounded-2xl overflow-hidden"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500" />
              <div className="absolute inset-[2px] bg-black rounded-[10px] md:rounded-[14px] flex items-center justify-center">
                <span className="font-bold text-white text-lg md:text-xl">C</span>
              </div>
            </motion.div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-base md:text-lg tracking-tight text-white">Chronos</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] md:text-[10px] text-white/40 tracking-widest uppercase">System</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] md:text-[9px] text-green-400/60">ONLINE</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/5 backdrop-blur-xl rounded-xl p-1 border border-white/10">
            {/* Home Button */}
            <motion.button
              onClick={() => setCurrentPanel('dashboard')}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${currentPanel === 'dashboard' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Home className="w-4 h-4" />
              <span>Inicio</span>
            </motion.button>

            {/* Operaciones Dropdown */}
            <MegaDropdown
              title="Operaciones"
              icon={Zap}
              items={mainPanels}
              isOpen={activeDropdown === 'operaciones'}
              onToggle={() => handleDropdownToggle('operaciones')}
              onClose={() => setActiveDropdown(null)}
              onSelect={setCurrentPanel}
              currentPanel={currentPanel}
              columns={1}
            />

            {/* Bancos Dropdown */}
            <MegaDropdown
              title="Bancos"
              icon={Building2}
              items={bancosItems}
              isOpen={activeDropdown === 'bancos'}
              onToggle={() => handleDropdownToggle('bancos')}
              onClose={() => setActiveDropdown(null)}
              onSelect={setCurrentPanel}
              currentPanel={currentPanel}
              columns={2}
            />

            {/* Gestión Dropdown */}
            <MegaDropdown
              title="Gestión"
              icon={Users}
              items={gestionItems}
              isOpen={activeDropdown === 'gestion'}
              onToggle={() => handleDropdownToggle('gestion')}
              onClose={() => setActiveDropdown(null)}
              onSelect={setCurrentPanel}
              currentPanel={currentPanel}
              columns={1}
            />
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {/* Quick Actions - Desktop */}
            <div className="hidden xl:flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setShowVentaModal(true)}
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg shadow-green-500/20"
                >
                  <DollarSign className="w-4 h-4 mr-1.5" />
                  Venta
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setShowOrdenModal(true)}
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Orden
                </Button>
              </motion.div>
            </div>

            {/* Search */}
            <motion.button
              onClick={() => setShowSearch(true)}
              className="relative p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-4 h-4 md:w-5 md:h-5 text-white/60 group-hover:text-white transition-colors" />
              <kbd className="hidden md:inline-flex absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[8px] bg-white/10 text-white/50 rounded border border-white/10">
                ⌘K
              </kbd>
            </motion.button>

            {/* Notifications */}
            <motion.button
              className="relative p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-white/60" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-black" />
            </motion.button>

            {/* Settings - Desktop */}
            <motion.button
              className="hidden md:flex p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5 text-white/60" />
            </motion.button>

            {/* User Avatar */}
            <motion.div
              className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 cursor-pointer overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-full h-full flex items-center justify-center text-white/80 font-semibold text-sm">
                A
              </div>
            </motion.div>

            {/* Mobile Menu Toggle */}
            <motion.button
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        currentPanel={currentPanel}
        onPanelSelect={setCurrentPanel}
        onAction={handleAction}
      />

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSearch(false)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-start justify-center pt-20 md:pt-32 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
              <div className="bg-black/90 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                <div className="relative p-4 md:p-6">
                  <Search className="absolute left-7 md:left-9 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-white/40" />
                  <input
                    type="text"
                    placeholder="Buscar en Chronos..."
                    autoFocus
                    className="w-full bg-transparent border-none outline-none pl-12 md:pl-14 pr-4 py-2 md:py-3 text-lg md:text-2xl text-white placeholder:text-white/30"
                  />
                  <div className="absolute right-7 md:right-9 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs text-white/40 bg-white/10 rounded border border-white/20">ESC</kbd>
                  </div>
                </div>

                <div className="border-t border-white/10 p-4">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-3 px-2">Acceso rápido</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[...mainPanels, ...gestionItems].slice(0, 6).map((panel) => {
                      const Icon = panel.icon
                      return (
                        <motion.button
                          key={panel.id}
                          onClick={() => {
                            setCurrentPanel(panel.id)
                            setShowSearch(false)
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${panel.color}`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm text-white/80">{panel.label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modales */}
      <CreateOrdenCompraModalPremium open={showOrdenModal} onClose={() => setShowOrdenModal(false)} />
      <CreateVentaModalPremium open={showVentaModal} onClose={() => setShowVentaModal(false)} />
      <CreateTransferenciaModalPremium open={showTransferenciaModal} onClose={() => setShowTransferenciaModal(false)} />
    </>
  )
}
