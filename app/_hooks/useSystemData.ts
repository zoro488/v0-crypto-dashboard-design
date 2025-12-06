'use client'

import { useBancos } from './useBancos'
import { useVentas } from './useVentas'
import { useClientes } from './useClientes'
import { useDistribuidores } from './useDistribuidores'
import { useOrdenes } from './useOrdenes'
import { useAlmacen } from './useAlmacen'

// ═══════════════════════════════════════════════════════════════
// HOOK: useSystemData - Datos combinados del sistema
// ═══════════════════════════════════════════════════════════════

export function useSystemData() {
  const bancosQuery = useBancos()
  const ventasQuery = useVentas()
  const clientesQuery = useClientes()
  const distribuidoresQuery = useDistribuidores()
  const ordenesQuery = useOrdenes()
  const almacenQuery = useAlmacen()

  const loading = 
    bancosQuery.loading || 
    ventasQuery.loading || 
    clientesQuery.loading || 
    distribuidoresQuery.loading ||
    ordenesQuery.loading ||
    almacenQuery.loading

  const error = 
    bancosQuery.error || 
    ventasQuery.error || 
    clientesQuery.error || 
    distribuidoresQuery.error ||
    ordenesQuery.error ||
    almacenQuery.error

  const refetchAll = async () => {
    await Promise.all([
      bancosQuery.refetch(),
      ventasQuery.refetch(),
      clientesQuery.refetch(),
      distribuidoresQuery.refetch(),
      ordenesQuery.refetch(),
      almacenQuery.refetch(),
    ])
  }

  // Calcular estadísticas
  const capitalTotal = bancosQuery.bancos.reduce((sum, b) => sum + (b.capitalActual || 0), 0)
  const ventasTotales = ventasQuery.ventas.reduce((sum, v) => sum + (v.precioTotalVenta || 0), 0)
  const ventasPendientes = ventasQuery.ventas
    .filter(v => v.estadoPago !== 'completo')
    .reduce((sum, v) => sum + (v.montoRestante || 0), 0)

  return {
    // Datos
    bancos: bancosQuery.bancos,
    ventas: ventasQuery.ventas,
    clientes: clientesQuery.clientes,
    distribuidores: distribuidoresQuery.distribuidores,
    ordenes: ordenesQuery.ordenes,
    productos: almacenQuery.productos,
    
    // Estado
    loading,
    error,
    refetchAll,
    
    // Estadísticas
    stats: {
      capitalTotal,
      ventasTotales,
      ventasPendientes,
      totalClientes: clientesQuery.clientes.length,
      totalDistribuidores: distribuidoresQuery.distribuidores.length,
      totalProductos: almacenQuery.productos.length,
    },
    
    // Refresh individual (para compatibilidad)
    refresh: {
      bancos: bancosQuery.refetch,
      ventas: ventasQuery.refetch,
      clientes: clientesQuery.refetch,
      distribuidores: distribuidoresQuery.refetch,
      ordenes: ordenesQuery.refetch,
      productos: almacenQuery.refetch,
    },
  }
}
