"use client"

/**
 * 💎 CREATE GASTO MODAL PREMIUM - Registro de Egresos/Gastos
 * 
 * Form ultra-premium para registrar gastos:
 * 1. Selección de banco origen (7 bancos)
 * 2. Categorías de gasto predefinidas
 * 3. Validación de saldo disponible
 * 4. Impacto visual en el capital
 * 5. Validación con Zod
 * 6. Glassmorphism futurista
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
  Wallet,
  TrendingDown,
  Calendar,
  Receipt,
  Loader2,
  X,
  AlertTriangle,
  Sparkles,
  ArrowDown,
  Building2,
  DollarSign,
  Zap,
  ShoppingBag,
  Car,
  Home,
  Utensils,
  Briefcase,
  Users,
  Wrench,
  Gift,
  CreditCard,
  Banknote,
  Truck,
  Package,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useToast } from "@/app/hooks/use-toast"
import { useAppStore } from "@/app/lib/store/useAppStore"
import { logger } from "@/app/lib/utils/logger"
import { formatearMonto } from "@/app/lib/validations/smart-forms-schemas"

// ============================================
// SCHEMA ZOD
// ============================================

const gastoSchema = z.object({
  bancoOrigen: z.enum([
    "boveda_monte", "boveda_usa", "profit", "leftie", 
    "azteca", "flete_sur", "utilidades"
  ]),
  categoria: z.string().min(1, "Selecciona una categoría"),
  monto: z.number().min(1, "El monto debe ser mayor a 0"),
  fecha: z.string().min(1, "La fecha es requerida"),
  concepto: z.string().min(1, "El concepto es requerido"),
  metodoPago: z.enum(["efectivo", "transferencia", "tarjeta"]),
  referencia: z.string().optional(),
  notas: z.string().optional(),
})

type GastoInput = z.infer<typeof gastoSchema>

// ============================================
// TIPOS Y CONSTANTES
// ============================================

interface CreateGastoModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

// 7 Bancos del sistema
const BANCOS = [
  { id: "boveda_monte", nombre: "Bóveda Monte", icono: "🏦", color: "blue", capital: 2500000 },
  { id: "boveda_usa", nombre: "Bóveda USA", icono: "🇺🇸", color: "indigo", capital: 850000 },
  { id: "profit", nombre: "Profit", icono: "💰", color: "green", capital: 1200000 },
  { id: "leftie", nombre: "Leftie", icono: "🎯", color: "orange", capital: 450000 },
  { id: "azteca", nombre: "Azteca", icono: "🌮", color: "red", capital: 320000 },
  { id: "flete_sur", nombre: "Flete Sur", icono: "🚚", color: "yellow", capital: 180000 },
  { id: "utilidades", nombre: "Utilidades", icono: "💎", color: "purple", capital: 750000 },
]

// Categorías de gastos
const CATEGORIAS = [
  { id: "operativos", nombre: "Operativos", icono: Briefcase, color: "blue" },
  { id: "transporte", nombre: "Transporte", icono: Truck, color: "orange" },
  { id: "mercancia", nombre: "Mercancía", icono: Package, color: "green" },
  { id: "personal", nombre: "Personal", icono: Users, color: "purple" },
  { id: "servicios", nombre: "Servicios", icono: Wrench, color: "yellow" },
  { id: "renta", nombre: "Renta/Local", icono: Home, color: "red" },
  { id: "comidas", nombre: "Comidas", icono: Utensils, color: "pink" },
  { id: "otros", nombre: "Otros", icono: Gift, color: "gray" },
]

const METODOS_PAGO = [
  { id: "efectivo", nombre: "Efectivo", icono: Banknote },
  { id: "transferencia", nombre: "Transferencia", icono: CreditCard },
  { id: "tarjeta", nombre: "Tarjeta", icono: CreditCard },
]

// Variantes de animación
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

export function CreateGastoModalPremium({ 
  open, 
  onClose, 
  onSuccess 
}: CreateGastoModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<GastoInput>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      bancoOrigen: "boveda_monte",
      categoria: "",
      monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      concepto: "",
      metodoPago: "efectivo",
      referencia: "",
      notas: "",
    },
  })

  const { watch, setValue, handleSubmit, reset, formState: { errors } } = form
  
  const bancoOrigen = watch("bancoOrigen")
  const categoria = watch("categoria")
  const monto = watch("monto")
  const metodoPago = watch("metodoPago")

  // Obtener banco seleccionado
  const bancoSeleccionado = React.useMemo(() => {
    return BANCOS.find(b => b.id === bancoOrigen)
  }, [bancoOrigen])

  // Validar saldo suficiente
  const saldoSuficiente = React.useMemo(() => {
    if (!bancoSeleccionado) return true
    return bancoSeleccionado.capital >= monto
  }, [bancoSeleccionado, monto])

  // Nuevo saldo después del gasto
  const nuevoSaldo = React.useMemo(() => {
    if (!bancoSeleccionado) return 0
    return bancoSeleccionado.capital - monto
  }, [bancoSeleccionado, monto])

  // Porcentaje del gasto respecto al capital
  const porcentajeGasto = React.useMemo(() => {
    if (!bancoSeleccionado || bancoSeleccionado.capital === 0) return 0
    return (monto / bancoSeleccionado.capital) * 100
  }, [bancoSeleccionado, monto])

  // Reset cuando se abre
  React.useEffect(() => {
    if (open) {
      reset()
    }
  }, [open, reset])

  // Submit
  const onSubmit = async (data: GastoInput) => {
    if (!saldoSuficiente) {
      toast({
        title: "Saldo Insuficiente",
        description: `El banco ${bancoSeleccionado?.nombre} no tiene saldo suficiente`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const gastoData = {
        ...data,
        nuevoSaldoBanco: nuevoSaldo,
        timestamp: new Date().toISOString(),
      }

      logger.info("Gasto registrado", { 
        data: gastoData,
        context: "CreateGastoModalPremium"
      })

      toast({
        title: "✅ Gasto Registrado",
        description: `${formatearMonto(data.monto)} de ${bancoSeleccionado?.nombre}`,
      })

      onClose()
      onSuccess?.()
      useAppStore.getState().triggerDataRefresh()

    } catch (error) {
      logger.error("Error al registrar gasto", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el gasto",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoriaSeleccionada = CATEGORIAS.find(c => c.id === categoria)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-2xl max-h-[90vh] p-0 overflow-hidden",
          "bg-black/60 backdrop-blur-2xl",
          "border border-white/10",
          "text-white",
          "shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_100px_rgba(239,68,68,0.15)]"
        )}
      >
        <DialogTitle className="sr-only">Registrar Gasto</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para registrar egresos del sistema
        </DialogDescription>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative flex flex-col h-full">
          {/* ===== HEADER ===== */}
          <div className="relative h-24 border-b border-white/10 bg-gradient-to-r from-red-500/10 via-transparent to-orange-500/10">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            
            <div className="relative h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/30"
                  whileHover={{ scale: 1.05, rotate: -5 }}
                >
                  <TrendingDown className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Registrar Gasto</h2>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <ArrowDown className="w-3 h-3 text-red-400" />
                    Egreso de capital
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
            {/* Sección 1: Banco Origen */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Banco Origen</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {BANCOS.map((banco) => (
                  <motion.button
                    key={banco.id}
                    type="button"
                    onClick={() => setValue("bancoOrigen", banco.id as typeof bancoOrigen)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative p-3 rounded-xl border text-center transition-all overflow-hidden",
                      bancoOrigen === banco.id
                        ? `bg-${banco.color}-500/20 border-${banco.color}-500 shadow-lg`
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                    style={{
                      backgroundColor: bancoOrigen === banco.id ? `var(--${banco.color}-500-20, rgba(59, 130, 246, 0.2))` : undefined,
                      borderColor: bancoOrigen === banco.id ? `var(--${banco.color}-500, #3b82f6)` : undefined,
                    }}
                  >
                    <span className="text-2xl mb-1 block">{banco.icono}</span>
                    <p className={cn(
                      "text-xs font-medium truncate",
                      bancoOrigen === banco.id ? "text-white" : "text-gray-400"
                    )}>
                      {banco.nombre}
                    </p>
                    <p className={cn(
                      "text-[10px]",
                      bancoOrigen === banco.id ? "text-green-400" : "text-gray-500"
                    )}>
                      {formatearMonto(banco.capital)}
                    </p>
                    {bancoOrigen === banco.id && (
                      <motion.div
                        layoutId="banco-indicator"
                        className="absolute inset-0 border-2 border-blue-500 rounded-xl"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Info del banco seleccionado */}
              {bancoSeleccionado && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{bancoSeleccionado.icono}</span>
                      <div>
                        <p className="font-medium text-white">{bancoSeleccionado.nombre}</p>
                        <p className="text-sm text-gray-400">Capital disponible</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">
                        {formatearMonto(bancoSeleccionado.capital)}
                      </p>
                      {monto > 0 && (
                        <p className={cn(
                          "text-sm",
                          saldoSuficiente ? "text-yellow-400" : "text-red-400"
                        )}>
                          → {formatearMonto(nuevoSaldo)}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Sección 2: Monto y Categoría */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Monto del Gasto</h3>
              </div>

              <div className={cn(
                "p-5 rounded-2xl border",
                "bg-gradient-to-br from-white/5 to-transparent",
                "border-white/10"
              )}>
                {/* Input grande */}
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-gray-500">$</span>
                  <Input
                    type="number"
                    {...form.register("monto", { valueAsNumber: true })}
                    className={cn(
                      "pl-12 h-20 text-4xl font-bold text-center",
                      "bg-red-500/5 border-red-500/20 text-red-300",
                      "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                      !saldoSuficiente && "border-red-500 animate-pulse",
                      errors.monto && "border-red-500/50"
                    )}
                    placeholder="0"
                  />
                </div>

                {/* Alerta de saldo insuficiente */}
                {!saldoSuficiente && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/50 mb-4"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-red-300">
                      Saldo insuficiente en {bancoSeleccionado?.nombre}
                    </span>
                  </motion.div>
                )}

                {/* Barra de impacto */}
                {bancoSeleccionado && monto > 0 && saldoSuficiente && (
                  <div className="space-y-2 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Impacto en el capital</span>
                      <span className={cn(
                        "font-bold",
                        porcentajeGasto > 50 ? "text-red-400" :
                        porcentajeGasto > 25 ? "text-orange-400" : "text-yellow-400"
                      )}>
                        -{porcentajeGasto.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full",
                          porcentajeGasto > 50 ? "bg-gradient-to-r from-red-500 to-orange-500" :
                          porcentajeGasto > 25 ? "bg-gradient-to-r from-orange-500 to-yellow-500" :
                          "bg-gradient-to-r from-yellow-500 to-green-500"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, porcentajeGasto)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Categorías */}
              <div className="space-y-3">
                <Label className="text-sm text-gray-400">Categoría</Label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIAS.map((cat) => (
                    <motion.button
                      key={cat.id}
                      type="button"
                      onClick={() => setValue("categoria", cat.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "p-3 rounded-xl border text-center transition-all",
                        categoria === cat.id
                          ? "bg-white/10 border-white/30 text-white"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      <cat.icono className={cn(
                        "w-5 h-5 mx-auto mb-1",
                        categoria === cat.id && "text-white"
                      )} />
                      <p className="text-[10px] font-medium">{cat.nombre}</p>
                    </motion.button>
                  ))}
                </div>
                {errors.categoria && (
                  <p className="text-xs text-red-400">{errors.categoria.message}</p>
                )}
              </div>
            </motion.div>

            {/* Sección 3: Detalles */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Detalles</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Fecha
                  </Label>
                  <Input
                    type="date"
                    {...form.register("fecha")}
                    className="h-11 bg-white/5 border-white/10 text-white [color-scheme:dark]"
                  />
                </div>

                {/* Método de pago */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Método de Pago</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {METODOS_PAGO.map((metodo) => (
                      <button
                        key={metodo.id}
                        type="button"
                        onClick={() => setValue("metodoPago", metodo.id as "efectivo" | "transferencia" | "tarjeta")}
                        className={cn(
                          "p-2 rounded-lg border text-center transition-all",
                          metodoPago === metodo.id
                            ? "bg-white/10 border-white/30"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                      >
                        <metodo.icono className="w-4 h-4 mx-auto mb-1" />
                        <p className="text-[10px]">{metodo.nombre}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Concepto */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-400">Concepto *</Label>
                <Input
                  {...form.register("concepto")}
                  placeholder="Describe el gasto (ej: Pago de flete OC0008, Gasolina, etc.)"
                  className={cn(
                    "h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500",
                    errors.concepto && "border-red-500/50"
                  )}
                />
                {errors.concepto && (
                  <p className="text-xs text-red-400">{errors.concepto.message}</p>
                )}
              </div>

              {/* Referencia y Notas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Referencia (opcional)</Label>
                  <Input
                    {...form.register("referencia")}
                    placeholder="No. factura, ticket, etc."
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Notas (opcional)</Label>
                  <Input
                    {...form.register("notas")}
                    placeholder="Notas adicionales..."
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </motion.div>

            {/* Resumen Visual */}
            {bancoSeleccionado && monto > 0 && saldoSuficiente && categoriaSeleccionada && (
              <motion.div 
                variants={itemVariants}
                className={cn(
                  "p-5 rounded-2xl border",
                  "bg-gradient-to-br from-red-500/10 to-orange-500/10",
                  "border-red-500/30"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">Resumen del Gasto</span>
                  <Badge variant="outline" className="border-red-500/30 text-red-400">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Egreso
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Banco</p>
                    <p className="text-lg font-bold text-white flex items-center justify-center gap-2">
                      <span>{bancoSeleccionado.icono}</span>
                      {bancoSeleccionado.nombre}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Categoría</p>
                    <p className="text-lg font-bold text-white flex items-center justify-center gap-2">
                      <categoriaSeleccionada.icono className="w-5 h-5" />
                      {categoriaSeleccionada.nombre}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Monto</p>
                    <p className="text-lg font-bold text-red-400">
                      -{formatearMonto(monto)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-sm text-gray-400">Nuevo saldo de {bancoSeleccionado.nombre}:</span>
                  <motion.span 
                    className="text-lg font-bold text-yellow-400"
                    key={nuevoSaldo}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    {formatearMonto(nuevoSaldo)}
                  </motion.span>
                </div>
              </motion.div>
            )}
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
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !saldoSuficiente || monto <= 0}
              className={cn(
                "min-w-[180px]",
                "bg-gradient-to-r from-red-600 to-orange-600",
                "hover:from-red-500 hover:to-orange-500",
                "text-white font-bold",
                "shadow-[0_0_30px_rgba(239,68,68,0.4)]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Registrar Gasto
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateGastoModalPremium
