import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/database'
import { ordenesCompra, distribuidores, bancos, movimientos } from '@/database/schema'
import { eq, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { calcularOrdenCompra } from '@/app/lib/formulas'

// ═══════════════════════════════════════════════════════════════════════════
// GET - Obtener todas las órdenes de compra
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const result = await db.query.ordenesCompra.findMany({
      with: { distribuidor: true },
      orderBy: (ordenes, { desc }) => [desc(ordenes.fecha)],
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching ordenes:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST - Crear nueva orden de compra
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      distribuidorId,
      cantidad,
      precioUnitario,
      pagoInicial = 0,
      bancoOrigenId,
      observaciones,
    } = body
    
    // Validaciones
    if (!distribuidorId || !cantidad || !precioUnitario) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: distribuidorId, cantidad, precioUnitario' },
        { status: 400 }
      )
    }
    
    // Calcular usando fórmulas centralizadas
    const resultado = calcularOrdenCompra({
      cantidad,
      costoDistribuidor: precioUnitario,
      costoTransporte: 0,
      pagoInicial,
    })
    
    const ordenId = uuidv4()
    const now = new Date()
    
    // Generar número de orden secuencial
    const [lastOrder] = await db.select({ numeroOrden: ordenesCompra.numeroOrden })
      .from(ordenesCompra)
      .orderBy(sql`created_at DESC`)
      .limit(1)
    
    let nextNumber = 1
    if (lastOrder?.numeroOrden) {
      const match = lastOrder.numeroOrden.match(/OC(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }
    const numeroOrden = `OC${nextNumber.toString().padStart(4, '0')}`
    
    // Crear la orden de compra
    await db.insert(ordenesCompra).values({
      id: ordenId,
      distribuidorId,
      fecha: now,
      numeroOrden,
      cantidad: resultado.stockInicial,
      precioUnitario,
      subtotal: resultado.costoTotal,
      iva: 0,
      total: resultado.costoTotal,
      montoPagado: pagoInicial,
      montoRestante: resultado.deuda,
      estado: resultado.estado,
      bancoOrigenId,
      observaciones,
    })
    
    // ═══════════════════════════════════════════════════════════════════════
    // SI HAY PAGO INICIAL, DESCONTAR DEL BANCO ORIGEN
    // ═══════════════════════════════════════════════════════════════════════
    
    if (pagoInicial > 0 && bancoOrigenId) {
      // Verificar que el banco tiene suficiente capital
      const [banco] = await db.select().from(bancos).where(eq(bancos.id, bancoOrigenId))
      
      if (banco && (banco.capitalActual || 0) >= pagoInicial) {
        // Descontar del banco
        await db.update(bancos)
          .set({
            capitalActual: sql`capital_actual - ${pagoInicial}`,
            historicoGastos: sql`historico_gastos + ${pagoInicial}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, bancoOrigenId))
        
        // Registrar movimiento de gasto
        await db.insert(movimientos).values({
          id: uuidv4(),
          bancoId: bancoOrigenId,
          tipo: 'gasto',
          monto: pagoInicial,
          fecha: now,
          concepto: `Pago OC ${numeroOrden} - Compra a distribuidor`,
          referencia: ordenId,
          ordenCompraId: ordenId,
          distribuidorId,
        })
      } else {
        return NextResponse.json(
          { error: 'Capital insuficiente en el banco seleccionado' },
          { status: 400 }
        )
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ACTUALIZAR SALDO PENDIENTE DEL DISTRIBUIDOR SI HAY DEUDA
    // ═══════════════════════════════════════════════════════════════════════
    
    if (resultado.deuda > 0) {
      await db.update(distribuidores)
        .set({
          saldoPendiente: sql`saldo_pendiente + ${resultado.deuda}`,
          updatedAt: now,
        })
        .where(eq(distribuidores.id, distribuidorId))
    }
    
    return NextResponse.json({
      success: true,
      ordenId,
      numeroOrden,
      stockInicial: resultado.stockInicial,
      costoTotal: resultado.costoTotal,
      deuda: resultado.deuda,
      estado: resultado.estado,
    })
    
  } catch (error) {
    console.error('Error creando orden de compra:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUT - Actualizar orden (pagos adicionales, actualizar stock, etc.)
// ═══════════════════════════════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, montoPagado: nuevoMontoPagado, bancoOrigenId, cantidad: nuevaCantidad } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID de orden requerido' }, { status: 400 })
    }
    
    const [ordenActual] = await db.select().from(ordenesCompra).where(eq(ordenesCompra.id, id))
    
    if (!ordenActual) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }
    
    const now = new Date()
    
    // Actualizar stock si se proporciona nueva cantidad
    if (nuevaCantidad !== undefined) {
      await db.update(ordenesCompra)
        .set({
          cantidad: nuevaCantidad,
          updatedAt: now,
        })
        .where(eq(ordenesCompra.id, id))
    }
    
    // Procesar pago adicional
    if (nuevoMontoPagado !== undefined && bancoOrigenId) {
      const diferenciaPago = nuevoMontoPagado - (ordenActual.montoPagado || 0)
      
      if (diferenciaPago > 0) {
        // Verificar capital disponible
        const [banco] = await db.select().from(bancos).where(eq(bancos.id, bancoOrigenId))
        
        if (!banco || (banco.capitalActual || 0) < diferenciaPago) {
          return NextResponse.json(
            { error: 'Capital insuficiente en el banco' },
            { status: 400 }
          )
        }
        
        // Descontar del banco
        await db.update(bancos)
          .set({
            capitalActual: sql`capital_actual - ${diferenciaPago}`,
            historicoGastos: sql`historico_gastos + ${diferenciaPago}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, bancoOrigenId))
        
        // Registrar movimiento
        await db.insert(movimientos).values({
          id: uuidv4(),
          bancoId: bancoOrigenId,
          tipo: 'pago',
          monto: diferenciaPago,
          fecha: now,
          concepto: `Pago adicional OC ${ordenActual.numeroOrden}`,
          referencia: id,
          ordenCompraId: id,
        })
        
        // Actualizar deuda del distribuidor
        await db.update(distribuidores)
          .set({
            saldoPendiente: sql`saldo_pendiente - ${diferenciaPago}`,
            updatedAt: now,
          })
          .where(eq(distribuidores.id, ordenActual.distribuidorId))
      }
      
      // Calcular nuevo estado
      const nuevoMontoRestante = (ordenActual.total || 0) - nuevoMontoPagado
      let nuevoEstado: 'pendiente' | 'parcial' | 'completo' | 'cancelado' = 'pendiente'
      
      if (nuevoMontoRestante <= 0) {
        nuevoEstado = 'completo'
      } else if (nuevoMontoPagado > 0) {
        nuevoEstado = 'parcial'
      }
      
      await db.update(ordenesCompra)
        .set({
          montoPagado: nuevoMontoPagado,
          montoRestante: Math.max(0, nuevoMontoRestante),
          estado: nuevoEstado,
          updatedAt: now,
        })
        .where(eq(ordenesCompra.id, id))
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error actualizando orden:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - Eliminar orden (revierte stock, deuda distribuidor, capital banco)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }
    
    // Obtener la orden antes de eliminar para revertir cambios
    const ordenExistente = await db
      .select()
      .from(ordenesCompra)
      .where(eq(ordenesCompra.id, id))
      .limit(1)
    
    if (!ordenExistente.length) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }
    
    const orden = ordenExistente[0]
    const now = new Date()
    
    // 1. Revertir CAPITAL BANCARIO - Devolver el dinero pagado al banco origen
    const montoPagado = Number(orden.montoPagado || 0)
    if (montoPagado > 0 && orden.bancoOrigenId) {
      await db
        .update(bancos)
        .set({
          capitalActual: sql`${bancos.capitalActual} + ${montoPagado}`,
          historicoGastos: sql`${bancos.historicoGastos} - ${montoPagado}`,
          updatedAt: now,
        })
        .where(eq(bancos.id, orden.bancoOrigenId))
    }
    
    // 2. Revertir DEUDA DISTRIBUIDOR - Reducir deuda pendiente
    const deudaPendiente = Number(orden.montoRestante || 0)
    if (orden.distribuidorId && deudaPendiente > 0) {
      await db
        .update(distribuidores)
        .set({
          saldoPendiente: sql`${distribuidores.saldoPendiente} - ${deudaPendiente}`,
          updatedAt: now,
        })
        .where(eq(distribuidores.id, orden.distribuidorId))
    }
    
    // 3. Eliminar la orden
    await db
      .delete(ordenesCompra)
      .where(eq(ordenesCompra.id, id))
    
    return NextResponse.json({ 
      success: true, 
      mensaje: 'Orden eliminada y cambios revertidos',
      revertido: {
        capitalRecuperado: montoPagado,
        deudaReducida: deudaPendiente
      }
    })
    
  } catch (error) {
    console.error('Error eliminando orden:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
