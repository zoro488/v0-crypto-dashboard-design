/**
 * Mock type declarations for AI SDK
 * Provides type safety without requiring the actual AI SDK runtime
 */

/* eslint-disable no-unused-vars */

declare module 'ai' {
  /**
   * Message type for AI conversations
   */
  export interface Message {
    id: string
    role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
    content: string
    createdAt?: Date
    name?: string
    function_call?: {
      name: string
      arguments: string
    }
    tool_calls?: Array<{
      id: string
      type: 'function'
      function: {
        name: string
        arguments: string
      }
    }>
  }

  /**
   * Core message types for internal use
   */
  export interface CoreMessage {
    role: 'user' | 'assistant' | 'system' | 'tool'
    content: string | Array<{
      type: 'text' | 'image' | 'tool-call' | 'tool-result'
      text?: string
      toolCallId?: string
      toolName?: string
      result?: unknown
    }>
  }

  /**
   * Options for streamText function
   */
  export interface StreamTextOptions {
    model: unknown
    messages: Array<Message | CoreMessage>
    system?: string
    temperature?: number
    maxTokens?: number
    topP?: number
    topK?: number
    frequencyPenalty?: number
    presencePenalty?: number
    seed?: number
    tools?: Record<string, unknown>
    toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } }
    onFinish?: (event: {
      finishReason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other'
      usage: { promptTokens: number; completionTokens: number; totalTokens: number }
      text: string
    }) => void | Promise<void>
  }

  /**
   * Result from streamText function
   */
  export interface StreamTextResult {
    textStream: AsyncIterable<string>
    toDataStreamResponse: () => Response
    toTextStreamResponse: () => Response
    text: Promise<string>
    usage: Promise<{
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }>
    finishReason: Promise<'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other'>
    toolCalls: Promise<Array<{
      toolCallId: string
      toolName: string
      args: unknown
    }>>
    toolResults: Promise<Array<{
      toolCallId: string
      result: unknown
    }>>
  }

  /**
   * Options for generateText function
   */
  export interface GenerateTextOptions {
    model: unknown
    messages?: Array<Message | CoreMessage>
    prompt?: string
    system?: string
    temperature?: number
    maxTokens?: number
    topP?: number
    topK?: number
    frequencyPenalty?: number
    presencePenalty?: number
    seed?: number
    tools?: Record<string, unknown>
    toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } }
  }

  /**
   * Result from generateText function
   */
  export interface GenerateTextResult {
    text: string
    finishReason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other'
    usage: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
    toolCalls: Array<{
      toolCallId: string
      toolName: string
      args: unknown
    }>
    toolResults: Array<{
      toolCallId: string
      result: unknown
    }>
    response: {
      id: string
      model: string
      timestamp: Date
    }
  }

  /**
   * Stream text with an AI model
   */
  export function streamText(options: StreamTextOptions): StreamTextResult

  /**
   * Generate text with an AI model
   */
  export function generateText(options: GenerateTextOptions): Promise<GenerateTextResult>

  /**
   * Convert messages to core messages format
   */
  export function convertToCoreMessages(messages: Message[]): CoreMessage[]
}

declare module '@ai-sdk/openai' {
  /**
   * OpenAI model options
   */
  export interface OpenAIModelOptions {
    /**
     * Base URL for API requests
     */
    baseURL?: string
    /**
     * API key for authentication
     */
    apiKey?: string
    /**
     * Organization ID
     */
    organization?: string
    /**
     * Custom fetch implementation
     */
    fetch?: typeof globalThis.fetch
    /**
     * Custom headers
     */
    headers?: Record<string, string>
  }

  /**
   * OpenAI provider instance
   */
  export interface OpenAIProvider {
    /**
     * Create a chat model
     */
    (modelId: string, settings?: {
      temperature?: number
      maxTokens?: number
      topP?: number
      frequencyPenalty?: number
      presencePenalty?: number
      seed?: number
      user?: string
    }): unknown

    /**
     * Create a chat completion model
     */
    chat: (modelId: string, settings?: {
      temperature?: number
      maxTokens?: number
      topP?: number
      frequencyPenalty?: number
      presencePenalty?: number
      seed?: number
      user?: string
    }) => unknown

    /**
     * Create a completion model (legacy)
     */
    completion: (modelId: string, settings?: {
      temperature?: number
      maxTokens?: number
      topP?: number
      frequencyPenalty?: number
      presencePenalty?: number
      seed?: number
      user?: string
      echo?: boolean
      logitBias?: Record<string, number>
      logprobs?: number
      suffix?: string
    }) => unknown

    /**
     * Create an embedding model
     */
    embedding: (modelId: string, settings?: {
      dimensions?: number
      user?: string
    }) => unknown

    /**
     * Create a text embedding model (alias for embedding)
     */
    textEmbedding: (modelId: string, settings?: {
      dimensions?: number
      user?: string
    }) => unknown
  }

  /**
   * Create an OpenAI provider
   */
  export function createOpenAI(options?: OpenAIModelOptions): OpenAIProvider

  /**
   * Default OpenAI provider instance
   */
  export const openai: OpenAIProvider
}
