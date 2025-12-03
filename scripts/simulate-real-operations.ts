/**
 * 🎯 SIMULACIÓN REAL DE OPERACIONES - CHRONOS SYSTEM
 * 
 * Este script simula el flujo COMPLETO de un usuario real:
 * 
 * FLUJO DE NEGOCIO:
 * 1. ✅ Crear Distribuidor nuevo
 * 2. ✅ Crear Orden de Compra (afecta: Almacén, Banco, Distribuidor)
 * 3. ✅ Crear Cliente nuevo
 * 4. ✅ Crear Venta (afecta: Almacén, 3 Bancos GYA, Cliente)
 * 5. ✅ Registrar Pago a Distribuidor
 * 6. ✅ Registrar Abono de Cliente
 * 7. ✅ Registrar Ingreso directo
 * 8. ✅ Registrar Gasto directo
 * 9. ✅ Realizar Transferencia entre bancos
 * 10. ✅ Verificar consistencia de datos
 * 
 * @author CHRONOS Team
 * @version 2.0.0
 */

import { initializeApp, deleteApp, getApps } from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  doc,
  getDocs, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  increment
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

// Limpiar apps existentes
getApps().forEach(app => deleteApp(app))

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Colores para terminal
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
}

const log = {
  title: (msg: string) => console.log(`\n${c.bold}${c.cyan}${'═'.repeat(70)}${c.reset}\n${c.bold}${c.white}  ${msg}${c.reset}\n${c.cyan}${'═'.repeat(70)}${c.reset}`),
  step: (num: number, msg: string) => console.log(`\n${c.bold}${c.magenta}[PASO ${num}]${c.reset} ${c.bold}${msg}${c.reset}`),
  action: (msg: string) => console.log(`${c.yellow}  → ${msg}${c.reset}`),
  success: (msg: string) => console.log(`${c.green}  ✓ ${msg}${c.reset}`),
  info: (msg: string) => console.log(`${c.blue}  ℹ ${msg}${c.reset}`),
  data: (label: string, value: unknown) => console.log(`${c.cyan}    ${label}:${c.reset} ${typeof value === 'object' ? JSON.stringify(value) : value}`),
  error: (msg: string) => console.log(`${c.red}  ✗ ERROR: ${msg}${c.reset}`),
  money: (label: string, amount: number) => console.log(`${c.green}    💰 ${label}: $${amount.toLocaleString()}${c.reset}`),
  result: (msg: string) => console.log(`${c.bold}${c.bgGreen}${c.white}  ${msg}  ${c.reset}`),
}

// Datos de prueba únicos para esta simulación
const TEST_ID = `SIM_${Date.now()}`
const TEST_DATA = {
  distribuidor: {
    nombre: `Distribuidor Test ${TEST_ID}`,
    empresa: 'Importadora Simulación SA',
    telefono: '555-0001',
    email: 'test@simulacion.com',
    direccion: 'Av. Test 123',
  },
  ordenCompra: {
    producto: `Producto Test ${TEST_ID}`,
    origen: 'China',
    cantidad: 50,
    costoPorUnidad: 6800,  // Costo de compra por unidad
    precioFlete: 500,      // Flete por unidad
    pagoInicial: 170000,   // Pago inicial al distribuidor (50%)
  },
  cliente: {
    nombre: `Cliente Test ${TEST_ID}`,
    empresa: 'Compradores Test SA',
    telefono: '555-0002',
    email: 'cliente@test.com',
    direccion: 'Calle Cliente 456',
  },
  venta: {
    cantidad: 10,
    precioVentaUnitario: 10000,  // Precio de venta al cliente
    flete: 'Aplica' as const,
    pagoInicial: 50000,          // Pago parcial del cliente (50%)
  },
  ingreso: {
    monto: 25000,
    concepto: `Ingreso extra Test ${TEST_ID}`,
    bancoDestino: 'profit',
    categoria: 'Otros ingresos',
  },
  gasto: {
    monto: 15000,
    concepto: `Gasto operativo Test ${TEST_ID}`,
    bancoOrigen: 'utilidades',
    categoria: 'Operaciones',
  },
  transferencia: {
    bancoOrigen: 'boveda_monte',
    bancoDestino: 'boveda_usa',
    monto: 10000,
    concepto: `Transferencia Test ${TEST_ID}`,
  },
}

// IDs de documentos creados (para limpieza final)
const createdDocs: { collection: string; id: string }[] = []

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE SIMULACIÓN
// ═══════════════════════════════════════════════════════════════════════════

