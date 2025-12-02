/**
 * 🔥 SCRIPT COMPLETO DE MIGRACIÓN - CHRONOS SYSTEM
 * 
 * Migra TODOS los datos CSV a Firestore:
 * - 7 Bancos inicializados
 * - Clientes
 * - Ventas  
 * - Órdenes de Compra
 * - Movimientos de cada banco
 * - Gastos y Abonos
 * - Almacén
 * - Utilidades
 * 
 * Uso: npx tsx scripts/migrate-all-complete.ts
 */

import { initializeApp } from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc,
  writeBatch,
  Timestamp
} from 'firebase/firestore'
import * as fs from 'fs'
import * as path from 'path'

// Configuración de Firebase - premium-ecosystem-1760790572
const firebaseConfig = {
  apiKey: 'AIzaSyCR7zKZJAzCEq-jBbfkLJxWaz98zuRCkX4',
  authDomain: 'premium-ecosystem-1760790572.firebaseapp.com',
  projectId: 'premium-ecosystem-1760790572',
  storageBucket: 'premium-ecosystem-1760790572.firebasestorage.app',
  messagingSenderId: '100411784487',
  appId: '1:100411784487:web:ac2713291717869bc83d02',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Colores para console
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function log(msg: string, color: keyof typeof c = 'reset') {
  console.log(`${c[color]}${msg}${c.reset}`)
}

// Parsear fecha en varios formatos
function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  
  // Formato DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      const [day, month, year] = parts
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
  }
  
  // Formato YYYY-MM-DD
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr
  }
  
  return new Date().toISOString().split('T')[0]
}

// Parsear CSV a objetos
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n').filter(l => l.trim() && !l.startsWith('#'))
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows: Record<string, string>[] = []
  
  for (let i = 1; i < lines.length; i++) {
    // Manejar campos con comas dentro de comillas
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/"/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim().replace(/"/g, ''))
    
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    rows.push(row)
  }
  
  return rows
}

// Configuración de los 7 bancos
const BANCOS = [
  { id: 'boveda_monte', nombre: 'Bóveda Monte', icon: '🏛️', color: 'from-amber-500 to-orange-600', tipo: 'boveda', moneda: 'MXN' },
  { id: 'boveda_usa', nombre: 'Bóveda USA', icon: '🇺🇸', color: 'from-blue-500 to-indigo-600', tipo: 'boveda', moneda: 'USD' },
  { id: 'profit', nombre: 'Profit', icon: '📈', color: 'from-emerald-500 to-teal-600', tipo: 'operativo', moneda: 'MXN' },
  { id: 'leftie', nombre: 'Leftie', icon: '💳', color: 'from-purple-500 to-pink-600', tipo: 'operativo', moneda: 'MXN' },
  { id: 'azteca', nombre: 'Azteca', icon: '🏦', color: 'from-yellow-500 to-amber-600', tipo: 'operativo', moneda: 'MXN' },
  { id: 'flete_sur', nombre: 'Fletes Sur', icon: '🚚', color: 'from-slate-500 to-gray-600', tipo: 'gastos', moneda: 'MXN' },
  { id: 'utilidades', nombre: 'Utilidades', icon: '💰', color: 'from-green-500 to-emerald-600', tipo: 'utilidades', moneda: 'MXN' },
]

// Todas las colecciones a limpiar
const ALL_COLLECTIONS = [
  'bancos', 'ventas', 'clientes', 'distribuidores', 'ordenes_compra',
  'productos', 'almacen', 'movimientos', 'transferencias', 'abonos', 
  'ingresos', 'gastos', 'gastos_abonos',
  'almacen_productos', 'almacen_entradas', 'almacen_salidas',
  'boveda_monte_ingresos', 'boveda_monte_gastos',
  'boveda_usa_ingresos', 'boveda_usa_gastos',
  'profit_ingresos', 'profit_gastos',
  'leftie_ingresos', 'leftie_gastos',
  'azteca_ingresos', 'azteca_gastos',
  'flete_sur_ingresos', 'flete_sur_gastos',
  'utilidades_ingresos', 'utilidades_gastos',
  'cortes_bancarios', 'dashboard_stats', 'audit_logs', 'configuracion',
]

// ===== FUNCIONES DE LIMPIEZA =====

async function clearCollection(name: string): Promise<number> {
  try {
    const snap = await getDocs(collection(db, name))
    if (snap.empty) return 0
    
    const batch = writeBatch(db)
    let count = 0
    
    for (const docSnap of snap.docs) {
      batch.delete(doc(db, name, docSnap.id))
      count++
      if (count >= 500) break
    }
    
    await batch.commit()
    
    // Si hay más de 500, recursivamente limpiar
    if (snap.docs.length > 500) {
      return count + await clearCollection(name)
    }
    
    return count
  } catch {
    return 0
  }
}

