/**
 * 🚀 SCRIPT DE MIGRACIÓN MAESTRA - CHRONOS SYSTEM
 * 
 * Este script migra TODOS los datos de los CSVs a Firestore
 * manteniendo la lógica de negocio exacta del Excel original.
 * 
 * Lógica de Distribución GYA (Ganancia y Asignación):
 * - Bóveda Monte: Recibe el COSTO (precioCompra × cantidad)
 * - Flete Sur: Recibe el monto de flete
 * - Utilidades: Recibe la ganancia neta (Ingreso - Costo - Flete)
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CSV_DIR = path.join(__dirname, '../csv');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');

// Verificar si existe el archivo de service account
let serviceAccount: ServiceAccount | null = null;
try {
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    serviceAccount = require(SERVICE_ACCOUNT_PATH);
  }
} catch (error) {
  console.warn('⚠️  No se encontró service-account.json, intentando con variables de entorno...');
}

// Inicializar Firebase Admin
if (serviceAccount) {
  initializeApp({ credential: cert(serviceAccount) });
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  initializeApp({ credential: cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)) });
} else {
  console.error('❌ Error: No se pudo configurar Firebase Admin.');
  console.error('   Opciones:');
  console.error('   1. Crear scripts/service-account.json con credenciales de Firebase');
  console.error('   2. Establecer GOOGLE_APPLICATION_CREDENTIALS en .env.local');
  process.exit(1);
}

const db = getFirestore();

// ============================================================================
// MAPEO DE BANCOS (Normalización de nombres)
// ============================================================================

const BANCO_MAP: Record<string, string> = {
  // Bóvedas principales
  'Bóveda Monte': 'boveda_monte',
  'Boveda Monte': 'boveda_monte',
  'bóveda monte': 'boveda_monte',
  'boveda monte': 'boveda_monte',
  'Monte': 'boveda_monte',
  'Bóveda USA': 'boveda_usa',
  'Boveda USA': 'boveda_usa',
  'USA': 'boveda_usa',
  // Bancos operativos
  'Profit': 'profit',
  'PROFIT': 'profit',
  'Leftie': 'leftie',
  'LEFTIE': 'leftie',
  'Azteca': 'azteca',
  'AZTECA': 'azteca',
  // Gastos y utilidades
  'Flete Sur': 'flete_sur',
  'Flete': 'flete_sur',
  'Fletes': 'flete_sur',
  'FLETE': 'flete_sur',
  'Utilidades': 'utilidades',
  'UTILIDADES': 'utilidades',
  'Utilidad': 'utilidades',
};

// ============================================================================
// UTILIDADES DE PARSING
// ============================================================================

/**
 * Parsea un valor monetario del CSV
 * Maneja formatos: $1,000.00 | 1000 | 1,000 | -500
 */
const parseMoney = (val: string | number | undefined): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.toString().replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Parsea una fecha del CSV (formato DD/MM/YYYY o YYYY-MM-DD)
 */
const parseDate = (dateStr: string | undefined): Timestamp => {
  if (!dateStr) return Timestamp.now();
  
  // Intentar formato YYYY-MM-DD primero
  if (dateStr.includes('-')) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return Timestamp.fromDate(date);
    }
  }
  
  // Formato DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(date.getTime())) {
      return Timestamp.fromDate(date);
    }
  }
  
  return Timestamp.now();
};

/**
 * Normaliza el nombre del banco
 */
const normalizeBanco = (banco: string | undefined): string => {
  if (!banco) return 'boveda_monte';
  return BANCO_MAP[banco] || BANCO_MAP[banco.trim()] || 'boveda_monte';
};

/**
 * Genera un ID único para ventas
 */
const generateVentaId = (): string => {
  return `V-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
};

/**
 * Genera un ID único para movimientos
 */
const generateMovimientoId = (): string => {
  return `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
};

// ============================================================================
// FUNCIONES DE MIGRACIÓN
// ============================================================================

/**
 * Migrar estructura inicial de bancos
 */
async function migrarBancos() {
  console.log('\n💰 Migrando estructura de Bancos...');
  
  const bancosConfig = [
    {
      id: 'boveda_monte',
      nombre: 'Bóveda Monte',
      icon: '🏛️',
      color: 'purple',
      tipo: 'boveda',
      moneda: 'MXN',
      descripcion: 'Bóveda principal - Recibe costos de ventas',
      capitalInicial: 0,
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo',
    },
    {
      id: 'boveda_usa',
      nombre: 'Bóveda USA',
      icon: '🇺🇸',
      color: 'blue',
      tipo: 'boveda',
      moneda: 'USD',
      descripcion: 'Bóveda en dólares',
      capitalInicial: 0,
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo',
    },
    {
      id: 'profit',
      nombre: 'Profit',
      icon: '💹',
      color: 'green',
      tipo: 'operativo',
      moneda: 'MXN',
      descripcion: 'Banco operativo principal',
      capitalInicial: 0,
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo',
    },
    {
      id: 'leftie',
      nombre: 'Leftie',
      icon: '🏦',
      color: 'cyan',
      tipo: 'operativo',
      moneda: 'MXN',
      descripcion: 'Banco operativo secundario',
      capitalInicial: 0,
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo',
    },
    {
      id: 'azteca',
      nombre: 'Azteca',
      icon: '🦅',
      color: 'yellow',
      tipo: 'operativo',
      moneda: 'MXN',
      descripcion: 'Banco Azteca',
      capitalInicial: 0,
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo',
    },
    {
      id: 'flete_sur',
      nombre: 'Flete Sur',
      icon: '🚚',
      color: 'orange',
      tipo: 'gastos',
      moneda: 'MXN',
      descripcion: 'Gastos de flete y transporte',
      capitalInicial: 0,
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo',
    },
    {
      id: 'utilidades',
      nombre: 'Utilidades',
      icon: '💎',
      color: 'emerald',
      tipo: 'utilidades',
      moneda: 'MXN',
      descripcion: 'Ganancias netas del negocio',
      capitalInicial: 0,
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo',
    },
  ];

  const batch = db.batch();
  
  for (const banco of bancosConfig) {
    const ref = db.collection('bancos').doc(banco.id);
    batch.set(ref, {
      ...banco,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }
  
  await batch.commit();
  console.log(`   ✅ ${bancosConfig.length} bancos configurados`);
}

/**
 * Migrar Órdenes de Compra
 */
async function migrarOrdenesCompra() {
  console.log('\n📦 Migrando Órdenes de Compra...');
  
  const csvPath = path.join(CSV_DIR, 'ordenes_compra.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('   ⚠️  Archivo ordenes_compra.csv no encontrado');
    return;
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, { 
    columns: true, 
    skip_empty_lines: true,
    trim: true,
  });
  
  let count = 0;
  const batch = db.batch();
  const distribuidoresMap = new Map<string, number>(); // Para acumular deudas
  
  for (const row of records) {
    const ocId = row.id || row.OC;
    if (!ocId) continue;
    
    const cantidad = parseInt(row.cantidad || row.Cantidad) || 0;
    const costoDistribuidor = parseMoney(row.costoDistribuidor || row['Costo Distribuidor'] || row['Costo']);
    const costoTransporte = parseMoney(row.costoTransporte || row['Costo Transporte'] || row['Transporte']);
    const costoPorUnidad = parseMoney(row.costoPorUnidad || row['Costo Por Unidad']) || (costoDistribuidor + costoTransporte);
    const costoTotal = parseMoney(row.costoTotal || row['Costo Total']) || (costoPorUnidad * cantidad);
    const pagoDistribuidor = parseMoney(row.pagoDistribuidor || row['Pago a Distribuidor'] || row['Pago']);
    const deuda = parseMoney(row.deuda || row['Deuda']) || (costoTotal - pagoDistribuidor);
    const distribuidor = row.origen || row.Origen || row.distribuidor || 'Desconocido';
    const stockActual = parseInt(row.stockActual || row['Stock Actual']) || 0;
    
    const ocRef = db.collection('ordenes_compra').doc(ocId);
    batch.set(ocRef, {
      id: ocId,
      fecha: parseDate(row.fecha || row.Fecha),
      distribuidor: distribuidor,
      distribuidorId: distribuidor.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      origen: distribuidor,
      cantidad: cantidad,
      costoDistribuidor: costoDistribuidor,
      costoTransporte: costoTransporte,
      costoPorUnidad: costoPorUnidad,
      costoTotal: costoTotal,
      stockActual: stockActual,
      stockInicial: cantidad,
      pagoDistribuidor: pagoDistribuidor,
      pagoInicial: pagoDistribuidor,
      deuda: deuda,
      estado: deuda > 0 ? (pagoDistribuidor > 0 ? 'parcial' : 'pendiente') : 'pagado',
      keywords: [ocId.toLowerCase(), distribuidor.toLowerCase()].filter(Boolean),
      origenDatos: 'migracion_csv',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    // Acumular deuda por distribuidor
    const distKey = distribuidor.toLowerCase().replace(/[^a-z0-9]/g, '_');
    distribuidoresMap.set(distKey, (distribuidoresMap.get(distKey) || 0) + deuda);
    
    count++;
  }
  
  // Crear/Actualizar distribuidores
  for (const [distId, deudaTotal] of distribuidoresMap) {
    const distRef = db.collection('distribuidores').doc(distId);
    batch.set(distRef, {
      id: distId,
      nombre: distId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      deudaTotal: deudaTotal,
      totalOrdenesCompra: 0, // Se calcula después
      totalPagado: 0,
      estado: 'activo',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }
  
  await batch.commit();
  console.log(`   ✅ ${count} órdenes de compra migradas`);
  console.log(`   ✅ ${distribuidoresMap.size} distribuidores creados/actualizados`);
}

/**
 * Migrar Ventas con distribución GYA automática
 */
async function migrarVentas() {
  console.log('\n💵 Migrando Ventas con distribución GYA...');
  
  const csvPath = path.join(CSV_DIR, 'ventas.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('   ⚠️  Archivo ventas.csv no encontrado');
    return;
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, { 
    columns: true, 
    skip_empty_lines: true,
    trim: true,
  });
  
  let ventasCount = 0;
  let movimientosCount = 0;
  const clientesMap = new Map<string, { deuda: number; total: number }>();
  
  // Acumuladores para saldos de bancos
  const bancosAccum = {
    boveda_monte: { ingresos: 0, capital: 0 },
    flete_sur: { ingresos: 0, capital: 0 },
    utilidades: { ingresos: 0, capital: 0 },
  };
  
  // Procesar en batches de 400 (límite de Firestore es 500)
  const batchSize = 400;
  let currentBatch = db.batch();
  let operationsCount = 0;
  
  for (const row of records) {
    const cliente = row.cliente || row.Cliente;
    if (!cliente) continue;
    
    const ventaId = generateVentaId();
    const cantidad = parseInt(row.cantidad || row.Cantidad) || 0;
    
    // Datos del CSV de ventas
    const bovedaMonte = parseMoney(row.bovedaMonte || row['Bóveda Monte'] || row['bovedaMonte']);
    const precioVenta = parseMoney(row.precioVenta || row['Precio De Venta'] || row['precioVenta']);
    const ingreso = parseMoney(row.ingreso || row['Ingreso']);
    const fleteUtilidad = parseMoney(row.fleteUtilidad || row['Flete Utilidad'] || row['fleteUtilidad']);
    const utilidad = parseMoney(row.utilidad || row['Utilidad']);
    const flete = row.flete || row.Flete || 'NoAplica';
    const estatus = row.estatus || row.Estatus || 'Pendiente';
    
    // Calcular totales
    const totalVenta = ingreso || (precioVenta * cantidad);
    
    // La distribución GYA ya viene calculada en el CSV:
    // bovedaMonte = costo (lo que se pagó al distribuidor)
    // fleteUtilidad = costo del flete
    // utilidad = ganancia neta
    
    // Determinar estado de pago
    const estadoPago = estatus === 'Pagado' ? 'completo' : 
                       estatus === 'Parcial' ? 'parcial' : 'pendiente';
    const montoPagado = estadoPago === 'completo' ? totalVenta : 0;
    const montoRestante = totalVenta - montoPagado;
    
    // Crear documento de venta
    const ventaRef = db.collection('ventas').doc(ventaId);
    currentBatch.set(ventaRef, {
      id: ventaId,
      fecha: parseDate(row.fecha || row.Fecha),
      ocRelacionada: row.ocRelacionada || row['OC Relacionada'] || row['ocRelacionada'] || '',
      cliente: cliente,
      clienteId: cliente.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      cantidad: cantidad,
      precioVenta: precioVenta,
      precioCompra: cantidad > 0 ? bovedaMonte / cantidad : 0, // Costo unitario
      ingreso: totalVenta,
      totalVenta: totalVenta,
      precioTotalVenta: totalVenta,
      flete: flete === 'Aplica' || flete === 'aplica' ? 'Aplica' : 'NoAplica',
      fleteUtilidad: fleteUtilidad,
      precioFlete: fleteUtilidad,
      utilidad: utilidad,
      ganancia: utilidad,
      bovedaMonte: bovedaMonte,
      // Distribución a bancos (estructura para reportes)
      distribucion: {
        bovedaMonte: bovedaMonte,
        fletes: fleteUtilidad,
        utilidades: utilidad,
      },
      distribucionBancos: {
        bovedaMonte: bovedaMonte,
        fletes: fleteUtilidad,
        utilidades: utilidad,
      },
      estatus: estatus,
      estadoPago: estadoPago,
      montoPagado: montoPagado,
      montoRestante: montoRestante,
      adeudo: montoRestante,
      concepto: row.concepto || row.Concepto || '',
      keywords: [ventaId.toLowerCase(), cliente.toLowerCase()].filter(Boolean),
      origenDatos: 'migracion_csv',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    operationsCount++;
    ventasCount++;
    
    // Solo crear movimientos bancarios si está PAGADO
    if (estadoPago === 'completo') {
      // 1. Movimiento a Bóveda Monte (costo base)
      if (bovedaMonte > 0) {
        const movMonteRef = db.collection('movimientos').doc(generateMovimientoId());
        currentBatch.set(movMonteRef, {
          tipoMovimiento: 'ingreso',
          tipo: 'ingreso_venta',
          bancoId: 'boveda_monte',
          monto: bovedaMonte,
          concepto: `Venta ${ventaId} - ${cliente}`,
          referencia: `Costo recuperado de venta`,
          referenciaId: ventaId,
          referenciaTipo: 'venta',
          cliente: cliente,
          fecha: parseDate(row.fecha || row.Fecha),
          createdAt: Timestamp.now(),
        });
        operationsCount++;
        movimientosCount++;
        bancosAccum.boveda_monte.ingresos += bovedaMonte;
        bancosAccum.boveda_monte.capital += bovedaMonte;
      }
      
      // 2. Movimiento a Flete Sur
      if (fleteUtilidad > 0) {
        const movFleteRef = db.collection('movimientos').doc(generateMovimientoId());
        currentBatch.set(movFleteRef, {
          tipoMovimiento: 'ingreso',
          tipo: 'ingreso_venta',
          bancoId: 'flete_sur',
          monto: fleteUtilidad,
          concepto: `Flete Venta ${ventaId}`,
          referencia: `Recuperación de flete`,
          referenciaId: ventaId,
          referenciaTipo: 'venta',
          cliente: cliente,
          fecha: parseDate(row.fecha || row.Fecha),
          createdAt: Timestamp.now(),
        });
        operationsCount++;
        movimientosCount++;
        bancosAccum.flete_sur.ingresos += fleteUtilidad;
        bancosAccum.flete_sur.capital += fleteUtilidad;
      }
      
      // 3. Movimiento a Utilidades (solo si hay ganancia positiva)
      if (utilidad > 0) {
        const movUtilRef = db.collection('movimientos').doc(generateMovimientoId());
        currentBatch.set(movUtilRef, {
          tipoMovimiento: 'ingreso',
          tipo: 'ingreso_venta',
          bancoId: 'utilidades',
          monto: utilidad,
          concepto: `Utilidad Venta ${ventaId}`,
          referencia: `Ganancia neta`,
          referenciaId: ventaId,
          referenciaTipo: 'venta',
          cliente: cliente,
          fecha: parseDate(row.fecha || row.Fecha),
          createdAt: Timestamp.now(),
        });
        operationsCount++;
        movimientosCount++;
        bancosAccum.utilidades.ingresos += utilidad;
        bancosAccum.utilidades.capital += utilidad;
      }
    }
    
    // Acumular datos de cliente
    const clienteKey = cliente.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const clienteData = clientesMap.get(clienteKey) || { deuda: 0, total: 0 };
    clienteData.total += totalVenta;
    clienteData.deuda += montoRestante;
    clientesMap.set(clienteKey, clienteData);
    
    // Commit batch si llegamos al límite
    if (operationsCount >= batchSize) {
      await currentBatch.commit();
      currentBatch = db.batch();
      operationsCount = 0;
      process.stdout.write('.');
    }
  }
  
  // Commit batch restante
  if (operationsCount > 0) {
    await currentBatch.commit();
  }
  
  console.log(`\n   ✅ ${ventasCount} ventas migradas`);
  console.log(`   ✅ ${movimientosCount} movimientos bancarios creados`);
  
  // Crear/Actualizar clientes
  console.log('\n👥 Creando clientes...');
  const clientesBatch = db.batch();
  
  for (const [clienteId, data] of clientesMap) {
    const clienteRef = db.collection('clientes').doc(clienteId);
    clientesBatch.set(clienteRef, {
      id: clienteId,
      nombre: clienteId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      deudaTotal: data.deuda,
      pendiente: data.deuda,
      totalVentas: data.total,
      totalPagado: data.total - data.deuda,
      estado: 'activo',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }
  
  await clientesBatch.commit();
  console.log(`   ✅ ${clientesMap.size} clientes creados/actualizados`);
  
  // Actualizar saldos de bancos
  console.log('\n🏦 Actualizando saldos bancarios...');
  const bancosBatch = db.batch();
  
  for (const [bancoId, acum] of Object.entries(bancosAccum)) {
    const bancoRef = db.collection('bancos').doc(bancoId);
    bancosBatch.update(bancoRef, {
      capitalActual: FieldValue.increment(acum.capital),
      historicoIngresos: FieldValue.increment(acum.ingresos),
      updatedAt: Timestamp.now(),
    });
  }
  
  await bancosBatch.commit();
  console.log('   ✅ Saldos bancarios actualizados');
  
  // Resumen de distribución
  console.log('\n📊 RESUMEN DE DISTRIBUCIÓN GYA:');
  console.log(`   💜 Bóveda Monte: $${bancosAccum.boveda_monte.ingresos.toLocaleString('es-MX')}`);
  console.log(`   🚚 Flete Sur:    $${bancosAccum.flete_sur.ingresos.toLocaleString('es-MX')}`);
  console.log(`   💎 Utilidades:   $${bancosAccum.utilidades.ingresos.toLocaleString('es-MX')}`);
}

/**
 * Migrar clientes desde CSV (si existe)
 */
async function migrarClientes() {
  console.log('\n👥 Verificando clientes adicionales...');
  
  const csvPath = path.join(CSV_DIR, 'clientes.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('   ⚠️  Archivo clientes.csv no encontrado (los clientes se crean desde ventas)');
    return;
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, { 
    columns: true, 
    skip_empty_lines: true,
    trim: true,
  });
  
  const batch = db.batch();
  let count = 0;
  
  for (const row of records) {
    const nombre = row.nombre || row.Nombre || row.cliente || row.Cliente;
    if (!nombre) continue;
    
    const clienteId = nombre.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const clienteRef = db.collection('clientes').doc(clienteId);
    
    batch.set(clienteRef, {
      id: clienteId,
      nombre: nombre,
      telefono: row.telefono || row.Telefono || '',
      email: row.email || row.Email || '',
      direccion: row.direccion || row.Direccion || '',
      deudaTotal: parseMoney(row.deuda || row.Deuda) || 0,
      totalVentas: parseMoney(row.totalVentas || row['Total Ventas']) || 0,
      estado: 'activo',
      updatedAt: Timestamp.now(),
    }, { merge: true });
    
    count++;
  }
  
  await batch.commit();
  console.log(`   ✅ ${count} clientes actualizados desde CSV`);
}

/**
 * Migrar gastos y abonos
 */
async function migrarGastosAbonos() {
  console.log('\n💸 Migrando Gastos y Abonos...');
  
  const csvPath = path.join(CSV_DIR, 'gastos_abonos.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('   ⚠️  Archivo gastos_abonos.csv no encontrado');
    return;
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, { 
    columns: true, 
    skip_empty_lines: true,
    trim: true,
  });
  
  let gastosCount = 0;
  let abonosCount = 0;
  const batch = db.batch();
  
  for (const row of records) {
    const tipo = row.tipo || row.Tipo || 'gasto';
    const monto = parseMoney(row.valor || row.Valor || row.monto || row.Monto);
    const bancoId = normalizeBanco(row.destino || row.Destino || row.banco);
    
    if (monto === 0) continue;
    
    const movRef = db.collection('movimientos').doc(generateMovimientoId());
    const esAbono = tipo.toLowerCase().includes('abono');
    
    batch.set(movRef, {
      tipoMovimiento: esAbono ? 'abono_cliente' : 'gasto',
      tipo: esAbono ? 'abono' : 'gasto',
      bancoId: bancoId,
      monto: monto,
      concepto: row.concepto || row.Concepto || `${tipo} - ${row.origen || row.Origen || 'General'}`,
      cliente: row.origen || row.Origen || '',
      tc: parseMoney(row.tc || row.TC) || 1,
      pesos: parseMoney(row.pesos || row.Pesos) || monto,
      fecha: parseDate(row.fecha || row.Fecha),
      origenDatos: 'migracion_csv',
      createdAt: Timestamp.now(),
    });
    
    if (esAbono) {
      abonosCount++;
    } else {
      gastosCount++;
    }
  }
  
  await batch.commit();
  console.log(`   ✅ ${gastosCount} gastos migrados`);
  console.log(`   ✅ ${abonosCount} abonos migrados`);
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
  console.log('═'.repeat(60));
  console.log('🚀 MIGRACIÓN MAESTRA CHRONOS - SINCRONIZACIÓN TOTAL');
  console.log('═'.repeat(60));
  console.log(`📂 Directorio CSV: ${CSV_DIR}`);
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-MX')}`);
  console.log('═'.repeat(60));
  
  try {
    // 1. Estructura de bancos
    await migrarBancos();
    
    // 2. Órdenes de compra (base para calcular costos)
    await migrarOrdenesCompra();
    
    // 3. Ventas con distribución GYA automática
    await migrarVentas();
    
    // 4. Clientes adicionales
    await migrarClientes();
    
    // 5. Gastos y abonos
    await migrarGastosAbonos();
    
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('═'.repeat(60));
    console.log('\n📋 Verificación recomendada:');
    console.log('   1. Revisar totales en BentoDashboard');
    console.log('   2. Verificar distribución GYA en BentoVentas');
    console.log('   3. Confirmar saldos bancarios coincidan con Excel');
    console.log('\n💡 Ejecutar: pnpm dev para ver los datos en el dashboard\n');
    
  } catch (error) {
    console.error('\n❌ ERROR EN MIGRACIÓN:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
