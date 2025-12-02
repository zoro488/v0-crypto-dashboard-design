/**
 * 🔥 Script para limpiar y migrar datos a Firestore
 * 
 * Este script:
 * 1. Limpia todas las colecciones existentes
 * 2. Migra los datos desde archivos CSV
 * 3. Inicializa los 7 bancos del sistema
 * 
 * Uso: npx tsx scripts/clear-and-migrate-firestore.ts
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
import 'dotenv/config'

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validar configuración
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Error: Variables de entorno de Firebase no configuradas')
  console.error('   Copia .env.local.template a .env.local y configura las credenciales')
  process.exit(1)
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Colores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Todas las colecciones a limpiar
const COLLECTIONS_TO_CLEAR = [
  'bancos',
  'ventas',
  'clientes',
  'distribuidores',
  'ordenes_compra',
  'productos',
  'almacen',
  'movimientos',
  'transferencias',
  'abonos',
  'gastos',
  'ingresos',
  'almacen_productos',
  'almacen_entradas',
  'almacen_salidas',
  'boveda_monte_ingresos',
  'boveda_monte_gastos',
  'boveda_usa_ingresos',
  'boveda_usa_gastos',
  'profit_ingresos',
  'profit_gastos',
  'leftie_ingresos',
  'leftie_gastos',
  'azteca_ingresos',
  'azteca_gastos',
  'flete_sur_ingresos',
  'flete_sur_gastos',
  'utilidades_ingresos',
  'utilidades_gastos',
  'cortes_bancarios',
  'dashboard_stats',
  'audit_logs',
  'configuracion',
]

// Configuración inicial de los 7 bancos
const BANCOS_INICIALES = [
  {
    id: 'boveda_monte',
    nombre: 'Bóveda Monte',
    icon: '🏛️',
    color: 'from-amber-500 to-orange-600',
    colorHex: '#F59E0B',
    tipo: 'boveda',
    descripcion: 'Bóveda principal MXN - Recibe costos de productos',
    moneda: 'MXN',
    capitalActual: 0,
    capitalInicial: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    historicoTransferencias: 0,
    estado: 'activo',
  },
  {
    id: 'boveda_usa',
    nombre: 'Bóveda USA',
    icon: '🇺🇸',
    color: 'from-blue-500 to-indigo-600',
    colorHex: '#3B82F6',
    tipo: 'boveda',
    descripcion: 'Bóveda USD - Operaciones en dólares',
    moneda: 'USD',
    capitalActual: 0,
    capitalInicial: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    historicoTransferencias: 0,
    estado: 'activo',
  },
  {
    id: 'profit',
    nombre: 'Profit',
    icon: '📈',
    color: 'from-emerald-500 to-teal-600',
    colorHex: '#10B981',
    tipo: 'operativo',
    descripcion: 'Banco operativo principal',
    moneda: 'MXN',
    capitalActual: 0,
    capitalInicial: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    historicoTransferencias: 0,
    estado: 'activo',
  },
  {
    id: 'leftie',
    nombre: 'Leftie',
    icon: '💳',
    color: 'from-purple-500 to-pink-600',
    colorHex: '#8B5CF6',
    tipo: 'operativo',
    descripcion: 'Banco operativo secundario',
    moneda: 'MXN',
    capitalActual: 0,
    capitalInicial: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    historicoTransferencias: 0,
    estado: 'activo',
  },
  {
    id: 'azteca',
    nombre: 'Azteca',
    icon: '🏦',
    color: 'from-yellow-500 to-amber-600',
    colorHex: '#EAB308',
    tipo: 'operativo',
    descripcion: 'Banco Azteca',
    moneda: 'MXN',
    capitalActual: 0,
    capitalInicial: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    historicoTransferencias: 0,
    estado: 'activo',
  },
  {
    id: 'flete_sur',
    nombre: 'Fletes Sur',
    icon: '🚚',
    color: 'from-slate-500 to-gray-600',
    colorHex: '#64748B',
    tipo: 'gastos',
    descripcion: 'Gastos de transporte y fletes',
    moneda: 'MXN',
    capitalActual: 0,
    capitalInicial: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    historicoTransferencias: 0,
    estado: 'activo',
  },
  {
    id: 'utilidades',
    nombre: 'Utilidades',
    icon: '💰',
    color: 'from-green-500 to-emerald-600',
    colorHex: '#22C55E',
    tipo: 'utilidades',
    descripcion: 'Ganancias netas del sistema',
    moneda: 'MXN',
    capitalActual: 0,
    capitalInicial: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    historicoTransferencias: 0,
    estado: 'activo',
  },
]

/**
 * Limpiar una colección de Firestore
 */
