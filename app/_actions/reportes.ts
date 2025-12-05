'use server'

import { db } from '@/database'
import { bancos, ventas, clientes, distribuidores, ordenesCompra, movimientos, almacen } from '@/database/schema'
import { eq, sql, desc, and, between, gte, lte } from 'drizzle-orm'
import { FiltrosReporteSchema, type FiltrosReporte } from './types'

// ═══════════════════════════════════════════════════════════════
// REPORTES DE DASHBOARD
// ═══════════════════════════════════════════════════════════════

/**
 * Obtener resumen general del dashboard
 */
export async function getDashboardResumen() {
  try {
    // Capital total de todos los bancos
    const [capitalData] = await db
      .select({
        capitalTotal: sql<number>`sum(${bancos.capitalActual})`,
        ingresosHistoricos: sql<number>`sum(${bancos.historicoIngresos})`,
        gastosHistoricos: sql<number>`sum(${bancos.historicoGastos})`,
      })
      .from(bancos)
      .where(eq(bancos.activo, true))

    // Ventas del mes actual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const [ventasMes] = await db
      .select({
        total: sql<number>`sum(${ventas.precioTotalVenta})`,
        cantidad: sql<number>`count(*)`,
        cobrado: sql<number>`sum(${ventas.montoPagado})`,
      })
      .from(ventas)
      .where(gte(ventas.fecha, inicioMes))

    // Clientes activos
    const [clientesActivos] = await db
      .select({
        cantidad: sql<number>`count(*)`,
      })
      .from(clientes)
      .where(eq(clientes.estado, 'activo'))

    // Saldos pendientes totales
    const [saldosPendientes] = await db
      .select({
        clientes: sql<number>`sum(${clientes.saldoPendiente})`,
      })
      .from(clientes)

    const [ordenesData] = await db
      .select({
        pendientes: sql<number>`sum(case when ${ordenesCompra.estado} = 'pendiente' then ${ordenesCompra.montoRestante} else 0 end)`,
      })
      .from(ordenesCompra)

    // Alertas
    const [productosBajoStock] = await db
      .select({
        cantidad: sql<number>`count(*)`,
      })
      .from(almacen)
      .where(sql`${almacen.cantidad} <= ${almacen.minimo}`)

    const [ventasPendientes] = await db
      .select({
        cantidad: sql<number>`count(*)`,
      })
      .from(ventas)
      .where(eq(ventas.estadoPago, 'pendiente'))

    return {
      success: true,
      data: {
        capital: {
          total: capitalData.capitalTotal || 0,
          ingresosHistoricos: capitalData.ingresosHistoricos || 0,
          gastosHistoricos: capitalData.gastosHistoricos || 0,
        },
        ventasMes: {
          total: ventasMes.total || 0,
          cantidad: ventasMes.cantidad || 0,
          cobrado: ventasMes.cobrado || 0,
        },
        clientesActivos: clientesActivos.cantidad || 0,
        saldosPendientes: {
          clientes: saldosPendientes.clientes || 0,
          ordenes: ordenesData.pendientes || 0,
        },
        alertas: {
          productosBajoStock: productosBajoStock.cantidad || 0,
          ventasPendientes: ventasPendientes.cantidad || 0,
        },
      },
    }
  } catch (error) {
    console.error('Error obteniendo resumen dashboard:', error)
    return { error: 'Error al obtener resumen' }
  }
}

/**
 * Obtener reporte de ventas por período
 */
