/**
 * 🧠 AI ORCHESTRATOR - Motor de Inteligencia Artificial Unificado
 * 
 * Orquestador central que unifica:
 * - Multi-provider AI (xAI Grok, OpenAI, Anthropic, Google)
 * - Voice AI (Deepgram STT + ElevenLabs TTS)
 * - Streaming responses
 * - Error handling militar-grade
 * - Fallback automático entre proveedores
 * - Caché inteligente de respuestas
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

import { logger } from '@/app/lib/utils/logger'

// =====================================================================
// TIPOS
// =====================================================================

export type AIProvider = 'xai' | 'openai' | 'anthropic' | 'google' | 'github'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'function'
  content: string
  name?: string
}

export interface AICompletionOptions {
  model?: string
  provider?: AIProvider
  temperature?: number
  maxTokens?: number
  stream?: boolean
  systemPrompt?: string
  onChunk?: (chunk: string) => void
  onComplete?: (fullResponse: string) => void
  onError?: (error: Error) => void
  timeout?: number
  retries?: number
  cache?: boolean
}

export interface AIResponse {
  content: string
  model: string
  provider: AIProvider
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  latency: number
  cached: boolean
}

export interface VoiceOptions {
  voice?: string
  emotion?: 'neutral' | 'excited' | 'calm' | 'concerned' | 'professional'
  speed?: number
  language?: string
}

// =====================================================================
// CONFIGURACIÓN DE MODELOS
// =====================================================================

export const AI_MODELS = {
  // xAI Grok
  GROK_2: 'grok-2-1212',
  GROK_2_LATEST: 'grok-2-latest',
  GROK_3_MINI: 'grok-3-mini-beta',
  
  // OpenAI
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_4_TURBO: 'gpt-4-turbo',
  
  // Anthropic
  CLAUDE_SONNET: 'claude-3-5-sonnet-20241022',
  CLAUDE_HAIKU: 'claude-3-haiku-20240307',
  
  // Google
  GEMINI_PRO: 'gemini-1.5-pro',
  GEMINI_FLASH: 'gemini-1.5-flash',
  
  // GitHub Models
  PHI_4: 'microsoft/Phi-4',
  LLAMA_3: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
} as const

export const DEFAULT_MODEL = AI_MODELS.GROK_2

const PROVIDER_ENDPOINTS: Record<AIProvider, string> = {
  xai: 'https://api.x.ai/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  google: 'https://generativelanguage.googleapis.com/v1beta/models',
  github: 'https://models.inference.ai.azure.com/chat/completions',
}

// Mapeo de modelos a proveedores
const MODEL_PROVIDERS: Record<string, AIProvider> = {
  'grok-2-1212': 'xai',
  'grok-2-latest': 'xai',
  'grok-3-mini-beta': 'xai',
  'gpt-4o': 'openai',
  'gpt-4o-mini': 'openai',
  'gpt-4-turbo': 'openai',
  'claude-3-5-sonnet-20241022': 'anthropic',
  'claude-3-haiku-20240307': 'anthropic',
  'gemini-1.5-pro': 'google',
  'gemini-1.5-flash': 'google',
  'microsoft/Phi-4': 'github',
  'meta-llama/Llama-3.2-11B-Vision-Instruct': 'github',
}

// =====================================================================
// CACHE INTELIGENTE
// =====================================================================

interface CacheEntry {
  response: string
  timestamp: number
  hits: number
}

class ResponseCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize = 100
  private ttl = 5 * 60 * 1000 // 5 minutos
  
  private generateKey(messages: AIMessage[], model: string): string {
    return `${model}:${JSON.stringify(messages)}`
  }
  
  get(messages: AIMessage[], model: string): string | null {
    const key = this.generateKey(messages, model)
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Verificar TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    entry.hits++
    return entry.response
  }
  
  set(messages: AIMessage[], model: string, response: string): void {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) this.cache.delete(oldestKey)
    }
    
    const key = this.generateKey(messages, model)
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      hits: 1,
    })
  }
  
  clear(): void {
    this.cache.clear()
  }
}

// =====================================================================
// ORCHESTRATOR PRINCIPAL
// =====================================================================

class AIOrchestrator {
  private cache = new ResponseCache()
  private requestCount = 0
  private totalLatency = 0
  
  /**
   * Genera una respuesta de AI
   */
  async complete(
    messages: AIMessage[],
    options: AICompletionOptions = {},
  ): Promise<AIResponse> {
    const startTime = Date.now()
    const {
      model = DEFAULT_MODEL,
      provider = this.getProviderForModel(model),
      temperature = 0.7,
      maxTokens = 2048,
      stream = false,
      systemPrompt,
      onChunk,
      onComplete,
      onError,
      timeout = 30000,
      retries = 2,
      cache = true,
    } = options
    
    // Añadir system prompt si existe
    const fullMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages
    
    // Verificar cache
    if (cache && !stream) {
      const cached = this.cache.get(fullMessages, model)
      if (cached) {
        logger.info('[AIOrchestrator] Cache hit', { context: 'AI', data: { model } })
        return {
          content: cached,
          model,
          provider,
          latency: 0,
          cached: true,
        }
      }
    }
    
    let lastError: Error | null = null
    let attempt = 0
    
    while (attempt <= retries) {
      try {
        const response = await this.makeRequest(
          fullMessages,
          {
            model,
            provider,
            temperature,
            maxTokens,
            stream,
            onChunk,
            timeout,
          },
        )
        
        const latency = Date.now() - startTime
        this.requestCount++
        this.totalLatency += latency
        
        // Guardar en cache
        if (cache && !stream) {
          this.cache.set(fullMessages, model, response)
        }
        
        onComplete?.(response)
        
        logger.info('[AIOrchestrator] Respuesta generada', {
          context: 'AI',
          data: { model, provider, latency, attempt },
        })
        
        return {
          content: response,
          model,
          provider,
          latency,
          cached: false,
        }
        
      } catch (error) {
        lastError = error as Error
        attempt++
        
        logger.warn(`[AIOrchestrator] Intento ${attempt} fallido`, {
          context: 'AI',
          data: { model, error: (error as Error).message },
        })
        
        // Esperar antes de reintentar
        if (attempt <= retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt))
        }
      }
    }
    
    // Todos los intentos fallaron
    const fallbackResponse = await this.tryFallback(fullMessages, options)
    
    if (fallbackResponse) {
      return fallbackResponse
    }
    
    onError?.(lastError!)
    throw lastError
  }

  /**
   * Genera respuesta con streaming
   */
  async *stream(
    messages: AIMessage[],
    options: AICompletionOptions = {},
  ): AsyncGenerator<string> {
    const {
      model = DEFAULT_MODEL,
      provider = this.getProviderForModel(model),
      temperature = 0.7,
      maxTokens = 2048,
      systemPrompt,
    } = options
    
    const fullMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages
    
    // Por ahora usar API route para streaming
    const response = await fetch('/api/ai/conversational', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: fullMessages,
        model,
        temperature,
        maxTokens,
        stream: true,
      }),
    })
    
    if (!response.ok || !response.body) {
      throw new Error(`Stream failed: ${response.status}`)
    }
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        yield chunk
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Conversación con voz (STT -> AI -> TTS)
   */
  async converse(
    audioBlob: Blob,
    options: AICompletionOptions & VoiceOptions = {},
  ): Promise<{ text: string; audioUrl: string }> {
    // 1. Transcribir audio
    const transcription = await this.transcribe(audioBlob, options.language)
    
    // 2. Generar respuesta
    const response = await this.complete(
      [{ role: 'user', content: transcription }],
      options,
    )
    
    // 3. Sintetizar voz
    const audioUrl = await this.synthesize(response.content, options)
    
    return {
      text: response.content,
      audioUrl,
    }
  }

  /**
   * Transcribe audio a texto
   */
  async transcribe(audioBlob: Blob, language = 'es-MX'): Promise<string> {
    const formData = new FormData()
    formData.append('audio', audioBlob)
    formData.append('language', language)
    
    const response = await fetch('/api/voice/transcribe', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status}`)
    }
    
    const data = await response.json()
    return data.text
  }

  /**
   * Sintetiza texto a voz
   */
  async synthesize(text: string, options: VoiceOptions = {}): Promise<string> {
    const response = await fetch('/api/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: options.voice,
        emotion: options.emotion || 'neutral',
        speed: options.speed || 1.0,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Synthesis failed: ${response.status}`)
    }
    
    const audioBlob = await response.blob()
    return URL.createObjectURL(audioBlob)
  }

  /**
   * Obtiene estadísticas de uso
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      averageLatency: this.requestCount > 0 
        ? Math.round(this.totalLatency / this.requestCount)
        : 0,
    }
  }

  /**
   * Limpia el cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  // ─────────────────────────────────────────────────────────────────────
  // MÉTODOS PRIVADOS
  // ─────────────────────────────────────────────────────────────────────

  private getProviderForModel(model: string): AIProvider {
    return MODEL_PROVIDERS[model] || 'xai'
  }

  private async makeRequest(
    messages: AIMessage[],
    options: {
      model: string
      provider: AIProvider
      temperature: number
      maxTokens: number
      stream: boolean
      onChunk?: (chunk: string) => void
      timeout: number
    },
  ): Promise<string> {
    const { model, provider, temperature, maxTokens, stream, timeout } = options
    
    // Usar API route interno para manejar autenticación
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch('/api/ai/conversational', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model,
          provider,
          temperature,
          maxTokens,
          stream,
        }),
        signal: controller.signal,
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || `API Error: ${response.status}`)
      }
      
      if (stream && response.body) {
        return this.handleStream(response.body, options.onChunk)
      }
      
      const data = await response.json()
      return data.content || data.text || ''
      
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async handleStream(
    body: ReadableStream,
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let result = ''
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        result += chunk
        onChunk?.(chunk)
      }
    } finally {
      reader.releaseLock()
    }
    
    return result
  }

  private async tryFallback(
    messages: AIMessage[],
    options: AICompletionOptions,
  ): Promise<AIResponse | null> {
    const fallbackOrder: AIProvider[] = ['xai', 'openai', 'github', 'anthropic']
    const currentProvider = options.provider || this.getProviderForModel(options.model || DEFAULT_MODEL)
    
    for (const provider of fallbackOrder) {
      if (provider === currentProvider) continue
      
      try {
        logger.info(`[AIOrchestrator] Intentando fallback a ${provider}`, { context: 'AI' })
        
        // Seleccionar modelo del proveedor
        const fallbackModel = this.getDefaultModelForProvider(provider)
        
        return await this.complete(messages, {
          ...options,
          provider,
          model: fallbackModel,
          retries: 0, // Sin más reintentos en fallback
          cache: false,
        })
        
      } catch {
        continue
      }
    }
    
    return null
  }

  private getDefaultModelForProvider(provider: AIProvider): string {
    const defaults: Record<AIProvider, string> = {
      xai: AI_MODELS.GROK_2,
      openai: AI_MODELS.GPT_4O_MINI,
      anthropic: AI_MODELS.CLAUDE_HAIKU,
      google: AI_MODELS.GEMINI_FLASH,
      github: AI_MODELS.PHI_4,
    }
    return defaults[provider]
  }
}

// =====================================================================
// INSTANCIA SINGLETON
// =====================================================================

export const aiOrchestrator = new AIOrchestrator()

// =====================================================================
// EXPORTS
// =====================================================================

export { AIOrchestrator }
export default aiOrchestrator
