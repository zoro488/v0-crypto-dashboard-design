import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/database'
import { almacen } from '@/database/schema'
import { eq, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// ═══════════════════════════════════════════════════════════════════════════
// GET - Obtener todos los productos del almacén
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const result = await db.select().from(almacen).orderBy(almacen.nombre)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching almacen:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST - Crear nuevo producto en almacén
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      nombre,
      descripcion,
      cantidad = 0,
      precioCompra,
      precioVenta,
      minimo = 0,
      ubicacion,
    } = body
    
    if (!nombre || precioCompra === undefined || precioVenta === undefined) {
      return NextResponse.json(
        { error: 'Campos requeridos: nombre, precioCompra, precioVenta' },
        { status: 400 }
      )
    }
    
    const productoId = uuidv4()
    const now = new Date()
    
    await db.insert(almacen).values({
      id: productoId,
      nombre,
      descripcion,
      cantidad,
      precioCompra,
      precioVenta,
      minimo,
      ubicacion,
      createdAt: now,
      updatedAt: now,
    })
    
    return NextResponse.json({
      success: true,
      productoId,
      nombre,
    })
    
  } catch (error) {
    console.error('Error creando producto:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUT - Actualizar producto (stock, precios, etc.)
// ═══════════════════════════════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id, 
      operacion, // 'entrada' | 'salida' | 'actualizar'
      cantidad,
      ...updateData 
    } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 })
    }
    
    const [productoActual] = await db.select().from(almacen).where(eq(almacen.id, id))
    
    if (!productoActual) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }
    
    const now = new Date()
    
    switch (operacion) {
      case 'entrada':
        // Incrementar stock
        if (!cantidad || cantidad <= 0) {
          return NextResponse.json({ error: 'Cantidad debe ser mayor a 0' }, { status: 400 })
        }
        
        await db.update(almacen)
          .set({
            cantidad: sql`cantidad + ${cantidad}`,
            updatedAt: now,
          })
          .where(eq(almacen.id, id))
        break
        
      case 'salida':
        // Decrementar stock
        if (!cantidad || cantidad <= 0) {
          return NextResponse.json({ error: 'Cantidad debe ser mayor a 0' }, { status: 400 })
        }
        
        if ((productoActual.cantidad || 0) < cantidad) {
          return NextResponse.json({ error: 'Stock insuficiente' }, { status: 400 })
        }
        
        await db.update(almacen)
          .set({
            cantidad: sql`cantidad - ${cantidad}`,
            updatedAt: now,
          })
          .where(eq(almacen.id, id))
        break
        
      case 'actualizar':
      default:
        // Actualización general
        await db.update(almacen)
          .set({
            ...updateData,
            updatedAt: now,
          })
          .where(eq(almacen.id, id))
        break
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error actualizando producto:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE - Eliminar producto del almacén
// ═══════════════════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 })
    }
    
    await db.delete(almacen).where(eq(almacen.id, id))
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error eliminando producto:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
