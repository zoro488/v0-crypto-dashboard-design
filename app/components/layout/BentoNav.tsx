'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
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
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { CreateOrdenCompraModalPremium } from '@/app/components/modals/CreateOrdenCompraModalPremium'
import { CreateVentaModalPremium } from '@/app/components/modals/CreateVentaModalPremium'
import { CreateTransferenciaModalPremium } from '@/app/components/modals/CreateTransferenciaModalPremium'

export default function BentoNav() {
  const { currentPanel, setCurrentPanel } = useAppStore()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showOrdenModal, setShowOrdenModal] = useState(false)
  const [showVentaModal, setShowVentaModal] = useState(false)
  const [showTransferenciaModal, setShowTransferenciaModal] = useState(false)

  const { scrollY } = useScroll()

  const headerHeight = useTransform(scrollY, [0, 100], [80, 64])
  const logoScale = useTransform(scrollY, [0, 100], [1, 0.9])
  const navOpacity = useTransform(scrollY, [0, 50], [1, 0.95])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const allPanels = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, color: 'from-blue-500 to-cyan-500' },
    { id: 'ventas', label: 'Ventas', icon: ShoppingCart, color: 'from-green-500 to-emerald-500' },
    { id: 'ordenes', label: 'Órdenes', icon: Package, color: 'from-purple-500 to-violet-500' },
    { id: 'distribuidores', label: 'Distribuidores', icon: Users, color: 'from-orange-500 to-red-500' },
    { id: 'clientes', label: 'Clientes', icon: UserCheck, color: 'from-pink-500 to-rose-500' },
    { id: 'banco', label: 'Bancos', icon: Building2, color: 'from-blue-600 to-indigo-600' },
    { id: 'almacen', label: 'Almacén', icon: Warehouse, color: 'from-amber-500 to-yellow-600' },
    { id: 'reportes', label: 'Reportes', icon: BarChart3, color: 'from-teal-500 to-cyan-600' },
    { id: 'ia', label: 'IA', icon: Sparkles, color: 'from-violet-500 to-purple-600' },
  ]

  const quickActions = [
    {
      label: 'Nueva Orden',
      icon: Plus,
      onClick: () => setShowOrdenModal(true),
      variant: 'primary' as const,
    },
    {
      label: 'Registrar Venta',
      icon: DollarSign,
      onClick: () => setShowVentaModal(true),
      variant: 'secondary' as const,
    },
    {
      label: 'Transferencia',
      icon: ArrowRightLeft,
      onClick: () => setShowTransferenciaModal(true),
      variant: 'outline' as const,
    },
    {
      label: 'Reporte Rápido',
      icon: FileText,
      onClick: () => setCurrentPanel('reportes'),
      variant: 'outline' as const,
    },
  ]

  return (
    <>
      <motion.header
        style={{
          height: headerHeight,
          opacity: navOpacity,
        }}
        className={`
          fixed top-0 left-0 right-0 z-50 
          transition-all duration-500 ease-out
          ${
            isScrolled
              ? 'bg-black/80 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-black/50'
              : 'bg-transparent'
          }
        `}
      >
        <div className="h-full max-w-[1800px] mx-auto px-6 flex items-center justify-between gap-6">
          {/* Logo */}
          <motion.div
            style={{ scale: logoScale }}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="relative w-10 h-10 rounded-2xl overflow-hidden"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 opacity-100 group-hover:opacity-80 transition-opacity" />
              <div className="absolute inset-[2px] bg-black rounded-[14px] flex items-center justify-center">
                <span className="font-bold text-white text-xl">C</span>
              </div>
            </motion.div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white">Chronos</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 tracking-widest uppercase">System</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] text-green-400/60">ONLINE</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation Pills */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/5 backdrop-blur-xl rounded-full p-1.5 border border-white/10">
            {allPanels.map((panel) => {
              const Icon = panel.icon
              const isActive = currentPanel === panel.id

              return (
                <motion.button
                  key={panel.id}
                  onClick={() => setCurrentPanel(panel.id)}
                  className="relative px-4 py-2.5 rounded-full text-sm font-medium transition-all group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activePanel"
                      className={`absolute inset-0 bg-gradient-to-r ${panel.color} rounded-full`}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${panel.color} rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity`}
                  />

                  <div className="relative flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`}
                    />
                    <span
                      className={`transition-colors ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`}
                    >
                      {panel.label}
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </nav>

          {/* Quick Actions + Right Side */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden xl:flex items-center gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <motion.div key={action.label} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={action.onClick}
                      size="sm"
                      className={`
                        ${
                          action.variant === 'primary'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                            : action.variant === 'secondary'
                              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                              : 'bg-transparent hover:bg-white/5 text-white/60 hover:text-white border border-white/10'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {action.label}
                    </Button>
                  </motion.div>
                )
              })}
            </div>

            {/* Search trigger */}
            <motion.button
              onClick={() => setShowSearch(true)}
              className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            </motion.button>

            {/* Notifications */}
            <motion.button
              className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-5 h-5 text-white/60" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-black" />
            </motion.button>

            {/* Settings */}
            <motion.button
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5 text-white/60" />
            </motion.button>

            {/* User avatar */}
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 cursor-pointer overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-full h-full flex items-center justify-center text-white/80 font-semibold text-sm">
                A
              </div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Search Modal */}
      {showSearch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowSearch(false)}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-start justify-center pt-32 px-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: -20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl"
          >
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="relative p-6">
                <Search className="absolute left-9 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />
                <input
                  type="text"
                  placeholder="Buscar en Chronos..."
                  autoFocus
                  className="w-full bg-transparent border-none outline-none pl-14 pr-4 py-3 text-2xl text-white placeholder:text-white/30"
                />
                <div className="absolute right-9 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <kbd className="px-2 py-1 text-xs text-white/40 bg-white/10 rounded border border-white/20">ESC</kbd>
                </div>
              </div>

              <div className="border-t border-white/10 p-4">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-3 px-2">Acceso rápido</div>
                <div className="grid grid-cols-3 gap-2">
                  {allPanels.slice(0, 6).map((panel) => {
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
                        <Icon className="w-5 h-5 text-white/60" />
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

      <CreateOrdenCompraModalPremium open={showOrdenModal} onClose={() => setShowOrdenModal(false)} />
      <CreateVentaModalPremium open={showVentaModal} onClose={() => setShowVentaModal(false)} />
      <CreateTransferenciaModalPremium open={showTransferenciaModal} onClose={() => setShowTransferenciaModal(false)} />
    </>
  )
}
