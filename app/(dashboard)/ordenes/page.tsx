import { Suspense } from 'react'
import { OrdenesClient } from './_components/OrdenesClient'
import { LoadingSpinner } from '@/app/_components/ui/LoadingSpinner'

export const metadata = {
  title: 'Órdenes de Compra | CHRONOS',
  description: 'Gestión de órdenes de compra',
}

export const dynamic = 'force-dynamic'

export default function OrdenesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Órdenes de Compra</h1>
          <p className="text-muted-foreground">
            Gestiona tus compras a distribuidores
          </p>
        </div>
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <OrdenesClient />
      </Suspense>
    </div>
  )
}
