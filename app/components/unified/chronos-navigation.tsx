'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🧭 CHRONOS NAVIGATION - Sistema de Navegación Unificado
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo, useState, useCallback, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  LayoutDashboard, ShoppingCart, Users, Truck, Warehouse,
  FileText, Settings, ChevronLeft, Menu, X, Search,
  Landmark, Bell, User, LogOut,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHRONOS, GlassCard, ChronosButton, ChronosBadge } from './chronos-ui'

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 NAVIGATION ITEMS
// ═══════════════════════════════════════════════════════════════════════════

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  badge?: string | number
  badgeVariant?: 'default' | 'success' | 'warning' | 'error'
  children?: NavItem[]
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'ventas', label: 'Ventas', icon: ShoppingCart, badge: '12', badgeVariant: 'success' },
  { id: 'bancos', label: 'Bancos', icon: Landmark, children: [
    { id: 'boveda_monte', label: 'Bóveda Monte', icon: Landmark },
    { id: 'boveda_usa', label: 'Bóveda USA', icon: Landmark },
    { id: 'profit', label: 'Profit', icon: Landmark },
    { id: 'leftie', label: 'Leftie', icon: Landmark },
    { id: 'azteca', label: 'Azteca', icon: Landmark },
    { id: 'flete_sur', label: 'Flete Sur', icon: Landmark },
    { id: 'utilidades', label: 'Utilidades', icon: Landmark },
  ]},
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'distribuidores', label: 'Distribuidores', icon: Truck },
  { id: 'almacen', label: 'Almacén', icon: Warehouse },
  { id: 'reportes', label: 'Reportes', icon: FileText },
  { id: 'settings', label: 'Configuración', icon: Settings },
]

// ═══════════════════════════════════════════════════════════════════════════
// 📱 SIDEBAR - Barra Lateral Premium
// ═══════════════════════════════════════════════════════════════════════════

interface SidebarProps {
  activePanel: string
  onPanelChange: (panelId: string) => void
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  user?: { name: string; email: string; avatar?: string }
  onLogout?: () => void
}

export const ChronosSidebar = memo(({
  activePanel,
  onPanelChange,
  collapsed = false,
  onCollapsedChange,
  user,
  onLogout,
}: SidebarProps) => {
  const prefersReducedMotion = useReducedMotion()
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  
  const handleItemClick = useCallback((item: NavItem) => {
    if (item.children) {
      setExpandedGroup(expandedGroup === item.id ? null : item.id)
    } else {
      onPanelChange(item.id)
    }
  }, [expandedGroup, onPanelChange])
  
  return (
    <motion.aside
      initial={prefersReducedMotion ? {} : { x: -280 }}
      animate={{ x: 0, width: collapsed ? 80 : 280 }}
      transition={CHRONOS.animation.smooth}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        borderRight: `1px solid ${CHRONOS.colors.glassBorder}`,
        backdropFilter: CHRONOS.blur.xl,
      }}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between h-20 px-4 border-b',
        collapsed && 'justify-center',
      )}
      style={{ borderColor: CHRONOS.colors.glassBorder }}
      >
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{ 
                  background: CHRONOS.gradients.primary,
                  color: CHRONOS.colors.void,
                }}
              >
                C
              </div>
              <div>
                <h1 
                  className="text-lg font-bold"
                  style={{ color: CHRONOS.colors.textPrimary }}
                >
                  CHRONOS
                </h1>
                <p 
                  className="text-xs"
                  style={{ color: CHRONOS.colors.textMuted }}
                >
                  Financial System
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => onCollapsedChange?.(!collapsed)}
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
        >
          <ChevronLeft 
            className={cn(
              'w-5 h-5 transition-transform',
              collapsed && 'rotate-180',
            )}
            style={{ color: CHRONOS.colors.textMuted }}
          />
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1">
          {MAIN_NAV_ITEMS.map((item) => (
            <NavItemComponent
              key={item.id}
              item={item}
              isActive={activePanel === item.id || (item.children?.some(c => activePanel === c.id) ?? false)}
              isCollapsed={collapsed}
              isExpanded={expandedGroup === item.id}
              onClick={() => handleItemClick(item)}
              onChildClick={onPanelChange}
              activeChild={activePanel}
            />
          ))}
        </ul>
      </nav>
      
      {/* User Section */}
      {user && (
        <div 
          className={cn(
            'p-4 border-t',
            collapsed && 'flex justify-center',
          )}
          style={{ borderColor: CHRONOS.colors.glassBorder }}
        >
          {collapsed ? (
            <button 
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={onLogout}
            >
              <LogOut className="w-5 h-5" style={{ color: CHRONOS.colors.textMuted }} />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: CHRONOS.colors.glassBg }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full rounded-full" />
                ) : (
                  <User className="w-5 h-5" style={{ color: CHRONOS.colors.textSecondary }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="text-sm font-medium truncate"
                  style={{ color: CHRONOS.colors.textPrimary }}
                >
                  {user.name}
                </p>
                <p 
                  className="text-xs truncate"
                  style={{ color: CHRONOS.colors.textMuted }}
                >
                  {user.email}
                </p>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" style={{ color: CHRONOS.colors.textMuted }} />
              </button>
            </div>
          )}
        </div>
      )}
    </motion.aside>
  )
})
ChronosSidebar.displayName = 'ChronosSidebar'

