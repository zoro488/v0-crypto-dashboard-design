import { Suspense } from 'react'
import { db } from '@/database'
import { ordenesCompra, distribuidores } from '@/database/schema'
import { desc, eq, sql } from 'drizzle-orm'
import { OrdenesClient } from './_components/OrdenesClient'
import { LoadingSpinner } from '@/app/_components/ui/LoadingSpinner'

export const metadata = {
  title: 'Órdenes de Compra | CHRONOS',
  description: 'Gestión de órdenes de compra',
}

export const dynamic = 'force-dynamic'

async function OrdenesData() {
  try {
    const data = await db.query.ordenesCompra.findMany({
      orderBy: [desc(ordenesCompra.fecha)],
      with: {
        distribuidor: true,
      },
    })

    const distribuidoresData = await db.query.distribuidores.findMany()

    // Stats
    const totalOrdenes = data.length
    const pendientes = data.filter(o => o.estado === 'pendiente').length
    const parciales = data.filter(o => o.estado === 'parcial').length
    const completadas = data.filter(o => o.estado === 'completo').length
    const montoTotal = data.reduce((acc, o) => acc + (o.total || 0), 0)

    const stats = {
      totalOrdenes,
      pendientes,
      parciales,
      completadas,
      montoTotal,
    }

    return (
      <OrdenesClient 
        initialOrdenes={data}
        distribuidores={distribuidoresData}
        initialStats={stats}
      />
    )
  } catch (error) {
    console.error('Error cargando órdenes:', error)
    return (
      <OrdenesClient 
        initialOrdenes={[]} 
        distribuidores={[]}
        initialStats={{
          totalOrdenes: 0,
          pendientes: 0,
          parciales: 0,
          completadas: 0,
          montoTotal: 0,
        }}
      />
    )
  }
}

export default function OrdenesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Órdenes de Compra</h1>
          <p className="text-muted-foreground">
            Gestión de compras y pedidos a distribuidores
          </p>
        </div>
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <OrdenesData />
      </Suspense>
    </div>
  )
}
