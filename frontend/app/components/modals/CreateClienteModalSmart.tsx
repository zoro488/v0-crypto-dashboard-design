"use client"

/**
 * 💎 CREATE CLIENTE MODAL SMART
 * 
 * Modal premium para registro de clientes con:
 * 1. Progressive Disclosure (2 pasos animados)
 * 2. Validación con Zod en tiempo real
 * 3. Glassmorphism futurista
 * 4. Integración directa con Firestore
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/frontend/app/components/ui/dialog"
import { Button } from "@/frontend/app/components/ui/button"
import { Input } from "@/frontend/app/components/ui/input"
import { Label } from "@/frontend/app/components/ui/label"
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  UserPlus,
} from "lucide-react"
import { cn } from "@/frontend/app/lib/utils"
import { useToast } from "@/frontend/app/hooks/use-toast"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"
import { firestoreService } from "@/frontend/app/lib/firebase/firestore-service"

// ============================================
// SCHEMA DE VALIDACIÓN
// ============================================

const clienteSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  empresa: z.string().optional(),
  telefono: z.string().min(10, "El teléfono debe tener al menos 10 dígitos").optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
})

type ClienteInput = z.infer<typeof clienteSchema>

// ============================================
// TIPOS
// ============================================

interface CreateClienteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

// Pasos del wizard
const STEPS = [
  { id: 1, title: "Información", icon: User, description: "Datos básicos" },
  { id: 2, title: "Contacto", icon: Phone, description: "Datos de contacto" },
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

export function CreateClienteModal({ isOpen, onClose, onSuccess }: CreateClienteModalProps) {
  const { toast } = useToast()
  const { triggerDataRefresh } = useAppStore()
  
  // Estado del wizard
  const [step, setStep] = React.useState(1)
  const [direction, setDirection] = React.useState(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // React Hook Form con Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
    mode: "onChange",
    defaultValues: {
      nombre: "",
      empresa: "",
      telefono: "",
      email: "",
      direccion: "",
    },
  })

  const watchedValues = watch()

  // Navegar entre pasos
  const nextStep = () => {
    if (step < STEPS.length) {
      setDirection(1)
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setDirection(-1)
      setStep(step - 1)
    }
  }

  // Cerrar modal
  const handleClose = () => {
    reset()
    setStep(1)
    onClose()
  }

  // Submit
  const onSubmit = async (data: ClienteInput) => {
    setIsSubmitting(true)
    
    try {
      await firestoreService.crearCliente({
        nombre: data.nombre,
        empresa: data.empresa || "",
        telefono: data.telefono || "",
        email: data.email || "",
        direccion: data.direccion || "",
      })

      triggerDataRefresh()

      toast({
        title: "✅ Cliente Creado",
        description: `${data.nombre} ha sido registrado exitosamente.`,
      })

      handleClose()
      onSuccess?.()
    } catch (error) {
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "No se pudo crear el cliente",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Validar paso actual
  const isStepValid = () => {
    if (step === 1) {
      return watchedValues.nombre && watchedValues.nombre.length >= 2
    }
    return true
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "max-w-2xl max-h-[90vh] p-0",
          "bg-black/95 border-white/10 backdrop-blur-2xl",
          "text-white overflow-hidden flex flex-col",
          "shadow-[0_0_100px_rgba(0,0,0,0.8)]"
        )}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Nuevo Cliente</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para registrar un nuevo cliente
        </DialogDescription>

        {/* ===== HEADER ===== */}
        <div className="relative h-20 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          
          <div className="relative h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Nuevo Cliente</h2>
                <p className="text-sm text-gray-400">
                  Paso {step} de {STEPS.length} • {STEPS[step - 1].description}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* ===== PROGRESS BAR ===== */}
        <div className="px-6 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            {STEPS.map((s, index) => {
              const isCompleted = step > s.id
              const isCurrent = step === s.id

              return (
                <React.Fragment key={s.id}>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all",
                      isCompleted && "bg-cyan-500/20 text-cyan-400",
                      isCurrent && "bg-white/10 text-white",
                      !isCompleted && !isCurrent && "text-gray-500"
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        isCompleted && "bg-cyan-500 text-white",
                        isCurrent && "bg-white/20 text-white",
                        !isCompleted && !isCurrent && "bg-white/5 text-gray-500"
                      )}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : s.id}
                    </div>
                    <span className="hidden sm:inline font-medium">{s.title}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 rounded-full",
                        isCompleted ? "bg-cyan-500" : "bg-white/10"
                      )}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* ===== FORM CONTENT ===== */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait" custom={direction}>
              {/* PASO 1: Información Básica */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    {/* Nombre */}
                    <div className="space-y-2">
                      <Label className="text-gray-300 flex items-center gap-2">
                        <User className="w-4 h-4 text-cyan-400" />
                        Nombre del Cliente *
                      </Label>
                      <Input
                        {...register("nombre")}
                        placeholder="Ej: CLIENTE PREMIUM"
                        className={cn(
                          "bg-white/5 border-white/10 text-white h-12 text-lg",
                          "focus:border-cyan-500 focus:ring-cyan-500/20",
                          errors.nombre && "border-red-500"
                        )}
                      />
                      {errors.nombre && (
                        <p className="text-red-400 text-sm">{errors.nombre.message}</p>
                      )}
                    </div>

                    {/* Empresa */}
                    <div className="space-y-2">
                      <Label className="text-gray-300 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                        Empresa (opcional)
                      </Label>
                      <Input
                        {...register("empresa")}
                        placeholder="Nombre de la empresa"
                        className="bg-white/5 border-white/10 text-white h-12 focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Preview Card */}
                  {watchedValues.nombre && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            {watchedValues.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{watchedValues.nombre}</p>
                          <p className="text-gray-400 text-sm">{watchedValues.empresa || "Sin empresa"}</p>
                        </div>
                        <Sparkles className="w-5 h-5 text-cyan-400 ml-auto" />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* PASO 2: Contacto */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    {/* Teléfono */}
                    <div className="space-y-2">
                      <Label className="text-gray-300 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-cyan-400" />
                        Teléfono
                      </Label>
                      <Input
                        {...register("telefono")}
                        placeholder="Ej: 55 1234 5678"
                        className={cn(
                          "bg-white/5 border-white/10 text-white h-12",
                          "focus:border-cyan-500",
                          errors.telefono && "border-red-500"
                        )}
                      />
                      {errors.telefono && (
                        <p className="text-red-400 text-sm">{errors.telefono.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label className="text-gray-300 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-cyan-400" />
                        Email
                      </Label>
                      <Input
                        {...register("email")}
                        type="email"
                        placeholder="cliente@empresa.com"
                        className={cn(
                          "bg-white/5 border-white/10 text-white h-12",
                          "focus:border-cyan-500",
                          errors.email && "border-red-500"
                        )}
                      />
                      {errors.email && (
                        <p className="text-red-400 text-sm">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Dirección */}
                    <div className="space-y-2">
                      <Label className="text-gray-300 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        Dirección
                      </Label>
                      <Input
                        {...register("direccion")}
                        placeholder="Calle, número, colonia, ciudad"
                        className="bg-white/5 border-white/10 text-white h-12 focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Resumen Final */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
                  >
                    <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Resumen del Cliente
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-400">Nombre:</div>
                      <div className="text-white">{watchedValues.nombre}</div>
                      {watchedValues.empresa && (
                        <>
                          <div className="text-gray-400">Empresa:</div>
                          <div className="text-white">{watchedValues.empresa}</div>
                        </>
                      )}
                      {watchedValues.telefono && (
                        <>
                          <div className="text-gray-400">Teléfono:</div>
                          <div className="text-white">{watchedValues.telefono}</div>
                        </>
                      )}
                      {watchedValues.email && (
                        <>
                          <div className="text-gray-400">Email:</div>
                          <div className="text-white">{watchedValues.email}</div>
                        </>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ===== FOOTER ===== */}
          <div className="border-t border-white/10 p-4 bg-black/50">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={step === 1 ? handleClose : prevStep}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {step === 1 ? "Cancelar" : "Anterior"}
              </Button>

              {step < STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Crear Cliente
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateClienteModal
