"use client"

/**
 * 📦 CREATE PRODUCTO MODAL - Smart Form
 * 
 * Modal para crear productos con:
 * 1. Progressive Disclosure (2 pasos)
 * 2. Auto-generación de SKU
 * 3. Drag & Drop para imágenes
 * 4. Cálculo de margen de ganancia
 * 5. Glassmorphism futurista
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/frontend/app/components/ui/dialog"
import { Button } from "@/frontend/app/components/ui/button"
import { Input } from "@/frontend/app/components/ui/input"
import { Label } from "@/frontend/app/components/ui/label"
import { Textarea } from "@/frontend/app/components/ui/textarea"
import { Badge } from "@/frontend/app/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/app/components/ui/select"
import {
  Package,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Loader2,
  X,
  Tag,
  Box,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ImagePlus,
  AlertTriangle,
  Check,
  Zap,
  Hash,
  Layers,
  BarChart3,
} from "lucide-react"
import { cn } from "@/frontend/app/lib/utils"
import { useToast } from "@/frontend/app/hooks/use-toast"
import { logger } from "@/frontend/app/lib/utils/logger"
import { 
  productoSchema, 
  type ProductoInput,
  formatearMonto,
  generarKeywords,
} from "@/frontend/app/lib/validations/smart-forms-schemas"
import {
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/frontend/app/lib/firebase/config"

// ============================================
// TIPOS
// ============================================

interface CreateProductoModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

// Categorías predefinidas
const CATEGORIAS = [
  { value: "electronica", label: "Electrónica", icon: "💻" },
  { value: "accesorios", label: "Accesorios", icon: "🎧" },
  { value: "ropa", label: "Ropa", icon: "👕" },
  { value: "hogar", label: "Hogar", icon: "🏠" },
  { value: "deportes", label: "Deportes", icon: "⚽" },
  { value: "otros", label: "Otros", icon: "📦" },
]

// Pasos del wizard
const STEPS = [
  { id: 1, title: "Info Básica", icon: Package, description: "Nombre y categoría" },
  { id: 2, title: "Precios", icon: DollarSign, description: "Costos y márgenes" },
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

export function CreateProductoModal({ open, onClose, onSuccess }: CreateProductoModalProps) {
  const { toast } = useToast()
  
  // Estado del wizard
  const [step, setStep] = React.useState(1)
  const [direction, setDirection] = React.useState(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  // Estado del formulario
  const [nombre, setNombre] = React.useState("")
  const [descripcion, setDescripcion] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [categoria, setCategoria] = React.useState("")
  const [precioCompra, setPrecioCompra] = React.useState(0)
  const [precioVenta, setPrecioVenta] = React.useState(0)
  const [stockActual, setStockActual] = React.useState(0)
  const [stockMinimo, setStockMinimo] = React.useState(5)
  const [unidad, setUnidad] = React.useState("pz")
  
  // Estado de imagen (placeholder para implementación futura)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  // Cálculos de margen
  const margen = React.useMemo(() => {
    if (precioCompra <= 0 || precioVenta <= 0) return { ganancia: 0, porcentaje: 0 }
    const ganancia = precioVenta - precioCompra
    const porcentaje = ((ganancia / precioCompra) * 100)
    return { ganancia, porcentaje }
  }, [precioCompra, precioVenta])

  // Validación por paso
  const canProceed = React.useMemo(() => {
    switch (step) {
      case 1:
        return nombre.trim().length >= 2
      case 2:
        return precioVenta > 0
      default:
        return false
    }
  }, [step, nombre, precioVenta])

  // Navegación
  const nextStep = () => {
    if (canProceed && step < 2) {
      setDirection(1)
      setStep(s => s + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setDirection(-1)
      setStep(s => s - 1)
    }
  }

  // Generar SKU aleatorio
  const generarSKU = () => {
    const prefijo = categoria ? categoria.substring(0, 3).toUpperCase() : "PRD"
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    const timestamp = Date.now().toString(36).substring(-4).toUpperCase()
    setSku(`${prefijo}-${random}${timestamp}`)
  }

  // Sugerir precio de venta (30% margen por defecto)
  const sugerirPrecioVenta = () => {
    if (precioCompra > 0) {
      setPrecioVenta(Math.round(precioCompra * 1.3))
    }
  }

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  // Procesar producto
  const handleSubmit = async () => {
    if (!nombre.trim() || precioVenta <= 0) {
      toast({
        title: "Error",
        description: "Completa los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const productoData = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        sku: sku || null,
        categoria: categoria || null,
        
        precioCompra,
        precioVenta,
        
        stockActual,
        stockMinimo,
        unidad,
        
        // Campos calculados
        margenGanancia: margen.porcentaje,
        
        // Tracking
        totalEntradas: stockActual,
        totalSalidas: 0,
        
        // Estado
        activo: true,
        
        // Metadata
        keywords: generarKeywords(nombre),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      await addDoc(collection(db, "almacen"), productoData)

      toast({
        title: "✅ Producto Creado",
        description: `${nombre} agregado al inventario`,
      })

      resetForm()
      onClose()
      onSuccess?.()

    } catch (error) {
      logger.error("Error creando producto", error)
      toast({
        title: "Error",
        description: "No se pudo crear el producto",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setStep(1)
    setDirection(1)
    setNombre("")
    setDescripcion("")
    setSku("")
    setCategoria("")
    setPrecioCompra(0)
    setPrecioVenta(0)
    setStockActual(0)
    setStockMinimo(5)
    setUnidad("pz")
    setImagePreview(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "max-w-2xl h-[85vh] max-h-[650px] p-0",
          "bg-black/95 border-white/10 backdrop-blur-2xl",
          "text-white overflow-hidden flex flex-col",
          "shadow-[0_0_100px_rgba(0,0,0,0.8)]"
        )}
      >
        <DialogTitle className="sr-only">Nuevo Producto</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para crear un nuevo producto en el inventario
        </DialogDescription>

        {/* ===== HEADER ===== */}
        <div className="relative h-20 border-b border-white/10 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          
          <div className="relative h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Nuevo Producto</h2>
                <p className="text-sm text-gray-400">
                  Paso {step} de 2 • {STEPS[step - 1].description}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="w-10 h-10 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-400"
              initial={{ width: "50%" }}
              animate={{ width: `${(step / 2) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div className="flex-1 overflow-hidden flex">
          {/* Steps Sidebar */}
          <div className="w-44 border-r border-white/10 bg-white/[0.02] p-4 hidden md:block">
            <div className="space-y-4">
              {STEPS.map((s, index) => {
                const isCompleted = step > s.id
                const isCurrent = step === s.id
                
                return (
                  <div key={s.id} className="relative">
                    {index < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-5 top-12 w-0.5 h-8",
                          isCompleted ? "bg-purple-500" : "bg-white/10"
                        )}
                      />
                    )}
                    
                    <div className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-all",
                      isCurrent && "bg-white/5"
                    )}>
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                          isCompleted
                            ? "bg-purple-500 border-purple-500 text-white"
                            : isCurrent
                            ? "bg-white/10 border-purple-500 text-purple-400"
                            : "bg-white/5 border-white/20 text-gray-500"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <s.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isCurrent ? "text-white" : isCompleted ? "text-purple-400" : "text-gray-500"
                        )}
                      >
                        {s.title}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <AnimatePresence mode="wait" custom={direction}>
              
              {/* ===== PASO 1: INFO BÁSICA ===== */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Imagen (Drag & Drop) */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "relative h-40 rounded-xl border-2 border-dashed transition-all",
                      "flex items-center justify-center cursor-pointer",
                      isDragging
                        ? "border-purple-500 bg-purple-500/10"
                        : imagePreview
                        ? "border-white/20 bg-white/5"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                    )}
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setImagePreview(null)}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-2 cursor-pointer">
                        <ImagePlus className="w-10 h-10 text-gray-500" />
                        <span className="text-sm text-gray-400">
                          Arrastra una imagen o haz clic
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Nombre */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">
                      Nombre del Producto <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: iPhone 15 Pro Max 256GB"
                      className={cn(
                        "h-12 bg-black/50 border-white/10",
                        "focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                      )}
                      autoFocus
                    />
                  </div>

                  {/* SKU y Categoría */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400 flex items-center gap-2">
                        <Hash className="w-3 h-3" />
                        SKU
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={sku}
                          onChange={(e) => setSku(e.target.value.toUpperCase())}
                          placeholder="Ej: ELEC-ABC123"
                          className="h-10 bg-black/50 border-white/10 flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={generarSKU}
                          className="h-10 w-10 border-white/10 hover:bg-white/10"
                          title="Generar SKU automático"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400 flex items-center gap-2">
                        <Layers className="w-3 h-3" />
                        Categoría
                      </Label>
                      <Select value={categoria} onValueChange={setCategoria}>
                        <SelectTrigger className="h-10 bg-black/50 border-white/10">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="bg-black/95 border-white/10">
                          {CATEGORIAS.map((cat) => (
                            <SelectItem 
                              key={cat.value} 
                              value={cat.value}
                              className="focus:bg-white/10"
                            >
                              <span className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Descripción</Label>
                    <Textarea
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Descripción detallada del producto..."
                      className="bg-black/50 border-white/10 min-h-[80px] resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {/* ===== PASO 2: PRECIOS Y STOCK ===== */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Precios */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400 flex items-center gap-2">
                        <Tag className="w-3 h-3" />
                        Precio de Compra (Costo)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          type="number"
                          value={precioCompra || ""}
                          onChange={(e) => setPrecioCompra(Number(e.target.value))}
                          placeholder="0.00"
                          className="h-12 pl-8 bg-black/50 border-white/10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400 flex items-center gap-2">
                        <DollarSign className="w-3 h-3" />
                        Precio de Venta <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            value={precioVenta || ""}
                            onChange={(e) => setPrecioVenta(Number(e.target.value))}
                            placeholder="0.00"
                            className="h-12 pl-8 bg-black/50 border-white/10"
                          />
                        </div>
                        {precioCompra > 0 && !precioVenta && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={sugerirPrecioVenta}
                            className="h-12 w-12 border-white/10 hover:bg-white/10"
                            title="Sugerir precio (+30%)"
                          >
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Indicador de Margen */}
                  <AnimatePresence>
                    {precioCompra > 0 && precioVenta > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          "p-4 rounded-xl border",
                          margen.ganancia > 0
                            ? "bg-green-500/10 border-green-500/30"
                            : margen.ganancia < 0
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-gray-500/10 border-gray-500/30"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              margen.ganancia > 0
                                ? "bg-green-500/20"
                                : margen.ganancia < 0
                                ? "bg-red-500/20"
                                : "bg-gray-500/20"
                            )}>
                              <TrendingUp className={cn(
                                "w-5 h-5",
                                margen.ganancia > 0
                                  ? "text-green-400"
                                  : margen.ganancia < 0
                                  ? "text-red-400 rotate-180"
                                  : "text-gray-400"
                              )} />
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Margen de Ganancia</p>
                              <p className={cn(
                                "text-lg font-bold",
                                margen.ganancia > 0
                                  ? "text-green-400"
                                  : margen.ganancia < 0
                                  ? "text-red-400"
                                  : "text-gray-400"
                              )}>
                                {formatearMonto(margen.ganancia)}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-lg px-4 py-1",
                              margen.porcentaje >= 30
                                ? "border-green-500/50 text-green-400"
                                : margen.porcentaje >= 15
                                ? "border-yellow-500/50 text-yellow-400"
                                : "border-red-500/50 text-red-400"
                            )}
                          >
                            {margen.porcentaje.toFixed(1)}%
                          </Badge>
                        </div>
                        
                        {margen.porcentaje < 15 && margen.ganancia > 0 && (
                          <div className="mt-3 flex items-center gap-2 text-yellow-400 text-xs">
                            <AlertTriangle className="w-4 h-4" />
                            Margen bajo. Considera ajustar el precio de venta.
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Stock */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400 flex items-center gap-2">
                        <Box className="w-3 h-3" />
                        Stock Inicial
                      </Label>
                      <Input
                        type="number"
                        value={stockActual || ""}
                        onChange={(e) => setStockActual(Number(e.target.value))}
                        placeholder="0"
                        min={0}
                        className="h-11 bg-black/50 border-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400 flex items-center gap-2">
                        <BarChart3 className="w-3 h-3" />
                        Stock Mínimo
                      </Label>
                      <Input
                        type="number"
                        value={stockMinimo || ""}
                        onChange={(e) => setStockMinimo(Number(e.target.value))}
                        placeholder="5"
                        min={0}
                        className="h-11 bg-black/50 border-white/10"
                      />
                      <p className="text-xs text-gray-600">
                        Alerta cuando baje de este nivel
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">Unidad</Label>
                      <Select value={unidad} onValueChange={setUnidad}>
                        <SelectTrigger className="h-11 bg-black/50 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/95 border-white/10">
                          <SelectItem value="pz">Pieza (pz)</SelectItem>
                          <SelectItem value="kg">Kilogramo (kg)</SelectItem>
                          <SelectItem value="lt">Litro (lt)</SelectItem>
                          <SelectItem value="mt">Metro (mt)</SelectItem>
                          <SelectItem value="caja">Caja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Resumen */}
                  <div className={cn(
                    "p-4 rounded-xl border mt-4",
                    "bg-gradient-to-br from-white/5 to-transparent",
                    "border-white/10"
                  )}>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">
                      Resumen del Producto
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Nombre:</span>
                        <span className="text-white font-medium">{nombre || "—"}</span>
                      </div>
                      {sku && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">SKU:</span>
                          <span className="text-white font-mono">{sku}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Precio Venta:</span>
                        <span className="text-purple-400 font-bold">
                          {precioVenta > 0 ? formatearMonto(precioVenta) : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stock Inicial:</span>
                        <span className="text-white">{stockActual} {unidad}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className={cn(
          "h-20 border-t border-white/10",
          "bg-gradient-to-r from-black/50 via-white/5 to-black/50",
          "px-6 flex items-center justify-between"
        )}>
          <Button
            type="button"
            variant="ghost"
            onClick={step === 1 ? handleClose : prevStep}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            {step === 1 ? (
              "Cancelar"
            ) : (
              <>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atrás
              </>
            )}
          </Button>

          {step < 2 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed}
              className={cn(
                "min-w-[140px]",
                "bg-white text-black hover:bg-gray-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed}
              className={cn(
                "min-w-[180px]",
                "bg-gradient-to-r from-purple-600 to-pink-600",
                "hover:from-purple-500 hover:to-pink-500",
                "text-white font-bold",
                "shadow-[0_0_30px_rgba(168,85,247,0.4)]",
                "transition-all duration-300"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Crear Producto
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateProductoModal
