/**
 * Migración a Firestore usando Firebase Web SDK
 * No requiere service account - usa credenciales web públicas
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  writeBatch,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Configuración Firebase Web
const firebaseConfig = {
  apiKey: "AIzaSyCR7zKZJAzCEq-jBbfkLJxWaz98zuRCkX4",
  authDomain: "premium-ecosystem-1760790572.firebaseapp.com",
  projectId: "premium-ecosystem-1760790572",
  storageBucket: "premium-ecosystem-1760790572.firebasestorage.app",
  messagingSenderId: "100411784487",
  appId: "1:100411784487:web:ac2713291717869bc83d02",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface MigrationStats {
  total: number;
  success: number;
  errors: number;
}

class WebFirestoreMigrator {
  private stats: Record<string, MigrationStats> = {};

  /**
   * Sanitizar ID para Firestore (remover caracteres inválidos)
   */
  private sanitizeId(id: string): string {
    return id
      .replace(/\//g, '-')  // Reemplazar / con -
      .replace(/\\/g, '-')  // Reemplazar \ con -
      .replace(/\[/g, '(')  // Reemplazar [ con (
      .replace(/\]/g, ')')  // Reemplazar ] con )
      .trim();
  }

  /**
   * Migrar colección con batches (máximo 500 operaciones por batch)
   */
  private async migrateCollection(
    collectionName: string,
    documents: any[],
    idField: string
  ): Promise<void> {
    console.log(`\n📦 Migrando ${collectionName}... (${documents.length} docs)`);
    
    this.stats[collectionName] = { total: documents.length, success: 0, errors: 0 };
    
    const BATCH_SIZE = 450; // Límite seguro (Firebase permite 500)
    let batch = writeBatch(db);
    let operationCount = 0;
    let batchCount = 0;

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      
      try {
        const docId = document[idField] || `doc_${i}`;
        const sanitizedId = this.sanitizeId(String(docId));
        const docRef = doc(collection(db, collectionName), sanitizedId);
        
        // Convertir fechas a Timestamp
        const docData = this.convertDates(document);
        
        batch.set(docRef, docData);
        operationCount++;
        
        // Commit batch si alcanzamos el límite o es el último documento
        if (operationCount === BATCH_SIZE || i === documents.length - 1) {
          batchCount++;
          await batch.commit();
          this.stats[collectionName].success += operationCount;
          
          console.log(`   ✅ Batch ${batchCount} committed (${operationCount} docs)`);
          
          // Reiniciar batch
          batch = writeBatch(db);
          operationCount = 0;
          
          // Pequeño delay para evitar rate limits
          if (i < documents.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // Progress bar
        const progress = ((i + 1) / documents.length * 100).toFixed(1);
        process.stdout.write(`\r   📊 Progreso: ${progress}% (${i + 1}/${documents.length})`);
        
      } catch (error) {
        this.stats[collectionName].errors++;
        console.error(`\n   ❌ Error en documento ${i}:`, error);
      }
    }
    
    console.log(`\n   ✅ ${collectionName} migrado: ${this.stats[collectionName].success}/${this.stats[collectionName].total}`);
  }

  /**
   * Migrar subcolección de un banco
   */
  private async migrateSubcollection(
    bancoId: string,
    subcollectionName: string,
    documents: any[]
  ): Promise<void> {
    if (!documents || documents.length === 0) {
      console.log(`   ⏭️  ${subcollectionName}: sin datos`);
      return;
    }

    console.log(`   📦 ${subcollectionName}: ${documents.length} docs`);
    
    const BATCH_SIZE = 450;
    let batch = writeBatch(db);
    let operationCount = 0;
    let successCount = 0;

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      
      try {
        const docId = document.id || `${subcollectionName}_${i}`;
        const docRef = doc(
          collection(db, 'bancos', bancoId, subcollectionName),
          String(docId)
        );
        
        const docData = this.convertDates(document);
        batch.set(docRef, docData);
        operationCount++;
        
        if (operationCount === BATCH_SIZE || i === documents.length - 1) {
          await batch.commit();
          successCount += operationCount;
          batch = writeBatch(db);
          operationCount = 0;
          
          if (i < documents.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      } catch (error) {
        console.error(`\n   ❌ Error en ${subcollectionName}[${i}]:`, error);
      }
    }
    
    console.log(`   ✅ ${subcollectionName}: ${successCount}/${documents.length} migrados`);
  }

  /**
   * Convertir fechas string a Timestamp
   */
  private convertDates(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result: any = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      const value = obj[key];
      
      // Detectar campos de fecha
      if (typeof value === 'string' && (
        key.includes('fecha') || 
        key.includes('Fecha') ||
        key.includes('date') ||
        key.includes('Date') ||
        key === 'createdAt' ||
        key === 'updatedAt'
      )) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            result[key] = Timestamp.fromDate(date);
            continue;
          }
        } catch (e) {
          // Si falla, mantener valor original
        }
      }
      
      // Recursión para objetos anidados
      if (value && typeof value === 'object') {
        result[key] = this.convertDates(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Migrar bancos con todas sus subcolecciones
   */
  async migrateBancos(bancosObj: Record<string, any>): Promise<void> {
    console.log('\n💰 MIGRANDO BANCOS');
    console.log('='.repeat(60));
    
    const bancos = Object.entries(bancosObj);
    
    for (const [bancoId, banco] of bancos) {
      console.log(`\n🏦 Banco: ${bancoId}`);
      
      try {
        // Migrar documento principal del banco
        const bancoRef = doc(collection(db, 'bancos'), bancoId);
        await writeBatch(db).set(bancoRef, {
          nombre: banco.nombre || bancoId,
          capital: banco.capitalActual || banco.capital || 0,
          updatedAt: Timestamp.now(),
        }).commit();
        
        console.log(`   ✅ Documento principal creado`);
        
        // Migrar subcolecciones
        if (banco.ingresos) await this.migrateSubcollection(bancoId, 'ingresos', banco.ingresos);
        if (banco.gastos) await this.migrateSubcollection(bancoId, 'gastos', banco.gastos);
        if (banco.transferencias) await this.migrateSubcollection(bancoId, 'transferencias', banco.transferencias);
        if (banco.cortes) await this.migrateSubcollection(bancoId, 'cortes', banco.cortes);
        
      } catch (error) {
        console.error(`   ❌ Error migrando banco ${bancoId}:`, error);
      }
    }
  }

  /**
   * Ejecutar migración completa
   */
  async migrateAll(dataPath: string): Promise<void> {
    console.log('\n🚀 INICIANDO MIGRACIÓN WEB A FIRESTORE\n');
    console.log('='.repeat(60));
    console.log('Usando: Firebase Web SDK (sin service account)\n');

    try {
      // Cargar datos limpios
      const absolutePath = path.isAbsolute(dataPath) 
        ? dataPath 
        : path.join(process.cwd(), '..', dataPath);
      
      const rawData = fs.readFileSync(absolutePath, 'utf-8');
      const data = JSON.parse(rawData);

      const startTime = Date.now();

      // Migrar bancos primero (con subcolecciones)
      if (data.bancos) {
        await this.migrateBancos(data.bancos);
      }

      // Migrar colecciones principales
      if (data.ventas) {
        await this.migrateCollection('ventas', data.ventas, 'id');
      }
      
      if (data.compras) {
        await this.migrateCollection('ordenesCompra', data.compras, 'id');
      }
      
      if (data.clientes) {
        await this.migrateCollection('clientes', data.clientes, 'nombre');
      }
      
      if (data.distribuidores) {
        await this.migrateCollection('distribuidores', data.distribuidores, 'nombre');
      }
      
      if (data.almacen && data.almacen.length > 0) {
        await this.migrateCollection('productos', data.almacen, 'id');
      } else {
        console.log('\n⏭️  Almacén/Productos: sin datos en archivo limpio');
      }

      // Migrar métricas financieras
      if (data.metricas) {
        const metricasRef = doc(collection(db, 'metricas'), 'financieras');
        await writeBatch(db).set(metricasRef, {
          ...data.metricas,
          updatedAt: Timestamp.now(),
        }).commit();
        console.log('\n✅ Métricas financieras migradas');
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log('\n' + '='.repeat(60));
      console.log('✨ MIGRACIÓN COMPLETADA');
      console.log('='.repeat(60));
      console.log(`⏱️  Tiempo total: ${duration}s`);
      console.log('\n📊 Resumen por colección:');
      
      for (const [collection, stats] of Object.entries(this.stats)) {
        const successRate = ((stats.success / stats.total) * 100).toFixed(1);
        console.log(`   ${collection}: ${stats.success}/${stats.total} (${successRate}%) - Errores: ${stats.errors}`);
      }
      
    } catch (error) {
      console.error('\n❌ Error durante la migración:', error);
      throw error;
    }
  }

  /**
   * Verificar migración contando documentos
   */
  async verify(): Promise<void> {
    console.log('\n🔍 VERIFICANDO MIGRACIÓN\n');
    console.log('='.repeat(60));

    const collections = ['bancos', 'ventas', 'ordenesCompra', 'clientes', 'distribuidores', 'productos'];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        console.log(`✅ ${collectionName}: ${snapshot.size} documentos`);
      } catch (error) {
        console.error(`❌ Error verificando ${collectionName}:`, error);
      }
    }
  }
}

// Ejecutar script
if (require.main === module) {
  const dataPath = path.join(process.cwd(), '..', 'BASE_DATOS_CLEANED.json');

  (async () => {
    try {
      const migrator = new WebFirestoreMigrator();
      await migrator.migrateAll(dataPath);
      await migrator.verify();

      console.log('\n✨ PROCESO COMPLETADO EXITOSAMENTE\n');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    }
  })();
}

export default WebFirestoreMigrator;
