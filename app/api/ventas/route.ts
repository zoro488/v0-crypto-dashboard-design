import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/database'
import { ventas, clientes, bancos, movimientos, ordenesCompra } from '@/database/schema'
import { eq, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { calcularVentaCompleta, FLETE_DEFAULT } from '@/app/lib/formulas'

// ═══════════════════════════════════════════════════════════════════════════
// GET - Obtener todas las ventas
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const result = await db.query.ventas.findMany({
      with: { cliente: true },
      orderBy: (ventas, { desc }) => [desc(ventas.fecha)],
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching ventas:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST - Crear nueva venta con distribución GYA automática
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      clienteId,
      cantidad,
      precioVentaUnidad,
      precioCompraUnidad,
      precioFlete = FLETE_DEFAULT,
      montoPagado = 0,
      observaciones,
      ocRelacionada,
    } = body
    
    // Validaciones básicas
    if (!clienteId || !cantidad || !precioVentaUnidad) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: clienteId, cantidad, precioVentaUnidad' },
        { status: 400 }
      )
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CALCULAR DISTRIBUCIÓN GYA USANDO FÓRMULAS CENTRALIZADAS
    // ═══════════════════════════════════════════════════════════════════════
    
    const resultado = calcularVentaCompleta({
      cantidad,
      precioVenta: precioVentaUnidad,
      precioCompra: precioCompraUnidad || 0,
      precioFlete,
      montoPagado,
    })
    
    const ventaId = uuidv4()
    const now = new Date()
    
    // Crear la venta
    await db.insert(ventas).values({
      id: ventaId,
      clienteId,
      fecha: now,
      cantidad,
      precioVentaUnidad,
      precioCompraUnidad: precioCompraUnidad || 0,
      precioFlete,
      precioTotalVenta: resultado.totalVenta,
      montoPagado: resultado.montoPagado,
      montoRestante: resultado.montoRestante,
      montoBovedaMonte: resultado.bovedaMonte,
      montoFletes: resultado.fletes,
      montoUtilidades: resultado.utilidades,
      estadoPago: resultado.estadoPago,
      observaciones,
    })
    
    // ═══════════════════════════════════════════════════════════════════════
    // ACTUALIZAR BANCOS SI HAY PAGO (distribución proporcional)
    // ═══════════════════════════════════════════════════════════════════════
    
    if (resultado.estadoPago !== 'pendiente' && montoPagado > 0) {
      const { distribucionReal } = resultado
      
      // Actualizar Bóveda Monte
      if (distribucionReal.bovedaMonte > 0) {
        await db.update(bancos)
          .set({
            capitalActual: sql`capital_actual + ${distribucionReal.bovedaMonte}`,
            historicoIngresos: sql`historico_ingresos + ${distribucionReal.bovedaMonte}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, 'boveda_monte'))
        
        // Registrar movimiento
        await db.insert(movimientos).values({
          id: uuidv4(),
          bancoId: 'boveda_monte',
          tipo: 'ingreso',
          monto: distribucionReal.bovedaMonte,
          fecha: now,
          concepto: `Venta ${ventaId} - Costo producto`,
          referencia: ventaId,
          ventaId,
        })
      }
      
      // Actualizar Flete Sur
      if (distribucionReal.fletes > 0) {
        await db.update(bancos)
          .set({
            capitalActual: sql`capital_actual + ${distribucionReal.fletes}`,
            historicoIngresos: sql`historico_ingresos + ${distribucionReal.fletes}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, 'flete_sur'))
        
        await db.insert(movimientos).values({
          id: uuidv4(),
          bancoId: 'flete_sur',
          tipo: 'ingreso',
          monto: distribucionReal.fletes,
          fecha: now,
          concepto: `Venta ${ventaId} - Flete`,
          referencia: ventaId,
          ventaId,
        })
      }
      
      // Actualizar Utilidades
      if (distribucionReal.utilidades > 0) {
        await db.update(bancos)
          .set({
            capitalActual: sql`capital_actual + ${distribucionReal.utilidades}`,
            historicoIngresos: sql`historico_ingresos + ${distribucionReal.utilidades}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, 'utilidades'))
        
        await db.insert(movimientos).values({
          id: uuidv4(),
          bancoId: 'utilidades',
          tipo: 'ingreso',
          monto: distribucionReal.utilidades,
          fecha: now,
          concepto: `Venta ${ventaId} - Ganancia`,
          referencia: ventaId,
          ventaId,
        })
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ACTUALIZAR SALDO PENDIENTE DEL CLIENTE SI HAY DEUDA
    // ═══════════════════════════════════════════════════════════════════════
    
    if (resultado.montoRestante > 0) {
      await db.update(clientes)
        .set({
          saldoPendiente: sql`saldo_pendiente + ${resultado.montoRestante}`,
          updatedAt: now,
        })
        .where(eq(clientes.id, clienteId))
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // DECREMENTAR STOCK DE LA OC SI ESTÁ RELACIONADA
    // ═══════════════════════════════════════════════════════════════════════
    
    if (ocRelacionada) {
      const [oc] = await db.select().from(ordenesCompra).where(eq(ordenesCompra.id, ocRelacionada))
      
      if (oc && oc.cantidad >= cantidad) {
        const nuevoStock = oc.cantidad - cantidad
        await db.update(ordenesCompra)
          .set({
            cantidad: nuevoStock,
            updatedAt: now,
          })
          .where(eq(ordenesCompra.id, ocRelacionada))
      }
    }
    
    return NextResponse.json({
      success: true,
      ventaId,
      distribucion: {
        bovedaMonte: resultado.distribucionReal.bovedaMonte,
        fletes: resultado.distribucionReal.fletes,
        utilidades: resultado.distribucionReal.utilidades,
      },
      estadoPago: resultado.estadoPago,
      totalVenta: resultado.totalVenta,
    })
    
  } catch (error) {
    console.error('Error creando venta:', error)
    return NextResponse.json({ error: 'Error interno al crear venta' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUT - Actualizar venta (principalmente para registrar pagos/abonos)
// ═══════════════════════════════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, montoPagado: nuevoMontoPagado } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID de venta requerido' }, { status: 400 })
    }
    
    // Obtener venta actual
    const [ventaActual] = await db.select().from(ventas).where(eq(ventas.id, id))
    
    if (!ventaActual) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }
    
    const now = new Date()
    
    // Si es un abono adicional
    if (nuevoMontoPagado !== undefined) {
      const diferenciaPago = nuevoMontoPagado - (ventaActual.montoPagado || 0)
      
      if (diferenciaPago > 0) {
        // Recalcular distribución para el abono
        const proporcionAbono = diferenciaPago / (ventaActual.precioTotalVenta || 1)
        
        const abonoBovedaMonte = (ventaActual.montoBovedaMonte || 0) * proporcionAbono
        const abonoFletes = (ventaActual.montoFletes || 0) * proporcionAbono
        const abonoUtilidades = (ventaActual.montoUtilidades || 0) * proporcionAbono
        
        // Actualizar bancos con el abono
        if (abonoBovedaMonte > 0) {
          await db.update(bancos)
            .set({
              capitalActual: sql`capital_actual + ${abonoBovedaMonte}`,
              historicoIngresos: sql`historico_ingresos + ${abonoBovedaMonte}`,
              updatedAt: now,
            })
            .where(eq(bancos.id, 'boveda_monte'))
        }
        
        if (abonoFletes > 0) {
          await db.update(bancos)
            .set({
              capitalActual: sql`capital_actual + ${abonoFletes}`,
              historicoIngresos: sql`historico_ingresos + ${abonoFletes}`,
              updatedAt: now,
            })
            .where(eq(bancos.id, 'flete_sur'))
        }
        
        if (abonoUtilidades > 0) {
          await db.update(bancos)
            .set({
              capitalActual: sql`capital_actual + ${abonoUtilidades}`,
              historicoIngresos: sql`historico_ingresos + ${abonoUtilidades}`,
              updatedAt: now,
            })
            .where(eq(bancos.id, 'utilidades'))
        }
        
        // Actualizar deuda del cliente
        await db.update(clientes)
          .set({
            saldoPendiente: sql`saldo_pendiente - ${diferenciaPago}`,
            updatedAt: now,
          })
          .where(eq(clientes.id, ventaActual.clienteId))
      }
      
      // Determinar nuevo estado
      const nuevoMontoRestante = (ventaActual.precioTotalVenta || 0) - nuevoMontoPagado
      let nuevoEstado: 'completo' | 'parcial' | 'pendiente' = 'pendiente'
      
      if (nuevoMontoRestante <= 0) {
        nuevoEstado = 'completo'
      } else if (nuevoMontoPagado > 0) {
        nuevoEstado = 'parcial'
      }
      
      // Actualizar venta
      await db.update(ventas)
        .set({
          montoPagado: nuevoMontoPagado,
          montoRestante: Math.max(0, nuevoMontoRestante),
          estadoPago: nuevoEstado,
          updatedAt: now,
        })
        .where(eq(ventas.id, id))
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error actualizando venta:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE - Eliminar venta (soft delete o reversión de distribución)
// ═══════════════════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID de venta requerido' }, { status: 400 })
    }
    
    // Obtener venta actual
    const [ventaActual] = await db.select().from(ventas).where(eq(ventas.id, id))
    
    if (!ventaActual) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }
    
    const now = new Date()
    
    // Si la venta tenía pagos, revertir la distribución de los bancos
    const montoPagado = ventaActual.montoPagado || 0
    
    if (montoPagado > 0) {
      // Revertir distribución proporcional
      const montoBovedaMonte = ventaActual.montoBovedaMonte || 0
      const montoFletes = ventaActual.montoFletes || 0
      const montoUtilidades = ventaActual.montoUtilidades || 0
      
      const proporcionPagada = montoPagado / (ventaActual.precioTotalVenta || 1)
      
      // Restar de cada banco
      if (montoBovedaMonte > 0) {
        const restar = montoBovedaMonte * proporcionPagada
        await db.update(bancos)
          .set({
            capitalActual: sql`capital_actual - ${restar}`,
            historicoIngresos: sql`historico_ingresos - ${restar}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, 'boveda_monte'))
      }
      
      if (montoFletes > 0) {
        const restar = montoFletes * proporcionPagada
        await db.update(bancos)
          .set({
            capitalActual: sql`capital_actual - ${restar}`,
            historicoIngresos: sql`historico_ingresos - ${restar}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, 'flete_sur'))
      }
      
      if (montoUtilidades > 0) {
        const restar = montoUtilidades * proporcionPagada
        await db.update(bancos)
          .set({
            capitalActual: sql`capital_actual - ${restar}`,
            historicoIngresos: sql`historico_ingresos - ${restar}`,
            updatedAt: now,
          })
          .where(eq(bancos.id, 'utilidades'))
      }
      
      // Actualizar saldo del cliente
      await db.update(clientes)
        .set({
          saldoPendiente: sql`saldo_pendiente - ${ventaActual.montoRestante || 0}`,
          totalCompras: sql`total_compras - ${ventaActual.precioTotalVenta || 0}`,
          updatedAt: now,
        })
        .where(eq(clientes.id, ventaActual.clienteId))
    }
    
    // Eliminar movimientos asociados
    await db.delete(movimientos).where(eq(movimientos.ventaId, id))
    
    // Eliminar la venta
    await db.delete(ventas).where(eq(ventas.id, id))
    
    return NextResponse.json({ 
      success: true, 
      message: 'Venta eliminada y distribución revertida' 
    })
    
  } catch (error) {
    console.error('Error eliminando venta:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
