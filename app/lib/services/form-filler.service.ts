/**
 * 🤖 FORM FILLER SERVICE - Llenado automático de formularios desde voz/IA
 * 
 * Este servicio conecta el output del parsing de voz con React Hook Form
 * para llenar automáticamente los campos de los Smart Forms.
 * 
 * Flujo:
 * 1. useRealtimeVoice → captura voz
 * 2. voice-parsing.service → extrae datos estructurados
 * 3. FormFillerService → mapea datos a campos de formulario
 * 4. React Hook Form → actualiza el formulario
 */

import type { UseFormSetValue, UseFormGetValues, FieldValues, Path, PathValue } from "react-hook-form"
import type { 
  VentaVoiceData, 
  OrdenCompraVoiceData, 
  ProductoVoiceData 
} from "@/app/lib/ai/voice-parsing.service"
import { logger } from "@/app/lib/utils/logger"

// ============================================
// TIPOS
// ============================================

export interface FormFillerOptions<T extends FieldValues> {
  /** Función setValue de React Hook Form */
  setValue: UseFormSetValue<T>
  /** Función getValues de React Hook Form */
  getValues: UseFormGetValues<T>
  /** Callback cuando se llena un campo exitosamente */
  onFieldFilled?: (fieldName: string, value: unknown) => void
  /** Callback para buscar entidades (clientes, productos, etc.) */
  entityLookup?: EntityLookup
}

export interface EntityLookup {
  /** Buscar cliente por nombre, retorna ID si existe */
  findCliente?: (nombre: string) => Promise<string | null>
  /** Buscar producto por nombre, retorna datos si existe */
  findProducto?: (nombre: string) => Promise<{
    id: string
    nombre: string
    precioVenta: number
    stock: number
  } | null>
  /** Buscar distribuidor por nombre, retorna ID si existe */
  findDistribuidor?: (nombre: string) => Promise<string | null>
}

export interface FillResult {
  success: boolean
  filledFields: string[]
  skippedFields: string[]
  warnings: string[]
  needsUserInput: string[]
}

// ============================================
// VENTA FORM FILLER
// ============================================

/**
 * Llenar formulario de VENTA desde datos de voz
 */