async function clearAllCollections(): Promise<void> {
  log('\n🗑️  LIMPIANDO TODAS LAS COLECCIONES...', 'yellow')
  log('═'.repeat(60), 'yellow')
  
  let total = 0
  for (const name of ALL_COLLECTIONS) {
    const count = await clearCollection(name)
    if (count > 0) {
      log(`  ✓ ${name}: ${count} docs`, 'green')
      total += count
    }
  }
  log(`\n✅ Total eliminados: ${total} documentos\n`, 'green')
}

// ===== FUNCIONES DE MIGRACIÓN =====

async function migrateBancos(): Promise<void> {
  log('\n🏦 INICIALIZANDO 7 BANCOS...', 'blue')
  
  const now = Timestamp.now()
  const batch = writeBatch(db)
  
  for (const banco of BANCOS) {
    batch.set(doc(db, 'bancos', banco.id), {
      ...banco,
      capitalActual: 0,
      capitalInicial: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo',
      createdAt: now,
      updatedAt: now,
    })
  }
  
  await batch.commit()
  log(`  ✓ ${BANCOS.length} bancos inicializados`, 'green')
}

async function migrateClientes(): Promise<number> {
  log('\n👥 MIGRANDO CLIENTES...', 'blue')
  
  const csvPath = path.join(process.cwd(), 'csv', 'clientes.csv')
  if (!fs.existsSync(csvPath)) {
    log('  ⚠️ clientes.csv no encontrado', 'yellow')
    return 0
  }
  
  const rows = parseCSV(fs.readFileSync(csvPath, 'utf-8'))
  const now = Timestamp.now()
  let count = 0
  
  for (let i = 0; i < rows.length; i += 500) {
    const batch = writeBatch(db)
    const chunk = rows.slice(i, i + 500)
    
    for (const row of chunk) {
      const nombre = row.cliente || row.nombre || row.Nombre || ''
      if (!nombre) continue
      
      const id = `CLI${String(count + 1).padStart(4, '0')}`
      batch.set(doc(db, 'clientes', id), {
        id,
        nombre,
        telefono: row.telefono || '',
        email: row.email || '',
        direccion: row.direccion || '',
        actual: parseFloat(row.actual || '0') || 0,
        deuda: parseFloat(row.deuda || '0') || 0,
        abonos: parseFloat(row.abonos || '0') || 0,
        pendiente: parseFloat(row.pendiente || '0') || 0,
        observaciones: row.observaciones || '',
        totalVentas: 0,
        totalPagado: 0,
        deudaTotal: Math.abs(parseFloat(row.pendiente || '0')) || 0,
        numeroCompras: 0,
        keywords: [nombre.toLowerCase()],
        estado: 'activo',
        createdAt: now,
        updatedAt: now,
      })
      count++
    }
    
    await batch.commit()
  }
  
  log(`  ✓ ${count} clientes migrados`, 'green')
  return count
}

async function migrateDistribuidores(): Promise<number> {
  log('\n🏭 CREANDO DISTRIBUIDORES...', 'blue')
  
  // Extraer distribuidores únicos de órdenes de compra
  const csvPath = path.join(process.cwd(), 'csv', 'ordenes_compra_clean.csv')
  if (!fs.existsSync(csvPath)) {
    log('  ⚠️ ordenes_compra_clean.csv no encontrado', 'yellow')
    return 0
  }
  
  const rows = parseCSV(fs.readFileSync(csvPath, 'utf-8'))
  const distribuidores = new Set<string>()
  
  for (const row of rows) {
    const origen = row.origen || row.Origen || ''
    if (origen) distribuidores.add(origen)
  }
  
  const now = Timestamp.now()
  const batch = writeBatch(db)
  let count = 0
  
  for (const nombre of distribuidores) {
    const id = `DIST${String(count + 1).padStart(4, '0')}`
    batch.set(doc(db, 'distribuidores', id), {
      id,
      nombre,
      empresa: nombre,
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      costoTotal: 0,
      abonos: 0,
      pendiente: 0,
      totalOrdenesCompra: 0,
      totalPagado: 0,
      deudaTotal: 0,
      numeroOrdenes: 0,
      keywords: [nombre.toLowerCase()],
      estado: 'activo',
      createdAt: now,
      updatedAt: now,
    })
    count++
  }
  
  await batch.commit()
  log(`  ✓ ${count} distribuidores creados`, 'green')
  return count
}

