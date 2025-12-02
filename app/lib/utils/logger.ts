/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    CHRONOS SYSTEM - LOGGER UTILITY                         ║
 * ║                     Production-Ready Logging Service v2.1                  ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * Logger centralizado para toda la aplicación. USAR SIEMPRE en lugar de console.log.
 * 
 * @example
 * ```typescript
 * import { logger } from '@/app/lib/utils/logger'
 * 
 * // Info con contexto
 * logger.info('Venta creada', { context: 'VentasService', data: { id: 'venta-123' } })
 * 
 * // Error con stack trace
 * logger.error('Error al crear venta', error, { context: 'VentasService' })
 * 
 * // Warning
 * logger.warn('Stock bajo', { context: 'Almacen', data: { stock: 5 } })
 * 
 * // Debug (solo en desarrollo)
 * logger.debug('Datos recibidos', { data: formData })
 * ```
 * 
 * @module utils/logger
 * @version 2.1.0
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogOptions {
  timestamp?: boolean
  context?: string
  data?: unknown
  // Permitir propiedades adicionales para datos de contexto
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: string
  data?: unknown
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private enabledLevels: Set<LogLevel> = new Set(['error', 'warn'])
  private logHistory: LogEntry[] = []
  private maxHistorySize = 100

  constructor() {
    if (this.isDevelopment) {
      this.enabledLevels.add('info')
      this.enabledLevels.add('debug')
    }
  }

  /**
   * Habilita o deshabilita un nivel de log
   */
  setLevel(level: LogLevel, enabled: boolean): void {
    if (enabled) {
      this.enabledLevels.add(level)
    } else {
      this.enabledLevels.delete(level)
    }
  }

  /**
   * Habilita todos los niveles de log (útil para debugging)
   */
  enableAll(): void {
    this.enabledLevels = new Set(['debug', 'info', 'warn', 'error'])
  }

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const parts: string[] = []

    if (options?.timestamp !== false) {
      parts.push(`[${new Date().toISOString()}]`)
    }

    parts.push(`[${level.toUpperCase()}]`)

    if (options?.context) {
      parts.push(`[${options.context}]`)
    }

    parts.push(message)

    return parts.join(' ')
  }

  private createLogEntry(
    level: LogLevel, 
    message: string, 
    options?: LogOptions, 
    error?: Error | unknown
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: options?.context,
      data: options?.data,
    }

    if (error) {
      entry.error = {
        name: error instanceof Error ? error.name : 'Error',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    }

    return entry
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry)
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift()
    }
  }

  private log(level: LogLevel, message: string, options?: LogOptions): void {
    if (!this.enabledLevels.has(level)) return

    const formattedMessage = this.formatMessage(level, message, options)
    const entry = this.createLogEntry(level, message, options)
    this.addToHistory(entry)

    // Formatear data para mejor visualización
    const dataOutput = options?.data 
      ? (typeof options.data === 'object' 
          ? JSON.stringify(options.data, null, 2) 
          : options.data)
      : ''

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, dataOutput || '')
        break
      case 'info':
        console.info(formattedMessage, dataOutput || '')
        break
      case 'warn':
        console.warn(formattedMessage, dataOutput || '')
        break
      case 'error':
        console.error(formattedMessage, dataOutput || '')
        break
    }
  }

  /**
   * Log de debug - solo visible en desarrollo
   */
  debug(message: string, options?: LogOptions): void {
    this.log('debug', message, options)
  }

  /**
   * Log de información general
   */
  info(message: string, options?: LogOptions): void {
    this.log('info', message, options)
  }

  /**
   * Log de advertencia
   */
  warn(message: string, options?: LogOptions): void {
    this.log('warn', message, options)
  }

  /**
   * Log de error con soporte para objeto Error
   */
  error(message: string, error?: Error | unknown, options?: LogOptions): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error

    const entry = this.createLogEntry('error', message, options, error)
    this.addToHistory(entry)

    if (!this.enabledLevels.has('error')) return

    const formattedMessage = this.formatMessage('error', message, options)
    console.error(formattedMessage, errorData || '')
  }

  /**
   * Log de éxito (alias de info con emoji)
   */
  success(message: string, options?: LogOptions): void {
    this.info(`✅ ${message}`, options)
  }

  /**
   * Log de inicio de operación (para tracking de performance)
   */
  startOperation(operationName: string, context?: string): () => void {
    const startTime = performance.now()
    this.debug(`⏱️ Iniciando: ${operationName}`, { context })

    // Retorna función para finalizar y loguear duración
    return () => {
      const duration = performance.now() - startTime
      this.debug(`⏱️ Completado: ${operationName} (${duration.toFixed(2)}ms)`, { 
        context,
        data: { duration: `${duration.toFixed(2)}ms` }
      })
    }
  }

  /**
   * Obtiene el historial de logs
   */
  getHistory(): LogEntry[] {
    return [...this.logHistory]
  }

  /**
   * Limpia el historial de logs
   */
  clearHistory(): void {
    this.logHistory = []
  }

  /**
   * Obtiene logs de un nivel específico
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logHistory.filter(entry => entry.level === level)
  }

  /**
   * Obtiene los últimos N errores
   */
  getLastErrors(count: number = 10): LogEntry[] {
    return this.logHistory
      .filter(entry => entry.level === 'error')
      .slice(-count)
  }

  /**
   * Formatea logs para exportar/reportar
   */
  exportLogs(): string {
    return this.logHistory
      .map(entry => {
        let line = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
        if (entry.context) line += ` [${entry.context}]`
        line += ` ${entry.message}`
        if (entry.data) line += ` | Data: ${JSON.stringify(entry.data)}`
        if (entry.error) line += ` | Error: ${entry.error.message}`
        return line
      })
      .join('\n')
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for external use
export type { LogLevel, LogOptions, LogEntry }
