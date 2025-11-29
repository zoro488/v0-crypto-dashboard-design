"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Bell, ChevronRight, PanelLeftClose, Sun, Moon, Globe, Menu, Plus } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Badge } from "@/app/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"

interface HeaderProps {
  currentPanel: string
  onToggleSidebar: () => void
}

export default function Header({ currentPanel, onToggleSidebar }: HeaderProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [searchOpen, setSearchOpen] = useState(false)

  const breadcrumbs = [
    { label: "Inicio", href: "#" },
    { label: currentPanel.charAt(0).toUpperCase() + currentPanel.slice(1), href: "#" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 glass-ultra w-full">
      {/* Contenedor principal - responsivo */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 md:px-6 min-h-[56px]">
        
        {/* ===== FILA 1: Logo + Acciones principales ===== */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Sidebar Toggle - Mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-white/5 md:hidden h-8 w-8"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <motion.div
            className="flex items-center gap-2 cursor-pointer ambient-glow"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-gradient-flow flex-shrink-0">
              <span className="text-white font-bold text-sm sm:text-lg text-apple-display">F</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-xl font-bold text-apple-display gradient-text whitespace-nowrap">FlowDistributor</h1>
              <p className="text-[10px] sm:text-xs text-slate-500">v3.0 Ultra Premium</p>
            </div>
          </motion.div>

          {/* Breadcrumbs - Solo desktop */}
          <div className="hidden lg:flex items-center gap-2 text-sm ml-4">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-600" />}
                <span className={idx === breadcrumbs.length - 1 ? "text-white font-semibold" : "text-slate-500"}>
                  {crumb.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Acciones Derecha ===== */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 order-2 sm:order-3">
          
          {/* Quick Actions - Desktop */}
          <Button className="hidden xl:flex btn-premium shadow-lg shadow-blue-500/30 text-apple text-sm h-9">
            Nueva Venta
          </Button>
          <Button
            variant="outline"
            className="hidden xl:flex border-white/10 text-white hover:bg-white/5 bg-transparent text-sm h-9"
          >
            Nueva Orden
          </Button>

          {/* Quick Actions - Mobile (Dropdown) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="xl:hidden text-slate-400 hover:text-white hover:bg-white/5 h-8 w-8 sm:h-9 sm:w-9"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-white/10">
              <DropdownMenuItem className="text-white">Nueva Venta</DropdownMenuItem>
              <DropdownMenuItem className="text-white">Nueva Orden</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-white">Nuevo Cliente</DropdownMenuItem>
              <DropdownMenuItem className="text-white">Nuevo Producto</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5 h-8 w-8 sm:h-9 sm:w-9">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-[9px] sm:text-[10px]">
              3
            </Badge>
          </div>

          {/* Theme Toggle - Oculto en móvil muy pequeño */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden xs:flex text-slate-400 hover:text-white hover:bg-white/5 h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>

          {/* Language - Solo tablet+ */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex text-slate-400 hover:text-white hover:bg-white/5 h-8 w-8 sm:h-9 sm:w-9">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-white/10">
              <DropdownMenuItem className="text-white">Español</DropdownMenuItem>
              <DropdownMenuItem className="text-slate-400">English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0">
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Usuario" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs sm:text-sm">JD</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500 border-2 border-slate-950" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-white/10">
              <DropdownMenuItem className="text-white">Perfil</DropdownMenuItem>
              <DropdownMenuItem className="text-white">Configuración</DropdownMenuItem>
              {/* Opciones adicionales para móvil */}
              <DropdownMenuSeparator className="bg-white/10 sm:hidden" />
              <DropdownMenuItem className="text-white sm:hidden" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-red-400">Cerrar Sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sidebar Toggle - Desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-slate-400 hover:text-white hover:bg-white/5 h-8 w-8 sm:h-9 sm:w-9"
            onClick={onToggleSidebar}
          >
            <PanelLeftClose className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* ===== Search - Se adapta al espacio disponible ===== */}
        <div className="flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md order-3 sm:order-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar..."
              className="pl-9 pr-3 h-8 sm:h-9 glass border-white/10 text-white placeholder:text-slate-500 focus:glass-strong transition-all duration-300 text-sm w-full"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            />
            <kbd className="hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-400">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>
    </header>
  )
}