async function migrateOrdenesCompra(): Promise<number> {
  log('\n📦 MIGRANDO ÓRDENES DE COMPRA...', 'blue')
  
  const csvPath = path.join(process.cwd(), 'csv', 'ordenes_compra_clean.csv')
  if (!fs.existsSync(csvPath)) return 0
  
  const rows = parseCSV(fs.readFileSync(csvPath, 'utf-8'))
  const now = Timestamp.now()
  const batch = writeBatch(db)
  let count = 0
  
  for (const row of rows) {
    const id = row.id || row.OC || `OC${String(count + 1).padStart(4, '0')}`
    const cantidad = parseFloat(row.cantidad || row.Cantidad || '0') || 0
    const costoDistribuidor = parseFloat(row.costoDistribuidor || row['Costo Distribuidor'] || '0') || 0
    const costoTransporte = parseFloat(row.costoTransporte || row['Costo Transporte'] || '0') || 0
    const costoPorUnidad = costoDistribuidor + costoTransporte
    const costoTotal = costoPorUnidad * cantidad
    const pagoDistribuidor = parseFloat(row.pagoDistribuidor || row['Pago a Distribuidor'] || '0') || 0
    const deuda = parseFloat(row.deuda || row.Deuda || String(costoTotal - pagoDistribuidor)) || 0
    
    batch.set(doc(db, 'ordenes_compra', id), {
      id,
      fecha: parseDate(row.fecha || row.Fecha || ''),
      distribuidorId: '',
      distribuidor: row.origen || row.Origen || '',
      origen: row.origen || row.Origen || '',
      cantidad,
      costoDistribuidor,
      costoTransporte,
      costoPorUnidad,
      costoTotal,
      stockActual: parseFloat(row.stockActual || row['Stock Actual'] || String(cantidad)) || 0,
      stockInicial: cantidad,
      pagoDistribuidor,
      pagoInicial: pagoDistribuidor,
      deuda,
      estado: row.estado || (deuda <= 0 ? 'pagado' : pagoDistribuidor > 0 ? 'parcial' : 'pendiente'),
      keywords: [(row.origen || '').toLowerCase()],
      createdAt: now,
      updatedAt: now,
    })
    count++
  }
  
  await batch.commit()
  log(`  ✓ ${count} órdenes migradas`, 'green')
  return count
}

async function migrateVentas(): Promise<number> {
  log('\n💰 MIGRANDO VENTAS...', 'blue')
  
  const csvPath = path.join(process.cwd(), 'csv', 'ventas.csv')
  if (!fs.existsSync(csvPath)) return 0
  
  const rows = parseCSV(fs.readFileSync(csvPath, 'utf-8'))
  const now = Timestamp.now()
  let count = 0
  
  for (let i = 0; i < rows.length; i += 500) {
    const batch = writeBatch(db)
    const chunk = rows.slice(i, i + 500)
    
    for (const row of chunk) {
      const id = `VTA${String(count + 1).padStart(5, '0')}`
      const cantidad = parseFloat(row.cantidad || '1') || 1
      const precioVenta = parseFloat(row.precioVenta || '0') || 0
      const ingreso = parseFloat(row.ingreso || String(cantidad * precioVenta)) || 0
      const bovedaMonte = parseFloat(row.bovedaMonte || '0') || 0
      const fleteUtilidad = parseFloat(row.fleteUtilidad || '0') || 0
      const utilidad = parseFloat(row.utilidad || '0') || 0
      
      batch.set(doc(db, 'ventas', id), {
        id,
        fecha: parseDate(row.fecha || ''),
        ocRelacionada: row.ocRelacionada || '',
        clienteId: '',
        cliente: row.cliente || '',
        cantidad,
        precioVenta,
        precioCompra: bovedaMonte / cantidad || 0,
        ingreso,
        totalVenta: ingreso,
        precioTotalVenta: ingreso,
        flete: row.flete || 'NoAplica',
        fleteUtilidad,
        precioFlete: fleteUtilidad / cantidad || 0,
        utilidad,
        ganancia: utilidad,
        bovedaMonte,
        distribucionBancos: {
          bovedaMonte,
          fletes: fleteUtilidad,
          utilidades: utilidad,
        },
        estatus: row.estatus || 'Pagado',
        estadoPago: (row.estatus || 'Pagado').toLowerCase() === 'pagado' ? 'completo' : 'pendiente',
        montoPagado: ingreso,
        montoRestante: 0,
        adeudo: 0,
        concepto: row.concepto || '',
        keywords: [(row.cliente || '').toLowerCase()],
        createdAt: now,
        updatedAt: now,
      })
      count++
    }
    
    await batch.commit()
  }
  
  log(`  ✓ ${count} ventas migradas`, 'green')
  return count
}

async function migrateMovimientosBanco(
  bancoId: string, 
  csvFileName: string, 
  tipo: 'ingreso' | 'gasto'
): Promise<number> {
  const csvPath = path.join(process.cwd(), 'csv', csvFileName)
  if (!fs.existsSync(csvPath)) return 0
  
  const rows = parseCSV(fs.readFileSync(csvPath, 'utf-8'))
  const now = Timestamp.now()
  const collectionName = `${bancoId}_${tipo === 'ingreso' ? 'ingresos' : 'gastos'}`
  let count = 0
  
  for (let i = 0; i < rows.length; i += 500) {
    const batch = writeBatch(db)
    const chunk = rows.slice(i, i + 500)
    
    for (const row of chunk) {
      const id = `MOV${String(count + 1).padStart(5, '0')}`
      const monto = parseFloat(row.ingreso || row.gasto || row.valor || '0') || 0
      
      batch.set(doc(db, collectionName, id), {
        id,
        bancoId,
        tipoMovimiento: tipo,
        fecha: parseDate(row.fecha || ''),
        monto,
        concepto: row.concepto || row.observaciones || '',
        cliente: row.cliente || row.origen || '',
        origen: row.origen || row.cliente || '',
        destino: row.destino || bancoId,
        tc: parseFloat(row.tc || '0') || 0,
        pesos: parseFloat(row.pesos || '0') || 0,
        dolares: parseFloat(row.dolares || '0') || 0,
        observaciones: row.observaciones || '',
        createdAt: now,
        updatedAt: now,
      })
      count++
    }
    
    await batch.commit()
  }
  
  return count
}

async function migrateAllBancoMovimientos(): Promise<number> {
  log('\n📊 MIGRANDO MOVIMIENTOS POR BANCO...', 'blue')
  
  let total = 0
  
  // Bóveda Monte
  const bmCount = await migrateMovimientosBanco('boveda_monte', 'boveda_monte.csv', 'ingreso')
  if (bmCount > 0) log(`  ✓ boveda_monte_ingresos: ${bmCount}`, 'green')
  total += bmCount
  
  // Bóveda USA
  const buCount = await migrateMovimientosBanco('boveda_usa', 'boveda_usa.csv', 'ingreso')
  if (buCount > 0) log(`  ✓ boveda_usa_ingresos: ${buCount}`, 'green')
  total += buCount
  
  // Profit
  const pCount = await migrateMovimientosBanco('profit', 'bancos_profit.csv', 'ingreso')
  if (pCount > 0) log(`  ✓ profit_ingresos: ${pCount}`, 'green')
  total += pCount
  
  // Leftie
  const lCount = await migrateMovimientosBanco('leftie', 'bancos_leftie.csv', 'ingreso')
  if (lCount > 0) log(`  ✓ leftie_ingresos: ${lCount}`, 'green')
  total += lCount
  
  // Azteca
  const aCount = await migrateMovimientosBanco('azteca', 'bancos_azteca.csv', 'ingreso')
  if (aCount > 0) log(`  ✓ azteca_ingresos: ${aCount}`, 'green')
  total += aCount
  
  // Flete Sur (gastos)
  const fCount = await migrateMovimientosBanco('flete_sur', 'flete_sur.csv', 'gasto')
  if (fCount > 0) log(`  ✓ flete_sur_gastos: ${fCount}`, 'green')
  total += fCount
  
  // Utilidades
  const uCount = await migrateMovimientosBanco('utilidades', 'utilidades.csv', 'ingreso')
  if (uCount > 0) log(`  ✓ utilidades_ingresos: ${uCount}`, 'green')
  total += uCount
  
  return total
}

async function migrateGastosAbonos(): Promise<number> {
  log('\n💸 MIGRANDO GASTOS Y ABONOS...', 'blue')
  
  const csvPath = path.join(process.cwd(), 'csv', 'gastos_abonos.csv')
  if (!fs.existsSync(csvPath)) return 0
  
  const rows = parseCSV(fs.readFileSync(csvPath, 'utf-8'))
  const now = Timestamp.now()
  let count = 0
  
  for (let i = 0; i < rows.length; i += 500) {
    const batch = writeBatch(db)
    const chunk = rows.slice(i, i + 500)
    
    for (const row of chunk) {
      const id = `GYA${String(count + 1).padStart(5, '0')}`
      const monto = parseFloat(row.valor || row.pesos || '0') || 0
      const destino = (row.destino || '').toLowerCase().replace(/\s+/g, '_')
      
      batch.set(doc(db, 'gastos_abonos', id), {
        id,
        fecha: parseDate(row.fecha || ''),
        tipo: destino.includes('gasto') ? 'gasto' : 'abono',
        origen: row.origen || '',
        valor: monto,
        monto,
        tc: parseFloat(row.tc || '0') || 0,
        pesos: parseFloat(row.pesos || String(monto)) || monto,
        destino: row.destino || '',
        bancoId: destino.replace('gasto_', '').replace('boveda_', 'boveda_'),
        concepto: row.concepto || '',
        observaciones: row.observaciones || '',
        createdAt: now,
        updatedAt: now,
      })
      count++
    }
    
    await batch.commit()
  }
  
  log(`  ✓ ${count} gastos/abonos migrados`, 'green')
  return count
}

async function migrateAlmacen(): Promise<number> {
  log('\n📦 MIGRANDO ALMACÉN...', 'blue')
  
  const csvPath = path.join(process.cwd(), 'csv', 'almacen.csv')
  if (!fs.existsSync(csvPath)) return 0
  
  const rows = parseCSV(fs.readFileSync(csvPath, 'utf-8'))
  const now = Timestamp.now()
  const batch = writeBatch(db)
  let count = 0
  
  for (const row of rows) {
    const id = `ALM${String(count + 1).padStart(5, '0')}`
    
    batch.set(doc(db, 'almacen', id), {
      id,
      oc: row.oc || '',
      cliente: row.cliente || '',
      distribuidor: row.distribuidor || '',
      cantidad: parseFloat(row.cantidad || '0') || 0,
      createdAt: now,
      updatedAt: now,
    })
    count++
  }
  
  if (count > 0) await batch.commit()
  log(`  ✓ ${count} items de almacén migrados`, 'green')
  return count
}

// ===== FUNCIÓN PRINCIPAL =====

async function main(): Promise<void> {
  console.clear()
  log('╔════════════════════════════════════════════════════════════╗', 'cyan')
  log('║   🔥 CHRONOS SYSTEM - MIGRACIÓN COMPLETA A FIRESTORE      ║', 'cyan')
  log('╚════════════════════════════════════════════════════════════╝', 'cyan')
  log(`\nProyecto: premium-ecosystem-1760790572`, 'cyan')
  log(`Fecha: ${new Date().toLocaleString()}\n`, 'cyan')
  
  try {
    // 1. Limpiar todo
    await clearAllCollections()
    
    // 2. Migrar datos
    await migrateBancos()
    const clientes = await migrateClientes()
    const distribuidores = await migrateDistribuidores()
    const ordenes = await migrateOrdenesCompra()
    const ventas = await migrateVentas()
    const movimientos = await migrateAllBancoMovimientos()
    const gastosAbonos = await migrateGastosAbonos()
    const almacen = await migrateAlmacen()
    
    // Resumen
    const total = 7 + clientes + distribuidores + ordenes + ventas + movimientos + gastosAbonos + almacen
    
    log('\n╔════════════════════════════════════════════════════════════╗', 'green')
    log('║               ✅ MIGRACIÓN COMPLETADA                      ║', 'green')
    log('╠════════════════════════════════════════════════════════════╣', 'green')
    log(`║  🏦 Bancos:          7                                     ║`, 'green')
    log(`║  👥 Clientes:        ${String(clientes).padEnd(37)}║`, 'green')
    log(`║  🏭 Distribuidores:  ${String(distribuidores).padEnd(37)}║`, 'green')
    log(`║  📦 Órdenes Compra:  ${String(ordenes).padEnd(37)}║`, 'green')
    log(`║  💰 Ventas:          ${String(ventas).padEnd(37)}║`, 'green')
    log(`║  📊 Movimientos:     ${String(movimientos).padEnd(37)}║`, 'green')
    log(`║  💸 Gastos/Abonos:   ${String(gastosAbonos).padEnd(37)}║`, 'green')
    log(`║  📦 Almacén:         ${String(almacen).padEnd(37)}║`, 'green')
    log('╠════════════════════════════════════════════════════════════╣', 'green')
    log(`║  📊 TOTAL:           ${String(total).padEnd(37)}║`, 'green')
    log('╚════════════════════════════════════════════════════════════╝', 'green')
    
  } catch (error) {
    log(`\n❌ ERROR: ${error}`, 'red')
    process.exit(1)
  }
  
  process.exit(0)
}

main()
