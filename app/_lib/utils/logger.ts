// ═══════════════════════════════════════════════════════════════
// CHRONOS - LOGGER UTILITY
// Sistema de logging estructurado para reemplazar console.log
// ═══════════════════════════════════════════════════════════════

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  context?: string
  data?: Record<string, unknown>
  userId?: string
  requestId?: string
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  data?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const isDev = process.env.NODE_ENV === 'development'

function formatLog(entry: LogEntry): string {
  const { timestamp, level, message, context, data } = entry
  const prefix = context ? `[${context}]` : ''
  const dataStr = data ? ` ${JSON.stringify(data)}` : ''
  return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}${dataStr}`
}

function createLogEntry(
  level: LogLevel,
  message: string,
  contextOrError?: LogContext | Error,
  maybeContext?: LogContext
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  }

  if (contextOrError instanceof Error) {
    entry.error = {
      name: contextOrError.name,
      message: contextOrError.message,
      stack: contextOrError.stack,
    }
    if (maybeContext) {
      entry.context = maybeContext.context
      entry.data = maybeContext.data
    }
  } else if (contextOrError) {
    entry.context = contextOrError.context
    entry.data = contextOrError.data
  }

  return entry
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (!isDev) return
    const entry = createLogEntry('debug', message, context)
    console.debug(formatLog(entry))
  },

  info(message: string, context?: LogContext) {
    const entry = createLogEntry('info', message, context)
    console.info(formatLog(entry))
  },

  warn(message: string, context?: LogContext) {
    const entry = createLogEntry('warn', message, context)
    console.warn(formatLog(entry))
  },

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const err = error instanceof Error ? error : new Error(String(error))
    const entry = createLogEntry('error', message, err, context)
    console.error(formatLog(entry))
    if (entry.error?.stack && isDev) {
      console.error(entry.error.stack)
    }
  },

  // Para logging de performance
  time(label: string) {
    if (isDev) {
      console.time(`⏱️ ${label}`)
    }
  },

  timeEnd(label: string) {
    if (isDev) {
      console.timeEnd(`⏱️ ${label}`)
    }
  },

  // Para logging de grupos
  group(label: string) {
    if (isDev) {
      console.group(`📦 ${label}`)
    }
  },

  groupEnd() {
    if (isDev) {
      console.groupEnd()
    }
  },
}

// Helper para logging de Server Actions
export function logServerAction(
  actionName: string,
  input: unknown,
  result: { success?: boolean; error?: string }
) {
  if (result.error) {
    logger.error(`Server Action failed: ${actionName}`, undefined, {
      context: 'ServerAction',
      data: { actionName, error: result.error },
    })
  } else {
    logger.info(`Server Action completed: ${actionName}`, {
      context: 'ServerAction',
      data: { actionName },
    })
  }
}

export default logger
