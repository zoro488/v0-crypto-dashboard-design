'use client'

/**
 * 🤖 Página del Panel IA - Neural Hub Principal
 * Centro de comando con partículas GPU y paneles satélite
 */

import dynamic from 'next/dynamic'

// Importar dinámicamente para evitar SSR con WebGL
const AINeuralHub = dynamic(
  () => import('@/app/components/ai/AINeuralHub'),
  { ssr: false },
)

export default function AIPanelPage() {
  return <AINeuralHub />
}
