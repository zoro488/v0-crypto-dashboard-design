/**
 * Esquemas de validación Zod para Clientes
 * @module schemas/clientes
 */

import { z } from 'zod'
import { 
  FirestoreTimestampSchema, 
  OptionalTimestampSchema, 
  HistorialPagoSchema, 
} from './timestamp.schema'

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE CLIENTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Esquema para crear un nuevo cliente
 */
export const CrearClienteSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  
  telefono: z.string()
    .regex(/^\+?[\d\s-()]+$/, 'Formato de teléfono inválido')
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  
  direccion: z.string()
    .max(200, 'La dirección no puede exceder 200 caracteres')
    .optional()
    .or(z.literal('')),
  
  observaciones: z.string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
})

/**
 * Esquema para actualizar un cliente existente
 */
export const ActualizarClienteSchema = CrearClienteSchema.partial()

/**
 * Esquema completo de un cliente (con ID y campos calculados)
 */
export const ClienteSchema = CrearClienteSchema.extend({
  id: z.string().min(1),
  
  // Campos financieros (calculados automáticamente)
  actual: z.number().default(0),
  deuda: z.number().default(0),
  abonos: z.number().default(0),
  pendiente: z.number().default(0),
  totalVentas: z.number().default(0),
  totalPagado: z.number().default(0),
  deudaTotal: z.number().default(0),
  
  // Métricas
  numeroCompras: z.number().int().nonnegative().default(0),
  ultimaCompra: OptionalTimestampSchema,
  
  // Referencias
  ventas: z.array(z.string()).default([]),
  historialPagos: z.array(HistorialPagoSchema).default([]),
  
  // Keywords para búsqueda (auto-generadas)
  keywords: z.array(z.string()).default([]),
  
  // Estado
  estado: z.enum(['activo', 'inactivo']).default('activo'),
  
  // Timestamps
  createdAt: OptionalTimestampSchema,
  updatedAt: OptionalTimestampSchema,
})

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS INFERIDOS
// ═══════════════════════════════════════════════════════════════════════════

export type CrearClienteInput = z.infer<typeof CrearClienteSchema>
export type ActualizarClienteInput = z.infer<typeof ActualizarClienteSchema>
export type Cliente = z.infer<typeof ClienteSchema>

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Valida datos de cliente y retorna errores formateados
 */
export function validarCliente(data: unknown): { 
  success: boolean
  data?: CrearClienteInput
  errors?: string[] 
} {
  const result = CrearClienteSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Valida actualización de cliente
 */
export function validarActualizacionCliente(data: unknown): {
  success: boolean
  data?: ActualizarClienteInput
  errors?: string[]
} {
  const result = ActualizarClienteSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Genera keywords para búsqueda
 */
export function generarKeywordsCliente(nombre: string, telefono?: string, email?: string): string[] {
  const keywords: string[] = []
  
  // Nombre completo
  keywords.push(nombre.toLowerCase())
  
  // Palabras individuales del nombre
  nombre.split(' ').forEach(palabra => {
    if (palabra.length > 2) {
      keywords.push(palabra.toLowerCase())
    }
  })
  
  // Teléfono sin espacios ni guiones
  if (telefono) {
    keywords.push(telefono.replace(/[\s-()]/g, ''))
  }
  
  // Email
  if (email) {
    keywords.push(email.toLowerCase())
  }
  
  return [...new Set(keywords)]
}
