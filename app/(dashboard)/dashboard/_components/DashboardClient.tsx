'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — DASHBOARD CLIENT
// Wrapper que conecta data del server con el panel premium
// ═══════════════════════════════════════════════════════════════

import dynamic from 'next/dynamic'
import type { Banco } from '@/database/schema'

// Lazy load el componente premium para mejor performance
const DashboardPremium = dynamic(
  () => import('@/app/_components/panels/DashboardPremium'),
  { 
    ssr: false,
    loading: () => <DashboardSkeleton />,
  }
)

interface DashboardClientProps {
  initialData: {
    capital: {
      capitalTotal: number
      ingresosHistoricos: number
      gastosHistoricos: number
    }
    bancos: Banco[]
    stats: {
      totalVentas: number
      montoTotal: number
      montoPagado: number
      montoRestante: number
      ventasCompletas: number
      ventasParciales: number
      ventasPendientes: number
    } | null
  }
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-black p-8 animate-pulse">
      {/* Header skeleton */}
      <div className="h-12 w-64 bg-white/5 rounded-xl mb-8" />
      
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl" />
        ))}
      </div>
      
      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 h-[500px] bg-white/5 rounded-3xl" />
        <div className="h-[500px] bg-white/5 rounded-2xl" />
      </div>
    </div>
  )
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  return (
    <DashboardPremium
      capital={initialData.capital}
      bancos={initialData.bancos}
      stats={initialData.stats}
    />
  )
}

export default DashboardClient
