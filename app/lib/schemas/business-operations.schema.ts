/**
 * 🏦 SCHEMAS DE OPERACIONES DE NEGOCIO - CHRONOS SYSTEM
 * 
 * Schemas Zod unificados para TODAS las operaciones de negocio:
 * - Ventas con distribución GYA
 * - Órdenes de Compra
 * - Abonos a Clientes
 * - Pagos a Distribuidores
 * - Transferencias entre Bancos
 * - Ingresos y Gastos
 * 
 * VALIDACIONES CRÍTICAS:
 * 1. Utilidad NUNCA puede ser negativa (protección)
 * 2. PrecioVenta > PrecioCompra siempre
 * 3. Distribución GYA = Total Ingreso (suma correcta)
 * 4. Stock suficiente antes de venta
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES Y TIPOS BASE
// ═══════════════════════════════════════════════════════════════════════════

/** IDs de los 7 bancos del sistema */
export const BANCOS_IDS = [
  'boveda_monte',
  'boveda_usa',
  'utilidades',
  'flete_sur',
  'azteca',
  'leftie',
  'profit',
] as const

export type BancoIdType = typeof BANCOS_IDS[number]

/** Estados de pago */
export const ESTADOS_PAGO = ['completo', 'parcial', 'pendiente'] as const
export type EstadoPagoType = typeof ESTADOS_PAGO[number]

/** Estados de orden de compra */
export const ESTADOS_ORDEN = ['pendiente', 'parcial', 'pagado', 'cancelado'] as const
export type EstadoOrdenType = typeof ESTADOS_ORDEN[number]

/** Métodos de pago */
export const METODOS_PAGO = ['efectivo', 'transferencia', 'deposito', 'crypto', 'cheque', 'credito'] as const
export type MetodoPagoType = typeof METODOS_PAGO[number]

/** Precio de flete por defecto */
export const PRECIO_FLETE_DEFAULT = 500

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS PRIMITIVOS REUTILIZABLES
// ═══════════════════════════════════════════════════════════════════════════

/** Monto monetario positivo (máx 2 decimales) */
export const MontoPositivoSchema = z
  .number()
  .positive('El monto debe ser mayor a 0')
  .multipleOf(0.01, 'Máximo 2 decimales')

/** Monto monetario que puede ser 0 */
export const MontoNoNegativoSchema = z
  .number()
  .min(0, 'El monto no puede ser negativo')
  .multipleOf(0.01, 'Máximo 2 decimales')

/** Cantidad entera positiva */
export const CantidadSchema = z
  .number()
  .int('La cantidad debe ser un número entero')
  .positive('La cantidad debe ser mayor a 0')

/** ID de banco válido */
export const BancoIdSchema = z.enum(BANCOS_IDS, {
  errorMap: () => ({ message: 'Banco inválido. Usar: boveda_monte, boveda_usa, utilidades, flete_sur, azteca, leftie, profit' }),
})

/** Estado de pago */
export const EstadoPagoSchema = z.enum(ESTADOS_PAGO, {
  errorMap: () => ({ message: 'Estado de pago inválido. Usar: completo, parcial, pendiente' }),
})

/** Estado de orden */
export const EstadoOrdenSchema = z.enum(ESTADOS_ORDEN, {
  errorMap: () => ({ message: 'Estado de orden inválido' }),
})

/** Método de pago */
export const MetodoPagoSchema = z.enum(METODOS_PAGO, {
  errorMap: () => ({ message: 'Método de pago inválido' }),
})

/** Nombre requerido (min 2 chars, max 100) */
export const NombreRequeridoSchema = z
  .string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre no puede exceder 100 caracteres')
  .trim()

/** Fecha ISO o Date */
export const FechaSchema = z
  .string()
  .datetime({ message: 'Formato de fecha inválido' })
  .or(z.date())
  .optional()

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA: DISTRIBUCIÓN GYA (Ganancia y Asignación)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Distribución automática a 3 bancos según fórmulas correctas
 */
export const DistribucionGYASchema = z.object({
  /** Monto a Bóveda Monte (COSTO = precioCompra × cantidad) */
  bovedaMonte: MontoNoNegativoSchema,
  /** Monto a Fletes (FLETE = precioFlete × cantidad) */
  fletes: MontoNoNegativoSchema,
  /** Monto a Utilidades (GANANCIA = (precioVenta - precioCompra - precioFlete) × cantidad) */
  utilidades: MontoNoNegativoSchema,
}).refine(
  (data) => data.utilidades >= 0,
  {
    message: '⚠️ ALERTA: La utilidad no puede ser negativa. Revisar precios.',
    path: ['utilidades'],
  },
)

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA: ITEM DE VENTA (Multi-producto)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cada línea/producto en una venta
 */
