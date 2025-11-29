/**
 * 🚀 MIGRACIÓN COMPLETA - TABLAS DETALLADAS POR BANCO
 * 
 * Migra:
 * - Ingresos por banco (boveda_monte_ingresos, profit_ingresos, etc.)
 * - Gastos por banco (boveda_monte_gastos, profit_gastos, etc.)
 * - RF Cortes por banco
 * - Transferencias entre bancos
 * 
 * @version 3.0.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  writeBatch,
  Timestamp,
  serverTimestamp,
  collection,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const JSON_PATH = path.join(__dirname, '../gg/BASE_DATOS_FLOWDISTRIBUTOR_UNIFICADO.json');

// ============================================================================
// UTILIDADES
// ============================================================================

function parseFecha(fechaStr: string): Date {
  if (!fechaStr) return new Date();
  
  // Manejar formatos: "DD/MM/YYYY", "D/M/YYYY", "YYYY-MM-DD"
  let parts: string[];
  if (fechaStr.includes('/')) {
    parts = fechaStr.split('/');
    const [d, m, y] = parts.map(p => parseInt(p, 10));
    return new Date(y, m - 1, d);
  } else if (fechaStr.includes('-')) {
    parts = fechaStr.split('-');
    const [y, m, d] = parts.map(p => parseInt(p, 10));
    return new Date(y, m - 1, d);
  }
  return new Date(fechaStr);
}

function generarId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// ============================================================================
// MIGRAR INGRESOS POR BANCO
// ============================================================================

async function migrarIngresosBanco(
  bancoId: string, 
  ingresosList: any[],
  bancoNombre: string
): Promise<number> {
  if (!ingresosList || ingresosList.length === 0) return 0;
  
  const collectionName = `${bancoId}_ingresos`;
  let batch = writeBatch(db);
  let count = 0;
  
  for (const ingreso of ingresosList) {
    const docId = generarId();
    const docRef = doc(db, collectionName, docId);
    
    batch.set(docRef, {
      id: docId,
      bancoId: bancoId,
      fecha: Timestamp.fromDate(parseFecha(ingreso.fecha)),
      cliente: ingreso.cliente || '',
      ingreso: ingreso.ingreso || 0,
      concepto: ingreso.concepto || '',
      observaciones: ingreso.observaciones || '',
      tc: ingreso.tc || 0,
      dolares: ingreso.dolares || ingreso.pesos || 0,
      destino: ingreso.destino || bancoNombre,
      createdAt: serverTimestamp()
    });
    
    count++;
    
    if (count % 400 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  
  if (count % 400 !== 0) {
    await batch.commit();
  }
  
  return count;
}

// ============================================================================
// MIGRAR GASTOS POR BANCO
// ============================================================================

async function migrarGastosBanco(
  bancoId: string, 
  gastosList: any[],
  bancoNombre: string
): Promise<{ gastos: number; transferencias: number }> {
  if (!gastosList || gastosList.length === 0) return { gastos: 0, transferencias: 0 };
  
  const collectionName = `${bancoId}_gastos`;
  let batch = writeBatch(db);
  let gastosCount = 0;
  let transferenciasCount = 0;
  
  for (const gasto of gastosList) {
    const docId = generarId();
    const destino = gasto.destino || '';
    
    // Detectar si es transferencia (destino es otro banco)
    const esBancoDestino = ['Profit', 'Leftie', 'Azteca', 'Bóveda Monte', 'Bóveda USA', 'Flete Sur'].some(
      b => destino.toLowerCase().includes(b.toLowerCase())
    );
    
    if (esBancoDestino && destino !== 'NA' && destino !== '') {
      // Es una transferencia
      const transRef = doc(db, 'transferencias', docId);
      batch.set(transRef, {
        id: docId,
        bancoOrigenId: bancoId,
        bancoDestinoNombre: destino,
        fecha: Timestamp.fromDate(parseFecha(gasto.fecha)),
        monto: gasto.gasto || 0,
        concepto: gasto.concepto || '',
        observaciones: gasto.observaciones || '',
        tc: gasto.tc || 0,
        pesos: gasto.pesos || 0,
        createdAt: serverTimestamp()
      });
      transferenciasCount++;
    } else {
      // Es un gasto normal
      const gastoRef = doc(db, collectionName, docId);
      batch.set(gastoRef, {
        id: docId,
        bancoId: bancoId,
        fecha: Timestamp.fromDate(parseFecha(gasto.fecha)),
        origen: gasto.origen || bancoNombre,
        gasto: gasto.gasto || 0,
        concepto: gasto.concepto || '',
        observaciones: gasto.observaciones || '',
        destino: destino,
        tc: gasto.tc || 0,
        pesos: gasto.pesos || 0,
        dolares: gasto.dolares || 0,
        createdAt: serverTimestamp()
      });
      gastosCount++;
    }
    
    if ((gastosCount + transferenciasCount) % 400 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  
  if ((gastosCount + transferenciasCount) % 400 !== 0) {
    await batch.commit();
  }
  
  return { gastos: gastosCount, transferencias: transferenciasCount };
}

// ============================================================================
// MIGRAR RF CORTES
// ============================================================================

async function migrarRfCortes(
  bancoId: string,
  rfCortes: any[]
): Promise<number> {
  if (!rfCortes || rfCortes.length === 0) return 0;
  
  const collectionName = `${bancoId}_cortes`;
  let batch = writeBatch(db);
  let count = 0;
  
  for (let i = 0; i < rfCortes.length; i++) {
    const corte = rfCortes[i];
    const docId = `corte_${i + 1}`;
    const docRef = doc(db, collectionName, docId);
    
    batch.set(docRef, {
      id: docId,
      bancoId: bancoId,
      numero: i + 1,
      fecha: Timestamp.fromDate(parseFecha(corte.fecha)),
      corte: corte.corte || 0,
      createdAt: serverTimestamp()
    });
    
    count++;
  }
  
  await batch.commit();
  return count;
}

// ============================================================================
// MIGRAR FLETE SUR (estructura especial)
// ============================================================================

async function migrarFleteSur(fleteSurData: any): Promise<void> {
  console.log('\n🚛 Migrando Flete Sur (estructura especial)...');
  
  const bancoId = 'flete_sur';
  
  // Flete Sur tiene 'ingresos' como array directamente
  if (fleteSurData.ingresos && Array.isArray(fleteSurData.ingresos)) {
    let batch = writeBatch(db);
    let count = 0;
    
    for (const ingreso of fleteSurData.ingresos) {
      const docId = generarId();
      const docRef = doc(db, 'flete_sur_ingresos', docId);
      
      batch.set(docRef, {
        id: docId,
        bancoId: bancoId,
        fecha: Timestamp.fromDate(parseFecha(ingreso.fecha)),
        cliente: ingreso.cliente || '',
        ingreso: ingreso.ingreso || 0,
        concepto: ingreso.concepto || '',
        createdAt: serverTimestamp()
      });
      
      count++;
      
      if (count % 400 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
    
    if (count % 400 !== 0) {
      await batch.commit();
    }
    
    console.log(`  📥 flete_sur_ingresos: ${count} registros`);
  }
  
  // Gastos de Flete Sur
  if (fleteSurData.gastos && Array.isArray(fleteSurData.gastos)) {
    let batch = writeBatch(db);
    let count = 0;
    
    for (const gasto of fleteSurData.gastos) {
      const docId = generarId();
      const docRef = doc(db, 'flete_sur_gastos', docId);
      
      batch.set(docRef, {
        id: docId,
        bancoId: bancoId,
        fecha: Timestamp.fromDate(parseFecha(gasto.fecha)),
        origen: gasto.origen || 'Flete Sur',
        gasto: gasto.gasto || 0,
        concepto: gasto.concepto || '',
        observaciones: gasto.observaciones || '',
        destino: gasto.destino || '',
        tc: gasto.tc || 0,
        pesos: gasto.pesos || 0,
        createdAt: serverTimestamp()
      });
      
      count++;
      
      if (count % 400 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
    
    if (count % 400 !== 0) {
      await batch.commit();
    }
    
    console.log(`  📤 flete_sur_gastos: ${count} registros`);
  }
  
  // RF Cortes de Flete Sur
  if (fleteSurData.rfCortes && Array.isArray(fleteSurData.rfCortes)) {
    const count = await migrarRfCortes('flete_sur', fleteSurData.rfCortes);
    console.log(`  📊 flete_sur_cortes: ${count} registros`);
  }
  
  // Calcular totales para el banco
  let totalIngresos = 0;
  let totalGastos = 0;
  
  if (fleteSurData.ingresos && Array.isArray(fleteSurData.ingresos)) {
    totalIngresos = fleteSurData.ingresos.reduce((sum: number, i: any) => sum + (i.ingreso || 0), 0);
  }
  if (fleteSurData.gastos && Array.isArray(fleteSurData.gastos)) {
    totalGastos = fleteSurData.gastos.reduce((sum: number, g: any) => sum + (g.gasto || 0), 0);
  }
  
  // Actualizar banco con totales
  const bancoRef = doc(db, 'bancos', bancoId);
  await setDoc(bancoRef, {
    id: bancoId,
    nombre: 'Flete Sur',
    capitalActual: totalIngresos - totalGastos,
    historicoIngresos: totalIngresos,
    historicoGastos: totalGastos,
    rfActual: totalIngresos - totalGastos,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  
  console.log(`  💰 Flete Sur RF: $${(totalIngresos - totalGastos).toLocaleString()}`);
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   🚀 CHRONOS - MIGRACIÓN COMPLETA v3.0');
  console.log('   Tablas detalladas por banco');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
  const data = JSON.parse(rawData);
  
  console.log('✅ Datos cargados\n');
  
  // Mapeo de bancos
  const bancos = [
    { id: 'boveda_monte', jsonKey: 'bovedaMonte', innerKey: 'bovedaMonte', nombre: 'Bóveda Monte' },
    { id: 'boveda_usa', jsonKey: 'bovedaUSA', innerKey: 'bovedaUsa', nombre: 'Bóveda USA' },
    { id: 'profit', jsonKey: 'profit', innerKey: 'profit', nombre: 'Profit' },
    { id: 'leftie', jsonKey: 'leftie', innerKey: 'leftie', nombre: 'Leftie' },
    { id: 'azteca', jsonKey: 'azteca', innerKey: 'azteca', nombre: 'Azteca' },
  ];
  
  let totalTransferencias = 0;
  
  try {
    // Procesar cada banco
    for (const banco of bancos) {
      const bancoData = data[banco.jsonKey]?.[banco.innerKey];
      
      if (!bancoData) {
        console.log(`⚠️  No hay datos para ${banco.nombre}`);
        continue;
      }
      
      console.log(`\n📊 Procesando ${banco.nombre}...`);
      
      // Migrar ingresos
      const ingresosCount = await migrarIngresosBanco(
        banco.id, 
        bancoData.ingresosList,
        banco.nombre
      );
      console.log(`  📥 ${banco.id}_ingresos: ${ingresosCount} registros`);
      
      // Migrar gastos y transferencias
      const { gastos, transferencias } = await migrarGastosBanco(
        banco.id,
        bancoData.gastosList,
        banco.nombre
      );
      console.log(`  📤 ${banco.id}_gastos: ${gastos} registros`);
      if (transferencias > 0) {
        console.log(`  🔄 Transferencias detectadas: ${transferencias}`);
        totalTransferencias += transferencias;
      }
      
      // Migrar RF Cortes
      if (bancoData.rfCortes && bancoData.rfCortes.length > 0) {
        const cortesCount = await migrarRfCortes(banco.id, bancoData.rfCortes);
        console.log(`  📈 ${banco.id}_cortes: ${cortesCount} registros`);
      }
      
      // Actualizar documento del banco con totales
      const bancoRef = doc(db, 'bancos', banco.id);
      await setDoc(bancoRef, {
        id: banco.id,
        nombre: banco.nombre,
        capitalActual: bancoData.rfActual || 0,
        historicoIngresos: bancoData.ingresos || 0,
        historicoGastos: bancoData.gastos || 0,
        rfActual: bancoData.rfActual || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`  💰 RF Actual: $${(bancoData.rfActual || 0).toLocaleString()}`);
    }
    
    // Procesar Flete Sur (estructura especial)
    if (data.fleteSur?.fleteSur) {
      await migrarFleteSur(data.fleteSur.fleteSur);
    }
    
    // Agregar banco Utilidades (si no existe en JSON)
    const utilidadesRef = doc(db, 'bancos', 'utilidades');
    await setDoc(utilidadesRef, {
      id: 'utilidades',
      nombre: 'Utilidades',
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      rfActual: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('   ✅ MIGRACIÓN COMPLETADA');
    console.log(`   📄 Total transferencias: ${totalTransferencias}`);
    console.log('═══════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
