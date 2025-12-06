import { Suspense } from 'react'
import { AlmacenClient } from './_components/AlmacenClient'
import { LoadingSpinner } from '@/app/_components/ui/LoadingSpinner'

export const metadata = {
  title: 'Almacén | CHRONOS',
  description: 'Gestión de inventario y stock',
}

export default function AlmacenPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Almacén</h1>
          <p className="text-muted-foreground">
            Gestión de inventario y control de stock
          </p>
        </div>
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <AlmacenClient />
      </Suspense>
    </div>
  )
}
