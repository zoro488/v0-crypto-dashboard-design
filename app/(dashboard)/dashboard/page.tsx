import { Suspense } from 'react'
import { DashboardClient } from './_components/DashboardClient'

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic'

// Loading skeleton
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
          <p className="text-violet-400/50">Cargando CHRONOS INFINITY...</p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient />
    </Suspense>
  )
}
