#!/usr/bin/env node
/**
 * SIMULACIÓN COMPLETA DEL SISTEMA CHRONOS
 */

import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, limit } from 'firebase/firestore'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

const TEST_PREFIX = 'TEST_SIM_'

const SIMULATION = {
  distribuidor: { nombre: 'DISTRIBUIDOR PRUEBA' },
  ordenCompra: { cantidad: 100, costoDistribuidor: 6300, costoTransporte: 500, pagoInicial: 100000 },
  cliente: { nombre: 'CLIENTE PRUEBA' },
  venta: { cantidad: 10, precioVenta: 10000, precioCompra: 6300, precioFlete: 500, montoPagado: 50000 },
}

async function limpiarPruebas() {
  console.log('\n🧹 Limpiando datos anteriores...')
  for (const col of ['distribuidores', 'ordenes_compra', 'clientes', 'ventas', 'movimientos']) {
    const snapshot = await getDocs(query(collection(db, col)))
    for (const d of snapshot.docs) {
      if (d.id.startsWith(TEST_PREFIX)) await deleteDoc(doc(db, col, d.id))
    }
  }
  console.log('   ✅ Limpieza completada')
}

async function crearDistribuidor() {
  console.log('\n[PASO 1] CREAR DISTRIBUIDOR')
  await setDoc(doc(db, 'distribuidores', `${TEST_PREFIX}dist`), {
    nombre: SIMULATION.distribuidor.nombre,
    deuda: 0, totalCompras: 0, totalPagado: 0,
    createdAt: new Date().toISOString(),
  })
  console.log('   ✅ Distribuidor creado:', SIMULATION.distribuidor.nombre)
}

async function crearOrdenCompra() {
  console.log('\n[PASO 2] CREAR ORDEN DE COMPRA')
  const oc = SIMULATION.ordenCompra
  const costoTotal = oc.cantidad * (oc.costoDistribuidor + oc.costoTransporte)
  const deuda = costoTotal - oc.pagoInicial

  await setDoc(doc(db, 'ordenes_compra', `${TEST_PREFIX}oc`), {
    distribuidorId: `${TEST_PREFIX}dist`,
    distribuidor: SIMULATION.distribuidor.nombre,
    cantidad: oc.cantidad, stockActual: oc.cantidad,
    costoDistribuidor: oc.costoDistribuidor,
    costoTransporte: oc.costoTransporte,
    costoTotal, pagoInicial: oc.pagoInicial, deuda,
    fecha: new Date().toISOString(),
  })

  // Actualizar distribuidor
  const distRef = doc(db, 'distribuidores', `${TEST_PREFIX}dist`)
  const distSnap = await getDoc(distRef)
  const distData = distSnap.data()
  await setDoc(distRef, { ...distData, deuda, totalCompras: costoTotal, totalPagado: oc.pagoInicial }, { merge: true })

  // Descontar banco
  const bancoRef = doc(db, 'bancos', 'boveda_monte')
  const bancoSnap = await getDoc(bancoRef)
  const bancoData = bancoSnap.data()
  await setDoc(bancoRef, {
    ...bancoData,
    capitalActual: (bancoData.capitalActual || 0) - oc.pagoInicial,
    historicoGastos: (bancoData.historicoGastos || 0) + oc.pagoInicial,
  }, { merge: true })

  console.log('   ✅ OC creada - Costo total: $' + costoTotal.toLocaleString())
  console.log('   ✅ Stock entrada:', oc.cantidad, 'unidades')
  console.log('   ✅ Deuda distribuidor: $' + deuda.toLocaleString())
  console.log('   ✅ Banco boveda_monte descontado: $' + oc.pagoInicial.toLocaleString())
}