export async function fillVentaForm<T extends FieldValues>(
  voiceData: VentaVoiceData,
  options: FormFillerOptions<T>
): Promise<FillResult> {
  const { setValue, getValues, onFieldFilled, entityLookup } = options
  const result: FillResult = {
    success: true,
    filledFields: [],
    skippedFields: [],
    warnings: [],
    needsUserInput: [],
  }

  try {
    // 1. Procesar CLIENTE
    if (voiceData.cliente?.nombre) {
      const clienteNombre = voiceData.cliente.nombre

      if (entityLookup?.findCliente) {
        const clienteId = await entityLookup.findCliente(clienteNombre)
        
        if (clienteId) {
          // Cliente encontrado - usar ID
          safeSetValue(setValue, "clienteId" as Path<T>, clienteId as PathValue<T, Path<T>>)
          result.filledFields.push("clienteId")
          onFieldFilled?.("clienteId", clienteId)
        } else if (voiceData.cliente.esNuevo) {
          // Cliente nuevo - llenar datos para crear
          safeSetValue(setValue, "nuevoCliente.nombre" as Path<T>, clienteNombre as PathValue<T, Path<T>>)
          result.filledFields.push("nuevoCliente.nombre")
          onFieldFilled?.("nuevoCliente.nombre", clienteNombre)

          if (voiceData.cliente.telefono) {
            safeSetValue(setValue, "nuevoCliente.telefono" as Path<T>, voiceData.cliente.telefono as PathValue<T, Path<T>>)
            result.filledFields.push("nuevoCliente.telefono")
          }
          
          result.warnings.push(`Cliente "${clienteNombre}" no existe. Se creará uno nuevo.`)
        } else {
          result.needsUserInput.push(`Seleccionar cliente: "${clienteNombre}"`)
        }
      }
    }

    // 2. Procesar PRODUCTOS
    if (voiceData.productos && voiceData.productos.length > 0) {
      const carritoItems: Array<{
        productoId?: string
        nombre: string
        cantidad: number
        precioUnitario: number
      }> = []

      for (const item of voiceData.productos) {
        let productoData = null

        if (entityLookup?.findProducto) {
          productoData = await entityLookup.findProducto(item.nombre)
        }

        if (productoData) {
          carritoItems.push({
            productoId: productoData.id,
            nombre: productoData.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioSugerido || productoData.precioVenta,
          })

          // Verificar stock
          if (productoData.stock < item.cantidad) {
            result.warnings.push(
              `⚠️ "${productoData.nombre}": Stock insuficiente (hay ${productoData.stock}, se pidieron ${item.cantidad})`
            )
          }
        } else {
          result.needsUserInput.push(`Producto no encontrado: "${item.nombre}"`)
          carritoItems.push({
            nombre: item.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioSugerido || 0,
          })
        }
      }

      if (carritoItems.length > 0) {
        safeSetValue(setValue, "carrito" as Path<T>, carritoItems as PathValue<T, Path<T>>)
        result.filledFields.push("carrito")
        onFieldFilled?.("carrito", carritoItems)
      }
    }

    // 3. Procesar PAGO
    if (voiceData.pago) {
      if (voiceData.pago.metodo) {
        safeSetValue(setValue, "metodoPago" as Path<T>, voiceData.pago.metodo as PathValue<T, Path<T>>)
        result.filledFields.push("metodoPago")
        onFieldFilled?.("metodoPago", voiceData.pago.metodo)
      }

      if (voiceData.pago.esCredito) {
        safeSetValue(setValue, "esCredito" as Path<T>, true as PathValue<T, Path<T>>)
        result.filledFields.push("esCredito")
        onFieldFilled?.("esCredito", true)

        if (voiceData.pago.monto) {
          // Si es crédito y hay monto, es un abono inicial
          safeSetValue(setValue, "abonoInicial" as Path<T>, voiceData.pago.monto as PathValue<T, Path<T>>)
          result.filledFields.push("abonoInicial")
          onFieldFilled?.("abonoInicial", voiceData.pago.monto)
        }
      }
    }

    // 4. Procesar NOTAS
    if (voiceData.notas) {
      safeSetValue(setValue, "notas" as Path<T>, voiceData.notas as PathValue<T, Path<T>>)
      result.filledFields.push("notas")
      onFieldFilled?.("notas", voiceData.notas)
    }

    logger.info("Venta form filled from voice", {
      filledFields: result.filledFields,
      warnings: result.warnings,
    })

  } catch (error) {
    logger.error("Error filling venta form", error)
    result.success = false
    result.warnings.push("Error al llenar formulario: " + (error instanceof Error ? error.message : "Error desconocido"))
  }

  return result
}

// ============================================
// ORDEN COMPRA FORM FILLER
// ============================================

/**
 * Llenar formulario de ORDEN DE COMPRA desde datos de voz
 */
export async function fillOrdenCompraForm<T extends FieldValues>(
  voiceData: OrdenCompraVoiceData,
  options: FormFillerOptions<T>
): Promise<FillResult> {
  const { setValue, onFieldFilled, entityLookup } = options
  const result: FillResult = {
    success: true,
    filledFields: [],
    skippedFields: [],
    warnings: [],
    needsUserInput: [],
  }

  try {
    // 1. Procesar DISTRIBUIDOR
    if (voiceData.distribuidor?.nombre) {
      const distribuidorNombre = voiceData.distribuidor.nombre

      if (entityLookup?.findDistribuidor) {
        const distribuidorId = await entityLookup.findDistribuidor(distribuidorNombre)
        
        if (distribuidorId) {
          safeSetValue(setValue, "distribuidorId" as Path<T>, distribuidorId as PathValue<T, Path<T>>)
          result.filledFields.push("distribuidorId")
          onFieldFilled?.("distribuidorId", distribuidorId)
        } else if (voiceData.distribuidor.esNuevo) {
          safeSetValue(setValue, "nuevoDistribuidor.nombre" as Path<T>, distribuidorNombre as PathValue<T, Path<T>>)
          result.filledFields.push("nuevoDistribuidor.nombre")
          result.warnings.push(`Distribuidor "${distribuidorNombre}" no existe. Se creará uno nuevo.`)
        } else {
          result.needsUserInput.push(`Seleccionar distribuidor: "${distribuidorNombre}"`)
        }
      }
    }

    // 2. Procesar PRODUCTOS
    if (voiceData.productos && voiceData.productos.length > 0) {
      const productosOC = voiceData.productos.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        costoUnitario: item.costoUnitario || 0,
        subtotal: (item.costoUnitario || 0) * item.cantidad,
      }))

      safeSetValue(setValue, "productos" as Path<T>, productosOC as PathValue<T, Path<T>>)
      result.filledFields.push("productos")
      onFieldFilled?.("productos", productosOC)
    }

    // 3. Procesar COSTOS
    if (voiceData.costos) {
      if (voiceData.costos.envio) {
        safeSetValue(setValue, "costoEnvio" as Path<T>, voiceData.costos.envio as PathValue<T, Path<T>>)
        result.filledFields.push("costoEnvio")
        onFieldFilled?.("costoEnvio", voiceData.costos.envio)
      }

      if (voiceData.costos.total) {
        safeSetValue(setValue, "costoTotal" as Path<T>, voiceData.costos.total as PathValue<T, Path<T>>)
        result.filledFields.push("costoTotal")
        onFieldFilled?.("costoTotal", voiceData.costos.total)
      }
    }

    // 4. Procesar PAGO
    if (voiceData.pago) {
      if (voiceData.pago.anticipo) {
        safeSetValue(setValue, "anticipo" as Path<T>, voiceData.pago.anticipo as PathValue<T, Path<T>>)
        result.filledFields.push("anticipo")
        onFieldFilled?.("anticipo", voiceData.pago.anticipo)
      }

      const esCredito = voiceData.pago.esCredito ?? true
      safeSetValue(setValue, "esCredito" as Path<T>, esCredito as PathValue<T, Path<T>>)
      result.filledFields.push("esCredito")
      onFieldFilled?.("esCredito", esCredito)
    }

    logger.info("Orden compra form filled from voice", {
      filledFields: result.filledFields,
    })

  } catch (error) {
    logger.error("Error filling orden compra form", error)
    result.success = false
    result.warnings.push("Error al llenar formulario")
  }

  return result
}

// ============================================
// PRODUCTO FORM FILLER
// ============================================

/**
 * Llenar formulario de PRODUCTO desde datos de voz
 */
export async function fillProductoForm<T extends FieldValues>(
  voiceData: ProductoVoiceData,
  options: FormFillerOptions<T>
): Promise<FillResult> {
  const { setValue, onFieldFilled } = options
  const result: FillResult = {
    success: true,
    filledFields: [],
    skippedFields: [],
    warnings: [],
    needsUserInput: [],
  }

  try {
    // 1. Datos básicos del producto
    if (voiceData.producto) {
      if (voiceData.producto.nombre) {
        safeSetValue(setValue, "nombre" as Path<T>, voiceData.producto.nombre as PathValue<T, Path<T>>)
        result.filledFields.push("nombre")
        onFieldFilled?.("nombre", voiceData.producto.nombre)
      }

      if (voiceData.producto.descripcion) {
        safeSetValue(setValue, "descripcion" as Path<T>, voiceData.producto.descripcion as PathValue<T, Path<T>>)
        result.filledFields.push("descripcion")
      }

      if (voiceData.producto.categoria) {
        safeSetValue(setValue, "categoria" as Path<T>, voiceData.producto.categoria as PathValue<T, Path<T>>)
        result.filledFields.push("categoria")
      }

      if (voiceData.producto.sku) {
        safeSetValue(setValue, "sku" as Path<T>, voiceData.producto.sku as PathValue<T, Path<T>>)
        result.filledFields.push("sku")
      }
    }

    // 2. Precios
    if (voiceData.precios) {
      if (voiceData.precios.compra) {
        safeSetValue(setValue, "precioCompra" as Path<T>, voiceData.precios.compra as PathValue<T, Path<T>>)
        result.filledFields.push("precioCompra")
        onFieldFilled?.("precioCompra", voiceData.precios.compra)
      }

      if (voiceData.precios.venta) {
        safeSetValue(setValue, "precioVenta" as Path<T>, voiceData.precios.venta as PathValue<T, Path<T>>)
        result.filledFields.push("precioVenta")
        onFieldFilled?.("precioVenta", voiceData.precios.venta)
      }

      // Calcular precio venta si solo tenemos compra + margen
      if (voiceData.precios.compra && voiceData.precios.margen && !voiceData.precios.venta) {
        const precioVentaCalculado = voiceData.precios.compra * (1 + voiceData.precios.margen / 100)
        safeSetValue(setValue, "precioVenta" as Path<T>, precioVentaCalculado as PathValue<T, Path<T>>)
        result.filledFields.push("precioVenta (calculado)")
        result.warnings.push(`Precio venta calculado con ${voiceData.precios.margen}% margen: $${precioVentaCalculado.toFixed(2)}`)
      }
    }

    // 3. Stock
    if (voiceData.stock) {
      if (voiceData.stock.inicial !== undefined) {
        safeSetValue(setValue, "stock" as Path<T>, voiceData.stock.inicial as PathValue<T, Path<T>>)
        result.filledFields.push("stock")
        onFieldFilled?.("stock", voiceData.stock.inicial)
      }

      if (voiceData.stock.minimo !== undefined) {
        safeSetValue(setValue, "stockMinimo" as Path<T>, voiceData.stock.minimo as PathValue<T, Path<T>>)
        result.filledFields.push("stockMinimo")
      }
    }

    logger.info("Producto form filled from voice", {
      filledFields: result.filledFields,
    })

  } catch (error) {
    logger.error("Error filling producto form", error)
    result.success = false
    result.warnings.push("Error al llenar formulario")
  }

  return result
}

// ============================================
// HELPERS
// ============================================

/**
 * Wrapper seguro para setValue que maneja tipos genéricos
 */
function safeSetValue<T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  name: Path<T>,
  value: PathValue<T, Path<T>>
): void {
  try {
    setValue(name, value, { shouldValidate: true, shouldDirty: true })
  } catch (error) {
    logger.warn(`Could not set field ${String(name)}:`, error)
  }
}

/**
 * Crear un EntityLookup desde Firestore data
 */
export function createEntityLookup(data: {
  clientes?: Array<{ id: string; nombre: string }>
  productos?: Array<{ id: string; nombre: string; precioVenta: number; stock: number }>
  distribuidores?: Array<{ id: string; nombre: string }>
}): EntityLookup {
  return {
    findCliente: async (nombre: string) => {
      if (!data.clientes) return null
      const nombreLower = nombre.toLowerCase()
      const found = data.clientes.find(c => 
        c.nombre.toLowerCase().includes(nombreLower) ||
        nombreLower.includes(c.nombre.toLowerCase())
      )
      return found?.id ?? null
    },

    findProducto: async (nombre: string) => {
      if (!data.productos) return null
      const nombreLower = nombre.toLowerCase()
      return data.productos.find(p => 
        p.nombre.toLowerCase().includes(nombreLower) ||
        nombreLower.includes(p.nombre.toLowerCase())
      ) ?? null
    },

    findDistribuidor: async (nombre: string) => {
      if (!data.distribuidores) return null
      const nombreLower = nombre.toLowerCase()
      const found = data.distribuidores.find(d => 
        d.nombre.toLowerCase().includes(nombreLower) ||
        nombreLower.includes(d.nombre.toLowerCase())
      )
      return found?.id ?? null
    },
  }
}

/**
 * Calcular totales del carrito
 */
export function calcularTotalesCarrito(
  carrito: Array<{ cantidad: number; precioUnitario: number }>
): { subtotal: number; total: number } {
  const subtotal = carrito.reduce(
    (acc, item) => acc + item.cantidad * item.precioUnitario,
    0
  )
  return { subtotal, total: subtotal }
}

/**
 * Generar mensaje de confirmación para el usuario
 */
export function generarMensajeConfirmacion(result: FillResult): string {
  const parts: string[] = []

  if (result.filledFields.length > 0) {
    parts.push(`✅ Campos llenados: ${result.filledFields.join(", ")}`)
  }

  if (result.warnings.length > 0) {
    parts.push(`⚠️ Advertencias:\n${result.warnings.join("\n")}`)
  }

  if (result.needsUserInput.length > 0) {
    parts.push(`📝 Requiere tu selección:\n${result.needsUserInput.join("\n")}`)
  }

  return parts.join("\n\n")
}
