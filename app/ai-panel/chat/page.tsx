'use client'

/**
 * 💬 Página del Chat Inmersivo - Modo Zen
 * Interfaz de conversación de pantalla completa
 */

import dynamic from 'next/dynamic'

// Importar dinámicamente para evitar SSR
const ImmersiveAIChat = dynamic(
  () => import('@/app/components/ai/ImmersiveAIChat'),
  { ssr: false },
)

export default function AIChatPage() {
  return <ImmersiveAIChat />
}