async function crearCliente() {
  console.log('\n[PASO 3] CREAR CLIENTE')
  await setDoc(doc(db, 'clientes', `${TEST_PREFIX}cli`), {
    nombre: SIMULATION.cliente.nombre,
    deuda: 0, deudaTotal: 0, abonos: 0, totalCompras: 0,
    createdAt: new Date().toISOString(),
  })
  console.log('   ✅ Cliente creado:', SIMULATION.cliente.nombre)
}

async function crearVenta() {
  console.log('\n[PASO 4] CREAR VENTA (Distribución GYA)')
  const v = SIMULATION.venta
  const totalVenta = v.cantidad * v.precioVenta
  const bovedaMonte = v.cantidad * v.precioCompra
  const fletes = v.cantidad * v.precioFlete
  const utilidades = totalVenta - bovedaMonte - fletes
  const deudaCliente = totalVenta - v.montoPagado
  const proporcion = v.montoPagado / totalVenta

  console.log('   📊 CÁLCULOS GYA:')
  console.log('      Total venta: $' + totalVenta.toLocaleString())
  console.log('      → Bóveda Monte: $' + bovedaMonte.toLocaleString() + ' (costo)')
  console.log('      → Fletes Sur: $' + fletes.toLocaleString())
  console.log('      → Utilidades: $' + utilidades.toLocaleString() + ' (ganancia)')
  console.log('      Pagó: $' + v.montoPagado.toLocaleString() + ' (50%)')
  console.log('      Deuda cliente: $' + deudaCliente.toLocaleString())

  await setDoc(doc(db, 'ventas', `${TEST_PREFIX}venta`), {
    clienteId: `${TEST_PREFIX}cli`, cliente: SIMULATION.cliente.nombre,
    ocRelacionada: `${TEST_PREFIX}oc`,
    cantidad: v.cantidad, precioVentaUnidad: v.precioVenta,
    precioCompraUnidad: v.precioCompra, precioFleteUnidad: v.precioFlete,
    precioTotalVenta: totalVenta, montoPagado: v.montoPagado,
    montoRestante: deudaCliente, estadoPago: 'parcial',
    bovedaMonte, fletes, utilidades,
    fecha: new Date().toISOString(),
  })

  // Actualizar bancos (proporcional al pago)
  const bancosUpdate = [
    { id: 'boveda_monte', real: Math.round(bovedaMonte * proporcion), hist: bovedaMonte },
    { id: 'flete_sur', real: Math.round(fletes * proporcion), hist: fletes },
    { id: 'utilidades', real: Math.round(utilidades * proporcion), hist: utilidades },
  ]
  for (const b of bancosUpdate) {
    const ref = doc(db, 'bancos', b.id)
    const snap = await getDoc(ref)
    const data = snap.data()
    await setDoc(ref, {
      ...data,
      capitalActual: (data.capitalActual || 0) + b.real,
      historicoIngresos: (data.historicoIngresos || 0) + b.hist,
    }, { merge: true })
  }

  // Actualizar cliente
  const cliRef = doc(db, 'clientes', `${TEST_PREFIX}cli`)
  const cliSnap = await getDoc(cliRef)
  const cliData = cliSnap.data()
  await setDoc(cliRef, { ...cliData, deuda: deudaCliente, totalCompras: totalVenta }, { merge: true })

  // Actualizar stock OC
  const ocRef = doc(db, 'ordenes_compra', `${TEST_PREFIX}oc`)
  const ocSnap = await getDoc(ocRef)
  const ocData = ocSnap.data()
  await setDoc(ocRef, { ...ocData, stockActual: ocData.stockActual - v.cantidad }, { merge: true })

  console.log('   ✅ Venta creada con distribución GYA')
  console.log('   ✅ Stock restante:', (100 - v.cantidad), 'unidades')
}

