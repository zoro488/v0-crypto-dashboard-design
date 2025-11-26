"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ShoppingCart, ChevronRight, User, Users, Package, DollarSign, Check, Plus, Trash2, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription } from "@/frontend/app/components/ui/dialog"
import { useToast } from "@/frontend/app/hooks/use-toast"
import { procesarVentaAtomica, type VentaItem } from "@/frontend/app/lib/services/ventas-transaction.service"
import { useAlmacenData, useClientesData } from "@/frontend/app/lib/firebase/firestore-hooks.service"
import { validarVenta } from "@/frontend/app/lib/schemas/ventas.schema"

interface AlmacenProducto {
  id: string
  nombre?: string
  stockActual?: number
  stock?: number
  valorUnitario?: number
  precioVenta?: number
  precioCompra?: number
  [key: string]: unknown
}

interface Cliente {
  id: string
  nombre?: string
  telefono?: string
  email?: string
  deudaTotal?: number
  [key: string]: unknown
}

interface CreateVentaModalProps {
  open: boolean
  onClose: () => void
}

interface CarritoItem {
  productoId: string
  productoNombre: string
  cantidad: number
  precioUnitario: number
  precioCompra: number
  precioFlete: number
  stockDisponible: number
}

// Pasos del wizard de venta
const steps = [
  { id: 1, title: "Cliente", icon: User },
  { id: 2, title: "Productos", icon: Package },
  { id: 3, title: "Pago", icon: DollarSign },
  { id: 4, title: "Confirmar", icon: Check },
]

