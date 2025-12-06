'use server'

import { db } from '@/database'
import { almacen, movimientos, bancos, ventas } from '@/database/schema'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq, sql, desc, and, lt, like, or } from 'drizzle-orm'
import { 
  CreateProductoSchema, 
  UpdateProductoSchema, 
  AjustarInventarioSchema,
  type CreateProductoInput, 
  type UpdateProductoInput, 
  type AjustarInventarioInput 
} from './types'

// ═══════════════════════════════════════════════════════════════
// SERVER ACTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Crear producto en almacén
 */
export async function createProducto(input: CreateProductoInput) {
  const parsed = CreateProductoSchema.safeParse(input)

  if (!parsed.success) {
    return { 
      error: 'Datos inválidos', 
      details: parsed.error.flatten().fieldErrors 
    }
  }

  const { data } = parsed
  const productoId = nanoid()
  const now = new Date()

  try {
    await db.insert(almacen).values({
      id: productoId,
      nombre: data.nombre,
      descripcion: data.descripcion,
      cantidad: data.cantidad,
      precioCompra: data.precioCompra,
      precioVenta: data.precioVenta,
      minimo: data.minimo,
      ubicacion: data.ubicacion,
      createdAt: now,
      updatedAt: now,
    })

    revalidatePath('/almacen')
    revalidatePath('/dashboard')

    return { success: true, id: productoId }
  } catch (error) {
    console.error('Error creando producto:', error)
    return { error: 'Error al crear producto. Intenta de nuevo.' }
  }
}

/**
 * Actualizar producto
 */
export async function updateProducto(input: UpdateProductoInput) {
  const parsed = UpdateProductoSchema.safeParse(input)

  if (!parsed.success) {
    return { 
      error: 'Datos inválidos', 
      details: parsed.error.flatten().fieldErrors 
    }
  }

  const { data } = parsed
  const now = new Date()

  try {
    const [existing] = await db
      .select()
      .from(almacen)
      .where(eq(almacen.id, data.id))
      .limit(1)

    if (!existing) {
      return { error: 'Producto no encontrado' }
    }

    const updateData: Partial<typeof almacen.$inferInsert> = {
      updatedAt: now,
    }

    if (data.nombre !== undefined) updateData.nombre = data.nombre
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion
    if (data.precioCompra !== undefined) updateData.precioCompra = data.precioCompra
    if (data.precioVenta !== undefined) updateData.precioVenta = data.precioVenta
    if (data.minimo !== undefined) updateData.minimo = data.minimo
    if (data.ubicacion !== undefined) updateData.ubicacion = data.ubicacion

    await db
      .update(almacen)
      .set(updateData)
      .where(eq(almacen.id, data.id))

    revalidatePath('/almacen')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error actualizando producto:', error)
    return { error: 'Error al actualizar producto. Intenta de nuevo.' }
  }
}

/**
 * Obtener todos los productos
 */
export async function getProductos() {
  try {
    const result = await db
      .select()
      .from(almacen)
      .orderBy(almacen.nombre)

    return { success: true, data: result }
  } catch (error) {
    console.error('Error obteniendo productos:', error)
    return { error: 'Error al obtener productos' }
  }
}

/**
 * Obtener producto por ID
 */
export async function getProductoById(id: string) {
  try {
    const [producto] = await db
      .select()
      .from(almacen)
      .where(eq(almacen.id, id))
      .limit(1)

    if (!producto) {
      return { error: 'Producto no encontrado' }
    }

    return { success: true, data: producto }
  } catch (error) {
    console.error('Error obteniendo producto:', error)
    return { error: 'Error al obtener producto' }
  }
}

/**
 * Buscar productos por nombre o descripción
 */
export async function buscarProductos(query: string) {
  try {
    const result = await db
      .select()
      .from(almacen)
      .where(
        or(
          like(almacen.nombre, `%${query}%`),
          like(almacen.descripcion, `%${query}%`)
        )
      )
      .orderBy(almacen.nombre)
      .limit(20)

    return { success: true, data: result }
  } catch (error) {
    console.error('Error buscando productos:', error)
    return { error: 'Error al buscar productos' }
  }
}

/**
 * Ajustar inventario (entrada, salida o ajuste)
 */
