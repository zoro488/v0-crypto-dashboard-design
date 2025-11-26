/**
 * 📋 SMART FORMS SCHEMAS - Validación con Zod
 * 
 * Schemas de validación para todos los formularios del sistema.
 * Incluye:
 * - Validaciones de tipos
 * - Mensajes de error en español
 * - Transforms para normalización
 * - Validaciones personalizadas
 */

import { z } from "zod"

// ============================================
// CONSTANTES
// ============================================

export const BANCO_IDS = [
  "boveda_monte",
  "boveda_usa",
  "profit",
  "leftie",
  "azteca",
  "flete_sur",
  "utilidades",
] as const

export const MONEDAS = ["MXN", "USD", "COP"] as const
export const METODOS_PAGO = ["efectivo", "transferencia", "deposito", "mixto"] as const
export const ESTADOS_VENTA = ["pendiente", "parcial", "pagado", "cancelado"] as const
export const ESTADOS_ORDEN = ["pendiente", "parcial", "pagado", "cancelado", "completada"] as const
export const ESTADOS_CLIENTE = ["activo", "inactivo", "vip", "moroso"] as const

// ============================================
// SCHEMAS BASE
// ============================================

/**
 * Schema base para teléfono mexicano
 */
export const telefonoSchema = z
  .string()
  .min(10, "El teléfono debe tener al menos 10 dígitos")
  .max(15, "El teléfono no puede tener más de 15 caracteres")
  .regex(/^[\d\s\-\+\(\)]+$/, "Formato de teléfono inválido")
  .transform((val) => val.replace(/[\s\-\(\)]/g, ""))
  .optional()

/**
 * Schema para email
 */
export const emailSchema = z
  .string()
  .email("Email inválido")
  .max(100, "El email es demasiado largo")
  .toLowerCase()
  .optional()

/**
 * Schema para montos monetarios
 */
export const montoSchema = z
  .number({ required_error: "El monto es requerido" })
  .min(0, "El monto no puede ser negativo")
  .max(999999999, "El monto es demasiado grande")

/**
 * Schema para cantidades enteras positivas
 */
export const cantidadSchema = z
  .number({ required_error: "La cantidad es requerida" })
  .int("La cantidad debe ser un número entero")
  .min(1, "La cantidad mínima es 1")
  .max(99999, "La cantidad es demasiado grande")

/**
 * Schema para porcentajes
 */
export const porcentajeSchema = z
  .number()
  .min(0, "El porcentaje no puede ser negativo")
  .max(100, "El porcentaje máximo es 100")

// ============================================
// SCHEMA: CLIENTE
// ============================================

export const clienteSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre es requerido" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo")
    .transform((val) => val.trim()),
  
  telefono: telefonoSchema,
  
  email: emailSchema,
  
  direccion: z
    .string()
    .max(200, "La dirección es demasiado larga")
    .optional(),
  
  notas: z
    .string()
    .max(500, "Las notas son demasiado largas")
    .optional(),
  
  estado: z.enum(ESTADOS_CLIENTE).default("activo"),
})

export type ClienteInput = z.infer<typeof clienteSchema>

// ============================================
// SCHEMA: DISTRIBUIDOR
// ============================================

export const distribuidorSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre es requerido" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo")
    .transform((val) => val.trim()),
  
  empresa: z
    .string()
    .max(100, "El nombre de empresa es demasiado largo")
    .optional(),
  
  contacto: z
    .string()
    .max(100, "El nombre de contacto es demasiado largo")
    .optional(),
  
  telefono: telefonoSchema,
  
  email: emailSchema,
  
  direccion: z
    .string()
    .max(200, "La dirección es demasiado larga")
    .optional(),
  
  notas: z
    .string()
    .max(500, "Las notas son demasiado largas")
    .optional(),
  
  estado: z.enum(["activo", "inactivo"]).default("activo"),
})

export type DistribuidorInput = z.infer<typeof distribuidorSchema>

// ============================================
// SCHEMA: PRODUCTO
// ============================================

export const productoSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre es requerido" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(150, "El nombre es demasiado largo")
    .transform((val) => val.trim()),
  
  sku: z
    .string()
    .max(50, "El SKU es demasiado largo")
    .transform((val) => val?.toUpperCase())
    .optional(),
  
  descripcion: z
    .string()
    .max(500, "La descripción es demasiado larga")
    .optional(),
  
  categoria: z
    .string()
    .max(50, "La categoría es demasiado larga")
    .optional(),
  
  precioCompra: montoSchema.default(0),
  
  precioVenta: z
    .number({ required_error: "El precio de venta es requerido" })
    .min(0.01, "El precio de venta debe ser mayor a 0"),
  
  stockActual: z
    .number()
    .int("El stock debe ser un número entero")
    .min(0, "El stock no puede ser negativo")
    .default(0),
  
  stockMinimo: z
    .number()
    .int("El stock mínimo debe ser un número entero")
    .min(0, "El stock mínimo no puede ser negativo")
    .default(5),
  
  unidad: z
    .string()
    .max(20, "La unidad es demasiado larga")
    .default("pz"),
  
  activo: z.boolean().default(true),
})

