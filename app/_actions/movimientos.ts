'use server'

import { db } from '@/database'
import { movimientos, bancos, clientes, ventas, ordenesCompra, distribuidores } from '@/database/schema'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq, sql, desc, and, between, or, like } from 'drizzle-orm'
import { CreateMovimientoSchema, FiltrosMovimientoSchema, type CreateMovimientoInput, type FiltrosMovimiento } from './types'

// ═══════════════════════════════════════════════════════════════
// SERVER ACTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Crear movimiento manual (ingreso o gasto)
 * Actualiza automáticamente el capital del banco
 */
export async function createMovimiento(input: CreateMovimientoInput) {
  const parsed = CreateMovimientoSchema.safeParse(input)

  if (!parsed.success) {
    return { 
      error: 'Datos inválidos', 
      details: parsed.error.flatten().fieldErrors 
    }
  }

  const { data } = parsed
  const now = new Date()
  const movimientoId = nanoid()

  try {
    // Verificar que el banco existe
    const [banco] = await db
      .select()
      .from(bancos)
      .where(eq(bancos.id, data.bancoId))
      .limit(1)

    if (!banco) {
      return { error: 'Banco no encontrado' }
    }

    // Para gastos y transferencias_salida, verificar fondos
    if (data.tipo === 'gasto' || data.tipo === 'transferencia_salida' || data.tipo === 'pago') {
      if (banco.capitalActual < data.monto) {
        return { 
          error: `Fondos insuficientes. Disponible: $${banco.capitalActual.toFixed(2)}` 
        }
      }
    }

    await db.transaction(async (tx) => {
      // 1. Crear el movimiento
      await tx.insert(movimientos).values({
        id: movimientoId,
        bancoId: data.bancoId,
        tipo: data.tipo,
        monto: data.monto,
        fecha: now,
        concepto: data.concepto,
        referencia: data.referencia,
        clienteId: data.clienteId,
        distribuidorId: data.distribuidorId,
        ventaId: data.ventaId,
        ordenCompraId: data.ordenCompraId,
        observaciones: data.observaciones,
      })

      // 2. Actualizar capital del banco según tipo
      const esIngreso = ['ingreso', 'transferencia_entrada', 'abono'].includes(data.tipo)
      
      if (esIngreso) {
        await tx
          .update(bancos)
          .set({
            capitalActual: sql`${bancos.capitalActual} + ${data.monto}`,
            historicoIngresos: sql`${bancos.historicoIngresos} + ${data.monto}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, data.bancoId))
      } else {
        await tx
          .update(bancos)
          .set({
            capitalActual: sql`${bancos.capitalActual} - ${data.monto}`,
            historicoGastos: sql`${bancos.historicoGastos} + ${data.monto}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, data.bancoId))
      }
    })

    revalidatePath('/movimientos')
    revalidatePath('/bancos')
    revalidatePath('/dashboard')

    return { success: true, id: movimientoId }
  } catch (error) {
    console.error('Error creando movimiento:', error)
    return { error: 'Error al crear movimiento. Intenta de nuevo.' }
  }
}

/**
 * Obtener movimientos con filtros avanzados
 */
export async function getMovimientos(filtros?: Partial<FiltrosMovimiento>) {
  try {
    const conditions = []

    if (filtros?.bancoId) {
      conditions.push(eq(movimientos.bancoId, filtros.bancoId))
    }

    if (filtros?.tipo) {
      conditions.push(eq(movimientos.tipo, filtros.tipo))
    }

    if (filtros?.fechaInicio && filtros?.fechaFin) {
      conditions.push(
        between(movimientos.fecha, filtros.fechaInicio, filtros.fechaFin)
      )
    }

    if (filtros?.busqueda) {
      conditions.push(
        or(
          like(movimientos.concepto, `%${filtros.busqueda}%`),
          like(movimientos.referencia, `%${filtros.busqueda}%`),
          like(movimientos.observaciones, `%${filtros.busqueda}%`)
        )
      )
    }

    const result = await db.query.movimientos.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(movimientos.fecha)],
      limit: filtros?.limit || 100,
      offset: filtros?.offset || 0,
      with: {
        banco: true,
        cliente: true,
        venta: true,
        ordenCompra: true,
      },
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Error obteniendo movimientos:', error)
    return { error: 'Error al obtener movimientos' }
  }
}

/**
 * Obtener movimiento por ID con todas sus relaciones
 */