export function CreateVentaModal({ open, onClose }: CreateVentaModalProps) {
  const { toast } = useToast()
  const { data: almacenRaw = [] } = useAlmacenData()
  const { data: clientesRaw = [] } = useClientesData()
  const almacen = almacenRaw as AlmacenProducto[]
  const clientesDB = clientesRaw as Cliente[]
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Estado del formulario
  const [clienteId, setClienteId] = useState("")
  const [clienteNombre, setClienteNombre] = useState("")
  const [isNewCliente, setIsNewCliente] = useState(false)
  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'crypto'>('efectivo')
  const [estadoPago, setEstadoPago] = useState<'completo' | 'parcial' | 'pendiente'>('completo')
  const [montoPagado, setMontoPagado] = useState(0)

  // Calcular totales
  const totales = useMemo(() => {
    let subtotal = 0
    let totalCompra = 0
    let totalFlete = 0
    
    carrito.forEach(item => {
      subtotal += item.precioUnitario * item.cantidad
      totalCompra += item.precioCompra * item.cantidad
      totalFlete += item.precioFlete * item.cantidad
    })
    
    const utilidades = subtotal - totalCompra - totalFlete
    
    return {
      subtotal,
      totalCompra,
      totalFlete,
      utilidades,
      total: subtotal
    }
  }, [carrito])

  // Monto real pagado según estado
  const montoRealPagado = useMemo(() => {
    if (estadoPago === 'completo') return totales.total
    if (estadoPago === 'parcial') return montoPagado
    return 0
  }, [estadoPago, montoPagado, totales.total])

  const montoRestante = totales.total - montoRealPagado

  // Agregar producto al carrito
  const agregarAlCarrito = (productoId: string) => {
    const prod = almacen.find(p => p.id === productoId)
    if (!prod) return
    
    const stockDisponible = prod.stockActual ?? prod.stock ?? 0
    if (stockDisponible <= 0) {
      toast({
        title: "Sin stock",
        description: `${prod.nombre} no tiene unidades disponibles`,
        variant: "destructive"
      })
      return
    }
    
    setCarrito(prev => {
      const existe = prev.find(item => item.productoId === productoId)
      if (existe) {
        if (existe.cantidad >= stockDisponible) {
          toast({
            title: "Stock limitado",
            description: `Solo hay ${stockDisponible} unidades disponibles`,
            variant: "destructive"
          })
          return prev
        }
        return prev.map(item => 
          item.productoId === productoId 
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      
      const precioCompra = prod.precioCompra ?? prod.valorUnitario ?? 0
      const precioVenta = prod.precioVenta ?? precioCompra * 1.3
      
      return [...prev, {
        productoId,
        productoNombre: prod.nombre || 'Producto sin nombre',
        cantidad: 1,
        precioUnitario: precioVenta,
        precioCompra,
        precioFlete: 500, // Flete por defecto
        stockDisponible
      }]
    })
  }

  // Actualizar cantidad en carrito
  const actualizarCantidad = (productoId: string, cantidad: number) => {
    setCarrito(prev => prev.map(item => {
      if (item.productoId === productoId) {
        const nuevaCantidad = Math.max(1, Math.min(cantidad, item.stockDisponible))
        return { ...item, cantidad: nuevaCantidad }
      }
      return item
    }))
  }

  // Actualizar precio en carrito
  const actualizarPrecio = (productoId: string, campo: 'precioUnitario' | 'precioFlete', valor: number) => {
    setCarrito(prev => prev.map(item => {
      if (item.productoId === productoId) {
        return { ...item, [campo]: Math.max(0, valor) }
      }
      return item
    }))
  }

  // Eliminar del carrito
  const eliminarDelCarrito = (productoId: string) => {
    setCarrito(prev => prev.filter(item => item.productoId !== productoId))
  }

  // Seleccionar cliente existente
  const seleccionarCliente = (cliente: Cliente) => {
    setClienteId(cliente.id)
    setClienteNombre(cliente.nombre || '')
    setIsNewCliente(false)
  }

  const nextStep = () => setStep((s) => Math.min(s + 1, 4))
  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  // Validaciones por paso
  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return clienteNombre.trim().length >= 2
      case 2: return carrito.length > 0
      case 3: return estadoPago !== 'parcial' || (montoPagado > 0 && montoPagado < totales.total)
      case 4: return true
      default: return false
    }
  }, [step, clienteNombre, carrito, estadoPago, montoPagado, totales.total])

  const handleSubmit = async () => {
    if (carrito.length === 0) {
      toast({ title: "Error", description: "El carrito está vacío", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      // Preparar items para la transacción
      const items: VentaItem[] = carrito.map(item => ({
        productoId: item.productoId,
        productoNombre: item.productoNombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        precioCompra: item.precioCompra,
        precioFlete: item.precioFlete
      }))

      // Ejecutar transacción atómica
      const resultado = await procesarVentaAtomica({
        items,
        total: totales.total,
        clienteId: isNewCliente ? '' : clienteId,
        clienteNombre,
        metodoPago,
        montoPagado: montoRealPagado,
        montoRestante
      })

      if (resultado.success) {
        toast({
          title: "✅ Venta Exitosa",
          description: `Se procesó la venta por $${totales.total.toLocaleString()}. ` +
            `Stock actualizado y ${montoRestante > 0 ? `deuda de $${montoRestante.toLocaleString()} registrada` : 'dinero distribuido a bancos'}.`
        })

        // Limpiar y cerrar
        onClose()
        resetForm()
      } else {
        toast({
          title: "❌ Error en la venta",
          description: resultado.error || "No se pudo procesar la venta",
          variant: "destructive"
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setClienteId("")
    setClienteNombre("")
    setIsNewCliente(false)
    setCarrito([])
    setMetodoPago('efectivo')
    setEstadoPago('completo')
    setMontoPagado(0)
    setStep(1)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 bg-black/95 border-white/10 text-white overflow-hidden flex flex-col">
        <DialogDescription className="sr-only">
          Formulario para registrar una nueva venta con múltiples productos. Seleccione cliente, agregue productos al carrito,
          defina el método y estado de pago, y confirme la venta.
        </DialogDescription>

        {/* Header */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-green-500" />
            </div>
            <h2 className="text-lg font-bold">Nueva Venta</h2>
            {carrito.length > 0 && (
              <span className="bg-green-500 text-xs px-2 py-1 rounded-full">
                {carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Steps */}
          <div className="w-64 border-r border-white/10 p-6 bg-white/5 hidden md:block">
            <div className="space-y-6">
              {steps.map((s, index) => (
                <div key={s.id} className="relative">
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 w-0.5 h-8 ${step > s.id ? "bg-green-500" : "bg-white/10"}`}
                    />
                  )}
                  <div
                    className={`flex items-center gap-4 ${step === s.id ? "text-white" : step > s.id ? "text-green-500" : "text-white/40"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border ${step === s.id ? "border-white bg-white/10" : step > s.id ? "border-green-500 bg-green-500/10" : "border-white/10"}`}
                    >
                      <s.icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{s.title}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen del Carrito (sidebar) */}
            {carrito.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <h4 className="text-sm font-medium text-white/60 mb-3">Resumen</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Subtotal:</span>
                    <span>${totales.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-400">
                    <span>Utilidades:</span>
                    <span>${totales.utilidades.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Form Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* PASO 1: Cliente */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-bold">Información del Cliente</h3>
                  
                  {/* Toggle: Cliente existente / Nuevo */}
                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={() => setIsNewCliente(false)}
                      className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                        !isNewCliente ? 'bg-green-500/20 border-green-500' : 'bg-white/5 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <Users className="w-4 h-4 inline mr-2" />
                      Cliente Existente
                    </button>
                    <button
                      onClick={() => { setIsNewCliente(true); setClienteId(""); }}
                      className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                        isNewCliente ? 'bg-green-500/20 border-green-500' : 'bg-white/5 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Nuevo Cliente
                    </button>
                  </div>

                  {!isNewCliente ? (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-white/60">Seleccionar Cliente</label>
                      <select
                        value={clienteId}
                        onChange={(e) => {
                          const cliente = clientesDB.find(c => c.id === e.target.value)
                          if (cliente) seleccionarCliente(cliente)
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                      >
                        <option value="">Seleccionar cliente...</option>
                        {clientesDB.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} {c.deudaTotal ? `(Deuda: $${c.deudaTotal.toLocaleString()})` : ''}
                          </option>
                        ))}
                      </select>
                      {clienteId && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <p className="text-sm text-white/60">Cliente seleccionado:</p>
                          <p className="font-bold text-lg">{clienteNombre}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-white/60">Nombre del Nuevo Cliente</label>
                      <input
                        type="text"
                        value={clienteNombre}
                        onChange={(e) => setClienteNombre(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none transition-colors"
                        autoFocus
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {/* PASO 2: Productos / Carrito */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-bold">Selección de Productos</h3>
                  
                  {/* Selector de productos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                    {almacen.filter(p => (p.stockActual ?? p.stock ?? 0) > 0).map((prod) => {
                      const stock = prod.stockActual ?? prod.stock ?? 0
                      const enCarrito = carrito.find(c => c.productoId === prod.id)
                      return (
                        <button
                          key={prod.id}
                          onClick={() => agregarAlCarrito(prod.id)}
                          className={`text-left p-3 rounded-xl border transition-all ${
                            enCarrito 
                              ? 'bg-green-500/20 border-green-500' 
                              : 'bg-white/5 border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{prod.nombre}</p>
                              <p className="text-xs text-white/60">Stock: {stock} | ${(prod.precioVenta ?? prod.valorUnitario ?? 0).toLocaleString()}</p>
                            </div>
                            {enCarrito && (
                              <span className="bg-green-500 text-xs px-2 py-1 rounded-full">
                                x{enCarrito.cantidad}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Carrito */}
                  {carrito.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Carrito ({carrito.length} {carrito.length === 1 ? 'producto' : 'productos'})
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {carrito.map((item) => (
                          <div key={item.productoId} className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-medium">{item.productoNombre}</p>
                                <p className="text-xs text-white/40">Stock disponible: {item.stockDisponible}</p>
                              </div>
                              <button
                                onClick={() => eliminarDelCarrito(item.productoId)}
                                className="text-red-400 hover:text-red-300 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs text-white/60">Cantidad</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={item.stockDisponible}
                                  value={item.cantidad}
                                  onChange={(e) => actualizarCantidad(item.productoId, Number(e.target.value))}
                                  className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-white/60">Precio Venta</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.precioUnitario}
                                  onChange={(e) => actualizarPrecio(item.productoId, 'precioUnitario', Number(e.target.value))}
                                  className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-white/60">Flete</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.precioFlete}
                                  onChange={(e) => actualizarPrecio(item.productoId, 'precioFlete', Number(e.target.value))}
                                  className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>
                            </div>
                            <div className="mt-2 text-right text-sm">
                              <span className="text-white/60">Subtotal: </span>
                              <span className="font-bold">${(item.precioUnitario * item.cantidad).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {carrito.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-white/40">
                      <AlertCircle className="w-12 h-12 mb-3" />
                      <p>Selecciona productos para agregar al carrito</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* PASO 3: Pago */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-bold">Detalles de Pago</h3>
                  
                  {/* Método de pago */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white/60">Método de Pago</label>
                    <div className="grid grid-cols-4 gap-3">
                      {(['efectivo', 'tarjeta', 'transferencia', 'crypto'] as const).map((metodo) => (
                        <button
                          key={metodo}
                          onClick={() => setMetodoPago(metodo)}
                          className={`py-3 px-4 rounded-xl border transition-all capitalize ${
                            metodoPago === metodo
                              ? 'bg-green-500/20 border-green-500'
                              : 'bg-white/5 border-white/10 hover:border-white/30'
                          }`}
                        >
                          {metodo}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Estado de pago */}
                  <div className="grid grid-cols-3 gap-4">
                    {(['completo', 'parcial', 'pendiente'] as const).map((type) => (
                      <div
                        key={type}
                        onClick={() => setEstadoPago(type)}
                        className={`cursor-pointer p-4 rounded-xl border transition-all ${
                          estadoPago === type
                            ? "bg-green-500/20 border-green-500"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="capitalize font-bold mb-1">{type}</div>
                        <div className="text-xs text-white/60">
                          {type === "completo" ? "Pago del 100%" : type === "parcial" ? "Pago inicial" : "Crédito total"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {estadoPago === "parcial" && (
                    <div className="space-y-2 mt-4">
                      <label className="text-sm text-white/60">Monto Pagado (Abono Inicial)</label>
                      <input
                        type="number"
                        value={montoPagado}
                        max={totales.total}
                        onChange={(e) => setMontoPagado(Math.min(Number(e.target.value), totales.total))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                        placeholder={`Máximo: $${totales.total.toLocaleString()}`}
                      />
                    </div>
                  )}

                  {/* Distribución en bancos */}
                  <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="font-bold mb-3">Distribución Automática en Bancos:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">Bóveda Monte (Costo productos):</span>
                        <span className="font-bold">${totales.totalCompra.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Fletes:</span>
                        <span className="font-bold">${totales.totalFlete.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Utilidades (Ganancia):</span>
                        <span className="font-bold text-green-400">${totales.utilidades.toLocaleString()}</span>
                      </div>
                      <div className="h-px bg-white/10 my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Total Venta:</span>
                        <span className="text-green-400">${totales.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PASO 4: Confirmación */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-bold">Confirmar Venta</h3>
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Cliente</span>
                      <span className="font-bold">{clienteNombre} {isNewCliente && <span className="text-xs text-green-400">(Nuevo)</span>}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Método de Pago</span>
                      <span className="font-bold capitalize">{metodoPago}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Estado Pago</span>
                      <span className="font-bold capitalize">{estadoPago}</span>
                    </div>
                    
                    <div className="h-px bg-white/10 my-4" />
                    
                    <h4 className="font-medium text-white/60">Productos ({carrito.length})</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {carrito.map((item) => (
                        <div key={item.productoId} className="flex justify-between text-sm">
                          <span>{item.productoNombre} x{item.cantidad}</span>
                          <span>${(item.precioUnitario * item.cantidad).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="h-px bg-white/10 my-4" />
                    
                    <div className="flex justify-between items-center text-xl font-bold text-green-400">
                      <span>Total</span>
                      <span>${totales.total.toLocaleString()}</span>
                    </div>
                    
                    {montoRestante > 0 && (
                      <div className="flex justify-between items-center text-sm text-orange-400">
                        <span>Deuda Generada</span>
                        <span>${montoRestante.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-green-400">
                      <span>Monto a Recibir</span>
                      <span>${montoRealPagado.toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="h-20 border-t border-white/10 bg-white/5 px-8 flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : prevStep}
            className="px-6 py-2 rounded-xl text-white/60 hover:text-white transition-colors"
          >
            {step === 1 ? "Cancelar" : "Atrás"}
          </button>

          <button
            onClick={step === 4 ? handleSubmit : nextStep}
            disabled={loading || !canProceed}
            className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Procesando..." : step === 4 ? "Confirmar Venta" : "Siguiente"}
            {!loading && step !== 4 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateVentaModal
