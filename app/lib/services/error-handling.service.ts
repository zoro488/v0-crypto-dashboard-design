/**
 * 🛡️ ERROR HANDLING SERVICE - CHRONOS SYSTEM
 * 
 * Servicio militar-grade para manejo de errores con:
 * - Retry automático con backoff exponencial
 * - Circuit breaker pattern
 * - Error classification y reporting a Sentry
 * - Toast notifications contextuales
 * - Logging estructurado
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

import * as Sentry from '@sentry/nextjs'
import { logger } from '@/app/lib/utils/logger'

// ============================================================
// TIPOS Y CONSTANTES
// ============================================================

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ErrorCategory = 'network' | 'firebase' | 'validation' | 'business' | 'auth' | 'voice' | 'unknown'

export interface ChronosError {
  code: string
  message: string
  category: ErrorCategory
  severity: ErrorSeverity
  context?: Record<string, unknown>
  originalError?: Error
  timestamp: Date
  retryable: boolean
  userMessage: string
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryableErrors?: string[]
}

export interface CircuitBreakerState {
  failures: number
  lastFailure: Date | null
  state: 'closed' | 'open' | 'half-open'
  nextRetry: Date | null
}

// Configuración por defecto de retry
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableErrors: [
    'NETWORK_ERROR',
    'TIMEOUT',
    'SERVICE_UNAVAILABLE',
    'RATE_LIMIT',
    'FIREBASE_UNAVAILABLE',
  ],
}

// Mensajes amigables por categoría
const USER_MESSAGES: Record<ErrorCategory, Record<string, string>> = {
  network: {
    default: 'Error de conexión. Verificando red...',
    timeout: 'La operación tardó demasiado. Reintentando...',
    offline: 'Sin conexión a internet. Los cambios se sincronizarán al reconectar.',
  },
  firebase: {
    default: 'Error en la base de datos. Reintentando...',
    permission: 'No tienes permiso para esta operación.',
    not_found: 'El registro no fue encontrado.',
    quota: 'Límite de operaciones alcanzado. Espera un momento.',
  },
  validation: {
    default: 'Los datos ingresados no son válidos.',
    required: 'Hay campos requeridos sin completar.',
    format: 'El formato de los datos no es correcto.',
  },
  business: {
    default: 'Error en la operación de negocio.',
    insufficient_funds: 'Saldo insuficiente para esta operación.',
    stock_unavailable: 'Stock insuficiente en almacén.',
    duplicate: 'Este registro ya existe.',
  },
  auth: {
    default: 'Error de autenticación.',
    expired: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
    invalid: 'Credenciales inválidas.',
  },
  voice: {
    default: 'Error en el servicio de voz.',
    microphone: 'No se pudo acceder al micrófono.',
    transcription: 'No se pudo transcribir el audio.',
    synthesis: 'No se pudo generar la respuesta de voz.',
  },
  unknown: {
    default: 'Ocurrió un error inesperado. Intenta de nuevo.',
  },
}

// ============================================================
// CIRCUIT BREAKER
// ============================================================

const circuitBreakers: Map<string, CircuitBreakerState> = new Map()
const CIRCUIT_BREAKER_THRESHOLD = 5
const CIRCUIT_BREAKER_TIMEOUT = 30000 // 30 segundos

/**
 * Obtiene o crea el estado del circuit breaker para un servicio
 */
function getCircuitBreaker(serviceName: string): CircuitBreakerState {
  if (!circuitBreakers.has(serviceName)) {
    circuitBreakers.set(serviceName, {
      failures: 0,
      lastFailure: null,
      state: 'closed',
      nextRetry: null,
    })
  }
  return circuitBreakers.get(serviceName)!
}

/**
 * Registra un fallo en el circuit breaker
 */
function recordFailure(serviceName: string): void {
  const breaker = getCircuitBreaker(serviceName)
  breaker.failures++
  breaker.lastFailure = new Date()
  
  if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    breaker.state = 'open'
    breaker.nextRetry = new Date(Date.now() + CIRCUIT_BREAKER_TIMEOUT)
    
    logger.warn(`[CircuitBreaker] Servicio ${serviceName} abierto por exceso de fallos`, {
      context: 'ErrorHandling',
      data: { failures: breaker.failures, nextRetry: breaker.nextRetry },
    })
  }
}

/**
 * Registra un éxito y resetea el circuit breaker
 */
