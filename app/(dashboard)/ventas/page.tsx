import { Suspense } from 'react'
import { VentasClient } from './_components/VentasClient'
import { LoadingSpinner } from '@/app/_components/ui/LoadingSpinner'

export const metadata = {
  title: 'Ventas | CHRONOS',
  description: 'Gestión de ventas y facturación',
}

export const dynamic = 'force-dynamic'

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
        <VentasClient />
      </Suspense>
    </div>
  )
}
