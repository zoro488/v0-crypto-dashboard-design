import { Suspense } from 'react'
import { getCapitalTotal, getBancos, getVentasStats } from '@/app/_actions'
import { DashboardClient } from './_components/DashboardClient'

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic'

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      <div className="h-10 w-64 bg-zinc-900 rounded-lg" />
      
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-zinc-900 rounded-2xl" />
        ))}
      </div>
      
      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-zinc-900 rounded-2xl" />
        <div className="h-96 bg-zinc-900 rounded-2xl" />
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  // Fetch all data in parallel on the server
  const [capitalResult, bancosResult, statsResult] = await Promise.all([
    getCapitalTotal(),
    getBancos(),
    getVentasStats(),
  ])

  const initialData = {
    capital: capitalResult.success ? capitalResult.data : { capitalTotal: 0, ingresosHistoricos: 0, gastosHistoricos: 0 },
    bancos: bancosResult.success ? bancosResult.data : [],
    stats: statsResult.success ? statsResult.data : null,
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient initialData={initialData} />
    </Suspense>
  )
}
