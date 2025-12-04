'use server'

import { z } from 'zod'
import { db } from '@/database'
import { ventas, movimientos, bancos, clientes } from '@/database/schema'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq, sql } from 'drizzle-orm'

// ═══════════════════════════════════════════════════════════════
// SCHEMAS DE VALIDACIÓN ZOD
// ═══════════════════════════════════════════════════════════════

const CreateVentaSchema = z.object({
  clienteId: z.string().min(1, 'Cliente requerido'),
  cantidad: z.number().positive('Cantidad debe ser positiva'),
  precioVentaUnidad: z.number().positive('Precio venta requerido'),
  precioCompraUnidad: z.number().positive('Precio compra requerido'),
  precioFlete: z.number().nonnegative().default(0),
  observaciones: z.string().optional(),
})

const UpdateVentaSchema = z.object({
  id: z.string().min(1),
  montoPagado: z.number().nonnegative().optional(),
  estadoPago: z.enum(['pendiente', 'parcial', 'completo']).optional(),
  observaciones: z.string().optional(),
})

const AbonoVentaSchema = z.object({
  ventaId: z.string().min(1, 'Venta requerida'),
  monto: z.number().positive('Monto debe ser positivo'),
  bancoDestinoId: z.string().min(1, 'Banco destino requerido'),
  concepto: z.string().optional(),
})

// ═══════════════════════════════════════════════════════════════
// TIPOS INFERIDOS
// ═══════════════════════════════════════════════════════════════

export type CreateVentaInput = z.infer<typeof CreateVentaSchema>
export type UpdateVentaInput = z.infer<typeof UpdateVentaSchema>
export type AbonoVentaInput = z.infer<typeof AbonoVentaSchema>

// ═══════════════════════════════════════════════════════════════
// SERVER ACTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Crear nueva venta con distribución automática a 3 bancos
 * Lógica de negocio:
 * - boveda_monte: recibe el costo (precioCompraUnidad * cantidad)
 * - flete_sur: recibe el flete (precioFlete * cantidad)
 * - utilidades: recibe la ganancia neta (precioVenta - costo - flete)
 */
export async function createVenta(formData: FormData) {
  const rawData = {
    clienteId: formData.get('clienteId'),
    cantidad: Number(formData.get('cantidad')),
    precioVentaUnidad: Number(formData.get('precioVentaUnidad')),
    precioCompraUnidad: Number(formData.get('precioCompraUnidad')),
    precioFlete: Number(formData.get('precioFlete') || 0),
    observaciones: formData.get('observaciones') as string || undefined,
  }

  const parsed = CreateVentaSchema.safeParse(rawData)

  if (!parsed.success) {
    return { 
      error: 'Datos inválidos', 
      details: parsed.error.flatten().fieldErrors 
    }
  }

  const { data } = parsed
  const ventaId = nanoid()
  const now = new Date()
  
  // Calcular distribución GYA (Gastos y Administración)
  const precioTotalVenta = data.cantidad * data.precioVentaUnidad
  const montoBovedaMonte = data.cantidad * data.precioCompraUnidad
  const montoFletes = data.cantidad * data.precioFlete
  const montoUtilidades = precioTotalVenta - montoBovedaMonte - montoFletes
  
  try {
    // Transacción atómica: crear venta + movimientos + actualizar bancos
    await db.transaction(async (tx) => {
      // 1. Insertar venta
      await tx.insert(ventas).values({
        id: ventaId,
        clienteId: data.clienteId,
        fecha: now,
        cantidad: data.cantidad,
        precioVentaUnidad: data.precioVentaUnidad,
        precioCompraUnidad: data.precioCompraUnidad,
        precioFlete: data.precioFlete,
        precioTotalVenta,
        montoPagado: 0,
        montoRestante: precioTotalVenta,
        montoBovedaMonte,
        montoFletes,
        montoUtilidades,
        estadoPago: 'pendiente',
        observaciones: data.observaciones,
      })

      // 2. Actualizar saldo pendiente del cliente
      await tx
        .update(clientes)
        .set({
          saldoPendiente: sql`${clientes.saldoPendiente} + ${precioTotalVenta}`,
          updatedAt: now,
        })
        .where(eq(clientes.id, data.clienteId))

      // 3. Crear movimientos en bancos (solo cuando se pague)
      // Por ahora la venta está pendiente, los movimientos se crean con abonos
    })
    
    revalidatePath('/ventas')
    revalidatePath('/dashboard')
    revalidatePath('/clientes')
    
    return { success: true, id: ventaId }
  } catch (error) {
    console.error('Error creando venta:', error)
    return { error: 'Error al crear venta. Intenta de nuevo.' }
  }
}

/**
 * Registrar abono a venta con distribución proporcional a bancos
 */
