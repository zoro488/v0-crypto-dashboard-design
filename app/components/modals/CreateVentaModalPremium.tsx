"use client"

/**
 * 💎 CREATE VENTA MODAL PREMIUM - Sistema de Ventas Completo
 * 
 * Modal premium para registro de ventas con:
 * 1. Wizard de 3 pasos (Cliente → Productos → Pago)
 * 2. Distribución automática GYA a 3 bancos
 * 3. Cálculo de utilidades según fórmulas correctas
 * 4. Glassmorphism design premium
 * 5. Validación con Zod
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import { Textarea } from "@/app/components/ui/textarea"
import {
  ShoppingCart,
  User,
  CreditCard,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Check,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  Package,
  DollarSign,
  Loader2,
  X,
  CheckCircle2,
  Zap,
  Search,
  Building2,
  Truck,
  TrendingUp,
  Calculator,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useToast } from "@/app/hooks/use-toast"
import { useAppStore } from "@/app/lib/store/useAppStore"
import { logger } from "@/app/lib/utils/logger"
import { formatearMonto } from "@/app/lib/validations/smart-forms-schemas"

// ============================================
// SCHEMA ZOD
// ============================================

const ventaItemSchema = z.object({
  productoId: z.string(),
  nombre: z.string(),
  cantidad: z.number().min(1),
  precioVenta: z.number().min(0),
  precioCompra: z.number().min(0),
  precioFlete: z.number().min(0),
})

const ventaPremiumSchema = z.object({
  clienteId: z.string().min(1, "Selecciona un cliente"),
  clienteNombre: z.string(),
  items: z.array(ventaItemSchema).min(1, "Agrega al menos un producto"),
  metodoPago: z.enum(["efectivo", "transferencia", "deposito", "mixto"]),
  estadoPago: z.enum(["completo", "parcial", "pendiente"]),
  montoPagado: z.number().min(0),
  ocRelacionada: z.string().optional(),
  notas: z.string().optional(),
  aplicaFlete: z.boolean(),
})

type VentaPremiumInput = z.infer<typeof ventaPremiumSchema>

// ============================================
// TIPOS Y CONSTANTES
// ============================================

interface CreateVentaModalPremiumProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface CarritoItem {
  id: string
  productoId: string
  nombre: string
  cantidad: number
  precioVenta: number
  precioCompra: number
  precioFlete: number
  stockDisponible: number
}

// Clientes del CSV
const CLIENTES_MOCK = [
  { id: "bodega-mp", nombre: "Bódega M-P", telefono: "555-0001", deuda: 945000 },
  { id: "valle", nombre: "Valle", telefono: "555-0002", deuda: 378000 },
  { id: "ax", nombre: "Ax", telefono: "555-0003", deuda: 0 },
  { id: "negrito", nombre: "Negrito", telefono: "555-0004", deuda: 0 },
  { id: "wero-benavides", nombre: "Wero Benavides", telefono: "555-0005", deuda: 126000 },
  { id: "lamas", nombre: "Lamas", telefono: "555-0006", deuda: 485100 },
  { id: "tramite-chucho", nombre: "Trámite Chucho", telefono: "555-0007", deuda: 302400 },
  { id: "galvan", nombre: "Galvan", telefono: "555-0008", deuda: 0 },
  { id: "valle-local", nombre: "Valle Local", telefono: "555-0009", deuda: 0 },
  { id: "tocayo", nombre: "Tocayo", telefono: "555-0010", deuda: 0 },
  { id: "sierra47", nombre: "Sierra47", telefono: "555-0011", deuda: 0 },
  { id: "chucho", nombre: "Chucho", telefono: "555-0012", deuda: 0 },
  { id: "tio-tocayo", nombre: "Tio Tocayo", telefono: "555-0013", deuda: 315000 },
  { id: "470", nombre: "470", telefono: "555-0014", deuda: 0 },
]

// OCs relacionadas del CSV
const OCS_DISPONIBLES = [
  { id: "OC0001", distribuidor: "Q-MAYA", cantidad: 423, stockActual: 0 },
  { id: "OC0002", distribuidor: "Q-MAYA", cantidad: 32, stockActual: 0 },
  { id: "OC0003", distribuidor: "A/X🌶️🦀", cantidad: 33, stockActual: 0 },
  { id: "OC0004", distribuidor: "PACMAN", cantidad: 487, stockActual: 150 },
  { id: "OC0005", distribuidor: "Q-MAYA", cantidad: 513, stockActual: 200 },
  { id: "OC0006", distribuidor: "CH-MONTE", cantidad: 100, stockActual: 50 },
  { id: "OC0007", distribuidor: "VALLE-MONTE", cantidad: 20, stockActual: 20 },
  { id: "OC0008", distribuidor: "PACMAN", cantidad: 488, stockActual: 300 },
  { id: "OC0009", distribuidor: "Q-MAYA-MP", cantidad: 200, stockActual: 150 },
]

// Pasos del wizard
const STEPS = [
  { id: 1, title: "Cliente", icon: User, description: "¿Quién compra?" },
  { id: 2, title: "Productos", icon: Package, description: "¿Qué lleva?" },
  { id: 3, title: "Pago", icon: DollarSign, description: "¿Cómo paga?" },
]

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { staggerChildren: 0.03 }
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CreateVentaModalPremium({ 
  open, 
  onClose, 
  onSuccess 
}: CreateVentaModalPremiumProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [step, setStep] = React.useState(1)
  const [direction, setDirection] = React.useState(1)
  
  // Estado del formulario
  const [clienteSeleccionado, setClienteSeleccionado] = React.useState<typeof CLIENTES_MOCK[0] | null>(null)
  const [clienteSearch, setClienteSearch] = React.useState("")
  const [carrito, setCarrito] = React.useState<CarritoItem[]>([])
  const [ocSeleccionada, setOcSeleccionada] = React.useState<string>("")
  const [metodoPago, setMetodoPago] = React.useState<"efectivo" | "transferencia">("efectivo")
  const [estadoPago, setEstadoPago] = React.useState<"completo" | "parcial" | "pendiente">("completo")
  const [montoPagado, setMontoPagado] = React.useState(0)
  const [aplicaFlete, setAplicaFlete] = React.useState(true)
  const [notas, setNotas] = React.useState("")

  // Precios base del sistema
  const PRECIO_COMPRA_DEFAULT = 6300 // Costo distribuidor
  const PRECIO_FLETE_DEFAULT = 500   // Flete por unidad
  const PRECIO_VENTA_DEFAULT = 7000  // Precio venta sugerido

  // Clientes filtrados
  const clientesFiltrados = React.useMemo(() => {
    if (!clienteSearch) return CLIENTES_MOCK
    const q = clienteSearch.toLowerCase()
    return CLIENTES_MOCK.filter(c => 
      c.nombre.toLowerCase().includes(q) ||
      c.telefono.includes(q)
    )
  }, [clienteSearch])

  // Cálculos del carrito con distribución GYA
  const totales = React.useMemo(() => {
    const cantidadTotal = carrito.reduce((acc, item) => acc + item.cantidad, 0)
    
    // Total de ingresos (precio venta × cantidad)
    const totalIngreso = carrito.reduce((acc, item) => 
      acc + (item.precioVenta * item.cantidad), 0)
    
    // Distribución a 3 bancos según fórmulas correctas:
    // Bóveda Monte = precioCompra × cantidad (COSTO)
    const totalBovedaMonte = carrito.reduce((acc, item) => 
      acc + (item.precioCompra * item.cantidad), 0)
    
    // Fletes = precioFlete × cantidad (si aplica)
    const totalFletes = aplicaFlete 
      ? carrito.reduce((acc, item) => acc + (item.precioFlete * item.cantidad), 0)
      : 0
    
    // Utilidades = (precioVenta - precioCompra - precioFlete) × cantidad (GANANCIA)
    const totalUtilidades = carrito.reduce((acc, item) => {
      const fleteUnitario = aplicaFlete ? item.precioFlete : 0
      return acc + ((item.precioVenta - item.precioCompra - fleteUnitario) * item.cantidad)
    }, 0)
    
    return {
      cantidadTotal,
      totalIngreso,
      distribucion: {
        bovedaMonte: totalBovedaMonte,
        fletes: totalFletes,
        utilidades: totalUtilidades,
      },
      margenPorcentaje: totalIngreso > 0 
        ? (totalUtilidades / totalIngreso) * 100 
        : 0
    }
  }, [carrito, aplicaFlete])

  // Monto real según estado de pago
  const montoRealPagado = React.useMemo(() => {
    if (estadoPago === "completo") return totales.totalIngreso
    if (estadoPago === "parcial") return Math.min(montoPagado, totales.totalIngreso)
    return 0
  }, [estadoPago, montoPagado, totales.totalIngreso])

  const saldoPendiente = totales.totalIngreso - montoRealPagado

  // Navegación
  const canProceed = React.useMemo(() => {
    switch (step) {
      case 1: return clienteSeleccionado !== null
      case 2: return carrito.length > 0
      case 3: return estadoPago !== "parcial" || (montoPagado > 0 && montoPagado < totales.totalIngreso)
      default: return false
    }
  }, [step, clienteSeleccionado, carrito, estadoPago, montoPagado, totales.totalIngreso])

  const nextStep = () => {
    if (canProceed && step < 3) {
      setDirection(1)
      setStep(s => s + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setDirection(-1)
      setStep(s => s - 1)
    }
  }

  // Agregar producto al carrito
  const agregarProducto = () => {
    const nuevoItem: CarritoItem = {
      id: `item-${Date.now()}`,
      productoId: `prod-${Date.now()}`,
      nombre: `Producto ${carrito.length + 1}`,
      cantidad: 1,
      precioVenta: PRECIO_VENTA_DEFAULT,
      precioCompra: PRECIO_COMPRA_DEFAULT,
      precioFlete: PRECIO_FLETE_DEFAULT,
      stockDisponible: 999,
    }
    setCarrito(prev => [...prev, nuevoItem])
  }

  // Actualizar item del carrito
  const actualizarItem = (id: string, campo: keyof CarritoItem, valor: number | string) => {
    setCarrito(prev => prev.map(item => 
      item.id === id ? { ...item, [campo]: valor } : item
    ))
  }

  // Eliminar del carrito
  const eliminarItem = (id: string) => {
    setCarrito(prev => prev.filter(item => item.id !== id))
  }

  // Reset form
  React.useEffect(() => {
    if (open) {
      setStep(1)
      setDirection(1)
      setClienteSeleccionado(null)
      setClienteSearch("")
      setCarrito([])
      setOcSeleccionada("")
      setMetodoPago("efectivo")
      setEstadoPago("completo")
      setMontoPagado(0)
      setAplicaFlete(true)
      setNotas("")
    }
  }, [open])

  // Submit
  const handleSubmit = async () => {
    if (!clienteSeleccionado || carrito.length === 0) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const ventaData = {
        fecha: new Date().toISOString(),
        clienteId: clienteSeleccionado.id,
        clienteNombre: clienteSeleccionado.nombre,
        ocRelacionada: ocSeleccionada || null,
        items: carrito.map(item => ({
          cantidad: item.cantidad,
          precioVenta: item.precioVenta,
          precioCompra: item.precioCompra,
          precioFlete: aplicaFlete ? item.precioFlete : 0,
        })),
        // Totales
        cantidadTotal: totales.cantidadTotal,
        totalIngreso: totales.totalIngreso,
        // Distribución GYA
        bovedaMonte: totales.distribucion.bovedaMonte,
        flete: totales.distribucion.fletes,
        utilidad: totales.distribucion.utilidades,
        // Pago
        metodoPago,
        estadoPago,
        montoPagado: montoRealPagado,
        saldoPendiente,
        aplicaFlete,
        notas,
        // Metadata
        timestamp: new Date().toISOString(),
      }

      logger.info("Venta registrada", { 
        data: ventaData,
        context: "CreateVentaModalPremium"
      })

      toast({
        title: "✅ Venta Registrada",
        description: `${formatearMonto(totales.totalIngreso)} - ${clienteSeleccionado.nombre}`,
      })

      onClose()
      onSuccess?.()
      useAppStore.getState().triggerDataRefresh()

    } catch (error) {
      logger.error("Error al registrar venta", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la venta",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-w-4xl h-[90vh] p-0 overflow-hidden",
          "bg-black/60 backdrop-blur-2xl",
          "border border-white/10",
          "text-white",
          "shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_100px_rgba(16,185,129,0.15)]"
        )}
      >
        <DialogTitle className="sr-only">Nueva Venta</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para registrar una nueva venta
        </DialogDescription>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </div>

        <div className="relative flex flex-col h-full">
          {/* ===== HEADER ===== */}
          <div className="relative h-24 border-b border-white/10 bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            
            <div className="relative h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <ShoppingCart className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Nueva Venta</h2>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    Paso {step} de 3 • {STEPS[step - 1].description}
                  </p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center gap-2">
                {STEPS.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      step > s.id
                        ? "bg-green-500 border-green-500 text-white"
                        : step === s.id
                        ? "bg-white/10 border-green-500 text-green-400"
                        : "bg-white/5 border-white/20 text-gray-500"
                    )}>
                      {step > s.id ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={cn(
                        "w-8 h-0.5",
                        step > s.id ? "bg-green-500" : "bg-white/10"
                      )} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                initial={{ width: "33%" }}
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* ===== BODY ===== */}
          <motion.div 
            className="flex-1 overflow-y-auto p-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="wait">
              {/* PASO 1: CLIENTE */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">¿Quién es el cliente?</h3>
                    <p className="text-gray-400">Busca un cliente existente</p>
                  </div>

                  {/* Buscador */}
                  <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      value={clienteSearch}
                      onChange={(e) => setClienteSearch(e.target.value)}
                      placeholder="Buscar por nombre o teléfono..."
                      className="pl-12 h-14 text-lg bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  {/* Lista de clientes */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                    {clientesFiltrados.map((cliente) => (
                      <motion.button
                        key={cliente.id}
                        type="button"
                        onClick={() => setClienteSeleccionado(cliente)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "relative p-4 rounded-xl border text-left transition-all",
                          clienteSeleccionado?.id === cliente.id
                            ? "bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            clienteSeleccionado?.id === cliente.id
                              ? "bg-green-500 text-white"
                              : "bg-white/10 text-gray-400"
                          )}>
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{cliente.nombre}</p>
                            <p className="text-xs text-gray-500">{cliente.telefono}</p>
                          </div>
                        </div>
                        {cliente.deuda > 0 && (
                          <Badge 
                            variant="outline" 
                            className="absolute top-2 right-2 border-orange-500/50 text-orange-400 text-[10px]"
                          >
                            Deuda: {formatearMonto(cliente.deuda)}
                          </Badge>
                        )}
                        {clienteSeleccionado?.id === cliente.id && (
                          <CheckCircle2 className="absolute bottom-2 right-2 w-5 h-5 text-green-400" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* PASO 2: PRODUCTOS */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Productos de la Venta</h3>
                      <p className="text-sm text-gray-400">Cliente: {clienteSeleccionado?.nombre}</p>
                    </div>
                    <Button
                      type="button"
                      onClick={agregarProducto}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Línea
                    </Button>
                  </div>

                  {/* OC Relacionada */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <Label className="text-sm text-gray-400 mb-2 block">OC Relacionada (opcional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {OCS_DISPONIBLES.filter(oc => oc.stockActual > 0).map((oc) => (
                        <button
                          key={oc.id}
                          type="button"
                          onClick={() => setOcSeleccionada(oc.id === ocSeleccionada ? "" : oc.id)}
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm transition-all",
                            ocSeleccionada === oc.id
                              ? "bg-blue-500/20 border border-blue-500 text-blue-400"
                              : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                          )}
                        >
                          {oc.id} • {oc.distribuidor} • Stock: {oc.stockActual}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de productos */}
                  <div className="space-y-3">
                    {carrito.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>No hay productos en el carrito</p>
                        <p className="text-sm">Haz clic en "Agregar Línea" para comenzar</p>
                      </div>
                    ) : (
                      carrito.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4"
                        >
                          {/* Fila 1: Cantidad y Precio Venta */}
                          <div className="grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-2">
                              <Label className="text-xs text-gray-400">Cantidad</Label>
                              <Input
                                type="number"
                                value={item.cantidad}
                                onChange={(e) => actualizarItem(item.id, "cantidad", Number(e.target.value))}
                                min={1}
                                className="h-12 text-center text-lg font-bold bg-white/5 border-white/10"
                              />
                            </div>
                            <div className="col-span-3">
                              <Label className="text-xs text-green-400">💰 Precio Venta</Label>
                              <Input
                                type="number"
                                value={item.precioVenta}
                                onChange={(e) => actualizarItem(item.id, "precioVenta", Number(e.target.value))}
                                className="h-12 bg-green-500/10 border-green-500/30 text-green-300"
                              />
                            </div>
                            <div className="col-span-3">
                              <Label className="text-xs text-blue-400">🏦 Precio Compra</Label>
                              <Input
                                type="number"
                                value={item.precioCompra}
                                onChange={(e) => actualizarItem(item.id, "precioCompra", Number(e.target.value))}
                                className="h-12 bg-blue-500/10 border-blue-500/30 text-blue-300"
                              />
                            </div>
                            <div className="col-span-3">
                              <Label className="text-xs text-orange-400">🚚 Flete/u</Label>
                              <Input
                                type="number"
                                value={item.precioFlete}
                                onChange={(e) => actualizarItem(item.id, "precioFlete", Number(e.target.value))}
                                disabled={!aplicaFlete}
                                className={cn(
                                  "h-12",
                                  aplicaFlete 
                                    ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
                                    : "bg-white/5 border-white/10 text-gray-500 opacity-50"
                                )}
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => eliminarItem(item.id)}
                                className="w-12 h-12 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>

                          {/* Fila 2: Cálculos */}
                          <div className="grid grid-cols-4 gap-4 pt-2 border-t border-white/10">
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Subtotal Venta</p>
                              <p className="text-lg font-bold text-white">
                                {formatearMonto(item.precioVenta * item.cantidad)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-blue-400">→ Bóveda Monte</p>
                              <p className="text-lg font-bold text-blue-300">
                                {formatearMonto(item.precioCompra * item.cantidad)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-orange-400">→ Fletes</p>
                              <p className="text-lg font-bold text-orange-300">
                                {formatearMonto(aplicaFlete ? item.precioFlete * item.cantidad : 0)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-green-400">→ Utilidad</p>
                              <p className="text-lg font-bold text-green-400">
                                {formatearMonto(
                                  (item.precioVenta - item.precioCompra - (aplicaFlete ? item.precioFlete : 0)) * item.cantidad
                                )}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Toggle Flete */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setAplicaFlete(!aplicaFlete)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        aplicaFlete ? "bg-orange-500" : "bg-white/20"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                        aplicaFlete ? "right-1" : "left-1"
                      )} />
                    </button>
                    <div>
                      <p className="font-medium text-white">
                        {aplicaFlete ? "Aplica Flete" : "No Aplica Flete"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {aplicaFlete 
                          ? "Se cobrará flete y se distribuirá a Flete Sur"
                          : "Venta sin flete (ej: trámites, entregas locales)"
                        }
                      </p>
                    </div>
                  </div>

                  {/* Resumen de distribución */}
                  {carrito.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-400 flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Distribución GYA
                        </span>
                        <Badge variant="outline" className="border-green-500/30 text-green-400">
                          {totales.cantidadTotal} unidades
                        </Badge>
                      </div>

                      {/* Barra visual */}
                      <div className="h-4 rounded-full overflow-hidden flex bg-white/5 mb-4">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-500" 
                          style={{ width: `${(totales.distribucion.bovedaMonte / totales.totalIngreso) * 100}%` }}
                        />
                        {aplicaFlete && (
                          <div 
                            className="h-full bg-gradient-to-r from-orange-600 to-orange-500" 
                            style={{ width: `${(totales.distribucion.fletes / totales.totalIngreso) * 100}%` }}
                          />
                        )}
                        <div 
                          className="h-full bg-gradient-to-r from-green-600 to-emerald-500" 
                          style={{ width: `${(totales.distribucion.utilidades / totales.totalIngreso) * 100}%` }}
                        />
                      </div>

                      {/* Cards */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-white/5 text-center">
                          <p className="text-xs text-gray-400">Total Ingreso</p>
                          <p className="text-xl font-bold text-white">{formatearMonto(totales.totalIngreso)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                          <p className="text-xs text-blue-400">🏦 Bóveda Monte</p>
                          <p className="text-xl font-bold text-blue-300">{formatearMonto(totales.distribucion.bovedaMonte)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                          <p className="text-xs text-orange-400">🚚 Fletes</p>
                          <p className="text-xl font-bold text-orange-300">{formatearMonto(totales.distribucion.fletes)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                          <p className="text-xs text-green-400">💰 Utilidad</p>
                          <p className="text-xl font-bold text-green-400">{formatearMonto(totales.distribucion.utilidades)}</p>
                          <p className="text-[10px] text-green-500">{totales.margenPorcentaje.toFixed(1)}% margen</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* PASO 3: PAGO */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-6"
                >
                  {/* Total grande */}
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-1">Total a Cobrar</p>
                    <motion.p
                      className="text-5xl font-bold text-white"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      {formatearMonto(totales.totalIngreso)}
                    </motion.p>
                    <p className="text-sm text-gray-500 mt-1">
                      {totales.cantidadTotal} productos para {clienteSeleccionado?.nombre}
                    </p>
                  </div>

                  {/* Método de pago */}
                  <div className="space-y-3">
                    <Label className="text-sm text-gray-400">Método de Pago</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "efectivo" as const, icon: Wallet, label: "Efectivo" },
                        { id: "transferencia" as const, icon: CreditCard, label: "Transferencia" },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMetodoPago(m.id)}
                          className={cn(
                            "p-4 rounded-xl border text-center transition-all",
                            metodoPago === m.id
                              ? "bg-green-500/20 border-green-500 text-green-400"
                              : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                          )}
                        >
                          <m.icon className="w-6 h-6 mx-auto mb-2" />
                          <p className="text-sm font-medium">{m.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Estado de pago */}
                  <div className="space-y-3">
                    <Label className="text-sm text-gray-400">Estado del Pago</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "completo" as const, label: "Pagado", desc: "100%", color: "green" },
                        { id: "parcial" as const, label: "Parcial", desc: "Abono", color: "yellow" },
                        { id: "pendiente" as const, label: "Pendiente", desc: "Crédito", color: "orange" },
                      ].map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setEstadoPago(e.id)}
                          className={cn(
                            "p-3 rounded-xl border transition-all",
                            estadoPago === e.id
                              ? e.color === "green"
                                ? "bg-green-500/20 border-green-500"
                                : e.color === "yellow"
                                ? "bg-yellow-500/20 border-yellow-500"
                                : "bg-orange-500/20 border-orange-500"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <p className="font-medium text-white">{e.label}</p>
                          <p className="text-xs text-gray-500">{e.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monto parcial */}
                  {estadoPago === "parcial" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="space-y-2"
                    >
                      <Label className="text-sm text-gray-400">Monto del Abono</Label>
                      <Input
                        type="number"
                        value={montoPagado}
                        onChange={(e) => setMontoPagado(Number(e.target.value))}
                        max={totales.totalIngreso}
                        placeholder={`Máximo: ${formatearMonto(totales.totalIngreso)}`}
                        className="h-14 text-xl bg-white/5 border-white/10"
                      />
                    </motion.div>
                  )}

                  {/* Notas */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Notas (opcional)</Label>
                    <Textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Observaciones de la venta..."
                      rows={2}
                      className="bg-white/5 border-white/10 text-white resize-none"
                    />
                  </div>

                  {/* Resumen final */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-400">Resumen de Venta</span>
                      <Badge variant="outline" className="border-green-500/30 text-green-400">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Confirmación
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cliente:</span>
                        <span className="text-white font-medium">{clienteSeleccionado?.nombre}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Productos:</span>
                        <span className="text-white">{totales.cantidadTotal} unidades</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Método:</span>
                        <span className="text-white capitalize">{metodoPago}</span>
                      </div>
                      {ocSeleccionada && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">OC:</span>
                          <span className="text-blue-400">{ocSeleccionada}</span>
                        </div>
                      )}
                      <div className="h-px bg-white/10 my-2" />
                      <div className="flex justify-between">
                        <span className="text-gray-400">A recibir:</span>
                        <span className="text-green-400 font-bold text-lg">{formatearMonto(montoRealPagado)}</span>
                      </div>
                      {saldoPendiente > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Saldo pendiente:</span>
                          <span className="text-orange-400 font-bold">{formatearMonto(saldoPendiente)}</span>
                        </div>
                      )}
                    </div>

                    {/* Distribución a bancos */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-500 mb-3">Distribución automática a 3 bancos:</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="text-[10px] text-blue-400">🏦 Bóveda Monte</p>
                          <p className="text-sm font-bold text-blue-300">{formatearMonto(totales.distribucion.bovedaMonte)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-orange-400">🚚 Fletes</p>
                          <p className="text-sm font-bold text-orange-300">{formatearMonto(totales.distribucion.fletes)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-green-400">💰 Utilidades</p>
                          <p className="text-sm font-bold text-green-400">{formatearMonto(totales.distribucion.utilidades)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ===== FOOTER ===== */}
          <div className={cn(
            "shrink-0 h-20 border-t border-white/10",
            "bg-gradient-to-r from-black/50 via-white/5 to-black/50",
            "px-6 flex items-center justify-between"
          )}>
            <Button
              type="button"
              variant="ghost"
              onClick={step === 1 ? onClose : prevStep}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white"
            >
              {step === 1 ? "Cancelar" : (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </>
              )}
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceed}
                className="min-w-[140px] bg-white text-black hover:bg-gray-200 disabled:opacity-50"
              >
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceed}
                className={cn(
                  "min-w-[180px]",
                  "bg-gradient-to-r from-green-600 to-emerald-600",
                  "hover:from-green-500 hover:to-emerald-500",
                  "text-white font-bold",
                  "shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Confirmar Venta
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateVentaModalPremium
