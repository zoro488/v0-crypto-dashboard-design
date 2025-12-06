import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/database'
import { bancos, movimientos } from '@/database/schema'
import { eq, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// ═══════════════════════════════════════════════════════════════════════════
// GET - Obtener todos los bancos
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const result = await db.select().from(bancos).orderBy(bancos.orden)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching bancos:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUT - Actualizar banco (agregar ingreso, gasto o transferencia)
// ═══════════════════════════════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id, 
      operacion, // 'ingreso' | 'gasto' | 'transferencia'
      monto,
      concepto,
      bancoDestinoId, // Para transferencias
      referencia,
    } = body
    
    if (!id || !operacion || monto === undefined) {
      return NextResponse.json(
        { error: 'Campos requeridos: id, operacion, monto' },
        { status: 400 }
      )
    }
    
    const [bancoActual] = await db.select().from(bancos).where(eq(bancos.id, id))
    
    if (!bancoActual) {
      return NextResponse.json({ error: 'Banco no encontrado' }, { status: 404 })
    }
    
    const now = new Date()
    
    switch (operacion) {
      case 'ingreso':
        // Agregar ingreso al banco
        await db.update(bancos)
          .set({
            capitalActual: sql`capital_actual + ${monto}`,
            historicoIngresos: sql`historico_ingresos + ${monto}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, id))
        
        // Registrar movimiento
        await db.insert(movimientos).values({
          id: uuidv4(),
          bancoId: id,
          tipo: 'ingreso',
          monto,
          fecha: now,
          concepto: concepto || 'Ingreso manual',
          referencia,
        })
        break
        
      case 'gasto':
        // Verificar capital suficiente
        if ((bancoActual.capitalActual || 0) < monto) {
          return NextResponse.json(
            { error: 'Capital insuficiente' },
            { status: 400 }
          )
        }
        
        // Descontar gasto del banco
        await db.update(bancos)
          .set({
            capitalActual: sql`capital_actual - ${monto}`,
            historicoGastos: sql`historico_gastos + ${monto}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, id))
        
        // Registrar movimiento
        await db.insert(movimientos).values({
          id: uuidv4(),
          bancoId: id,
          tipo: 'gasto',
          monto,
          fecha: now,
          concepto: concepto || 'Gasto manual',
          referencia,
        })
        break
        
      case 'transferencia':
        if (!bancoDestinoId) {
          return NextResponse.json(
            { error: 'bancoDestinoId requerido para transferencias' },
            { status: 400 }
          )
        }
        
        // Verificar capital suficiente en origen
        if ((bancoActual.capitalActual || 0) < monto) {
          return NextResponse.json(
            { error: 'Capital insuficiente para transferencia' },
            { status: 400 }
          )
        }
        
        // Verificar que el banco destino existe
        const [bancoDestino] = await db.select().from(bancos).where(eq(bancos.id, bancoDestinoId))
        if (!bancoDestino) {
          return NextResponse.json({ error: 'Banco destino no encontrado' }, { status: 404 })
        }
        
        // Descontar del origen
        await db.update(bancos)
          .set({
            capitalActual: sql`capital_actual - ${monto}`,
            historicoGastos: sql`historico_gastos + ${monto}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, id))
        
        // Agregar al destino
        await db.update(bancos)
          .set({
            capitalActual: sql`capital_actual + ${monto}`,
            historicoIngresos: sql`historico_ingresos + ${monto}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, bancoDestinoId))
        
        const transferenciaId = uuidv4()
        
        // Movimiento de salida
        await db.insert(movimientos).values({
          id: uuidv4(),
          bancoId: id,
          tipo: 'transferencia_salida',
          monto,
          fecha: now,
          concepto: concepto || `Transferencia a ${bancoDestino.nombre}`,
          referencia: transferenciaId,
          bancoDestinoId,
        })
        
        // Movimiento de entrada
        await db.insert(movimientos).values({
          id: uuidv4(),
          bancoId: bancoDestinoId,
          tipo: 'transferencia_entrada',
          monto,
          fecha: now,
          concepto: concepto || `Transferencia desde ${bancoActual.nombre}`,
          referencia: transferenciaId,
          bancoOrigenId: id,
        })
        break
        
      default:
        return NextResponse.json({ error: 'Operación no válida' }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error actualizando banco:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