async function pagarDistribuidor() {
  console.log('\n[PASO 5] PAGO A DISTRIBUIDOR')
  const monto = 200000

  const distRef = doc(db, 'distribuidores', `${TEST_PREFIX}dist`)
  const distSnap = await getDoc(distRef)
  const distData = distSnap.data()
  const nuevaDeuda = Math.max(0, distData.deuda - monto)
  await setDoc(distRef, { ...distData, deuda: nuevaDeuda, totalPagado: distData.totalPagado + monto }, { merge: true })

  const bancoRef = doc(db, 'bancos', 'boveda_monte')
  const bancoSnap = await getDoc(bancoRef)
  const bancoData = bancoSnap.data()
  await setDoc(bancoRef, {
    ...bancoData,
    capitalActual: bancoData.capitalActual - monto,
    historicoGastos: bancoData.historicoGastos + monto,
  }, { merge: true })

  console.log('   ✅ Pagado: $' + monto.toLocaleString())
  console.log('   ✅ Deuda anterior: $' + distData.deuda.toLocaleString())
  console.log('   ✅ Deuda nueva: $' + nuevaDeuda.toLocaleString())
}

async function abonoCliente() {
  console.log('\n[PASO 6] ABONO DE CLIENTE')
  const monto = 30000
  const v = SIMULATION.venta
  const totalVenta = v.cantidad * v.precioVenta
  const prop = monto / totalVenta

  const cliRef = doc(db, 'clientes', `${TEST_PREFIX}cli`)
  const cliSnap = await getDoc(cliRef)
  const cliData = cliSnap.data()
  const nuevaDeuda = Math.max(0, cliData.deuda - monto)
  await setDoc(cliRef, { ...cliData, deuda: nuevaDeuda, abonos: (cliData.abonos || 0) + monto }, { merge: true })

  // Distribuir abono a bancos
  const dist = [
    { id: 'boveda_monte', m: Math.round(v.cantidad * v.precioCompra * prop) },
    { id: 'flete_sur', m: Math.round(v.cantidad * v.precioFlete * prop) },
    { id: 'utilidades', m: Math.round((totalVenta - v.cantidad * v.precioCompra - v.cantidad * v.precioFlete) * prop) },
  ]
  for (const b of dist) {
    const ref = doc(db, 'bancos', b.id)
    const snap = await getDoc(ref)
    const data = snap.data()
    await setDoc(ref, { ...data, capitalActual: data.capitalActual + b.m, historicoIngresos: data.historicoIngresos + b.m }, { merge: true })
  }

  console.log('   ✅ Abono: $' + monto.toLocaleString())
  console.log('   ✅ Deuda anterior: $' + cliData.deuda.toLocaleString())
  console.log('   ✅ Deuda nueva: $' + nuevaDeuda.toLocaleString())
}

async function registrarGasto() {
  console.log('\n[PASO 7] REGISTRAR GASTO')
  const monto = 5000
  const ref = doc(db, 'bancos', 'utilidades')
  const snap = await getDoc(ref)
  const data = snap.data()
  await setDoc(ref, { ...data, capitalActual: data.capitalActual - monto, historicoGastos: data.historicoGastos + monto }, { merge: true })
  console.log('   ✅ Gasto registrado: $' + monto.toLocaleString() + ' de Utilidades')
}

async function registrarIngreso() {
  console.log('\n[PASO 8] REGISTRAR INGRESO')
  const monto = 10000
  const ref = doc(db, 'bancos', 'profit')
  const snap = await getDoc(ref)
  const data = snap.data()
  await setDoc(ref, { ...data, capitalActual: data.capitalActual + monto, historicoIngresos: data.historicoIngresos + monto }, { merge: true })
  console.log('   ✅ Ingreso registrado: $' + monto.toLocaleString() + ' a Profit')
}

