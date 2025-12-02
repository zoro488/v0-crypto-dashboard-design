/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║              SCHEMAS DE ALMACÉN - VALIDACIÓN COMPLETA ZOD                 ║
 * ║                         CHRONOS SYSTEM v2.1                                ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * Esquemas de validación Zod para operaciones CRUD de almacén/inventario.
 * 
 * @module schemas/almacen
 * @version 2.1.0
 */

import { z } from 'zod'
import { OptionalTimestampSchema, FlexibleDateSchema } from './timestamp.schema'

// ═══════════════════════════════════════════════════════════════════════════════
// ESQUEMAS BASE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Esquema para cantidades de stock
 */
export const StockSchema = z
  .number()
  .int('El stock debe ser un número entero')
  .min(0, 'El stock no puede ser negativo')

/**
 * Esquema para valores monetarios (precios, costos)
 */
export const ValorMonetarioSchema = z
  .number()
  .min(0, 'El valor no puede ser negativo')
  .multipleOf(0.01, 'Máximo 2 decimales')

/**
 * Esquema para categorías de productos
 */
export const CategoriaProductoSchema = z.enum([
  'General',
  'Electrónica',
  'Ropa',
  'Alimentos',
  'Construcción',
  'Automotriz',
  'Otros',
]).default('General')

/**
 * Tipos de movimiento de almacén
 */
export const TipoMovimientoAlmacenSchema = z.enum([
  'entrada',
  'salida',
  'ajuste',
])

export type TipoMovimientoAlmacen = z.infer<typeof TipoMovimientoAlmacenSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// ESQUEMA PARA CREAR PRODUCTO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Esquema para crear un nuevo producto en el almacén
 */
export const CrearProductoSchema = z.object({
  /** Nombre del producto (requerido) */
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .transform(val => val.trim()),
  
  /** SKU o código del producto (opcional) */
  sku: z
    .string()
    .max(50, 'El SKU no puede exceder 50 caracteres')
    .optional(),
  
  /** Descripción del producto (opcional) */
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  
  /** Categoría del producto */
  categoria: CategoriaProductoSchema.optional(),
  
  /** Precio de compra/costo unitario */
  precioCompra: ValorMonetarioSchema.default(0),
  
  /** Precio de venta al público */
  precioVenta: ValorMonetarioSchema.default(0),
  
  /** Stock inicial */
  stockInicial: StockSchema.default(0),
  
  /** Stock mínimo para alertas */
  stockMinimo: StockSchema.default(5),
  
  /** Stock máximo (para control de inventario) */
  stockMaximo: StockSchema.optional(),
  
  /** Unidad de medida */
  unidad: z
    .string()
    .max(20, 'La unidad no puede exceder 20 caracteres')
    .default('unidades'),
  
  /** Origen/proveedor principal */
  origen: z
    .string()
    .max(100)
    .optional(),
  
  /** URL de imagen del producto */
  imagenUrl: z
    .string()
    .url('URL de imagen inválida')
    .optional()
    .or(z.literal('')),
}).refine(
  data => data.stockMaximo === undefined || data.stockMaximo >= data.stockMinimo,
  {
    message: 'El stock máximo debe ser mayor o igual al stock mínimo',
    path: ['stockMaximo'],
  },
).refine(
  data => data.precioVenta >= data.precioCompra,
  {
    message: 'El precio de venta debe ser mayor o igual al precio de compra',
    path: ['precioVenta'],
  },
)

export type CrearProductoInput = z.infer<typeof CrearProductoSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// ESQUEMA PARA ACTUALIZAR PRODUCTO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Esquema para actualizar un producto existente
 */
export const ActualizarProductoSchema = z.object({
  nombre: z
    .string()
    .min(2)
    .max(100)
    .transform(val => val.trim())
    .optional(),
  sku: z.string().max(50).optional(),
  descripcion: z.string().max(500).optional(),
  categoria: CategoriaProductoSchema.optional(),
  precioCompra: ValorMonetarioSchema.optional(),
  precioVenta: ValorMonetarioSchema.optional(),
  stockMinimo: StockSchema.optional(),
  stockMaximo: StockSchema.optional(),
  unidad: z.string().max(20).optional(),
  origen: z.string().max(100).optional(),
  imagenUrl: z.string().url().optional().or(z.literal('')),
  activo: z.boolean().optional(),
})

export type ActualizarProductoInput = z.infer<typeof ActualizarProductoSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// ESQUEMA COMPLETO DE PRODUCTO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Esquema completo de un producto en Firestore
 */
export const ProductoSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  sku: z.string().optional(),
  descripcion: z.string().optional(),
  categoria: z.string().optional(),
  
  // Precios
  precioCompra: z.number().default(0),
  precioVenta: z.number().default(0),
  valorUnitario: z.number().default(0), // Alias de precioCompra
  
  // Stock
  stockActual: z.number().int().default(0),
  stockMinimo: z.number().int().default(0),
  stockMaximo: z.number().int().optional(),
  
  // Historial
  totalEntradas: z.number().int().default(0),
  totalSalidas: z.number().int().default(0),
  
  // Metadata
  unidad: z.string().default('unidades'),
  origen: z.string().optional(),
  ordenCompraRef: z.string().optional(),
  
  // Keywords para búsqueda
  keywords: z.array(z.string()).default([]),
  
  // Estado
  activo: z.boolean().default(true),
  imagenUrl: z.string().optional(),
  
  // Timestamps
  createdAt: OptionalTimestampSchema,
  updatedAt: OptionalTimestampSchema,
})

export type Producto = z.infer<typeof ProductoSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// ESQUEMA PARA ENTRADA DE ALMACÉN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Esquema para registrar una entrada al almacén
 */
export const EntradaAlmacenSchema = z.object({
  /** ID del producto */
  productoId: z.string().min(1, 'El ID del producto es requerido'),
  
  /** Cantidad a ingresar */
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0'),
  
  /** Origen de la entrada */
  origen: z
    .string()
    .min(1, 'El origen es requerido')
    .max(100),
  
  /** Costo unitario (opcional) */
  costoUnitario: ValorMonetarioSchema.optional(),
  
  /** Referencia a orden de compra (opcional) */
  ordenCompraId: z.string().optional(),
  
  /** Notas adicionales */
  notas: z.string().max(500).optional(),
  
  /** Fecha de la entrada (opcional, default: ahora) */
  fecha: FlexibleDateSchema.optional(),
})

export type EntradaAlmacenInput = z.infer<typeof EntradaAlmacenSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// ESQUEMA PARA SALIDA DE ALMACÉN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Esquema para registrar una salida del almacén
 */
export const SalidaAlmacenSchema = z.object({
  /** ID del producto */
  productoId: z.string().min(1, 'El ID del producto es requerido'),
  
  /** Cantidad a sacar */
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0'),
  
  /** Destino de la salida */
  destino: z
    .string()
    .min(1, 'El destino es requerido')
    .max(100),
  
  /** Referencia a venta (opcional) */
  ventaId: z.string().optional(),
  
  /** Motivo de la salida */
  motivo: z
    .string()
    .max(200)
    .default('Salida por venta'),
  
  /** Notas adicionales */
  notas: z.string().max(500).optional(),
  
  /** Fecha de la salida (opcional, default: ahora) */
  fecha: FlexibleDateSchema.optional(),
})

export type SalidaAlmacenInput = z.infer<typeof SalidaAlmacenSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// ESQUEMA PARA AJUSTE DE INVENTARIO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Esquema para ajustar el inventario manualmente
 */
export const AjusteInventarioSchema = z.object({
  /** ID del producto */
  productoId: z.string().min(1, 'El ID del producto es requerido'),
  
  /** Nuevo stock (ajuste absoluto) */
  nuevoStock: StockSchema,
  
  /** Motivo del ajuste */
  motivo: z
    .string()
    .min(1, 'El motivo es requerido')
    .max(200),
  
  /** Notas adicionales */
  notas: z.string().max(500).optional(),
})

export type AjusteInventarioInput = z.infer<typeof AjusteInventarioSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// ESQUEMA COMPLETO DE MOVIMIENTO DE ALMACÉN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Esquema completo de un movimiento de almacén en Firestore
 */
export const MovimientoAlmacenSchema = z.object({
  id: z.string().min(1),
  tipo: TipoMovimientoAlmacenSchema,
  fecha: OptionalTimestampSchema,
  productoId: z.string(),
  productoNombre: z.string(), // Snapshot
  cantidad: z.number().int(),
  
  // Auditoría de stock
  stockAnterior: z.number().int(),
  stockNuevo: z.number().int(),
  
  // Valorización
  costoUnitario: z.number().optional(),
  valorTotal: z.number().optional(),
  
  // Referencias
  referenciaId: z.string().optional(),
  referenciaTipo: z.enum(['venta', 'orden_compra', 'ajuste_manual']).optional(),
  origen: z.string().optional(),
  destino: z.string().optional(),
  motivo: z.string().optional(),
  
  // Auditoría
  usuarioId: z.string().optional(),
  createdAt: OptionalTimestampSchema,
})

export type MovimientoAlmacen = z.infer<typeof MovimientoAlmacenSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Valida datos para crear un producto
 */
export function validarCrearProducto(data: unknown): {
  success: boolean
  data?: CrearProductoInput
  errors?: string[]
} {
  const result = CrearProductoSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Valida datos para entrada de almacén
 */
export function validarEntradaAlmacen(data: unknown): {
  success: boolean
  data?: EntradaAlmacenInput
  errors?: string[]
} {
  const result = EntradaAlmacenSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Valida datos para salida de almacén
 */
export function validarSalidaAlmacen(data: unknown): {
  success: boolean
  data?: SalidaAlmacenInput
  errors?: string[]
} {
  const result = SalidaAlmacenSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Valida datos para ajuste de inventario
 */
export function validarAjusteInventario(data: unknown): {
  success: boolean
  data?: AjusteInventarioInput
  errors?: string[]
} {
  const result = AjusteInventarioSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Genera keywords para búsqueda de productos
 */
export function generarKeywordsProducto(
  nombre: string, 
  sku?: string, 
  categoria?: string,
): string[] {
  const keywords: string[] = []
  
  // Nombre completo en minúsculas
  keywords.push(nombre.toLowerCase().trim())
  
  // Palabras individuales del nombre
  nombre.toLowerCase().split(/\s+/).forEach(palabra => {
    if (palabra.length >= 2) {
      keywords.push(palabra)
    }
  })
  
  // SKU
  if (sku) {
    keywords.push(sku.toLowerCase())
  }
  
  // Categoría
  if (categoria) {
    keywords.push(categoria.toLowerCase())
  }
  
  // Prefijos para búsqueda incremental
  for (let i = 2; i <= Math.min(nombre.length, 8); i++) {
    keywords.push(nombre.toLowerCase().substring(0, i))
  }
  
  return [...new Set(keywords)]
}

/**
 * Verifica si hay stock suficiente para una salida
 */
export function verificarStockSuficiente(
  stockActual: number, 
  cantidadSolicitada: number,
): { valido: boolean; mensaje?: string } {
  if (cantidadSolicitada <= 0) {
    return { valido: false, mensaje: 'La cantidad debe ser mayor a 0' }
  }
  
  if (stockActual < cantidadSolicitada) {
    return { 
      valido: false, 
      mensaje: `Stock insuficiente. Disponible: ${stockActual}, Solicitado: ${cantidadSolicitada}`, 
    }
  }
  
  return { valido: true }
}

export default ProductoSchema
