/**
 * CHRONOS - Script de Migración FASE 3
 * 
 * Este script procesa las ventas con:
 * - Validación de stock contra Órdenes de Compra
 * - Cálculo de utilidades reales
 * - Actualización atómica de inventario
 * - Registro de movimientos financieros
 * 
 * @author Chronos System
 * @version 1.0.0
 */

import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'
import csv from 'csv-parser'
import { config } from 'dotenv'

// Configuración inicial
config({ path: '.env.local' })

// Inicializar Firebase Admin
let serviceAccount: admin.ServiceAccount

try {
  serviceAccount = require('../serviceAccountKey.json')
} catch {
  console.error('❌ ERROR: No se encontró serviceAccountKey.json')
  console.error('   Descárgalo desde Firebase Console:')
  console.error('   Project Settings > Service Accounts > Generate New Private Key')
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

// --- INTERFAZ DEL CSV ---
interface CSVVenta {
  fecha: string
  ocRelacionada: string
  cantidad: string
  cliente: string
  bovedaMonte: string
  precioVenta: string
  ingreso: string
  flete: string
  fleteUtilidad: string
  utilidad: string
  estatus: string
  concepto: string
}

// --- UTILIDADES ---

function parseNumber(value: string | undefined | null): number {
  if (!value) return 0
  const cleaned = value.toString().replace(/[^0-9.-]+/g, '')
  return parseFloat(cleaned) || 0
}

function normalizeId(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function parseDate(value: string): Date {
  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

// --- LÓGICA DE MIGRACIÓN ---

async function migrarVentas() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║       CHRONOS - Migración FASE 3: Ventas                   ║')
  console.log('║       Stock, Flujo de Caja y Utilidades                    ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  
  const filePath = path.join(__dirname, '../csv/ventas.csv')
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ No se encontró el archivo csv/ventas.csv')
    process.exit(1)
  }

  const ventasRef = db.collection('ventas')
  const ocsRef = db.collection('ordenesCompra')
  const movimientosRef = db.collection('movimientos')
  const bancosRef = db.collection('bancos')
  const clientesRef = db.collection('clientes')

  let procesados = 0
  let errores = 0
  const errorLog: string[] = []

  // Leer todo el CSV a memoria
  const rows: CSVVenta[] = []
  
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: CSVVenta) => rows.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`\n📂 CSV Leído. Procesando ${rows.length} transacciones...\n`)

  // Procesar secuencialmente para garantizar consistencia
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    
    if (!row.ocRelacionada || !row.cantidad) {
      continue
    }

    const ocId = row.ocRelacionada.trim()
    const cantidadVenta = parseInt(row.cantidad) || 0
    const precioVentaTotal = parseNumber(row.ingreso)
    const precioVentaUnitario = parseNumber(row.precioVenta)
    const costoFlete = parseNumber(row.fleteUtilidad)
    const bovedaMonte = parseNumber(row.bovedaMonte)
    const utilidadCSV = parseNumber(row.utilidad)
    
    const fechaVenta = parseDate(row.fecha)
    const clienteNombre = row.cliente?.trim() || 'CLIENTE DESCONOCIDO'
    const clienteId = normalizeId(clienteNombre)
    const estatus = row.estatus?.toLowerCase() || 'pendiente'
    const concepto = row.concepto?.trim() || ''

    try {
      await db.runTransaction(async (transaction) => {
        // 1. LEER LA OC (Fuente de Verdad del Costo)
        const ocDoc = await transaction.get(ocsRef.doc(ocId))
        
        if (!ocDoc.exists) {
          throw new Error(`OC No encontrada: ${ocId}`)
        }

        const ocData = ocDoc.data()!
        const costoUnitarioReal = ocData.costos?.unitarioCalculado || 6300

        // 2. CÁLCULOS FINANCIEROS BLINDADOS
        const costoTotalMercancia = costoUnitarioReal * cantidadVenta
        
        // Fórmula Maestra: Utilidad = Ingreso - (CostoProd + Flete)
        const utilidadCalculada = precioVentaTotal - costoTotalMercancia - costoFlete
        
        // Usar utilidad del CSV si está especificada, sino la calculada
        const utilidadFinal = utilidadCSV !== 0 ? utilidadCSV : utilidadCalculada

        // 3. CREAR DOCUMENTO DE VENTA
        const nuevaVentaRef = ventasRef.doc()
        
        transaction.set(nuevaVentaRef, {
          ocRelacionadaId: ocId,
          clienteId: clienteId,
          clienteNombre: clienteNombre,
          fecha: admin.firestore.Timestamp.fromDate(fechaVenta),
          
          // Valores de la transacción
          cantidad: cantidadVenta,
          precioVenta: precioVentaUnitario,
          precioTotalVenta: precioVentaTotal,
          
          // Distribución a bancos
          distribucionBancos: {
            bovedaMonte: bovedaMonte || precioVentaTotal,
            fletes: costoFlete,
            utilidades: utilidadFinal
          },

          // Costos y resultados
          costos: {
            unitarioBase: costoUnitarioReal,
            totalMercancia: costoTotalMercancia,
            flete: costoFlete
          },
          
          resultados: {
            utilidadCalculada: utilidadCalculada,
            utilidadRegistrada: utilidadFinal
          },

          // Estado
          estadoPago: estatus === 'pagado' ? 'completo' : 'pendiente',
          montoPagado: estatus === 'pagado' ? precioVentaTotal : 0,
          montoRestante: estatus === 'pagado' ? 0 : precioVentaTotal,
          
          // Flete
          aplicaFlete: row.flete?.toLowerCase() === 'aplica',
          
          // Metadata
          concepto: concepto,
          metadata: {
            migrado: true,
            fechaMigracion: admin.firestore.FieldValue.serverTimestamp()
          },
          
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        // 4. ACTUALIZAR STOCK DE LA OC
        const stockActual = ocData.stock?.actual || 0
        const nuevoStock = Math.max(0, stockActual - cantidadVenta)
        
        transaction.update(ocsRef.doc(ocId), {
          'stock.actual': nuevoStock,
          'stock.vendido': admin.firestore.FieldValue.increment(cantidadVenta),
          'estatus': nuevoStock > 0 ? 'ACTIVA' : 'AGOTADA',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        // 5. ACTUALIZAR O CREAR CLIENTE
        const clienteDoc = await transaction.get(clientesRef.doc(clienteId))
        
        if (clienteDoc.exists) {
          const deudaIncremento = estatus === 'pagado' ? 0 : precioVentaTotal
          const pagadoIncremento = estatus === 'pagado' ? precioVentaTotal : 0
          
          transaction.update(clientesRef.doc(clienteId), {
            totalVentas: admin.firestore.FieldValue.increment(precioVentaTotal),
            deudaTotal: admin.firestore.FieldValue.increment(deudaIncremento),
            totalPagado: admin.firestore.FieldValue.increment(pagadoIncremento),
            ventas: admin.firestore.FieldValue.arrayUnion(nuevaVentaRef.id),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          })
        } else {
          // Crear cliente si no existe
          transaction.set(clientesRef.doc(clienteId), {
            nombre: clienteNombre,
            totalVentas: precioVentaTotal,
            deudaTotal: estatus === 'pagado' ? 0 : precioVentaTotal,
            totalPagado: estatus === 'pagado' ? precioVentaTotal : 0,
            ventas: [nuevaVentaRef.id],
            historialPagos: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          })
        }

        // 6. REGISTRAR MOVIMIENTO DE DINERO (Solo si está pagado)
        if (estatus === 'pagado') {
          const movRef = movimientosRef.doc()
          
          transaction.set(movRef, {
            tipo: 'INGRESO',
            concepto: `Venta ${ocId} - ${clienteNombre}${concepto ? ` (${concepto})` : ''}`,
            monto: precioVentaTotal,
            fecha: admin.firestore.Timestamp.fromDate(fechaVenta),
            bancoId: 'boveda_monte',
            referenciaVentaId: nuevaVentaRef.id,
            categoria: 'VENTA_MERCANCIA',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          })

          // 7. ACTUALIZAR SALDO DEL BANCO
          transaction.update(bancosRef.doc('boveda_monte'), {
            saldoActual: admin.firestore.FieldValue.increment(bovedaMonte || precioVentaTotal),
            capitalActual: admin.firestore.FieldValue.increment(bovedaMonte || precioVentaTotal),
            historicoIngresos: admin.firestore.FieldValue.increment(precioVentaTotal),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          })

          // Registrar utilidad
          if (utilidadFinal > 0) {
            transaction.update(bancosRef.doc('utilidades'), {
              saldoActual: admin.firestore.FieldValue.increment(utilidadFinal),
              capitalActual: admin.firestore.FieldValue.increment(utilidadFinal),
              historicoIngresos: admin.firestore.FieldValue.increment(utilidadFinal),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            })
          }

          // Registrar flete
          if (costoFlete > 0) {
            transaction.update(bancosRef.doc('fletes'), {
              saldoActual: admin.firestore.FieldValue.increment(costoFlete),
              capitalActual: admin.firestore.FieldValue.increment(costoFlete),
              historicoIngresos: admin.firestore.FieldValue.increment(costoFlete),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            })
          }
        }
      })

      process.stdout.write('✓')
      procesados++

    } catch (error) {
      const errorMsg = `Fila ${i + 2}: ${clienteNombre} / ${ocId} - ${error instanceof Error ? error.message : 'Error desconocido'}`
      errorLog.push(errorMsg)
      process.stdout.write('✗')
      errores++
    }

    // Pequeña pausa cada 50 registros para no saturar Firestore
    if ((i + 1) % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // Resumen final
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                    RESUMEN FASE 3                          ║')
  console.log('╠════════════════════════════════════════════════════════════╣')
  console.log(`║  ✅ Procesados con éxito: ${procesados.toString().padEnd(32)}║`)
  console.log(`║  ❌ Errores: ${errores.toString().padEnd(45)}║`)
  console.log('╚════════════════════════════════════════════════════════════╝')

  if (errorLog.length > 0) {
    console.log('\n📋 Detalle de errores:')
    errorLog.slice(0, 20).forEach(err => console.log(`   - ${err}`))
    if (errorLog.length > 20) {
      console.log(`   ... y ${errorLog.length - 20} errores más.`)
    }
  }

  console.log('\n📌 Verifica en Firebase Console:')
  console.log('   - Colección "ventas" con documentos nuevos')
  console.log('   - Colección "ordenesCompra" con stock actualizado')
  console.log('   - Colección "bancos" con saldos incrementados')
  console.log('   - Colección "clientes" con ventas y deudas')
}

// --- EJECUCIÓN ---
migrarVentas()
  .then(() => {
    console.log('\n🚀 MIGRACIÓN FASE 3 COMPLETADA.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })
