/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    CHRONOS SYSTEM - LOGGER UTILITY                         ║
 * ║                     Production-Ready Logging Service                       ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogOptions {
  timestamp?: boolean
  context?: string
  data?: unknown
  // Permitir propiedades adicionales para datos de contexto
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private enabledLevels: Set<LogLevel> = new Set(['error', 'warn'])

  constructor() {
    if (this.isDevelopment) {
      this.enabledLevels.add('info')
      this.enabledLevels.add('debug')
    }
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

  private log(level: LogLevel, message: string, options?: LogOptions): void {
    if (!this.enabledLevels.has(level)) return

    const formattedMessage = this.formatMessage(level, message, options)

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, options?.data || '')
        break
      case 'info':
        console.info(formattedMessage, options?.data || '')
        break
      case 'warn':
        console.warn(formattedMessage, options?.data || '')
        break
      case 'error':
        console.error(formattedMessage, options?.data || '')
        break
    }
  }

  debug(message: string, options?: LogOptions): void {
    this.log('debug', message, options)
  }

  info(message: string, options?: LogOptions): void {
    this.log('info', message, options)
  }

  warn(message: string, options?: LogOptions): void {
    this.log('warn', message, options)
  }

  error(message: string, error?: Error | unknown, options?: LogOptions): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error

    this.log('error', message, {
      ...options,
      data: errorData,
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for external use
export type { LogLevel, LogOptions }