export async function getMovimientoById(id: string) {
  try {
    const result = await db.query.movimientos.findFirst({
      where: eq(movimientos.id, id),
      with: {
        banco: true,
        cliente: true,
        venta: true,
        ordenCompra: true,
      },
    })

    if (!result) {
      return { error: 'Movimiento no encontrado' }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Error obteniendo movimiento:', error)
    return { error: 'Error al obtener movimiento' }
  }
}

/**
 * Obtener movimientos de un banco específico
 */
export async function getMovimientosByBanco(bancoId: string, limit = 50) {
  try {
    const result = await db.query.movimientos.findMany({
      where: eq(movimientos.bancoId, bancoId),
      orderBy: [desc(movimientos.fecha)],
      limit,
      with: {
        cliente: true,
        venta: true,
        ordenCompra: true,
      },
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Error obteniendo movimientos del banco:', error)
    return { error: 'Error al obtener movimientos' }
  }
}

/**
 * Obtener resumen de movimientos por tipo
 */
export async function getMovimientosResumen(fechaInicio?: Date, fechaFin?: Date) {
  try {
    const conditions = []
    
    if (fechaInicio && fechaFin) {
      conditions.push(between(movimientos.fecha, fechaInicio, fechaFin))
    }

    const result = await db
      .select({
        tipo: movimientos.tipo,
        total: sql<number>`sum(${movimientos.monto})`,
        cantidad: sql<number>`count(*)`,
      })
      .from(movimientos)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(movimientos.tipo)

    const resumen = {
      ingresos: 0,
      gastos: 0,
      transferencias: 0,
      abonos: 0,
      pagos: 0,
      totalOperaciones: 0,
    }

    for (const row of result) {
      resumen.totalOperaciones += row.cantidad
      
      switch (row.tipo) {
        case 'ingreso':
          resumen.ingresos = row.total
          break
        case 'gasto':
          resumen.gastos = row.total
          break
        case 'transferencia_entrada':
        case 'transferencia_salida':
          resumen.transferencias += row.total
          break
        case 'abono':
          resumen.abonos = row.total
          break
        case 'pago':
          resumen.pagos = row.total
          break
      }
    }

    return { success: true, data: resumen }
  } catch (error) {
    console.error('Error obteniendo resumen de movimientos:', error)
    return { error: 'Error al obtener resumen' }
  }
}

/**
 * Obtener movimientos recientes para el dashboard
 */
export async function getMovimientosRecientes(limit = 10) {
  try {
    const result = await db.query.movimientos.findMany({
      orderBy: [desc(movimientos.fecha)],
      limit,
      with: {
        banco: true,
        cliente: true,
      },
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Error obteniendo movimientos recientes:', error)
    return { error: 'Error al obtener movimientos recientes' }
  }
}

/**
 * Cancelar movimiento (crea movimiento inverso)
 * Solo para movimientos manuales de ingreso/gasto
 */
export async function cancelarMovimiento(id: string, motivo: string) {
  try {
    const [movimiento] = await db
      .select()
      .from(movimientos)
      .where(eq(movimientos.id, id))
      .limit(1)

    if (!movimiento) {
      return { error: 'Movimiento no encontrado' }
    }

    // Solo se pueden cancelar ingresos y gastos manuales
    if (!['ingreso', 'gasto'].includes(movimiento.tipo)) {
      return { 
        error: 'Solo se pueden cancelar movimientos manuales de ingreso o gasto' 
      }
    }

    const now = new Date()
    const cancelacionId = nanoid()

    await db.transaction(async (tx) => {
      // Crear movimiento inverso
      const tipoInverso = movimiento.tipo === 'ingreso' ? 'gasto' : 'ingreso'
      
      await tx.insert(movimientos).values({
        id: cancelacionId,
        bancoId: movimiento.bancoId,
        tipo: tipoInverso,
        monto: movimiento.monto,
        fecha: now,
        concepto: `CANCELACIÓN: ${movimiento.concepto}`,
        referencia: id,
        observaciones: motivo,
      })

      // Revertir el efecto en el banco
      if (movimiento.tipo === 'ingreso') {
        // El ingreso original sumó, ahora restamos
        await tx
          .update(bancos)
          .set({
            capitalActual: sql`${bancos.capitalActual} - ${movimiento.monto}`,
            historicoGastos: sql`${bancos.historicoGastos} + ${movimiento.monto}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, movimiento.bancoId))
      } else {
        // El gasto original restó, ahora sumamos
        await tx
          .update(bancos)
          .set({
            capitalActual: sql`${bancos.capitalActual} + ${movimiento.monto}`,
            historicoIngresos: sql`${bancos.historicoIngresos} + ${movimiento.monto}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, movimiento.bancoId))
      }
    })

    revalidatePath('/movimientos')
    revalidatePath('/bancos')
    revalidatePath('/dashboard')

    return { success: true, cancelacionId }
  } catch (error) {
    console.error('Error cancelando movimiento:', error)
    return { error: 'Error al cancelar movimiento. Intenta de nuevo.' }
  }
}

/**
 * Obtener estadísticas de movimientos para gráficos
 */
export async function getMovimientosStats(dias = 30) {
  try {
    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - dias)

    // Movimientos agrupados por día
    const movimientosPorDia = await db
      .select({
        fecha: sql<string>`date(${movimientos.fecha})`,
        ingresos: sql<number>`sum(case when ${movimientos.tipo} in ('ingreso', 'abono', 'transferencia_entrada') then ${movimientos.monto} else 0 end)`,
        gastos: sql<number>`sum(case when ${movimientos.tipo} in ('gasto', 'pago', 'transferencia_salida') then ${movimientos.monto} else 0 end)`,
      })
      .from(movimientos)
      .where(sql`${movimientos.fecha} >= ${fechaInicio}`)
      .groupBy(sql`date(${movimientos.fecha})`)
      .orderBy(sql`date(${movimientos.fecha})`)

    // Movimientos por banco
    const movimientosPorBanco = await db
      .select({
        bancoId: movimientos.bancoId,
        total: sql<number>`sum(${movimientos.monto})`,
        cantidad: sql<number>`count(*)`,
      })
      .from(movimientos)
      .where(sql`${movimientos.fecha} >= ${fechaInicio}`)
      .groupBy(movimientos.bancoId)

    return { 
      success: true, 
      data: {
        porDia: movimientosPorDia,
        porBanco: movimientosPorBanco,
      }
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas de movimientos:', error)
    return { error: 'Error al obtener estadísticas' }
  }
}
