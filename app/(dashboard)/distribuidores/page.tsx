import { Suspense } from 'react'
import { db } from '@/database'
import { distribuidores, ordenesCompra } from '@/database/schema'
import { desc, eq, sql } from 'drizzle-orm'
import { DistribuidoresClient } from './_components/DistribuidoresClient'
import { LoadingSpinner } from '@/app/_components/ui/LoadingSpinner'

export const metadata = {
  title: 'Distribuidores | CHRONOS',
  description: 'Gestión de distribuidores y proveedores',
}

export const dynamic = 'force-dynamic'

async function DistribuidoresData() {
  try {
    const data = await db.query.distribuidores.findMany({
      orderBy: [desc(distribuidores.createdAt)],
    })

    // Stats
    const totalDistribuidores = data.length
    const activos = data.filter(d => d.estado === 'activo').length
    const saldoPendienteTotal = data.reduce((acc, d) => acc + (d.saldoPendiente || 0), 0)

    const stats = {
      totalDistribuidores,
      activos,
      inactivos: totalDistribuidores - activos,
      saldoPendienteTotal,
    }

    return (
      <DistribuidoresClient 
        initialDistribuidores={data}
        initialStats={stats}
      />
    )
  } catch (error) {
    console.error('Error cargando distribuidores:', error)
    return (
      <DistribuidoresClient 
        initialDistribuidores={[]} 
        initialStats={{
          totalDistribuidores: 0,
          activos: 0,
          inactivos: 0,
          saldoPendienteTotal: 0,
        }}
      />
    )
  }
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
        <DistribuidoresData />
      </Suspense>
    </div>
  )
}
