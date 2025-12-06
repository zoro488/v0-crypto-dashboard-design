'use server'

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🚚 SERVER ACTIONS - DISTRIBUIDORES
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * CRUD completo + estadísticas + historial de pagos
 */

import { db } from '@/database'
import { distribuidores, ordenesCompra, movimientos } from '@/database/schema'
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { 
  CreateDistribuidorSchema, 
  UpdateDistribuidorSchema,
  type CreateDistribuidorInput, 
  type UpdateDistribuidorInput 
} from './types'

// ═══════════════════════════════════════════════════════════════════════════════════════
// SCHEMAS LOCALES (solo para este archivo)
// ═══════════════════════════════════════════════════════════════════════════════════════

const PagoDistribuidorSchema = z.object({
  distribuidorId: z.string(),
  monto: z.number().positive('Monto debe ser positivo'),
  bancoOrigenId: z.string(),
  concepto: z.string().optional(),
  referencia: z.string().optional(),
})

type PagoDistribuidorInput = z.infer<typeof PagoDistribuidorSchema>

type ActionResult<T = unknown> = 
  | { success: true; data: T }
  | { success: false; error: string }

// ═══════════════════════════════════════════════════════════════════════════════════════
// ACCIONES CRUD
// ═══════════════════════════════════════════════════════════════════════════════════════

export async function getDistribuidores(): Promise<ActionResult<typeof distribuidores.$inferSelect[]>> {
  try {
    const data = await db.query.distribuidores.findMany({
      orderBy: [desc(distribuidores.createdAt)],
    })
    return { success: true, data }
  } catch (error) {
    console.error('Error obteniendo distribuidores:', error)
    return { success: false, error: 'Error al obtener distribuidores' }
  }
}

export async function getDistribuidor(id: string): Promise<ActionResult<typeof distribuidores.$inferSelect | null>> {
  try {
    const data = await db.query.distribuidores.findFirst({
      where: eq(distribuidores.id, id),
    })
    return { success: true, data: data ?? null }
  } catch (error) {
    console.error('Error obteniendo distribuidor:', error)
    return { success: false, error: 'Error al obtener distribuidor' }
  }
}

export async function createDistribuidor(input: CreateDistribuidorInput): Promise<ActionResult<typeof distribuidores.$inferSelect>> {
  try {
    const validated = CreateDistribuidorSchema.parse(input)
    
    const newDistribuidor = {
      id: nanoid(),
      nombre: validated.nombre,
      empresa: validated.empresa || null,
      telefono: validated.telefono || null,
      email: validated.email || null,
      tipoProductos: validated.tipoProductos || null,
      saldoPendiente: 0,
      estado: 'activo' as const,
    }

    await db.insert(distribuidores).values(newDistribuidor)
    
    revalidatePath('/distribuidores')
    
    const created = await db.query.distribuidores.findFirst({
      where: eq(distribuidores.id, newDistribuidor.id),
    })
    
    return { success: true, data: created! }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Error creando distribuidor:', error)
    return { success: false, error: 'Error al crear distribuidor' }
  }
}

export async function updateDistribuidor(input: UpdateDistribuidorInput): Promise<ActionResult<typeof distribuidores.$inferSelect>> {
  try {
    const validated = UpdateDistribuidorSchema.parse(input)
    const { id, ...updateData } = validated

    await db.update(distribuidores)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(distribuidores.id, id))

    revalidatePath('/distribuidores')
    
    const updated = await db.query.distribuidores.findFirst({
      where: eq(distribuidores.id, id),
    })
    
    return { success: true, data: updated! }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Error actualizando distribuidor:', error)
    return { success: false, error: 'Error al actualizar distribuidor' }
  }
}

