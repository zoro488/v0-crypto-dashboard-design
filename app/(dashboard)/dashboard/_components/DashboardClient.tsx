'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — DASHBOARD CLIENT
// Wrapper que carga el DashboardInfinity con 7 orbes 3D
// 100% basado en Zustand Store - sin dependencia de servidor
// ═══════════════════════════════════════════════════════════════

import dynamic from 'next/dynamic'

// Lazy load el componente Infinity para mejor performance (Three.js)
const DashboardInfinity = dynamic(
  () => import('@/app/_components/panels/DashboardInfinity'),
  { 
    ssr: false,
    loading: () => <DashboardSkeleton />,
  }
)

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-black p-8 animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 w-80 bg-gradient-to-r from-violet-500/20 to-gold-500/20 rounded-xl mb-8" />
      
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 bg-white/5 rounded-2xl border border-violet-500/10" />
        ))}
      </div>
      
      {/* 3D Canvas skeleton */}
      <div className="h-[600px] bg-gradient-to-b from-violet-900/10 to-black rounded-3xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-violet-400/50">Cargando orbes 3D...</p>
        </div>
      </div>
    </div>
  )
}

// El componente no necesita props - usa Zustand directamente
export function DashboardClient() {
  return <DashboardInfinity />
}

export default DashboardClient
