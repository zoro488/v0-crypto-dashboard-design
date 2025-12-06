import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/database'
import { movimientos } from '@/database/schema'
import { eq, desc, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// ═══════════════════════════════════════════════════════════════════════════
// GET - Obtener movimientos con filtros opcionales
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bancoId = searchParams.get('bancoId')
    const tipo = searchParams.get('tipo')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = db.select().from(movimientos)
    
    if (bancoId) {
      query = query.where(eq(movimientos.bancoId, bancoId)) as typeof query
    }
    
    if (tipo) {
      query = query.where(eq(movimientos.tipo, tipo as 'ingreso' | 'gasto' | 'transferencia_entrada' | 'transferencia_salida' | 'abono' | 'pago')) as typeof query
    }

    const result = await query.orderBy(desc(movimientos.fecha)).limit(limit)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching movimientos:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST - Crear nuevo movimiento
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      bancoId,
      tipo,
      monto,
      concepto,
      referencia,
      clienteId,
      distribuidorId,
      ventaId,
      ordenCompraId,
      observaciones,
    } = body
    
    // Validaciones
    if (!bancoId || !tipo || monto === undefined || !concepto) {
      return NextResponse.json(
        { error: 'Campos requeridos: bancoId, tipo, monto, concepto' },
        { status: 400 }
      )
    }
    
    const movimientoId = uuidv4()
    const now = new Date()
    
    await db.insert(movimientos).values({
      id: movimientoId,
      bancoId,
      tipo,
      monto,
      fecha: now,
      concepto,
      referencia,
      clienteId,
      distribuidorId,
      ventaId,
      ordenCompraId,
      observaciones,
    })
    
    return NextResponse.json({
      success: true,
      movimientoId,
    })
    
  } catch (error) {
    console.error('Error creando movimiento:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
