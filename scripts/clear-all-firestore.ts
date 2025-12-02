/**
 * 🧹 SCRIPT: LIMPIAR TODAS LAS COLECCIONES DE FIRESTORE
 * 
 * Este script elimina TODOS los documentos de TODAS las colecciones.
 * Deja el sistema completamente vacío.
 * 
 * Uso: npx tsx scripts/clear-all-firestore.ts
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar con la configuración de producción
const projectId = 'premium-ecosystem-1760790572';

// Usar las credenciales predeterminadas de la aplicación
process.env.GCLOUD_PROJECT = projectId;
process.env.FIREBASE_PROJECT_ID = projectId;

initializeApp({
  projectId,
});

const db = getFirestore();

// Lista de todas las colecciones a limpiar
const COLECCIONES = [
  'bancos',
  'clientes',
  'distribuidores',
  'ordenes_compra',
  'ventas',
  'movimientos',
  'gastos_abonos',
  'almacen',
  'usuarios',
  'configuracion',
  'chat_history',
  'analytics',
];

async function clearCollection(collectionName: string): Promise<number> {
  console.log(`\n🗑️  Limpiando colección: ${collectionName}`);
  
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(`   ⚪ Colección vacía`);
    return 0;
  }

  const batch = db.batch();
  let count = 0;

  // Firestore batch limit es 500
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`   ✅ Eliminados ${count} documentos...`);
    }
  }

  // Commit final para documentos restantes
  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`   ✅ Total eliminados: ${count} documentos`);
  return count;
}

async function clearAllCollections() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     🧹 LIMPIEZA TOTAL DE FIRESTORE - CHRONOS SYSTEM       ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Proyecto: ${projectId}     ║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let totalDeleted = 0;

  for (const coleccion of COLECCIONES) {
    try {
      const deleted = await clearCollection(coleccion);
      totalDeleted += deleted;
    } catch (error) {
      console.error(`   ❌ Error en ${coleccion}:`, error);
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    ✅ LIMPIEZA COMPLETA                    ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Total documentos eliminados: ${String(totalDeleted).padStart(10)}              ║`);
  console.log(`║  Colecciones procesadas:      ${String(COLECCIONES.length).padStart(10)}              ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  console.log('\n🎉 Sistema CHRONOS completamente vacío y listo para uso.');
}

clearAllCollections().catch(console.error);