function recordSuccess(serviceName: string): void {
  const breaker = getCircuitBreaker(serviceName)
  breaker.failures = 0
  breaker.state = 'closed'
  breaker.nextRetry = null
}

/**
 * Verifica si el circuit breaker permite la operación
 */
function canExecute(serviceName: string): boolean {
  const breaker = getCircuitBreaker(serviceName)
  
  if (breaker.state === 'closed') {
    return true
  }
  
  if (breaker.state === 'open' && breaker.nextRetry && new Date() >= breaker.nextRetry) {
    breaker.state = 'half-open'
    return true
  }
  
  return breaker.state === 'half-open'
}

// ============================================================
// ERROR CLASSIFICATION
// ============================================================

/**
 * Clasifica un error en su categoría y severidad
 */
export function classifyError(error: Error | unknown): Partial<ChronosError> {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  const errorName = error instanceof Error ? error.name : 'Unknown'
  
  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorName === 'TypeError' && errorMessage.includes('failed')
  ) {
    return {
      category: 'network',
      severity: 'medium',
      retryable: true,
      code: 'NETWORK_ERROR',
    }
  }
  
  // Firebase errors
  if (
    errorMessage.includes('firebase') ||
    errorMessage.includes('firestore') ||
    errorMessage.includes('permission-denied') ||
    errorMessage.includes('not-found') ||
    errorMessage.includes('quota')
  ) {
    const isPermission = errorMessage.includes('permission')
    const isNotFound = errorMessage.includes('not-found')
    
    return {
      category: 'firebase',
      severity: isPermission ? 'high' : 'medium',
      retryable: !isPermission && !isNotFound,
      code: isPermission ? 'FIREBASE_PERMISSION' : isNotFound ? 'FIREBASE_NOT_FOUND' : 'FIREBASE_ERROR',
    }
  }
  
  // Auth errors
  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('token') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('session')
  ) {
    return {
      category: 'auth',
      severity: 'high',
      retryable: false,
      code: 'AUTH_ERROR',
    }
  }
  
  // Voice errors
  if (
    errorMessage.includes('microphone') ||
    errorMessage.includes('audio') ||
    errorMessage.includes('transcri') ||
    errorMessage.includes('speech') ||
    errorMessage.includes('voice')
  ) {
    return {
      category: 'voice',
      severity: 'low',
      retryable: true,
      code: 'VOICE_ERROR',
    }
  }
  
  // Validation errors
  if (
    errorMessage.includes('valid') ||
    errorMessage.includes('required') ||
    errorMessage.includes('format') ||
    errorMessage.includes('schema')
  ) {
    return {
      category: 'validation',
      severity: 'low',
      retryable: false,
      code: 'VALIDATION_ERROR',
    }
  }
  
  // Business logic errors
  if (
    errorMessage.includes('insufficient') ||
    errorMessage.includes('stock') ||
    errorMessage.includes('balance') ||
    errorMessage.includes('duplicate')
  ) {
    return {
      category: 'business',
      severity: 'medium',
      retryable: false,
      code: 'BUSINESS_ERROR',
    }
  }
  
  // Unknown
  return {
    category: 'unknown',
    severity: 'medium',
    retryable: true,
    code: 'UNKNOWN_ERROR',
  }
}

/**
 * Crea un ChronosError estructurado
 */
export function createChronosError(
  error: Error | unknown,
  context?: Record<string, unknown>,
): ChronosError {
  const classification = classifyError(error)
  const originalError = error instanceof Error ? error : new Error(String(error))
  
  const category = classification.category || 'unknown'
  const code = classification.code || 'UNKNOWN_ERROR'
  
  // Obtener mensaje amigable
  const categoryMessages = USER_MESSAGES[category]
  const codeKey = code.toLowerCase().split('_').pop() || 'default'
  const userMessage = categoryMessages[codeKey] || categoryMessages.default
  
  const chronosError: ChronosError = {
    code,
    message: originalError.message,
    category,
    severity: classification.severity || 'medium',
    context,
    originalError,
    timestamp: new Date(),
    retryable: classification.retryable ?? true,
    userMessage,
  }
  
  // Reportar a Sentry si es severidad alta o crítica
  if (chronosError.severity === 'high' || chronosError.severity === 'critical') {
    reportToSentry(chronosError)
  }
  
  return chronosError
}

// ============================================================
// RETRY WITH BACKOFF
// ============================================================

