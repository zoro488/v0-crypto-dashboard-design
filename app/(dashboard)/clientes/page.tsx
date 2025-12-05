import { Suspense } from 'react'
import { ClientesClient } from './_components/ClientesClient'
import { LoadingSpinner } from '@/app/_components/ui/LoadingSpinner'

export const metadata = {
  title: 'Clientes | CHRONOS',
  description: 'Gestión de clientes y cartera',
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
        <ClientesClient />
      </Suspense>
    </div>
  )
}
