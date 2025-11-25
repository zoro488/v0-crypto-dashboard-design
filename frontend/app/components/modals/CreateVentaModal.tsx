"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ShoppingCart, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription } from "@/frontend/app/components/ui/dialog"
import { useToast } from "@/frontend/app/hooks/use-toast"
import { firestoreService } from "@/frontend/app/lib/firebase/firestore-service"
import { useAlmacenData } from "@/frontend/app/lib/firebase/firestore-hooks.service"

interface CreateVentaModalProps {
  open: boolean
  onClose: () => void
}

export function CreateVentaModal({ open, onClose }: CreateVentaModalProps) {
  const { toast } = useToast()
  const { data: almacen = [] } = useAlmacenData()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    cliente: "",
    productoId: "",
    cantidad: 1,
    precioVentaUnidad: 0,
    precioCompraUnidad: 0,
    precioFlete: 500,
    estadoPago: "completo" as "completo" | "parcial" | "pendiente",
    montoPagado: 0,
  })

  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null)

  useEffect(() => {
    if (formData.productoId) {
      const producto = almacen.find((p) => p.id === formData.productoId)
      if (producto) {
        setProductoSeleccionado(producto)
        setFormData((prev) => ({
          ...prev,
          precioCompraUnidad: producto.valorUnitario,
          precioVentaUnidad: producto.valorUnitario * 1.3,
        }))
      }
    }
  }, [formData.productoId, almacen])

  const precioTotalUnidad = formData.precioVentaUnidad + formData.precioFlete
  const precioTotalVenta = precioTotalUnidad * formData.cantidad

  const distribucionBancos = {
    bovedaMonte: formData.precioCompraUnidad * formData.cantidad,
    fletes: formData.precioFlete * formData.cantidad,
    utilidades: (formData.precioVentaUnidad - formData.precioCompraUnidad) * formData.cantidad,
  }

  const nextStep = () => setStep((s) => Math.min(s + 1, 4))
  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const montoRealPagado =
        formData.estadoPago === "completo"
          ? precioTotalVenta
          : formData.estadoPago === "parcial"
            ? formData.montoPagado
            : 0

      const venta = {
        fecha: new Date().toISOString(),
        cliente: formData.cliente,
        producto: productoSeleccionado.nombre,
        cantidad: formData.cantidad,
        precioVentaUnidad: formData.precioVentaUnidad,
        precioCompraUnidad: formData.precioCompraUnidad,
        precioFlete: formData.precioFlete,
        precioTotalUnidad,
        precioTotalVenta,
        montoPagado: montoRealPagado,
        montoRestante: precioTotalVenta - montoRealPagado,
        estadoPago: formData.estadoPago,
        distribucionBancos,
      }

      await firestoreService.crearVenta(venta)

      toast({
        title: "Venta Exitosa",
        description:
          "Se registró la venta, se creó el perfil del cliente, se generó la salida en almacén y se distribuyó el dinero en los 3 bancos automáticamente.",
      })

      onClose()
      setFormData({
        cliente: "",
        productoId: "",
        cantidad: 1,
        precioVentaUnidad: 0,
        precioCompraUnidad: 0,
        precioFlete: 500,
        estadoPago: "completo",
        montoPagado: 0,
      })
      setStep(1)
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo registrar la venta.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 bg-black/95 border-white/10 text-white overflow-hidden flex flex-col">
        <DialogDescription className="sr-only">
          Formulario para registrar una nueva venta. Ingrese el cliente, seleccione el producto, defina el estado de
          pago y confirme la venta.
        </DialogDescription>

        {/* Header */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-green-500" />
            </div>
            <h2 className="text-lg font-bold">Nueva Venta</h2>
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
              {almacen.map((p) => (
                <div key={p.id} className="relative">
                  {p.stockActual > 0 && (
                    <div
                      className={`absolute left-4 top-8 w-0.5 h-8 ${step > p.id ? "bg-green-500" : "bg-white/10"}`}
                    />
                  )}
                  <div
                    className={`flex items-center gap-4 ${step === p.id ? "text-white" : step > p.id ? "text-green-500" : "text-white/40"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border ${step === p.id ? "border-white bg-white/10" : step > p.id ? "border-green-500 bg-green-500/10" : "border-white/10"}`}
                    >
                      <p.icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{p.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Form Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-bold">Información del Cliente</h3>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-white/60">Nombre del Cliente</label>
                    <input
                      type="text"
                      value={formData.cliente}
                      onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none transition-colors"
                      autoFocus
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-bold">Selección de Producto</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Producto</label>
                      <select
                        value={formData.productoId}
                        onChange={(e) => setFormData({ ...formData, productoId: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                      >
                        <option value="">Seleccionar...</option>
                        {almacen.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} ({p.stockActual} disp.)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Cantidad</label>
                      <input
                        type="number"
                        value={formData.cantidad}
                        max={productoSeleccionado?.stockActual || 999}
                        onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Precio Venta (Unitario)</label>
                      <input
                        type="number"
                        value={formData.precioVentaUnidad}
                        onChange={(e) => setFormData({ ...formData, precioVentaUnidad: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Precio Flete (Unitario)</label>
                      <input
                        type="number"
                        value={formData.precioFlete}
                        onChange={(e) => setFormData({ ...formData, precioFlete: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-bold">Detalles de Pago</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {["completo", "parcial", "pendiente"].map((type) => (
                      <div
                        key={type}
                        onClick={() => setFormData({ ...formData, estadoPago: type as any })}
                        className={`cursor-pointer p-4 rounded-xl border transition-all ${
                          formData.estadoPago === type
                            ? "bg-green-500/20 border-green-500"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="capitalize font-bold mb-1">{type}</div>
                        <div className="text-xs text-white/60">
                          {type === "completo" ? "Pago del 100%" : type === "parcial" ? "Pago inicial" : "Crédito"}
                        </div>
                      </div>
                    ))}
                  </div>
                  {formData.estadoPago === "parcial" && (
                    <div className="space-y-2 mt-6">
                      <label className="text-sm text-white/60">Monto Pagado (Abono Inicial)</label>
                      <input
                        type="number"
                        value={formData.montoPagado}
                        max={precioTotalVenta}
                        onChange={(e) => setFormData({ ...formData, montoPagado: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                        placeholder={`Máximo: $${precioTotalVenta.toLocaleString()}`}
                      />
                    </div>
                  )}
                  <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="font-bold mb-3">Distribución Automática en Bancos:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">Bóveda Monte (Costo):</span>
                        <span className="font-bold">${distribucionBancos.bovedaMonte.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Fletes:</span>
                        <span className="font-bold">${distribucionBancos.fletes.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Utilidades (Ganancia):</span>
                        <span className="font-bold text-green-400">
                          ${distribucionBancos.utilidades.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

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
                      <span className="font-bold">{formData.cliente}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Producto</span>
                      <span className="font-bold">
                        {productoSeleccionado?.nombre} x {formData.cantidad}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Estado Pago</span>
                      <span className="font-bold capitalize">{formData.estadoPago}</span>
                    </div>
                    <div className="h-px bg-white/10 my-4" />
                    <div className="flex justify-between items-center text-xl font-bold text-green-400">
                      <span>Total</span>
                      <span>${precioTotalVenta.toLocaleString()}</span>
                    </div>
                    {formData.estadoPago !== "completo" && (
                      <div className="flex justify-between items-center text-sm text-orange-400">
                        <span>Deuda Generada</span>
                        <span>
                          $
                          {(
                            precioTotalVenta - (formData.estadoPago === "parcial" ? formData.montoPagado : 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
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
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
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
