/**
 * 🚀 VERCEL AI GATEWAY CONFIGURATION
 * 
 * Configuración centralizada para usar Vercel AI Gateway.
 * Beneficios:
 * - Caching automático de respuestas
 * - Rate limiting inteligente
 * - Observabilidad con métricas
 * - Multi-provider (OpenAI, Anthropic, etc.)
 * - Costos optimizados
 */

import { openai } from '@ai-sdk/openai'

// Imports opcionales (instalar si se necesitan)
// import { anthropic } from '@ai-sdk/anthropic'
// import { google } from '@ai-sdk/google'

// ===================================================================
// CONFIGURACIÓN DE GATEWAY
// ===================================================================

/**
 * Vercel AI Gateway está habilitado automáticamente cuando:
 * 1. El proyecto está desplegado en Vercel
 * 2. Tienes un plan Pro o Enterprise
 * 
 * No requiere configuración adicional - solo usar el SDK normal.
 * Vercel automáticamente intercepta y cachea las requests.
 */

// ===================================================================
// MODELOS DISPONIBLES
// ===================================================================

export const AI_MODELS = {
  // OpenAI (recomendado para el sistema CHRONOS)
  openai: {
    gpt4Turbo: openai('gpt-4-turbo-2024-04-09'),
    gpt4: openai('gpt-4'),
    gpt35Turbo: openai('gpt-3.5-turbo'),
  },
  
  // Anthropic (instalar @ai-sdk/anthropic si se necesita)
  // anthropic: {
  //   claude35Sonnet: anthropic('claude-3-5-sonnet-20241022'),
  //   claude3Opus: anthropic('claude-3-opus-20240229'),
  // },
  
  // Google (instalar @ai-sdk/google si se necesita)
  // google: {
  //   geminiPro: google('gemini-1.5-pro-latest'),
  //   geminiFlash: google('gemini-1.5-flash-latest'),
  // },
}

// ===================================================================
// CONFIGURACIÓN POR DEFECTO
// ===================================================================

export const DEFAULT_MODEL = AI_MODELS.openai.gpt4Turbo

export const MODEL_CONFIG = {
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
}

// ===================================================================
// CONFIGURACIÓN DE CACHE (Vercel AI Gateway)
// ===================================================================

/**
 * Vercel AI Gateway cachea automáticamente:
 * - Requests idénticas durante 1 hora
 * - Embeddings durante 7 días
 * - Tool calls con mismos parámetros durante 30 minutos
 * 
 * Para invalidar cache manualmente, agrega:
 * headers: { 'x-vercel-ai-cache': 'no-cache' }
 */

export const CACHE_CONFIG = {
  // Duración del cache por tipo de request
  chat: 3600, // 1 hora
  embeddings: 604800, // 7 días
  toolCalls: 1800, // 30 minutos
  
  // Estrategia de cache
  strategy: 'cache-first' as const, // Usa cache primero, luego API
}

// ===================================================================
// RATE LIMITING (Vercel AI Gateway)
// ===================================================================

/**
 * Vercel AI Gateway aplica rate limiting automático:
 * - 100 requests/minuto en plan Pro
 * - 1000 requests/minuto en plan Enterprise
 * - Automático backoff y retry
 */

export const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 100,
  retryAttempts: 3,
  retryDelay: 1000, // ms
  backoffMultiplier: 2,
}

// ===================================================================
// OBSERVABILIDAD
// ===================================================================

/**
 * Vercel AI Gateway provee métricas automáticas en el dashboard:
 * - Total requests
 * - Cache hit rate
 * - Average latency
 * - Error rate
 * - Cost per request
 * 
 * Ver en: https://vercel.com/dashboard/ai
 */

export const OBSERVABILITY_CONFIG = {
  logRequests: process.env.NODE_ENV === 'development',
  logResponses: process.env.NODE_ENV === 'development',
  logErrors: true,
  logPerformance: true,
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * Obtener modelo según tipo de tarea
 */
export function getModelForTask(task: 'chat' | 'analysis' | 'code' | 'fast') {
  switch (task) {
    case 'chat':
      return AI_MODELS.openai.gpt4Turbo
    case 'analysis':
      return AI_MODELS.openai.gpt4Turbo  // Usar GPT-4 Turbo para análisis
    case 'code':
      return AI_MODELS.openai.gpt4Turbo
    case 'fast':
      return AI_MODELS.openai.gpt35Turbo
    default:
      return DEFAULT_MODEL
  }
}

/**
 * Verificar si las API keys están configuradas
 */
export function checkApiKeys() {
  const keys = {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    google: !!process.env.GOOGLE_API_KEY,
  }
  
  return keys
}

/**
 * Obtener configuración de modelo con defaults
 */
export function getModelConfig(overrides?: Partial<typeof MODEL_CONFIG>) {
  return {
    ...MODEL_CONFIG,
    ...overrides,
  }
}
