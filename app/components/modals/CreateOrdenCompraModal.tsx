"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Package, DollarSign, Truck, Check, ChevronRight, Building } from "lucide-react"
import { Dialog, DialogContent, DialogDescription } from "@/frontend/app/components/ui/dialog"
import { useToast } from "@/frontend/app/hooks/use-toast"
import { firestoreService } from "@/frontend/app/lib/firebase/firestore-service"
import type { BancoId } from "@/frontend/app/types"

interface CreateOrdenCompraModalProps {
  open: boolean
  onClose: () => void
}

export function CreateOrdenCompraModal({ open, onClose }: CreateOrdenCompraModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<{
    distribuidor: string
    origen: string
    producto: string
    cantidad: number
    costoDistribuidor: number
    costoTransporte: number
    pagoInicial: number
    bancoOrigen: BancoId
  }>({
    distribuidor: "",
    origen: "",
    producto: "",
    cantidad: 1,
    costoDistribuidor: 0,
    costoTransporte: 0,
    pagoInicial: 0,
    bancoOrigen: "boveda_monte",
  })

  const steps = [
    { id: 1, title: "Proveedor", icon: Building },
    { id: 2, title: "Detalles", icon: Package },
    { id: 3, title: "Costos", icon: DollarSign },
    { id: 4, title: "Confirmar", icon: Check },
  ]

  const nextStep = () => setStep((s) => Math.min(s + 1, 4))
  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const costoPorUnidad = formData.costoDistribuidor + formData.costoTransporte
      const costoTotal = costoPorUnidad * formData.cantidad

      const estado: "pagado" | "parcial" | "pendiente" = 
        formData.pagoInicial === costoTotal ? "pagado" : 
        formData.pagoInicial > 0 ? "parcial" : "pendiente"

      // Generar keywords para búsqueda
      const keywords = [
        formData.distribuidor.toLowerCase(),
        formData.origen.toLowerCase(),
        formData.producto.toLowerCase(),
      ].filter(Boolean)

      const ordenCompra = {
        fecha: new Date().toISOString(),
        distribuidorId: formData.distribuidor.toLowerCase().replace(/\s+/g, '_'),
        distribuidor: formData.distribuidor,
        origen: formData.origen,
        producto: formData.producto,
        cantidad: formData.cantidad,
        costoDistribuidor: formData.costoDistribuidor,
        costoTransporte: formData.costoTransporte,
        costoPorUnidad,
        costoTotal,
        stockActual: formData.cantidad,
        stockInicial: formData.cantidad,
        pagoDistribuidor: formData.pagoInicial,
        pagoInicial: formData.pagoInicial,
        deuda: costoTotal - formData.pagoInicial,
        estado,
        bancoOrigen: formData.bancoOrigen,
        keywords,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await firestoreService.crearOrdenCompra(ordenCompra)

      toast({
        title: "Orden Creada",
        description:
          "La orden se registró en Firestore. Se creó el perfil del distribuidor, se generó la entrada en almacén y se actualizó el banco.",
      })

      onClose()
      setFormData({
        distribuidor: "",
        origen: "",
        producto: "",
        cantidad: 1,
        costoDistribuidor: 0,
        costoTransporte: 0,
        pagoInicial: 0,
        bancoOrigen: "boveda_monte",
      })
      setStep(1)
    } catch (error) {
      toast({ title: "Error", description: "No se pudo crear la orden.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 bg-black/95 border-white/10 text-white overflow-hidden flex flex-col">
        <DialogDescription className="sr-only">
          Formulario para crear una nueva orden de compra. Complete los datos del distribuidor, detalles del producto,
          costos y confirme la orden.
        </DialogDescription>

        <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Truck className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-lg font-bold">Nueva Orden de Compra</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r border-white/10 p-6 bg-white/5 hidden md:block">
            <div className="space-y-6">
              {steps.map((s, i) => (
                <div key={s.id} className="relative">
                  {i < steps.length - 1 && (
                    <div className={`absolute left-4 top-8 w-0.5 h-8 ${step > s.id ? "bg-blue-500" : "bg-white/10"}`} />
                  )}
                  <div
                    className={`flex items-center gap-4 ${step === s.id ? "text-white" : step > s.id ? "text-blue-500" : "text-white/40"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border ${step === s.id ? "border-white bg-white/10" : step > s.id ? "border-blue-500 bg-blue-500/10" : "border-white/10"}`}
                    >
                      <s.icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{s.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                  <h3 className="text-2xl font-bold">Datos del Proveedor</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Distribuidor</label>
                      <input
                        type="text"
                        value={formData.distribuidor}
                        onChange={(e) => setFormData({ ...formData, distribuidor: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Origen</label>
                      <input
                        type="text"
                        value={formData.origen}
                        onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
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
                  <h3 className="text-2xl font-bold">Detalles del Producto</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Producto</label>
                      <input
                        type="text"
                        value={formData.producto}
                        onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Cantidad</label>
                      <input
                        type="number"
                        value={formData.cantidad}
                        onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
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
                  <h3 className="text-2xl font-bold">Costos y Pagos</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Costo Distribuidor (Unitario)</label>
                      <input
                        type="number"
                        value={formData.costoDistribuidor}
                        onChange={(e) => setFormData({ ...formData, costoDistribuidor: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Costo Transporte (Unitario)</label>
                      <input
                        type="number"
                        value={formData.costoTransporte}
                        onChange={(e) => setFormData({ ...formData, costoTransporte: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Pago Inicial</label>
                      <input
                        type="number"
                        value={formData.pagoInicial}
                        onChange={(e) => setFormData({ ...formData, pagoInicial: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                        placeholder="0 para crédito total"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Banco para Pago</label>
                      <select
                        value={formData.bancoOrigen}
                        onChange={(e) => setFormData({ ...formData, bancoOrigen: e.target.value as BancoId })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="boveda_monte">Bóveda Monte</option>
                        <option value="boveda_usa">Bóveda USA</option>
                        <option value="profit">Profit</option>
                        <option value="leftie">Leftie</option>
                        <option value="azteca">Azteca</option>
                        <option value="flete_sur">Flete Sur</option>
                        <option value="utilidades">Utilidades</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">Costo Total:</span>
                        <span className="ml-2 font-bold">
                          $
                          {(
                            (formData.costoDistribuidor + formData.costoTransporte) *
                            formData.cantidad
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/60">Deuda Generada:</span>
                        <span className="ml-2 font-bold text-orange-400">
                          $
                          {(
                            (formData.costoDistribuidor + formData.costoTransporte) * formData.cantidad -
                            formData.pagoInicial
                          ).toLocaleString()}
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
                  <h3 className="text-2xl font-bold">Confirmar Orden</h3>
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Distribuidor</span>
                      <span className="font-bold">{formData.distribuidor}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Producto</span>
                      <span className="font-bold">
                        {formData.producto} x {formData.cantidad}
                      </span>
                    </div>
                    <div className="h-px bg-white/10 my-4" />
                    <div className="flex justify-between items-center text-xl font-bold text-blue-400">
                      <span>Total Estimado</span>
                      <span>
                        $
                        {((formData.costoDistribuidor + formData.costoTransporte) * formData.cantidad).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

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
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? "Procesando..." : step === 4 ? "Confirmar Orden" : "Siguiente"}
            {!loading && step !== 4 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateOrdenCompraModal
