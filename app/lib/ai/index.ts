/**
 * 🎯 AI Services Index
 * Exporta todos los servicios de AI del sistema CHRONOS
 */

// Re-exports se harán cuando los módulos estén disponibles
// Por ahora exportamos tipos placeholder

export type AIProvider = 'github' | 'openai' | 'anthropic' | 'xai' | 'google';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Placeholder exports - se implementarán con los módulos reales
export const GITHUB_MODELS = {
  AI21_JAMBA: 'ai21-labs/AI21-Jamba-1.5-Large',
  GPT4O: 'openai/gpt-4o',
  GPT4O_MINI: 'openai/gpt-4o-mini',
  CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',
  PHI4: 'microsoft/Phi-4',
} as const

export const AI_MODELS = {
  GROK_2: 'grok-2-1212',
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  CLAUDE_SONNET: 'claude-3-5-sonnet-20241022',
  GEMINI_PRO: 'gemini-1.5-pro',
} as const
