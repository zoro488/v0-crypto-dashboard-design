'use server'

import { db } from '@/database'
import { bancos, movimientos } from '@/database/schema'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq, sql, desc } from 'drizzle-orm'
import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════
// SCHEMAS DE VALIDACIÓN ZOD
// ═══════════════════════════════════════════════════════════════

const TransferenciaSchema = z.object({
  bancoOrigenId: z.string().min(1, 'Banco origen requerido'),
  bancoDestinoId: z.string().min(1, 'Banco destino requerido'),
  monto: z.number().positive('Monto debe ser positivo'),
  concepto: z.string().min(1, 'Concepto requerido'),
})

const GastoSchema = z.object({
  bancoId: z.string().min(1, 'Banco requerido'),
  monto: z.number().positive('Monto debe ser positivo'),
  concepto: z.string().min(1, 'Concepto requerido'),
  observaciones: z.string().optional(),
})

// ═══════════════════════════════════════════════════════════════
// SERVER ACTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Obtener todos los bancos con su capital actual
 */
export async function getBancos() {
  try {
    const result = await db.query.bancos.findMany({
      where: eq(bancos.activo, true),
      orderBy: (bancos, { asc }) => [asc(bancos.orden)],
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Error obteniendo bancos:', error)
    return { error: 'Error al obtener bancos' }
  }
}

/**
 * Obtener banco específico con movimientos recientes
 */
export async function getBancoById(id: string) {
  try {
    const [banco] = await db
      .select()
      .from(bancos)
      .where(eq(bancos.id, id))
      .limit(1)

    if (!banco) {
      return { error: 'Banco no encontrado' }
    }

    const recentMovimientos = await db.query.movimientos.findMany({
      where: eq(movimientos.bancoId, id),
      orderBy: [desc(movimientos.fecha)],
      limit: 50,
      with: {
        cliente: true,
        venta: true,
      },
    })

    return { 
      success: true, 
      data: { 
        ...banco, 
        movimientos: recentMovimientos 
      } 
    }
  } catch (error) {
    console.error('Error obteniendo banco:', error)
    return { error: 'Error al obtener banco' }
  }
}

/**
 * Realizar transferencia entre bancos
 */
export async function transferirEntreBancos(formData: FormData) {
  const rawData = {
    bancoOrigenId: formData.get('bancoOrigenId'),
    bancoDestinoId: formData.get('bancoDestinoId'),
    monto: Number(formData.get('monto')),
    concepto: formData.get('concepto'),
  }

  const parsed = TransferenciaSchema.safeParse(rawData)

  if (!parsed.success) {
    return { 
      error: 'Datos inválidos', 
      details: parsed.error.flatten().fieldErrors 
    }
  }

  const { data } = parsed
  const now = new Date()

  if (data.bancoOrigenId === data.bancoDestinoId) {
    return { error: 'Los bancos de origen y destino deben ser diferentes' }
  }

  try {
    // Verificar que el banco origen tiene fondos suficientes
    const [bancoOrigen] = await db
      .select()
      .from(bancos)
      .where(eq(bancos.id, data.bancoOrigenId))
      .limit(1)

    if (!bancoOrigen) {
      return { error: 'Banco origen no encontrado' }
    }

    if (bancoOrigen.capitalActual < data.monto) {
      return { error: `Fondos insuficientes. Disponible: $${bancoOrigen.capitalActual.toFixed(2)}` }
    }

    const transferenciaId = nanoid()

    await db.transaction(async (tx) => {
      // 1. Restar del banco origen
      await tx
        .update(bancos)
        .set({
          capitalActual: sql`${bancos.capitalActual} - ${data.monto}`,
          historicoGastos: sql`${bancos.historicoGastos} + ${data.monto}`,
          updatedAt: now,
        })
        .where(eq(bancos.id, data.bancoOrigenId))

      // 2. Sumar al banco destino
      await tx
        .update(bancos)
        .set({
          capitalActual: sql`${bancos.capitalActual} + ${data.monto}`,
          historicoIngresos: sql`${bancos.historicoIngresos} + ${data.monto}`,
          updatedAt: now,
        })
        .where(eq(bancos.id, data.bancoDestinoId))

      // 3. Crear movimiento de salida
      await tx.insert(movimientos).values({
        id: nanoid(),
        bancoId: data.bancoOrigenId,
        tipo: 'transferencia_salida',
        monto: data.monto,
        fecha: now,
        concepto: `Transferencia a ${data.bancoDestinoId}: ${data.concepto}`,
        referencia: transferenciaId,
        bancoOrigenId: data.bancoOrigenId,
        bancoDestinoId: data.bancoDestinoId,
      })

      // 4. Crear movimiento de entrada
      await tx.insert(movimientos).values({
        id: nanoid(),
        bancoId: data.bancoDestinoId,
        tipo: 'transferencia_entrada',
        monto: data.monto,
        fecha: now,
        concepto: `Transferencia desde ${data.bancoOrigenId}: ${data.concepto}`,
        referencia: transferenciaId,
        bancoOrigenId: data.bancoOrigenId,
        bancoDestinoId: data.bancoDestinoId,
      })
    })

    revalidatePath('/bancos')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error en transferencia:', error)
    return { error: 'Error al realizar transferencia. Intenta de nuevo.' }
  }
}

/**
 * Registrar gasto en un banco
 */
export async function registrarGasto(formData: FormData) {
  const rawData = {
    bancoId: formData.get('bancoId'),
    monto: Number(formData.get('monto')),
    concepto: formData.get('concepto'),
    observaciones: formData.get('observaciones') || undefined,
  }

  const parsed = GastoSchema.safeParse(rawData)

  if (!parsed.success) {
    return { 
      error: 'Datos inválidos', 
      details: parsed.error.flatten().fieldErrors 
    }
  }

  const { data } = parsed
  const now = new Date()

  try {
    // Verificar fondos
    const [banco] = await db
      .select()
      .from(bancos)
      .where(eq(bancos.id, data.bancoId))
      .limit(1)

    if (!banco) {
      return { error: 'Banco no encontrado' }
    }

    if (banco.capitalActual < data.monto) {
      return { error: `Fondos insuficientes. Disponible: $${banco.capitalActual.toFixed(2)}` }
    }

    await db.transaction(async (tx) => {
      // 1. Restar del banco
      await tx
        .update(bancos)
        .set({
          capitalActual: sql`${bancos.capitalActual} - ${data.monto}`,
          historicoGastos: sql`${bancos.historicoGastos} + ${data.monto}`,
          updatedAt: now,
        })
        .where(eq(bancos.id, data.bancoId))

      // 2. Crear movimiento
      await tx.insert(movimientos).values({
        id: nanoid(),
        bancoId: data.bancoId,
        tipo: 'gasto',
        monto: data.monto,
        fecha: now,
        concepto: data.concepto,
        observaciones: data.observaciones,
      })
    })

    revalidatePath('/bancos')
    revalidatePath('/gastos')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error registrando gasto:', error)
    return { error: 'Error al registrar gasto. Intenta de nuevo.' }
  }
}

/**
 * Obtener capital total de todos los bancos
 */
export async function getCapitalTotal() {
  try {
    const [result] = await db
      .select({
        capitalTotal: sql<number>`sum(${bancos.capitalActual})`,
        ingresosHistoricos: sql<number>`sum(${bancos.historicoIngresos})`,
        gastosHistoricos: sql<number>`sum(${bancos.historicoGastos})`,
      })
      .from(bancos)
      .where(eq(bancos.activo, true))

    return { 
      success: true, 
      data: {
        capitalTotal: result.capitalTotal || 0,
        ingresosHistoricos: result.ingresosHistoricos || 0,
        gastosHistoricos: result.gastosHistoricos || 0,
      }
    }
  } catch (error) {
    console.error('Error obteniendo capital total:', error)
    return { error: 'Error al obtener capital' }
  }
}
