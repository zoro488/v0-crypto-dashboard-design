/**
 * CHRONOS - Script de Migración FASE 1 y 2
 * 
 * Este script inicializa:
 * - Los 7 Bancos/Wallets del sistema
 * - Catálogo de Clientes desde CSV
 * - Catálogo de Distribuidores desde CSV
 * - Órdenes de Compra con cálculos de costos
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
// ⚠️ IMPORTANTE: Descarga tu serviceAccountKey.json de Firebase Console
// Firebase Console > Project Settings > Service Accounts > Generate New Private Key
let serviceAccount: admin.ServiceAccount

try {
  serviceAccount = require('../serviceAccountKey.json')
} catch {
  console.error('❌ ERROR: No se encontró serviceAccountKey.json')
  console.error('   Descárgalo desde Firebase Console:')
  console.error('   Project Settings > Service Accounts > Generate New Private Key')
  console.error('   Guárdalo como serviceAccountKey.json en la raíz del proyecto')
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

// --- INTERFACES (Basadas en los CSVs analizados) ---

interface CSVOrdenCompra {
  id: string
  fecha: string
  origen: string
  cantidad: string
  costoDistribuidor: string
  costoTransporte: string
  costoPorUnidad: string
  stockActual: string
  costoTotal: string
  pagoDistribuidor: string
  deuda: string
}

interface CSVCliente {
  cliente: string
  actual: string
  deuda: string
  abonos: string
  pendiente: string
  observaciones: string
}

interface CSVDistribuidor {
  OC: string
  Fecha: string
  Origen: string
  Cantidad: string
  'Costo Distribuidor': string
  'Costo Transporte': string
  'Costo Por Unidad': string
  'Stock Actual': string
  'Costo Total': string
  'Pago a Distribuidor': string
  Deuda: string
  Distribuidores: string
  'Costo total': string
  Abonos: string
  Pendiente: string
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
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function parseExcelDate(value: string): Date {
  // Si es número (fecha serial de Excel), convertir
  const numValue = parseFloat(value)
  if (!isNaN(numValue) && numValue > 40000) {
    // Fecha serial de Excel: días desde 1900-01-01
    const date = new Date((numValue - 25569) * 86400 * 1000)
    return date
  }
  // Si es string de fecha normal
  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

// --- LÓGICA DE MIGRACIÓN ---

async function migrarBancos() {
  console.log('\n🏦 FASE 1.1: Inicializando los 7 Bancos (Wallets)...')
  
  // Los 7 Pilares Financieros del sistema Chronos
  const bancosConfig = [
    { id: 'boveda_usa', nombre: 'Bóveda USA', tipo: 'CAPITAL', divisa: 'USD', icono: '🇺🇸' },
    { id: 'boveda_monte', nombre: 'Bóveda Monte', tipo: 'CAPITAL', divisa: 'MXN', icono: '🏔️' },
    { id: 'azteca', nombre: 'Banco Azteca', tipo: 'BANCO', divisa: 'MXN', icono: '🏛️' },
    { id: 'profit', nombre: 'Profit', tipo: 'EXTERNO', divisa: 'MXN', icono: '📊' },
    { id: 'leftie', nombre: 'Leftie', tipo: 'EXTERNO', divisa: 'MXN', icono: '💼' },
    { id: 'utilidades', nombre: 'Fondo Utilidades', tipo: 'VIRTUAL', divisa: 'MXN', icono: '💰' },
    { id: 'fletes', nombre: 'Fondo Fletes', tipo: 'VIRTUAL', divisa: 'MXN', icono: '🚛' }
  ]

  const batch = db.batch()

  for (const banco of bancosConfig) {
    const ref = db.collection('bancos').doc(banco.id)
    batch.set(ref, {
      ...banco,
      saldoActual: 0, // Se ajustará manualmente con datos reales
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
  }

  await batch.commit()
  console.log('✅ 7 Entidades Financieras creadas correctamente.')
}

async function migrarClientes() {
  console.log('\n👥 FASE 1.2: Migrando Catálogo de Clientes...')
  
  const filePath = path.join(__dirname, '../csv/clientes.csv')
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ No se encontró el archivo csv/clientes.csv')
    return
  }

  const batch = db.batch()
  let count = 0

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: CSVCliente) => {
        if (!row.cliente || row.cliente.trim() === '') return

        const clienteId = normalizeId(row.cliente)
        const ref = db.collection('clientes').doc(clienteId)

        const deudaActual = parseNumber(row.pendiente)
        const totalAbonos = parseNumber(row.abonos)
        const totalDeuda = parseNumber(row.deuda)

        batch.set(ref, {
          nombre: row.cliente.trim(),
          deudaTotal: deudaActual,
          totalVentas: totalDeuda,
          totalPagado: totalAbonos,
          ventas: [],
          historialPagos: [],
          observaciones: row.observaciones || '',
          metadata: {
            deudaMigracion: deudaActual,
            abonosMigracion: totalAbonos,
            fechaMigracion: admin.firestore.FieldValue.serverTimestamp()
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
        
        count++
      })
      .on('end', async () => {
        await batch.commit()
        console.log(`✅ ${count} Clientes migrados.`)
        resolve()
      })
      .on('error', (error) => {
        console.error('❌ Error leyendo clientes.csv:', error)
        reject(error)
      })
  })
}

async function migrarDistribuidores() {
  console.log('\n🏭 FASE 1.3: Migrando Catálogo de Distribuidores...')
  
  // Extraemos distribuidores únicos de ordenes_compra.csv
  const filePath = path.join(__dirname, '../csv/ordenes_compra.csv')
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ No se encontró el archivo csv/ordenes_compra.csv')
    return
  }

  const distribuidoresSet = new Map<string, { nombre: string, totalOrdenes: number, totalMonto: number }>()

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: CSVOrdenCompra) => {
        if (!row.origen || row.origen.trim() === '') return

        const nombre = row.origen.trim()
        const costoTotal = parseNumber(row.costoTotal)
        
        if (distribuidoresSet.has(nombre)) {
          const existing = distribuidoresSet.get(nombre)!
          existing.totalOrdenes++
          existing.totalMonto += costoTotal
        } else {
          distribuidoresSet.set(nombre, {
            nombre,
            totalOrdenes: 1,
            totalMonto: costoTotal
          })
        }
      })
      .on('end', async () => {
        const batch = db.batch()
        let count = 0

        for (const [nombre, data] of distribuidoresSet) {
          const distId = normalizeId(nombre)
          const ref = db.collection('distribuidores').doc(distId)

          batch.set(ref, {
            nombre: data.nombre,
            deudaTotal: 0,
            totalOrdenesCompra: data.totalMonto,
            totalPagado: 0,
            ordenesCompra: [],
            historialPagos: [],
            metadata: {
              totalOrdenesMigracion: data.totalOrdenes,
              montoTotalMigracion: data.totalMonto,
              fechaMigracion: admin.firestore.FieldValue.serverTimestamp()
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true })
          
          count++
        }

        await batch.commit()
        console.log(`✅ ${count} Distribuidores migrados.`)
        resolve()
      })
      .on('error', (error) => {
        console.error('❌ Error leyendo ordenes_compra.csv:', error)
        reject(error)
      })
  })
}

async function migrarOrdenesCompra() {
  console.log('\n📦 FASE 2: Migrando Órdenes de Compra (Inventario Maestro)...')
  
  const filePath = path.join(__dirname, '../csv/ordenes_compra.csv')
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ No se encontró el archivo csv/ordenes_compra.csv')
    return
  }

  let batch = db.batch()
  let count = 0
  let batchCount = 0

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', async (row: CSVOrdenCompra) => {
        if (!row.id || row.id.trim() === '') return

        const ref = db.collection('ordenesCompra').doc(row.id.trim())

        // Cálculos financieros
        const costoDist = parseNumber(row.costoDistribuidor)
        const costoTrans = parseNumber(row.costoTransporte)
        const costoPorUnidad = parseNumber(row.costoPorUnidad) || (costoDist + costoTrans)
        const cantidad = parseInt(row.cantidad) || 0
        const stockActual = parseInt(row.stockActual) || 0
        const costoTotal = parseNumber(row.costoTotal)
        const pagoDistribuidor = parseNumber(row.pagoDistribuidor)
        const deuda = parseNumber(row.deuda)

        const distribuidorId = normalizeId(row.origen || '')

        batch.set(ref, {
          id: row.id.trim(),
          distribuidor: row.origen?.trim() || 'DESCONOCIDO',
          distribuidorId: distribuidorId,
          fecha: admin.firestore.Timestamp.fromDate(parseExcelDate(row.fecha)),
          
          // Estructura de Costos
          costos: {
            mercancia: costoDist,
            transporte: costoTrans,
            unitarioCalculado: costoPorUnidad,
            total: costoTotal
          },

          // Control de Inventario
          stock: {
            inicial: cantidad,
            actual: stockActual,
            vendido: cantidad - stockActual
          },

          // Estado financiero
          pagos: {
            totalPagado: pagoDistribuidor,
            deudaPendiente: deuda
          },

          estatus: stockActual > 0 ? 'ACTIVA' : 'AGOTADA',
          producto: 'Mercancía General', // Puedes ajustar esto
          origen: row.origen?.trim() || '',
          
          metadata: {
            migrado: true,
            fechaMigracion: admin.firestore.FieldValue.serverTimestamp()
          },
          
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        count++
        batchCount++

        // Commit cada 400 registros
        if (batchCount >= 400) {
          await batch.commit()
          batch = db.batch()
          batchCount = 0
          process.stdout.write('.')
        }
      })
      .on('end', async () => {
        if (batchCount > 0) await batch.commit()
        console.log(`\n✅ ${count} Órdenes de Compra migradas con cálculos financieros.`)
        resolve()
      })
      .on('error', (error) => {
        console.error('❌ Error leyendo ordenes_compra.csv:', error)
        reject(error)
      })
  })
}

async function migrarAlmacen() {
  console.log('\n📦 FASE 2.5: Inicializando Almacén...')
  
  // Crear un producto base para el inventario
  const batch = db.batch()
  
  const productoRef = db.collection('almacen').doc('mercancia_general')
  batch.set(productoRef, {
    nombre: 'Mercancía General',
    categoria: 'General',
    origen: 'Distribuidores',
    unidad: 'unidades',
    stockActual: 0, // Se calculará de las OC
    stockMinimo: 50,
    valorUnitario: 6300,
    totalEntradas: 0,
    totalSalidas: 0,
    descripcion: 'Producto principal del negocio',
    entradas: [],
    salidas: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true })

  await batch.commit()
  console.log('✅ Almacén inicializado.')
}

// --- EJECUCIÓN MAESTRA ---
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║       CHRONOS - Script de Migración FASE 1 y 2             ║')
  console.log('║       Inicialización de Bancos, Clientes y Órdenes         ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  
  try {
    await migrarBancos()
    await migrarClientes()
    await migrarDistribuidores()
    await migrarOrdenesCompra()
    await migrarAlmacen()
    
    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║  🚀 MIGRACIÓN FASE 1 Y 2 COMPLETADA CON ÉXITO              ║')
    console.log('╠════════════════════════════════════════════════════════════╣')
    console.log('║  Próximos pasos:                                           ║')
    console.log('║  1. Verifica en Firebase Console las colecciones           ║')
    console.log('║  2. Ajusta manualmente los saldos de los bancos            ║')
    console.log('║  3. Ejecuta migrate-phase3.ts para las ventas              ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error fatal en migración:', error)
    process.exit(1)
  }
}

main()