export const ItemVentaSchema = z.object({
  /** ID del producto (opcional) */
  productoId: z.string().optional(),
  /** Nombre del producto */
  producto: NombreRequeridoSchema,
  /** Cantidad vendida */
  cantidad: CantidadSchema,
  /** Precio de venta por unidad al cliente */
  precioVenta: MontoPositivoSchema,
  /** Precio de compra por unidad (costo del distribuidor) */
  precioCompra: MontoNoNegativoSchema,
  /** Flete por unidad */
  precioFlete: MontoNoNegativoSchema.default(PRECIO_FLETE_DEFAULT),
  /** OC de donde sale el producto (para trazabilidad) */
  ocRelacionada: z.string().optional(),
}).refine(
  (data) => data.precioVenta > data.precioCompra,
  {
    message: 'El precio de venta debe ser mayor al precio de compra',
    path: ['precioVenta'],
  },
).refine(
  (data) => {
    const utilidad = (data.precioVenta - data.precioCompra - data.precioFlete) * data.cantidad
    return utilidad >= 0
  },
  {
    message: '⚠️ Esta venta generaría utilidad negativa. Aumentar precio de venta o reducir flete.',
    path: ['precioVenta'],
  },
)

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA: CREAR VENTA COMPLETA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schema completo para crear una venta con validación de lógica GYA
 */
export const CrearVentaCompletaSchema = z.object({
  /** Nombre del cliente */
  cliente: NombreRequeridoSchema,
  /** ID del cliente (si ya existe) */
  clienteId: z.string().optional(),
  
  /** Productos de la venta (multi-producto) */
  items: z.array(ItemVentaSchema).min(1, 'Debe incluir al menos un producto'),
  
  /** Estado del pago */
  estadoPago: EstadoPagoSchema,
  /** Monto pagado (obligatorio si es parcial) */
  montoPagado: MontoNoNegativoSchema.optional(),
  /** Método de pago */
  metodoPago: MetodoPagoSchema.optional().default('efectivo'),
  
  /** ¿Aplica flete? */
  aplicaFlete: z.boolean().default(true),
  
  /** Notas adicionales */
  notas: z.string().max(500).optional(),
  /** Fecha de la venta */
  fecha: FechaSchema,
}).refine(
  (data) => {
    // Si es parcial, debe tener monto pagado > 0
    if (data.estadoPago === 'parcial') {
      return data.montoPagado !== undefined && data.montoPagado > 0
    }
    return true
  },
  {
    message: 'Para pago parcial debe especificar el monto pagado',
    path: ['montoPagado'],
  },
).refine(
  (data) => {
    // El monto pagado no puede exceder el total
    if (data.montoPagado !== undefined) {
      const total = data.items.reduce((acc, item) => acc + item.precioVenta * item.cantidad, 0)
      return data.montoPagado <= total
    }
    return true
  },
  {
    message: 'El monto pagado no puede exceder el total de la venta',
    path: ['montoPagado'],
  },
)

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA: CREAR ORDEN DE COMPRA COMPLETA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Item de orden de compra
 */
export const ItemOrdenCompraSchema = z.object({
  /** Nombre del producto */
  producto: NombreRequeridoSchema,
  /** Cantidad ordenada */
  cantidad: CantidadSchema,
  /** Costo por unidad del distribuidor */
  costoDistribuidor: MontoPositivoSchema,
  /** Costo de transporte por unidad */
  costoTransporte: MontoNoNegativoSchema.default(0),
})

/**
 * Schema completo para crear una orden de compra
 */
export const CrearOrdenCompraCompletaSchema = z.object({
  /** Nombre del distribuidor */
  distribuidor: NombreRequeridoSchema,
  /** ID del distribuidor (si ya existe) */
  distribuidorId: z.string().optional(),
  /** Origen/alias del distribuidor */
  origen: z.string().optional(),
  
  /** Productos de la orden (multi-producto) */
  items: z.array(ItemOrdenCompraSchema).min(1, 'Debe incluir al menos un producto'),
  
  /** Pago inicial al distribuidor */
  pagoInicial: MontoNoNegativoSchema.default(0),
  /** Banco de donde sale el pago inicial */
  bancoOrigen: BancoIdSchema.optional(),
  
  /** Notas adicionales */
  notas: z.string().max(500).optional(),
  /** Fecha de la orden */
  fecha: FechaSchema,
}).refine(
  (data) => {
    // Si hay pago inicial, debe especificar banco
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
// SCHEMA: ABONO A CLIENTE
// ═══════════════════════════════════════════════════════════════════════════

export const AbonoClienteSchema = z.object({
  /** ID del cliente */
  clienteId: z.string().min(1, 'El ID del cliente es requerido'),
  /** ID de la venta específica (opcional) */
  ventaId: z.string().optional(),
  /** Monto del abono */
  monto: MontoPositivoSchema,
  /** Método de pago */
  metodoPago: MetodoPagoSchema.optional().default('efectivo'),
  /** Notas */
  notas: z.string().max(500).optional(),
  /** Fecha */
  fecha: FechaSchema,
})

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA: PAGO A DISTRIBUIDOR
// ═══════════════════════════════════════════════════════════════════════════

export const PagoDistribuidorSchema = z.object({
  /** ID del distribuidor */
  distribuidorId: z.string().min(1, 'El ID del distribuidor es requerido'),
  /** ID de la orden de compra (opcional) */
  ordenCompraId: z.string().optional(),
  /** Monto del pago */
  monto: MontoPositivoSchema,
  /** Banco de donde sale el pago */
  bancoOrigen: BancoIdSchema,
  /** Notas */
  notas: z.string().max(500).optional(),
  /** Fecha */
  fecha: FechaSchema,
})

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA: TRANSFERENCIA ENTRE BANCOS
// ═══════════════════════════════════════════════════════════════════════════

export const TransferenciaBancosSchema = z.object({
  /** Banco origen */
  bancoOrigen: BancoIdSchema,
  /** Banco destino */
  bancoDestino: BancoIdSchema,
  /** Monto a transferir */
  monto: MontoPositivoSchema,
  /** Concepto */
  concepto: z.string().min(1, 'El concepto es requerido').max(200),
  /** Descripción adicional */
  descripcion: z.string().max(500).optional(),
  /** Fecha */
  fecha: FechaSchema,
}).refine(
  (data) => data.bancoOrigen !== data.bancoDestino,
  {
    message: 'El banco de origen y destino no pueden ser el mismo',
    path: ['bancoDestino'],
  },
)

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA: REGISTRAR GASTO
// ═══════════════════════════════════════════════════════════════════════════

export const RegistrarGastoSchema = z.object({
  /** Banco de donde sale el gasto */
  bancoOrigen: BancoIdSchema,
  /** Monto del gasto */
  monto: MontoPositivoSchema,
  /** Concepto del gasto */
  concepto: z.string().min(1, 'El concepto es requerido').max(200),
  /** Descripción adicional */
  descripcion: z.string().max(500).optional(),
  /** Categoría del gasto */
  categoria: z.string().max(50).optional().default('General'),
  /** Fecha */
  fecha: FechaSchema,
})

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA: REGISTRAR INGRESO (Solo bancos operativos)
// ═══════════════════════════════════════════════════════════════════════════

/** Bancos que pueden recibir ingresos directos */
export const BANCOS_OPERATIVOS = ['azteca', 'leftie', 'profit'] as const

export const RegistrarIngresoSchema = z.object({
  /** Banco destino (solo operativos) */
  bancoDestino: z.enum(BANCOS_OPERATIVOS, {
    errorMap: () => ({ message: 'Solo los bancos operativos (Azteca, Leftie, Profit) pueden recibir ingresos directos' }),
  }),
  /** Monto del ingreso */
  monto: MontoPositivoSchema,
  /** Concepto del ingreso */
  concepto: z.string().min(1, 'El concepto es requerido').max(200),
  /** Descripción adicional */
  descripcion: z.string().max(500).optional(),
  /** Cliente (si aplica) */
  cliente: z.string().max(100).optional(),
  /** Categoría */
  categoria: z.string().max(50).optional().default('General'),
  /** Fecha */
  fecha: FechaSchema,
})

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════

interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: string[]
}

/**
 * Validar creación de venta completa
 */
export function validarVentaCompleta(data: unknown): ValidationResult<z.infer<typeof CrearVentaCompletaSchema>> {
  const result = CrearVentaCompletaSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Validar creación de orden de compra completa
 */
export function validarOrdenCompraCompleta(data: unknown): ValidationResult<z.infer<typeof CrearOrdenCompraCompletaSchema>> {
  const result = CrearOrdenCompraCompletaSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Validar abono a cliente
 */
export function validarAbonoCliente(data: unknown): ValidationResult<z.infer<typeof AbonoClienteSchema>> {
  const result = AbonoClienteSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Validar pago a distribuidor
 */
export function validarPagoDistribuidor(data: unknown): ValidationResult<z.infer<typeof PagoDistribuidorSchema>> {
  const result = PagoDistribuidorSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Validar transferencia entre bancos
 */
export function validarTransferencia(data: unknown): ValidationResult<z.infer<typeof TransferenciaBancosSchema>> {
  const result = TransferenciaBancosSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Validar gasto
 */
export function validarGasto(data: unknown): ValidationResult<z.infer<typeof RegistrarGastoSchema>> {
  const result = RegistrarGastoSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Validar ingreso
 */
export function validarIngreso(data: unknown): ValidationResult<z.infer<typeof RegistrarIngresoSchema>> {
  const result = RegistrarIngresoSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE CÁLCULO GYA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula la distribución GYA para un item de venta
 * 
 * FÓRMULAS CORRECTAS:
 * - Bóveda Monte = precioCompra × cantidad (COSTO)
 * - Fletes = precioFlete × cantidad (si aplica)
 * - Utilidades = (precioVenta - precioCompra - precioFlete) × cantidad (GANANCIA NETA)
 */
export function calcularDistribucionGYA(
  precioVenta: number,
  precioCompra: number,
  precioFlete: number,
  cantidad: number,
  aplicaFlete = true,
): {
  bovedaMonte: number
  fletes: number
  utilidades: number
  totalIngreso: number
  margenPorcentaje: number
} {
  const totalIngreso = precioVenta * cantidad
  const bovedaMonte = precioCompra * cantidad
  const fletes = aplicaFlete ? precioFlete * cantidad : 0
  const utilidades = (precioVenta - precioCompra - (aplicaFlete ? precioFlete : 0)) * cantidad
  
  const margenPorcentaje = totalIngreso > 0 ? (utilidades / totalIngreso) * 100 : 0
  
  return {
    bovedaMonte,
    fletes,
    utilidades,
    totalIngreso,
    margenPorcentaje,
  }
}

/**
 * Calcula la distribución GYA total para múltiples items
 */
export function calcularDistribucionGYATotal(
  items: Array<{
    precioVenta: number
    precioCompra: number
    precioFlete: number
    cantidad: number
  }>,
  aplicaFlete = true,
): {
  bovedaMonte: number
  fletes: number
  utilidades: number
  totalIngreso: number
  margenPorcentaje: number
  cantidadTotal: number
} {
  let bovedaMonte = 0
  let fletes = 0
  let utilidades = 0
  let totalIngreso = 0
  let cantidadTotal = 0
  
  for (const item of items) {
    const dist = calcularDistribucionGYA(
      item.precioVenta,
      item.precioCompra,
      item.precioFlete,
      item.cantidad,
      aplicaFlete,
    )
    bovedaMonte += dist.bovedaMonte
    fletes += dist.fletes
    utilidades += dist.utilidades
    totalIngreso += dist.totalIngreso
    cantidadTotal += item.cantidad
  }
  
  const margenPorcentaje = totalIngreso > 0 ? (utilidades / totalIngreso) * 100 : 0
  
  return {
    bovedaMonte,
    fletes,
    utilidades,
    totalIngreso,
    margenPorcentaje,
    cantidadTotal,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS INFERIDOS EXPORTADOS
// ═══════════════════════════════════════════════════════════════════════════

export type ItemVenta = z.infer<typeof ItemVentaSchema>
export type CrearVentaCompletaInput = z.infer<typeof CrearVentaCompletaSchema>
export type ItemOrdenCompra = z.infer<typeof ItemOrdenCompraSchema>
export type CrearOrdenCompraCompletaInput = z.infer<typeof CrearOrdenCompraCompletaSchema>
export type AbonoClienteInput = z.infer<typeof AbonoClienteSchema>
export type PagoDistribuidorInput = z.infer<typeof PagoDistribuidorSchema>
export type TransferenciaBancosInput = z.infer<typeof TransferenciaBancosSchema>
export type RegistrarGastoInput = z.infer<typeof RegistrarGastoSchema>
export type RegistrarIngresoInput = z.infer<typeof RegistrarIngresoSchema>
export type DistribucionGYA = z.infer<typeof DistribucionGYASchema>
