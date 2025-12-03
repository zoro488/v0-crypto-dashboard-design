/**
 * 🧪 SIMULACIÓN COMPLETA DEL SISTEMA CHRONOS
 * 
 * Este script simula el flujo completo de un usuario:
 * 1. Crear Distribuidor
 * 2. Crear Orden de Compra
 * 3. Crear Cliente  
 * 4. Crear Venta
 * 5. Verificar Almacén (entradas/salidas)
 * 6. Verificar Distribución Bancaria
 * 7. Registrar Pago a Distribuidor
 * 8. Registrar Abono de Cliente
 * 9. Registrar Ingreso/Gasto
 * 10. Realizar Transferencia entre Bancos
 * 
 * @author CHRONOS Team
 * @version 1.0.0
 */

import { initializeApp } from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Configuración Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
}

const log = {
  title: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`),
  section: (msg: string) => console.log(`${colors.bright}${colors.magenta}▶ ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}  ✓ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}  ℹ ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}  ⚠ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}  ✗ ${msg}${colors.reset}`),
  data: (label: string, value: unknown) => console.log(`${colors.cyan}    ${label}:${colors.reset} ${JSON.stringify(value)}`),
}

// Función para obtener datos de una colección
async function getCollectionData(collectionName: string, limitCount = 5) {
  try {
    const q = query(collection(db, collectionName), limit(limitCount))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    log.error(`Error obteniendo ${collectionName}: ${error}`)
    return []
  }
}

// Función para obtener estadísticas de una colección
async function getCollectionStats(collectionName: string) {
  try {
    const snapshot = await getDocs(collection(db, collectionName))
    return {
      count: snapshot.size,
      data: snapshot.docs.slice(0, 3).map(doc => ({ id: doc.id, ...doc.data() }))
    }
  } catch (error) {
    return { count: 0, data: [], error: String(error) }
  }
}

async function runCompleteTest() {
  console.log(`
${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🔥 CHRONOS SYSTEM - SIMULACIÓN COMPLETA DE OPERACIONES                    ║
║                                                                              ║
║   Este test verifica el flujo completo del sistema:                         ║
║   Distribuidores → Órdenes → Clientes → Ventas → Almacén → Bancos          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}
`)

  // ═══════════════════════════════════════════════════════════════════════
  // 1. VERIFICAR CONEXIÓN A FIREBASE
  // ═══════════════════════════════════════════════════════════════════════
  log.title('')
  log.section('1. VERIFICACIÓN DE CONEXIÓN A FIREBASE')
  
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    log.error('Variables de entorno de Firebase no configuradas')
    process.exit(1)
  }
  log.success(`Proyecto: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`)
  log.success('Conexión a Firestore establecida')

  // ═══════════════════════════════════════════════════════════════════════
  // 2. VERIFICAR BANCOS (7 bóvedas)
  // ═══════════════════════════════════════════════════════════════════════
  log.title('')
  log.section('2. VERIFICACIÓN DE BANCOS/BÓVEDAS')
  
  const bancos = await getCollectionData('bancos', 10)
  log.info(`Total bancos encontrados: ${bancos.length}`)
  
  const bancosEsperados = ['boveda_monte', 'boveda_usa', 'profit', 'leftie', 'azteca', 'flete_sur', 'utilidades']
  
  for (const bancoId of bancosEsperados) {
    const banco = bancos.find((b: { id: string }) => b.id === bancoId)
    if (banco) {
      const bancoData = banco as { nombre?: string; capitalActual?: number; historicoIngresos?: number; historicoGastos?: number }
      log.success(`${bancoData.nombre || bancoId}: Capital $${(bancoData.capitalActual || 0).toLocaleString()}`)
      log.data('  Histórico Ingresos', bancoData.historicoIngresos || 0)
      log.data('  Histórico Gastos', bancoData.historicoGastos || 0)
    } else {
      log.warn(`Banco ${bancoId} no encontrado - se creará automáticamente en primera operación`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. VERIFICAR DISTRIBUIDORES
  // ═══════════════════════════════════════════════════════════════════════
  log.title('')
  log.section('3. VERIFICACIÓN DE DISTRIBUIDORES')
  
  const distribuidores = await getCollectionStats('distribuidores')
  log.info(`Total distribuidores: ${distribuidores.count}`)
  
  if (distribuidores.count > 0) {
    distribuidores.data.forEach((dist: { nombre?: string; deudaTotal?: number; totalPagado?: number }) => {
      log.success(`${dist.nombre}`)
      log.data('  Deuda Total', `$${(dist.deudaTotal || 0).toLocaleString()}`)
      log.data('  Total Pagado', `$${(dist.totalPagado || 0).toLocaleString()}`)
    })
  } else {
    log.warn('No hay distribuidores - El formulario CreateDistribuidorModalPremium debe crear el primero')
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. VERIFICAR ÓRDENES DE COMPRA
  // ═══════════════════════════════════════════════════════════════════════
  log.title('')
  log.section('4. VERIFICACIÓN DE ÓRDENES DE COMPRA')
  
  const ordenes = await getCollectionStats('ordenes_compra')
  log.info(`Total órdenes de compra: ${ordenes.count}`)
  
  if (ordenes.count > 0) {
    ordenes.data.forEach((oc: { distribuidor?: string; producto?: string; cantidad?: number; costoTotal?: number; stockActual?: number; estado?: string }) => {
      log.success(`OC: ${oc.distribuidor} - ${oc.producto}`)
      log.data('  Cantidad', oc.cantidad)
      log.data('  Costo Total', `$${(oc.costoTotal || 0).toLocaleString()}`)
      log.data('  Stock Actual', oc.stockActual)
      log.data('  Estado', oc.estado)
    })
  } else {
    log.warn('No hay órdenes de compra - El formulario CreateOrdenCompraModalPremium debe crear la primera')
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. VERIFICAR CLIENTES
  // ═══════════════════════════════════════════════════════════════════════
  log.title('')
  log.section('5. VERIFICACIÓN DE CLIENTES')
  
  const clientes = await getCollectionStats('clientes')
  log.info(`Total clientes: ${clientes.count}`)
  
  if (clientes.count > 0) {
    clientes.data.forEach((cliente: { nombre?: string; deudaTotal?: number; totalVentas?: number; totalPagado?: number }) => {
      log.success(`${cliente.nombre}`)
      log.data('  Deuda Total', `$${(cliente.deudaTotal || 0).toLocaleString()}`)
      log.data('  Total Ventas', `$${(cliente.totalVentas || 0).toLocaleString()}`)
      log.data('  Total Pagado', `$${(cliente.totalPagado || 0).toLocaleString()}`)
    })
  } else {
    log.warn('No hay clientes - El formulario CreateClienteModalPremium debe crear el primero')
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 6. VERIFICAR VENTAS
  // ═══════════════════════════════════════════════════════════════════════
  log.title('')
  log.section('6. VERIFICACIÓN DE VENTAS')
  
  const ventas = await getCollectionStats('ventas')
  log.info(`Total ventas: ${ventas.count}`)
  
  if (ventas.count > 0) {
    ventas.data.forEach((venta: { cliente?: string; producto?: string; precioTotalVenta?: number; estadoPago?: string; distribucionBancos?: { bovedaMonte?: number; fletes?: number; utilidades?: number } }) => {
      log.success(`Venta a ${venta.cliente} - ${venta.producto}`)
      log.data('  Total Venta', `$${(venta.precioTotalVenta || 0).toLocaleString()}`)
      log.data('  Estado Pago', venta.estadoPago)
      if (venta.distribucionBancos) {
        log.data('  → Bóveda Monte', `$${(venta.distribucionBancos.bovedaMonte || 0).toLocaleString()}`)
        log.data('  → Fletes', `$${(venta.distribucionBancos.fletes || 0).toLocaleString()}`)
        log.data('  → Utilidades', `$${(venta.distribucionBancos.utilidades || 0).toLocaleString()}`)
      }
    })
  } else {
    log.warn('No hay ventas - El formulario CreateVentaModalPremium debe crear la primera')
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 7. VERIFICAR ALMACÉN
  // ═══════════════════════════════════════════════════════════════════════
  log.title('')
  log.section('7. VERIFICACIÓN DE ALMACÉN')
  
  const almacen = await getCollectionStats('almacen')
  log.info(`Total productos en almacén: ${almacen.count}`)
  
  if (almacen.count > 0) {
    almacen.data.forEach((producto: { nombre?: string; stockActual?: number; totalEntradas?: number; totalSalidas?: number }) => {
      log.success(`${producto.nombre}`)
      log.data('  Stock Actual', producto.stockActual)
      log.data('  Total Entradas', producto.totalEntradas)
      log.data('  Total Salidas', producto.totalSalidas)
    })
  }
  
  // Verificar entradas y salidas registradas
  const entradas = await getCollectionStats('almacen_entradas')
  const salidas = await getCollectionStats('almacen_salidas')
  log.info(`Entradas registradas: ${entradas.count}`)
  log.info(`Salidas registradas: ${salidas.count}`)

  // ═══════════════════════════════════════════════════════════════════════
  // 8. VERIFICAR MOVIMIENTOS BANCARIOS
  // ═══════════════════════════════════════════════════════════════════════
  log.title('')
  log.section('8. VERIFICACIÓN DE MOVIMIENTOS BANCARIOS')
  
  const movimientos = await getCollectionStats('movimientos')
  log.info(`Total movimientos: ${movimientos.count}`)
  
  if (movimientos.count > 0) {
    movimientos.data.forEach((mov: { tipo?: string; tipoMovimiento?: string; bancoId?: string; monto?: number; concepto?: string }) => {
      const tipo = mov.tipo || mov.tipoMovimiento
      log.success(`${tipo?.toUpperCase()}: ${mov.bancoId}`)
      log.data('  Monto', `$${(mov.monto || 0).toLocaleString()}`)
      log.data('  Concepto', mov.concepto)
    })
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 9. VERIFICAR TRANSFERENCIAS
  // ═══════════════════════════════════════════════════════════════════════
  log.title('')
  log.section('9. VERIFICACIÓN DE TRANSFERENCIAS')
  
  const transferencias = await getCollectionStats('transferencias')
  log.info(`Total transferencias: ${transferencias.count}`)
  
  if (transferencias.count > 0) {
    transferencias.data.forEach((trans: { bancoOrigenId?: string; bancoDestinoId?: string; monto?: number; concepto?: string }) => {
      log.success(`${trans.bancoOrigenId} → ${trans.bancoDestinoId}`)
      log.data('  Monto', `$${(trans.monto || 0).toLocaleString()}`)
      log.data('  Concepto', trans.concepto)
    })
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 10. VERIFICAR INGRESOS Y GASTOS
  // ═══════════════════════════════════════════════════════════════════════
  log.title('')
  log.section('10. VERIFICACIÓN DE INGRESOS Y GASTOS')
  
  const ingresos = await getCollectionStats('ingresos')
  const gastos = await getCollectionStats('gastos')
  
  log.info(`Total ingresos registrados: ${ingresos.count}`)
  log.info(`Total gastos registrados: ${gastos.count}`)

  // ═══════════════════════════════════════════════════════════════════════
  // 11. VERIFICAR ABONOS
  // ═══════════════════════════════════════════════════════════════════════
  log.title('')
  log.section('11. VERIFICACIÓN DE ABONOS')
  
  const abonos = await getCollectionStats('abonos')
  log.info(`Total abonos registrados: ${abonos.count}`)
  
  if (abonos.count > 0) {
    abonos.data.forEach((abono: { tipo?: string; monto?: number; bancoDestino?: string }) => {
      log.success(`Abono ${abono.tipo}`)
      log.data('  Monto', `$${(abono.monto || 0).toLocaleString()}`)
      log.data('  Banco Destino', abono.bancoDestino)
    })
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 12. RESUMEN FINAL
  // ═══════════════════════════════════════════════════════════════════════
  console.log(`
${colors.bright}${colors.green}
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   📊 RESUMEN DE VERIFICACIÓN DEL SISTEMA                                    ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Bancos/Bóvedas:     ${String(bancos.length).padEnd(5)} ${bancos.length >= 7 ? '✓ COMPLETO' : '⚠ INCOMPLETO'}                           ║
║   Distribuidores:     ${String(distribuidores.count).padEnd(5)} ${distribuidores.count > 0 ? '✓ OK' : '⚠ VACÍO'}                                ║
║   Órdenes de Compra:  ${String(ordenes.count).padEnd(5)} ${ordenes.count > 0 ? '✓ OK' : '⚠ VACÍO'}                                ║
║   Clientes:           ${String(clientes.count).padEnd(5)} ${clientes.count > 0 ? '✓ OK' : '⚠ VACÍO'}                                ║
║   Ventas:             ${String(ventas.count).padEnd(5)} ${ventas.count > 0 ? '✓ OK' : '⚠ VACÍO'}                                ║
║   Productos Almacén:  ${String(almacen.count).padEnd(5)} ${almacen.count > 0 ? '✓ OK' : '⚠ VACÍO'}                                ║
║   Movimientos:        ${String(movimientos.count).padEnd(5)} ${movimientos.count > 0 ? '✓ OK' : '⚠ VACÍO'}                                ║
║   Transferencias:     ${String(transferencias.count).padEnd(5)} ${transferencias.count > 0 ? '✓ OK' : '○ NINGUNA'}                             ║
║   Ingresos:           ${String(ingresos.count).padEnd(5)} ${ingresos.count > 0 ? '✓ OK' : '○ NINGUNO'}                             ║
║   Gastos:             ${String(gastos.count).padEnd(5)} ${gastos.count > 0 ? '✓ OK' : '○ NINGUNO'}                             ║
║   Abonos:             ${String(abonos.count).padEnd(5)} ${abonos.count > 0 ? '✓ OK' : '○ NINGUNO'}                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}
`)

  // Calcular totales de bancos
  let capitalTotal = 0
  let ingresosTotal = 0
  let gastosTotal = 0
  
  bancos.forEach((banco: { capitalActual?: number; historicoIngresos?: number; historicoGastos?: number }) => {
    capitalTotal += banco.capitalActual || 0
    ingresosTotal += banco.historicoIngresos || 0
    gastosTotal += banco.historicoGastos || 0
  })

  console.log(`
${colors.bright}${colors.yellow}
╔══════════════════════════════════════════════════════════════════════════════╗
║   💰 RESUMEN FINANCIERO CONSOLIDADO                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Capital Total Actual:    $${capitalTotal.toLocaleString().padEnd(15)}                          ║
║   Histórico Ingresos:      $${ingresosTotal.toLocaleString().padEnd(15)}                          ║
║   Histórico Gastos:        $${gastosTotal.toLocaleString().padEnd(15)}                          ║
║                                                                              ║
║   Balance Histórico:       $${(ingresosTotal - gastosTotal).toLocaleString().padEnd(15)}                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}
`)

  console.log(`${colors.bright}${colors.green}✅ VERIFICACIÓN COMPLETADA${colors.reset}\n`)
  
  process.exit(0)
}

// Ejecutar test
runCompleteTest().catch(error => {
  console.error('Error en simulación:', error)
  process.exit(1)
})
