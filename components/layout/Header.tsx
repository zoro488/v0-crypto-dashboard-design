"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Bell, ChevronRight, PanelLeftClose, Sun, Moon, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
    <header className="sticky top-0 z-50 h-18 border-b border-white/10 glass-ultra">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left Section */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer ambient-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-gradient-flow">
              <span className="text-white font-bold text-lg text-apple-display">F</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-apple-display gradient-text">FlowDistributor</h1>
              <p className="text-xs text-slate-500">v3.0 Ultra Premium</p>
            </div>
          </motion.div>

          {/* Breadcrumbs */}
          <div className="hidden md:flex items-center gap-2 text-sm">
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

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar... (Cmd+K)"
              className="pl-10 glass border-white/10 text-white placeholder:text-slate-500 focus:glass-strong transition-all duration-300"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <Button className="hidden lg:flex btn-premium shadow-lg shadow-blue-500/30 text-apple">Nueva Venta</Button>
          <Button
            variant="outline"
            className="hidden lg:flex border-white/10 text-white hover:bg-white/5 bg-transparent"
          >
            Nueva Orden
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5">
              <Bell className="h-5 w-5" />
            </Button>
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-[10px]">
              3
            </Badge>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-white/5"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10">
              <DropdownMenuItem className="text-white">Español</DropdownMenuItem>
              <DropdownMenuItem className="text-slate-400">English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Usuario" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600">JD</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-slate-950" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10">
              <DropdownMenuItem className="text-white">Perfil</DropdownMenuItem>
              <DropdownMenuItem className="text-white">Configuración</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-red-400">Cerrar Sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-white/5"
            onClick={onToggleSidebar}
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
