import { Suspense } from 'react'
import { DistribuidoresClient } from './_components/DistribuidoresClient'
import { LoadingSpinner } from '@/app/_components/ui/LoadingSpinner'

export const metadata = {
  title: 'Distribuidores | CHRONOS',
  description: 'Gestión de distribuidores y proveedores',
}

export default function DistribuidoresPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Distribuidores</h1>
          <p className="text-muted-foreground">
            Gestión de proveedores y distribuidores
          </p>
        </div>
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <DistribuidoresClient />
      </Suspense>
    </div>
  )
}
