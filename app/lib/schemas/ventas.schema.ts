/**
 * Esquemas de validación Zod para el Sistema CHRONOS
 * @module schemas/ventas
 * 
 * Estos esquemas garantizan la integridad de datos antes de
 * enviarlos a Firestore o procesarlos en el sistema.
 */

import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS BASE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Esquema para validar montos monetarios
 * - Debe ser un número positivo
 * - Máximo 2 decimales
 */
export const MontoSchema = z
  .number()
  .positive('El monto debe ser mayor a 0')
  .multipleOf(0.01, 'El monto no puede tener más de 2 decimales')

/**
 * Esquema para validar cantidades (unidades)
 * - Debe ser un entero positivo
 */
export const CantidadSchema = z
  .number()
  .int('La cantidad debe ser un número entero')
  .positive('La cantidad debe ser mayor a 0')

/**
 * Esquema para validar fechas ISO
 */
export const FechaSchema = z
  .string()
  .datetime({ message: 'Formato de fecha inválido. Use formato ISO 8601' })
  .or(z.date())

/**
 * IDs de bancos válidos en el sistema
 */
export const BancoIdSchema = z.enum([
  'boveda-monte',
  'boveda-usa', 
  'utilidades',
  'fletes',
  'azteca',
  'leftie',
  'profit',
], {
  errorMap: () => ({ message: 'Banco inválido' }),
})

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE VENTA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Estados posibles de pago de una venta
 */
export const EstadoPagoSchema = z.enum(['completo', 'parcial', 'pendiente'], {
  errorMap: () => ({ message: 'Estado de pago inválido' }),
})

/**
 * Distribución de bancos para una venta
 */
export const DistribucionBancosSchema = z.object({
  bovedaMonte: MontoSchema.or(z.literal(0)),
  fletes: MontoSchema.or(z.literal(0)),
  utilidades: MontoSchema.or(z.literal(0)),
})

/**
 * Esquema base para venta sin refines (para poder extenderlo)
 */
const VentaBaseSchema = z.object({
  fecha: FechaSchema,
  cliente: z.string().min(1, 'El nombre del cliente es requerido').max(100),
  producto: z.string().min(1, 'El nombre del producto es requerido').max(100),
  cantidad: CantidadSchema,
  precioVentaUnidad: MontoSchema,
  precioCompraUnidad: MontoSchema,
  precioFlete: z.number().min(0, 'El flete no puede ser negativo'),
  precioTotalVenta: MontoSchema,
  montoPagado: z.number().min(0, 'El monto pagado no puede ser negativo'),
  montoRestante: z.number().min(0, 'El monto restante no puede ser negativo'),
  estadoPago: EstadoPagoSchema,
  distribucionBancos: DistribucionBancosSchema,
})

/**
 * Esquema completo para crear una nueva venta (con validaciones)
 */
export const CrearVentaSchema = VentaBaseSchema
  .refine(
    (data) => data.precioVentaUnidad > data.precioCompraUnidad,
    {
      message: 'El precio de venta debe ser mayor al precio de compra',
      path: ['precioVentaUnidad'],
    },
  )
  .refine(
    (data) => data.montoPagado + data.montoRestante === data.precioTotalVenta,
    {
      message: 'La suma de monto pagado y monto restante debe igualar el precio total',
      path: ['montoPagado'],
    },
  )
  .refine(
    (data) => {
      const totalEsperado = data.cantidad * data.precioVentaUnidad
      return Math.abs(data.precioTotalVenta - totalEsperado) < 0.01
    },
    {
      message: 'El precio total no coincide con cantidad × precio por unidad',
      path: ['precioTotalVenta'],
    },
  )

/**
 * Esquema para una venta existente (incluye ID)
 */
export const VentaSchema = VentaBaseSchema.extend({
  id: z.string().min(1),
  clienteId: z.string().min(1),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
})

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE ABONO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Esquema para registrar un abono de cliente
 */
export const AbonoClienteSchema = z.object({
  clienteId: z.string().min(1, 'El ID del cliente es requerido'),
  monto: MontoSchema,
  fecha: FechaSchema.optional().default(() => new Date().toISOString()),
  notas: z.string().max(500).optional(),
})

/**
 * Esquema para registrar un pago a distribuidor
 */
export const PagoDistribuidorSchema = z.object({
  distribuidorId: z.string().min(1, 'El ID del distribuidor es requerido'),
  ordenCompraId: z.string().min(1, 'El ID de la orden de compra es requerido'),
  monto: MontoSchema,
  bancoOrigenId: z.string().min(1, 'El banco de origen es requerido'),
  fecha: FechaSchema.optional().default(() => new Date().toISOString()),
})

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE TRANSFERENCIA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Esquema para crear una transferencia entre bancos
 */
export const TransferenciaSchema = z
  .object({
    bancoOrigenId: z.string().min(1, 'El banco de origen es requerido'),
    bancoDestinoId: z.string().min(1, 'El banco de destino es requerido'),
    monto: MontoSchema,
    concepto: z.string().min(1, 'El concepto es requerido').max(200),
    fecha: FechaSchema.optional().default(() => new Date().toISOString()),
  })
  .refine(
    (data) => data.bancoOrigenId !== data.bancoDestinoId,
    {
      message: 'El banco de origen y destino no pueden ser el mismo',
      path: ['bancoDestinoId'],
    },
  )

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE ORDEN DE COMPRA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Estados posibles de una orden de compra
 */
export const EstadoOrdenSchema = z.enum(['pendiente', 'parcial', 'pagada'], {
  errorMap: () => ({ message: 'Estado de orden inválido' }),
})

/**
 * Esquema para crear una orden de compra
 */
export const CrearOrdenCompraSchema = z
  .object({
    fecha: FechaSchema,
    distribuidor: z.string().min(1, 'El distribuidor es requerido').max(100),
    origen: z.string().min(1, 'El origen es requerido').max(100),
    producto: z.string().min(1, 'El producto es requerido').max(100),
    cantidad: CantidadSchema,
    costoDistribuidor: MontoSchema,
    costoTransporte: z.number().min(0, 'El costo de transporte no puede ser negativo'),
    costoPorUnidad: MontoSchema,
    costoTotal: MontoSchema,
    pagoInicial: z.number().min(0, 'El pago inicial no puede ser negativo'),
    deuda: z.number().min(0, 'La deuda no puede ser negativa'),
    estado: EstadoOrdenSchema,
    bancoOrigen: z.string().optional(),
  })
  .refine(
    (data) => data.pagoInicial + data.deuda === data.costoTotal,
    {
      message: 'La suma de pago inicial y deuda debe igualar el costo total',
      path: ['deuda'],
    },
  )
  .refine(
    (data) => {
      if (data.pagoInicial > 0 && !data.bancoOrigen) {
        return false
      }
      return true
    },
    {
      message: 'Si hay pago inicial, debe especificar el banco de origen',
      path: ['bancoOrigen'],
    },
  )

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS INFERIDOS
// ═══════════════════════════════════════════════════════════════════════════

export type CrearVentaInput = z.infer<typeof CrearVentaSchema>
export type Venta = z.infer<typeof VentaSchema>
export type AbonoCliente = z.infer<typeof AbonoClienteSchema>
export type PagoDistribuidor = z.infer<typeof PagoDistribuidorSchema>
export type Transferencia = z.infer<typeof TransferenciaSchema>
export type CrearOrdenCompra = z.infer<typeof CrearOrdenCompraSchema>
export type EstadoPago = z.infer<typeof EstadoPagoSchema>
export type EstadoOrden = z.infer<typeof EstadoOrdenSchema>

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Valida datos de venta y retorna errores formateados
 */
export function validarVenta(data: unknown): { success: boolean; data?: CrearVentaInput; errors?: string[] } {
  const result = CrearVentaSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Valida datos de transferencia y retorna errores formateados
 */
export function validarTransferencia(data: unknown): { success: boolean; data?: Transferencia; errors?: string[] } {
  const result = TransferenciaSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Valida datos de abono y retorna errores formateados
 */
export function validarAbono(data: unknown): { success: boolean; data?: AbonoCliente; errors?: string[] } {
  const result = AbonoClienteSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE ACTUALIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Esquema para actualización parcial de venta
 */
export const ActualizarVentaSchema = z.object({
  estadoPago: EstadoPagoSchema.optional(),
  montoPagado: z.number().min(0, 'El monto pagado no puede ser negativo').optional(),
  montoRestante: z.number().min(0, 'El monto restante no puede ser negativo').optional(),
  distribucionBancos: DistribucionBancosSchema.optional(),
})

export type ActualizarVentaInput = z.infer<typeof ActualizarVentaSchema>

/**
 * Valida actualización parcial de venta
 */
export function validarActualizacionVenta(data: unknown): { 
  success: boolean
  data?: ActualizarVentaInput
  errors?: string[] 
} {
  const result = ActualizarVentaSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  }
}
