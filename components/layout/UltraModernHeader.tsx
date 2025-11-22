"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Search, Bell, User, ChevronDown, TrendingUp, Package, DollarSign, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store/useAppStore"

export default function UltraModernHeader() {
  const { currentPanel, setCurrentPanel } = useAppStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const quickActions = [
    {
      id: "new-sale",
      icon: <DollarSign className="w-5 h-5" />,
      label: "Nueva Venta",
      color: "from-emerald-500 to-green-600",
      shortcut: "Ctrl+N",
    },
    {
      id: "new-purchase",
      icon: <Package className="w-5 h-5" />,
      label: "Nueva OC",
      color: "from-blue-500 to-blue-600",
      shortcut: "Ctrl+O",
    },
    {
      id: "transfer",
      icon: <TrendingUp className="w-5 h-5" />,
      label: "Transferencia",
      color: "from-purple-500 to-purple-600",
      shortcut: "Ctrl+T",
    },
  ]

  const notifications = [
    {
      type: "critical",
      title: "Stock Agotado",
      message: "3 productos sin existencia",
      time: "2 min ago",
      unread: true,
    },
    {
      type: "warning",
      title: "Capital Bajo en Fletes",
      message: "Capital: $5,000 (10% del promedio)",
      time: "15 min ago",
      unread: true,
    },
  ]

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "h-16 bg-gray-900/95 backdrop-blur-[30px] shadow-2xl"
          : "h-18 bg-gray-900/80 backdrop-blur-[24px] shadow-xl"
      } border-b border-white/5`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="h-full px-6 flex items-center justify-between gap-6">
        {/* Logo & Breadcrumb */}
        <div className="flex items-center gap-6">
          <motion.div
            className="flex items-center gap-3 cursor-pointer group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentPanel("dashboard")}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                C
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Chronos
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Flow System</span>
            </div>
          </motion.div>

          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center gap-2 text-sm">
            <span className="text-gray-500">Dashboard</span>
            <ChevronDown className="w-4 h-4 text-gray-600 rotate-[-90deg]" />
            <span className="text-white font-medium">{currentPanel}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="hidden xl:flex items-center gap-2">
          {quickActions.map((action) => (
            <motion.button
              key={action.id}
              className={`relative px-4 py-2 rounded-xl bg-gradient-to-r ${action.color} text-white font-medium text-sm flex items-center gap-2 overflow-hidden group`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="relative flex items-center gap-2">
                {action.icon}
                <span>{action.label}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="🔍 Buscar en todo el sistema... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchResults(e.target.value.length > 0)
              }}
              onFocus={() => setShowSearchResults(searchQuery.length > 0)}
              className="w-full h-12 pl-12 pr-4 bg-white/5 hover:bg-white/8 focus:bg-white/10 border border-white/10 focus:border-blue-500/50 rounded-xl text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showSearchResults && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-gray-900/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-h-96 overflow-y-auto"
              >
                <div className="p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Quick Actions</div>
                  {quickActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center`}
                      >
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{action.label}</div>
                        <div className="text-xs text-gray-500">{action.shortcut}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <motion.button
              className="relative w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {notifications.filter((n) => n.unread).length}
              </span>
            </motion.button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-80 bg-gray-900/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif, i) => (
                      <div
                        key={i}
                        className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${
                          notif.unread ? "bg-blue-500/5" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${notif.type === "critical" ? "bg-red-500" : "bg-yellow-500"}`}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{notif.title}</div>
                            <div className="text-xs text-gray-400 mt-1">{notif.message}</div>
                            <div className="text-xs text-gray-600 mt-1">{notif.time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            <motion.button
              className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                A
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </motion.button>

            {/* User Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-gray-900/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-4 border-b border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        A
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Admin User</div>
                        <div className="text-xs text-gray-400">admin@chronos.com</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg transition-colors text-left">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white">Mi Perfil</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg transition-colors text-left border-t border-white/5 mt-2">
                      <LogOut className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white">Cerrar Sesión</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
