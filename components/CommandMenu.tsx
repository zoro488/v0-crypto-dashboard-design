"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  FileText,
  DollarSign,
  Sparkles,
  Calculator,
  Settings,
  HelpCircle,
} from "lucide-react"
import { Dialog, DialogContent } from "@/frontend/app/components/ui/dialog"
import { Input } from "@/frontend/app/components/ui/input"
import { ScrollArea } from "@/frontend/app/components/ui/scroll-area"
import { Badge } from "@/frontend/app/components/ui/badge"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"

interface Command {
  id: string
  title: string
  description: string
  icon: React.ElementType
  keywords: string[]
  action: () => void
  badge?: string
}

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const { setCurrentPanel } = useAppStore()
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const commands: Command[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Vista general del sistema",
      icon: LayoutDashboard,
      keywords: ["inicio", "home", "panel", "overview"],
      action: () => {
        setCurrentPanel("dashboard")
        setOpen(false)
      },
    },
    {
      id: "ventas",
      title: "Ventas",
      description: "Gestión de ventas y pedidos",
      icon: ShoppingCart,
      keywords: ["sales", "pedidos", "orders"],
      action: () => {
        setCurrentPanel("ventas")
        setOpen(false)
      },
    },
    {
      id: "almacen",
      title: "Almacén",
      description: "Control de inventario",
      icon: Package,
      keywords: ["inventory", "productos", "stock"],
      action: () => {
        setCurrentPanel("almacen")
        setOpen(false)
      },
    },
    {
      id: "clientes",
      title: "Clientes",
      description: "Base de datos de clientes",
      icon: Users,
      keywords: ["customers", "contactos", "contacts"],
      action: () => {
        setCurrentPanel("clientes")
        setOpen(false)
      },
    },
    {
      id: "distribuidores",
      title: "Distribuidores",
      description: "Gestión de distribuidores",
      icon: TrendingUp,
      keywords: ["suppliers", "proveedores", "vendors"],
      action: () => {
        setCurrentPanel("distribuidores")
        setOpen(false)
      },
    },
    {
      id: "ordenes",
      title: "Órdenes de Compra",
      description: "Órdenes de compra pendientes",
      icon: FileText,
      keywords: ["purchase", "compras", "po"],
      action: () => {
        setCurrentPanel("ordenes")
        setOpen(false)
      },
    },
    {
      id: "banco",
      title: "Banco",
      description: "Gestión financiera y cuentas",
      icon: DollarSign,
      keywords: ["finance", "finanzas", "money", "dinero"],
      action: () => {
        setCurrentPanel("banco")
        setOpen(false)
      },
    },
    {
      id: "reportes",
      title: "Reportes",
      description: "Informes y análisis",
      icon: FileText,
      keywords: ["reports", "analytics", "análisis"],
      action: () => {
        setCurrentPanel("reportes")
        setOpen(false)
      },
    },
    {
      id: "ia",
      title: "Asistente IA",
      description: "Asistente inteligente Chronos",
      icon: Sparkles,
      keywords: ["ai", "assistant", "chatbot", "help"],
      badge: "Beta",
      action: () => {
        setCurrentPanel("ia")
        setOpen(false)
      },
    },
    {
      id: "profit",
      title: "Profit Calculator",
      description: "Calculadora de ganancias",
      icon: Calculator,
      keywords: ["calculator", "calculadora", "profit", "ganancias"],
      action: () => {
        setCurrentPanel("profit")
        setOpen(false)
      },
    },
  ]

  const filteredCommands = React.useMemo(() => {
    if (!search) return commands

    const searchLower = search.toLowerCase()
    return commands.filter(
      (command) =>
        command.title.toLowerCase().includes(searchLower) ||
        command.description.toLowerCase().includes(searchLower) ||
        command.keywords.some((keyword) => keyword.includes(searchLower))
    )
  }, [search])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <div className="flex items-center border-b px-4">
          <Search className="w-5 h-5 text-muted-foreground mr-2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar comandos... (Cmd+K)"
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-2">
            <AnimatePresence mode="wait">
              {filteredCommands.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center py-8 text-muted-foreground"
                >
                  No se encontraron comandos
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  {filteredCommands.map((command, index) => {
                    const Icon = command.icon
                    return (
                      <motion.button
                        key={command.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={command.action}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {command.title}
                            </p>
                            {command.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {command.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {command.description}
                          </p>
                        </div>
                      </motion.button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <div className="border-t px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>Usa las flechas para navegar</span>
          <kbd className="px-2 py-1 rounded bg-muted font-mono">
            ⌘K
          </kbd>
        </div>
      </DialogContent>
    </Dialog>
  )
}
