"use client"

/**
 * 💎 CREATE DISTRIBUIDOR MODAL PREMIUM
 * 
 * Modal para crear distribuidores con diseño glassmorphism premium.
 * Distribuidores del sistema según CSV:
 * - Q-MAYA, PACMAN, CH-MONTE, VALLE-MONTE, A/X🌶️🦀, Q-MAYA-MP
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
import { Textarea } from "@/app/components/ui/textarea"
import { Badge } from "@/app/components/ui/badge"
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Loader2,
  X,
  CheckCircle2,
  Sparkles,
  User,
  DollarSign,
  Truck,
  Package,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useToast } from "@/app/hooks/use-toast"
import { useAppStore } from "@/app/lib/store/useAppStore"
import { logger } from "@/app/lib/utils/logger"
import { crearDistribuidor } from "@/app/lib/firebase/firestore-service"

// ============================================
// SCHEMA ZOD
// ============================================

const distribuidorPremiumSchema = z.object({
  nombre: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  estado: z.string().optional(),
  precioBase: z.number().min(0, "El precio debe ser positivo"),
  precioTransporte: z.number().min(0, "El precio debe ser positivo"),
  notas: z.string().optional(),
  activo: z.boolean(),
})

type DistribuidorPremiumInput = z.infer<typeof distribuidorPremiumSchema>

// ============================================
// TIPOS Y CONSTANTES
// ============================================

interface CreateDistribuidorModalPremiumProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

// Distribuidores existentes del CSV
const DISTRIBUIDORES_EXISTENTES = [
  { id: "q-maya", nombre: "Q-MAYA", ordenes: 3, total: 6098400 },
  { id: "pacman", nombre: "PACMAN", ordenes: 2, total: 6142500 },
  { id: "ch-monte", nombre: "CH-MONTE", ordenes: 1, total: 630000 },
  { id: "valle-monte", nombre: "VALLE-MONTE", ordenes: 1, total: 140000 },
  { id: "ax", nombre: "A/X🌶️🦀", ordenes: 1, total: 207900 },
  { id: "q-maya-mp", nombre: "Q-MAYA-MP", ordenes: 1, total: 1260000 },
]

// Estados de México
const ESTADOS_MEXICO = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo",
  "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
  "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
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

export function CreateDistribuidorModalPremium({ 
  open, 
  onClose, 
  onSuccess 
}: CreateDistribuidorModalPremiumProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showSuccess, setShowSuccess] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<DistribuidorPremiumInput>({
    resolver: zodResolver(distribuidorPremiumSchema),
    mode: "onChange",
    defaultValues: {
      nombre: "",
      contacto: "",
      telefono: "",
      email: "",
      direccion: "",
      ciudad: "",
      estado: "",
      precioBase: 6100, // Precio base según CSV
      precioTransporte: 200, // Transporte según CSV
      notas: "",
      activo: true,
    },
  })

  const watchedNombre = watch("nombre")
  const watchedPrecioBase = watch("precioBase")
  const watchedPrecioTransporte = watch("precioTransporte")

  // Precio total por unidad
  const precioTotal = (watchedPrecioBase || 0) + (watchedPrecioTransporte || 0)

  // Reset form cuando se abre el modal
  React.useEffect(() => {
    if (open) {
      reset()
      setShowSuccess(false)
    }
  }, [open, reset])

  // Submit
  const onSubmit = async (data: DistribuidorPremiumInput) => {
    setIsSubmitting(true)

    try {
      const distribuidorData = {
        nombre: data.nombre.trim().toUpperCase(),
        empresa: data.contacto?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        email: data.email?.trim() || undefined,
        direccion: data.direccion?.trim() || undefined,
        origen: data.estado?.trim() || undefined,
      }

      const docId = await crearDistribuidor(distribuidorData)

      logger.info("Distribuidor creado exitosamente", {
        context: "CreateDistribuidorModalPremium",
        data: { id: docId, nombre: data.nombre }
      })

      setShowSuccess(true)

      setTimeout(() => {
        toast({
          title: "✅ Distribuidor Creado",
          description: `${data.nombre.toUpperCase()} agregado al sistema`,
        })
        onClose()
        onSuccess?.()
        useAppStore.getState().triggerDataRefresh()
      }, 1500)

    } catch (error) {
      logger.error("Error al crear distribuidor", error, {
        context: "CreateDistribuidorModalPremium"
      })
      toast({
        title: "Error",
        description: "No se pudo crear el distribuidor",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-2xl max-h-[90vh] p-0 overflow-hidden",
          "bg-black/60 backdrop-blur-2xl",
          "border border-white/10",
          "text-white",
          "shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_100px_rgba(168,85,247,0.15)]"
        )}
      >
        <DialogTitle className="sr-only">Nuevo Distribuidor</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para agregar un nuevo distribuidor al sistema
        </DialogDescription>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </div>

        <AnimatePresence mode="wait">
          {showSuccess ? (
            // ===== PANTALLA DE ÉXITO =====
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white mb-2"
              >
                ¡Distribuidor Creado!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400"
              >
                {watchedNombre?.toUpperCase()} ha sido agregado al sistema
              </motion.p>
            </motion.div>
          ) : (
            // ===== FORMULARIO =====
            <motion.form
              key="form"
              onSubmit={handleSubmit(onSubmit)}
              className="relative flex flex-col h-full"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Header */}
              <div className="relative h-20 border-b border-white/10 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                
                <div className="relative h-full px-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                      <Building2 className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Nuevo Distribuidor</h2>
                      <p className="text-sm text-gray-400">Agregar proveedor al sistema</p>
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

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Distribuidores existentes */}
                <motion.div variants={itemVariants} className="mb-6">
                  <Label className="text-xs text-gray-500 mb-2 block">Distribuidores Existentes</Label>
                  <div className="flex flex-wrap gap-2">
                    {DISTRIBUIDORES_EXISTENTES.map((d) => (
                      <Badge
                        key={d.id}
                        variant="outline"
                        className="border-purple-500/30 text-purple-400 bg-purple-500/10"
                      >
                        {d.nombre} ({d.ordenes} OCs)
                      </Badge>
                    ))}
                  </div>
                </motion.div>

                {/* Nombre del distribuidor */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    Nombre del Distribuidor *
                  </Label>
                  <Input
                    {...register("nombre")}
                    placeholder="Ej: NUEVO-PROVEEDOR"
                    className={cn(
                      "h-12 text-lg bg-white/5 border-white/10 text-white uppercase",
                      errors.nombre && "border-red-500"
                    )}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-red-400">{errors.nombre.message}</p>
                  )}
                </motion.div>

                {/* Precios */}
                <motion.div variants={itemVariants}>
                  <Label className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    Estructura de Precios
                  </Label>
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    {/* Precio Base */}
                    <div className="space-y-2">
                      <Label className="text-xs text-blue-400">Precio Base</Label>
                      <Input
                        type="number"
                        {...register("precioBase", { valueAsNumber: true })}
                        className="h-12 bg-blue-500/10 border-blue-500/30 text-blue-300"
                      />
                    </div>
                    {/* Transporte */}
                    <div className="space-y-2">
                      <Label className="text-xs text-orange-400">Transporte</Label>
                      <Input
                        type="number"
                        {...register("precioTransporte", { valueAsNumber: true })}
                        className="h-12 bg-orange-500/10 border-orange-500/30 text-orange-300"
                      />
                    </div>
                    {/* Total */}
                    <div className="space-y-2">
                      <Label className="text-xs text-green-400">Total/Unidad</Label>
                      <div className="h-12 flex items-center justify-center rounded-md bg-green-500/10 border border-green-500/30">
                        <span className="text-xl font-bold text-green-400">
                          ${precioTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Contacto */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400 flex items-center gap-2">
                      <User className="w-4 h-4 text-cyan-400" />
                      Contacto
                    </Label>
                    <Input
                      {...register("contacto")}
                      placeholder="Nombre del contacto"
                      className="h-11 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-cyan-400" />
                      Teléfono
                    </Label>
                    <Input
                      {...register("telefono")}
                      placeholder="555-123-4567"
                      className="h-11 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </motion.div>

                {/* Email */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    {...register("email")}
                    placeholder="contacto@distribuidor.com"
                    className={cn(
                      "h-11 bg-white/5 border-white/10 text-white",
                      errors.email && "border-red-500"
                    )}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-400">{errors.email.message}</p>
                  )}
                </motion.div>

                {/* Ubicación */}
                <motion.div variants={itemVariants}>
                  <Label className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    Ubicación
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Input
                        {...register("ciudad")}
                        placeholder="Ciudad"
                        className="h-11 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <select
                        {...register("estado")}
                        className={cn(
                          "h-11 w-full rounded-md px-3",
                          "bg-white/5 border border-white/10 text-white",
                          "focus:outline-none focus:border-purple-500"
                        )}
                      >
                        <option value="" className="bg-zinc-900">Estado</option>
                        {ESTADOS_MEXICO.map((estado) => (
                          <option key={estado} value={estado} className="bg-zinc-900">
                            {estado}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Input
                        {...register("direccion")}
                        placeholder="Dirección completa"
                        className="h-11 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Notas */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label className="text-sm text-gray-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Notas (opcional)
                  </Label>
                  <Textarea
                    {...register("notas")}
                    placeholder="Observaciones adicionales..."
                    rows={2}
                    className="bg-white/5 border-white/10 text-white resize-none"
                  />
                </motion.div>

                {/* Estado Activo */}
                <motion.div variants={itemVariants}>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <p className="font-medium text-white">Estado del Distribuidor</p>
                      <p className="text-xs text-gray-500">¿Puede recibir órdenes de compra?</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setValue("activo", !watch("activo"))}
                      className={cn(
                        "w-14 h-7 rounded-full transition-all relative",
                        watch("activo") ? "bg-green-500" : "bg-white/20"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-5 h-5 rounded-full bg-white transition-all",
                        watch("activo") ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </motion.div>

                {/* Preview Card */}
                {watchedNombre && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400">Vista Previa</span>
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{watchedNombre.toUpperCase()}</p>
                        <p className="text-sm text-gray-400">
                          ${precioTotal.toLocaleString()} / unidad
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "ml-auto",
                          watch("activo") 
                            ? "border-green-500/50 text-green-400 bg-green-500/10"
                            : "border-red-500/50 text-red-400 bg-red-500/10"
                        )}
                      >
                        {watch("activo") ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className={cn(
                "h-20 border-t border-white/10",
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
                  disabled={isSubmitting || !isValid}
                  className={cn(
                    "min-w-[180px]",
                    "bg-gradient-to-r from-purple-600 to-pink-600",
                    "hover:from-purple-500 hover:to-pink-500",
                    "text-white font-bold",
                    "shadow-[0_0_30px_rgba(168,85,247,0.4)]",
                    "disabled:opacity-50"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Crear Distribuidor
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export default CreateDistribuidorModalPremium
