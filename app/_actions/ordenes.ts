'use server'

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 📦 SERVER ACTIONS - ÓRDENES DE COMPRA
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * CRUD completo + flujo de estados + afectación a bancos
 */

import { db } from '@/database'
import { ordenesCompra, distribuidores, bancos, movimientos } from '@/database/schema'
import { eq, desc, sql, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { 
  CreateOrdenSchema, 
  PagoOrdenSchema, 
  CambiarEstadoOrdenSchema,
  type CreateOrdenInput, 
  type PagoOrdenInput, 
  type CambiarEstadoOrdenInput 
} from './types'

type ActionResult<T = unknown> = 
  | { success: true; data: T }
  | { success: false; error: string }

// ═══════════════════════════════════════════════════════════════════════════════════════
// ACCIONES CRUD
// ═══════════════════════════════════════════════════════════════════════════════════════

export async function getOrdenes() {
  try {
    const data = await db.query.ordenesCompra.findMany({
      orderBy: [desc(ordenesCompra.fecha)],
      with: {
        distribuidor: true,
      },
    })
    return { success: true, data }
  } catch (error) {
    console.error('Error obteniendo órdenes:', error)
    return { success: false, error: 'Error al obtener órdenes' }
  }
}

export async function getOrden(id: string) {
  try {
    const data = await db.query.ordenesCompra.findFirst({
      where: eq(ordenesCompra.id, id),
      with: {
        distribuidor: true,
      },
    })
    return { success: true, data: data ?? null }
  } catch (error) {
    console.error('Error obteniendo orden:', error)
    return { success: false, error: 'Error al obtener orden' }
  }
}

export async function createOrden(input: CreateOrdenInput): Promise<ActionResult> {
  try {
    const validated = CreateOrdenSchema.parse(input)
    
    // Calcular totales
    const subtotal = validated.cantidad * validated.precioUnitario
    const ivaAmount = subtotal * (validated.iva / 100)
    const total = subtotal + ivaAmount

    // Verificar que el banco tenga suficiente capital
    const banco = await db.query.bancos.findFirst({
      where: eq(bancos.id, validated.bancoOrigenId),
    })

    if (!banco) {
      return { success: false, error: 'Banco no encontrado' }
    }

    if ((banco.capitalActual || 0) < total) {
      return { success: false, error: 'Capital insuficiente en el banco seleccionado' }
    }

    // Generar número de orden si no se proporciona
    const numeroOrden = validated.numeroOrden || `OC-${Date.now().toString(36).toUpperCase()}`

    const ordenId = nanoid()

    // Crear la orden
    await db.insert(ordenesCompra).values({
      id: ordenId,
      distribuidorId: validated.distribuidorId,
      fecha: new Date(),
      numeroOrden,
      cantidad: validated.cantidad,
      precioUnitario: validated.precioUnitario,
      subtotal,
      iva: ivaAmount,
      total,
      montoPagado: 0,
      montoRestante: total,
      estado: 'pendiente',
      bancoOrigenId: validated.bancoOrigenId,
      observaciones: validated.observaciones || null,
    })

    // Actualizar saldo pendiente del distribuidor
    await db.update(distribuidores)
      .set({
        saldoPendiente: sql`${distribuidores.saldoPendiente} + ${total}`,
        updatedAt: new Date(),
      })
      .where(eq(distribuidores.id, validated.distribuidorId))

    revalidatePath('/ordenes')
    revalidatePath('/distribuidores')
    
    return { success: true, data: { id: ordenId, numeroOrden } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Error creando orden:', error)
    return { success: false, error: 'Error al crear orden' }
  }
}

export async function pagarOrden(input: PagoOrdenInput): Promise<ActionResult> {
  try {
    const validated = PagoOrdenSchema.parse(input)

    // Obtener la orden
    const orden = await db.query.ordenesCompra.findFirst({
      where: eq(ordenesCompra.id, validated.ordenId),
      with: { distribuidor: true },
    })

    if (!orden) {
      return { success: false, error: 'Orden no encontrada' }
    }

    if (orden.estado === 'completo') {
      return { success: false, error: 'La orden ya está pagada completamente' }
    }

    if (orden.estado === 'cancelado') {
      return { success: false, error: 'No se puede pagar una orden cancelada' }
    }

    if (validated.monto > (orden.montoRestante || 0)) {
      return { success: false, error: 'El monto excede el saldo pendiente' }
    }

    // Verificar capital del banco
    const banco = await db.query.bancos.findFirst({
      where: eq(bancos.id, validated.bancoOrigenId),
    })

    if (!banco || (banco.capitalActual || 0) < validated.monto) {
      return { success: false, error: 'Capital insuficiente en el banco' }
    }

    const nuevoMontoPagado = (orden.montoPagado || 0) + validated.monto
    const nuevoMontoRestante = (orden.montoRestante || 0) - validated.monto
    const nuevoEstado = nuevoMontoRestante <= 0 ? 'completo' : 'parcial'

    // Actualizar orden
    await db.update(ordenesCompra)
      .set({
        montoPagado: nuevoMontoPagado,
        montoRestante: nuevoMontoRestante,
        estado: nuevoEstado,
        updatedAt: new Date(),
      })
      .where(eq(ordenesCompra.id, validated.ordenId))

    // Reducir capital del banco
    await db.update(bancos)
      .set({
        capitalActual: sql`${bancos.capitalActual} - ${validated.monto}`,
        historicoGastos: sql`${bancos.historicoGastos} + ${validated.monto}`,
        updatedAt: new Date(),
      })
      .where(eq(bancos.id, validated.bancoOrigenId))

    // Reducir saldo pendiente del distribuidor
    await db.update(distribuidores)
      .set({
        saldoPendiente: sql`${distribuidores.saldoPendiente} - ${validated.monto}`,
        updatedAt: new Date(),
      })
      .where(eq(distribuidores.id, orden.distribuidorId))

    // Registrar movimiento
    await db.insert(movimientos).values({
      id: nanoid(),
      bancoId: validated.bancoOrigenId,
      tipo: 'pago',
      monto: validated.monto,
      fecha: new Date(),
      concepto: `Pago orden ${orden.numeroOrden}`,
      referencia: validated.referencia || null,
      distribuidorId: orden.distribuidorId,
      ordenCompraId: validated.ordenId,
    })

    revalidatePath('/ordenes')
    revalidatePath('/bancos')
    revalidatePath('/movimientos')
    revalidatePath('/distribuidores')
    
    return { success: true, data: { nuevoEstado } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Error pagando orden:', error)
    return { success: false, error: 'Error al procesar pago' }
  }
}

export async function cancelarOrden(ordenId: string): Promise<ActionResult> {
  try {
    const orden = await db.query.ordenesCompra.findFirst({
      where: eq(ordenesCompra.id, ordenId),
    })

    if (!orden) {
      return { success: false, error: 'Orden no encontrada' }
    }

    if (orden.estado === 'completo') {
      return { success: false, error: 'No se puede cancelar una orden completada' }
    }

    // Revertir saldo pendiente del distribuidor
    await db.update(distribuidores)
      .set({
        saldoPendiente: sql`${distribuidores.saldoPendiente} - ${orden.montoRestante}`,
        updatedAt: new Date(),
      })
      .where(eq(distribuidores.id, orden.distribuidorId))

    // Actualizar estado de la orden
    await db.update(ordenesCompra)
      .set({
        estado: 'cancelado',
        updatedAt: new Date(),
      })
      .where(eq(ordenesCompra.id, ordenId))

    revalidatePath('/ordenes')
    revalidatePath('/distribuidores')
    
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error cancelando orden:', error)
    return { success: false, error: 'Error al cancelar orden' }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ═══════════════════════════════════════════════════════════════════════════════════════

export async function getOrdenesStats() {
  try {
    const ordenes = await db.query.ordenesCompra.findMany()

    const totalOrdenes = ordenes.length
    const pendientes = ordenes.filter(o => o.estado === 'pendiente').length
    const parciales = ordenes.filter(o => o.estado === 'parcial').length
    const completadas = ordenes.filter(o => o.estado === 'completo').length
    const canceladas = ordenes.filter(o => o.estado === 'cancelado').length
    
    const montoTotal = ordenes.reduce((acc, o) => acc + (o.total || 0), 0)
    const montoPagado = ordenes.reduce((acc, o) => acc + (o.montoPagado || 0), 0)
    const montoPendiente = ordenes.reduce((acc, o) => acc + (o.montoRestante || 0), 0)

    return {
      success: true,
      data: {
        totalOrdenes,
        pendientes,
        parciales,
        completadas,
        canceladas,
        montoTotal,
        montoPagado,
        montoPendiente,
      }
    }
  } catch (error) {
    console.error('Error obteniendo stats de órdenes:', error)
    return { success: false, error: 'Error al obtener estadísticas' }
  }
}
