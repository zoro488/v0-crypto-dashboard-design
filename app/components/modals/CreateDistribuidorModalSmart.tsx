"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, FileText, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { cn } from "@/app/lib/utils";
import { crearDistribuidor } from "@/app/lib/firebase/firestore-service";
import { logger } from "@/app/lib/utils/logger";

// Schema simplificado: solo nombre y descripción
const distribuidorSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  descripcion: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
});

type DistribuidorFormData = z.infer<typeof distribuidorSchema>;

interface CreateDistribuidorModalSmartProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (distribuidor: DistribuidorFormData & { id: string }) => void;
}

export function CreateDistribuidorModalSmart({
  isOpen,
  onClose,
  onSuccess,
}: CreateDistribuidorModalSmartProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<DistribuidorFormData>({
    resolver: zodResolver(distribuidorSchema),
    mode: "onChange",
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  });

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      reset();
      setSubmitStatus("idle");
      setErrorMessage(null);
    }
  }, [isOpen, reset]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  const onSubmit = useCallback(
    async (data: DistribuidorFormData) => {
      setIsSubmitting(true);
      setSubmitStatus("idle");
      setErrorMessage(null);

      try {
        const distribuidorData = {
          nombre: data.nombre.trim(),
        };

        const docId = await crearDistribuidor(distribuidorData);
        
        logger.info(`Distribuidor creado exitosamente - ID: ${docId}, Nombre: ${data.nombre}`);

        setSubmitStatus("success");
        
        // Notificar éxito después de animación
        setTimeout(() => {
          if (onSuccess && docId) {
            onSuccess({ ...data, id: docId });
          }
          onClose();
        }, 1200);

      } catch (error) {
        logger.error("Error al crear distribuidor", error);
        setSubmitStatus("error");
        setErrorMessage(
          error instanceof Error 
            ? error.message 
            : "Error al crear el distribuidor. Intenta de nuevo."
        );
        setIsSubmitting(false);
      }
    },
    [onClose, onSuccess]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              {/* Efecto de brillo superior - púrpura para distribuidores */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <Building2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Nuevo Distribuidor</h2>
                    <p className="text-sm text-slate-400">Registro rápido</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                {/* Campo Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-slate-200 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    Nombre del Distribuidor *
                  </Label>
                  <Input
                    id="nombre"
                    {...register("nombre")}
                    placeholder="Ej: MONTE SUPPLY"
                    disabled={isSubmitting}
                    className={cn(
                      "bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500",
                      "focus:border-purple-500 focus:ring-purple-500/20",
                      "transition-all duration-200",
                      errors.nombre && "border-red-500 focus:border-red-500"
                    )}
                  />
                  {errors.nombre && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.nombre.message}
                    </motion.p>
                  )}
                </div>

                {/* Campo Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="descripcion" className="text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    Descripción
                    <span className="text-slate-500 text-xs">(opcional)</span>
                  </Label>
                  <Textarea
                    id="descripcion"
                    {...register("descripcion")}
                    placeholder="Notas adicionales sobre el distribuidor..."
                    disabled={isSubmitting}
                    rows={3}
                    className={cn(
                      "bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500",
                      "focus:border-purple-500 focus:ring-purple-500/20",
                      "transition-all duration-200 resize-none",
                      errors.descripcion && "border-red-500 focus:border-red-500"
                    )}
                  />
                  {errors.descripcion && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.descripcion.message}
                    </motion.p>
                  )}
                </div>

                {/* Error de submit */}
                <AnimatePresence>
                  {submitStatus === "error" && errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/30"
                    >
                      <p className="text-sm text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errorMessage}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botón Submit */}
                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className={cn(
                    "w-full h-12 rounded-xl font-medium transition-all duration-300",
                    submitStatus === "success"
                      ? "bg-emerald-500 hover:bg-emerald-500"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    submitStatus === "success" ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        <span>¡Distribuidor Creado!</span>
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Guardando...</span>
                      </div>
                    )
                  ) : (
                    <span>Crear Distribuidor</span>
                  )}
                </Button>
              </form>

              {/* Efecto de brillo inferior */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CreateDistribuidorModalSmart;
