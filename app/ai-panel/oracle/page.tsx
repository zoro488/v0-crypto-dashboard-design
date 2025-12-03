'use client'

/**
 * 🔮 Página del Oracle View - Insights y Anomalías
 * Radar de detección y simulador de escenarios
 */

import dynamic from 'next/dynamic'

// Importar dinámicamente para evitar SSR con WebGL
const AIInsightsDashboard = dynamic(
  () => import('@/app/components/ai/AIInsightsDashboard'),
  { ssr: false }
)

export default function OraclePage() {
  return <AIInsightsDashboard />
}
