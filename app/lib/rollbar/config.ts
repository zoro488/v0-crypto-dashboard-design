/**
 * 🛡️ ROLLBAR CONFIGURATION - CHRONOS SYSTEM
 * 
 * Configuración de error tracking con Rollbar.
 * Integración cliente/servidor para captura completa de errores.
 */

import Rollbar from 'rollbar'

// Configuración base compartida
const baseConfig = {
  accessToken: process.env.NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN || process.env.ROLLBAR_SERVER_TOKEN,
  environment: process.env.NODE_ENV || 'development',
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    client: {
      javascript: {
        source_map_enabled: true,
        code_version: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
        guess_uncaught_frames: true,
      },
    },
    environment: process.env.NODE_ENV || 'development',
    code_version: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
    server: {
      root: process.env.VERCEL_URL || 'localhost',
    },
  },
}

// Cliente Rollbar para el navegador
export const rollbarClientConfig: Rollbar.Configuration = {
  ...baseConfig,
  accessToken: process.env.NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN,
}

// Cliente Rollbar para el servidor
export const rollbarServerConfig: Rollbar.Configuration = {
  ...baseConfig,
  accessToken: process.env.ROLLBAR_SERVER_TOKEN,
}

// Singleton para el cliente
let rollbarInstance: Rollbar | null = null

export function getRollbar(): Rollbar {
  if (!rollbarInstance) {
    const isServer = typeof window === 'undefined'
    rollbarInstance = new Rollbar(isServer ? rollbarServerConfig : rollbarClientConfig)
  }
  return rollbarInstance
}

// Función helper para logging con contexto
export function logError(
  error: Error | string,
  context?: Record<string, unknown>,
  level: 'critical' | 'error' | 'warning' | 'info' | 'debug' = 'error',
) {
  const rollbar = getRollbar()
  
  const message = typeof error === 'string' ? error : error.message
  const err = typeof error === 'string' ? new Error(error) : error
  
  switch (level) {
    case 'critical':
      rollbar.critical(message, err, context)
      break
    case 'error':
      rollbar.error(message, err, context)
      break
    case 'warning':
      rollbar.warning(message, err, context)
      break
    case 'info':
      rollbar.info(message, context)
      break
    case 'debug':
      rollbar.debug(message, context)
      break
  }
}

// Context para usuario autenticado
export function setRollbarUser(user: {
  id: string;
  email?: string;
  username?: string;
}) {
  const rollbar = getRollbar()
  rollbar.configure({
    payload: {
      person: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    },
  })
}

export default getRollbar
