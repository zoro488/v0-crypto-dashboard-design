import { Suspense } from 'react'
import { getVentas, getVentasStats } from '@/app/_actions/ventas'
import { getBancos } from '@/app/_actions/bancos'
import { VentasClient } from './_components/VentasClient'
import { LoadingSpinner } from '@/app/_components/ui/LoadingSpinner'

export const metadata = {
  title: 'Ventas | CHRONOS',
  description: 'Gestión de ventas y facturación',
}

export const dynamic = 'force-dynamic'

async function VentasData() {
  const [ventasResult, statsResult, bancosResult] = await Promise.all([
    getVentas(),
    getVentasStats(),
    getBancos(),
  ])

  const ventas = ventasResult.success ? ventasResult.data : []
  const stats = statsResult.success ? statsResult.data : null
  const bancos = bancosResult.success ? bancosResult.data : []

  return (
    <VentasClient 
      initialVentas={ventas ?? []}
      initialStats={stats}
      bancos={bancos ?? []}
    />
  )
}

export default function VentasPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">
            Gestiona tus ventas, facturación y cobros
          </p>
        </div>
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <VentasData />
      </Suspense>
    </div>
  )
}
