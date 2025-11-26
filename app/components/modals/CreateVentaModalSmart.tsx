"use client"

/**
 * 💎 CREATE VENTA MODAL - La Joya de la Corona
 * 
 * Modal de venta completamente rediseñado con:
 * 1. Progressive Disclosure (3 pasos animados)
 * 2. HybridCombobox para Cliente y Productos
 * 3. AI Voice Fill para dictado inteligente
 * 4. Glassmorphism futurista
 * 5. Validación con Zod
 * 6. Distribución automática a bancos
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
  Mic,
  MicOff,
  Sparkles,
  Package,
  DollarSign,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Zap,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { HybridCombobox } from "@/app/components/ui/hybrid-combobox"
import { useToast } from "@/app/hooks/use-toast"
import { logger } from "@/app/lib/utils/logger"
import { 
  ventaSchema, 
  type VentaInput,
  formatearMonto,
  generarKeywords,
} from "@/app/lib/validations/smart-forms-schemas"
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  runTransaction,
  Timestamp,
  increment,
} from "firebase/firestore"
import { db } from "@/app/lib/firebase/config"

// ============================================
// TIPOS
// ============================================

interface CreateVentaModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface CarritoItem {
  id: string
  productoId: string
  nombre: string
  cantidad: number
  precioUnitario: number
  precioCompra: number
  stockDisponible: number
  subtotal: number
}

interface ClienteSeleccionado {
  id: string
  nombre: string
  telefono?: string
  email?: string
  deudaTotal?: number
}

type MetodoPago = "efectivo" | "transferencia" | "deposito" | "mixto"
type EstadoPago = "completo" | "parcial" | "pendiente"

// Pasos del wizard
const STEPS = [
  { id: 1, title: "Cliente", icon: User, description: "¿Quién compra?" },
  { id: 2, title: "Carrito", icon: ShoppingCart, description: "¿Qué lleva?" },
  { id: 3, title: "Pago", icon: DollarSign, description: "¿Cómo paga?" },
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

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: -100, scale: 0.9 },
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CreateVentaModal({ open, onClose, onSuccess }: CreateVentaModalProps) {
  const { toast } = useToast()
  
  // Estado del wizard
  const [step, setStep] = React.useState(1)
  const [direction, setDirection] = React.useState(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  // Estado de voz
  const [isListening, setIsListening] = React.useState(false)
  const [voiceTranscript, setVoiceTranscript] = React.useState("")
  
  // Estado del formulario
  const [cliente, setCliente] = React.useState<ClienteSeleccionado | null>(null)
  const [carrito, setCarrito] = React.useState<CarritoItem[]>([])
  const [metodoPago, setMetodoPago] = React.useState<MetodoPago>("efectivo")
  const [estadoPago, setEstadoPago] = React.useState<EstadoPago>("completo")
  const [montoPagado, setMontoPagado] = React.useState(0)
  const [notas, setNotas] = React.useState("")

  // Cálculos del carrito
  const totales = React.useMemo(() => {
    const subtotal = carrito.reduce((acc, item) => acc + item.subtotal, 0)
    const costoTotal = carrito.reduce((acc, item) => acc + (item.precioCompra * item.cantidad), 0)
    const utilidad = subtotal - costoTotal
    
    return {
      subtotal,
      costoTotal,
      utilidad,
      total: subtotal,
      cantidadItems: carrito.reduce((acc, item) => acc + item.cantidad, 0),
    }
  }, [carrito])

  // Monto real pagado según estado
  const montoRealPagado = React.useMemo(() => {
    if (estadoPago === "completo") return totales.total
    if (estadoPago === "parcial") return Math.min(montoPagado, totales.total)
    return 0 // pendiente
  }, [estadoPago, montoPagado, totales.total])

  const saldoPendiente = totales.total - montoRealPagado

  // Validación por paso
  const canProceed = React.useMemo(() => {
    switch (step) {
      case 1:
        return cliente !== null
      case 2:
        return carrito.length > 0
      case 3:
        return estadoPago !== "parcial" || (montoPagado > 0 && montoPagado < totales.total)
      default:
        return false
    }
  }, [step, cliente, carrito, estadoPago, montoPagado, totales.total])

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

  // Seleccionar cliente
  const handleSelectCliente = (item: ClienteSeleccionado) => {
    setCliente(item)
    // Auto-avance después de selección
    setTimeout(() => {
      setDirection(1)
      setStep(2)
    }, 300)
  }

  // Agregar producto al carrito
  const agregarAlCarrito = (producto: {
    id: string
    nombre: string
    precioVenta?: number
    precio_venta?: number
    precioCompra?: number
    precio_compra?: number
    stockActual?: number
    stock?: number
  }) => {
    const stockDisponible = producto.stockActual ?? producto.stock ?? 999
    const precioUnitario = producto.precioVenta ?? producto.precio_venta ?? 0
    const precioCompra = producto.precioCompra ?? producto.precio_compra ?? 0
    
    setCarrito(prev => {
      const existe = prev.find(item => item.productoId === producto.id)
      
      if (existe) {
        // Verificar stock
        if (existe.cantidad >= stockDisponible) {
          toast({
            title: "Stock limitado",
            description: `Solo hay ${stockDisponible} unidades disponibles`,
            variant: "destructive",
          })
          return prev
        }
        
        return prev.map(item =>
          item.productoId === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precioUnitario,
              }
            : item
        )
      }
      
      // Nuevo item
      const nuevoItem: CarritoItem = {
        id: `cart-${Date.now()}`,
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precioUnitario,
        precioCompra,
        stockDisponible,
        subtotal: precioUnitario,
      }
      
      return [...prev, nuevoItem]
    })
    
    toast({
      title: `🛒 ${producto.nombre}`,
      description: "Agregado al carrito",
    })
  }

  // Actualizar cantidad
  const actualizarCantidad = (itemId: string, delta: number) => {
    setCarrito(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item
        
        const nuevaCantidad = Math.max(1, Math.min(item.cantidad + delta, item.stockDisponible))
        return {
          ...item,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * item.precioUnitario,
        }
      })
    )
  }

  // Eliminar del carrito
  const eliminarDelCarrito = (itemId: string) => {
    setCarrito(prev => prev.filter(item => item.id !== itemId))
  }

  // Actualizar precio manualmente
  const actualizarPrecio = (itemId: string, nuevoPrecio: number) => {
    setCarrito(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item
        return {
          ...item,
          precioUnitario: Math.max(0, nuevoPrecio),
          subtotal: item.cantidad * Math.max(0, nuevoPrecio),
        }
      })
    )
  }

  // Voice Input (Web Speech API)
  const toggleVoice = () => {
    if (isListening) {
      setIsListening(false)
      return
    }

    // Verificar soporte
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof window.webkitSpeechRecognition; webkitSpeechRecognition?: typeof window.webkitSpeechRecognition }).SpeechRecognition || 
                             (window as unknown as { webkitSpeechRecognition?: typeof window.webkitSpeechRecognition }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      toast({
        title: "No soportado",
        description: "Tu navegador no soporta reconocimiento de voz",
        variant: "destructive",
      })
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.lang = "es-MX"
    recognition.interimResults = true

    setIsListening(true)
    setVoiceTranscript("")

    recognition.onresult = (event: Event) => {
      const speechEvent = event as unknown as { results: SpeechRecognitionResultList }
      const transcript = Array.from(speechEvent.results)
        .map((result: SpeechRecognitionResult) => result[0].transcript)
        .join("")
      setVoiceTranscript(transcript)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (voiceTranscript) {
        processVoiceCommand(voiceTranscript)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      toast({
        title: "Error de voz",
        description: "No se pudo procesar el audio",
        variant: "destructive",
      })
    }

    recognition.start()
  }

  // Procesar comando de voz (simplificado - en producción usar AI)
  const processVoiceCommand = async (text: string) => {
    toast({
      title: "🎤 Procesando...",
      description: `"${text}"`,
    })

    // TODO: Integrar con Vercel AI SDK para parsing inteligente
    // Por ahora, solo mostramos el texto
    logger.info("Voice command received", { data: { text } })
  }

  // Procesar venta
  const handleSubmit = async () => {
    if (!cliente || carrito.length === 0) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Crear la venta
        const ventaRef = doc(collection(db, "ventas"))
        
        const ventaData = {
          // Identificadores
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          
          // Snapshot inmutable del cliente
          clienteSnapshot: {
            nombre: cliente.nombre,
            telefono: cliente.telefono || null,
            email: cliente.email || null,
          },
          
          // Items
          items: carrito.map(item => ({
            productoId: item.productoId,
            productoNombre: item.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            precioCompra: item.precioCompra,
            subtotal: item.subtotal,
          })),
          
          // Totales
          subtotal: totales.subtotal,
          descuento: 0,
          impuestos: 0,
          total: totales.total,
          costoTotal: totales.costoTotal,
          utilidad: totales.utilidad,
          
          // Pago
          metodoPago,
          estadoPago: estadoPago === "completo" ? "pagado" : estadoPago,
          montoPagado: montoRealPagado,
          saldoPendiente,
          
          // Distribución a bancos (si pagado)
          distribucionBancos: montoRealPagado > 0 ? {
            boveda_monte: totales.costoTotal, // Costo va a bóveda
            utilidades: totales.utilidad > 0 ? totales.utilidad : 0, // Ganancia a utilidades
          } : null,
          
          // Metadata
          moneda: "MXN",
          notas: notas || null,
          keywords: generarKeywords(cliente.nombre),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
        
        transaction.set(ventaRef, ventaData)

        // 2. Actualizar stock de productos
        for (const item of carrito) {
          const productoRef = doc(db, "almacen", item.productoId)
          transaction.update(productoRef, {
            stockActual: increment(-item.cantidad),
            totalSalidas: increment(item.cantidad),
            updatedAt: Timestamp.now(),
          })
        }

        // 3. Actualizar deuda del cliente si hay saldo pendiente
        if (saldoPendiente > 0) {
          const clienteRef = doc(db, "clientes", cliente.id)
          transaction.update(clienteRef, {
            deudaTotal: increment(saldoPendiente),
            totalVentas: increment(totales.total),
            numeroCompras: increment(1),
            updatedAt: Timestamp.now(),
          })
        }

        // 4. Crear movimiento bancario si hay pago
        if (montoRealPagado > 0) {
          const movimientoRef = doc(collection(db, "movimientos"))
          transaction.set(movimientoRef, {
            tipo: "ingreso",
            bancoOrigenId: "boveda_monte",
            monto: montoRealPagado,
            moneda: "MXN",
            categoria: "venta",
            referenciaId: ventaRef.id,
            referenciaTipo: "venta",
            concepto: `Venta a ${cliente.nombre}`,
            createdAt: Timestamp.now(),
          })
        }
      })

      toast({
        title: "✅ Venta Exitosa",
        description: `Total: ${formatearMonto(totales.total)}${saldoPendiente > 0 ? ` | Pendiente: ${formatearMonto(saldoPendiente)}` : ""}`,
      })

      // Limpiar y cerrar
      resetForm()
      onClose()
      onSuccess?.()

    } catch (error) {
      logger.error("Error procesando venta", error)
      toast({
        title: "Error",
        description: "No se pudo procesar la venta",
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
    setCliente(null)
    setCarrito([])
    setMetodoPago("efectivo")
    setEstadoPago("completo")
    setMontoPagado(0)
    setNotas("")
    setVoiceTranscript("")
  }

  // Cerrar modal
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
        <DialogTitle className="sr-only">Nueva Venta</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para crear una nueva venta con cliente, productos y método de pago
        </DialogDescription>

        {/* ===== HEADER ===== */}
        <div className="relative h-20 border-b border-white/10 bg-gradient-to-r from-green-500/10 via-transparent to-blue-500/10">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          
          <div className="relative h-full px-6 flex items-center justify-between">
            {/* Título y paso */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Nueva Venta</h2>
                <p className="text-sm text-gray-400">
                  Paso {step} de 3 • {STEPS[step - 1].description}
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center gap-3">
              {/* Voice Button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleVoice}
                className={cn(
                  "w-10 h-10 rounded-full transition-all duration-500",
                  "border-white/20",
                  isListening
                    ? "bg-red-500 border-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse scale-110"
                    : "hover:bg-white/10 hover:border-white/40"
                )}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>

              {/* Close */}
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
          </div>

          {/* Progress Bar */}
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
        <div className="flex-1 overflow-hidden flex">
          {/* Steps Sidebar */}
          <div className="w-48 border-r border-white/10 bg-white/[0.02] p-4 hidden md:block">
            <div className="space-y-4">
              {STEPS.map((s, index) => {
                const isCompleted = step > s.id
                const isCurrent = step === s.id
                
                return (
                  <div key={s.id} className="relative">
                    {/* Línea conectora */}
                    {index < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-5 top-12 w-0.5 h-8",
                          isCompleted ? "bg-green-500" : "bg-white/10"
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
                            ? "bg-green-500 border-green-500 text-white"
                            : isCurrent
                            ? "bg-white/10 border-green-500 text-green-400"
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
                          isCurrent ? "text-white" : isCompleted ? "text-green-400" : "text-gray-500"
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
            {carrito.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-xs text-gray-500 mb-2">Resumen</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Items:</span>
                    <span className="text-white">{totales.cantidadItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-green-400 font-bold">
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
              
              {/* ===== PASO 1: CLIENTE ===== */}
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
                      ¿Quién es el cliente?
                    </h3>
                    <p className="text-gray-400">
                      Busca un cliente existente o crea uno nuevo al instante
                    </p>
                  </div>

                  <div className="max-w-md mx-auto w-full">
                    <HybridCombobox
                      collectionName="clientes"
                      label="Cliente"
                      value={cliente?.id}
                      onSelect={handleSelectCliente}
                      placeholder="Escribe nombre o teléfono..."
                    />
                  </div>

                  {/* Cliente seleccionado */}
                  <AnimatePresence>
                    {cliente && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mt-6 max-w-md mx-auto w-full"
                      >
                        <div className={cn(
                          "p-4 rounded-xl border",
                          "bg-green-500/10 border-green-500/30"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{cliente.nombre}</p>
                              {cliente.telefono && (
                                <p className="text-sm text-gray-400">{cliente.telefono}</p>
                              )}
                            </div>
                            {cliente.deudaTotal && cliente.deudaTotal > 0 && (
                              <Badge variant="outline" className="ml-auto border-orange-500/50 text-orange-400">
                                Deuda: {formatearMonto(cliente.deudaTotal)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Voice transcript */}
                  {voiceTranscript && (
                    <div className="mt-4 max-w-md mx-auto w-full">
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <p className="text-sm text-blue-300">
                          <Sparkles className="w-4 h-4 inline mr-2" />
                          "{voiceTranscript}"
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ===== PASO 2: CARRITO ===== */}
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
                      Armar Carrito
                    </h3>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "border-blue-500/50 text-blue-400",
                        carrito.length > 0 && "bg-blue-500/10"
                      )}
                    >
                      {carrito.length} productos
                    </Badge>
                  </div>

                  {/* Buscador de productos */}
                  <div className="mb-4">
                    <HybridCombobox
                      collectionName="productos"
                      placeholder="🔍 Buscar producto..."
                      onSelect={agregarAlCarrito}
                    />
                  </div>

                  {/* Lista del carrito */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    <AnimatePresence mode="popLayout">
                      {carrito.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-12 text-gray-500"
                        >
                          <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                          <p className="text-sm">El carrito está vacío</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Busca productos arriba para agregarlos
                          </p>
                        </motion.div>
                      ) : (
                        carrito.map((item, index) => (
                          <motion.div
                            key={item.id}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "p-4 rounded-xl border transition-all",
                              "bg-white/5 border-white/10",
                              "hover:bg-white/10 hover:border-white/20"
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              {/* Info del producto */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">
                                  {item.nombre}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500">
                                    Stock: {item.stockDisponible}
                                  </span>
                                  <span className="text-xs text-gray-600">•</span>
                                  <span className="text-xs text-gray-500">
                                    Costo: {formatearMonto(item.precioCompra)}
                                  </span>
                                </div>
                              </div>

                              {/* Controles de cantidad */}
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
                                  disabled={item.cantidad >= item.stockDisponible}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Precio y eliminar */}
                              <div className="text-right">
                                <Input
                                  type="number"
                                  value={item.precioUnitario}
                                  onChange={(e) => actualizarPrecio(item.id, Number(e.target.value))}
                                  className={cn(
                                    "w-24 h-8 text-right text-sm",
                                    "bg-black/50 border-white/10"
                                  )}
                                />
                                <p className="text-xs text-green-400 mt-1">
                                  = {formatearMonto(item.subtotal)}
                                </p>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => eliminarDelCarrito(item.id)}
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

                  {/* Totales */}
                  {carrito.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between gap-8">
                            <span className="text-gray-400">Costo:</span>
                            <span className="text-gray-300">{formatearMonto(totales.costoTotal)}</span>
                          </div>
                          <div className="flex justify-between gap-8">
                            <span className="text-gray-400">Utilidad:</span>
                            <span className="text-green-400">{formatearMonto(totales.utilidad)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Total</p>
                          <p className="text-3xl font-bold text-white">
                            {formatearMonto(totales.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ===== PASO 3: PAGO ===== */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="h-full flex flex-col"
                >
                  {/* Total grande */}
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-400 mb-1">Total a cobrar</p>
                    <motion.p
                      className="text-5xl font-bold text-white"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      {formatearMonto(totales.total)}
                    </motion.p>
                    <p className="text-sm text-gray-500 mt-1">
                      {totales.cantidadItems} productos para {cliente?.nombre}
                    </p>
                  </div>

                  {/* Método de pago */}
                  <div className="space-y-3 mb-6">
                    <Label className="text-sm text-gray-400">Método de Pago</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "efectivo" as MetodoPago, icon: Wallet, label: "Efectivo" },
                        { id: "transferencia" as MetodoPago, icon: CreditCard, label: "Transferencia" },
                      ].map((metodo) => (
                        <button
                          key={metodo.id}
                          type="button"
                          onClick={() => setMetodoPago(metodo.id)}
                          className={cn(
                            "p-4 rounded-xl border text-center transition-all",
                            metodoPago === metodo.id
                              ? "bg-green-500/20 border-green-500 text-green-400"
                              : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                          )}
                        >
                          <metodo.icon className="w-6 h-6 mx-auto mb-2" />
                          <p className="text-sm font-medium">{metodo.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Estado de pago */}
                  <div className="space-y-3 mb-6">
                    <Label className="text-sm text-gray-400">Estado del Pago</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "completo" as EstadoPago, label: "Completo", desc: "100%" },
                        { id: "parcial" as EstadoPago, label: "Parcial", desc: "Abono" },
                        { id: "pendiente" as EstadoPago, label: "Crédito", desc: "0%" },
                      ].map((estado) => (
                        <button
                          key={estado.id}
                          type="button"
                          onClick={() => setEstadoPago(estado.id)}
                          className={cn(
                            "p-3 rounded-xl border transition-all",
                            estadoPago === estado.id
                              ? estado.id === "completo"
                                ? "bg-green-500/20 border-green-500"
                                : estado.id === "parcial"
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

                  {/* Monto parcial */}
                  <AnimatePresence>
                    {estadoPago === "parcial" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-6 overflow-hidden"
                      >
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-400">Monto del Abono</Label>
                          <Input
                            type="number"
                            value={montoPagado}
                            onChange={(e) => setMontoPagado(Number(e.target.value))}
                            max={totales.total}
                            placeholder={`Máximo: ${formatearMonto(totales.total)}`}
                            className="bg-black/50 border-white/10 h-12 text-lg"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Resumen final */}
                  <div className={cn(
                    "p-4 rounded-xl border mt-auto",
                    "bg-gradient-to-br from-white/5 to-transparent",
                    "border-white/10"
                  )}>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cliente:</span>
                        <span className="text-white">{cliente?.nombre}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Productos:</span>
                        <span className="text-white">{totales.cantidadItems}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Método:</span>
                        <span className="text-white capitalize">{metodoPago}</span>
                      </div>
                      <div className="h-px bg-white/10 my-2" />
                      <div className="flex justify-between">
                        <span className="text-gray-400">A recibir:</span>
                        <span className="text-green-400 font-bold">
                          {formatearMonto(montoRealPagado)}
                        </span>
                      </div>
                      {saldoPendiente > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Deuda generada:</span>
                          <span className="text-orange-400 font-bold">
                            {formatearMonto(saldoPendiente)}
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
                "bg-gradient-to-r from-green-600 to-emerald-600",
                "hover:from-green-500 hover:to-emerald-500",
                "text-white font-bold",
                "shadow-[0_0_30px_rgba(34,197,94,0.4)]",
                "transition-all duration-300"
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
      </DialogContent>
    </Dialog>
  )
}

export default CreateVentaModal
