/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                 RESULT PATTERN - MANEJO DE ERRORES                        ║
 * ║                         CHRONOS SYSTEM v2.1                                ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * Implementación del patrón Result<T, E> para manejo consistente de errores
 * en toda la aplicación. Evita try/catch dispersos y proporciona un flujo
 * de datos predecible.
 * 
 * @example
 * ```typescript
 * // En un servicio
 * async function crearVenta(data: VentaInput): Promise<Result<Venta, AppError>> {
 *   const validation = validarVenta(data)
 *   if (!validation.success) {
 *     return Result.fail(new ValidationError(validation.errors))
 *   }
 *   
 *   try {
 *     const venta = await firestoreService.crearVenta(data)
 *     return Result.ok(venta)
 *   } catch (error) {
 *     return Result.fail(new DatabaseError('Error al crear venta', error))
 *   }
 * }
 * 
 * // En un componente
 * const result = await crearVenta(formData)
 * if (result.isOk()) {
 *   toast.success('Venta creada')
 *   navigate(`/ventas/${result.value.id}`)
 * } else {
 *   toast.error(result.error.message)
 * }
 * ```
 * 
 * @module utils/result
 * @version 2.1.0
 */

import { logger } from './logger'

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS DE ERROR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Códigos de error del sistema
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_STOCK'
  | 'DUPLICATE_ENTRY'
  | 'BUSINESS_RULE_VIOLATION'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR'

/**
 * Error base del sistema CHRONOS
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly timestamp: Date
  public readonly context?: Record<string, unknown>
  public readonly originalError?: Error

  constructor(
    code: ErrorCode,
    message: string,
    context?: Record<string, unknown>,
    originalError?: Error,
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.timestamp = new Date()
    this.context = context
    this.originalError = originalError

    // Mantener stack trace correcto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  /**
   * Convierte el error a un objeto plano para logging/serialización
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    }
  }
}

/**
 * Error de validación de datos
 */
export class ValidationError extends AppError {
  public readonly errors: string[]

  constructor(errors: string[], context?: Record<string, unknown>) {
    super(
      'VALIDATION_ERROR',
      `Datos inválidos: ${errors.join(', ')}`,
      { ...context, errors },
    )
    this.name = 'ValidationError'
    this.errors = errors
  }
}

/**
 * Error de base de datos / Firestore
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error, context?: Record<string, unknown>) {
    super('DATABASE_ERROR', message, context, originalError)
    this.name = 'DatabaseError'
  }
}

/**
 * Error de recurso no encontrado
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      'NOT_FOUND',
      id ? `${resource} con ID "${id}" no encontrado` : `${resource} no encontrado`,
      { resource, id },
    )
    this.name = 'NotFoundError'
  }
}

/**
 * Error de stock insuficiente
 */
export class InsufficientStockError extends AppError {
  constructor(
    productoId: string,
    stockDisponible: number,
    cantidadSolicitada: number,
  ) {
    super(
      'INSUFFICIENT_STOCK',
      `Stock insuficiente. Disponible: ${stockDisponible}, Solicitado: ${cantidadSolicitada}`,
      { productoId, stockDisponible, cantidadSolicitada },
    )
    this.name = 'InsufficientStockError'
  }
}

/**
 * Error de saldo insuficiente en banco
 */
export class InsufficientFundsError extends AppError {
  constructor(
    bancoId: string,
    saldoActual: number,
    montoRequerido: number,
  ) {
    super(
      'INSUFFICIENT_FUNDS',
      `Saldo insuficiente en ${bancoId}. Actual: $${saldoActual.toLocaleString()}, Requerido: $${montoRequerido.toLocaleString()}`,
      { bancoId, saldoActual, montoRequerido },
    )
    this.name = 'InsufficientFundsError'
  }
}

/**
 * Error de regla de negocio
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('BUSINESS_RULE_VIOLATION', message, context)
    this.name = 'BusinessRuleError'
  }
}

/**
 * Error de entrada duplicada
 */
export class DuplicateEntryError extends AppError {
  constructor(resource: string, field: string, value: string) {
    super(
      'DUPLICATE_ENTRY',
      `Ya existe un ${resource} con ${field}: "${value}"`,
      { resource, field, value },
    )
    this.name = 'DuplicateEntryError'
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASE RESULT<T, E>
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tipo Result que encapsula éxito o error
 */
export class Result<T, E extends AppError = AppError> {
  private readonly _isOk: boolean
  private readonly _value?: T
  private readonly _error?: E

  private constructor(isOk: boolean, value?: T, error?: E) {
    this._isOk = isOk
    this._value = value
    this._error = error
  }

  /**
   * Crea un Result exitoso
   */
  static ok<T, E extends AppError = AppError>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined)
  }

  /**
   * Crea un Result con error
   */
  static fail<T, E extends AppError = AppError>(error: E): Result<T, E> {
    // Log automático de errores
    logger.error(`[Result.fail] ${error.code}: ${error.message}`, error, {
      context: 'Result',
      data: error.context,
    })
    return new Result<T, E>(false, undefined, error)
  }

  /**
   * ¿El resultado es exitoso?
   */
  isOk(): this is Result<T, never> & { value: T } {
    return this._isOk
  }

  /**
   * ¿El resultado es un error?
   */
  isError(): this is Result<never, E> & { error: E } {
    return !this._isOk
  }

