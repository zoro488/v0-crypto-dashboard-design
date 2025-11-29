/**
 * 🚀 SCRIPT DE MIGRACIÓN USANDO FIREBASE CLIENT SDK
 * 
 * Este script migra datos desde BASE_DATOS_FLOWDISTRIBUTOR_UNIFICADO.json
 * usando el SDK cliente de Firebase (no requiere service account)
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  writeBatch,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// ============================================================================
// CONFIGURACIÓN FIREBASE CLIENT
// ============================================================================

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('🔧 Configuración Firebase:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================================
// CARGAR JSON
// ============================================================================

const JSON_PATH = path.join(__dirname, '../gg/BASE_DATOS_FLOWDISTRIBUTOR_UNIFICADO.json');

// ============================================================================
// INTERFACES - Estructura real del JSON
// ============================================================================

interface BancoInnerData {
  rfActual: number;
  ingresos?: number;
  gastos?: number;
  rfCortes?: number;
  ingresosList?: Array<{
    fecha: string;
    cliente: string;
    ingreso: number;
    concepto?: string;
  }>;
  gastosList?: Array<{
    fecha: string;
    concepto: string;
    gasto: number;
  }>;
}

interface ClienteItem {
  cliente: string;
  actual: number;
  deuda: number;
  abonos: number;
  pendiente: number;
  observaciones?: string;
}

interface VentaLocal {
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
  concepto?: string;
}

interface OrdenCompraItem {
  id: string;
  fecha: string;
  origen: string;
  cantidad: number;
  costoDistribuidor: number;
  costoTransporte: number;
  costoPorUnidad: number;
  costoTotal: number;
  pagoDistribuidor: number;
  deuda: number;
}

interface DistribuidorItem {
  nombre: string;
  costoTotal: number;
  abonos: number;
  pendiente: number;
}

interface JSONData {
  metadata?: { version: string; fecha: string; descripcion: string };
  // Bancos con estructura anidada
  profit?: { profit: BancoInnerData };
  leftie?: { leftie: BancoInnerData };
  azteca?: { azteca: BancoInnerData };
  bovedaMonte?: { bovedaMonte: BancoInnerData };
  bovedaUSA?: { bovedaUsa: BancoInnerData };
  fleteSur?: { fleteSur: BancoInnerData };
  // Clientes
  clientes?: { clientes: ClienteItem[] };
  // Ventas locales
  ventasLocales?: { ventasLocal: VentaLocal[] };
  // Ordenes de compra
  ordenesCompra?: {
    distribuidores: {
      ordenesCompra: OrdenCompraItem[];
      distribuidores: DistribuidorItem[];
    };
  };
  // Gastos y abonos
  gastosAbonos?: {
    gastosAbonos: Array<{
      fecha: string;
      concepto: string;
      valor: number;
      destino: string;
    }>;
  };
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

function parseFecha(fechaStr: string): Date {
  if (!fechaStr) return new Date();
  
  const parts = fechaStr.includes('/') 
    ? fechaStr.split('/') 
    : fechaStr.split('-');
  
  if (parts.length === 3) {
    const [a, b, c] = parts.map(p => parseInt(p, 10));
    if (a > 31) {
      return new Date(a, b - 1, c);
    }
    return new Date(c, b - 1, a);
  }
  
  return new Date(fechaStr);
}

function generarId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Función helper para obtener datos internos del banco
function getBancoInnerData(data: JSONData, key: string): BancoInnerData | null {
  const mapping: Record<string, () => BancoInnerData | undefined> = {
    'bovedaMonte': () => data.bovedaMonte?.bovedaMonte,
    'bovedaUSA': () => data.bovedaUSA?.bovedaUsa,
    'profit': () => data.profit?.profit,
    'leftie': () => data.leftie?.leftie,
    'azteca': () => data.azteca?.azteca,
    'fleteSur': () => data.fleteSur?.fleteSur,
  };
  
  const getter = mapping[key];
  return getter ? getter() || null : null;
}

// ============================================================================
// MIGRACIONES
// ============================================================================

async function migrarBancos(data: JSONData): Promise<void> {
  console.log('\n📊 Migrando bancos...');
  
  const bancos = [
    { id: 'boveda_monte', key: 'bovedaMonte', nombre: 'Bóveda Monte' },
    { id: 'boveda_usa', key: 'bovedaUSA', nombre: 'Bóveda USA' },
    { id: 'profit', key: 'profit', nombre: 'Profit' },
    { id: 'leftie', key: 'leftie', nombre: 'Leftie' },
    { id: 'azteca', key: 'azteca', nombre: 'Azteca' },
    { id: 'flete_sur', key: 'fleteSur', nombre: 'Flete Sur' },
    { id: 'utilidades', key: 'utilidades', nombre: 'Utilidades' }
  ];
  
  for (const banco of bancos) {
    const bancoData = getBancoInnerData(data, banco.key);
    const rfActual = bancoData?.rfActual || 0;
    
    let historicoIngresos = bancoData?.ingresos || 0;
    let historicoGastos = bancoData?.gastos || 0;
    
    // Si no hay totales, calcular desde listas
    if (!historicoIngresos && bancoData?.ingresosList) {
      historicoIngresos = bancoData.ingresosList.reduce((sum, i) => sum + (i.ingreso || 0), 0);
    }
    if (!historicoGastos && bancoData?.gastosList) {
      historicoGastos = bancoData.gastosList.reduce((sum, g) => sum + (g.gasto || 0), 0);
    }
    
    const docRef = doc(db, 'bancos', banco.id);
    await setDoc(docRef, {
      id: banco.id,
      nombre: banco.nombre,
      capitalActual: rfActual,
      historicoIngresos,
      historicoGastos,
      rfActual,
      rfCortes: bancoData?.rfCortes || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`  ✅ ${banco.nombre}: $${rfActual.toLocaleString()}`);
  }
}

async function migrarMovimientos(data: JSONData): Promise<void> {
  console.log('\n💸 Migrando movimientos bancarios...');
  
  const bancosKeys = [
    { id: 'boveda_monte', key: 'bovedaMonte' },
    { id: 'boveda_usa', key: 'bovedaUSA' },
    { id: 'profit', key: 'profit' },
    { id: 'leftie', key: 'leftie' },
    { id: 'azteca', key: 'azteca' },
    { id: 'flete_sur', key: 'fleteSur' }
  ];
  
  let totalMovimientos = 0;
  
  for (const banco of bancosKeys) {
    const bancoData = getBancoInnerData(data, banco.key);
    
    if (bancoData?.ingresosList && bancoData.ingresosList.length > 0) {
      let batch = writeBatch(db);
      let batchCount = 0;
      
      for (const ingreso of bancoData.ingresosList) {
        const movId = generarId();
        const movRef = doc(db, 'movimientos', movId);
        
        batch.set(movRef, {
          id: movId,
          bancoId: banco.id,
          tipoMovimiento: 'ingreso',
          monto: ingreso.ingreso || 0,
          concepto: ingreso.concepto || `Ingreso de ${ingreso.cliente}`,
          cliente: ingreso.cliente || '',
          fecha: Timestamp.fromDate(parseFecha(ingreso.fecha)),
          createdAt: serverTimestamp()
        });
        
        batchCount++;
        totalMovimientos++;
        
        if (batchCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
      
      if (batchCount > 0) {
        await batch.commit();
      }
      
      console.log(`  📥 ${banco.id}: ${bancoData.ingresosList.length} ingresos`);
    }
    
    if (bancoData?.gastosList && bancoData.gastosList.length > 0) {
      let batch = writeBatch(db);
      let batchCount = 0;
      
      for (const gasto of bancoData.gastosList) {
        const movId = generarId();
        const movRef = doc(db, 'movimientos', movId);
        
        batch.set(movRef, {
          id: movId,
          bancoId: banco.id,
          tipoMovimiento: 'gasto',
          monto: gasto.gasto || 0,
          concepto: gasto.concepto || 'Gasto',
          fecha: Timestamp.fromDate(parseFecha(gasto.fecha)),
          createdAt: serverTimestamp()
        });
        
        batchCount++;
        totalMovimientos++;
        
        if (batchCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
      
      if (batchCount > 0) {
        await batch.commit();
      }
      
      console.log(`  📤 ${banco.id}: ${bancoData.gastosList.length} gastos`);
    }
  }
  
  console.log(`  📊 Total movimientos: ${totalMovimientos}`);
}

async function migrarClientes(data: JSONData): Promise<void> {
  console.log('\n👥 Migrando clientes...');
  
  const clientesList = data.clientes?.clientes;
  
  if (!clientesList || clientesList.length === 0) {
    console.log('  ⚠️  No hay datos de clientes');
    return;
  }
  
  let batch = writeBatch(db);
  let count = 0;
  
  for (const cliente of clientesList) {
    const clienteId = generarId();
    const clienteRef = doc(db, 'clientes', clienteId);
    
    batch.set(clienteRef, {
      id: clienteId,
      nombre: cliente.cliente,
      saldoActual: cliente.actual || 0,
      deuda: cliente.deuda || 0,
      abonos: cliente.abonos || 0,
      pendiente: cliente.pendiente || 0,
      observaciones: cliente.observaciones || '',
      activo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    count++;
    
    if (count >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
  }
  
  console.log(`  ✅ ${clientesList.length} clientes migrados`);
}

async function migrarVentas(data: JSONData): Promise<void> {
  console.log('\n🛒 Migrando ventas...');
  
  const ventasList = data.ventasLocales?.ventasLocal;
  
  if (!ventasList || ventasList.length === 0) {
    console.log('  ⚠️  No hay datos de ventas');
    return;
  }
  
  let batch = writeBatch(db);
  let count = 0;
  
  for (const venta of ventasList) {
    const ventaId = generarId();
    const ventaRef = doc(db, 'ventas', ventaId);
    
    // Calcular distribución GYA
    const ingreso = venta.ingreso || 0;
    const costo = venta.bovedaMonte || 0;
    const flete = venta.fleteUtilidad || 0;
    const utilidad = venta.utilidad || 0;
    
    // Mapear estado
    let estado = 'pendiente';
    if (venta.estatus === 'Pagado') estado = 'pagado';
    else if (venta.estatus === 'Parcial') estado = 'parcial';
    
    batch.set(ventaRef, {
      id: ventaId,
      fecha: Timestamp.fromDate(parseFecha(venta.fecha)),
      cliente: venta.cliente || 'Sin nombre',
      producto: 'Producto',
      cantidad: venta.cantidad || 1,
      precioUnitario: venta.precioVenta || 0,
      precioTotal: ingreso,
      estado,
      ocRelacionada: venta.ocRelacionada || '',
      concepto: venta.concepto || '',
      // Distribución GYA
      distribucion: {
        bovedaMonte: costo,
        fleteSur: flete,
        utilidades: utilidad
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    count++;
    
    if (count >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
  }
  
  console.log(`  ✅ ${ventasList.length} ventas migradas`);
}

async function migrarOrdenesCompra(data: JSONData): Promise<void> {
  console.log('\n📦 Migrando órdenes de compra...');
  
  const ordenesList = data.ordenesCompra?.distribuidores?.ordenesCompra;
  
  if (!ordenesList || ordenesList.length === 0) {
    console.log('  ⚠️  No hay datos de órdenes de compra');
    return;
  }
  
  let batch = writeBatch(db);
  let count = 0;
  
  for (const orden of ordenesList) {
    const ordenRef = doc(db, 'ordenes_compra', orden.id);
    
    batch.set(ordenRef, {
      id: orden.id,
      fecha: Timestamp.fromDate(parseFecha(orden.fecha)),
      distribuidor: orden.origen || 'Sin distribuidor',
      cantidad: orden.cantidad || 1,
      costoDistribuidor: orden.costoDistribuidor || 0,
      costoTransporte: orden.costoTransporte || 0,
      costoPorUnidad: orden.costoPorUnidad || 0,
      costoTotal: orden.costoTotal || 0,
      pagoDistribuidor: orden.pagoDistribuidor || 0,
      deuda: orden.deuda || 0,
      estado: orden.deuda > 0 ? 'pendiente' : 'completada',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    count++;
    
    if (count >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
  }
  
  console.log(`  ✅ ${ordenesList.length} órdenes de compra migradas`);
}

async function migrarDistribuidores(data: JSONData): Promise<void> {
  console.log('\n🚚 Migrando distribuidores...');
  
  const distribuidoresList = data.ordenesCompra?.distribuidores?.distribuidores;
  
  if (!distribuidoresList || distribuidoresList.length === 0) {
    console.log('  ⚠️  No hay datos de distribuidores');
    return;
  }
  
  let batch = writeBatch(db);
  let count = 0;
  
  for (const dist of distribuidoresList) {
    const distId = generarId();
    const distRef = doc(db, 'distribuidores', distId);
    
    batch.set(distRef, {
      id: distId,
      nombre: dist.nombre,
      costoTotal: dist.costoTotal || 0,
      abonos: dist.abonos || 0,
      pendiente: dist.pendiente || 0,
      activo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    count++;
  }
  
  if (count > 0) {
    await batch.commit();
  }
  
  console.log(`  ✅ ${distribuidoresList.length} distribuidores migrados`);
}

async function migrarGastosAbonos(data: JSONData): Promise<void> {
  console.log('\n💰 Migrando gastos y abonos...');
  
  const gastosList = data.gastosAbonos?.gastosAbonos;
  
  if (!gastosList || gastosList.length === 0) {
    console.log('  ⚠️  No hay datos de gastos/abonos');
    return;
  }
  
  let batch = writeBatch(db);
  let count = 0;
  
  for (const gasto of gastosList) {
    const gastoId = generarId();
    const gastoRef = doc(db, 'gastos_abonos', gastoId);
    
    batch.set(gastoRef, {
      id: gastoId,
      fecha: Timestamp.fromDate(parseFecha(gasto.fecha)),
      concepto: gasto.concepto || '',
      valor: gasto.valor || 0,
      destino: gasto.destino || '',
      createdAt: serverTimestamp()
    });
    
    count++;
    
    if (count >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
  }
  
  console.log(`  ✅ ${gastosList.length} gastos/abonos migrados`);
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   🚀 CHRONOS - MIGRACIÓN TOTAL DE DATOS v2.0');
  console.log('   Usando Firebase Client SDK');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Verificar archivo JSON
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`❌ No se encontró: ${JSON_PATH}`);
    process.exit(1);
  }
  
  console.log(`📂 Cargando datos desde: ${JSON_PATH}`);
  
  const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
  const data: JSONData = JSON.parse(rawData);
  
  console.log('✅ Datos cargados correctamente');
  
  // Mostrar resumen de datos
  console.log('\n📋 Resumen de datos a migrar:');
  console.log(`   - Ventas: ${data.ventasLocales?.ventasLocal?.length || 0}`);
  console.log(`   - Clientes: ${data.clientes?.clientes?.length || 0}`);
  console.log(`   - Órdenes de compra: ${data.ordenesCompra?.distribuidores?.ordenesCompra?.length || 0}`);
  console.log(`   - Distribuidores: ${data.ordenesCompra?.distribuidores?.distribuidores?.length || 0}`);
  console.log(`   - Gastos/Abonos: ${data.gastosAbonos?.gastosAbonos?.length || 0}`);
  
  try {
    // Ejecutar migraciones
    await migrarBancos(data);
    await migrarMovimientos(data);
    await migrarClientes(data);
    await migrarVentas(data);
    await migrarOrdenesCompra(data);
    await migrarDistribuidores(data);
    await migrarGastosAbonos(data);
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('   ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Ejecutar
main();
