/**
 * Firestore Web Migrator
 * Usa Firebase Web SDK en lugar de Admin SDK (no requiere service account)
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  writeBatch,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const firebaseConfig = {
  apiKey: "AIzaSyCR7zKZJAzCEq-jBbfkLJxWaz98zuRCkX4",
  authDomain: "premium-ecosystem-1760790572.firebaseapp.com",
  projectId: "premium-ecosystem-1760790572",
  storageBucket: "premium-ecosystem-1760790572.firebasestorage.app",
  messagingSenderId: "100411784487",
  appId: "1:100411784487:web:ac2713291717869bc83d02",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class FirestoreWebMigrator {
  private stats = {
    bancos: 0,
    ventas: 0,
    ordenes: 0,
    clientes: 0,
    distribuidores: 0,
    almacen: 0,
    errors: 0,
  };

  /**
   * Migrar bancos y sus subcolecciones
   */
  async migrateBancos(bancos: any[]) {
    console.log('\n💰 Migrando Bancos...');
    
    for (let i = 0; i < bancos.length; i++) {
      const banco = bancos[i];
      try {
        // Crear documento principal del banco
        const bancoRef = doc(db, 'bancos', banco.id);
        await setDoc(bancoRef, {
          id: banco.id,
          nombre: banco.nombre || banco.id,
          capital: banco.capital || 0,
          activo: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Migrar subcolecciones
        await this.migrateBankSubcollections(banco);
        
        this.stats.bancos++;
        const progress = ((i + 1) / bancos.length * 100).toFixed(1);
        console.log(`   📊 bancos: ${i + 1}/${bancos.length} (${progress}%)`);
      } catch (error) {
        console.error(`   ❌ Error migrando banco ${banco.id}:`, error);
        this.stats.errors++;
      }
    }
    
    console.log(`   ✅ ${this.stats.bancos} bancos migrados`);
  }

  /**
   * Migrar subcolecciones de un banco (ingresos, gastos, transferencias, cortes)
   */
  async migrateBankSubcollections(banco: any) {
    const subcollections = ['ingresos', 'gastos', 'transferencias', 'cortes'];
    
    for (const subcol of subcollections) {
      const items = banco[subcol] || [];
      if (items.length === 0) continue;

      // Batch writes (max 500 operations)
      let batch = writeBatch(db);
      let operationCount = 0;

      for (const item of items) {
        const itemRef = doc(collection(db, 'bancos', banco.id, subcol));
        batch.set(itemRef, {
          ...item,
          bancoId: banco.id,
          createdAt: item.fecha ? new Date(item.fecha) : Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        operationCount++;

        // Commit batch if reaching limit (450 to be safe)
        if (operationCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
        }
      }

      // Commit remaining operations
      if (operationCount > 0) {
        await batch.commit();
      }
    }
  }

  /**
   * Migrar ventas
   */
  async migrateVentas(ventas: any[]) {
    console.log('\n📦 Migrando Ventas...');

    let batch = writeBatch(db);
    let operationCount = 0;
    let migrated = 0;

    for (const venta of ventas) {
      try {
        const ventaRef = doc(collection(db, 'ventas'));
        batch.set(ventaRef, {
          ...venta,
          fecha: venta.fecha ? new Date(venta.fecha) : Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        operationCount++;
        migrated++;

        if (operationCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
          
          const progress = (migrated / ventas.length * 100).toFixed(1);
          console.log(`   📊 ventas: ${migrated}/${ventas.length} (${progress}%)`);
        }
      } catch (error) {
        console.error(`   ❌ Error migrando venta:`, error);
        this.stats.errors++;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    this.stats.ventas = migrated;
    console.log(`   ✅ ${this.stats.ventas} ventas migradas`);
  }

  /**
   * Migrar órdenes de compra
   */
  async migrateOrdenesCompra(ordenes: any[]) {
    console.log('\n🛒 Migrando Órdenes de Compra...');

    let batch = writeBatch(db);
    let operationCount = 0;
    let migrated = 0;

    for (const orden of ordenes) {
      try {
        const ordenRef = doc(collection(db, 'ordenesCompra'));
        batch.set(ordenRef, {
          ...orden,
          fechaOrden: orden.fechaOrden ? new Date(orden.fechaOrden) : Timestamp.now(),
          fechaEntrega: orden.fechaEntrega ? new Date(orden.fechaEntrega) : null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        operationCount++;
        migrated++;

        if (operationCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
        }
      } catch (error) {
        console.error(`   ❌ Error migrando orden:`, error);
        this.stats.errors++;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    this.stats.ordenes = migrated;
    console.log(`   ✅ ${this.stats.ordenes} órdenes migradas`);
  }

  /**
   * Migrar clientes
   */
  async migrateClientes(clientes: any[]) {
    console.log('\n👥 Migrando Clientes...');

    let batch = writeBatch(db);
    let operationCount = 0;
    let migrated = 0;

    for (const cliente of clientes) {
      try {
        const clienteRef = doc(db, 'clientes', cliente.nombre.replace(/\s+/g, '_'));
        batch.set(clienteRef, {
          ...cliente,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        operationCount++;
        migrated++;

        if (operationCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
        }
      } catch (error) {
        console.error(`   ❌ Error migrando cliente:`, error);
        this.stats.errors++;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    this.stats.clientes = migrated;
    console.log(`   ✅ ${this.stats.clientes} clientes migrados`);
  }

  /**
   * Migrar distribuidores
   */
  async migrateDistribuidores(distribuidores: any[]) {
    console.log('\n🚚 Migrando Distribuidores...');

    let batch = writeBatch(db);
    let operationCount = 0;
    let migrated = 0;

    for (const distribuidor of distribuidores) {
      try {
        const distRef = doc(db, 'distribuidores', distribuidor.nombre.replace(/\s+/g, '_'));
        batch.set(distRef, {
          ...distribuidor,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        operationCount++;
        migrated++;

        if (operationCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
        }
      } catch (error) {
        console.error(`   ❌ Error migrando distribuidor:`, error);
        this.stats.errors++;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    this.stats.distribuidores = migrated;
    console.log(`   ✅ ${this.stats.distribuidores} distribuidores migrados`);
  }

  /**
   * Migrar almacén
   */
  async migrateAlmacen(almacen: any[]) {
    console.log('\n📦 Migrando Almacén...');

    let batch = writeBatch(db);
    let operationCount = 0;
    let migrated = 0;

    for (const producto of almacen) {
      try {
        const prodRef = doc(collection(db, 'almacen'));
        batch.set(prodRef, {
          ...producto,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        operationCount++;
        migrated++;

        if (operationCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
        }
      } catch (error) {
        console.error(`   ❌ Error migrando producto:`, error);
        this.stats.errors++;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    this.stats.almacen = migrated;
    console.log(`   ✅ ${this.stats.almacen} productos migrados`);
  }

  /**
   * Migrar métricas financieras
   */
  async migrateMetrics(metrics: any) {
    console.log('\n📊 Migrando Métricas Financieras...');

    await setDoc(doc(db, 'metricas', 'financieras'), {
      ...metrics,
      updatedAt: Timestamp.now(),
    });

    console.log('   ✅ Métricas migradas');
  }

  /**
   * Ejecutar migración completa
   */
  async migrateAll(dataPath: string) {
    console.log('\n🚀 INICIANDO MIGRACIÓN A FIRESTORE (Web SDK)\n');
    console.log('='.repeat(60));

    try {
      const absolutePath = path.isAbsolute(dataPath) 
        ? dataPath 
        : path.join(process.cwd(), '..', dataPath);
      
      const rawData = fs.readFileSync(absolutePath, 'utf-8');
      const data = JSON.parse(rawData);

      const startTime = Date.now();

      await this.migrateBancos(data.bancos);
      await this.migrateVentas(data.ventas);
      await this.migrateOrdenesCompra(data.compras);
      await this.migrateClientes(data.clientes);
      await this.migrateDistribuidores(data.distribuidores);
      await this.migrateAlmacen(data.almacen);
      await this.migrateMetrics(data.metricas);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('\n' + '='.repeat(60));
      console.log('✅ MIGRACIÓN COMPLETADA\n');
      console.log(`⏱️  Tiempo total: ${duration}s`);
      console.log(`\n📊 Resumen:`);
      console.log(`   - Bancos: ${this.stats.bancos}`);
      console.log(`   - Ventas: ${this.stats.ventas}`);
      console.log(`   - Órdenes: ${this.stats.ordenes}`);
      console.log(`   - Clientes: ${this.stats.clientes}`);
      console.log(`   - Distribuidores: ${this.stats.distribuidores}`);
      console.log(`   - Almacén: ${this.stats.almacen}`);
      console.log(`   - Errores: ${this.stats.errors}`);
      console.log('='.repeat(60));
    } catch (error) {
      console.error('\n❌ Error durante la migración:', error);
      throw error;
    }
  }

  /**
   * Verificar migración contando documentos
   */
  async verify() {
    console.log('\n🔍 VERIFICANDO MIGRACIÓN\n');
    console.log('='.repeat(60));

    const collections = ['bancos', 'ventas', 'ordenesCompra', 'clientes', 'distribuidores', 'almacen'];
    
    for (const collName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collName));
        console.log(`   ${collName}: ${snapshot.size} documentos`);
      } catch (error) {
        console.error(`   ❌ Error verificando ${collName}:`, error);
      }
    }

    console.log('='.repeat(60));
  }
}

// Ejecutar script
if (require.main === module) {
  const dataPath = path.join(process.cwd(), '..', 'BASE_DATOS_CLEANED.json');

  (async () => {
    try {
      const migrator = new FirestoreWebMigrator();
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

export default FirestoreWebMigrator;
