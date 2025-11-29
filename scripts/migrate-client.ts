/**
 * 🚀 SCRIPT DE MIGRACIÓN USANDO FIREBASE CLIENT SDK
 * 
 * Este script migra datos desde BASE_DATOS_FLOWDISTRIBUTOR_UNIFICADO.json
 * usando el SDK cliente de Firebase (no requiere service account)
 * 
 * @version 1.0.0
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

interface BancoInnerData {
  rfActual: number;
  ingresos?: number;
  gastos?: number;
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
  // Bancos con estructura anidada: { bovedaMonte: { bovedaMonte: {...} } }
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
  
  // Formatos: "DD/MM/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"
  const parts = fechaStr.includes('/') 
    ? fechaStr.split('/') 
    : fechaStr.split('-');
  
  if (parts.length === 3) {
    const [a, b, c] = parts.map(p => parseInt(p, 10));
    // Si el primer número es > 31, es YYYY-MM-DD
    if (a > 31) {
      return new Date(a, b - 1, c);
    }
    // Si no, es DD/MM/YYYY o DD-MM-YYYY
    return new Date(c, b - 1, a);
  }
  
  return new Date(fechaStr);
}

function generarId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// ============================================================================
// MIGRACIONES
// ============================================================================

async function migrarBancos(data: JSONData): Promise<void> {
  console.log('\n📊 Migrando bancos...');
  
  const bancos = [
    { id: 'boveda_monte', key: 'bovedaMonte', nombre: 'Bóveda Monte' },
    { id: 'boveda_usa', key: 'bovedaUsa', nombre: 'Bóveda USA' },
    { id: 'profit', key: 'profit', nombre: 'Profit' },
    { id: 'leftie', key: 'leftie', nombre: 'Leftie' },
    { id: 'azteca', key: 'azteca', nombre: 'Azteca' },
    { id: 'flete_sur', key: 'fleteSur', nombre: 'Flete Sur' },
    { id: 'utilidades', key: 'utilidades', nombre: 'Utilidades' }
  ];
  
  for (const banco of bancos) {
    const bancoData = data[banco.key as keyof JSONData] as BancoData | undefined;
    const rfActual = bancoData?.rfActual || 0;
    
    // Calcular históricos desde movimientos
    let historicoIngresos = 0;
    let historicoGastos = 0;
    
    if (bancoData?.ingresosList) {
      historicoIngresos = bancoData.ingresosList.reduce((sum, i) => sum + (i.ingreso || 0), 0);
    }
    if (bancoData?.gastosList) {
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
    { id: 'boveda_usa', key: 'bovedaUsa' },
    { id: 'profit', key: 'profit' },
    { id: 'leftie', key: 'leftie' },
    { id: 'azteca', key: 'azteca' },
    { id: 'flete_sur', key: 'fleteSur' },
    { id: 'utilidades', key: 'utilidades' }
  ];
  
  let totalMovimientos = 0;
  
  for (const banco of bancosKeys) {
    const bancoData = data[banco.key as keyof JSONData] as BancoData | undefined;
    
    // Migrar ingresos
    if (bancoData?.ingresosList) {
      let batch = writeBatch(db);
      let batchCount = 0;
      
      for (const ingreso of bancoData.ingresosList) {
        const movId = generarId();
        const movRef = doc(db, 'movimientos', movId);
        
        batch.set(movRef, {
          id: movId,
          bancoId: banco.id,
          tipo: 'ingreso',
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
    
    // Migrar gastos
    if (bancoData?.gastosList) {
      let batch = writeBatch(db);
      let batchCount = 0;
      
      for (const gasto of bancoData.gastosList) {
        const movId = generarId();
        const movRef = doc(db, 'movimientos', movId);
        
        batch.set(movRef, {
          id: movId,
          bancoId: banco.id,
          tipo: 'gasto',
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
  
  if (!data.clientes) {
    console.log('  ⚠️  No hay datos de clientes');
    return;
  }
  
  let batch = writeBatch(db);
  let count = 0;
  
  for (const [nombre, clienteData] of Object.entries(data.clientes)) {
    const clienteId = generarId();
    const clienteRef = doc(db, 'clientes', clienteId);
    
    batch.set(clienteRef, {
      id: clienteId,
      nombre: nombre,
      saldoFinal: clienteData.saldoFinal || 0,
      deuda: clienteData.deuda || clienteData.saldoFinal || 0,
      totalCompras: 0,
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
  
  console.log(`  ✅ ${Object.keys(data.clientes).length} clientes migrados`);
}

async function migrarVentas(data: JSONData): Promise<void> {
  console.log('\n🛒 Migrando ventas...');
  
  if (!data.ventas || data.ventas.length === 0) {
    console.log('  ⚠️  No hay datos de ventas');
    return;
  }
  
  let batch = writeBatch(db);
  let count = 0;
  
  for (const venta of data.ventas) {
    const ventaId = generarId();
    const ventaRef = doc(db, 'ventas', ventaId);
    
    // Calcular distribución GYA
    const ingreso = venta.ingreso || venta.total || 0;
    const costo = venta.costo || venta.bovedaMonte || 0;
    const flete = venta.flete || 0;
    const utilidad = venta.utilidad || (ingreso - costo - flete);
    
    batch.set(ventaRef, {
      id: ventaId,
      fecha: Timestamp.fromDate(parseFecha(venta.fecha)),
      cliente: venta.cliente || 'Sin nombre',
      producto: venta.producto || 'Producto',
      cantidad: venta.cantidad || 1,
      precioUnitario: venta.precioUnitario || ingreso,
      precioTotal: ingreso,
      estado: venta.estado || 'pagado',
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
  
  console.log(`  ✅ ${data.ventas.length} ventas migradas`);
}

async function migrarOrdenesCompra(data: JSONData): Promise<void> {
  console.log('\n📦 Migrando órdenes de compra...');
  
  if (!data.ordenesCompra || data.ordenesCompra.length === 0) {
    console.log('  ⚠️  No hay datos de órdenes de compra');
    return;
  }
  
  let batch = writeBatch(db);
  let count = 0;
  
  for (const orden of data.ordenesCompra) {
    const ordenId = generarId();
    const ordenRef = doc(db, 'ordenes_compra', ordenId);
    
    batch.set(ordenRef, {
      id: ordenId,
      fecha: Timestamp.fromDate(parseFecha(orden.fecha)),
      proveedor: orden.proveedor || 'Sin proveedor',
      producto: orden.producto || 'Producto',
      cantidad: orden.cantidad || 1,
      precioUnitario: orden.precioUnitario || 0,
      total: orden.total || 0,
      estado: orden.estado || 'completada',
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
  
  console.log(`  ✅ ${data.ordenesCompra.length} órdenes de compra migradas`);
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   🚀 CHRONOS - MIGRACIÓN TOTAL DE DATOS');
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
  
  try {
    // Ejecutar migraciones
    await migrarBancos(data);
    await migrarMovimientos(data);
    await migrarClientes(data);
    await migrarVentas(data);
    await migrarOrdenesCompra(data);
    
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
