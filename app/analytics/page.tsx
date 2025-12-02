'use client'

import { AdvancedAnalyticsPanel } from '@/app/components/panels/AdvancedAnalyticsPanel'
import { useFirestoreCRUD } from '@/app/hooks/useFirestoreCRUD'
import { useAppStore } from '@/app/lib/store/useAppStore'
import type { Venta, Cliente, OrdenCompra } from '@/app/types'
import { Loader2 } from 'lucide-react'

export default function AnalyticsPage() {
  // Obtener datos en tiempo real de Firestore
  const { data: ventas, loading: loadingVentas } = useFirestoreCRUD<Venta>('ventas')
  const { data: clientes, loading: loadingClientes } = useFirestoreCRUD<Cliente>('clientes')
  const { data: ordenes, loading: loadingOrdenes } = useFirestoreCRUD<OrdenCompra>('ordenes_compra')
  const { bancos } = useAppStore()

  // Loading state
  if (loadingVentas || loadingClientes || loadingOrdenes) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold text-white">Cargando Analytics...</p>
          <p className="text-white/60 mt-2">Procesando datos del sistema</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <AdvancedAnalyticsPanel
        ventas={ventas}
        clientes={clientes}
        ordenes={ordenes}
        bancos={bancos}
      />
    </div>
  )
}