export async function abonarVenta(formData: FormData) {
  const rawData = {
    ventaId: formData.get('ventaId'),
    monto: Number(formData.get('monto')),
    bancoDestinoId: formData.get('bancoDestinoId'),
    concepto: formData.get('concepto') as string || undefined,
  }

  const parsed = AbonoVentaSchema.safeParse(rawData)

  if (!parsed.success) {
    return { 
      error: 'Datos inválidos', 
      details: parsed.error.flatten().fieldErrors 
    }
  }

  const { data } = parsed
  const now = new Date()

  try {
    // Obtener venta actual
    const [venta] = await db
      .select()
      .from(ventas)
      .where(eq(ventas.id, data.ventaId))
      .limit(1)

    if (!venta) {
      return { error: 'Venta no encontrada' }
    }

    if (data.monto > venta.montoRestante) {
      return { error: `El abono no puede ser mayor al monto restante: $${venta.montoRestante.toFixed(2)}` }
    }

    const nuevoMontoPagado = (venta.montoPagado ?? 0) + data.monto
    const nuevoMontoRestante = venta.montoRestante - data.monto
    const nuevoEstado = nuevoMontoRestante === 0 ? 'completo' : 'parcial'

    // Calcular distribución proporcional
    const proporcion = data.monto / venta.precioTotalVenta
    const distribucion = {
      boveda_monte: (venta.montoBovedaMonte ?? 0) * proporcion,
      flete_sur: (venta.montoFletes ?? 0) * proporcion,
      utilidades: (venta.montoUtilidades ?? 0) * proporcion,
    }

    await db.transaction(async (tx) => {
      // 1. Actualizar venta
      await tx
        .update(ventas)
        .set({
          montoPagado: nuevoMontoPagado,
          montoRestante: nuevoMontoRestante,
          estadoPago: nuevoEstado,
          updatedAt: now,
        })
        .where(eq(ventas.id, data.ventaId))

      // 2. Actualizar saldo pendiente del cliente
      await tx
        .update(clientes)
        .set({
          saldoPendiente: sql`${clientes.saldoPendiente} - ${data.monto}`,
          updatedAt: now,
        })
        .where(eq(clientes.id, venta.clienteId))

      // 3. Crear movimientos y actualizar bancos
      const bancosAActualizar = [
        { bancoId: 'boveda_monte', monto: distribucion.boveda_monte, concepto: 'Costo de venta (abono)' },
        { bancoId: 'flete_sur', monto: distribucion.flete_sur, concepto: 'Flete de venta (abono)' },
        { bancoId: 'utilidades', monto: distribucion.utilidades, concepto: 'Utilidad de venta (abono)' },
      ]

      for (const mov of bancosAActualizar) {
        if (mov.monto > 0) {
          // Crear movimiento
          await tx.insert(movimientos).values({
            id: nanoid(),
            bancoId: mov.bancoId,
            tipo: 'ingreso',
            monto: mov.monto,
            fecha: now,
            concepto: mov.concepto,
            referencia: data.ventaId,
            ventaId: data.ventaId,
            clienteId: venta.clienteId,
          })

          // Actualizar capital del banco
          await tx
            .update(bancos)
            .set({
              capitalActual: sql`${bancos.capitalActual} + ${mov.monto}`,
              historicoIngresos: sql`${bancos.historicoIngresos} + ${mov.monto}`,
              updatedAt: now,
            })
            .where(eq(bancos.id, mov.bancoId))
        }
      }
    })

    revalidatePath('/ventas')
    revalidatePath('/dashboard')
    revalidatePath('/bancos')
    revalidatePath('/clientes')

    return { success: true, nuevoEstado }
  } catch (error) {
    console.error('Error procesando abono:', error)
    return { error: 'Error al procesar abono. Intenta de nuevo.' }
  }
}

/**
 * Obtener todas las ventas con relaciones
 */
export async function getVentas() {
  try {
    const result = await db.query.ventas.findMany({
      with: {
        cliente: true,
      },
      orderBy: (ventas, { desc }) => [desc(ventas.fecha)],
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Error obteniendo ventas:', error)
    return { error: 'Error al obtener ventas' }
  }
}

/**
 * Obtener venta por ID con todos los movimientos relacionados
 */
export async function getVentaById(id: string) {
  try {
    const result = await db.query.ventas.findFirst({
      where: eq(ventas.id, id),
      with: {
        cliente: true,
        movimientos: true,
      },
    })
    
    if (!result) {
      return { error: 'Venta no encontrada' }
    }
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Error obteniendo venta:', error)
    return { error: 'Error al obtener venta' }
  }
}

/**
 * Obtener estadísticas de ventas para dashboard
 */
export async function getVentasStats() {
  try {
    const [stats] = await db
      .select({
        totalVentas: sql<number>`count(*)`,
        montoTotal: sql<number>`sum(${ventas.precioTotalVenta})`,
        montoPagado: sql<number>`sum(${ventas.montoPagado})`,
        montoRestante: sql<number>`sum(${ventas.montoRestante})`,
        ventasCompletas: sql<number>`sum(case when ${ventas.estadoPago} = 'completo' then 1 else 0 end)`,
        ventasParciales: sql<number>`sum(case when ${ventas.estadoPago} = 'parcial' then 1 else 0 end)`,
        ventasPendientes: sql<number>`sum(case when ${ventas.estadoPago} = 'pendiente' then 1 else 0 end)`,
      })
      .from(ventas)

    return { success: true, data: stats }
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return { error: 'Error al obtener estadísticas' }
  }
}
