/**
 * Esquemas de validación Zod para Distribuidores
 * @module schemas/distribuidores
 */

import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE DISTRIBUIDOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Esquema para crear un nuevo distribuidor
 */
export const CrearDistribuidorSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  
  empresa: z.string()
    .max(100, 'El nombre de empresa no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  contacto: z.string()
    .max(100, 'El nombre de contacto no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  
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
})

/**
 * Esquema para actualizar un distribuidor existente
 */
export const ActualizarDistribuidorSchema = CrearDistribuidorSchema.partial()

/**
 * Esquema completo de un distribuidor (con ID y campos calculados)
 */
export const DistribuidorSchema = CrearDistribuidorSchema.extend({
  id: z.string().min(1),
  
  // Campos financieros (calculados automáticamente)
  costoTotal: z.number().default(0),
  abonos: z.number().default(0),
  pendiente: z.number().default(0),
  totalOrdenesCompra: z.number().default(0),
  totalPagado: z.number().default(0),
  deudaTotal: z.number().default(0),
  
  // Métricas
  numeroOrdenes: z.number().int().nonnegative().default(0),
  ultimaOrden: z.any().optional(),
  
  // Referencias
  ordenesCompra: z.array(z.string()).default([]),
  historialPagos: z.array(z.object({
    fecha: z.any(),
    monto: z.number(),
    bancoOrigen: z.string().optional(),
    ordenCompraId: z.string().optional(),
  })).default([]),
  
  // Keywords para búsqueda (auto-generadas)
  keywords: z.array(z.string()).default([]),
  
  // Estado
  estado: z.enum(['activo', 'inactivo', 'suspendido']).default('activo'),
  
  // Timestamps
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
})

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS INFERIDOS
// ═══════════════════════════════════════════════════════════════════════════

export type CrearDistribuidorInput = z.infer<typeof CrearDistribuidorSchema>
export type ActualizarDistribuidorInput = z.infer<typeof ActualizarDistribuidorSchema>
export type Distribuidor = z.infer<typeof DistribuidorSchema>

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Valida datos de distribuidor y retorna errores formateados
 */
export function validarDistribuidor(data: unknown): { 
  success: boolean
  data?: CrearDistribuidorInput
  errors?: string[] 
} {
  const result = CrearDistribuidorSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  }
}

/**
 * Valida actualización de distribuidor
 */
export function validarActualizacionDistribuidor(data: unknown): {
  success: boolean
  data?: ActualizarDistribuidorInput
  errors?: string[]
} {
  const result = ActualizarDistribuidorSchema.safeParse(data)
  
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
export function generarKeywordsDistribuidor(
  nombre: string,
  empresa?: string,
  contacto?: string,
  telefono?: string,
  email?: string,
): string[] {
  const keywords: string[] = []
  
  // Nombre completo
  keywords.push(nombre.toLowerCase())
  
  // Palabras individuales del nombre
  nombre.split(' ').forEach(palabra => {
    if (palabra.length > 2) {
      keywords.push(palabra.toLowerCase())
    }
  })
  
  // Empresa
  if (empresa) {
    keywords.push(empresa.toLowerCase())
    empresa.split(' ').forEach(palabra => {
      if (palabra.length > 2) {
        keywords.push(palabra.toLowerCase())
      }
    })
  }
  
  // Contacto
  if (contacto) {
    keywords.push(contacto.toLowerCase())
  }
  
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
