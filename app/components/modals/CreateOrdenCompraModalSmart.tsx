"use client"

/**
 * 📦 CREATE ORDEN COMPRA MODAL - Smart Form
 * 
 * Modal para crear órdenes de compra con:
 * 1. Progressive Disclosure (3 pasos)
 * 2. HybridCombobox para Distribuidor y Productos
 * 3. Cálculo automático de costos
 * 4. Distribución a bancos
 * 5. Glassmorphism futurista
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Truck,
  Package,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Check,
  Trash2,
  Plus,
  Minus,
  Loader2,
  X,
  Building2,
  Calculator,
  Zap,
  Wallet,
  CreditCard,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { HybridCombobox } from "@/app/components/ui/hybrid-combobox"
import { useToast } from "@/app/hooks/use-toast"
import { useAppStore } from "@/app/lib/store/useAppStore"
import { logger } from "@/app/lib/utils/logger"
import { formatearMonto, generarKeywords } from "@/app/lib/validations/smart-forms-schemas"
import {
  collection,
  doc,
  runTransaction,
  Timestamp,
  increment,
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "@/app/lib/firebase/config"

// ============================================
// TIPOS
// ============================================

interface CreateOrdenCompraModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface DistribuidorSeleccionado {
  id: string
  nombre: string
  contacto?: string
  telefono?: string
  deudaTotal?: number
}

interface ItemOrden {
  id: string
  productoId: string
  nombre: string
  cantidad: number
  costoUnitario: number
  subtotal: number
}

type EstadoPago = "completo" | "parcial" | "pendiente"

// Pasos del wizard
const STEPS = [
  { id: 1, title: "Proveedor", icon: Building2, description: "¿A quién le compramos?" },
  { id: 2, title: "Productos", icon: Package, description: "¿Qué pedimos?" },
  { id: 3, title: "Costos", icon: DollarSign, description: "¿Cuánto pagamos?" },
]

// Bancos disponibles para pago
const BANCOS = [
  { id: "boveda_monte", nombre: "Bóveda Monte", color: "blue" },
  { id: "boveda_usa", nombre: "Bóveda USA", color: "green" },
  { id: "profit", nombre: "Profit", color: "purple" },
  { id: "leftie", nombre: "Leftie", color: "orange" },
  { id: "azteca", nombre: "Azteca", color: "red" },
]

// Variantes de animación
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.95,
  }),
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CreateOrdenCompraModal({ open, onClose, onSuccess }: CreateOrdenCompraModalProps) {
  const { toast } = useToast()
  
  // Estado del wizard
  const [step, setStep] = React.useState(1)
  const [direction, setDirection] = React.useState(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  // Estado del formulario
  const [distribuidor, setDistribuidor] = React.useState<DistribuidorSeleccionado | null>(null)
  const [items, setItems] = React.useState<ItemOrden[]>([])
  const [costoEnvio, setCostoEnvio] = React.useState(0)
  const [otrosCostos, setOtrosCostos] = React.useState(0)
  const [estadoPago, setEstadoPago] = React.useState<EstadoPago>("pendiente")
  const [montoPagado, setMontoPagado] = React.useState(0)
  const [bancoOrigen, setBancoOrigen] = React.useState("boveda_monte")
  const [notas, setNotas] = React.useState("")

  // Cálculos
  const totales = React.useMemo(() => {
    const subtotalProductos = items.reduce((acc, item) => acc + item.subtotal, 0)
    const total = subtotalProductos + costoEnvio + otrosCostos
    const cantidadItems = items.reduce((acc, item) => acc + item.cantidad, 0)
    
    return {
      subtotalProductos,
      costoEnvio,
      otrosCostos,
      total,
      cantidadItems,
    }
  }, [items, costoEnvio, otrosCostos])

  // Monto real pagado
  const montoRealPagado = React.useMemo(() => {
    if (estadoPago === "completo") return totales.total
    if (estadoPago === "parcial") return Math.min(montoPagado, totales.total)
    return 0
  }, [estadoPago, montoPagado, totales.total])

  const deudaGenerada = totales.total - montoRealPagado

  // Validación por paso
  const canProceed = React.useMemo(() => {
    switch (step) {
      case 1:
        return distribuidor !== null
      case 2:
        return items.length > 0
      case 3:
        return estadoPago !== "parcial" || (montoPagado > 0 && montoPagado < totales.total)
      default:
        return false
    }
  }, [step, distribuidor, items, estadoPago, montoPagado, totales.total])

  // Navegación
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

  // Seleccionar distribuidor
  const handleSelectDistribuidor = (item: DistribuidorSeleccionado) => {
    setDistribuidor(item)
    setTimeout(() => {
      setDirection(1)
      setStep(2)
    }, 300)
  }

  // Agregar producto
  const agregarProducto = (producto: {
    id: string
    nombre: string
    precioCompra?: number
    precio_compra?: number
  }) => {
    const costoUnitario = producto.precioCompra ?? producto.precio_compra ?? 0
    
    setItems(prev => {
      const existe = prev.find(item => item.productoId === producto.id)
      
      if (existe) {
        return prev.map(item =>
          item.productoId === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.costoUnitario,
              }
            : item
        )
      }
      
      const nuevoItem: ItemOrden = {
        id: `oc-${Date.now()}`,
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        costoUnitario,
        subtotal: costoUnitario,
      }
      
      return [...prev, nuevoItem]
    })
    
    toast({
      title: `📦 ${producto.nombre}`,
      description: "Agregado a la orden",
    })
  }

  // Actualizar cantidad
  const actualizarCantidad = (itemId: string, delta: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item
        const nuevaCantidad = Math.max(1, item.cantidad + delta)
        return {
          ...item,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * item.costoUnitario,
        }
      })
    )
  }

  // Actualizar costo
  const actualizarCosto = (itemId: string, nuevoCosto: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item
        return {
          ...item,
          costoUnitario: Math.max(0, nuevoCosto),
          subtotal: item.cantidad * Math.max(0, nuevoCosto),
        }
      })
    )
  }

  // Eliminar item
  const eliminarItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  // Procesar orden
  const handleSubmit = async () => {
    if (!distribuidor || items.length === 0) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Verificar que Firestore está disponible
    if (!isFirebaseConfigured || !db) {
      toast({
        title: "Error de conexión",
        description: "Firebase no está configurado. Por favor verifica tu conexión.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Crear referencia local para TypeScript (after null check)
    const firestore = db

    try {
      await runTransaction(firestore, async (transaction) => {
        // 1. Crear la orden de compra
        const ordenRef = doc(collection(firestore, "ordenes_compra"))
        
        const ordenData = {
          // Identificadores
          distribuidorId: distribuidor.id,
          distribuidorNombre: distribuidor.nombre,
          
          // Snapshot inmutable
          distribuidorSnapshot: {
            nombre: distribuidor.nombre,
            contacto: distribuidor.contacto || null,
            telefono: distribuidor.telefono || null,
          },
          
          // Items
          items: items.map(item => ({
            productoId: item.productoId,
            productoNombre: item.nombre,
            cantidad: item.cantidad,
            costoUnitario: item.costoUnitario,
            subtotal: item.subtotal,
          })),
          
          // Costos
          subtotalProductos: totales.subtotalProductos,
          costoEnvio,
          otrosCostos,
          costoTotal: totales.total,
          
          // Pago
          estadoPago: estadoPago === "completo" ? "pagado" : estadoPago,
          montoPagado: montoRealPagado,
          deuda: deudaGenerada,
          bancoOrigen: montoRealPagado > 0 ? bancoOrigen : null,
          
          // Metadata
          moneda: "MXN",
          notas: notas || null,
          keywords: generarKeywords(distribuidor.nombre),
          estado: "pendiente", // pendiente de recibir mercancía
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
        
        transaction.set(ordenRef, ordenData)

        // 2. Actualizar deuda del distribuidor
        if (deudaGenerada > 0) {
          const distribuidorRef = doc(firestore, "distribuidores", distribuidor.id)
          transaction.update(distribuidorRef, {
            deudaTotal: increment(deudaGenerada),
            totalOrdenesCompra: increment(totales.total),
            numeroOrdenes: increment(1),
            updatedAt: Timestamp.now(),
          })
        }

        // 3. Crear egreso bancario si hay pago
        if (montoRealPagado > 0) {
          const movimientoRef = doc(collection(firestore, "movimientos"))
          transaction.set(movimientoRef, {
            tipo: "egreso",
            bancoOrigenId: bancoOrigen,
            monto: montoRealPagado,
            moneda: "MXN",
            categoria: "compra",
            referenciaId: ordenRef.id,
            referenciaTipo: "ordenCompra",
            concepto: `Orden de compra a ${distribuidor.nombre}`,
            createdAt: Timestamp.now(),
          })

          // 4. Actualizar saldo del banco
          const bancoRef = doc(firestore, "bancos", bancoOrigen)
          transaction.update(bancoRef, {
            saldo: increment(-montoRealPagado),
            updatedAt: Timestamp.now(),
          })
        }
      })

      toast({
        title: "✅ Orden Creada",
        description: `Total: ${formatearMonto(totales.total)}${deudaGenerada > 0 ? ` | Deuda: ${formatearMonto(deudaGenerada)}` : ""}`,
      })

      resetForm()
      onClose()
      onSuccess?.()
      
      // Refrescar datos en la UI
      useAppStore.getState().triggerDataRefresh()

    } catch (error) {
      logger.error("Error creando orden de compra", error)
      toast({
        title: "Error",
        description: "No se pudo crear la orden",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setStep(1)
    setDirection(1)
    setDistribuidor(null)
    setItems([])
    setCostoEnvio(0)
    setOtrosCostos(0)
    setEstadoPago("pendiente")
    setMontoPagado(0)
    setBancoOrigen("boveda_monte")
    setNotas("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "max-w-3xl h-[90vh] max-h-[700px] p-0",
          "bg-black/95 border-white/10 backdrop-blur-2xl",
          "text-white overflow-hidden flex flex-col",
          "shadow-[0_0_100px_rgba(0,0,0,0.8)]"
        )}
      >
        <DialogTitle className="sr-only">Nueva Orden de Compra</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para crear una nueva orden de compra a distribuidor
        </DialogDescription>

        {/* ===== HEADER ===== */}
        <div className="relative h-20 border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          
          <div className="relative h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Nueva Orden de Compra</h2>
                <p className="text-sm text-gray-400">
                  Paso {step} de 3 • {STEPS[step - 1].description}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="w-10 h-10 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-400"
              initial={{ width: "33%" }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div className="flex-1 overflow-hidden flex">
          {/* Steps Sidebar */}
          <div className="w-48 border-r border-white/10 bg-white/[0.02] p-4 hidden md:block">
            <div className="space-y-4">
              {STEPS.map((s, index) => {
                const isCompleted = step > s.id
                const isCurrent = step === s.id
                
                return (
                  <div key={s.id} className="relative">
                    {index < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-5 top-12 w-0.5 h-8",
                          isCompleted ? "bg-blue-500" : "bg-white/10"
                        )}
                      />
                    )}
                    
                    <div className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-all",
                      isCurrent && "bg-white/5"
                    )}>
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                          isCompleted
                            ? "bg-blue-500 border-blue-500 text-white"
                            : isCurrent
                            ? "bg-white/10 border-blue-500 text-blue-400"
                            : "bg-white/5 border-white/20 text-gray-500"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <s.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isCurrent ? "text-white" : isCompleted ? "text-blue-400" : "text-gray-500"
                        )}
                      >
                        {s.title}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Mini resumen */}
            {items.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-xs text-gray-500 mb-2">Resumen</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Items:</span>
                    <span className="text-white">{totales.cantidadItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-blue-400 font-bold">
                      {formatearMonto(totales.total)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <AnimatePresence mode="wait" custom={direction}>
              
              {/* ===== PASO 1: DISTRIBUIDOR ===== */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="h-full flex flex-col"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      ¿A quién le compramos?
                    </h3>
                    <p className="text-gray-400">
                      Selecciona un distribuidor o crea uno nuevo
                    </p>
                  </div>

                  <div className="max-w-md mx-auto w-full">
                    <HybridCombobox
                      collectionName="distribuidores"
                      label="Distribuidor"
                      value={distribuidor?.id}
                      onSelect={handleSelectDistribuidor}
                      placeholder="Escribe nombre del distribuidor..."
                    />
                  </div>

                  <AnimatePresence>
                    {distribuidor && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mt-6 max-w-md mx-auto w-full"
                      >
                        <div className={cn(
                          "p-4 rounded-xl border",
                          "bg-blue-500/10 border-blue-500/30"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{distribuidor.nombre}</p>
                              {distribuidor.contacto && (
                                <p className="text-sm text-gray-400">{distribuidor.contacto}</p>
                              )}
                            </div>
                            {distribuidor.deudaTotal && distribuidor.deudaTotal > 0 && (
                              <Badge variant="outline" className="ml-auto border-yellow-500/50 text-yellow-400">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Deuda: {formatearMonto(distribuidor.deudaTotal)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ===== PASO 2: PRODUCTOS ===== */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="h-full flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">
                      ¿Qué productos pedimos?
                    </h3>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "border-blue-500/50 text-blue-400",
                        items.length > 0 && "bg-blue-500/10"
                      )}
                    >
                      {items.length} productos
                    </Badge>
                  </div>

                  {/* Buscador de productos */}
                  <div className="mb-4">
                    <HybridCombobox
                      collectionName="productos"
                      placeholder="🔍 Buscar producto..."
                      onSelect={agregarProducto}
                    />
                  </div>

                  {/* Lista de items */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    <AnimatePresence mode="popLayout">
                      {items.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-12 text-gray-500"
                        >
                          <Package className="w-16 h-16 mb-4 opacity-20" />
                          <p className="text-sm">No hay productos en la orden</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Busca productos arriba para agregarlos
                          </p>
                        </motion.div>
                      ) : (
                        items.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "p-4 rounded-xl border transition-all",
                              "bg-white/5 border-white/10",
                              "hover:bg-white/10 hover:border-white/20"
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">
                                  {item.nombre}
                                </p>
                              </div>

                              {/* Cantidad */}
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => actualizarCantidad(item.id, -1)}
                                  className="w-8 h-8 rounded-full hover:bg-white/10"
                                  disabled={item.cantidad <= 1}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-8 text-center font-bold text-white">
                                  {item.cantidad}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => actualizarCantidad(item.id, 1)}
                                  className="w-8 h-8 rounded-full hover:bg-white/10"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Costo */}
                              <div className="text-right">
                                <Input
                                  type="number"
                                  value={item.costoUnitario}
                                  onChange={(e) => actualizarCosto(item.id, Number(e.target.value))}
                                  className={cn(
                                    "w-24 h-8 text-right text-sm",
                                    "bg-black/50 border-white/10"
                                  )}
                                />
                                <p className="text-xs text-blue-400 mt-1">
                                  = {formatearMonto(item.subtotal)}
                                </p>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => eliminarItem(item.id)}
                                className="w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Subtotal */}
                  {items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex justify-end">
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Subtotal Productos</p>
                          <p className="text-2xl font-bold text-white">
                            {formatearMonto(totales.subtotalProductos)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ===== PASO 3: COSTOS Y PAGO ===== */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="h-full flex flex-col space-y-6"
                >
                  {/* Costos adicionales */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">Costo de Envío</Label>
                      <Input
                        type="number"
                        value={costoEnvio}
                        onChange={(e) => setCostoEnvio(Number(e.target.value))}
                        placeholder="0.00"
                        className="bg-black/50 border-white/10 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">Otros Costos</Label>
                      <Input
                        type="number"
                        value={otrosCostos}
                        onChange={(e) => setOtrosCostos(Number(e.target.value))}
                        placeholder="0.00"
                        className="bg-black/50 border-white/10 h-11"
                      />
                    </div>
                  </div>

                  {/* Total */}
                  <div className={cn(
                    "p-4 rounded-xl border text-center",
                    "bg-gradient-to-br from-blue-500/10 to-purple-500/10",
                    "border-blue-500/30"
                  )}>
                    <p className="text-sm text-gray-400">Costo Total de la Orden</p>
                    <motion.p
                      className="text-4xl font-bold text-white mt-1"
                      key={totales.total}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      {formatearMonto(totales.total)}
                    </motion.p>
                  </div>

                  {/* Estado de pago */}
                  <div className="space-y-3">
                    <Label className="text-sm text-gray-400">Estado del Pago</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "completo" as EstadoPago, label: "Pagado", desc: "100%", color: "green" },
                        { id: "parcial" as EstadoPago, label: "Parcial", desc: "Anticipo", color: "yellow" },
                        { id: "pendiente" as EstadoPago, label: "Crédito", desc: "0%", color: "orange" },
                      ].map((estado) => (
                        <button
                          key={estado.id}
                          type="button"
                          onClick={() => setEstadoPago(estado.id)}
                          className={cn(
                            "p-3 rounded-xl border transition-all",
                            estadoPago === estado.id
                              ? estado.color === "green"
                                ? "bg-green-500/20 border-green-500"
                                : estado.color === "yellow"
                                ? "bg-yellow-500/20 border-yellow-500"
                                : "bg-orange-500/20 border-orange-500"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <p className={cn(
                            "font-medium",
                            estadoPago === estado.id ? "text-white" : "text-gray-400"
                          )}>
                            {estado.label}
                          </p>
                          <p className="text-xs text-gray-500">{estado.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monto y banco (si hay pago) */}
                  <AnimatePresence>
                    {estadoPago !== "pendiente" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        {estadoPago === "parcial" && (
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-400">Monto del Anticipo</Label>
                            <Input
                              type="number"
                              value={montoPagado}
                              onChange={(e) => setMontoPagado(Number(e.target.value))}
                              max={totales.total}
                              placeholder={`Máximo: ${formatearMonto(totales.total)}`}
                              className="bg-black/50 border-white/10 h-11"
                            />
                          </div>
                        )}

                        {/* Selector de banco */}
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-400">Banco para el Pago</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {BANCOS.slice(0, 3).map((banco) => (
                              <button
                                key={banco.id}
                                type="button"
                                onClick={() => setBancoOrigen(banco.id)}
                                className={cn(
                                  "p-3 rounded-xl border text-center transition-all",
                                  bancoOrigen === banco.id
                                    ? "bg-blue-500/20 border-blue-500"
                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                )}
                              >
                                <p className="text-sm font-medium text-white">
                                  {banco.nombre}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Notas */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Notas (opcional)</Label>
                    <Textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Observaciones de la orden..."
                      className="bg-black/50 border-white/10 min-h-[80px] resize-none"
                    />
                  </div>

                  {/* Resumen final */}
                  <div className={cn(
                    "p-4 rounded-xl border mt-auto",
                    "bg-gradient-to-br from-white/5 to-transparent",
                    "border-white/10"
                  )}>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Distribuidor:</span>
                        <span className="text-white">{distribuidor?.nombre}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Productos:</span>
                        <span className="text-white">{totales.cantidadItems}</span>
                      </div>
                      <div className="h-px bg-white/10 my-2" />
                      <div className="flex justify-between">
                        <span className="text-gray-400">A pagar ahora:</span>
                        <span className="text-green-400 font-bold">
                          {formatearMonto(montoRealPagado)}
                        </span>
                      </div>
                      {deudaGenerada > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Deuda generada:</span>
                          <span className="text-orange-400 font-bold">
                            {formatearMonto(deudaGenerada)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className={cn(
          "h-20 border-t border-white/10",
          "bg-gradient-to-r from-black/50 via-white/5 to-black/50",
          "px-6 flex items-center justify-between"
        )}>
          <Button
            type="button"
            variant="ghost"
            onClick={step === 1 ? handleClose : prevStep}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            {step === 1 ? (
              "Cancelar"
            ) : (
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
              className={cn(
                "min-w-[140px]",
                "bg-white text-black hover:bg-gray-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
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
                "bg-gradient-to-r from-blue-600 to-indigo-600",
                "hover:from-blue-500 hover:to-indigo-500",
                "text-white font-bold",
                "shadow-[0_0_30px_rgba(59,130,246,0.4)]",
                "transition-all duration-300"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Crear Orden
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateOrdenCompraModal
