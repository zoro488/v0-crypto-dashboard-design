/**
 * Esquemas de validación Zod para Órdenes de Compra
 * @module schemas/ordenes-compra
 */

import { z } from "zod"

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS BASE
// ═══════════════════════════════════════════════════════════════════════════

const MontoSchema = z.number().positive("El monto debe ser mayor a 0")
const CantidadSchema = z.number().int().positive("La cantidad debe ser mayor a 0")
const FechaSchema = z.string().datetime().or(z.date())

/**
 * IDs de bancos válidos
 */
const BancoIdSchema = z.enum([
  "boveda_monte",
  "boveda_usa",
  "utilidades",
  "flete_sur",
  "azteca",
  "leftie",
  "profit"
], {
  errorMap: () => ({ message: "Banco inválido" }),
})

/**
 * Estados posibles de una orden de compra
 */
export const EstadoOrdenSchema = z.enum(["pendiente", "parcial", "pagado", "cancelado"], {
  errorMap: () => ({ message: "Estado de orden inválido" }),
})

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE ORDEN DE COMPRA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Esquema para crear una nueva orden de compra
 */
export const CrearOrdenCompraSchema = z.object({
  fecha: FechaSchema.optional().default(() => new Date().toISOString()),
  
  // Distribuidor
  distribuidorId: z.string().min(1, "El distribuidor es requerido"),
  distribuidor: z.string().min(1, "El nombre del distribuidor es requerido"),
  origen: z.string().optional(),
  
  // Producto/Cantidad
  producto: z.string().min(1, "El producto es requerido").max(100),
  cantidad: CantidadSchema,
  
  // Costos
  costoDistribuidor: MontoSchema,
  costoTransporte: z.number().min(0, "El costo de transporte no puede ser negativo").default(0),
  costoPorUnidad: MontoSchema,
  costoTotal: MontoSchema,
  
  // Stock tracking
  stockActual: CantidadSchema.optional(),
  stockInicial: CantidadSchema.optional(),
  
  // Pagos
  pagoDistribuidor: z.number().min(0).default(0),
  pagoInicial: z.number().min(0).default(0),
  deuda: z.number().min(0),
  bancoOrigen: BancoIdSchema.optional(),
  
  // Estado
  estado: EstadoOrdenSchema.default("pendiente"),
  
  // Notas
  notas: z.string().max(500).optional(),
})
  .refine(
    (data) => {
      // Verificar que costoPorUnidad = costoDistribuidor + costoTransporte
      const costoCalculado = data.costoDistribuidor + data.costoTransporte
      return Math.abs(data.costoPorUnidad - costoCalculado) < 0.01
    },
    {
      message: "El costo por unidad debe ser igual a costo distribuidor + costo transporte",
      path: ["costoPorUnidad"],
    }
  )
  .refine(
    (data) => {
      // Verificar que costoTotal = costoPorUnidad × cantidad
      const totalCalculado = data.costoPorUnidad * data.cantidad
      return Math.abs(data.costoTotal - totalCalculado) < 0.01
    },
    {
      message: "El costo total no coincide con costo por unidad × cantidad",
      path: ["costoTotal"],
    }
  )
  .refine(
    (data) => {
      // Verificar que pagoInicial + deuda = costoTotal
      const pagoTotal = (data.pagoInicial || data.pagoDistribuidor) + data.deuda
      return Math.abs(pagoTotal - data.costoTotal) < 0.01
    },
    {
      message: "La suma de pago inicial y deuda debe igualar el costo total",
      path: ["deuda"],
    }
  )
  .refine(
    (data) => {
      // Si hay pago inicial, debe especificar banco
      const pago = data.pagoInicial || data.pagoDistribuidor
      if (pago > 0 && !data.bancoOrigen) {
        return false
      }
      return true
    },
    {
      message: "Si hay pago inicial, debe especificar el banco de origen",
      path: ["bancoOrigen"],
    }
  )

/**
 * Esquema para actualizar una orden de compra existente
 */
export const ActualizarOrdenCompraSchema = z.object({
  id: z.string().min(1),
  fecha: FechaSchema.optional(),
  distribuidorId: z.string().optional(),
  distribuidor: z.string().optional(),
  origen: z.string().optional(),
  producto: z.string().optional(),
  cantidad: CantidadSchema.optional(),
  costoDistribuidor: MontoSchema.optional(),
  costoTransporte: z.number().min(0).optional(),
  costoPorUnidad: MontoSchema.optional(),
  costoTotal: MontoSchema.optional(),
  stockActual: CantidadSchema.optional(),
  stockInicial: CantidadSchema.optional(),
  pagoDistribuidor: z.number().min(0).optional(),
  pagoInicial: z.number().min(0).optional(),
  deuda: z.number().min(0).optional(),
  bancoOrigen: BancoIdSchema.optional(),
  estado: EstadoOrdenSchema.optional(),
  notas: z.string().max(500).optional(),
})

/**
 * Esquema completo de una orden de compra
 */
export const OrdenCompraSchema = z.object({
  id: z.string().min(1),
  fecha: FechaSchema.optional().default(() => new Date().toISOString()),
  distribuidorId: z.string().min(1),
  distribuidor: z.string().min(1),
  origen: z.string().optional(),
  producto: z.string().min(1),
  cantidad: CantidadSchema,
  costoDistribuidor: MontoSchema,
  costoTransporte: z.number().min(0).default(0),
  costoPorUnidad: MontoSchema,
  costoTotal: MontoSchema,
  stockActual: CantidadSchema.optional(),
  stockInicial: CantidadSchema.optional(),
  pagoDistribuidor: z.number().min(0).default(0),
  pagoInicial: z.number().min(0).default(0),
  deuda: z.number().min(0),
  bancoOrigen: BancoIdSchema.optional(),
  estado: EstadoOrdenSchema.default("pendiente"),
  notas: z.string().max(500).optional(),
  keywords: z.array(z.string()).default([]),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
})

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE PAGO A DISTRIBUIDOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Esquema para registrar un pago a distribuidor
 */
export const PagoDistribuidorSchema = z.object({
  distribuidorId: z.string().min(1, "El ID del distribuidor es requerido"),
  ordenCompraId: z.string().min(1, "El ID de la orden de compra es requerido"),
  monto: MontoSchema,
  bancoOrigenId: BancoIdSchema,
  fecha: FechaSchema.optional().default(() => new Date().toISOString()),
  notas: z.string().max(500).optional(),
})

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS INFERIDOS
// ═══════════════════════════════════════════════════════════════════════════

export type CrearOrdenCompraInput = z.infer<typeof CrearOrdenCompraSchema>
export type ActualizarOrdenCompraInput = z.infer<typeof ActualizarOrdenCompraSchema>
export type OrdenCompra = z.infer<typeof OrdenCompraSchema>
export type PagoDistribuidorInput = z.infer<typeof PagoDistribuidorSchema>
export type EstadoOrden = z.infer<typeof EstadoOrdenSchema>

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Valida datos de orden de compra y retorna errores formateados
 */
export function validarOrdenCompra(data: unknown): { 
  success: boolean
  data?: CrearOrdenCompraInput
  errors?: string[] 
} {
  const result = CrearOrdenCompraSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
  }
}

/**
 * Valida datos de pago a distribuidor
 */
export function validarPagoDistribuidor(data: unknown): {
  success: boolean
  data?: PagoDistribuidorInput
  errors?: string[]
} {
  const result = PagoDistribuidorSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
  }
}

/**
 * Genera keywords para búsqueda
 */
export function generarKeywordsOrdenCompra(
  id: string,
  distribuidor: string,
  producto: string,
  origen?: string
): string[] {
  const keywords: string[] = []
  
  // ID de la orden
  keywords.push(id.toLowerCase())
  
  // Distribuidor
  keywords.push(distribuidor.toLowerCase())
  distribuidor.split(' ').forEach(palabra => {
    if (palabra.length > 2) {
      keywords.push(palabra.toLowerCase())
    }
  })
  
  // Producto
  keywords.push(producto.toLowerCase())
  producto.split(' ').forEach(palabra => {
    if (palabra.length > 2) {
      keywords.push(palabra.toLowerCase())
    }
  })
  
  // Origen
  if (origen) {
    keywords.push(origen.toLowerCase())
  }
  
  return [...new Set(keywords)]
}
