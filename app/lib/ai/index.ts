/**
 * 🎯 AI Services Index - CHRONOS System
 * 
 * Exporta todos los servicios de AI del sistema:
 * - AIOrchestrator: Motor unificado multi-provider
 * - useAI: Hook React para chat y voz
 * - Voice Services: Deepgram STT + ElevenLabs TTS
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

// =====================================================================
// CORE ORCHESTRATOR
// =====================================================================

export {
  aiOrchestrator,
  AIOrchestrator,
  AI_MODELS,
  DEFAULT_MODEL,
  type AIProvider,
  type AIMessage,
  type AICompletionOptions,
  type AIResponse,
  type VoiceOptions,
} from './orchestrator'

// =====================================================================
// REACT HOOKS
// =====================================================================

export {
  useAI,
  useAICompletion,
  type UseAIOptions,
  type UseAIReturn,
  type ChatMessage,
} from './useAI'

// =====================================================================
// VOICE SERVICES
// =====================================================================

export {
  // Deepgram STT
  DeepgramSTTClient,
  WebSpeechFallback,
  createDeepgramClient,
  type DeepgramConfig,
  type DeepgramState,
  type TranscriptionEvent,
  
  // ElevenLabs TTS  
  ElevenLabsTTSClient,
  createElevenLabsClient,
  detectEmotion,
  formatWithEmotionTags,
  VOICE_IDS,
  type ElevenLabsConfig,
  type ElevenLabsState,
  type ElevenLabsVoice,
  type VoiceEmotion,
  type VoiceMapping,
  
  // React Hooks
  useVoice,
  useVoiceRecognition,
  useTextToSpeech,
  type UseVoiceConfig,
  type UseVoiceReturn,
} from './voice'

// =====================================================================
// LEGACY EXPORTS (backwards compatibility)
// =====================================================================

export const GITHUB_MODELS = {
  AI21_JAMBA: 'ai21-labs/AI21-Jamba-1.5-Large',
  GPT4O: 'openai/gpt-4o',
  GPT4O_MINI: 'openai/gpt-4o-mini',
  CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',
  PHI4: 'microsoft/Phi-4',
} as const
