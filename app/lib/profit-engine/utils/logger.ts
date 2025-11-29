/**
 * Profit Engine Logger Wrapper
 * 
 * Adaptador para el logger del sistema que permite una sintaxis
 * más conveniente para el profit-engine.
 */

import { logger as baseLogger } from '@/app/lib/utils/logger';

/**
 * Logger adaptado para el profit-engine con contexto automático
 */
export const profitLogger = {
  info: (context: string, message: string, data?: unknown) => {
    baseLogger.info(message, { context, data });
  },
  
  warn: (context: string, message: string, data?: unknown) => {
    baseLogger.warn(message, { context, data });
  },
  
  error: (context: string, message: string, error?: unknown) => {
    baseLogger.error(message, error, { context });
  },
  
  debug: (context: string, message: string, data?: unknown) => {
    baseLogger.debug(message, { context, data });
  },
};

// Re-exportar el logger base también
export { baseLogger as logger };
