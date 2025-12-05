import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/database'
import { distribuidores } from '@/database/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// ═══════════════════════════════════════════════════════════════════════════
// GET - Obtener todos los distribuidores
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const result = await db.select().from(distribuidores).orderBy(distribuidores.nombre)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching distribuidores:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST - Crear nuevo distribuidor
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      nombre,
      empresa,
      telefono,
      email,
      tipoProductos,
    } = body
    
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    
    const distribuidorId = uuidv4()
    const now = new Date()
    
    await db.insert(distribuidores).values({
      id: distribuidorId,
      nombre,
      empresa,
      telefono,
      email,
      tipoProductos,
      saldoPendiente: 0,
      estado: 'activo',
      createdAt: now,
      updatedAt: now,
    })
    
    return NextResponse.json({
      success: true,
      distribuidorId,
      nombre,
    })
    
  } catch (error) {
    console.error('Error creando distribuidor:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUT - Actualizar distribuidor
// ═══════════════════════════════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID de distribuidor requerido' }, { status: 400 })
    }
    
    const [distribuidorExistente] = await db.select().from(distribuidores).where(eq(distribuidores.id, id))
    
    if (!distribuidorExistente) {
      return NextResponse.json({ error: 'Distribuidor no encontrado' }, { status: 404 })
    }
    
    await db.update(distribuidores)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(distribuidores.id, id))
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error actualizando distribuidor:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE - Eliminar distribuidor (soft delete)
// ═══════════════════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID de distribuidor requerido' }, { status: 400 })
    }
    
    await db.update(distribuidores)
      .set({
        estado: 'inactivo',
        updatedAt: new Date(),
      })
      .where(eq(distribuidores.id, id))
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error eliminando distribuidor:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
