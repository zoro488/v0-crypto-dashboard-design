'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Bell, 
  ChevronRight, 
  PanelLeftClose, 
  Sun, 
  Moon, 
  Globe, 
  Menu, 
  Plus,
  Sparkles,
  Command,
  Zap,
  Settings,
  LogOut,
  User,
  CreditCard,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/app/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { cn } from '@/app/lib/utils'

interface HeaderProps {
  currentPanel: string
  onToggleSidebar: () => void
}

export default function Header({ currentPanel, onToggleSidebar }: HeaderProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifications] = useState([
    { id: 1, title: 'Nueva venta registrada', time: 'Hace 5 min', type: 'success' },
    { id: 2, title: 'Stock bajo en almacén', time: 'Hace 1 hora', type: 'warning' },
    { id: 3, title: 'Pago recibido de cliente', time: 'Hace 2 horas', type: 'info' },
  ])

  const breadcrumbs = [
    { label: 'CHRONOS', href: '#' },
    { label: currentPanel.charAt(0).toUpperCase() + currentPanel.slice(1), href: '#' },
  ]

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl border-b border-white/10" />
      
      {/* Gradient accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      {/* Content */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 md:px-6 min-h-[60px]">
        
        {/* Left section: Logo + Navigation */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          {/* Mobile menu toggle */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
              onClick={onToggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              {/* Pulse effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-ping opacity-20" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                  CHRONOS
                </h1>
                <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30 text-[10px] px-1.5 py-0">
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  PRO
                </Badge>
              </div>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sistema Activo
              </p>
            </div>
          </motion.div>

          {/* Breadcrumbs - Desktop */}
          <div className="hidden lg:flex items-center gap-2 text-sm ml-4 pl-4 border-l border-white/10">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-600" />}
                <span className={cn(
                  'transition-colors',
                  idx === breadcrumbs.length - 1 
                    ? 'text-white font-medium' 
                    : 'text-slate-500 hover:text-slate-300',
                )}>
                  {crumb.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 order-2 sm:order-3">
          
          {/* Quick Actions - Desktop */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="hidden xl:block">
            <Button className="h-9 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/25 border-0 rounded-xl font-medium text-sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nueva Venta
            </Button>
          </motion.div>

          {/* Quick Actions - Mobile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="xl:hidden h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-black/95 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl">
              <DropdownMenuLabel className="text-slate-400 text-xs">Acciones Rápidas</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-white hover:bg-white/10 rounded-lg cursor-pointer">
                <Zap className="h-4 w-4 mr-2 text-blue-400" />
                Nueva Venta
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-white/10 rounded-lg cursor-pointer">
                <CreditCard className="h-4 w-4 mr-2 text-green-400" />
                Nueva Orden
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-white/10 rounded-lg cursor-pointer">
                <User className="h-4 w-4 mr-2 text-purple-400" />
                Nuevo Cliente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/30">
                  {notifications.length}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-black/95 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl p-0">
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Notificaciones</h3>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-[10px]">
                    {notifications.length} nuevas
                  </Badge>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'h-2 w-2 rounded-full mt-2 flex-shrink-0',
                        notif.type === 'success' && 'bg-emerald-500',
                        notif.type === 'warning' && 'bg-amber-500',
                        notif.type === 'info' && 'bg-blue-500',
                      )} />
                      <div>
                        <p className="text-sm text-white">{notif.title}</p>
                        <p className="text-xs text-slate-500">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-white/10">
                <Button variant="ghost" className="w-full h-8 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                  Ver todas las notificaciones
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
              onClick={toggleTheme}
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-4.5 w-4.5 text-amber-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-4.5 w-4.5 text-blue-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>

          {/* Language - Desktop only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
              >
                <Globe className="h-4.5 w-4.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-black/95 backdrop-blur-xl border-white/10 rounded-xl">
              <DropdownMenuItem className="text-white hover:bg-white/10 rounded-lg">
                🇲🇽 Español
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-400 hover:bg-white/10 rounded-lg">
                🇺🇸 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-xl p-0 hover:bg-white/10">
                <Avatar className="h-9 w-9 ring-2 ring-white/20 ring-offset-2 ring-offset-black">
                  <AvatarImage src="/placeholder.svg" alt="Usuario" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                    JD
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-black" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-black/95 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl">
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">Juan Díaz</p>
                    <p className="text-xs text-slate-500">admin@chronos.mx</p>
                  </div>
                </div>
              </div>
              <div className="p-1">
                <DropdownMenuItem className="text-white hover:bg-white/10 rounded-lg cursor-pointer">
                  <User className="h-4 w-4 mr-2 text-slate-400" />
                  Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-white/10 rounded-lg cursor-pointer">
                  <Settings className="h-4 w-4 mr-2 text-slate-400" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-white/10 rounded-lg cursor-pointer">
                  <HelpCircle className="h-4 w-4 mr-2 text-slate-400" />
                  Ayuda
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              <div className="p-1">
                <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sidebar Toggle - Desktop */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
              onClick={onToggleSidebar}
            >
              <PanelLeftClose className="h-4.5 w-4.5" />
            </Button>
          </motion.div>
        </div>

        {/* Search Bar - Center/Bottom on mobile */}
        <div className="flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md order-3 sm:order-2 w-full sm:w-auto mt-2 sm:mt-0">
          <motion.div 
            className="relative"
            animate={{ 
              scale: searchFocused ? 1.02 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar clientes, productos, ventas..."
              className={cn(
                'pl-9 pr-16 h-9 rounded-xl text-sm w-full transition-all duration-300',
                'bg-white/5 border-white/10 text-white placeholder:text-slate-500',
                'focus:bg-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20',
                searchFocused && 'shadow-lg shadow-blue-500/10',
              )}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-400">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  )
}
