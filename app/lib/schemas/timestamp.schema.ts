/**
 * 🕐 TIMESTAMP SCHEMA - CHRONOS SYSTEM
 * 
 * Schema Zod para validación de timestamps de Firestore.
 * Reemplaza el uso de z.any() para timestamps.
 * 
 * @module lib/schemas/timestamp
 */

import { z } from 'zod'
import { Timestamp } from 'firebase/firestore'

/**
 * Schema para validar timestamps de Firestore
 * Acepta: Timestamp de Firestore, Date de JS, o string ISO
 */
export const FirestoreTimestampSchema = z.union([
  // Timestamp de Firestore
  z.custom<Timestamp>(
    (val) => val instanceof Timestamp,
    { message: 'Debe ser un Timestamp de Firestore' },
  ),
  // Date de JavaScript
  z.date(),
  // String ISO 8601
  z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Debe ser una fecha válida en formato ISO' },
  ),
])

/**
 * Schema para timestamps opcionales (común en createdAt/updatedAt)
 */
export const OptionalTimestampSchema = FirestoreTimestampSchema.optional()

/**
 * Schema para fechas que pueden venir como string o Date
 */
export const FlexibleDateSchema = z.union([
  z.date(),
  z.string().transform((val) => new Date(val)),
])

/**
 * Schema para historial de pagos con timestamp tipado
 */
export const HistorialPagoSchema = z.object({
  fecha: FirestoreTimestampSchema,
  monto: z.number().positive('El monto debe ser positivo'),
  bancoOrigen: z.string().optional(),
  ordenCompraId: z.string().optional(),
  ventaId: z.string().optional(),
})

export type HistorialPago = z.infer<typeof HistorialPagoSchema>

/**
 * Helper para convertir cualquier timestamp a Date
 */
export function toDate(timestamp: z.infer<typeof FirestoreTimestampSchema>): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  if (timestamp instanceof Date) {
    return timestamp
  }
  return new Date(timestamp)
}

/**
 * Helper para formatear timestamp a string ISO
 */
export function toISOString(timestamp: z.infer<typeof FirestoreTimestampSchema>): string {
  return toDate(timestamp).toISOString()
}
