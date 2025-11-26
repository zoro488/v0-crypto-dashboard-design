"use client"

/**
 * 🚀 SMART STEP FORM WRAPPER - Progressive Disclosure Form
 * 
 * Componente que envuelve formularios multi-paso con:
 * 1. Animaciones de transición entre pasos
 * 2. Indicador de progreso visual
 * 3. Validación por paso antes de avanzar
 * 4. AI Voice Fill integration ready
 * 5. Glassmorphism styling
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/app/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Loader2,
  Mic,
  MicOff,
  Sparkles
} from "lucide-react"
import { logger } from "@/app/lib/utils/logger"

// ============================================
// TIPOS
// ============================================

export interface FormStep {
  /** ID único del paso */
  id: string
  /** Título del paso */
  title: string
  /** Descripción corta */
  description?: string
  /** Icono del paso */
  icon?: React.ReactNode
  /** Componente del paso */
  component: React.ReactNode
  /** Función de validación - debe retornar true o mensaje de error */
  validate?: () => boolean | string | Promise<boolean | string>
  /** Si este paso es opcional */
  optional?: boolean
}

interface SmartStepFormWrapperProps {
  /** Pasos del formulario */
  steps: FormStep[]
  /** Callback al completar todos los pasos */
  onComplete: () => void | Promise<void>
  /** Callback al cancelar */
  onCancel?: () => void
  /** Si mostrar botón de AI Voice (en desarrollo) */
  showVoiceButton?: boolean
  /** Título general del formulario */
  title?: string
  /** Si el formulario está en modo cargando */
  isSubmitting?: boolean
  /** Texto del botón final */
  submitLabel?: string
  /** Clase CSS adicional */
  className?: string
}

// Variantes de animación para los pasos
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    scale: 0.98,
  }),
}

// Transición suave
const stepTransition = {
  x: { type: "spring", stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
  scale: { duration: 0.2 },
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function SmartStepFormWrapper({
  steps,
  onComplete,
  onCancel,
  showVoiceButton = false,
  title,
  isSubmitting = false,
  submitLabel = "Guardar",
  className,
}: SmartStepFormWrapperProps) {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)
  const [[page, direction], setPage] = React.useState([0, 0])
  const [isValidating, setIsValidating] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const [isVoiceActive, setIsVoiceActive] = React.useState(false)
  const [completedSteps, setCompletedSteps] = React.useState<Set<string>>(new Set())

  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  // Paginar con dirección para animación
  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection])
  }

  // Validar paso actual
  const validateCurrentStep = async (): Promise<boolean> => {
    if (!currentStep.validate) return true

    setIsValidating(true)
    setValidationError(null)

    try {
      const result = await currentStep.validate()
      
      if (result === true) {
        return true
      } else if (typeof result === "string") {
        setValidationError(result)
        return false
      } else {
        setValidationError("Por favor completa los campos requeridos")
        return false
      }
    } catch (error) {
      logger.error("Error en validación", error)
      setValidationError("Error al validar el formulario")
      return false
    } finally {
      setIsValidating(false)
    }
  }

  // Ir al siguiente paso
  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    
    if (isValid) {
      // Marcar paso actual como completado
      setCompletedSteps(prev => new Set(prev).add(currentStep.id))
      
      if (isLastStep) {
        await onComplete()
      } else {
        setCurrentStepIndex(prev => prev + 1)
        paginate(1)
        setValidationError(null)
      }
    }
  }

  // Ir al paso anterior
  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1)
      paginate(-1)
      setValidationError(null)
    }
  }

  // Ir a un paso específico (solo si está completado o es el siguiente)
  const handleGoToStep = async (index: number) => {
    if (index < currentStepIndex) {
      // Puede ir hacia atrás siempre
      setCurrentStepIndex(index)
      paginate(index - currentStepIndex)
    } else if (index === currentStepIndex + 1) {
      // Solo puede ir al siguiente si valida
      await handleNext()
    }
    // No puede saltar pasos
  }

  // Toggle Voice (placeholder para AI Voice Fill)
  const toggleVoice = () => {
    setIsVoiceActive(!isVoiceActive)
    // TODO: Integrar con Vercel AI SDK para Voice Fill
    logger.info("Voice mode toggled", { active: !isVoiceActive })
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header con título y Voice Button */}
      <div className="flex items-center justify-between mb-6">
        {title && (
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        )}
        
        {showVoiceButton && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleVoice}
            className={cn(
              "gap-2 transition-all duration-300",
              isVoiceActive 
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            {isVoiceActive ? (
              <>
                <MicOff className="w-4 h-4" />
                <span className="text-xs">Detener</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span className="text-xs">Dictar</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Indicador de progreso */}
      <div className="mb-8">
        {/* Barra de progreso */}
        <div className="relative h-1 bg-white/10 rounded-full overflow-hidden mb-4">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        {/* Indicadores de pasos */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id)
            const isCurrent = index === currentStepIndex
            const isPast = index < currentStepIndex

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleGoToStep(index)}
                disabled={index > currentStepIndex + 1 || isSubmitting}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all duration-300",
                  "disabled:cursor-not-allowed",
                  isCurrent && "scale-110"
                )}
              >
                {/* Círculo del paso */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    "transition-all duration-300",
                    "border-2",
                    isCompleted || isPast
                      ? "bg-gradient-to-br from-blue-500 to-purple-500 border-transparent"
                      : isCurrent
                      ? "bg-white/10 border-blue-500"
                      : "bg-white/5 border-white/20"
                  )}
                >
                  {isCompleted || isPast ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : step.icon ? (
                    <span className={cn(
                      "text-sm",
                      isCurrent ? "text-blue-400" : "text-gray-500"
                    )}>
                      {step.icon}
                    </span>
                  ) : (
                    <span className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-white" : "text-gray-500"
                    )}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Título del paso */}
                <span
                  className={cn(
                    "text-xs font-medium transition-colors duration-300",
                    isCurrent ? "text-white" : isPast ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  {step.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido del paso actual */}
      <div className="relative flex-1 min-h-[300px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStepIndex}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={stepTransition}
            className="w-full"
          >
            {/* Descripción del paso */}
            {currentStep.description && (
              <p className="text-sm text-gray-400 mb-6">
                {currentStep.description}
              </p>
            )}

            {/* Componente del paso */}
            <div className="mb-6">{currentStep.component}</div>

            {/* Error de validación */}
            <AnimatePresence>
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "p-3 rounded-lg mb-4",
                    "bg-red-500/10 border border-red-500/30",
                    "text-red-400 text-sm"
                  )}
                >
                  {validationError}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Botones de navegación */}
      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <div>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Botón Anterior */}
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep || isSubmitting || isValidating}
            className={cn(
              "gap-2 bg-white/5 border-white/10",
              "hover:bg-white/10 hover:border-white/20",
              "text-white"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          {/* Botón Siguiente / Guardar */}
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || isValidating}
            className={cn(
              "gap-2 min-w-[140px]",
              "bg-gradient-to-r from-blue-600 to-purple-600",
              "hover:from-blue-500 hover:to-purple-500",
              "text-white font-medium",
              "transition-all duration-300",
              isLastStep && "from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
            )}
          >
            {isSubmitting || isValidating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isValidating ? "Validando..." : "Guardando..."}
              </>
            ) : isLastStep ? (
              <>
                <Sparkles className="w-4 h-4" />
                {submitLabel}
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SUB-COMPONENTES PARA LOS PASOS
// ============================================

/**
 * Wrapper para contenido de un paso individual
 */
export function StepContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  )
}

/**
 * Grid de campos para un paso
 */
export function StepGrid({
  children,
  columns = 2,
  className,
}: {
  children: React.ReactNode
  columns?: 1 | 2 | 3
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Sección dentro de un paso con título
 */
export function StepSection({
  title,
  description,
  children,
  className,
}: {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-sm font-medium text-white">{title}</h3>
          )}
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

export default SmartStepFormWrapper
