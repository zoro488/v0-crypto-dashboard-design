import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/database'
import { clientes } from '@/database/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// ═══════════════════════════════════════════════════════════════════════════
// GET - Obtener todos los clientes
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const result = await db.select().from(clientes).orderBy(clientes.nombre)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching clientes:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST - Crear nuevo cliente
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      nombre,
      email,
      telefono,
      direccion,
      rfc,
      limiteCredito = 0,
    } = body
    
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    
    const clienteId = uuidv4()
    const now = new Date()
    
    await db.insert(clientes).values({
      id: clienteId,
      nombre,
      email,
      telefono,
      direccion,
      rfc,
      limiteCredito,
      saldoPendiente: 0,
      estado: 'activo',
      createdAt: now,
      updatedAt: now,
    })
    
    return NextResponse.json({
      success: true,
      clienteId,
      nombre,
    })
    
  } catch (error) {
    console.error('Error creando cliente:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUT - Actualizar cliente
// ═══════════════════════════════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID de cliente requerido' }, { status: 400 })
    }
    
    const [clienteExistente] = await db.select().from(clientes).where(eq(clientes.id, id))
    
    if (!clienteExistente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }
    
    await db.update(clientes)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(clientes.id, id))
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error actualizando cliente:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE - Eliminar cliente (soft delete cambiando estado)
// ═══════════════════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID de cliente requerido' }, { status: 400 })
    }
    
    // Soft delete - cambiar estado a inactivo
    await db.update(clientes)
      .set({
        estado: 'inactivo',
        updatedAt: new Date(),
      })
      .where(eq(clientes.id, id))
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error eliminando cliente:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
