import { Suspense } from 'react'
import { getClientes, getClientesStats } from '@/app/_actions/clientes'
import { ClientesClient } from './_components/ClientesClient'
import { LoadingSpinner } from '@/app/_components/ui/LoadingSpinner'

export const metadata = {
  title: 'Clientes | CHRONOS',
  description: 'Gestión de clientes y cartera',
}

export const dynamic = 'force-dynamic'

async function ClientesData() {
  const [clientesResult, statsResult] = await Promise.all([
    getClientes(),
    getClientesStats(),
  ])

  const clientes = clientesResult.success ? clientesResult.data : []
  const stats = statsResult.success ? statsResult.data : null

  return (
    <ClientesClient 
      initialClientes={clientes ?? []}
      initialStats={stats}
    />
  )
}

export default function ClientesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu cartera de clientes
          </p>
        </div>
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <ClientesData />
      </Suspense>
    </div>
  )
}
