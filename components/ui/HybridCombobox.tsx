"use client"

/**
 * 🎯 HYBRID COMBOBOX - Smart Search & Create Component
 * 
 * Componente inteligente que permite:
 * 1. Buscar registros existentes en Firestore
 * 2. Crear nuevos registros inline sin salir del flujo
 * 3. Animaciones suaves con Framer Motion
 * 4. Estilo Glassmorphism futurista
 */

import * as React from "react"
import { Check, ChevronsUpDown, Plus, Search, Loader2, User, Box, Truck, Sparkles, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/app/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/app/hooks/use-toast"
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp,
  onSnapshot,
  type Unsubscribe
} from "firebase/firestore"
import { db } from "@/app/lib/firebase/config"
import { logger } from "@/app/lib/utils/logger"

// ============================================
// TIPOS
// ============================================

type CollectionType = "clientes" | "distribuidores" | "productos"

interface HybridComboboxProps {
  /** Colección de Firestore a buscar */
  collectionName: CollectionType
  /** ID del item seleccionado */
  value?: string
  /** Callback cuando se selecciona un item */
  onSelect: (item: ComboboxItem) => void
  /** Placeholder del botón */
  placeholder?: string
  /** Label del campo */
  label?: string
  /** Si está deshabilitado */
  disabled?: boolean
  /** Clase CSS adicional */
  className?: string
}

interface ComboboxItem {
  id: string
  nombre: string
  telefono?: string
  email?: string
  precio_venta?: number
  precioVenta?: number
  stockActual?: number
  deudaTotal?: number
  [key: string]: unknown
}

interface QuickCreateField {
  name: string
  label: string
  type: "text" | "email" | "tel" | "number"
  placeholder: string
  required?: boolean
}