export async function getReporteVentas(filtros: FiltrosReporte) {
  try {
    const conditions = [
      between(ventas.fecha, filtros.fechaInicio, filtros.fechaFin)
    ]

    if (filtros.clienteId) {
      conditions.push(eq(ventas.clienteId, filtros.clienteId))
    }

    // Totales generales
    const [totales] = await db
      .select({
        totalVentas: sql<number>`sum(${ventas.precioTotalVenta})`,
        totalCobrado: sql<number>`sum(${ventas.montoPagado})`,
        totalPendiente: sql<number>`sum(${ventas.montoRestante})`,
        cantidadVentas: sql<number>`count(*)`,
        cantidadUnidades: sql<number>`sum(${ventas.cantidad})`,
        utilidadBruta: sql<number>`sum(${ventas.montoUtilidades})`,
      })
      .from(ventas)
      .where(and(...conditions))

    // Ventas por estado
    const ventasPorEstado = await db
      .select({
        estado: ventas.estadoPago,
        cantidad: sql<number>`count(*)`,
        monto: sql<number>`sum(${ventas.precioTotalVenta})`,
      })
      .from(ventas)
      .where(and(...conditions))
      .groupBy(ventas.estadoPago)

    // Ventas por cliente (top 10)
    const ventasPorCliente = await db
      .select({
        clienteId: ventas.clienteId,
        clienteNombre: clientes.nombre,
        cantidad: sql<number>`count(*)`,
        total: sql<number>`sum(${ventas.precioTotalVenta})`,
      })
      .from(ventas)
      .innerJoin(clientes, eq(ventas.clienteId, clientes.id))
      .where(and(...conditions))
      .groupBy(ventas.clienteId, clientes.nombre)
      .orderBy(sql`sum(${ventas.precioTotalVenta}) desc`)
      .limit(10)

    // Ventas por día
    const ventasPorDia = await db
      .select({
        fecha: sql<string>`date(${ventas.fecha})`,
        cantidad: sql<number>`count(*)`,
        total: sql<number>`sum(${ventas.precioTotalVenta})`,
      })
      .from(ventas)
      .where(and(...conditions))
      .groupBy(sql`date(${ventas.fecha})`)
      .orderBy(sql`date(${ventas.fecha})`)

    return {
      success: true,
      data: {
        totales: {
          totalVentas: totales.totalVentas || 0,
          totalCobrado: totales.totalCobrado || 0,
          totalPendiente: totales.totalPendiente || 0,
          cantidadVentas: totales.cantidadVentas || 0,
          cantidadUnidades: totales.cantidadUnidades || 0,
          utilidadBruta: totales.utilidadBruta || 0,
        },
        porEstado: ventasPorEstado,
        porCliente: ventasPorCliente,
        porDia: ventasPorDia,
      },
    }
  } catch (error) {
    console.error('Error generando reporte de ventas:', error)
    return { error: 'Error al generar reporte' }
  }
}

/**
 * Obtener reporte de bancos/bóvedas
 */
export async function getReporteBancos(filtros: FiltrosReporte) {
  try {
    // Estado actual de los bancos
    const bancosActuales = await db.query.bancos.findMany({
      where: eq(bancos.activo, true),
      orderBy: [bancos.orden],
    })

    // Movimientos por banco en el período
    const conditions = [
      between(movimientos.fecha, filtros.fechaInicio, filtros.fechaFin)
    ]

    if (filtros.bancoId) {
      conditions.push(eq(movimientos.bancoId, filtros.bancoId))
    }

    const movimientosPorBanco = await db
      .select({
        bancoId: movimientos.bancoId,
        ingresos: sql<number>`sum(case when ${movimientos.tipo} in ('ingreso', 'abono', 'transferencia_entrada') then ${movimientos.monto} else 0 end)`,
        gastos: sql<number>`sum(case when ${movimientos.tipo} in ('gasto', 'pago', 'transferencia_salida') then ${movimientos.monto} else 0 end)`,
        operaciones: sql<number>`count(*)`,
      })
      .from(movimientos)
      .where(and(...conditions))
      .groupBy(movimientos.bancoId)

    // Movimientos por tipo
    const movimientosPorTipo = await db
      .select({
        tipo: movimientos.tipo,
        cantidad: sql<number>`count(*)`,
        total: sql<number>`sum(${movimientos.monto})`,
      })
      .from(movimientos)
      .where(and(...conditions))
      .groupBy(movimientos.tipo)

    // Flujo por día
    const flujoPorDia = await db
      .select({
        fecha: sql<string>`date(${movimientos.fecha})`,
        ingresos: sql<number>`sum(case when ${movimientos.tipo} in ('ingreso', 'abono', 'transferencia_entrada') then ${movimientos.monto} else 0 end)`,
        gastos: sql<number>`sum(case when ${movimientos.tipo} in ('gasto', 'pago', 'transferencia_salida') then ${movimientos.monto} else 0 end)`,
      })
      .from(movimientos)
      .where(and(...conditions))
      .groupBy(sql`date(${movimientos.fecha})`)
      .orderBy(sql`date(${movimientos.fecha})`)

    return {
      success: true,
      data: {
        bancosActuales,
        movimientosPorBanco,
        movimientosPorTipo,
        flujoPorDia,
      },
    }
  } catch (error) {
    console.error('Error generando reporte de bancos:', error)
    return { error: 'Error al generar reporte' }
  }
}

/**
 * Obtener reporte de clientes
 */
export async function getReporteClientes() {
  try {
    // Resumen general
    const [resumen] = await db
      .select({
        totalClientes: sql<number>`count(*)`,
        activos: sql<number>`sum(case when ${clientes.estado} = 'activo' then 1 else 0 end)`,
        inactivos: sql<number>`sum(case when ${clientes.estado} = 'inactivo' then 1 else 0 end)`,
        suspendidos: sql<number>`sum(case when ${clientes.estado} = 'suspendido' then 1 else 0 end)`,
        saldoPendienteTotal: sql<number>`sum(${clientes.saldoPendiente})`,
        creditoDisponibleTotal: sql<number>`sum(${clientes.limiteCredito} - ${clientes.saldoPendiente})`,
      })
      .from(clientes)

    // Top clientes por ventas
    const topClientesVentas = await db
      .select({
        clienteId: ventas.clienteId,
        clienteNombre: clientes.nombre,
        totalVentas: sql<number>`sum(${ventas.precioTotalVenta})`,
        cantidadVentas: sql<number>`count(*)`,
      })
      .from(ventas)
      .innerJoin(clientes, eq(ventas.clienteId, clientes.id))
      .groupBy(ventas.clienteId, clientes.nombre)
      .orderBy(sql`sum(${ventas.precioTotalVenta}) desc`)
      .limit(10)

    // Clientes con mayor saldo pendiente
    const clientesMorosos = await db
      .select()
      .from(clientes)
      .where(sql`${clientes.saldoPendiente} > 0`)
      .orderBy(desc(clientes.saldoPendiente))
      .limit(10)

    return {
      success: true,
      data: {
        resumen: {
          totalClientes: resumen.totalClientes || 0,
          activos: resumen.activos || 0,
          inactivos: resumen.inactivos || 0,
          suspendidos: resumen.suspendidos || 0,
          saldoPendienteTotal: resumen.saldoPendienteTotal || 0,
          creditoDisponibleTotal: resumen.creditoDisponibleTotal || 0,
        },
        topClientesVentas,
        clientesMorosos,
      },
    }
  } catch (error) {
    console.error('Error generando reporte de clientes:', error)
    return { error: 'Error al generar reporte' }
  }
}

/**
 * Obtener reporte de distribuidores y órdenes de compra
 */
export async function getReporteDistribuidores(filtros: FiltrosReporte) {
  try {
    const conditions = [
      between(ordenesCompra.fecha, filtros.fechaInicio, filtros.fechaFin)
    ]

    if (filtros.distribuidorId) {
      conditions.push(eq(ordenesCompra.distribuidorId, filtros.distribuidorId))
    }

    // Totales de compras
    const [totales] = await db
      .select({
        totalCompras: sql<number>`sum(${ordenesCompra.total})`,
        totalPagado: sql<number>`sum(${ordenesCompra.montoPagado})`,
        totalPendiente: sql<number>`sum(${ordenesCompra.montoRestante})`,
        cantidadOrdenes: sql<number>`count(*)`,
      })
      .from(ordenesCompra)
      .where(and(...conditions))

    // Compras por distribuidor
    const comprasPorDistribuidor = await db
      .select({
        distribuidorId: ordenesCompra.distribuidorId,
        distribuidorNombre: distribuidores.nombre,
        totalCompras: sql<number>`sum(${ordenesCompra.total})`,
        cantidadOrdenes: sql<number>`count(*)`,
      })
      .from(ordenesCompra)
      .innerJoin(distribuidores, eq(ordenesCompra.distribuidorId, distribuidores.id))
      .where(and(...conditions))
      .groupBy(ordenesCompra.distribuidorId, distribuidores.nombre)
      .orderBy(sql`sum(${ordenesCompra.total}) desc`)

    // Órdenes por estado
    const ordenesPorEstado = await db
      .select({
        estado: ordenesCompra.estado,
        cantidad: sql<number>`count(*)`,
        monto: sql<number>`sum(${ordenesCompra.total})`,
      })
      .from(ordenesCompra)
      .where(and(...conditions))
      .groupBy(ordenesCompra.estado)

    return {
      success: true,
      data: {
        totales: {
          totalCompras: totales.totalCompras || 0,
          totalPagado: totales.totalPagado || 0,
          totalPendiente: totales.totalPendiente || 0,
          cantidadOrdenes: totales.cantidadOrdenes || 0,
        },
        comprasPorDistribuidor,
        ordenesPorEstado,
      },
    }
  } catch (error) {
    console.error('Error generando reporte de distribuidores:', error)
    return { error: 'Error al generar reporte' }
  }
}

/**
 * Obtener reporte de almacén/inventario
 */
