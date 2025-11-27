/**
 * CHRONOS - Script de Migración FASE 4
 * 
 * Este script procesa:
 * - Movimientos de Bóveda Monte
 * - Movimientos de Utilidades
 * - Movimientos de otros bancos
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
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

// --- INTERFACES ---
interface CSVMovimiento {
  fecha: string
  cliente: string
  ingreso: string
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

function parseSpanishDate(dateStr: string): Date {
  // Formato: DD/MM/YYYY
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const day = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1 // Los meses en JS son 0-indexed
    const year = parseInt(parts[2])
    return new Date(year, month, day)
  }
  return new Date(dateStr)
}

// --- LÓGICA DE MIGRACIÓN ---

async function migrarMovimientosBanco(
  filePath: string, 
  bancoId: string, 
  bancoNombre: string,
  tipo: 'INGRESO' | 'UTILIDAD'
) {
  console.log(`\n📊 Migrando movimientos de ${bancoNombre}...`)
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️ No se encontró el archivo ${filePath}`)
    return { procesados: 0, total: 0 }
  }

  const movimientosRef = db.collection('movimientos')
  const bancosRef = db.collection('bancos')
  
  let batch = db.batch()
  let count = 0
  let batchCount = 0
  let totalMonto = 0

  return new Promise<{ procesados: number, total: number }>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', async (row: CSVMovimiento) => {
        if (!row.ingreso || parseNumber(row.ingreso) === 0) return

        const monto = parseNumber(row.ingreso)
        const fecha = parseSpanishDate(row.fecha)
        const clienteNombre = row.cliente?.trim() || ''
        const concepto = row.concepto?.trim() || ''

        const movRef = movimientosRef.doc()
        
        batch.set(movRef, {
          tipo: tipo,
          bancoId: bancoId,
          monto: monto,
          fecha: admin.firestore.Timestamp.fromDate(fecha),
          clienteId: clienteNombre ? normalizeId(clienteNombre) : null,
          clienteNombre: clienteNombre,
          concepto: concepto || `${tipo === 'UTILIDAD' ? 'Utilidad' : 'Ingreso'} ${clienteNombre}`,
          categoria: tipo === 'UTILIDAD' ? 'UTILIDAD_VENTA' : 'ABONO_CLIENTE',
          metadata: {
            migrado: true,
            archivoOrigen: path.basename(filePath)
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })

        count++
        batchCount++
        totalMonto += monto

        if (batchCount >= 400) {
          await batch.commit()
          batch = db.batch()
          batchCount = 0
        }
      })
      .on('end', async () => {
        // Commit final
        if (batchCount > 0) {
          await batch.commit()
        }

        // Actualizar saldo del banco con el total migrado
        await bancosRef.doc(bancoId).update({
          'metadata.montoMigrado': admin.firestore.FieldValue.increment(totalMonto),
          'metadata.movimientosMigrados': admin.firestore.FieldValue.increment(count),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        console.log(`   ✅ ${count} movimientos ($${totalMonto.toLocaleString()})`)
        resolve({ procesados: count, total: totalMonto })
      })
      .on('error', (error) => {
        console.error(`   ❌ Error:`, error)
        reject(error)
      })
  })
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║       CHRONOS - Migración FASE 4: Movimientos Bancarios    ║')
  console.log('╚════════════════════════════════════════════════════════════╝')

  const resultados: { banco: string, movimientos: number, monto: number }[] = []

  try {
    // Bóveda Monte
    const bovedaMonte = await migrarMovimientosBanco(
      path.join(__dirname, '../csv/boveda_monte.csv'),
      'boveda_monte',
      'Bóveda Monte',
      'INGRESO'
    )
    resultados.push({ banco: 'Bóveda Monte', movimientos: bovedaMonte.procesados, monto: bovedaMonte.total })

    // Utilidades
    const utilidades = await migrarMovimientosBanco(
      path.join(__dirname, '../csv/utilidades.csv'),
      'utilidades',
      'Fondo Utilidades',
      'UTILIDAD'
    )
    resultados.push({ banco: 'Utilidades', movimientos: utilidades.procesados, monto: utilidades.total })

    // Bóveda USA
    const bovedaUSA = await migrarMovimientosBanco(
      path.join(__dirname, '../csv/boveda_usa.csv'),
      'boveda_usa',
      'Bóveda USA',
      'INGRESO'
    )
    resultados.push({ banco: 'Bóveda USA', movimientos: bovedaUSA.procesados, monto: bovedaUSA.total })

    // Banco Azteca
    const azteca = await migrarMovimientosBanco(
      path.join(__dirname, '../csv/bancos_azteca.csv'),
      'azteca',
      'Banco Azteca',
      'INGRESO'
    )
    resultados.push({ banco: 'Azteca', movimientos: azteca.procesados, monto: azteca.total })

    // Leftie
    const leftie = await migrarMovimientosBanco(
      path.join(__dirname, '../csv/bancos_leftie.csv'),
      'leftie',
      'Leftie',
      'INGRESO'
    )
    resultados.push({ banco: 'Leftie', movimientos: leftie.procesados, monto: leftie.total })

    // Profit
    const profit = await migrarMovimientosBanco(
      path.join(__dirname, '../csv/bancos_profit.csv'),
      'profit',
      'Profit',
      'INGRESO'
    )
    resultados.push({ banco: 'Profit', movimientos: profit.procesados, monto: profit.total })

    // Resumen
    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║                  RESUMEN FASE 4                            ║')
    console.log('╠════════════════════════════════════════════════════════════╣')
    
    let totalMovimientos = 0
    let totalMonto = 0
    
    for (const r of resultados) {
      console.log(`║  ${r.banco.padEnd(20)} ${r.movimientos.toString().padStart(5)} mov.  $${r.monto.toLocaleString().padStart(12)} ║`)
      totalMovimientos += r.movimientos
      totalMonto += r.monto
    }
    
    console.log('╠════════════════════════════════════════════════════════════╣')
    console.log(`║  TOTAL:               ${totalMovimientos.toString().padStart(5)} mov.  $${totalMonto.toLocaleString().padStart(12)} ║`)
    console.log('╚════════════════════════════════════════════════════════════╝')

    console.log('\n🚀 MIGRACIÓN FASE 4 COMPLETADA.')
    process.exit(0)

  } catch (error) {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  }
}

main()
