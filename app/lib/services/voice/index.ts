/**
 * 🎙️ Voice Services - Servicios de Voz para CHRONOS
 * 
 * Exporta todos los servicios relacionados con voz:
 * - VoiceEngine: Motor de reconocimiento y síntesis
 * - ConversationalAIEngine: Motor de IA conversacional
 */

export {
  VoiceEngine,
  getVoiceEngine,
  destroyVoiceEngine,
  type VoiceState,
  type VoiceConfig,
  type VoiceEvent,
  type VoiceEventHandler,
} from './VoiceEngine'

export {
  ConversationalAIEngine,
  getConversationalAI,
  type ConversationMessage,
  type ConversationContext,
  type AIResponse,
  type IntentResult,
} from './ConversationalAIEngine'