// Configuración por tipo de colección
const COLLECTION_CONFIG: Record<CollectionType, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  quickCreateFields: QuickCreateField[]
  searchFields: string[]
}> = {
  clientes: {
    icon: User,
    color: "blue",
    quickCreateFields: [
      { name: "telefono", label: "Teléfono", type: "tel", placeholder: "+52 (XXX) XXX-XXXX" },
      { name: "email", label: "Email", type: "email", placeholder: "cliente@ejemplo.com" },
    ],
    searchFields: ["nombre", "telefono", "email"],
  },
  distribuidores: {
    icon: Truck,
    color: "purple",
    quickCreateFields: [
      { name: "contacto", label: "Contacto", type: "text", placeholder: "Nombre del contacto" },
      { name: "telefono", label: "Teléfono", type: "tel", placeholder: "+52 (XXX) XXX-XXXX" },
    ],
    searchFields: ["nombre", "empresa", "contacto"],
  },
  productos: {
    icon: Box,
    color: "green",
    quickCreateFields: [
      { name: "precioVenta", label: "Precio Venta", type: "number", placeholder: "0.00", required: true },
      { name: "stockActual", label: "Stock Inicial", type: "number", placeholder: "0" },
    ],
    searchFields: ["nombre", "sku", "categoria"],
  },
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function HybridCombobox({
  collectionName,
  value,
  onSelect,
  placeholder,
  label,
  disabled = false,
  className,
}: HybridComboboxProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [items, setItems] = React.useState<ComboboxItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isCreating, setIsCreating] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [newItemData, setNewItemData] = React.useState<Record<string, string>>({})

  const config = COLLECTION_CONFIG[collectionName]
  const Icon = config.icon

  // Suscribirse a la colección
  React.useEffect(() => {
    let unsubscribe: Unsubscribe

    const loadItems = async () => {
      try {
        setLoading(true)
        const collRef = collection(db, collectionName)
        const q = query(collRef, orderBy("nombre"))
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ComboboxItem[]
          setItems(data)
          setLoading(false)
        }, (error) => {
          logger.error(`Error cargando ${collectionName}`, error)
          setLoading(false)
        })
      } catch (error) {
        logger.error(`Error en suscripción ${collectionName}`, error)
        setLoading(false)
      }
    }

    loadItems()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [collectionName])

  // Filtrar items basado en query
  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return items
    
    const searchLower = query.toLowerCase()
    return items.filter(item => 
      config.searchFields.some(field => 
        String(item[field] || "").toLowerCase().includes(searchLower)
      )
    )
  }, [items, query, config.searchFields])

  // Verificar si existe coincidencia exacta
  const hasExactMatch = React.useMemo(() => {
    return items.some(item => 
      item.nombre.toLowerCase() === query.toLowerCase().trim()
    )
  }, [items, query])

  // Item seleccionado actual
  const selectedItem = items.find(item => item.id === value)

  // Manejar selección
  const handleSelect = (item: ComboboxItem) => {
    onSelect(item)
    setOpen(false)
    setQuery("")
    setIsCreating(false)
  }

  // Iniciar modo creación
  const handleStartCreate = () => {
    setIsCreating(true)
    setNewItemData({ nombre: query })
  }

  // Crear nuevo item
  const handleCreate = async () => {
    if (!newItemData.nombre?.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      })
      return
    }

    // Validar campos requeridos
    const missingRequired = config.quickCreateFields
      .filter(f => f.required && !newItemData[f.name]?.trim())
      .map(f => f.label)

    if (missingRequired.length > 0) {
      toast({
        title: "Campos requeridos",
        description: `Completa: ${missingRequired.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Preparar datos según colección
      const baseData: Record<string, unknown> = {
        nombre: newItemData.nombre.trim(),
        keywords: generateKeywords(newItemData.nombre),
        estado: "activo",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      // Agregar campos específicos
      config.quickCreateFields.forEach(field => {
        if (newItemData[field.name]) {
          if (field.type === "number") {
            baseData[field.name] = Number(newItemData[field.name]) || 0
          } else {
            baseData[field.name] = newItemData[field.name].trim()
          }
        }
      })

      // Campos adicionales por colección
      if (collectionName === "clientes") {
        baseData.deudaTotal = 0
        baseData.totalVentas = 0
        baseData.totalPagado = 0
        baseData.numeroCompras = 0
      } else if (collectionName === "distribuidores") {
        baseData.deudaTotal = 0
        baseData.totalOrdenesCompra = 0
        baseData.totalPagado = 0
        baseData.numeroOrdenes = 0
      } else if (collectionName === "productos") {
        baseData.stockActual = Number(newItemData.stockActual) || 0
        baseData.stockMinimo = 5
        baseData.precioCompra = 0
        baseData.totalEntradas = Number(newItemData.stockActual) || 0
        baseData.totalSalidas = 0
        baseData.activo = true
      }

      // Guardar en Firestore
      const docRef = await addDoc(collection(db, collectionName), baseData)

      // Crear item completo para seleccionar
      const newItem: ComboboxItem = {
        id: docRef.id,
        ...baseData,
      } as ComboboxItem

      toast({
        title: "✨ Creado exitosamente",
        description: `"${newItemData.nombre}" se ha agregado a ${collectionName}`,
      })

      // Seleccionar el nuevo item
      handleSelect(newItem)
      
      // Limpiar
      setNewItemData({})
      setIsCreating(false)

    } catch (error) {
      logger.error("Error creando item", error)
      toast({
        title: "Error",
        description: "No se pudo crear el registro",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cancelar creación
  const handleCancelCreate = () => {
    setIsCreating(false)
    setNewItemData({})
  }

  // Generar keywords para búsqueda
  const generateKeywords = (text: string): string[] => {
    const words = text.toLowerCase().split(/\s+/)
    const keywords: string[] = []
    
    words.forEach(word => {
      // Agregar palabra completa
      keywords.push(word)
      // Agregar prefijos para búsqueda parcial
      for (let i = 1; i <= word.length; i++) {
        keywords.push(word.substring(0, i))
      }
    })
    
    return [...new Set(keywords)]
  }

  // Obtener color según config
  const getColorClasses = () => {
    switch (config.color) {
      case "blue":
        return {
          icon: "text-blue-400",
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
          hover: "hover:bg-blue-500/20",
          selected: "bg-blue-600/20 text-blue-200",
        }
      case "purple":
        return {
          icon: "text-purple-400",
          bg: "bg-purple-500/10",
          border: "border-purple-500/30",
          hover: "hover:bg-purple-500/20",
          selected: "bg-purple-600/20 text-purple-200",
        }
      case "green":
        return {
          icon: "text-green-400",
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          hover: "hover:bg-green-500/20",
          selected: "bg-green-600/20 text-green-200",
        }
      default:
        return {
          icon: "text-gray-400",
          bg: "bg-gray-500/10",
          border: "border-gray-500/30",
          hover: "hover:bg-gray-500/20",
          selected: "bg-gray-600/20 text-gray-200",
        }
    }
  }

  const colors = getColorClasses()

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium text-white/80">{label}</Label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between h-12",
              "bg-white/5 border-white/10 text-white",
              "hover:bg-white/10 hover:border-white/20 hover:text-white",
              "backdrop-blur-md transition-all duration-300",
              "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {selectedItem ? (
              <span className="flex items-center gap-2">
                <Icon className={cn("w-4 h-4", colors.icon)} />
                <span className="truncate">{selectedItem.nombre}</span>
              </span>
            ) : (
              <span className="text-gray-400">
                {placeholder || `Buscar ${collectionName}...`}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent 
          className={cn(
            "w-[350px] p-0",
            "bg-black/95 border-white/10 backdrop-blur-xl",
            "shadow-2xl shadow-black/50"
          )}
          align="start"
        >
          <Command shouldFilter={false} className="bg-transparent">
            {/* Barra de búsqueda */}
            <div className="flex items-center border-b border-white/10 px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-gray-500" />
              <input
                className={cn(
                  "flex h-11 w-full bg-transparent py-3 text-sm text-white",
                  "outline-none placeholder:text-gray-500",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                placeholder="Escribe para buscar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isCreating}
              />
              {query && !isCreating && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X className="h-3 w-3 text-gray-500" />
                </button>
              )}
            </div>

            <CommandList className="max-h-[300px] overflow-y-auto">
              {/* Estado de carga */}
              {loading && (
                <div className="py-6 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-500 mb-2" />
                  <p className="text-sm text-gray-500">Cargando {collectionName}...</p>
                </div>
              )}

              {/* Resultados */}
              {!loading && !isCreating && (
                <CommandGroup heading="Resultados" className="text-gray-400">
                  {filteredItems.length === 0 && query && (
                    <div className="py-4 text-center text-sm text-gray-500">
                      No se encontró "{query}"
                    </div>
                  )}
                  
                  {filteredItems.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.nombre}
                      onSelect={() => handleSelect(item)}
                      className={cn(
                        "cursor-pointer py-3 px-3 mx-1 rounded-lg",
                        "aria-selected:bg-white/10",
                        value === item.id && colors.selected
                      )}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          colors.bg
                        )}>
                          <Icon className={cn("w-4 h-4", colors.icon)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {item.nombre}
                          </p>
                          {item.telefono && (
                            <p className="text-xs text-gray-500 truncate">
                              {item.telefono}
                            </p>
                          )}
                        </div>
                        {value === item.id && (
                          <Check className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Opción de crear nuevo */}
              {!loading && !isCreating && query.trim() && !hasExactMatch && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleStartCreate}
                    className={cn(
                      "cursor-pointer py-3 px-3 mx-1 rounded-lg",
                      "bg-gradient-to-r from-blue-500/10 to-purple-500/10",
                      "border border-blue-500/20",
                      "hover:from-blue-500/20 hover:to-purple-500/20",
                      "transition-all duration-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-300">
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          Crear "{query}"
                        </p>
                        <p className="text-xs text-gray-500">
                          Agregar nuevo {collectionName.slice(0, -1)}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>

            {/* Panel de creación rápida */}
            <AnimatePresence>
              {isCreating && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="border-t border-white/10 overflow-hidden"
                >
                  <div className="p-4 space-y-4 bg-gradient-to-b from-white/5 to-transparent">
                    {/* Título */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-white">
                        Nuevo {collectionName.slice(0, -1)}
                      </span>
                    </div>

                    {/* Campo nombre */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-400">Nombre *</Label>
                      <Input
                        value={newItemData.nombre || ""}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, nombre: e.target.value }))}
                        placeholder="Nombre completo"
                        className={cn(
                          "h-10 bg-black/50 border-white/10",
                          "focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30",
                          "text-white placeholder:text-gray-600"
                        )}
                        autoFocus
                      />
                    </div>

                    {/* Campos adicionales */}
                    {config.quickCreateFields.map((field) => (
                      <div key={field.name} className="space-y-1.5">
                        <Label className="text-xs text-gray-400">
                          {field.label} {field.required && "*"}
                        </Label>
                        <Input
                          type={field.type}
                          value={newItemData[field.name] || ""}
                          onChange={(e) => setNewItemData(prev => ({ 
                            ...prev, 
                            [field.name]: e.target.value 
                          }))}
                          placeholder={field.placeholder}
                          className={cn(
                            "h-10 bg-black/50 border-white/10",
                            "focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30",
                            "text-white placeholder:text-gray-600"
                          )}
                        />
                      </div>
                    ))}

                    {/* Botones */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelCreate}
                        disabled={isSubmitting}
                        className="flex-1 h-9 text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreate}
                        disabled={isSubmitting}
                        className={cn(
                          "flex-1 h-9",
                          "bg-gradient-to-r from-blue-600 to-purple-600",
                          "hover:from-blue-500 hover:to-purple-500",
                          "text-white font-medium",
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
                            <Check className="w-4 h-4 mr-2" />
                            Guardar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default HybridCombobox