export type ProductoInput = z.infer<typeof productoSchema>

// ============================================
// SCHEMA: ORDEN DE COMPRA (OC)
// ============================================

/**
 * Item dentro de una Orden de Compra
 */
export const ordenCompraItemSchema = z.object({
  productoId: z.string().min(1, "Selecciona un producto"),
  productoNombre: z.string(),
  cantidad: cantidadSchema,
  precioUnitario: montoSchema,
  subtotal: montoSchema,
})

export type OrdenCompraItemInput = z.infer<typeof ordenCompraItemSchema>

/**
 * Distribución de costos entre bancos
 */
export const distribucionBancosSchema = z.object({
  boveda_monte: montoSchema.default(0),
  boveda_usa: montoSchema.default(0),
  profit: montoSchema.default(0),
  leftie: montoSchema.default(0),
  azteca: montoSchema.default(0),
  flete_sur: montoSchema.default(0),
  utilidades: montoSchema.default(0),
})

export type DistribucionBancosInput = z.infer<typeof distribucionBancosSchema>

/**
 * Orden de Compra completa
 */
export const ordenCompraSchema = z.object({
  distribuidorId: z.string({ required_error: "Selecciona un distribuidor" }).min(1, "Selecciona un distribuidor"),
  distribuidorNombre: z.string(),
  
  items: z
    .array(ordenCompraItemSchema)
    .min(1, "Agrega al menos un producto")
    .max(50, "Máximo 50 productos por orden"),
  
  costoTotal: montoSchema,
  costoEnvio: montoSchema.default(0),
  otrosCostos: montoSchema.default(0),
  
  moneda: z.enum(MONEDAS).default("MXN"),
  tipoCambio: z.number().min(0).default(1),
  
  distribucionBancos: distribucionBancosSchema.optional(),
  
  fechaEstimadaEntrega: z.date().optional(),
  
  notas: z
    .string()
    .max(500, "Las notas son demasiado largas")
    .optional(),
  
  estado: z.enum(ESTADOS_ORDEN).default("pendiente"),
})

export type OrdenCompraInput = z.infer<typeof ordenCompraSchema>

// ============================================
// SCHEMA: VENTA
// ============================================

/**
 * Item de venta (producto/OC vendido)
 */
export const ventaItemSchema = z.object({
  // Puede ser producto o referencia a OC
  tipo: z.enum(["producto", "ordenCompra"]),
  referenciaId: z.string().min(1, "Selecciona un producto u orden"),
  referenciaNombre: z.string(),
  cantidad: cantidadSchema,
  precioUnitario: montoSchema,
  subtotal: montoSchema,
})

export type VentaItemInput = z.infer<typeof ventaItemSchema>

/**
 * Venta completa
 */
export const ventaSchema = z.object({
  clienteId: z.string({ required_error: "Selecciona un cliente" }).min(1, "Selecciona un cliente"),
  clienteNombre: z.string(),
  
  // Snapshot inmutable del cliente al momento de la venta
  clienteSnapshot: z.object({
    nombre: z.string(),
    telefono: z.string().optional(),
    email: z.string().optional(),
  }).optional(),
  
  items: z
    .array(ventaItemSchema)
    .min(1, "Agrega al menos un producto")
    .max(50, "Máximo 50 productos por venta"),
  
  subtotal: montoSchema,
  descuento: montoSchema.default(0),
  impuestos: montoSchema.default(0),
  total: montoSchema,
  
  moneda: z.enum(MONEDAS).default("MXN"),
  tipoCambio: z.number().min(0).default(1),
  
  metodoPago: z.enum(METODOS_PAGO).default("efectivo"),
  
  montoPagado: montoSchema.default(0),
  saldoPendiente: montoSchema.default(0),
  
  // Distribución automática
  distribucionBancos: distribucionBancosSchema.optional(),
  
  notas: z
    .string()
    .max(500, "Las notas son demasiado largas")
    .optional(),
  
  estado: z.enum(ESTADOS_VENTA).default("pendiente"),
})

export type VentaInput = z.infer<typeof ventaSchema>

// ============================================
// SCHEMA: ABONO / PAGO
// ============================================

export const abonoSchema = z.object({
  // Puede ser abono a cliente (venta) o a distribuidor (OC)
  tipo: z.enum(["cliente", "distribuidor"]),
  
  // ID de la entidad (clienteId o distribuidorId)
  entidadId: z.string({ required_error: "Selecciona la entidad" }).min(1),
  entidadNombre: z.string(),
  
  // ID de la venta o OC asociada (opcional, puede ser pago a cuenta)
  referenciaId: z.string().optional(),
  referenciaTipo: z.enum(["venta", "ordenCompra"]).optional(),
  
  monto: z
    .number({ required_error: "El monto es requerido" })
    .min(0.01, "El monto debe ser mayor a 0"),
  
  moneda: z.enum(MONEDAS).default("MXN"),
  tipoCambio: z.number().min(0).default(1),
  
  metodoPago: z.enum(METODOS_PAGO).default("efectivo"),
  
  // Banco destino del pago
  bancoId: z.enum(BANCO_IDS),
  
  // Distribución si es mixto o requiere split
  distribucionBancos: distribucionBancosSchema.optional(),
  
  comprobante: z
    .string()
    .max(100, "El número de comprobante es demasiado largo")
    .optional(),
  
  notas: z
    .string()
    .max(300, "Las notas son demasiado largas")
    .optional(),
})

export type AbonoInput = z.infer<typeof abonoSchema>

// ============================================
// SCHEMA: MOVIMIENTO BANCARIO
// ============================================

export const movimientoSchema = z.object({
  tipo: z.enum(["ingreso", "egreso", "transferencia"]),
  
  bancoOrigenId: z.enum(BANCO_IDS),
  bancoDestinoId: z.enum(BANCO_IDS).optional(), // Solo para transferencias
  
  monto: z
    .number({ required_error: "El monto es requerido" })
    .min(0.01, "El monto debe ser mayor a 0"),
  
  moneda: z.enum(MONEDAS).default("MXN"),
  
  categoria: z.enum([
    "venta",
    "compra",
    "abono_cliente",
    "pago_proveedor",
    "gasto_operativo",
    "transferencia_interna",
    "ajuste",
    "otro",
  ]),
  
  // Referencia opcional a documento origen
  referenciaId: z.string().optional(),
  referenciaTipo: z.enum(["venta", "ordenCompra", "abono"]).optional(),
  
  concepto: z
    .string({ required_error: "El concepto es requerido" })
    .min(3, "El concepto debe tener al menos 3 caracteres")
    .max(200, "El concepto es demasiado largo"),
  
  notas: z
    .string()
    .max(300, "Las notas son demasiado largas")
    .optional(),
})

export type MovimientoInput = z.infer<typeof movimientoSchema>

// ============================================
// SCHEMA: MOVIMIENTO DE ALMACÉN
// ============================================

export const movimientoAlmacenSchema = z.object({
  tipo: z.enum(["entrada", "salida", "ajuste"]),
  
  productoId: z.string({ required_error: "Selecciona un producto" }).min(1),
  productoNombre: z.string(),
  
  cantidad: z.number({ required_error: "La cantidad es requerida" }).int().min(1),
  
  // Referencia opcional
  referenciaId: z.string().optional(),
  referenciaTipo: z.enum(["ordenCompra", "venta"]).optional(),
  
  motivo: z
    .string({ required_error: "El motivo es requerido" })
    .min(3, "El motivo debe tener al menos 3 caracteres")
    .max(200, "El motivo es demasiado largo"),
  
  notas: z
    .string()
    .max(300, "Las notas son demasiado largas")
    .optional(),
})

export type MovimientoAlmacenInput = z.infer<typeof movimientoAlmacenSchema>

// ============================================
// HELPERS DE VALIDACIÓN
// ============================================

/**
 * Valida que la distribución de bancos sume el total correcto
 */
export function validarDistribucionBancos(
  distribucion: DistribucionBancosInput,
  totalEsperado: number,
  tolerancia = 0.01
): boolean {
  const suma = Object.values(distribucion).reduce((acc, val) => acc + (val || 0), 0)
  return Math.abs(suma - totalEsperado) <= tolerancia
}

/**
 * Calcula el total de items
 */
export function calcularTotalItems<T extends { subtotal: number }>(items: T[]): number {
  return items.reduce((acc, item) => acc + item.subtotal, 0)
}

/**
 * Genera keywords para búsqueda desde un nombre
 */
export function generarKeywords(texto: string): string[] {
  if (!texto) return []
  
  const palabras = texto.toLowerCase().trim().split(/\s+/)
  const keywords: string[] = []
  
  palabras.forEach(palabra => {
    // Palabra completa
    keywords.push(palabra)
    // Prefijos para búsqueda parcial
    for (let i = 1; i <= palabra.length; i++) {
      keywords.push(palabra.substring(0, i))
    }
  })
  
  return [...new Set(keywords)]
}

/**
 * Formatea un monto a string legible
 */
export function formatearMonto(monto: number, moneda: string = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto)
}

export default {
  clienteSchema,
  distribuidorSchema,
  productoSchema,
  ordenCompraSchema,
  ventaSchema,
  abonoSchema,
  movimientoSchema,
  movimientoAlmacenSchema,
  validarDistribucionBancos,
  calcularTotalItems,
  generarKeywords,
  formatearMonto,
}