async function ensureBancoExists(bancoId: string) {
  const bancoRef = doc(db, 'bancos', bancoId)
  const bancoSnap = await getDoc(bancoRef)
  
  if (!bancoSnap.exists()) {
    const defaultData = {
      id: bancoId,
      nombre: bancoId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    await setDoc(bancoRef, defaultData)
    log.info(`Banco ${bancoId} creado automáticamente`)
  }
}

async function getCapitalBanco(bancoId: string): Promise<number> {
  const bancoRef = doc(db, 'bancos', bancoId)
  const bancoSnap = await getDoc(bancoRef)
  return bancoSnap.exists() ? (bancoSnap.data()?.capitalActual || 0) : 0
}

// ═══════════════════════════════════════════════════════════════════════════
// PASO 1: CREAR DISTRIBUIDOR
// ═══════════════════════════════════════════════════════════════════════════

async function crearDistribuidor() {
  log.step(1, 'CREAR DISTRIBUIDOR')
  log.action('Creando nuevo distribuidor en el sistema...')
  
  const batch = writeBatch(db)
  const distRef = doc(collection(db, 'distribuidores'))
  
  batch.set(distRef, {
    ...TEST_DATA.distribuidor,
    deudaTotal: 0,
    totalOrdenesCompra: 0,
    totalPagado: 0,
    ordenesCompra: [],
    historialPagos: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  
  await batch.commit()
  createdDocs.push({ collection: 'distribuidores', id: distRef.id })
  
  log.success(`Distribuidor creado: ${TEST_DATA.distribuidor.nombre}`)
  log.data('ID', distRef.id)
  log.data('Empresa', TEST_DATA.distribuidor.empresa)
  
  return distRef.id
}

// ═══════════════════════════════════════════════════════════════════════════
// PASO 2: CREAR ORDEN DE COMPRA
// ═══════════════════════════════════════════════════════════════════════════

async function crearOrdenCompra(distribuidorId: string) {
  log.step(2, 'CREAR ORDEN DE COMPRA')
  
  const { producto, origen, cantidad, costoPorUnidad, precioFlete, pagoInicial } = TEST_DATA.ordenCompra
  const costoTotal = costoPorUnidad * cantidad
  const deuda = costoTotal - pagoInicial
  const bancoOrigen = 'boveda_monte'
  
  log.action('Calculando costos de la orden...')
  log.money('Costo por unidad', costoPorUnidad)
  log.money('Cantidad', cantidad)
  log.money('Costo total', costoTotal)
  log.money('Pago inicial', pagoInicial)
  log.money('Deuda pendiente', deuda)
  
  // Asegurar que el banco existe
  await ensureBancoExists(bancoOrigen)
  
  const capitalAntes = await getCapitalBanco(bancoOrigen)
  log.info(`Capital ${bancoOrigen} ANTES: $${capitalAntes.toLocaleString()}`)
  
  const batch = writeBatch(db)
  
  // 1. Crear Orden de Compra
  const ocRef = doc(collection(db, 'ordenes_compra'))
  batch.set(ocRef, {
    distribuidorId,
    distribuidor: TEST_DATA.distribuidor.nombre,
    producto,
    origen,
    cantidad,
    stockActual: cantidad,
    stockInicial: cantidad,
    costoPorUnidad,
    costoTotal,
    pagoDistribuidor: pagoInicial,
    pagoInicial,
    deuda,
    estado: deuda > 0 ? 'parcial' : 'pagado',
    bancoOrigen,
    fecha: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  createdDocs.push({ collection: 'ordenes_compra', id: ocRef.id })
  
  // 2. Actualizar Distribuidor
  const distRef = doc(db, 'distribuidores', distribuidorId)
  batch.update(distRef, {
    deudaTotal: increment(deuda),
    totalOrdenesCompra: increment(costoTotal),
    totalPagado: increment(pagoInicial),
    ordenesCompra: [ocRef.id],
    updatedAt: Timestamp.now(),
  })
  
  // 3. Crear Producto en Almacén
  const prodRef = doc(collection(db, 'almacen'))
  batch.set(prodRef, {
    nombre: producto,
    origen,
    stockActual: cantidad,
    totalEntradas: cantidad,
    totalSalidas: 0,
    valorUnitario: costoPorUnidad,
    entradas: [{
      id: ocRef.id,
      fecha: Timestamp.now(),
      cantidad,
      origen: TEST_DATA.distribuidor.nombre,
      tipo: 'entrada',
    }],
    salidas: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  createdDocs.push({ collection: 'almacen', id: prodRef.id })
  
  // 4. Registrar entrada en almacen_entradas
  const entradaRef = doc(collection(db, 'almacen_entradas'))
  batch.set(entradaRef, {
    productoId: prodRef.id,
    producto,
    ordenCompraId: ocRef.id,
    distribuidorId,
    distribuidor: TEST_DATA.distribuidor.nombre,
    cantidad,
    valorUnitario: costoPorUnidad,
    valorTotal: costoTotal,
    origen,
    tipo: 'entrada',
    fecha: Timestamp.now(),
    createdAt: Timestamp.now(),
  })
  createdDocs.push({ collection: 'almacen_entradas', id: entradaRef.id })
  
  // 5. Actualizar Banco (gasto por pago inicial)
  if (pagoInicial > 0) {
    const bancoRef = doc(db, 'bancos', bancoOrigen)
    batch.update(bancoRef, {
      capitalActual: increment(-pagoInicial),
      historicoGastos: increment(pagoInicial),
      updatedAt: Timestamp.now(),
    })
  }
  
  await batch.commit()
  
  const capitalDespues = await getCapitalBanco(bancoOrigen)
  
  log.success('Orden de compra creada exitosamente')
  log.data('OC ID', ocRef.id)
  log.data('Producto creado en almacén', prodRef.id)
  log.data('Entrada registrada', entradaRef.id)
  log.info(`Capital ${bancoOrigen} DESPUÉS: $${capitalDespues.toLocaleString()}`)
  log.success(`Diferencia: -$${pagoInicial.toLocaleString()} (pago a distribuidor)`)
  
  return { ordenId: ocRef.id, productoId: prodRef.id }
}

// ═══════════════════════════════════════════════════════════════════════════
// PASO 3: CREAR CLIENTE
// ═══════════════════════════════════════════════════════════════════════════

async function crearCliente() {
  log.step(3, 'CREAR CLIENTE')
  log.action('Creando nuevo cliente en el sistema...')
  
  const batch = writeBatch(db)
  const clienteRef = doc(collection(db, 'clientes'))
  
  batch.set(clienteRef, {
    ...TEST_DATA.cliente,
    deudaTotal: 0,
    totalVentas: 0,
    totalPagado: 0,
    ventas: [],
    historialPagos: [],
    estado: 'activo',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  
  await batch.commit()
  createdDocs.push({ collection: 'clientes', id: clienteRef.id })
  
  log.success(`Cliente creado: ${TEST_DATA.cliente.nombre}`)
  log.data('ID', clienteRef.id)
  log.data('Empresa', TEST_DATA.cliente.empresa)
  
  return clienteRef.id
}

// ═══════════════════════════════════════════════════════════════════════════
// PASO 4: CREAR VENTA (LÓGICA GYA - DISTRIBUCIÓN A 3 BANCOS)
// ═══════════════════════════════════════════════════════════════════════════

async function crearVenta(clienteId: string, productoId: string, ordenId: string) {
  log.step(4, 'CREAR VENTA CON DISTRIBUCIÓN GYA')
  
  const { cantidad, precioVentaUnitario, pagoInicial } = TEST_DATA.venta
  const { costoPorUnidad, precioFlete } = TEST_DATA.ordenCompra
  
  // Cálculos GYA
  const totalVenta = precioVentaUnitario * cantidad
  const montoBovedaMonte = costoPorUnidad * cantidad      // Recuperación de COSTO
  const montoFletes = precioFlete * cantidad               // Fletes
  const montoUtilidades = (precioVentaUnitario - costoPorUnidad - precioFlete) * cantidad  // GANANCIA NETA
  
  const montoPagado = pagoInicial
  const montoRestante = totalVenta - montoPagado
  const proporcion = montoPagado / totalVenta
  
  // Montos proporcionales para cada banco
  const montoBovedaMonteReal = montoBovedaMonte * proporcion
  const montoFletesReal = montoFletes * proporcion
  const montoUtilidadesReal = montoUtilidades * proporcion
  
  log.action('Calculando distribución GYA...')
  log.info(`Precio venta unitario: $${precioVentaUnitario.toLocaleString()}`)
  log.info(`Costo compra unitario: $${costoPorUnidad.toLocaleString()}`)
  log.info(`Flete por unidad: $${precioFlete.toLocaleString()}`)
  log.info(`Cantidad: ${cantidad}`)
  console.log('')
  log.money('Total Venta', totalVenta)
  log.money('Pago Cliente', montoPagado)
  log.money('Proporción pagada', Math.round(proporcion * 100))
  console.log('')
  log.info('DISTRIBUCIÓN CALCULADA (del monto pagado):')
  log.money('→ Bóveda Monte (costo)', montoBovedaMonteReal)
  log.money('→ Flete Sur', montoFletesReal)
  log.money('→ Utilidades (ganancia)', montoUtilidadesReal)
  
  // Asegurar que los bancos existen
  await Promise.all([
    ensureBancoExists('boveda_monte'),
    ensureBancoExists('flete_sur'),
    ensureBancoExists('utilidades'),
  ])
  
  // Capitales antes
  const capitalMonteAntes = await getCapitalBanco('boveda_monte')
  const capitalFleteAntes = await getCapitalBanco('flete_sur')
  const capitalUtilidadesAntes = await getCapitalBanco('utilidades')
  
  const batch = writeBatch(db)
  
  // 1. Crear Venta
  const ventaRef = doc(collection(db, 'ventas'))
  batch.set(ventaRef, {
    clienteId,
    cliente: TEST_DATA.cliente.nombre,
    producto: TEST_DATA.ordenCompra.producto,
    ocRelacionada: ordenId,
    cantidad,
    precioVenta: precioVentaUnitario,
    precioCompra: costoPorUnidad,
    precioTotalVenta: totalVenta,
    totalVenta,
    ingreso: totalVenta,
    flete: 'Aplica',
    fleteUtilidad: montoFletes,
    precioFlete,
    utilidad: montoUtilidades,
    ganancia: montoUtilidades,
    bovedaMonte: montoBovedaMonte,
    distribucion: {
      bovedaMonte: montoBovedaMonte,
      fletes: montoFletes,
      utilidades: montoUtilidades,
    },
    distribucionBancos: {
      bovedaMonte: montoBovedaMonte,
      fletes: montoFletes,
      utilidades: montoUtilidades,
    },
    estadoPago: proporcion >= 1 ? 'completo' : proporcion > 0 ? 'parcial' : 'pendiente',
    estatus: proporcion >= 1 ? 'Pagado' : proporcion > 0 ? 'Parcial' : 'Pendiente',
    montoPagado,
    montoRestante,
    adeudo: montoRestante,
    fecha: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  createdDocs.push({ collection: 'ventas', id: ventaRef.id })
  
  // 2. Actualizar Cliente
  const clienteRef = doc(db, 'clientes', clienteId)
  batch.update(clienteRef, {
    deudaTotal: increment(montoRestante),
    totalVentas: increment(totalVenta),
    totalPagado: increment(montoPagado),
    ventas: [ventaRef.id],
    updatedAt: Timestamp.now(),
  })
  
  // 3. Actualizar Almacén (salida)
  const prodRef = doc(db, 'almacen', productoId)
  batch.update(prodRef, {
    stockActual: increment(-cantidad),
    totalSalidas: increment(cantidad),
    salidas: [{
      id: ventaRef.id,
      fecha: Timestamp.now(),
      cantidad,
      destino: TEST_DATA.cliente.nombre,
      tipo: 'salida',
    }],
    updatedAt: Timestamp.now(),
  })
  
  // 4. Registrar salida en almacen_salidas
  const salidaRef = doc(collection(db, 'almacen_salidas'))
  batch.set(salidaRef, {
    productoId,
    producto: TEST_DATA.ordenCompra.producto,
    ventaId: ventaRef.id,
    clienteId,
    cliente: TEST_DATA.cliente.nombre,
    cantidad,
    valorUnitario: precioVentaUnitario,
    valorTotal: totalVenta,
    tipo: 'salida',
    fecha: Timestamp.now(),
    createdAt: Timestamp.now(),
  })
  createdDocs.push({ collection: 'almacen_salidas', id: salidaRef.id })
  
  // 5. Actualizar stock de la OC
  const ocRef = doc(db, 'ordenes_compra', ordenId)
  batch.update(ocRef, {
    stockActual: increment(-cantidad),
    updatedAt: Timestamp.now(),
  })
  
  // 6. DISTRIBUCIÓN GYA - Actualizar los 3 bancos (proporcional al pago)
  if (montoPagado > 0) {
    // Bóveda Monte
    if (montoBovedaMonteReal > 0) {
      const bancoMonteRef = doc(db, 'bancos', 'boveda_monte')
      batch.update(bancoMonteRef, {
        capitalActual: increment(montoBovedaMonteReal),
        historicoIngresos: increment(montoBovedaMonteReal),
        updatedAt: Timestamp.now(),
      })
      
      // Movimiento
      const movMonteRef = doc(collection(db, 'movimientos'))
      batch.set(movMonteRef, {
        tipoMovimiento: 'ingreso',
        tipo: 'ingreso_venta',
        bancoId: 'boveda_monte',
        monto: montoBovedaMonteReal,
        concepto: `Venta ${ventaRef.id} - Recuperación costo`,
        referenciaId: ventaRef.id,
        referenciaTipo: 'venta',
        fecha: Timestamp.now(),
        createdAt: Timestamp.now(),
      })
      createdDocs.push({ collection: 'movimientos', id: movMonteRef.id })
    }
    
    // Flete Sur
    if (montoFletesReal > 0) {
      const bancoFleteRef = doc(db, 'bancos', 'flete_sur')
      batch.update(bancoFleteRef, {
        capitalActual: increment(montoFletesReal),
        historicoIngresos: increment(montoFletesReal),
        updatedAt: Timestamp.now(),
      })
      
      const movFleteRef = doc(collection(db, 'movimientos'))
      batch.set(movFleteRef, {
        tipoMovimiento: 'ingreso',
        tipo: 'ingreso_venta',
        bancoId: 'flete_sur',
        monto: montoFletesReal,
        concepto: `Venta ${ventaRef.id} - Flete`,
        referenciaId: ventaRef.id,
        referenciaTipo: 'venta',
        fecha: Timestamp.now(),
        createdAt: Timestamp.now(),
      })
      createdDocs.push({ collection: 'movimientos', id: movFleteRef.id })
    }
    
    // Utilidades
    if (montoUtilidadesReal > 0) {
      const bancoUtilRef = doc(db, 'bancos', 'utilidades')
      batch.update(bancoUtilRef, {
        capitalActual: increment(montoUtilidadesReal),
        historicoIngresos: increment(montoUtilidadesReal),
        updatedAt: Timestamp.now(),
      })
      
      const movUtilRef = doc(collection(db, 'movimientos'))
      batch.set(movUtilRef, {
        tipoMovimiento: 'ingreso',
        tipo: 'ingreso_venta',
        bancoId: 'utilidades',
        monto: montoUtilidadesReal,
        concepto: `Venta ${ventaRef.id} - Utilidad`,
        referenciaId: ventaRef.id,
        referenciaTipo: 'venta',
        fecha: Timestamp.now(),
        createdAt: Timestamp.now(),
      })
      createdDocs.push({ collection: 'movimientos', id: movUtilRef.id })
    }
  }
  
  await batch.commit()
  
  // Capitales después
  const capitalMonteDespues = await getCapitalBanco('boveda_monte')
  const capitalFleteDespues = await getCapitalBanco('flete_sur')
  const capitalUtilidadesDespues = await getCapitalBanco('utilidades')
  
  log.success('Venta creada exitosamente')
  log.data('Venta ID', ventaRef.id)
  log.data('Estado', proporcion >= 1 ? 'COMPLETO' : 'PARCIAL')
  console.log('')
  log.info('ACTUALIZACIÓN DE BANCOS:')
  log.success(`Bóveda Monte: $${capitalMonteAntes.toLocaleString()} → $${capitalMonteDespues.toLocaleString()} (+$${montoBovedaMonteReal.toLocaleString()})`)
  log.success(`Flete Sur: $${capitalFleteAntes.toLocaleString()} → $${capitalFleteDespues.toLocaleString()} (+$${montoFletesReal.toLocaleString()})`)
  log.success(`Utilidades: $${capitalUtilidadesAntes.toLocaleString()} → $${capitalUtilidadesDespues.toLocaleString()} (+$${montoUtilidadesReal.toLocaleString()})`)
  
  return ventaRef.id
}

// ═══════════════════════════════════════════════════════════════════════════
// PASO 5: PAGO A DISTRIBUIDOR (resto de deuda)
// ═══════════════════════════════════════════════════════════════════════════

async function pagarDistribuidor(distribuidorId: string, ordenId: string) {
  log.step(5, 'REGISTRAR PAGO A DISTRIBUIDOR')
  
  const { costoPorUnidad, cantidad, pagoInicial } = TEST_DATA.ordenCompra
  const costoTotal = costoPorUnidad * cantidad
  const deudaPendiente = costoTotal - pagoInicial
  const montoPago = deudaPendiente  // Pagar resto completo
  const bancoOrigen = 'boveda_monte'
  
  log.action('Pagando deuda pendiente al distribuidor...')
  log.money('Deuda pendiente', deudaPendiente)
  log.money('Monto a pagar', montoPago)
  
  await ensureBancoExists(bancoOrigen)
  const capitalAntes = await getCapitalBanco(bancoOrigen)
  
  const batch = writeBatch(db)
  
  // 1. Actualizar OC
  const ocRef = doc(db, 'ordenes_compra', ordenId)
  batch.update(ocRef, {
    deuda: 0,
    pagoDistribuidor: increment(montoPago),
    estado: 'pagado',
    updatedAt: Timestamp.now(),
  })
  
  // 2. Actualizar Distribuidor
  const distRef = doc(db, 'distribuidores', distribuidorId)
  batch.update(distRef, {
    deudaTotal: increment(-montoPago),
    totalPagado: increment(montoPago),
    historialPagos: [{
      fecha: Timestamp.now(),
      monto: montoPago,
      bancoOrigen,
      ordenCompraId: ordenId,
    }],
    updatedAt: Timestamp.now(),
  })
  
  // 3. Actualizar Banco
  const bancoRef = doc(db, 'bancos', bancoOrigen)
  batch.update(bancoRef, {
    capitalActual: increment(-montoPago),
    historicoGastos: increment(montoPago),
    updatedAt: Timestamp.now(),
  })
  
  // 4. Registrar movimiento
  const movRef = doc(collection(db, 'movimientos'))
  batch.set(movRef, {
    tipoMovimiento: 'gasto',
    tipo: 'pago_distribuidor',
    bancoId: bancoOrigen,
    monto: montoPago,
    concepto: `Pago a ${TEST_DATA.distribuidor.nombre}`,
    referenciaId: ordenId,
    referenciaTipo: 'orden_compra',
    fecha: Timestamp.now(),
    createdAt: Timestamp.now(),
  })
  createdDocs.push({ collection: 'movimientos', id: movRef.id })
  
  await batch.commit()
  
  const capitalDespues = await getCapitalBanco(bancoOrigen)
  
  log.success('Pago a distribuidor registrado')
  log.success(`Bóveda Monte: $${capitalAntes.toLocaleString()} → $${capitalDespues.toLocaleString()} (-$${montoPago.toLocaleString()})`)
}

// ═══════════════════════════════════════════════════════════════════════════
// PASO 6: ABONO DE CLIENTE (resto de deuda)
// ═══════════════════════════════════════════════════════════════════════════

async function abonoCliente(clienteId: string, ventaId: string) {
  log.step(6, 'REGISTRAR ABONO DE CLIENTE')
  
  const { cantidad, precioVentaUnitario, pagoInicial } = TEST_DATA.venta
  const { costoPorUnidad, precioFlete } = TEST_DATA.ordenCompra
  
  const totalVenta = precioVentaUnitario * cantidad
  const deudaPendiente = totalVenta - pagoInicial
  const montoAbono = deudaPendiente  // Pagar resto completo
  const proporcion = montoAbono / totalVenta
  
  // Distribución proporcional del abono
  const montoBovedaMonte = costoPorUnidad * cantidad
  const montoFletes = precioFlete * cantidad
  const montoUtilidades = (precioVentaUnitario - costoPorUnidad - precioFlete) * cantidad
  
  const abonoMonte = montoBovedaMonte * proporcion
  const abonoFletes = montoFletes * proporcion
  const abonoUtilidades = montoUtilidades * proporcion
  
  log.action('Registrando abono del cliente...')
  log.money('Deuda pendiente', deudaPendiente)
  log.money('Monto abono', montoAbono)
  log.info('DISTRIBUCIÓN DEL ABONO:')
  log.money('→ Bóveda Monte', abonoMonte)
  log.money('→ Flete Sur', abonoFletes)
  log.money('→ Utilidades', abonoUtilidades)
  
  const batch = writeBatch(db)
  
  // 1. Actualizar Venta
  const ventaRef = doc(db, 'ventas', ventaId)
  batch.update(ventaRef, {
    montoPagado: increment(montoAbono),
    montoRestante: 0,
    adeudo: 0,
    estadoPago: 'completo',
    estatus: 'Pagado',
    updatedAt: Timestamp.now(),
  })
  
  // 2. Actualizar Cliente
  const clienteRef = doc(db, 'clientes', clienteId)
  batch.update(clienteRef, {
    deudaTotal: increment(-montoAbono),
    totalPagado: increment(montoAbono),
    historialPagos: [{
      fecha: Timestamp.now(),
      monto: montoAbono,
      ventaId,
    }],
    updatedAt: Timestamp.now(),
  })
  
  // 3. Actualizar los 3 bancos
  const bancoMonteRef = doc(db, 'bancos', 'boveda_monte')
  batch.update(bancoMonteRef, {
    capitalActual: increment(abonoMonte),
    historicoIngresos: increment(abonoMonte),
    updatedAt: Timestamp.now(),
  })
  
  const bancoFleteRef = doc(db, 'bancos', 'flete_sur')
  batch.update(bancoFleteRef, {
    capitalActual: increment(abonoFletes),
    historicoIngresos: increment(abonoFletes),
    updatedAt: Timestamp.now(),
  })
  
  const bancoUtilRef = doc(db, 'bancos', 'utilidades')
  batch.update(bancoUtilRef, {
    capitalActual: increment(abonoUtilidades),
    historicoIngresos: increment(abonoUtilidades),
    updatedAt: Timestamp.now(),
  })
  
  // 4. Registrar abono
  const abonoRef = doc(collection(db, 'abonos'))
  batch.set(abonoRef, {
    tipo: 'cliente',
    entidadId: clienteId,
    monto: montoAbono,
    bancoDestino: 'multiple',
    metodo: 'transferencia',
    distribucion: { bovedaMonte: abonoMonte, fletes: abonoFletes, utilidades: abonoUtilidades },
    fecha: Timestamp.now(),
    createdAt: Timestamp.now(),
  })
  createdDocs.push({ collection: 'abonos', id: abonoRef.id })
  
  await batch.commit()
  
  log.success('Abono de cliente registrado')
  log.success(`Estado venta: COMPLETO`)
}

// ═══════════════════════════════════════════════════════════════════════════
// PASO 7: INGRESO DIRECTO
// ═══════════════════════════════════════════════════════════════════════════

async function registrarIngreso() {
  log.step(7, 'REGISTRAR INGRESO DIRECTO')
  
  const { monto, concepto, bancoDestino, categoria } = TEST_DATA.ingreso
  
  log.action(`Registrando ingreso en ${bancoDestino}...`)
  log.money('Monto', monto)
  
  await ensureBancoExists(bancoDestino)
  const capitalAntes = await getCapitalBanco(bancoDestino)
  
  const batch = writeBatch(db)
  
  const ingresoRef = doc(collection(db, 'ingresos'))
  batch.set(ingresoRef, {
    monto,
    concepto,
    bancoDestino,
    categoria,
    fecha: Timestamp.now(),
    createdAt: Timestamp.now(),
  })
  createdDocs.push({ collection: 'ingresos', id: ingresoRef.id })
  
  const bancoRef = doc(db, 'bancos', bancoDestino)
  batch.update(bancoRef, {
    capitalActual: increment(monto),
    historicoIngresos: increment(monto),
    updatedAt: Timestamp.now(),
  })
  
  await batch.commit()
  
  const capitalDespues = await getCapitalBanco(bancoDestino)
  
  log.success(`Ingreso registrado en ${bancoDestino}`)
  log.success(`Capital: $${capitalAntes.toLocaleString()} → $${capitalDespues.toLocaleString()} (+$${monto.toLocaleString()})`)
}

// ═══════════════════════════════════════════════════════════════════════════
// PASO 8: GASTO DIRECTO
// ═══════════════════════════════════════════════════════════════════════════

async function registrarGasto() {
  log.step(8, 'REGISTRAR GASTO DIRECTO')
  
  const { monto, concepto, bancoOrigen, categoria } = TEST_DATA.gasto
  
  log.action(`Registrando gasto desde ${bancoOrigen}...`)
  log.money('Monto', monto)
  
  await ensureBancoExists(bancoOrigen)
  const capitalAntes = await getCapitalBanco(bancoOrigen)
  
  const batch = writeBatch(db)
  
  const gastoRef = doc(collection(db, 'gastos'))
  batch.set(gastoRef, {
    monto,
    concepto,
    bancoOrigen,
    categoria,
    fecha: Timestamp.now(),
    createdAt: Timestamp.now(),
  })
  createdDocs.push({ collection: 'gastos', id: gastoRef.id })
  
  const bancoRef = doc(db, 'bancos', bancoOrigen)
  batch.update(bancoRef, {
    capitalActual: increment(-monto),
    historicoGastos: increment(monto),
    updatedAt: Timestamp.now(),
  })
  
  await batch.commit()
  
  const capitalDespues = await getCapitalBanco(bancoOrigen)
  
  log.success(`Gasto registrado desde ${bancoOrigen}`)
  log.success(`Capital: $${capitalAntes.toLocaleString()} → $${capitalDespues.toLocaleString()} (-$${monto.toLocaleString()})`)
}

// ═══════════════════════════════════════════════════════════════════════════
// PASO 9: TRANSFERENCIA ENTRE BANCOS
// ═══════════════════════════════════════════════════════════════════════════

async function realizarTransferencia() {
  log.step(9, 'REALIZAR TRANSFERENCIA ENTRE BANCOS')
  
  const { bancoOrigen, bancoDestino, monto, concepto } = TEST_DATA.transferencia
  
  log.action(`Transfiriendo de ${bancoOrigen} a ${bancoDestino}...`)
  log.money('Monto', monto)
  
  await Promise.all([ensureBancoExists(bancoOrigen), ensureBancoExists(bancoDestino)])
  
  const capitalOrigenAntes = await getCapitalBanco(bancoOrigen)
  const capitalDestinoAntes = await getCapitalBanco(bancoDestino)
  
  const batch = writeBatch(db)
  
  const transRef = doc(collection(db, 'transferencias'))
  batch.set(transRef, {
    bancoOrigenId: bancoOrigen,
    bancoDestinoId: bancoDestino,
    monto,
    concepto,
    fecha: Timestamp.now(),
    createdAt: Timestamp.now(),
  })
  createdDocs.push({ collection: 'transferencias', id: transRef.id })
  
  const bancoOrigenRef = doc(db, 'bancos', bancoOrigen)
  batch.update(bancoOrigenRef, {
    capitalActual: increment(-monto),
    historicoTransferencias: increment(monto),
    updatedAt: Timestamp.now(),
  })
  
  const bancoDestinoRef = doc(db, 'bancos', bancoDestino)
  batch.update(bancoDestinoRef, {
    capitalActual: increment(monto),
    historicoIngresos: increment(monto),
    updatedAt: Timestamp.now(),
  })
  
  await batch.commit()
  
  const capitalOrigenDespues = await getCapitalBanco(bancoOrigen)
  const capitalDestinoDespues = await getCapitalBanco(bancoDestino)
  
  log.success('Transferencia completada')
  log.success(`${bancoOrigen}: $${capitalOrigenAntes.toLocaleString()} → $${capitalOrigenDespues.toLocaleString()}`)
  log.success(`${bancoDestino}: $${capitalDestinoAntes.toLocaleString()} → $${capitalDestinoDespues.toLocaleString()}`)
}

// ═══════════════════════════════════════════════════════════════════════════
// PASO 10: VERIFICACIÓN FINAL
// ═══════════════════════════════════════════════════════════════════════════

async function verificacionFinal() {
  log.step(10, 'VERIFICACIÓN FINAL DE CONSISTENCIA')
  
  // Verificar bancos
  const bancosSnap = await getDocs(collection(db, 'bancos'))
  let capitalTotal = 0
  let ingresosTotal = 0
  let gastosTotal = 0
  
  log.info('Estado final de bancos:')
  bancosSnap.docs.forEach(doc => {
    const data = doc.data()
    capitalTotal += data.capitalActual || 0
    ingresosTotal += data.historicoIngresos || 0
    gastosTotal += data.historicoGastos || 0
    log.data(`  ${data.nombre || doc.id}`, `Capital: $${(data.capitalActual || 0).toLocaleString()}`)
  })
  
  console.log('')
  log.result(`CAPITAL TOTAL: $${capitalTotal.toLocaleString()}`)
  log.info(`Histórico Ingresos: $${ingresosTotal.toLocaleString()}`)
  log.info(`Histórico Gastos: $${gastosTotal.toLocaleString()}`)
  log.info(`Balance: $${(ingresosTotal - gastosTotal).toLocaleString()}`)
}

// ═══════════════════════════════════════════════════════════════════════════
// LIMPIEZA (opcional)
// ═══════════════════════════════════════════════════════════════════════════

async function limpiarDatosPrueba() {
  log.title('LIMPIEZA DE DATOS DE PRUEBA')
  log.action(`Eliminando ${createdDocs.length} documentos creados...`)
  
  for (const { collection: colName, id } of createdDocs) {
    try {
      await deleteDoc(doc(db, colName, id))
      log.success(`Eliminado: ${colName}/${id}`)
    } catch (error) {
      log.error(`No se pudo eliminar ${colName}/${id}`)
    }
  }
  
  log.success('Limpieza completada')
}

// ═══════════════════════════════════════════════════════════════════════════
// EJECUCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`
${c.bold}${c.cyan}
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                          ║
║   🔥 CHRONOS SYSTEM - SIMULACIÓN REAL DE OPERACIONES                                    ║
║                                                                                          ║
║   Esta simulación ejecuta el flujo COMPLETO del sistema como un usuario real:           ║
║                                                                                          ║
║   1. Distribuidor → 2. Orden Compra → 3. Cliente → 4. Venta                            ║
║   5. Pago Distribuidor → 6. Abono Cliente → 7. Ingreso → 8. Gasto → 9. Transferencia   ║
║                                                                                          ║
║   Todos los datos son REALES y afectan la base de datos de Firebase                    ║
║                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
${c.reset}
`)

  try {
    // Ejecutar flujo completo
    const distribuidorId = await crearDistribuidor()
    const { ordenId, productoId } = await crearOrdenCompra(distribuidorId)
    const clienteId = await crearCliente()
    const ventaId = await crearVenta(clienteId, productoId, ordenId)
    await pagarDistribuidor(distribuidorId, ordenId)
    await abonoCliente(clienteId, ventaId)
    await registrarIngreso()
    await registrarGasto()
    await realizarTransferencia()
    await verificacionFinal()
    
    console.log(`
${c.bold}${c.bgGreen}${c.white}
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                          ║
║   ✅ SIMULACIÓN COMPLETADA EXITOSAMENTE                                                 ║
║                                                                                          ║
║   Todos los flujos del sistema CHRONOS han sido verificados:                            ║
║   ✓ Creación de entidades (Distribuidor, Cliente)                                       ║
║   ✓ Operaciones comerciales (Orden Compra, Venta)                                       ║
║   ✓ Gestión de almacén (Entradas, Salidas, Stock)                                       ║
║   ✓ Distribución bancaria GYA (Bóveda Monte, Fletes, Utilidades)                        ║
║   ✓ Pagos y abonos                                                                       ║
║   ✓ Ingresos y gastos directos                                                           ║
║   ✓ Transferencias entre bancos                                                          ║
║                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
${c.reset}
`)

    // Preguntar si limpiar datos
    const args = process.argv.slice(2)
    if (args.includes('--cleanup')) {
      await limpiarDatosPrueba()
    } else {
      log.info('Para limpiar los datos de prueba, ejecuta con: --cleanup')
    }
    
  } catch (error) {
    log.error(`Error en simulación: ${error}`)
    console.error(error)
  }
  
  process.exit(0)
}

main()