async function realizarTransferencia() {
  console.log('\n[PASO 9] TRANSFERENCIA')
  const monto = 15000

  const origenRef = doc(db, 'bancos', 'utilidades')
  const origenSnap = await getDoc(origenRef)
  const origenData = origenSnap.data()
  await setDoc(origenRef, { ...origenData, capitalActual: origenData.capitalActual - monto, historicoGastos: origenData.historicoGastos + monto }, { merge: true })

  const destinoRef = doc(db, 'bancos', 'boveda_usa')
  const destinoSnap = await getDoc(destinoRef)
  const destinoData = destinoSnap.data()
  await setDoc(destinoRef, { ...destinoData, capitalActual: destinoData.capitalActual + monto, historicoIngresos: destinoData.historicoIngresos + monto }, { merge: true })

  console.log('   ✅ Transferencia: $' + monto.toLocaleString() + ' (Utilidades → Bóveda USA)')
}

async function verificarFinal() {
  console.log('\n' + '═'.repeat(60))
  console.log('📊 ESTADO FINAL')
  console.log('═'.repeat(60))

  // Distribuidor
  const distSnap = await getDoc(doc(db, 'distribuidores', `${TEST_PREFIX}dist`))
  const dist = distSnap.data()
  console.log('\n👷 DISTRIBUIDOR:', dist.nombre)
  console.log('   Deuda: $' + (dist.deuda || 0).toLocaleString())
  console.log('   Total compras: $' + (dist.totalCompras || 0).toLocaleString())
  console.log('   Total pagado: $' + (dist.totalPagado || 0).toLocaleString())

  // Cliente
  const cliSnap = await getDoc(doc(db, 'clientes', `${TEST_PREFIX}cli`))
  const cli = cliSnap.data()
  console.log('\n👤 CLIENTE:', cli.nombre)
  console.log('   Deuda: $' + (cli.deuda || 0).toLocaleString())
  console.log('   Total compras: $' + (cli.totalCompras || 0).toLocaleString())
  console.log('   Abonos: $' + (cli.abonos || 0).toLocaleString())

  // Stock
  const ocSnap = await getDoc(doc(db, 'ordenes_compra', `${TEST_PREFIX}oc`))
  const oc = ocSnap.data()
  console.log('\n📦 ALMACÉN:')
  console.log('   Stock actual:', oc.stockActual, 'unidades')

  // Bancos
  console.log('\n🏦 BANCOS:')
  console.log('   ┌─────────────────┬───────────────┬─────────────────┬─────────────────┐')
  console.log('   │ Banco           │ Capital Actual│ Hist. Ingresos  │ Hist. Gastos    │')
  console.log('   ├─────────────────┼───────────────┼─────────────────┼─────────────────┤')
  for (const id of ['boveda_monte', 'flete_sur', 'utilidades', 'boveda_usa', 'profit', 'leftie', 'azteca']) {
    const snap = await getDoc(doc(db, 'bancos', id))
    if (snap.exists()) {
      const d = snap.data()
      console.log(`   │ ${id.padEnd(15)} │ ${('$' + (d.capitalActual || 0).toLocaleString()).padStart(13)} │ ${('$' + (d.historicoIngresos || 0).toLocaleString()).padStart(15)} │ ${('$' + (d.historicoGastos || 0).toLocaleString()).padStart(15)} │`)
    }
  }
  console.log('   └─────────────────┴───────────────┴─────────────────┴─────────────────┘')
}

async function main() {
  console.log('\n' + '═'.repeat(60))
  console.log('🧪 SIMULACIÓN COMPLETA - SISTEMA CHRONOS')
  console.log('═'.repeat(60))
  console.log('📦 Project:', firebaseConfig.projectId)

  try {
    await limpiarPruebas()
    await crearDistribuidor()
    await crearOrdenCompra()
    await crearCliente()
    await crearVenta()
    await pagarDistribuidor()
    await abonoCliente()
    await registrarGasto()
    await registrarIngreso()
    await realizarTransferencia()
    await verificarFinal()

    console.log('\n' + '═'.repeat(60))
    console.log('✅ SIMULACIÓN COMPLETADA EXITOSAMENTE')
    console.log('═'.repeat(60))
    console.log('\n💡 Todos los datos de prueba tienen prefijo "' + TEST_PREFIX + '"')
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    process.exit(1)
  }
}

main()
