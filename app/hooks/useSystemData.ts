/**
 * 🔄 HOOK DE SINCRONIZACIÓN DE DATOS DEL SISTEMA
 * 
 * Este hook centraliza todos los datos del sistema y los sincroniza
 * con el store de Zustand para mantener una única fuente de verdad.
 * 
 * Características:
 * - Carga paralela de todas las colecciones críticas
 * - Sincronización bidireccional con Zustand
 * - Cálculo automático de KPIs
 * - Manejo de estados de carga
 */

"use client"

import { useEffect, useMemo, useCallback } from 'react'
import { useFirestoreCRUD } from '@/app/hooks/useFirestoreCRUD'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { 
  useAlmacenData, 
  useVentasData, 
  useClientesData, 
  useDistribuidoresData,
  useOrdenesCompraData,
  useBancoData
} from '@/app/lib/firebase/firestore-hooks.service'

// ===================================================================
// TIPOS
// ===================================================================

interface KPIs {
  totalRevenue: number
  totalGastos: number
  netProfit: number
  totalStock: number
  totalStockValue: number
  activeClients: number
  activeDistributors: number
  pendingOrders: number
  pendingPayments: number
  todaySales: number
  monthSales: number
}

interface SystemDataResult {
  // Datos
  productos: Array<{ id: string; nombre?: string; stock?: number; stockActual?: number; valorUnitario?: number; precioVenta?: number; [key: string]: unknown }>
  ventas: Array<{ id: string; fecha?: string; total?: number; montoPagado?: number; montoRestante?: number; estado?: string; [key: string]: unknown }>
  clientes: Array<{ id: string; nombre?: string; deudaTotal?: number; [key: string]: unknown }>
  distribuidores: Array<{ id: string; nombre?: string; deudaTotal?: number; totalOrdenesCompra?: number; [key: string]: unknown }>
  ordenesCompra: Array<{ id: string; estado?: string; costoTotal?: number; deuda?: number; [key: string]: unknown }>
  
  // KPIs calculados
  kpis: KPIs
  
  // Estados
  isLoading: boolean
  hasError: boolean
  errors: string[]
  
  // Acciones
  refreshAll: () => Promise<void>
}

// ===================================================================
// HOOK PRINCIPAL
// ===================================================================

export function useSystemData(): SystemDataResult {
  // Cargar datos de Firestore
  const { data: productosRaw, loading: loadingProd, error: errorProd, refresh: refreshProd } = useAlmacenData()
  const { data: ventasRaw, loading: loadingVentas, error: errorVentas, refresh: refreshVentas } = useVentasData()
  const { data: clientesRaw, loading: loadingClientes, error: errorClientes, refresh: refreshClientes } = useClientesData()
  const { data: distribuidoresRaw, loading: loadingDist, error: errorDist, refresh: refreshDist } = useDistribuidoresData()
  const { data: ordenesCompraRaw, loading: loadingOC, error: errorOC, refresh: refreshOC } = useOrdenesCompraData()
  
  // Castear datos con tipos seguros (los docs de Firestore siempre tienen id)
  const productos = productosRaw as SystemDataResult['productos']
  const ventas = ventasRaw as SystemDataResult['ventas']
  const clientes = clientesRaw as SystemDataResult['clientes']
  const distribuidores = distribuidoresRaw as SystemDataResult['distribuidores']
  const ordenesCompra = ordenesCompraRaw as SystemDataResult['ordenesCompra']
  
  // Store de Zustand para sincronización
  const bancos = useAppStore((state) => state.bancos)
  
  // Estados agregados
  const isLoading = loadingProd || loadingVentas || loadingClientes || loadingDist || loadingOC
  const errors = [errorProd, errorVentas, errorClientes, errorDist, errorOC].filter(Boolean) as string[]
  const hasError = errors.length > 0

  // Calcular KPIs
  const kpis = useMemo((): KPIs => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    
    // Revenue total de ventas completadas
    const totalRevenue = ventas.reduce((acc, v) => {
      const total = typeof v.total === 'number' ? v.total : 
                    typeof v.precioTotalVenta === 'number' ? v.precioTotalVenta : 0
      return acc + total
    }, 0)
    
    // Gastos totales (de órdenes de compra)
    const totalGastos = ordenesCompra.reduce((acc, oc) => {
      const costo = typeof oc.costoTotal === 'number' ? oc.costoTotal : 0
      return acc + costo
    }, 0)
    
    // Stock total y valor
    const stockData = productos.reduce((acc, p) => {
      const stock = typeof p.stockActual === 'number' ? p.stockActual : 
                   typeof p.stock === 'number' ? p.stock : 0
      const valor = typeof p.valorUnitario === 'number' ? p.valorUnitario : 
                   typeof p.precioVenta === 'number' ? p.precioVenta : 0
      return {
        total: acc.total + stock,
        value: acc.value + (stock * valor)
      }
    }, { total: 0, value: 0 })
    
    // Deudas pendientes de clientes
    const pendingPayments = clientes.reduce((acc, c) => {
      const deuda = typeof c.deudaTotal === 'number' ? c.deudaTotal : 0
      return acc + deuda
    }, 0)
    
    // Órdenes pendientes
    const pendingOrders = ordenesCompra.filter(oc => 
      oc.estado === 'pendiente' || oc.estado === 'parcial'
    ).length
    
    // Ventas de hoy
    const todaySales = ventas.filter(v => {
      const fecha = v.fecha ? new Date(v.fecha as string).getTime() : 0
      return fecha >= todayStart
    }).reduce((acc, v) => {
      const total = typeof v.total === 'number' ? v.total : 
                    typeof v.precioTotalVenta === 'number' ? v.precioTotalVenta : 0
      return acc + total
    }, 0)
    
    // Ventas del mes
    const monthSales = ventas.filter(v => {
      const fecha = v.fecha ? new Date(v.fecha as string).getTime() : 0
      return fecha >= monthStart
    }).reduce((acc, v) => {
      const total = typeof v.total === 'number' ? v.total : 
                    typeof v.precioTotalVenta === 'number' ? v.precioTotalVenta : 0
      return acc + total
    }, 0)
    
    return {
      totalRevenue,
      totalGastos,
      netProfit: totalRevenue - totalGastos,
      totalStock: stockData.total,
      totalStockValue: stockData.value,
      activeClients: clientes.length,
      activeDistributors: distribuidores.length,
      pendingOrders,
      pendingPayments,
      todaySales,
      monthSales
    }
  }, [productos, ventas, clientes, distribuidores, ordenesCompra])
  
  // Función para refrescar todo
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshProd(),
      refreshVentas(),
      refreshClientes(),
      refreshDist(),
      refreshOC()
    ])
  }, [refreshProd, refreshVentas, refreshClientes, refreshDist, refreshOC])
  
  return {
    productos,
    ventas,
    clientes,
    distribuidores,
    ordenesCompra,
    kpis,
    isLoading,
    hasError,
    errors,
    refreshAll
  }
}