// ═══════════════════════════════════════════════════════════════════════════
// 🔗 NAV ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface NavItemComponentProps {
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
  isExpanded: boolean
  onClick: () => void
  onChildClick: (id: string) => void
  activeChild: string
}

const NavItemComponent = memo(({
  item,
  isActive,
  isCollapsed,
  isExpanded,
  onClick,
  onChildClick,
  activeChild,
}: NavItemComponentProps) => {
  const prefersReducedMotion = useReducedMotion()
  const Icon = item.icon
  
  return (
    <li>
      <motion.button
        onClick={onClick}
        whileHover={prefersReducedMotion ? {} : { x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
          isCollapsed && 'justify-center px-2',
        )}
        style={{
          background: isActive ? CHRONOS.colors.cyanMuted : 'transparent',
          color: isActive ? CHRONOS.colors.cyan : CHRONOS.colors.textSecondary,
        }}
      >
        <Icon className={cn('flex-shrink-0', isCollapsed ? 'w-6 h-6' : 'w-5 h-5')} />
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 text-left text-sm font-medium truncate"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        
        {!isCollapsed && item.badge && (
          <ChronosBadge variant={item.badgeVariant || 'premium'} size="sm">
            {item.badge}
          </ChronosBadge>
        )}
        
        {!isCollapsed && item.children && (
          <ChevronLeft 
            className={cn(
              'w-4 h-4 transition-transform',
              isExpanded ? 'rotate-90' : '-rotate-90',
            )}
          />
        )}
      </motion.button>
      
      {/* Children */}
      <AnimatePresence>
        {!isCollapsed && isExpanded && item.children && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-1 ml-4 space-y-1 overflow-hidden"
          >
            {item.children.map((child) => (
              <li key={child.id}>
                <button
                  onClick={() => onChildClick(child.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                  )}
                  style={{
                    background: activeChild === child.id ? 'rgba(0, 217, 255, 0.08)' : 'transparent',
                    color: activeChild === child.id ? CHRONOS.colors.cyan : CHRONOS.colors.textMuted,
                  }}
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ 
                      background: activeChild === child.id ? CHRONOS.colors.cyan : CHRONOS.colors.glassBorder, 
                    }}
                  />
                  {child.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  )
})
NavItemComponent.displayName = 'NavItemComponent'

// ═══════════════════════════════════════════════════════════════════════════
// 🔝 HEADER - Barra Superior Premium
// ═══════════════════════════════════════════════════════════════════════════

interface HeaderProps {
  title?: string
  subtitle?: string
  sidebarCollapsed?: boolean
  onMenuClick?: () => void
  notifications?: number
  actions?: ReactNode
}

export const ChronosHeader = memo(({
  title = 'Dashboard',
  subtitle,
  sidebarCollapsed = false,
  onMenuClick,
  notifications = 0,
  actions,
}: HeaderProps) => {
  const [searchOpen, setSearchOpen] = useState(false)
  
  return (
    <header
      className="sticky top-0 z-40 h-20 flex items-center justify-between px-6"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        borderBottom: `1px solid ${CHRONOS.colors.glassBorder}`,
        backdropFilter: CHRONOS.blur.lg,
        marginLeft: sidebarCollapsed ? 80 : 280,
        transition: 'margin-left 0.3s ease',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Menu className="w-6 h-6" style={{ color: CHRONOS.colors.textSecondary }} />
        </button>
        
        <div>
          <h1 
            className="text-xl font-semibold"
            style={{ color: CHRONOS.colors.textPrimary }}
          >
            {title}
          </h1>
          {subtitle && (
            <p 
              className="text-sm"
              style={{ color: CHRONOS.colors.textMuted }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {/* Center - Search */}
      <div className="hidden md:flex flex-1 max-w-lg mx-8">
        <div 
          className="relative w-full"
          style={{ display: searchOpen ? 'block' : 'none' }}
        >
          <input
            type="text"
            placeholder="Buscar ventas, clientes, reportes..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl text-sm outline-none"
            style={{
              background: CHRONOS.colors.glassBg,
              border: `1px solid ${CHRONOS.colors.glassBorder}`,
              color: CHRONOS.colors.textPrimary,
            }}
          />
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: CHRONOS.colors.textMuted }}
          />
        </div>
        
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className={cn(
            'p-2 rounded-xl transition-colors',
            searchOpen ? 'hidden' : 'flex',
          )}
          style={{
            background: CHRONOS.colors.glassBg,
            border: `1px solid ${CHRONOS.colors.glassBorder}`,
          }}
        >
          <Search className="w-5 h-5" style={{ color: CHRONOS.colors.textMuted }} />
        </button>
      </div>
      
      {/* Right */}
      <div className="flex items-center gap-3">
        {actions}
        
        {/* Notifications */}
        <button 
          className="relative p-2.5 rounded-xl transition-colors hover:bg-white/5"
          style={{
            background: CHRONOS.colors.glassBg,
            border: `1px solid ${CHRONOS.colors.glassBorder}`,
          }}
        >
          <Bell className="w-5 h-5" style={{ color: CHRONOS.colors.textSecondary }} />
          {notifications > 0 && (
            <span 
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ 
                background: CHRONOS.colors.error,
                color: CHRONOS.colors.textPrimary,
              }}
            >
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </button>
      </div>
    </header>
  )
})
ChronosHeader.displayName = 'ChronosHeader'

// ═══════════════════════════════════════════════════════════════════════════
// 📦 MAIN LAYOUT - Layout Principal
// ═══════════════════════════════════════════════════════════════════════════

interface MainLayoutProps {
  children: ReactNode
  activePanel: string
  onPanelChange: (panelId: string) => void
  user?: { name: string; email: string }
  onLogout?: () => void
  title?: string
  subtitle?: string
}

export const ChronosLayout = memo(({
  children,
  activePanel,
  onPanelChange,
  user,
  onLogout,
  title,
  subtitle,
}: MainLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  
  // Handle responsive detection
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])
  
  return (
    <div 
      className="min-h-screen"
      style={{ background: CHRONOS.colors.void }}
    >
      {/* Sidebar Desktop */}
      <div className="hidden lg:block">
        <ChronosSidebar
          activePanel={activePanel}
          onPanelChange={onPanelChange}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          user={user}
          onLogout={onLogout}
        />
      </div>
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 z-50 lg:hidden"
            >
              <ChronosSidebar
                activePanel={activePanel}
                onPanelChange={(id) => {
                  onPanelChange(id)
                  setMobileMenuOpen(false)
                }}
                user={user}
                onLogout={onLogout}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <ChronosHeader
        title={title}
        subtitle={subtitle}
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setMobileMenuOpen(true)}
      />
      
      {/* Main Content */}
      <main
        className="p-6 lg:p-8"
        style={{
          marginLeft: isDesktop ? (sidebarCollapsed ? 80 : 280) : 0,
          transition: 'margin-left 0.3s ease',
          minHeight: 'calc(100vh - 80px)',
        }}
      >
        {children}
      </main>
    </div>
  )
})
ChronosLayout.displayName = 'ChronosLayout'

// ═══════════════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  ChronosSidebar,
  ChronosHeader,
  ChronosLayout,
  MAIN_NAV_ITEMS,
}