export async function ajustarInventario(input: AjustarInventarioInput) {
  const parsed = AjustarInventarioSchema.safeParse(input)

  if (!parsed.success) {
    return { 
      error: 'Datos inválidos', 
      details: parsed.error.flatten().fieldErrors 
    }
  }

  const { data } = parsed
  const now = new Date()

  try {
    const [producto] = await db
      .select()
      .from(almacen)
      .where(eq(almacen.id, data.productoId))
      .limit(1)

    if (!producto) {
      return { error: 'Producto no encontrado' }
    }

    // Calcular nueva cantidad
    let nuevaCantidad: number
    let montoMovimiento: number | null = null

    switch (data.tipo) {
      case 'entrada':
        nuevaCantidad = producto.cantidad + Math.abs(data.cantidad)
        montoMovimiento = producto.precioCompra * Math.abs(data.cantidad)
        break
      case 'salida':
        if (producto.cantidad < Math.abs(data.cantidad)) {
          return { 
            error: `Stock insuficiente. Disponible: ${producto.cantidad}` 
          }
        }
        nuevaCantidad = producto.cantidad - Math.abs(data.cantidad)
        break
      case 'ajuste':
        nuevaCantidad = data.cantidad
        break
      default:
        return { error: 'Tipo de ajuste inválido' }
    }

    await db.transaction(async (tx) => {
      // 1. Actualizar cantidad en almacén
      await tx
        .update(almacen)
        .set({
          cantidad: nuevaCantidad,
          updatedAt: now,
        })
        .where(eq(almacen.id, data.productoId))

      // 2. Si es entrada con costo, registrar gasto en banco
      if (data.tipo === 'entrada' && data.bancoId && montoMovimiento) {
        const [banco] = await tx
          .select()
          .from(bancos)
          .where(eq(bancos.id, data.bancoId))
          .limit(1)

        if (banco && banco.capitalActual >= montoMovimiento) {
          // Registrar gasto
          await tx
            .update(bancos)
            .set({
              capitalActual: sql`${bancos.capitalActual} - ${montoMovimiento}`,
              historicoGastos: sql`${bancos.historicoGastos} + ${montoMovimiento}`,
              updatedAt: now,
            })
            .where(eq(bancos.id, data.bancoId))

          // Crear movimiento
          await tx.insert(movimientos).values({
            id: nanoid(),
            bancoId: data.bancoId,
            tipo: 'gasto',
            monto: montoMovimiento,
            fecha: now,
            concepto: `Compra inventario: ${producto.nombre} x${Math.abs(data.cantidad)}`,
            observaciones: data.motivo,
          })
        }
      }
    })

    revalidatePath('/almacen')
    revalidatePath('/bancos')
    revalidatePath('/dashboard')

    return { success: true, nuevaCantidad }
  } catch (error) {
    console.error('Error ajustando inventario:', error)
    return { error: 'Error al ajustar inventario. Intenta de nuevo.' }
  }
}

/**
 * Obtener productos con stock bajo (menor al mínimo)
 */
export async function getProductosBajoStock() {
  try {
    const result = await db
      .select()
      .from(almacen)
      .where(sql`${almacen.cantidad} <= ${almacen.minimo}`)
      .orderBy(almacen.cantidad)

    return { success: true, data: result }
  } catch (error) {
    console.error('Error obteniendo productos con bajo stock:', error)
    return { error: 'Error al obtener productos' }
  }
}

/**
 * Obtener estadísticas de almacén
 */
export async function getAlmacenStats() {
  try {
    const [stats] = await db
      .select({
        totalProductos: sql<number>`count(*)`,
        valorInventario: sql<number>`sum(${almacen.cantidad} * ${almacen.precioCompra})`,
        valorVenta: sql<number>`sum(${almacen.cantidad} * ${almacen.precioVenta})`,
        unidadesTotales: sql<number>`sum(${almacen.cantidad})`,
      })
      .from(almacen)

    const [bajoStock] = await db
      .select({
        cantidad: sql<number>`count(*)`,
      })
      .from(almacen)
      .where(sql`${almacen.cantidad} <= ${almacen.minimo}`)

    return { 
      success: true, 
      data: {
        totalProductos: stats.totalProductos || 0,
        valorInventario: stats.valorInventario || 0,
        valorVenta: stats.valorVenta || 0,
        unidadesTotales: stats.unidadesTotales || 0,
        productosBajoStock: bajoStock.cantidad || 0,
        margenPotencial: (stats.valorVenta || 0) - (stats.valorInventario || 0),
      }
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas de almacén:', error)
    return { error: 'Error al obtener estadísticas' }
  }
}

/**
 * Eliminar producto (solo si cantidad es 0)
 */
export async function deleteProducto(id: string) {
  try {
    const [producto] = await db
      .select()
      .from(almacen)
      .where(eq(almacen.id, id))
      .limit(1)

    if (!producto) {
      return { error: 'Producto no encontrado' }
    }

    if (producto.cantidad > 0) {
      return { 
        error: 'No se puede eliminar producto con stock. Vacíe el inventario primero.' 
      }
    }

    await db.delete(almacen).where(eq(almacen.id, id))

    revalidatePath('/almacen')

    return { success: true }
  } catch (error) {
    console.error('Error eliminando producto:', error)
    return { error: 'Error al eliminar producto. Intenta de nuevo.' }
  }
}
