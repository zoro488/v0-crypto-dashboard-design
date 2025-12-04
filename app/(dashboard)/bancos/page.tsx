import { Suspense } from 'react'
import { getBancos, getCapitalTotal } from '@/app/_actions/bancos'
import { BancosClient } from './_components/BancosClient'
import { LoadingSpinner } from '@/app/_components/ui/LoadingSpinner'

export const metadata = {
  title: 'Bancos | CHRONOS',
  description: 'Gestión de bancos y bóvedas',
}

export const dynamic = 'force-dynamic'

async function BancosData() {
  const [bancosResult, capitalResult] = await Promise.all([
    getBancos(),
    getCapitalTotal(),
  ])

  const bancos = bancosResult.success ? bancosResult.data : []
  const capital = capitalResult.success ? capitalResult.data : null

  return (
    <BancosClient 
      initialBancos={bancos ?? []}
      capitalTotal={capital?.capitalTotal ?? 0}
      historicoIngresos={capital?.ingresosHistoricos ?? 0}
      historicoGastos={capital?.gastosHistoricos ?? 0}
    />
  )
}

export default function BancosPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bancos & Bóvedas</h1>
          <p className="text-muted-foreground">
            Control y distribución de capital
          </p>
        </div>
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <BancosData />
      </Suspense>
    </div>
  )
}