export async function deleteDistribuidor(id: string): Promise<ActionResult<void>> {
  try {
    // Verificar que no tenga órdenes pendientes
    const ordenesPendientes = await db.query.ordenesCompra.findFirst({
      where: and(
        eq(ordenesCompra.distribuidorId, id),
        eq(ordenesCompra.estado, 'pendiente')
      ),
    })

    if (ordenesPendientes) {
      return { success: false, error: 'No se puede eliminar: tiene órdenes pendientes' }
    }

    await db.delete(distribuidores).where(eq(distribuidores.id, id))
    
    revalidatePath('/distribuidores')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error eliminando distribuidor:', error)
    return { success: false, error: 'Error al eliminar distribuidor' }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PAGOS A DISTRIBUIDORES
// ═══════════════════════════════════════════════════════════════════════════════════════

export async function pagarDistribuidor(input: PagoDistribuidorInput): Promise<ActionResult<void>> {
  try {
    const validated = PagoDistribuidorSchema.parse(input)

    // Obtener distribuidor
    const distribuidor = await db.query.distribuidores.findFirst({
      where: eq(distribuidores.id, validated.distribuidorId),
    })

    if (!distribuidor) {
      return { success: false, error: 'Distribuidor no encontrado' }
    }

    if (validated.monto > (distribuidor.saldoPendiente || 0)) {
      return { success: false, error: 'Monto excede el saldo pendiente' }
    }

    const nuevoSaldo = (distribuidor.saldoPendiente || 0) - validated.monto

    // Actualizar saldo del distribuidor
    await db.update(distribuidores)
      .set({ 
        saldoPendiente: nuevoSaldo,
        updatedAt: new Date(),
      })
      .where(eq(distribuidores.id, validated.distribuidorId))

    // Registrar movimiento
    await db.insert(movimientos).values({
      id: nanoid(),
      bancoId: validated.bancoOrigenId,
      tipo: 'pago',
      monto: validated.monto,
      fecha: new Date(),
      concepto: validated.concepto || `Pago a ${distribuidor.nombre}`,
      referencia: validated.referencia || null,
      distribuidorId: validated.distribuidorId,
    })

    revalidatePath('/distribuidores')
    revalidatePath('/movimientos')
    revalidatePath('/bancos')
    
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Error pagando a distribuidor:', error)
    return { success: false, error: 'Error al procesar pago' }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ═══════════════════════════════════════════════════════════════════════════════════════

export async function getDistribuidoresStats() {
  try {
    const allDistribuidores = await db.query.distribuidores.findMany()
    
    const totalDistribuidores = allDistribuidores.length
    const activos = allDistribuidores.filter(d => d.estado === 'activo').length
    const inactivos = totalDistribuidores - activos
    const saldoPendienteTotal = allDistribuidores.reduce(
      (acc, d) => acc + (d.saldoPendiente || 0), 
      0
    )

    // Órdenes por distribuidor
    const ordenes = await db.query.ordenesCompra.findMany()
    const ordenesMap = new Map<string, number>()
    ordenes.forEach(o => {
      const count = ordenesMap.get(o.distribuidorId) || 0
      ordenesMap.set(o.distribuidorId, count + 1)
    })

    const distribuidorConMasOrdenes = Array.from(ordenesMap.entries())
      .sort((a, b) => b[1] - a[1])[0]

    return {
      success: true,
      data: {
        totalDistribuidores,
        activos,
        inactivos,
        saldoPendienteTotal,
        distribuidorPrincipal: distribuidorConMasOrdenes?.[0] || null,
      }
    }
  } catch (error) {
    console.error('Error obteniendo stats de distribuidores:', error)
    return { success: false, error: 'Error al obtener estadísticas' }
  }
}

export async function getHistorialPagosDistribuidor(distribuidorId: string) {
  try {
    const pagos = await db.query.movimientos.findMany({
      where: and(
        eq(movimientos.distribuidorId, distribuidorId),
        eq(movimientos.tipo, 'pago')
      ),
      orderBy: [desc(movimientos.fecha)],
    })

    return { success: true, data: pagos }
  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error)
    return { success: false, error: 'Error al obtener historial' }
  }
}