/**
 * Calcula el delay para el siguiente retry con jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffFactor, attempt)
  const jitter = Math.random() * 0.3 * exponentialDelay // 0-30% jitter
  const delay = Math.min(exponentialDelay + jitter, config.maxDelay)
  return Math.round(delay)
}

/**
 * Ejecuta una función con retry automático
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  serviceName: string,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | undefined
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    // Verificar circuit breaker
    if (!canExecute(serviceName)) {
      const breaker = getCircuitBreaker(serviceName)
      throw createChronosError(
        new Error(`Servicio ${serviceName} temporalmente no disponible`),
        { nextRetry: breaker.nextRetry, state: breaker.state },
      )
    }
    
    try {
      const result = await fn()
      recordSuccess(serviceName)
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      const classification = classifyError(error)
      const isRetryable = classification.retryable && 
        (retryConfig.retryableErrors?.includes(classification.code || '') ?? true)
      
      if (!isRetryable || attempt === retryConfig.maxRetries) {
        recordFailure(serviceName)
        throw createChronosError(lastError, {
          serviceName,
          attempt,
          maxRetries: retryConfig.maxRetries,
        })
      }
      
      const delay = calculateDelay(attempt, retryConfig)
      
      logger.warn(`[Retry] Intento ${attempt + 1}/${retryConfig.maxRetries + 1} fallido para ${serviceName}`, {
        context: 'ErrorHandling',
        data: { error: lastError.message, nextRetryIn: delay },
      })
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw createChronosError(lastError!, { serviceName })
}

// ============================================================
// SENTRY INTEGRATION
// ============================================================

/**
 * Reporta error a Sentry con contexto enriquecido
 */
export function reportToSentry(error: ChronosError): void {
  try {
    Sentry.withScope((scope) => {
      scope.setLevel(error.severity === 'critical' ? 'fatal' : error.severity === 'high' ? 'error' : 'warning')
      scope.setTag('error.category', error.category)
      scope.setTag('error.code', error.code)
      scope.setTag('error.retryable', String(error.retryable))
      
      if (error.context) {
        scope.setContext('error_context', error.context)
      }
      
      if (error.originalError) {
        Sentry.captureException(error.originalError)
      } else {
        Sentry.captureMessage(error.message, error.severity === 'critical' ? 'fatal' : 'error')
      }
    })
    
    logger.info('[Sentry] Error reportado', {
      context: 'ErrorHandling',
      data: { code: error.code, category: error.category },
    })
  } catch (sentryError) {
    logger.error('[Sentry] Error al reportar', sentryError, { context: 'ErrorHandling' })
  }
}

// ============================================================
// TOAST HELPER
// ============================================================

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastConfig {
  title: string
  description: string
  variant: 'default' | 'destructive'
  action?: ToastAction
  duration?: number
}

/**
 * Genera configuración de toast basada en el error
 */
export function getToastConfig(
  error: ChronosError,
  onRetry?: () => void,
): ToastConfig {
  const config: ToastConfig = {
    title: getErrorTitle(error.category, error.severity),
    description: error.userMessage,
    variant: error.severity === 'high' || error.severity === 'critical' ? 'destructive' : 'default',
    duration: error.severity === 'critical' ? 10000 : 5000,
  }
  
  if (error.retryable && onRetry) {
    config.action = {
      label: 'Reintentar',
      onClick: onRetry,
    }
  }
  
  return config
}

function getErrorTitle(category: ErrorCategory, severity: ErrorSeverity): string {
  const severityEmoji = {
    low: 'ℹ️',
    medium: '⚠️',
    high: '❌',
    critical: '🚨',
  }
  
  const categoryTitle = {
    network: 'Error de Conexión',
    firebase: 'Error de Base de Datos',
    validation: 'Datos Inválidos',
    business: 'Error de Operación',
    auth: 'Error de Autenticación',
    voice: 'Error de Voz',
    unknown: 'Error Inesperado',
  }
  
  return `${severityEmoji[severity]} ${categoryTitle[category]}`
}

// ============================================================
// EXPORTS
// ============================================================

export const errorHandlingService = {
  classify: classifyError,
  create: createChronosError,
  withRetry,
  reportToSentry,
  getToastConfig,
  getCircuitBreakerState: getCircuitBreaker,
  resetCircuitBreaker: (serviceName: string) => {
    circuitBreakers.delete(serviceName)
  },
}

export default errorHandlingService
