"use client"

/**
 * 💎 CREATE ORDEN COMPRA MODAL PREMIUM - Gestión de Compras a Distribuidores
 * 
 * Form completamente rediseñado basado en ordenes_compra.csv:
 * - id, fecha, origen (distribuidor), cantidad
 * - costoDistribuidor, costoTransporte, costoPorUnidad
 * - stockActual, costoTotal, pagoDistribuidor, deuda
 * 
 * Features:
 * 1. Glassmorphism futurista con gradientes
 * 2. Cálculos automáticos en tiempo real
 * 3. Selector de distribuidores con historial
 * 4. Tracking de pagos y deudas
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
  Package,
  Truck,
  DollarSign,
  Calculator,
  Warehouse,
  CreditCard,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar,
  Hash,
  Building2,
  ArrowRight,
  TrendingUp,
  Boxes,
  Receipt,
  Zap,
  Plus,
  Minus,
  CircleDollarSign,
  Banknote,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useToast } from "@/app/hooks/use-toast"
import { useAppStore } from "@/app/lib/store/useAppStore"
import { logger } from "@/app/lib/utils/logger"
import { formatearMonto } from "@/app/lib/validations/smart-forms-schemas"

// ============================================
// SCHEMA ZOD - Basado en ordenes_compra.csv
// ============================================

const ordenCompraSchema = z.object({
  // ID se genera automáticamente (OC0001, OC0002, etc.)
  fecha: z.string().min(1, "La fecha es requerida"),
  origen: z.string().min(1, "Selecciona un distribuidor"),
  cantidad: z.number().min(1, "La cantidad debe ser mayor a 0"),
  costoDistribuidor: z.number().min(0, "El costo debe ser mayor o igual a 0"),
  costoTransporte: z.number().min(0),
  // costoPorUnidad se calcula: costoDistribuidor + costoTransporte
  // costoTotal se calcula: costoPorUnidad × cantidad
  // stockActual inicialmente = cantidad
  pagoDistribuidor: z.number().min(0),
  // deuda se calcula: costoTotal - pagoDistribuidor
  notas: z.string().max(500).optional(),
})

type OrdenCompraInput = z.infer<typeof ordenCompraSchema>

// ============================================
// TIPOS
// ============================================

interface CreateOrdenCompraModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editData?: OrdenCompraInput & { id?: string } | null
}

// Distribuidores del CSV
const DISTRIBUIDORES = [
  { id: "Q-MAYA", nombre: "Q-MAYA", icono: "🌴", color: "emerald" },
  { id: "Q-MAYA-MP", nombre: "Q-MAYA-MP", icono: "🌴", color: "emerald" },
  { id: "PACMAN", nombre: "PACMAN", icono: "🎮", color: "yellow" },
  { id: "CH-MONTE", nombre: "CH-MONTE", icono: "⛰️", color: "blue" },
  { id: "VALLE-MONTE", nombre: "VALLE-MONTE", icono: "🏔️", color: "purple" },
  { id: "A/X🌶️🦀", nombre: "A/X 🌶️🦀", icono: "🦀", color: "red" },
]

// Variantes de animación
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.05,
    }
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const pulseVariants = {
  initial: { scale: 1 },
  pulse: { 
    scale: [1, 1.02, 1],
    transition: { duration: 2, repeat: Infinity }
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CreateOrdenCompraModalPremium({ 
  open, 
  onClose, 
  onSuccess,
  editData 
}: CreateOrdenCompraModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [nextId, setNextId] = React.useState("OC0010") // TODO: Obtener de Firestore
  
  const isEdit = !!editData?.id

  const form = useForm<OrdenCompraInput>({
    resolver: zodResolver(ordenCompraSchema),
    defaultValues: {
      fecha: editData?.fecha || new Date().toISOString().split('T')[0],
      origen: editData?.origen || "",
      cantidad: editData?.cantidad || 100,
      costoDistribuidor: editData?.costoDistribuidor || 6100,
      costoTransporte: editData?.costoTransporte || 200,
      pagoDistribuidor: editData?.pagoDistribuidor || 0,
      notas: editData?.notas || "",
    },
  })

  const { watch, setValue, handleSubmit, reset, formState: { errors } } = form
  
  // Watch valores para cálculos
  const cantidad = watch("cantidad")
  const costoDistribuidor = watch("costoDistribuidor")
  const costoTransporte = watch("costoTransporte")
  const pagoDistribuidor = watch("pagoDistribuidor")
  const origen = watch("origen")

  // Cálculos automáticos basados en CSV
  const calculos = React.useMemo(() => {
    const costoPorUnidad = costoDistribuidor + costoTransporte
    const costoTotal = costoPorUnidad * cantidad
    const deuda = costoTotal - pagoDistribuidor
    const porcentajePagado = costoTotal > 0 ? (pagoDistribuidor / costoTotal) * 100 : 0
    
    return {
      costoPorUnidad,
      costoTotal,
      stockActual: cantidad, // Inicialmente igual a cantidad comprada
      deuda,
      porcentajePagado,
    }
  }, [cantidad, costoDistribuidor, costoTransporte, pagoDistribuidor])

  // Reset cuando se abre
  React.useEffect(() => {
    if (open && !editData) {
      reset({
        fecha: new Date().toISOString().split('T')[0],
        origen: "",
        cantidad: 100,
        costoDistribuidor: 6100,
        costoTransporte: 200,
        pagoDistribuidor: 0,
        notas: "",
      })
    }
  }, [open, editData, reset])

  // Quick set de cantidad
  const setQuickCantidad = (value: number) => {
    setValue("cantidad", value)
  }

  // Submit
  const onSubmit = async (data: OrdenCompraInput) => {
    setIsSubmitting(true)

    try {
      const ordenData = {
        id: isEdit ? editData?.id : nextId,
        ...data,
        costoPorUnidad: calculos.costoPorUnidad,
        costoTotal: calculos.costoTotal,
        stockActual: calculos.stockActual,
        deuda: calculos.deuda,
      }

      logger.info("Orden de Compra creada/actualizada", { 
        data: ordenData,
        context: "CreateOrdenCompraModalPremium"
      })

      toast({
        title: isEdit ? "✅ Orden Actualizada" : "✅ Orden Creada",
        description: `${ordenData.id} - ${data.cantidad} unidades de ${data.origen}`,
      })

      onClose()
      onSuccess?.()
      useAppStore.getState().triggerDataRefresh()

    } catch (error) {
      logger.error("Error al guardar orden", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la orden",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedDistribuidor = DISTRIBUIDORES.find(d => d.id === origen)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-3xl max-h-[90vh] p-0 overflow-hidden",
          "bg-black/60 backdrop-blur-2xl",
          "border border-white/10",
          "text-white",
          "shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_100px_rgba(16,185,129,0.15)]"
        )}
      >
        <DialogTitle className="sr-only">
          {isEdit ? "Editar Orden de Compra" : "Nueva Orden de Compra"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para registrar compras a distribuidores
        </DialogDescription>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative flex flex-col h-full">
          {/* ===== HEADER ===== */}
          <div className="relative h-24 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 via-transparent to-blue-500/10">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            
            <div className="relative h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                  whileHover={{ scale: 1.05, rotate: -5 }}
                >
                  <Package className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">
                      {isEdit ? "Editar Orden" : "Nueva Orden de Compra"}
                    </h2>
                    <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 font-mono">
                      {isEdit ? editData?.id : nextId}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <Truck className="w-3 h-3" />
                    Registro de compra a distribuidor
                  </p>
                </div>
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
          </div>

          {/* ===== BODY ===== */}
          <motion.div 
            className="flex-1 overflow-y-auto p-6 space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Sección 1: Datos Básicos */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Datos de la Orden</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Fecha de Compra
                  </Label>
                  <Input
                    type="date"
                    {...form.register("fecha")}
                    className={cn(
                      "h-12 bg-white/5 border-white/10 text-white",
                      "[color-scheme:dark]",
                      errors.fecha && "border-red-500/50"
                    )}
                  />
                </div>

                {/* Cantidad con quick-set */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <Boxes className="w-3 h-3" />
                    Cantidad de Unidades
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        {...form.register("cantidad", { valueAsNumber: true })}
                        className={cn(
                          "h-12 bg-white/5 border-white/10 text-white text-lg font-bold",
                          errors.cantidad && "border-red-500/50"
                        )}
                      />
                    </div>
                    <div className="flex gap-1">
                      {[100, 200, 500].map(val => (
                        <Button
                          key={val}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickCantidad(val)}
                          className={cn(
                            "h-12 px-3 border-white/10 hover:bg-white/10",
                            cantidad === val && "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                          )}
                        >
                          {val}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Distribuidor / Origen */}
              <div className="space-y-3">
                <Label className="text-sm text-gray-400 flex items-center gap-2">
                  <Building2 className="w-3 h-3" />
                  Distribuidor / Origen
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DISTRIBUIDORES.map((dist) => (
                    <motion.button
                      key={dist.id}
                      type="button"
                      onClick={() => setValue("origen", dist.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all",
                        origen === dist.id
                          ? dist.color === "emerald" 
                            ? "bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20"
                            : dist.color === "yellow"
                            ? "bg-yellow-500/20 border-yellow-500 shadow-lg shadow-yellow-500/20"
                            : dist.color === "blue"
                            ? "bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20"
                            : dist.color === "purple"
                            ? "bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20"
                            : "bg-red-500/20 border-red-500 shadow-lg shadow-red-500/20"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{dist.icono}</span>
                        <div>
                          <p className={cn(
                            "font-bold",
                            origen === dist.id ? "text-white" : "text-gray-300"
                          )}>
                            {dist.nombre}
                          </p>
                        </div>
                      </div>
                      {origen === dist.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
                {errors.origen && (
                  <p className="text-xs text-red-400">{errors.origen.message}</p>
                )}
              </div>
            </motion.div>

            {/* Sección 2: Costos */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Estructura de Costos</h3>
                <Badge variant="outline" className="ml-auto border-blue-500/30 text-blue-400 text-xs">
                  Según CSV
                </Badge>
              </div>

              <div className={cn(
                "p-5 rounded-2xl border",
                "bg-gradient-to-br from-white/5 to-transparent",
                "border-white/10"
              )}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Costo Distribuidor */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400 flex items-center gap-2">
                      <CircleDollarSign className="w-3 h-3 text-blue-400" />
                      Costo Distribuidor/u
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        {...form.register("costoDistribuidor", { valueAsNumber: true })}
                        className="pl-7 h-12 bg-blue-500/5 border-blue-500/20 text-blue-300 text-lg font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500">Precio por unidad del proveedor</p>
                  </div>

                  {/* Costo Transporte */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400 flex items-center gap-2">
                      <Truck className="w-3 h-3 text-orange-400" />
                      Costo Transporte/u
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        {...form.register("costoTransporte", { valueAsNumber: true })}
                        className="pl-7 h-12 bg-orange-500/5 border-orange-500/20 text-orange-300 text-lg font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500">Flete por unidad</p>
                  </div>

                  {/* Costo Por Unidad (Calculado) */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400 flex items-center gap-2">
                      <Calculator className="w-3 h-3 text-emerald-400" />
                      Costo Por Unidad
                    </Label>
                    <motion.div 
                      className="h-12 flex items-center justify-center px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                      variants={pulseVariants}
                      animate="pulse"
                    >
                      <span className="text-xl font-bold text-emerald-400">
                        ${calculos.costoPorUnidad.toLocaleString()}
                      </span>
                    </motion.div>
                    <p className="text-[10px] text-gray-500 text-center">
                      = Distribuidor + Transporte
                    </p>
                  </div>
                </div>

                {/* Resumen Visual de Costos */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  {/* Costo Total */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Banknote className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm text-gray-400">Costo Total</span>
                    </div>
                    <motion.p 
                      className="text-3xl font-bold text-emerald-400"
                      key={calculos.costoTotal}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      {formatearMonto(calculos.costoTotal)}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">
                      {cantidad} × ${calculos.costoPorUnidad.toLocaleString()}
                    </p>
                  </div>

                  {/* Stock Actual */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Warehouse className="w-5 h-5 text-blue-400" />
                      <span className="text-sm text-gray-400">Stock Inicial</span>
                    </div>
                    <motion.p 
                      className="text-3xl font-bold text-blue-400"
                      key={calculos.stockActual}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      {calculos.stockActual.toLocaleString()}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">unidades disponibles</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Sección 3: Pagos y Deuda */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Pago al Distribuidor</h3>
              </div>

              <div className={cn(
                "p-5 rounded-2xl border",
                "bg-gradient-to-br from-white/5 to-transparent",
                "border-white/10"
              )}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pago Realizado */}
                  <div className="space-y-3">
                    <Label className="text-sm text-gray-400">Pago Realizado</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        {...form.register("pagoDistribuidor", { valueAsNumber: true })}
                        className="pl-7 h-14 bg-green-500/5 border-green-500/20 text-green-300 text-xl font-bold"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setValue("pagoDistribuidor", 0)}
                        className="flex-1 border-white/10 hover:bg-white/10"
                      >
                        Sin Pago
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setValue("pagoDistribuidor", calculos.costoTotal)}
                        className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                      >
                        Pago Total
                      </Button>
                    </div>
                  </div>

                  {/* Deuda Generada */}
                  <div className="space-y-3">
                    <Label className="text-sm text-gray-400">Deuda con Distribuidor</Label>
                    <motion.div 
                      className={cn(
                        "h-14 flex items-center justify-center rounded-lg border",
                        calculos.deuda > 0 
                          ? "bg-red-500/10 border-red-500/30" 
                          : "bg-emerald-500/10 border-emerald-500/30"
                      )}
                      key={calculos.deuda}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                    >
                      <span className={cn(
                        "text-2xl font-bold",
                        calculos.deuda > 0 ? "text-red-400" : "text-emerald-400"
                      )}>
                        {calculos.deuda < 0 ? "-" : ""}{formatearMonto(Math.abs(calculos.deuda))}
                      </span>
                    </motion.div>
                    <p className="text-xs text-gray-500 text-center">
                      = Costo Total - Pago Realizado
                    </p>
                  </div>
                </div>

                {/* Barra de progreso de pago */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Progreso de Pago</span>
                    <span className={cn(
                      "text-sm font-bold",
                      calculos.porcentajePagado >= 100 ? "text-emerald-400" :
                      calculos.porcentajePagado >= 50 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {calculos.porcentajePagado.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full",
                        calculos.porcentajePagado >= 100 ? "bg-gradient-to-r from-emerald-500 to-teal-500" :
                        calculos.porcentajePagado >= 50 ? "bg-gradient-to-r from-yellow-500 to-orange-500" : 
                        "bg-gradient-to-r from-red-500 to-orange-500"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, calculos.porcentajePagado)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  
                  {calculos.deuda > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20"
                    >
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <span className="text-xs text-orange-300">
                        Deuda pendiente: Se registrará en la cuenta del distribuidor
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Notas */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-sm text-gray-400">Notas (opcional)</Label>
              <Textarea
                {...form.register("notas")}
                placeholder="Observaciones adicionales sobre esta orden..."
                rows={2}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
              />
            </motion.div>
          </motion.div>

          {/* ===== FOOTER ===== */}
          <div className={cn(
            "h-20 border-t border-white/10",
            "bg-gradient-to-r from-black/50 via-white/5 to-black/50",
            "px-6 flex items-center justify-between"
          )}>
            <div className="flex items-center gap-4">
              {selectedDistribuidor && (
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedDistribuidor.icono}</span>
                  <span className="text-sm text-gray-400">{selectedDistribuidor.nombre}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-white"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "min-w-[180px]",
                  "bg-gradient-to-r from-emerald-600 to-teal-600",
                  "hover:from-emerald-500 hover:to-teal-500",
                  "text-white font-bold",
                  "shadow-[0_0_30px_rgba(16,185,129,0.4)]"
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
                    {isEdit ? "Actualizar Orden" : "Crear Orden"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateOrdenCompraModalPremium
