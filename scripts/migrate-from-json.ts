/**
 * 🚀 SCRIPT DE MIGRACIÓN DESDE JSON - CHRONOS SYSTEM
 * 
 * Este script migra datos desde BASE_DATOS_FLOWDISTRIBUTOR_UNIFICADO.json
 * que contiene la información más completa y actualizada del sistema.
 * 
 * VENTAJAS sobre CSV:
 * - Datos consolidados en un solo archivo
 * - Incluye totales RF Actual de cada banco
 * - Movimientos detallados por banco
 * - Clientes con saldos finales
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const JSON_PATH = path.join(__dirname, '../gg/BASE_DATOS_FLOWDISTRIBUTOR_UNIFICADO.json');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');

// Verificar si existe el archivo de service account
let serviceAccount: ServiceAccount | null = null;
try {
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    serviceAccount = require(SERVICE_ACCOUNT_PATH);
  }
} catch (error) {
  console.warn('⚠️  No se encontró service-account.json');
}

// Inicializar Firebase Admin
if (serviceAccount) {
  initializeApp({ credential: cert(serviceAccount) });
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  initializeApp({ credential: cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)) });
} else {
  console.error('❌ Error: No se pudo configurar Firebase Admin.');
  process.exit(1);
}

const db = getFirestore();

// ============================================================================
// TIPOS PARA EL JSON
// ============================================================================

interface OrdenCompraJSON {
  id: string;
  fecha: string;
  origen: string;
  cantidad: number;
  costoDistribuidor: number;
  costoTransporte: number;
  costoPorUnidad: number;
  stockActual: number;
  costoTotal: number;
  pagoDistribuidor: number;
  deuda: number;
}

interface VentaJSON {
  fecha: string;
  ocRelacionada: string;
  cantidad: number;
  cliente: string;
  bovedaMonte: number;
  precioVenta: number;
  ingreso: number;
  flete: string;
  fleteUtilidad: number;
  utilidad: number;
  estatus: string;
  concepto: string;
}

interface MovimientoJSON {
  fecha: string;
  cliente: string;
  ingreso: number;
  concepto?: string;
  tc?: number;
  dolares?: number;
  destino?: string;
  observaciones?: string;
}

interface ClienteJSON {
  cliente: string;
  actual: number;
  deuda: number;
  abonos: number;
  pendiente: number;
  observaciones?: string;
}

interface BancoDataJSON {
  ingresos?: number;
  ingresosList?: MovimientoJSON[];
  gastos?: number;
  gastosList?: MovimientoJSON[];
  rfActual?: number;
  rfCortes?: unknown[];
}

interface DataJSON {
  metadata: { version: string; fecha: string; descripcion: string };
  ordenesCompra: {
    distribuidores: {
      ordenesCompra: OrdenCompraJSON[];
      distribuidores: { nombre: string; costoTotal: number; abonos: number; pendiente: number }[];
    };
  };
  ventasLocales: { ventasLocal: VentaJSON[] };
  gastosAbonos: { gastosAbonos: unknown[] };
  fleteSur: { fleteSur: BancoDataJSON };
  almacenMonte: { almacenMonte: unknown };
  bovedaMonte: { bovedaMonte: BancoDataJSON };
  bovedaUSA: { bovedaUsa: BancoDataJSON };
  azteca: { azteca: BancoDataJSON };
  leftie: { leftie: BancoDataJSON };
  profit: { profit: BancoDataJSON };
  clientes: { clientes: ClienteJSON[] };
}

// ============================================================================
// UTILIDADES
// ============================================================================

const parseDate = (dateStr: string): Timestamp => {
  if (!dateStr) return Timestamp.now();
  
  // Formato DD/MM/YYYY
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return Timestamp.fromDate(new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`));
  }
  
  // Formato YYYY-MM-DD
  return Timestamp.fromDate(new Date(dateStr));
};

const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
};

// ============================================================================
// MIGRACIÓN DE BANCOS CON RF ACTUAL
// ============================================================================

async function migrarBancosConTotales(data: DataJSON) {
  console.log('\n💰 Configurando Bancos con RF Actual del Excel...');
  
  const bancosConfig = [
    {
      id: 'boveda_monte',
      nombre: 'Bóveda Monte',
      icon: '🏛️',
      color: 'purple',
      tipo: 'boveda',
      moneda: 'MXN',
      descripcion: 'Bóveda principal - Recibe costos de ventas',
      capitalActual: data.bovedaMonte?.bovedaMonte?.rfActual || 0,
      historicoIngresos: data.bovedaMonte?.bovedaMonte?.ingresos || 0,
      historicoGastos: data.bovedaMonte?.bovedaMonte?.gastos || 0,
    },
    {
      id: 'boveda_usa',
      nombre: 'Bóveda USA',
      icon: '🇺🇸',
      color: 'blue',
      tipo: 'boveda',
      moneda: 'USD',
      descripcion: 'Bóveda en dólares',
      capitalActual: data.bovedaUSA?.bovedaUsa?.rfActual || 0,
      historicoIngresos: data.bovedaUSA?.bovedaUsa?.ingresos || 0,
      historicoGastos: data.bovedaUSA?.bovedaUsa?.gastos || 0,
    },
    {
      id: 'profit',
      nombre: 'Profit',
      icon: '💹',
      color: 'green',
      tipo: 'operativo',
      moneda: 'MXN',
      descripcion: 'Banco operativo principal',
      capitalActual: data.profit?.profit?.rfActual || 0,
      historicoIngresos: data.profit?.profit?.ingresos || 0,
      historicoGastos: data.profit?.profit?.gastos || 0,
    },
    {
      id: 'leftie',
      nombre: 'Leftie',
      icon: '🏦',
      color: 'cyan',
      tipo: 'operativo',
      moneda: 'MXN',
      descripcion: 'Banco operativo secundario',
      capitalActual: data.leftie?.leftie?.rfActual || 0,
      historicoIngresos: data.leftie?.leftie?.ingresos || 0,
      historicoGastos: data.leftie?.leftie?.gastos || 0,
    },
    {
      id: 'azteca',
      nombre: 'Azteca',
      icon: '🦅',
      color: 'yellow',
      tipo: 'operativo',
      moneda: 'MXN',
      descripcion: 'Banco Azteca',
      capitalActual: data.azteca?.azteca?.rfActual || 0,
      historicoIngresos: data.azteca?.azteca?.ingresos || 0,
      historicoGastos: data.azteca?.azteca?.gastos || 0,
    },
    {
      id: 'flete_sur',
      nombre: 'Flete Sur',
      icon: '🚚',
      color: 'orange',
      tipo: 'gastos',
      moneda: 'MXN',
      descripcion: 'Gastos de flete y transporte',
      capitalActual: data.fleteSur?.fleteSur?.rfActual || 0,
      historicoIngresos: data.fleteSur?.fleteSur?.ingresos || 0,
      historicoGastos: data.fleteSur?.fleteSur?.gastos || 0,
    },
    {
      id: 'utilidades',
      nombre: 'Utilidades',
      icon: '💎',
      color: 'emerald',
      tipo: 'utilidades',
      moneda: 'MXN',
      descripcion: 'Ganancias netas del negocio',
      capitalActual: 0, // Se calcula de las ventas
      historicoIngresos: 0,
      historicoGastos: 0,
    },
  ];

  const batch = db.batch();
  
  for (const banco of bancosConfig) {
    const ref = db.collection('bancos').doc(banco.id);
    batch.set(ref, {
      ...banco,
      capitalInicial: 0,
      historicoTransferencias: 0,
      estado: 'activo',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    console.log(`   💳 ${banco.nombre}: $${banco.capitalActual.toLocaleString('es-MX')} MXN`);
  }
  
  await batch.commit();
  console.log('   ✅ Bancos configurados con RF Actual');
}

// ============================================================================
// MIGRACIÓN DE ÓRDENES DE COMPRA
// ============================================================================

async function migrarOrdenesCompra(data: DataJSON) {
  console.log('\n📦 Migrando Órdenes de Compra...');
  
  const ordenes = data.ordenesCompra?.distribuidores?.ordenesCompra || [];
  if (ordenes.length === 0) {
    console.log('   ⚠️  No hay órdenes de compra en el JSON');
    return;
  }
  
  const batch = db.batch();
  
  for (const oc of ordenes) {
    const ocRef = db.collection('ordenes_compra').doc(oc.id);
    batch.set(ocRef, {
      id: oc.id,
      fecha: parseDate(oc.fecha),
      distribuidor: oc.origen,
      distribuidorId: oc.origen.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      origen: oc.origen,
      cantidad: oc.cantidad,
      costoDistribuidor: oc.costoDistribuidor,
      costoTransporte: oc.costoTransporte,
      costoPorUnidad: oc.costoPorUnidad,
      costoTotal: oc.costoTotal,
      stockActual: oc.stockActual,
      stockInicial: oc.cantidad,
      pagoDistribuidor: oc.pagoDistribuidor,
      pagoInicial: oc.pagoDistribuidor,
      deuda: oc.deuda,
      estado: oc.deuda > 0 ? (oc.pagoDistribuidor > 0 ? 'parcial' : 'pendiente') : 'pagado',
      keywords: [oc.id.toLowerCase(), oc.origen.toLowerCase()],
      origenDatos: 'migracion_json',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  
  // Crear distribuidores
  const distribuidores = data.ordenesCompra?.distribuidores?.distribuidores || [];
  for (const dist of distribuidores) {
    const distId = dist.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const distRef = db.collection('distribuidores').doc(distId);
    batch.set(distRef, {
      id: distId,
      nombre: dist.nombre,
      costoTotal: dist.costoTotal,
      totalOrdenesCompra: dist.costoTotal,
      abonos: dist.abonos,
      totalPagado: dist.abonos,
      pendiente: dist.pendiente,
      deudaTotal: dist.pendiente,
      estado: 'activo',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  
  await batch.commit();
  console.log(`   ✅ ${ordenes.length} órdenes de compra migradas`);
  console.log(`   ✅ ${distribuidores.length} distribuidores creados`);
}

// ============================================================================
// MIGRACIÓN DE VENTAS
// ============================================================================

async function migrarVentas(data: DataJSON) {
  console.log('\n💵 Migrando Ventas...');
  
  const ventas = data.ventasLocales?.ventasLocal || [];
  if (ventas.length === 0) {
    console.log('   ⚠️  No hay ventas en el JSON');
    return;
  }
  
  let count = 0;
  const batchSize = 400;
  let currentBatch = db.batch();
  let operationsCount = 0;
  
  // Acumuladores para utilidades
  let totalUtilidades = 0;
  
  for (const venta of ventas) {
    const ventaId = generateId('V');
    const clienteId = venta.cliente.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const estadoPago = venta.estatus === 'Pagado' ? 'completo' : 
                       venta.estatus === 'Parcial' ? 'parcial' : 'pendiente';
    const montoPagado = estadoPago === 'completo' ? venta.ingreso : 0;
    const montoRestante = venta.ingreso - montoPagado;
    
    const ventaRef = db.collection('ventas').doc(ventaId);
    currentBatch.set(ventaRef, {
      id: ventaId,
      fecha: parseDate(venta.fecha),
      ocRelacionada: venta.ocRelacionada,
      cliente: venta.cliente,
      clienteId: clienteId,
      cantidad: venta.cantidad,
      precioVenta: venta.precioVenta,
      precioCompra: venta.cantidad > 0 ? venta.bovedaMonte / venta.cantidad : 0,
      ingreso: venta.ingreso,
      totalVenta: venta.ingreso,
      precioTotalVenta: venta.ingreso,
      flete: venta.flete === 'Aplica' ? 'Aplica' : 'NoAplica',
      fleteUtilidad: venta.fleteUtilidad,
      precioFlete: venta.cantidad > 0 ? venta.fleteUtilidad / venta.cantidad : 0,
      utilidad: venta.utilidad,
      ganancia: venta.utilidad,
      bovedaMonte: venta.bovedaMonte,
      distribucion: {
        bovedaMonte: venta.bovedaMonte,
        fletes: venta.fleteUtilidad,
        utilidades: venta.utilidad,
      },
      distribucionBancos: {
        bovedaMonte: venta.bovedaMonte,
        fletes: venta.fleteUtilidad,
        utilidades: venta.utilidad,
      },
      estatus: venta.estatus,
      estadoPago: estadoPago,
      montoPagado: montoPagado,
      montoRestante: montoRestante,
      adeudo: montoRestante,
      concepto: venta.concepto,
      keywords: [ventaId.toLowerCase(), venta.cliente.toLowerCase()],
      origenDatos: 'migracion_json',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    operationsCount++;
    count++;
    
    // Acumular utilidades de ventas pagadas
    if (estadoPago === 'completo' && venta.utilidad > 0) {
      totalUtilidades += venta.utilidad;
    }
    
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
  
  // Actualizar banco de utilidades
  if (totalUtilidades > 0) {
    const utilRef = db.collection('bancos').doc('utilidades');
    await utilRef.update({
      capitalActual: totalUtilidades,
      historicoIngresos: totalUtilidades,
      updatedAt: Timestamp.now(),
    });
  }
  
  console.log(`\n   ✅ ${count} ventas migradas`);
  console.log(`   💎 Utilidades totales: $${totalUtilidades.toLocaleString('es-MX')}`);
}

// ============================================================================
// MIGRACIÓN DE CLIENTES
// ============================================================================

async function migrarClientes(data: DataJSON) {
  console.log('\n👥 Migrando Clientes con saldos finales...');
  
  const clientes = data.clientes?.clientes || [];
  if (clientes.length === 0) {
    console.log('   ⚠️  No hay clientes en el JSON');
    return;
  }
  
  const batch = db.batch();
  
  for (const cliente of clientes) {
    const clienteId = cliente.cliente.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const clienteRef = db.collection('clientes').doc(clienteId);
    
    batch.set(clienteRef, {
      id: clienteId,
      nombre: cliente.cliente,
      actual: cliente.actual,
      deuda: cliente.deuda,
      deudaTotal: cliente.deuda,
      abonos: cliente.abonos,
      totalPagado: cliente.abonos,
      pendiente: cliente.pendiente,
      totalVentas: cliente.deuda, // Aproximación
      observaciones: cliente.observaciones || '',
      estado: 'activo',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }
  
  await batch.commit();
  console.log(`   ✅ ${clientes.length} clientes migrados con saldos`);
}

// ============================================================================
// MIGRACIÓN DE MOVIMIENTOS BANCARIOS
// ============================================================================

async function migrarMovimientosBancarios(data: DataJSON) {
  console.log('\n📊 Migrando Movimientos Bancarios detallados...');
  
  const bancos = [
    { id: 'boveda_monte', data: data.bovedaMonte?.bovedaMonte },
    { id: 'boveda_usa', data: data.bovedaUSA?.bovedaUsa },
    { id: 'profit', data: data.profit?.profit },
    { id: 'leftie', data: data.leftie?.leftie },
    { id: 'azteca', data: data.azteca?.azteca },
    { id: 'flete_sur', data: data.fleteSur?.fleteSur },
  ];
  
  let totalMovimientos = 0;
  
  for (const banco of bancos) {
    if (!banco.data) continue;
    
    const ingresos = banco.data.ingresosList || [];
    const gastos = banco.data.gastosList || [];
    
    if (ingresos.length === 0 && gastos.length === 0) continue;
    
    let batchCount = 0;
    let currentBatch = db.batch();
    
    // Migrar ingresos
    for (const mov of ingresos) {
      const movRef = db.collection('movimientos').doc(generateId('MOV'));
      currentBatch.set(movRef, {
        tipoMovimiento: 'ingreso',
        tipo: 'ingreso',
        bancoId: banco.id,
        monto: mov.ingreso,
        concepto: mov.concepto || `Ingreso de ${mov.cliente}`,
        cliente: mov.cliente,
        tc: mov.tc || 1,
        dolares: mov.dolares || 0,
        destino: mov.destino || '',
        observaciones: mov.observaciones || '',
        fecha: parseDate(mov.fecha),
        origenDatos: 'migracion_json',
        createdAt: Timestamp.now(),
      });
      batchCount++;
      totalMovimientos++;
      
      if (batchCount >= 400) {
        await currentBatch.commit();
        currentBatch = db.batch();
        batchCount = 0;
      }
    }
    
    // Migrar gastos
    for (const mov of gastos) {
      const movRef = db.collection('movimientos').doc(generateId('MOV'));
      currentBatch.set(movRef, {
        tipoMovimiento: 'gasto',
        tipo: 'gasto',
        bancoId: banco.id,
        monto: mov.ingreso, // En gastos también se usa 'ingreso' como campo
        concepto: mov.concepto || `Gasto`,
        cliente: mov.cliente || '',
        fecha: parseDate(mov.fecha),
        origenDatos: 'migracion_json',
        createdAt: Timestamp.now(),
      });
      batchCount++;
      totalMovimientos++;
      
      if (batchCount >= 400) {
        await currentBatch.commit();
        currentBatch = db.batch();
        batchCount = 0;
      }
    }
    
    if (batchCount > 0) {
      await currentBatch.commit();
    }
    
    console.log(`   📈 ${banco.id}: ${ingresos.length} ingresos, ${gastos.length} gastos`);
  }
  
  console.log(`   ✅ ${totalMovimientos} movimientos bancarios migrados`);
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
  console.log('═'.repeat(60));
  console.log('🚀 MIGRACIÓN DESDE JSON - CHRONOS SYSTEM');
  console.log('═'.repeat(60));
  console.log(`📂 Archivo: ${JSON_PATH}`);
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-MX')}`);
  console.log('═'.repeat(60));
  
  // Verificar archivo JSON
  if (!fs.existsSync(JSON_PATH)) {
    console.error('❌ Error: No se encontró el archivo JSON');
    console.error(`   Ruta esperada: ${JSON_PATH}`);
    process.exit(1);
  }
  
  try {
    // Leer JSON
    console.log('\n📖 Leyendo archivo JSON...');
    const jsonContent = fs.readFileSync(JSON_PATH, 'utf-8');
    const data: DataJSON = JSON.parse(jsonContent);
    console.log(`   ✅ Versión: ${data.metadata?.version}`);
    console.log(`   ✅ Fecha datos: ${data.metadata?.fecha}`);
    
    // Ejecutar migraciones
    await migrarBancosConTotales(data);
    await migrarOrdenesCompra(data);
    await migrarVentas(data);
    await migrarClientes(data);
    await migrarMovimientosBancarios(data);
    
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 MIGRACIÓN DESDE JSON COMPLETADA');
    console.log('═'.repeat(60));
    console.log('\n💡 Los datos incluyen RF Actual de cada banco');
    console.log('   Ejecuta: pnpm dev para ver el dashboard\n');
    
  } catch (error) {
    console.error('\n❌ ERROR EN MIGRACIÓN:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
