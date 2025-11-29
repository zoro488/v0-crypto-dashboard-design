/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    CHRONOS SYSTEM - Sentry Configuration                   ║
 * ║                    Error Tracking and Monitoring Setup                     ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development'

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Error filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      // Network errors
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      // Random plugins/extensions
      'window.webkit.messageHandlers',
      'Non-Error promise rejection captured',
    ],

    // Breadcrumbs
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter out sensitive data from breadcrumbs
      if (breadcrumb.category === 'console') {
        return null
      }
      return breadcrumb
    },

    // Before sending events
    beforeSend(event, hint) {
      // Filter out errors from development
      if (ENVIRONMENT === 'development') {
        console.error('Sentry Error:', event, hint)
        return null
      }

      // Remove sensitive data
      if (event.request) {
        delete event.request.cookies
      }

      return event
    },

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  })
}

// Custom error capture with context
export function captureError(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('custom', context)
  }
  Sentry.captureException(error)
}

// Capture message with level
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level)
}

// Set user context
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user)
}

// Clear user context
export function clearUser() {
  Sentry.setUser(null)
}

// Add breadcrumb
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  })
}

// Performance monitoring - Deprecated in modern Sentry
// Use Sentry.startSpan() instead
// export function startTransaction(name: string, op: string) {
//   return Sentry.startTransaction({ name, op })
// }

// Custom tags
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value)
}

// Custom tags for multiple values
export function setTags(tags: Record<string, string>) {
  Sentry.setTags(tags)
}