async function clearCollection(collectionName: string): Promise<number> {
  try {
    const collRef = collection(db, collectionName)
    const snapshot = await getDocs(collRef)
    
    if (snapshot.empty) {
      return 0
    }
    
    // Usar batches para mejor rendimiento
    const batchSize = 500
    let deletedCount = 0
    const docs = snapshot.docs
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db)
      const chunk = docs.slice(i, i + batchSize)
      
      chunk.forEach(docSnapshot => {
        batch.delete(doc(db, collectionName, docSnapshot.id))
      })
      
      await batch.commit()
      deletedCount += chunk.length
    }
    
    return deletedCount
  } catch (error) {
    console.error(`Error limpiando ${collectionName}:`, error)
    return 0
  }
}

/**
 * Limpiar todas las colecciones
 */
async function clearAllCollections(): Promise<void> {
  log('\n🗑️  LIMPIANDO FIRESTORE...', 'yellow')
  log('=' .repeat(50), 'yellow')
  
  let totalDeleted = 0
  
  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    const count = await clearCollection(collectionName)
    if (count > 0) {
      log(`  ✓ ${collectionName}: ${count} documentos eliminados`, 'green')
      totalDeleted += count
    }
  }
  
  log(`\n✅ Total eliminados: ${totalDeleted} documentos`, 'green')
}

/**
 * Inicializar los 7 bancos
 */
async function initializeBancos(): Promise<void> {
  log('\n🏦 INICIALIZANDO BANCOS...', 'blue')
  log('=' .repeat(50), 'blue')
  
  const now = Timestamp.now()
  
  for (const banco of BANCOS_INICIALES) {
    await setDoc(doc(db, 'bancos', banco.id), {
      ...banco,
      createdAt: now,
      updatedAt: now,
    })
    log(`  ✓ ${banco.nombre} (${banco.id})`, 'green')
  }
  
  log(`\n✅ ${BANCOS_INICIALES.length} bancos inicializados`, 'green')
}

/**
 * Parsear CSV a objetos
 */
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows: Record<string, string>[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: Record<string, string> = {}
    
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    
    rows.push(row)
  }
  
  return rows
}

/**
 * Migrar clientes desde CSV
 */
async function migrateClientes(): Promise<number> {
  const csvPath = path.join(process.cwd(), 'csv', 'clientes.csv')
  
  if (!fs.existsSync(csvPath)) {
    log('  ⚠️  clientes.csv no encontrado', 'yellow')
    return 0
  }
  
  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(content)
  
  const batch = writeBatch(db)
  const now = Timestamp.now()
  let count = 0
  
  for (const row of rows) {
    if (!row.nombre) continue
    
    const id = `CLI${String(count + 1).padStart(4, '0')}`
    const clienteRef = doc(db, 'clientes', id)
    
    batch.set(clienteRef, {
      id,
      nombre: row.nombre || row.Nombre || '',
      telefono: row.telefono || row.Telefono || '',
      email: row.email || row.Email || '',
      direccion: row.direccion || row.Direccion || '',
      actual: parseFloat(row.actual || row.Actual || '0') || 0,
      deuda: parseFloat(row.deuda || row.Deuda || '0') || 0,
      abonos: parseFloat(row.abonos || row.Abonos || '0') || 0,
      pendiente: parseFloat(row.pendiente || row.Pendiente || '0') || 0,
      totalVentas: 0,
      totalPagado: 0,
      deudaTotal: parseFloat(row.deuda || row.Deuda || '0') || 0,
      numeroCompras: 0,
      keywords: [
        (row.nombre || '').toLowerCase(),
        (row.telefono || '').toLowerCase(),
      ].filter(Boolean),
      estado: 'activo',
      createdAt: now,
      updatedAt: now,
    })
    
    count++
  }
  
  if (count > 0) {
    await batch.commit()
  }
  
  return count
}

