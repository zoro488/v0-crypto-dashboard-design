"use client"

import { motion } from "framer-motion"
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Warehouse,
  Users,
  UserCheck,
  BarChart3,
  ChevronDown,
  Building2,
  DollarSign,
  Truck,
  PiggyBank,
  Wallet,
} from "lucide-react"
import { Button } from "@/frontend/app/components/ui/button"
import { Badge } from "@/frontend/app/components/ui/badge"
import { ScrollArea } from "@/frontend/app/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/frontend/app/components/ui/collapsible"
import { useState } from "react"
import type { Banco } from "@/frontend/app/types"

interface SidebarProps {
  collapsed: boolean
  currentPanel: string
  onPanelChange: (panel: string) => void
  selectedBanco: Banco
  onBancoChange: (banco: Banco) => void
}

const MENU_ITEMS = [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: "NEW" }]

const OPERACIONES = [
  { id: "ordenes", label: "Órdenes de Compra", icon: ShoppingCart, badge: "23" },
  { id: "ventas", label: "Ventas", icon: TrendingUp, badge: "47" },
  { id: "almacen", label: "Almacén", icon: Warehouse, badge: null },
]

const GESTION = [
  { id: "distribuidores", label: "Distribuidores", icon: Users, badge: null },
  { id: "clientes", label: "Clientes", icon: UserCheck, badge: null },
  { id: "reportes", label: "Reportes", icon: BarChart3, badge: "AI" },
]

export default function Sidebar({
  collapsed,
  currentPanel,
  onPanelChange,
  selectedBanco,
  onBancoChange,
}: SidebarProps) {
  const [bancosOpen, setBancosOpen] = useState(true)

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 288 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className="fixed left-0 top-18 h-[calc(100vh-72px)] bg-black/30 backdrop-blur-xl border-r border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-20"
    >
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {/* Dashboard */}
          <div className="space-y-1">
            {MENU_ITEMS.map((item) => (
              <SidebarItem
                key={item.id}
                {...item}
                collapsed={collapsed}
                active={currentPanel === item.id}
                onClick={() => onPanelChange(item.id)}
              />
            ))}
          </div>

          {/* Operaciones */}
          {!collapsed && (
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Operaciones</p>
              {OPERACIONES.map((item) => (
                <SidebarItem
                  key={item.id}
                  {...item}
                  collapsed={collapsed}
                  active={currentPanel === item.id}
                  onClick={() => onPanelChange(item.id)}
                />
              ))}
            </div>
          )}

          {/* Bancos */}
          <Collapsible open={bancosOpen} onOpenChange={setBancosOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full justify-between text-slate-400 hover:text-white hover:bg-white/5 ${
                  collapsed ? "px-2" : "px-3"
                }`}
              >
                {!collapsed && (
                  <>
                    <span className="text-xs font-semibold uppercase tracking-wider">Bancos</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${bancosOpen ? "rotate-180" : ""}`} />
                  </>
                )}
                {collapsed && <Building2 className="h-5 w-5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              <BancoSelector
                collapsed={collapsed}
                selectedBanco={selectedBanco}
                onBancoChange={onBancoChange}
                onViewBanco={() => onPanelChange("banco")}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Gestión */}
          {!collapsed && (
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gestión</p>
              {GESTION.map((item) => (
                <SidebarItem
                  key={item.id}
                  {...item}
                  collapsed={collapsed}
                  active={currentPanel === item.id}
                  onClick={() => onPanelChange(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="text-xs text-slate-400 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-apple">v3.0.0 Ultra</span>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-ripple" />
                  <span>En línea</span>
                </div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </motion.aside>
  )
}

interface SidebarItemProps {
  id: string
  label: string
  icon: any
  badge?: string | null
  collapsed: boolean
  active: boolean
  onClick: () => void
}

function SidebarItem({ label, icon: Icon, badge, collapsed, active, onClick }: SidebarItemProps) {
  return (
    <motion.div whileHover={{ x: collapsed ? 0 : 4 }} whileTap={{ scale: 0.98 }}>
      <Button
        variant={active ? "default" : "ghost"}
        className={`w-full justify-start gap-3 transition-all duration-300 ${
          active
            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        } ${collapsed ? "px-2" : "px-3"}`}
        onClick={onClick}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left text-apple">{label}</span>
            {badge && (
              <Badge
                variant={badge === "AI" ? "default" : "secondary"}
                className={`${badge === "AI" ? "bg-gradient-to-r from-purple-600 to-pink-600 animate-gradient-flow" : ""} text-[10px]`}
              >
                {badge}
              </Badge>
            )}
          </>
        )}
      </Button>
    </motion.div>
  )
}

interface BancoSelectorProps {
  collapsed: boolean
  selectedBanco: Banco
  onBancoChange: (banco: Banco) => void
  onViewBanco: () => void
}

function BancoSelector({ collapsed, selectedBanco, onBancoChange, onViewBanco }: BancoSelectorProps) {
  const BANCOS: Banco[] = [
    {
      id: "boveda_monte",
      nombre: "Bóveda Monte",
      icon: "building",
      color: "from-blue-500 to-blue-700",
      tipo: "boveda",
      descripcion: "Cuenta operativa principal",
      moneda: "MXN",
      capitalActual: 2450000,
      capitalInicial: 2000000,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: "activo",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "boveda_usa",
      nombre: "Bóveda USA",
      icon: "flag",
      color: "from-red-500 via-white to-blue-500",
      tipo: "boveda",
      descripcion: "Cuenta internacional",
      moneda: "USD",
      capitalActual: 128005,
      capitalInicial: 100000,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: "activo",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  return (
    <div className="space-y-1">
      {BANCOS.map((banco) => (
        <Button
          key={banco.id}
          variant="ghost"
          className={`w-full ${collapsed ? "px-2" : "px-3"} py-6 ${
            selectedBanco.id === banco.id
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          onClick={() => {
            onBancoChange(banco)
            onViewBanco()
          }}
        >
          <div
            className={`h-8 w-8 rounded-lg bg-gradient-to-br ${banco.color} flex items-center justify-center flex-shrink-0`}
          >
            {banco.icon === "building" && <Building2 className="h-4 w-4 text-white" />}
            {banco.icon === "flag" && <DollarSign className="h-4 w-4 text-white" />}
            {banco.icon === "diamond" && <PiggyBank className="h-4 w-4 text-white" />}
            {banco.icon === "truck" && <Truck className="h-4 w-4 text-white" />}
            {banco.icon === "store" && <Building2 className="h-4 w-4 text-white" />}
            {banco.icon === "briefcase" && <Wallet className="h-4 w-4 text-white" />}
            {banco.icon === "trending-up" && <TrendingUp className="h-4 w-4 text-white" />}
          </div>
          {!collapsed && (
            <div className="flex-1 text-left ml-3">
              <p className="text-sm font-medium">{banco.nombre}</p>
              <p className={`text-xs ${banco.capitalActual < 0 ? "text-red-400" : "text-green-400"}`}>
                ${banco.capitalActual.toLocaleString("es-MX")}
              </p>
            </div>
          )}
          {!collapsed && (
            <div className={`h-2 w-2 rounded-full ${banco.estado === "activo" ? "bg-green-500" : "bg-red-500"}`} />
          )}
        </Button>
      ))}
    </div>
  )
}
