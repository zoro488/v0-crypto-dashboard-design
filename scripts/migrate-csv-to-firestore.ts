/**
 * 🚀 SCRIPT DE MIGRACIÓN - CSV A FIRESTORE
 * CHRONOS SYSTEM - 2025-11-26
 * 
 * Migra todos los datos de los CSVs a Firestore:
 * - bancos (7 configuraciones)
 * - ventas (96 registros)
 * - clientes (31 registros)
 * - distribuidores (6 registros)
 * - ordenes_compra (9 registros)
 * - movimientos (310+ registros unificados de todos los bancos)
 * - almacen (9 registros)
 * 
 * Uso: npx ts-node scripts/migrate-csv-to-firestore.ts
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'

// ===================================================================
// CONFIGURACIÓN
// ===================================================================

// Usar credenciales de servicio o emulador
const PROJECT_ID = 'premium-ecosystem-1760790572'

// Inicializar Firebase Admin (sin credenciales usa el emulador o gcloud auth)
initializeApp({
  projectId: PROJECT_ID,
})

const db = getFirestore()
const CSV_DIR = path.join(__dirname, '..', 'csv')

// ===================================================================
// UTILIDADES
// ===================================================================

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []
  
  // Parsear header
  const headers = parseCSVLine(lines[0])
  
  // Parsear filas
  return lines.slice(1)
    .map(line => {
      const values = parseCSVLine(line)
      const obj: Record<string, string> = {}
      headers.forEach((header, i) => {
        obj[header.trim()] = values[i]?.trim() || ''
      })
      return obj
    })
    .filter(row => {
      // Filtrar filas vacías
      const values = Object.values(row)
      return values.some(v => v && v !== '0' && v !== '')
    })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.replace(/^"|"$/g, ''))
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.replace(/^"|"$/g, ''))
  return result
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString()
  
  // Formato DD/MM/YYYY
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  
  // Formato Excel (número de días desde 1900)
  if (/^\d{5}$/.test(dateStr)) {
    const excelDate = parseInt(dateStr)
    const date = new Date((excelDate - 25569) * 86400 * 1000)
    return date.toISOString().split('T')[0]
  }
  
  // Ya está en formato ISO
  if (dateStr.includes('-')) {
    return dateStr.split('T')[0]
  }
  
  return dateStr
}

function parseNumber(value: string): number {
  if (!value) return 0
  // Remover caracteres no numéricos excepto punto y signo negativo
  const cleaned = value.replace(/[^0-9.-]/g, '')
  return parseFloat(cleaned) || 0
}

function generateId(prefix: string, index: number): string {
  return `${prefix}-${Date.now()}-${index}`
}

// ===================================================================
// MIGRACIÓN: BANCOS
// ===================================================================

async function migrateBancos() {
  console.log('\n🏦 Migrando BANCOS...')
  
  const bancos = [
    {
      id: 'boveda_monte',
      nombre: 'Bóveda Monte',
      icon: '🏔️',
      color: '#8B5CF6',
      tipo: 'boveda',
      descripcion: 'Bóveda principal para operaciones de venta',
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo'
    },
    {
      id: 'boveda_usa',
      nombre: 'Bóveda USA',
      icon: '🇺🇸',
      color: '#3B82F6',
      tipo: 'boveda',
      descripcion: 'Bóveda para operaciones en dólares',
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo'
    },
    {
      id: 'profit',
      nombre: 'Profit',
      icon: '💰',
      color: '#10B981',
      tipo: 'operativo',
      descripcion: 'Banco operativo principal',
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo'
    },
    {
      id: 'leftie',
      nombre: 'Leftie',
      icon: '🏦',
      color: '#F59E0B',
      tipo: 'operativo',
      descripcion: 'Banco operativo secundario',
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo'
    },
    {
      id: 'azteca',
      nombre: 'Azteca',
      icon: '🦅',
      color: '#EF4444',
      tipo: 'operativo',
      descripcion: 'Banco Azteca',
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo'
    },
    {
      id: 'flete_sur',
      nombre: 'Flete Sur',
      icon: '🚚',
      color: '#6366F1',
      tipo: 'gastos',
      descripcion: 'Gastos de transporte y fletes',
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo'
    },
    {
      id: 'utilidades',
      nombre: 'Utilidades',
      icon: '📈',
      color: '#22C55E',
      tipo: 'utilidades',
      descripcion: 'Ganancias y utilidades del sistema',
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo'
    }
  ]
  
  const batch = db.batch()
  
  for (const banco of bancos) {
    const ref = db.collection('bancos').doc(banco.id)
    batch.set(ref, {
      ...banco,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
  }
  
  await batch.commit()
  console.log(`   ✅ ${bancos.length} bancos migrados`)
  return bancos.length
}

// ===================================================================
// MIGRACIÓN: VENTAS
// ===================================================================

async function migrateVentas() {
  console.log('\n📦 Migrando VENTAS...')
  
  const csvPath = path.join(CSV_DIR, 'ventas.csv')
  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(content)
  
  let count = 0
  const batchSize = 500
  let batch = db.batch()
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.cliente && !row.fecha) continue
    
    const id = `VENTA-${parseDate(row.fecha)}-${row.cliente}-${i}`
    const ref = db.collection('ventas').doc(id.replace(/[\/\s]/g, '-'))
    
    batch.set(ref, {
      fecha: parseDate(row.fecha),
      ocRelacionada: row.ocRelacionada || '',
      cantidad: parseNumber(row.cantidad),
      cliente: row.cliente || '',
      bovedaMonte: parseNumber(row.bovedaMonte),
      precioVenta: parseNumber(row.precioVenta),
      ingreso: parseNumber(row.ingreso),
      flete: row.flete === 'Aplica' ? 'Aplica' : 'NoAplica',
      fleteUtilidad: parseNumber(row.fleteUtilidad),
      utilidad: parseNumber(row.utilidad),
      estatus: row.estatus || 'Pendiente',
      concepto: row.concepto || '',
      totalVenta: parseNumber(row.ingreso),
      estadoPago: row.estatus === 'Pagado' ? 'completo' : 'pendiente',
      montoPagado: row.estatus === 'Pagado' ? parseNumber(row.ingreso) : 0,
      adeudo: row.estatus === 'Pagado' ? 0 : parseNumber(row.ingreso),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    count++
    
    if (count % batchSize === 0) {
      await batch.commit()
      batch = db.batch()
      console.log(`   📝 ${count} ventas procesadas...`)
    }
  }
  
  if (count % batchSize !== 0) {
    await batch.commit()
  }
  
  console.log(`   ✅ ${count} ventas migradas`)
  return count
}

// ===================================================================
// MIGRACIÓN: CLIENTES
// ===================================================================

async function migrateClientes() {
  console.log('\n👥 Migrando CLIENTES...')
  
  const csvPath = path.join(CSV_DIR, 'clientes.csv')
  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(content)
  
  const batch = db.batch()
  let count = 0
  
  for (const row of rows) {
    if (!row.cliente) continue
    
    const id = row.cliente.replace(/[\/\s]/g, '-').substring(0, 50)
    const ref = db.collection('clientes').doc(id)
    
    batch.set(ref, {
      nombre: row.cliente,
      actual: parseNumber(row.actual),
      deuda: parseNumber(row.deuda),
      abonos: parseNumber(row.abonos),
      pendiente: parseNumber(row.pendiente),
      observaciones: row.observaciones || '',
      estado: 'activo',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    count++
  }
  
  await batch.commit()
  console.log(`   ✅ ${count} clientes migrados`)
  return count
}

// ===================================================================
// MIGRACIÓN: DISTRIBUIDORES
// ===================================================================

async function migrateDistribuidores() {
  console.log('\n🏭 Migrando DISTRIBUIDORES...')
  
  const distribuidores = [
    { id: 'PACMAN', nombre: 'PACMAN', costoTotal: 6142500, abonos: 0, pendiente: 6142500 },
    { id: 'Q-MAYA', nombre: 'Q-MAYA', costoTotal: 6098400, abonos: 0, pendiente: 6098400 },
    { id: 'AX', nombre: 'A/X🌶️🦀', costoTotal: 207900, abonos: 0, pendiente: 207900 },
    { id: 'CH-MONTE', nombre: 'CH-MONTE', costoTotal: 630000, abonos: 953100, pendiente: -323100 },
    { id: 'VALLE-MONTE', nombre: 'VALLE-MONTE', costoTotal: 140000, abonos: 0, pendiente: 140000 },
    { id: 'Q-MAYA-MP', nombre: 'Q-MAYA-MP', costoTotal: 1260000, abonos: 0, pendiente: 1260000 }
  ]
  
  const batch = db.batch()
  
  for (const dist of distribuidores) {
    const ref = db.collection('distribuidores').doc(dist.id)
    batch.set(ref, {
      ...dist,
      estado: 'activo',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
  }
  
  await batch.commit()
  console.log(`   ✅ ${distribuidores.length} distribuidores migrados`)
  return distribuidores.length
}

// ===================================================================
// MIGRACIÓN: ÓRDENES DE COMPRA
// ===================================================================

async function migrateOrdenesCompra() {
  console.log('\n📋 Migrando ÓRDENES DE COMPRA...')
  
  const csvPath = path.join(CSV_DIR, 'ordenes_compra.csv')
  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(content)
  
  const batch = db.batch()
  let count = 0
  
  for (const row of rows) {
    if (!row.id) continue
    
    const ref = db.collection('ordenes_compra').doc(row.id)
    
    batch.set(ref, {
      fecha: parseDate(row.fecha),
      origen: row.origen || '',
      cantidad: parseNumber(row.cantidad),
      costoDistribuidor: parseNumber(row.costoDistribuidor),
      costoTransporte: parseNumber(row.costoTransporte),
      costoPorUnidad: parseNumber(row.costoPorUnidad),
      stockActual: parseNumber(row.stockActual),
      costoTotal: parseNumber(row.costoTotal),
      pagoDistribuidor: parseNumber(row.pagoDistribuidor),
      deuda: parseNumber(row.deuda),
      estado: parseNumber(row.deuda) <= 0 ? 'pagado' : 'pendiente',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    count++
  }
  
  await batch.commit()
  console.log(`   ✅ ${count} órdenes de compra migradas`)
  return count
}

// ===================================================================
// MIGRACIÓN: MOVIMIENTOS BANCARIOS (Unificados)
// ===================================================================

async function migrateMovimientos() {
  console.log('\n💸 Migrando MOVIMIENTOS BANCARIOS...')
  
  let totalCount = 0
  
  // Mapeo de archivos CSV a bancoId
  const csvToBanco: Record<string, string> = {
    'boveda_monte.csv': 'boveda_monte',
    'boveda_usa.csv': 'boveda_usa',
    'bancos_profit.csv': 'profit',
    'bancos_leftie.csv': 'leftie',
    'bancos_azteca.csv': 'azteca',
    'flete_sur.csv': 'flete_sur',
    'utilidades.csv': 'utilidades'
  }
  
  for (const [csvFile, bancoId] of Object.entries(csvToBanco)) {
    const csvPath = path.join(CSV_DIR, csvFile)
    
    if (!fs.existsSync(csvPath)) {
      console.log(`   ⚠️  ${csvFile} no encontrado, saltando...`)
      continue
    }
    
    const content = fs.readFileSync(csvPath, 'utf-8')
    const rows = parseCSV(content)
    
    let count = 0
    let batch = db.batch()
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      
      // Determinar el monto y tipo de movimiento
      let monto = 0
      let tipoMovimiento = 'ingreso'
      
      if (row.ingreso) {
        monto = parseNumber(row.ingreso)
        tipoMovimiento = 'ingreso'
      } else if (row.gasto) {
        monto = parseNumber(row.gasto)
        tipoMovimiento = 'gasto'
      } else if (row.valor) {
        monto = parseNumber(row.valor)
        tipoMovimiento = row.origen?.toLowerCase().includes('gasto') ? 'gasto' : 'ingreso'
      }
      
      if (monto === 0) continue
      
      const id = `MOV-${bancoId}-${parseDate(row.fecha)}-${i}`
      const ref = db.collection('movimientos').doc(id.replace(/[\/\s]/g, '-'))
      
      batch.set(ref, {
        bancoId,
        tipoMovimiento,
        fecha: parseDate(row.fecha),
        monto,
        cliente: row.cliente || row.origen || '',
        origen: row.origen || '',
        destino: row.destino || bancoId,
        concepto: row.concepto || '',
        observaciones: row.observaciones || '',
        tc: parseNumber(row.tc),
        pesos: parseNumber(row.pesos),
        dolares: parseNumber(row.dolares),
        createdAt: Timestamp.now()
      })
      
      count++
      
      if (count % 400 === 0) {
        await batch.commit()
        batch = db.batch()
      }
    }
    
    if (count % 400 !== 0) {
      await batch.commit()
    }
    
    console.log(`   📝 ${csvFile}: ${count} movimientos`)
    totalCount += count
  }
  
  console.log(`   ✅ ${totalCount} movimientos totales migrados`)
  return totalCount
}

// ===================================================================
// MIGRACIÓN: GASTOS Y ABONOS
// ===================================================================

async function migrateGastosAbonos() {
  console.log('\n💳 Migrando GASTOS Y ABONOS...')
  
  const csvPath = path.join(CSV_DIR, 'gastos_abonos.csv')
  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(content)
  
  let count = 0
  let batch = db.batch()
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const valor = parseNumber(row.valor)
    if (valor === 0) continue
    
    const id = `GA-${parseDate(row.fecha)}-${i}`
    const ref = db.collection('gastos_abonos').doc(id.replace(/[\/\s]/g, '-'))
    
    batch.set(ref, {
      fecha: parseDate(row.fecha),
      origen: row.origen || '',
      valor,
      tc: parseNumber(row.tc),
      pesos: parseNumber(row.pesos),
      destino: row.destino || '',
      concepto: row.concepto || '',
      observaciones: row.observaciones || '',
      tipo: row.origen?.toLowerCase().includes('gasto') ? 'gasto' : 'abono',
      createdAt: Timestamp.now()
    })
    
    count++
    
    if (count % 400 === 0) {
      await batch.commit()
      batch = db.batch()
      console.log(`   📝 ${count} gastos/abonos procesados...`)
    }
  }
  
  if (count % 400 !== 0) {
    await batch.commit()
  }
  
  console.log(`   ✅ ${count} gastos/abonos migrados`)
  return count
}

// ===================================================================
// MIGRACIÓN: ALMACÉN
// ===================================================================

async function migrateAlmacen() {
  console.log('\n📦 Migrando ALMACÉN...')
  
  const csvPath = path.join(CSV_DIR, 'almacen.csv')
  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(content)
  
  const batch = db.batch()
  let count = 0
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.oc) continue
    
    const id = `ALM-${row.oc}-${i}`
    const ref = db.collection('almacen').doc(id)
    
    batch.set(ref, {
      oc: row.oc,
      cliente: row.cliente || '',
      distribuidor: row.distribuidor || '',
      cantidad: parseNumber(row.cantidad),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    count++
  }
  
  await batch.commit()
  console.log(`   ✅ ${count} items de almacén migrados`)
  return count
}

// ===================================================================
// FUNCIÓN PRINCIPAL
// ===================================================================

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║         🚀 MIGRACIÓN CSV → FIRESTORE - CHRONOS SYSTEM                    ║
╚══════════════════════════════════════════════════════════════════════════╝
  `)
  
  const results: Record<string, number> = {}
  
  try {
    results.bancos = await migrateBancos()
    results.ventas = await migrateVentas()
    results.clientes = await migrateClientes()
    results.distribuidores = await migrateDistribuidores()
    results.ordenes_compra = await migrateOrdenesCompra()
    results.movimientos = await migrateMovimientos()
    results.gastos_abonos = await migrateGastosAbonos()
    results.almacen = await migrateAlmacen()
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║                    ✅ MIGRACIÓN COMPLETADA                               ║
╠══════════════════════════════════════════════════════════════════════════╣
║  Colección           │ Registros                                         ║
║──────────────────────┼───────────────────────────────────────────────────║`)
    
    let total = 0
    for (const [col, count] of Object.entries(results)) {
      console.log(`║  ${col.padEnd(20)} │ ${count.toString().padStart(6)}                                            ║`)
      total += count
    }
    
    console.log(`║──────────────────────┼───────────────────────────────────────────────────║
║  TOTAL               │ ${total.toString().padStart(6)}                                            ║
╚══════════════════════════════════════════════════════════════════════════╝
    `)
    
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

main()