/**
 * Migrar distribuidores desde CSV
 */
async function migrateDistribuidores(): Promise<number> {
  const csvPath = path.join(process.cwd(), 'csv', 'distribuidores_clean.csv')
  
  if (!fs.existsSync(csvPath)) {
    log('  ⚠️  distribuidores_clean.csv no encontrado', 'yellow')
    return 0
  }
  
  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(content)
  
  const batch = writeBatch(db)
  const now = Timestamp.now()
  let count = 0
  
  for (const row of rows) {
    if (!row.nombre && !row.Nombre) continue
    
    const nombre = row.nombre || row.Nombre || ''
    const id = `DIST${String(count + 1).padStart(4, '0')}`
    const distRef = doc(db, 'distribuidores', id)
    
    batch.set(distRef, {
      id,
      nombre,
      empresa: row.empresa || row.Empresa || nombre,
      contacto: row.contacto || row.Contacto || '',
      telefono: row.telefono || row.Telefono || '',
      email: row.email || row.Email || '',
      direccion: row.direccion || row.Direccion || '',
      costoTotal: parseFloat(row.costoTotal || '0') || 0,
      abonos: parseFloat(row.abonos || '0') || 0,
      pendiente: parseFloat(row.pendiente || '0') || 0,
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
  
  if (count > 0) {
    await batch.commit()
  }
  
  return count
}

/**
 * Migrar ventas desde CSV
 */
async function migrateVentas(): Promise<number> {
  const csvPath = path.join(process.cwd(), 'csv', 'ventas.csv')
  
  if (!fs.existsSync(csvPath)) {
    log('  ⚠️  ventas.csv no encontrado', 'yellow')
    return 0
  }
  
  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(content)
  
  const now = Timestamp.now()
  let count = 0
  
  // Procesar en batches de 500
  for (let i = 0; i < rows.length; i += 500) {
    const batch = writeBatch(db)
    const chunk = rows.slice(i, i + 500)
    
    for (const row of chunk) {
      if (!row.cliente && !row.Cliente) continue
      
      const id = `VTA${String(count + 1).padStart(5, '0')}`
      const ventaRef = doc(db, 'ventas', id)
      
      const cantidad = parseFloat(row.cantidad || row.Cantidad || '1') || 1
      const precioVenta = parseFloat(row.precioVenta || row.PrecioVenta || row.precio || '0') || 0
      const precioCompra = parseFloat(row.precioCompra || row.PrecioCompra || row.costo || '0') || 0
      const flete = parseFloat(row.flete || row.Flete || '0') || 0
      const ingreso = cantidad * precioVenta
      const utilidad = (precioVenta - precioCompra - flete) * cantidad
      
      batch.set(ventaRef, {
        id,
        fecha: row.fecha || row.Fecha || new Date().toISOString().split('T')[0],
        ocRelacionada: row.ocRelacionada || row.OC || '',
        clienteId: '',
        cliente: row.cliente || row.Cliente || '',
        cantidad,
        precioVenta,
        precioCompra,
        ingreso,
        totalVenta: ingreso,
        precioTotalVenta: ingreso,
        flete: flete > 0 ? 'Aplica' : 'NoAplica',
        fleteUtilidad: flete * cantidad,
        precioFlete: flete,
        utilidad,
        ganancia: utilidad,
        bovedaMonte: precioCompra * cantidad,
        distribucionBancos: {
          bovedaMonte: precioCompra * cantidad,
          fletes: flete * cantidad,
          utilidades: utilidad,
        },
        estatus: row.estatus || row.Estatus || 'Pagado',
        estadoPago: (row.estatus || 'Pagado').toLowerCase() === 'pagado' ? 'completo' : 'pendiente',
        montoPagado: ingreso,
        montoRestante: 0,
        adeudo: 0,
        keywords: [(row.cliente || '').toLowerCase()],
        createdAt: now,
        updatedAt: now,
      })
      
      count++
    }
    
    await batch.commit()
  }
  
  return count
}

/**
 * Migrar órdenes de compra desde CSV
 */
async function migrateOrdenesCompra(): Promise<number> {
  const csvPath = path.join(process.cwd(), 'csv', 'ordenes_compra_clean.csv')
  
  if (!fs.existsSync(csvPath)) {
    // Intentar con el otro nombre
    const altPath = path.join(process.cwd(), 'csv', 'ordenes_compra.csv')
    if (!fs.existsSync(altPath)) {
      log('  ⚠️  ordenes_compra.csv no encontrado', 'yellow')
      return 0
    }
  }
  
  const csvPath2 = fs.existsSync(path.join(process.cwd(), 'csv', 'ordenes_compra_clean.csv'))
    ? path.join(process.cwd(), 'csv', 'ordenes_compra_clean.csv')
    : path.join(process.cwd(), 'csv', 'ordenes_compra.csv')
  
  const content = fs.readFileSync(csvPath2, 'utf-8')
  const rows = parseCSV(content)
  
  const batch = writeBatch(db)
  const now = Timestamp.now()
  let count = 0
  
  for (const row of rows) {
    if (!row.distribuidor && !row.Distribuidor && !row.origen) continue
    
    const id = row.id || row.ID || `OC${String(count + 1).padStart(4, '0')}`
    const ocRef = doc(db, 'ordenes_compra', id)
    
    const cantidad = parseFloat(row.cantidad || row.Cantidad || '1') || 1
    const costoDistribuidor = parseFloat(row.costoDistribuidor || row.costo || '0') || 0
    const costoTransporte = parseFloat(row.costoTransporte || row.flete || '0') || 0
    const costoPorUnidad = costoDistribuidor + costoTransporte
    const costoTotal = costoPorUnidad * cantidad
    const pagoDistribuidor = parseFloat(row.pago || row.pagoDistribuidor || '0') || 0
    
    batch.set(ocRef, {
      id,
      fecha: row.fecha || row.Fecha || new Date().toISOString().split('T')[0],
      distribuidorId: '',
      distribuidor: row.distribuidor || row.Distribuidor || row.origen || '',
      origen: row.origen || row.distribuidor || '',
      producto: row.producto || row.Producto || '',
      cantidad,
      costoDistribuidor,
      costoTransporte,
      costoPorUnidad,
      costoTotal,
      stockActual: cantidad,
      stockInicial: cantidad,
      pagoDistribuidor,
      pagoInicial: pagoDistribuidor,
      deuda: costoTotal - pagoDistribuidor,
      estado: pagoDistribuidor >= costoTotal ? 'pagado' : pagoDistribuidor > 0 ? 'parcial' : 'pendiente',
      keywords: [(row.distribuidor || '').toLowerCase()],
      createdAt: now,
      updatedAt: now,
    })
    
    count++
  }
  
  if (count > 0) {
    await batch.commit()
  }
  
  return count
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  log('\n🔥 CHRONOS SYSTEM - FIRESTORE MIGRATION', 'cyan')
  log('=' .repeat(50), 'cyan')
  log(`Proyecto: ${firebaseConfig.projectId}`, 'cyan')
  log(`Fecha: ${new Date().toLocaleString()}`, 'cyan')
  
  try {
    // 1. Limpiar todas las colecciones
    await clearAllCollections()
    
    // 2. Inicializar bancos
    await initializeBancos()
    
    // 3. Migrar datos
    log('\n📦 MIGRANDO DATOS CSV...', 'blue')
    log('=' .repeat(50), 'blue')
    
    const clientesCount = await migrateClientes()
    log(`  ✓ Clientes: ${clientesCount} registros`, 'green')
    
    const distCount = await migrateDistribuidores()
    log(`  ✓ Distribuidores: ${distCount} registros`, 'green')
    
    const ventasCount = await migrateVentas()
    log(`  ✓ Ventas: ${ventasCount} registros`, 'green')
    
    const ocCount = await migrateOrdenesCompra()
    log(`  ✓ Órdenes de Compra: ${ocCount} registros`, 'green')
    
    const total = clientesCount + distCount + ventasCount + ocCount + BANCOS_INICIALES.length
    
    log('\n' + '=' .repeat(50), 'green')
    log(`✅ MIGRACIÓN COMPLETADA: ${total} registros totales`, 'green')
    log('=' .repeat(50), 'green')
    
  } catch (error) {
    log(`\n❌ ERROR: ${error}`, 'red')
    process.exit(1)
  }
  
  process.exit(0)
}

// Ejecutar
main()
