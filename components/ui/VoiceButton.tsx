"use client"

/**
 * 🎤 VOICE BUTTON - Botón de voz con animación de ondas
 * 
 * Características:
 * - Animación de ondas de sonido al estar activo
 * - Estados visuales: idle, listening, processing, error
 * - Efecto de neón/glow pulsante
 * - Feedback visual del transcript en tiempo real
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Loader2, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ============================================
// TIPOS
// ============================================

export type VoiceButtonState = "idle" | "listening" | "processing" | "error" | "success"

interface VoiceButtonProps {
  state?: VoiceButtonState
  onClick?: () => void
  disabled?: boolean
  transcript?: string
  interimTranscript?: string
  className?: string
  size?: "sm" | "md" | "lg"
  showTranscript?: boolean
  tooltip?: string
}

// ============================================
// ANIMACIONES
// ============================================

// Ondas de sonido que se expanden
const waveVariants = {
  initial: { 
    scale: 1, 
    opacity: 0.5 
  },
  animate: (i: number) => ({
    scale: [1, 1.5, 2],
    opacity: [0.5, 0.3, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      delay: i * 0.3,
      ease: "easeOut",
    },
  }),
}

// Pulso del botón principal
const pulseVariants = {
  idle: { 
    scale: 1,
    boxShadow: "0 0 0 0 rgba(239, 68, 68, 0)"
  },
  listening: {
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 0 0 0 rgba(239, 68, 68, 0.4)",
      "0 0 20px 10px rgba(239, 68, 68, 0.2)",
      "0 0 0 0 rgba(239, 68, 68, 0)",
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  processing: {
    scale: 1,
    boxShadow: "0 0 20px 5px rgba(59, 130, 246, 0.4)",
  },
  success: {
    scale: [1, 1.1, 1],
    boxShadow: "0 0 30px 10px rgba(34, 197, 94, 0.5)",
    transition: {
      duration: 0.5,
    },
  },
}

// ============================================
// COMPONENTE
// ============================================

export function VoiceButton({
  state = "idle",
  onClick,
  disabled = false,
  transcript = "",
  interimTranscript = "",
  className,
  size = "md",
  showTranscript = true,
  tooltip = "Hablar (Ctrl+M)",
}: VoiceButtonProps) {
  
  // Tamaños
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }
  
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  }

  // Colores según estado
  const stateColors = {
    idle: "bg-white/10 hover:bg-white/20 border-white/20",
    listening: "bg-red-500 border-red-500 text-white",
    processing: "bg-blue-500 border-blue-500 text-white",
    error: "bg-red-900/50 border-red-500 text-red-400",
    success: "bg-green-500 border-green-500 text-white",
  }

  // Icono según estado
  const StateIcon = () => {
    switch (state) {
      case "listening":
        return <Mic className={cn(iconSizes[size], "animate-pulse")} />
      case "processing":
        return <Loader2 className={cn(iconSizes[size], "animate-spin")} />
      case "error":
        return <AlertCircle className={iconSizes[size]} />
      case "success":
        return <Sparkles className={iconSizes[size]} />
      default:
        return <Mic className={iconSizes[size]} />
    }
  }

  return (
    <div className="relative">
      {/* Ondas de sonido (solo cuando escucha) */}
      <AnimatePresence>
        {state === "listening" && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                custom={i}
                variants={waveVariants}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0, scale: 1 }}
                className={cn(
                  "absolute inset-0 rounded-full",
                  "border-2 border-red-500/50",
                  "pointer-events-none"
                )}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Botón principal */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={onClick}
              disabled={disabled || state === "processing"}
              variants={pulseVariants}
              initial="idle"
              animate={state}
              className={cn(
                // Base
                "relative rounded-full border-2",
                "flex items-center justify-center",
                "transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black",
                
                // Tamaño
                sizeClasses[size],
                
                // Estado
                stateColors[state],
                
                // Disabled
                disabled && "opacity-50 cursor-not-allowed",
                
                // Custom
                className
              )}
            >
              <StateIcon />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            className="bg-black/90 border-white/10 text-white"
          >
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Transcript en tiempo real */}
      <AnimatePresence>
        {showTranscript && (transcript || interimTranscript) && state !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={cn(
              "absolute top-full mt-3 left-1/2 -translate-x-1/2",
              "min-w-[200px] max-w-[300px]",
              "p-3 rounded-xl",
              "bg-black/90 backdrop-blur-xl",
              "border border-white/10",
              "text-sm text-white",
              "shadow-lg shadow-black/50"
            )}
          >
            {/* Flecha */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/90 border-l border-t border-white/10 rotate-45" />
            
            {/* Contenido */}
            <div className="relative">
              {/* Indicador de escucha */}
              {state === "listening" && (
                <div className="flex items-center gap-2 mb-2 text-red-400">
                  <span className="flex gap-1">
                    <span className="w-1 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                  </span>
                  <span className="text-xs font-medium">Escuchando...</span>
                </div>
              )}

              {/* Transcript final */}
              {transcript && (
                <p className="text-white/90 leading-relaxed">
                  "{transcript}"
                </p>
              )}

              {/* Interim (en proceso) */}
              {interimTranscript && !transcript && (
                <p className="text-white/50 italic leading-relaxed">
                  {interimTranscript}...
                </p>
              )}

              {/* Estado de procesamiento */}
              {state === "processing" && (
                <div className="flex items-center gap-2 mt-2 text-blue-400 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Procesando con IA...</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// COMPONENTE WRAPPER CON HOOK INTEGRADO
// ============================================

interface VoiceButtonWithHookProps {
  mode?: "venta" | "orden_compra" | "producto" | "general"
  onResult?: (result: unknown) => void
  onTranscript?: (transcript: string) => void
  className?: string
  size?: "sm" | "md" | "lg"
}

export function VoiceButtonWithHook({
  mode = "general",
  onResult,
  onTranscript,
  className,
  size = "md",
}: VoiceButtonWithHookProps) {
  // Importamos el hook dinámicamente para evitar errores de SSR
  const [hookModule, setHookModule] = React.useState<{
    useRealtimeVoice: typeof import("@/app/hooks/useRealtimeVoice").useRealtimeVoice
  } | null>(null)

  React.useEffect(() => {
    import("@/app/hooks/useRealtimeVoice").then(setHookModule)
  }, [])

  if (!hookModule) {
    return (
      <VoiceButton 
        state="idle" 
        disabled 
        className={className} 
        size={size}
        tooltip="Cargando..."
      />
    )
  }

  return (
    <VoiceButtonInternal
      useRealtimeVoice={hookModule.useRealtimeVoice}
      mode={mode}
      onResult={onResult}
      onTranscript={onTranscript}
      className={className}
      size={size}
    />
  )
}

// Componente interno que usa el hook
function VoiceButtonInternal({
  useRealtimeVoice,
  mode,
  onResult,
  onTranscript: onTranscriptProp,
  className,
  size,
}: VoiceButtonWithHookProps & {
  useRealtimeVoice: typeof import("@/app/hooks/useRealtimeVoice").useRealtimeVoice
}) {
  const {
    isListening,
    isProcessing,
    transcript,
    interimTranscript,
    error,
    toggleListening,
    isSupported,
  } = useRealtimeVoice({
    mode,
    onResult: (result) => {
      onResult?.(result)
    },
    onTranscript: (t) => {
      onTranscriptProp?.(t)
    },
  })

  // Determinar estado visual
  const getState = (): VoiceButtonState => {
    if (error) return "error"
    if (isProcessing) return "processing"
    if (isListening) return "listening"
    return "idle"
  }

  return (
    <VoiceButton
      state={getState()}
      onClick={toggleListening}
      disabled={!isSupported}
      transcript={transcript}
      interimTranscript={interimTranscript}
      className={className}
      size={size}
      tooltip={
        !isSupported 
          ? "Tu navegador no soporta voz" 
          : isListening 
          ? "Detener" 
          : "Hablar (Ctrl+M)"
      }
    />
  )
}

export default VoiceButton