// ===================================================================
// HOOKS ESPECÍFICOS PARA PANELES
// ===================================================================

/**
 * Hook para el Dashboard principal
 */
export function useDashboardStats() {
  const { kpis, isLoading, ventas, productos } = useSystemData()
  const bancos = useAppStore((state) => state.bancos)
  
  // Capital total de todos los bancos
  const capitalTotal = bancos.reduce((acc, b) => acc + b.saldo, 0)
  
  // Productos con stock bajo
  const lowStockProducts = productos.filter(p => {
    const stock = typeof p.stockActual === 'number' ? p.stockActual : 
                 typeof p.stock === 'number' ? p.stock : 0
    return stock < 10 && stock > 0
  })
  
  // Productos sin stock
  const outOfStockProducts = productos.filter(p => {
    const stock = typeof p.stockActual === 'number' ? p.stockActual : 
                 typeof p.stock === 'number' ? p.stock : 0
    return stock <= 0
  })
  
  // Últimas 5 ventas
  const recentSales = ventas.slice(0, 5)
  
  return {
    ...kpis,
    capitalTotal,
    lowStockProducts,
    outOfStockProducts,
    recentSales,
    isLoading
  }
}

/**
 * Hook para el panel de Bancos
 */
export function useBancosData(bancoId: string) {
  const { data: movimientos, stats, loading, refresh } = useBancoData(bancoId)
  
  return {
    movimientos,
    stats,
    loading,
    refresh
  }
}

/**
 * Hook para el panel de Almacén
 */
export function useAlmacenStats() {
  const { productos, isLoading } = useSystemData()
  
  const stats = useMemo(() => {
    let totalItems = 0
    let totalValue = 0
    let categorias: Record<string, number> = {}
    
    productos.forEach(p => {
      const stock = typeof p.stockActual === 'number' ? p.stockActual : 
                   typeof p.stock === 'number' ? p.stock : 0
      const valor = typeof p.valorUnitario === 'number' ? p.valorUnitario : 0
      const categoria = typeof p.categoria === 'string' ? p.categoria : 'Sin categoría'
      
      totalItems += stock
      totalValue += stock * valor
      categorias[categoria] = (categorias[categoria] || 0) + stock
    })
    
    return {
      totalItems,
      totalValue,
      categorias,
      productCount: productos.length
    }
  }, [productos])
  
  return {
    productos,
    stats,
    isLoading
  }
}

/**
 * Hook para el panel de Ventas
 */
export function useVentasStats() {
  const { ventas, clientes, isLoading } = useSystemData()
  
  const stats = useMemo(() => {
    const completadas = ventas.filter(v => v.estadoPago === 'completo' || v.estado === 'completada')
    const pendientes = ventas.filter(v => v.estadoPago === 'pendiente' || v.estadoPago === 'parcial')
    
    const totalVendido = ventas.reduce((acc, v) => {
      const total = typeof v.total === 'number' ? v.total : 
                    typeof v.precioTotalVenta === 'number' ? v.precioTotalVenta : 0
      return acc + total
    }, 0)
    
    const totalCobrado = ventas.reduce((acc, v) => {
      const pagado = typeof v.montoPagado === 'number' ? v.montoPagado : 0
      return acc + pagado
    }, 0)
    
    const totalPorCobrar = ventas.reduce((acc, v) => {
      const restante = typeof v.montoRestante === 'number' ? v.montoRestante : 0
      return acc + restante
    }, 0)
    
    return {
      totalVentas: ventas.length,
      completadas: completadas.length,
      pendientes: pendientes.length,
      totalVendido,
      totalCobrado,
      totalPorCobrar
    }
  }, [ventas])
  
  return {
    ventas,
    clientes,
    stats,
    isLoading
  }
}

export default useSystemData
