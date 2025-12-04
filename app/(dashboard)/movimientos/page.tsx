import { Suspense } from 'react'
import { db } from '@/database'
import { movimientos, bancos } from '@/database/schema'
import { desc, eq } from 'drizzle-orm'
import { MovimientosClient } from './_components/MovimientosClient'
import { LoadingSpinner } from '@/app/_components/ui/LoadingSpinner'

export const metadata = {
  title: 'Movimientos | CHRONOS',
  description: 'Historial de movimientos financieros',
}

export const dynamic = 'force-dynamic'

async function MovimientosData() {
  try {
    const data = await db.query.movimientos.findMany({
      orderBy: [desc(movimientos.fecha)],
      limit: 100,
    })

    const bancosData = await db.query.bancos.findMany()

    return (
      <MovimientosClient 
        initialMovimientos={data}
        bancos={bancosData}
      />
    )
  } catch (error) {
    console.error('Error cargando movimientos:', error)
    return <MovimientosClient initialMovimientos={[]} bancos={[]} />
  }
}

export default function MovimientosPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimientos</h1>
          <p className="text-muted-foreground">
            Historial de transacciones y movimientos
          </p>
        </div>
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <MovimientosData />
      </Suspense>
    </div>
  )
}
