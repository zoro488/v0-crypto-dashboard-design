'use client'

/**
 * 🔍 CHRONOS TRACING SERVICE
 * 
 * Sistema de observabilidad con OpenTelemetry para:
 * - Monitoreo de operaciones Firebase/Firestore
 * - Tracking de rendimiento de componentes
 * - Análisis de latencia y errores
 * - Debugging de flujos de datos
 */

import { trace, SpanStatusCode, SpanKind, Span } from '@opentelemetry/api'
import { WebTracerProvider, BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-web'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { logger } from '../utils/logger'

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const SERVICE_NAME = 'chronos-dashboard'
const SERVICE_VERSION = '2.0.0'
const OTLP_ENDPOINT = process.env.NEXT_PUBLIC_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'

// Flag para habilitar/deshabilitar tracing
let tracingEnabled = false
let tracerProvider: WebTracerProvider | null = null

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa el sistema de tracing con OpenTelemetry
 */
export function initTracing(): void {
  if (typeof window === 'undefined') {
    logger.info('[Tracing] Skipping - Server side')
    return
  }

  if (tracingEnabled) {
    logger.info('[Tracing] Already initialized')
    return
  }

  try {
    // Crear recurso con metadatos del servicio
    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
      'deployment.environment': process.env.NODE_ENV || 'development',
    })

    // Crear exporter OTLP
    const exporter = new OTLPTraceExporter({
      url: OTLP_ENDPOINT,
      headers: {},
    })

    // Crear provider
    tracerProvider = new WebTracerProvider({
      resource,
      spanProcessors: [
        // Usar SimpleSpanProcessor en desarrollo para ver spans inmediatamente
        process.env.NODE_ENV === 'development'
          ? new SimpleSpanProcessor(exporter)
          : new BatchSpanProcessor(exporter),
      ],
    })

    // Registrar el provider globalmente
    tracerProvider.register()

    tracingEnabled = true
    logger.info('[Tracing] ✅ OpenTelemetry initialized', { 
      context: 'Tracing',
    })
  } catch (error) {
    logger.error('[Tracing] ❌ Failed to initialize', error as Error, { 
      context: 'Tracing', 
    })
  }
}

/**
 * Detiene el sistema de tracing
 */
export async function shutdownTracing(): Promise<void> {
  if (tracerProvider) {
    await tracerProvider.shutdown()
    tracingEnabled = false
    logger.info('[Tracing] Shutdown complete')
  }
}

// ============================================================================
// TRACER PRINCIPAL
// ============================================================================

/**
 * Obtiene el tracer principal de CHRONOS
 */
export function getTracer(name: string = 'chronos') {
  return trace.getTracer(name, SERVICE_VERSION)
}

// ============================================================================
// HELPERS DE TRACING
// ============================================================================

/**
 * Wrapper para trazar operaciones asíncronas
 */
export async function traceAsync<T>(
  operationName: string,
  operation: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  if (!tracingEnabled) {
    return operation({} as Span)
  }

  const tracer = getTracer()
  
  return tracer.startActiveSpan(operationName, { kind: SpanKind.INTERNAL }, async (span) => {
    try {
      // Agregar atributos si se proporcionan
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value)
        })
      }

      const result = await operation(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error instanceof Error ? error.message : 'Unknown error', 
      })
      span.recordException(error as Error)
      throw error
    } finally {
      span.end()
    }
  })
}

/**
 * Wrapper para trazar operaciones síncronas
 */
export function traceSync<T>(
  operationName: string,
  operation: (span: Span) => T,
  attributes?: Record<string, string | number | boolean>,
): T {
  if (!tracingEnabled) {
    return operation({} as Span)
  }

  const tracer = getTracer()
  const span = tracer.startSpan(operationName, { kind: SpanKind.INTERNAL })

  try {
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value)
      })
    }

    const result = operation(span)
    span.setStatus({ code: SpanStatusCode.OK })
    return result
  } catch (error) {
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: error instanceof Error ? error.message : 'Unknown error', 
    })
    span.recordException(error as Error)
    throw error
  } finally {
    span.end()
  }
}

// ============================================================================
// DECORADORES ESPECÍFICOS PARA CHRONOS
// ============================================================================

/**
 * Traza operaciones de Firestore
 */
export async function traceFirestore<T>(
  operation: string,
  collection: string,
  fn: () => Promise<T>,
): Promise<T> {
  return traceAsync(
    `firestore.${operation}`,
    async (span) => {
      span.setAttribute('db.system', 'firestore')
      span.setAttribute('db.collection', collection)
      span.setAttribute('db.operation', operation)
      return fn()
    },
  )
}

/**
 * Traza operaciones de UI/Componentes
 */
export function traceComponent(
  componentName: string,
  action: string,
  attributes?: Record<string, string | number | boolean>,
): void {
  if (!tracingEnabled) return

  const tracer = getTracer('chronos-ui')
  const span = tracer.startSpan(`ui.${componentName}.${action}`, {
    kind: SpanKind.INTERNAL,
  })

  span.setAttribute('ui.component', componentName)
  span.setAttribute('ui.action', action)

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value)
    })
  }

  span.end()
}

/**
 * Traza cálculos de negocio
 */
export async function traceBusinessLogic<T>(
  domain: string,
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, string | number | boolean>,
): Promise<T> {
  return traceAsync(
    `business.${domain}.${operation}`,
    async (span) => {
      span.setAttribute('business.domain', domain)
      span.setAttribute('business.operation', operation)
      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          span.setAttribute(`business.${key}`, value)
        })
      }
      return fn()
    },
  )
}

/**
 * Mide y traza el tiempo de renderizado de componentes
 */
export function measureRenderTime(componentName: string): () => void {
  if (!tracingEnabled) return () => { /* noop */ }

  const startTime = performance.now()
  const tracer = getTracer('chronos-performance')
  const span = tracer.startSpan(`render.${componentName}`, {
    kind: SpanKind.INTERNAL,
  })

  return () => {
    const duration = performance.now() - startTime
    span.setAttribute('render.duration_ms', duration)
    span.setAttribute('render.component', componentName)
    span.end()
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initTracing,
  shutdownTracing,
  getTracer,
  traceAsync,
  traceSync,
  traceFirestore,
  traceComponent,
  traceBusinessLogic,
  measureRenderTime,
}