  /**
   * Obtiene el valor (lanza error si no hay valor)
   */
  get value(): T {
    if (!this._isOk) {
      throw new Error('Cannot access value of a failed Result')
    }
    return this._value as T
  }

  /**
   * Obtiene el error (lanza error si no hay error)
   */
  get error(): E {
    if (this._isOk) {
      throw new Error('Cannot access error of a successful Result')
    }
    return this._error as E
  }

  /**
   * Obtiene el valor o un valor por defecto
   */
  getOrDefault(defaultValue: T): T {
    return this._isOk ? (this._value as T) : defaultValue
  }

  /**
   * Obtiene el valor o ejecuta una función que retorna el default
   */
  getOrElse(fn: (_error: E) => T): T {
    return this._isOk ? (this._value as T) : fn(this._error as E)
  }

  /**
   * Transforma el valor si es exitoso
   */
  map<U>(fn: (_value: T) => U): Result<U, E> {
    if (this._isOk) {
      return Result.ok(fn(this._value as T))
    }
    return Result.fail(this._error as E)
  }

  /**
   * Transforma el error si es fallido
   */
  mapError<F extends AppError>(fn: (_error: E) => F): Result<T, F> {
    if (this._isOk) {
      return Result.ok(this._value as T)
    }
    return Result.fail(fn(this._error as E))
  }

  /**
   * Encadena operaciones que retornan Result
   */
  flatMap<U>(fn: (_value: T) => Result<U, E>): Result<U, E> {
    if (this._isOk) {
      return fn(this._value as T)
    }
    return Result.fail(this._error as E)
  }

  /**
   * Ejecuta una función solo si es exitoso
   */
  onOk(fn: (_value: T) => void): Result<T, E> {
    if (this._isOk) {
      fn(this._value as T)
    }
    return this
  }

  /**
   * Ejecuta una función solo si es error
   */
  onError(fn: (_error: E) => void): Result<T, E> {
    if (!this._isOk) {
      fn(this._error as E)
    }
    return this
  }

  /**
   * Match pattern - ejecuta una u otra función según el estado
   */
  match<U>(handlers: { ok: (_value: T) => U; error: (_error: E) => U }): U {
    if (this._isOk) {
      return handlers.ok(this._value as T)
    }
    return handlers.error(this._error as E)
  }

  /**
   * Convierte a Promise que se resuelve o rechaza
   */
  toPromise(): Promise<T> {
    if (this._isOk) {
      return Promise.resolve(this._value as T)
    }
    return Promise.reject(this._error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES HELPER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Envuelve una función async en un Result
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorHandler?: (_error: unknown) => AppError,
): Promise<Result<T, AppError>> {
  try {
    const value = await fn()
    return Result.ok(value)
  } catch (error) {
    const appError = errorHandler
      ? errorHandler(error)
      : error instanceof AppError
        ? error
        : new AppError(
            'UNKNOWN_ERROR',
            error instanceof Error ? error.message : 'Error desconocido',
            {},
            error instanceof Error ? error : undefined,
          )
    return Result.fail(appError)
  }
}

/**
 * Envuelve una función sync en un Result
 */
export function tryCatchSync<T>(
  fn: () => T,
  errorHandler?: (_error: unknown) => AppError,
): Result<T, AppError> {
  try {
    const value = fn()
    return Result.ok(value)
  } catch (error) {
    const appError = errorHandler
      ? errorHandler(error)
      : error instanceof AppError
        ? error
        : new AppError(
            'UNKNOWN_ERROR',
            error instanceof Error ? error.message : 'Error desconocido',
            {},
            error instanceof Error ? error : undefined,
          )
    return Result.fail(appError)
  }
}

/**
 * Combina múltiples Results en uno solo
 * Si todos son exitosos, retorna array de valores
 * Si alguno falla, retorna el primer error
 */
export function combineResults<T>(results: Result<T, AppError>[]): Result<T[], AppError> {
  const values: T[] = []
  
  for (const result of results) {
    if (result.isError()) {
      return Result.fail(result.error)
    }
    values.push(result.value)
  }
  
  return Result.ok(values)
}

/**
 * Ejecuta múltiples operaciones async y combina resultados
 */
export async function executeAll<T>(
  operations: (() => Promise<Result<T, AppError>>)[],
): Promise<Result<T[], AppError>> {
  const results = await Promise.all(operations.map(op => op()))
  return combineResults(results)
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS PARA ERRORES COMUNES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Crea un error de validación desde errores de Zod
 */
export function fromZodErrors(errors: { path: (string | number)[]; message: string }[]): ValidationError {
  return new ValidationError(
    errors.map(e => `${e.path.join('.')}: ${e.message}`),
  )
}

/**
 * Crea un error desde un error de Firebase
 */
export function fromFirebaseError(error: unknown): DatabaseError {
  const message = error instanceof Error ? error.message : 'Error de base de datos'
  const code = (error as { code?: string })?.code
  
  return new DatabaseError(
    message,
    error instanceof Error ? error : undefined,
    { firebaseCode: code },
  )
}

/**
 * Crea un Result.fail desde un error desconocido
 */
export function fromUnknownError<T>(error: unknown, context?: string): Result<T, AppError> {
  if (error instanceof AppError) {
    return Result.fail(error)
  }
  
  return Result.fail(
    new AppError(
      'UNKNOWN_ERROR',
      error instanceof Error ? error.message : 'Error desconocido',
      { context },
      error instanceof Error ? error : undefined,
    ),
  )
}

export default Result
