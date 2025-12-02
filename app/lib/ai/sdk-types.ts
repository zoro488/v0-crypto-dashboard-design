/**
 * 🔧 AI SDK TYPE WRAPPERS - CHRONOS SYSTEM
 * 
 * Wrappers de tipos para Vercel AI SDK 5.x
 * Resuelve incompatibilidades de tipos sin usar @ts-expect-error
 * 
 * @module lib/ai/sdk-types
 */

import type { z } from 'zod'

/**
 * Tipo genérico para parámetros de herramientas AI
 * Compatible con Vercel AI SDK 5.x
 */
export type ToolParams<T extends z.ZodTypeAny> = z.infer<T>

/**
 * Tipo para el resultado de ejecución de herramientas
 */
export type ToolResult<T = unknown> = T | { error: string }

/**
 * Wrapper para crear ejecutores de herramientas con tipos correctos
 * Evita el uso de @ts-expect-error en cada herramienta
 * 
 * @example
 * execute: createToolExecutor(async (params) => {
 *   // params está correctamente tipado
 *   return { data: params.value }
 * })
 */
export function createToolExecutor<TParams, TResult>(
  fn: (params: TParams) => Promise<TResult>,
): (params: TParams) => Promise<TResult> {
  return fn
}

/**
 * Tipo para herramientas de consulta (solo lectura)
 */
export interface QueryToolConfig<TParams extends z.ZodTypeAny, TResult> {
  description: string
  parameters: TParams
  execute: (params: z.infer<TParams>) => Promise<TResult>
}

/**
 * Tipo para herramientas de mutación (escritura)
 */
export interface MutationToolConfig<TParams extends z.ZodTypeAny, TResult> {
  description: string
  parameters: TParams
  execute: (params: z.infer<TParams>) => Promise<TResult>
  confirmRequired?: boolean
}

/**
 * Helper para manejar errores en herramientas de forma consistente
 */
export function handleToolError(error: unknown, toolName: string): { error: string } {
  const message = error instanceof Error ? error.message : 'Error desconocido'
  return { error: `Error en ${toolName}: ${message}` }
}

/**
 * Tipos de respuesta comunes para herramientas
 */
export interface VentasToolResult {
  ventas: unknown[]
  estadisticas: {
    count: number
    total: number
    promedio: number
  }
}

export interface ClientesToolResult {
  clientes: unknown[]
  count: number
}

export interface BancosToolResult {
  bancos: unknown[]
  totalCapital: number
  count: number
}

export interface OrdenesToolResult {
  ordenes: unknown[]
  estadisticas: {
    count: number
    deudaTotal: number
    pagadoTotal: number
  }
}

export interface CreateRecordResult {
  success: boolean
  id?: string
  message: string
}