export async function getReporteAlmacen() {
  try {
    // Estadísticas generales
    const [stats] = await db
      .select({
        totalProductos: sql<number>`count(*)`,
        valorInventario: sql<number>`sum(${almacen.cantidad} * ${almacen.precioCompra})`,
        valorVentaPotencial: sql<number>`sum(${almacen.cantidad} * ${almacen.precioVenta})`,
        unidadesTotales: sql<number>`sum(${almacen.cantidad})`,
      })
      .from(almacen)

    // Productos con bajo stock
    const productosBajoStock = await db
      .select()
      .from(almacen)
      .where(sql`${almacen.cantidad} <= ${almacen.minimo}`)
      .orderBy(almacen.cantidad)

    // Productos sin movimiento (cantidad = 0)
    const productosAgotados = await db
      .select()
      .from(almacen)
      .where(eq(almacen.cantidad, 0))

    // Top productos por valor
    const topProductosValor = await db
      .select({
        id: almacen.id,
        nombre: almacen.nombre,
        cantidad: almacen.cantidad,
        valorTotal: sql<number>`${almacen.cantidad} * ${almacen.precioCompra}`,
      })
      .from(almacen)
      .where(sql`${almacen.cantidad} > 0`)
      .orderBy(sql`${almacen.cantidad} * ${almacen.precioCompra} desc`)
      .limit(10)

    return {
      success: true,
      data: {
        stats: {
          totalProductos: stats.totalProductos || 0,
          valorInventario: stats.valorInventario || 0,
          valorVentaPotencial: stats.valorVentaPotencial || 0,
          unidadesTotales: stats.unidadesTotales || 0,
          margenPotencial: (stats.valorVentaPotencial || 0) - (stats.valorInventario || 0),
        },
        productosBajoStock,
        productosAgotados,
        topProductosValor,
      },
    }
  } catch (error) {
    console.error('Error generando reporte de almacén:', error)
    return { error: 'Error al generar reporte' }
  }
}

/**
 * Obtener resumen financiero completo para período
 */
export async function getResumenFinanciero(filtros: FiltrosReporte) {
  try {
    const conditions = [
      between(movimientos.fecha, filtros.fechaInicio, filtros.fechaFin)
    ]

    // Ingresos vs gastos
    const [flujo] = await db
      .select({
        ingresos: sql<number>`sum(case when ${movimientos.tipo} in ('ingreso', 'abono') then ${movimientos.monto} else 0 end)`,
        gastos: sql<number>`sum(case when ${movimientos.tipo} in ('gasto', 'pago') then ${movimientos.monto} else 0 end)`,
      })
      .from(movimientos)
      .where(and(...conditions))

    // Ventas del período
    const [ventasPeriodo] = await db
      .select({
        total: sql<number>`sum(${ventas.precioTotalVenta})`,
        utilidades: sql<number>`sum(${ventas.montoUtilidades})`,
        cobrado: sql<number>`sum(${ventas.montoPagado})`,
      })
      .from(ventas)
      .where(between(ventas.fecha, filtros.fechaInicio, filtros.fechaFin))

    // Compras del período
    const [comprasPeriodo] = await db
      .select({
        total: sql<number>`sum(${ordenesCompra.total})`,
        pagado: sql<number>`sum(${ordenesCompra.montoPagado})`,
      })
      .from(ordenesCompra)
      .where(between(ordenesCompra.fecha, filtros.fechaInicio, filtros.fechaFin))

    // Capital actual
    const [capitalActual] = await db
      .select({
        total: sql<number>`sum(${bancos.capitalActual})`,
      })
      .from(bancos)
      .where(eq(bancos.activo, true))

    return {
      success: true,
      data: {
        periodo: {
          inicio: filtros.fechaInicio,
          fin: filtros.fechaFin,
        },
        flujo: {
          ingresos: flujo.ingresos || 0,
          gastos: flujo.gastos || 0,
          neto: (flujo.ingresos || 0) - (flujo.gastos || 0),
        },
        ventas: {
          total: ventasPeriodo.total || 0,
          utilidades: ventasPeriodo.utilidades || 0,
          cobrado: ventasPeriodo.cobrado || 0,
        },
        compras: {
          total: comprasPeriodo.total || 0,
          pagado: comprasPeriodo.pagado || 0,
        },
        capitalActual: capitalActual.total || 0,
      },
    }
  } catch (error) {
    console.error('Error generando resumen financiero:', error)
    return { error: 'Error al generar resumen' }
  }
}
