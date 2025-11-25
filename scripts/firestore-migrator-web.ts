/**
 * Firestore Web Migrator
 * Usa Firebase Web SDK en lugar de Admin SDK (no requiere service account)
 * 
 * ⚠️ IMPORTANTE: Configura las variables de entorno antes de ejecutar:
 * - FIREBASE_API_KEY
 * - FIREBASE_AUTH_DOMAIN
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_STORAGE_BUCKET
 * - FIREBASE_MESSAGING_SENDER_ID
 * - FIREBASE_APP_ID
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
import 'dotenv/config';

// ═══════════════════════════════════════════════════════════════════════════
// LOGGER CENTRALIZADO (Reemplaza console.log/error)
// ═══════════════════════════════════════════════════════════════════════════

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const logger = {
  formatMessage(level: LogLevel, message: string): string {
    return `[${new Date().toISOString()}] [${level.toUpperCase()}] [Migrator] ${message}`;
  },
  
  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message), data ?? '');
    }
  },
  
  info(message: string, data?: unknown): void {
    console.info(this.formatMessage('info', message), data ?? '');
  },
  
  warn(message: string, data?: unknown): void {
    console.warn(this.formatMessage('warn', message), data ?? '');
  },
  
  error(message: string, error?: unknown): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error;
    console.error(this.formatMessage('error', message), errorData ?? '');
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN SEGURA DE FIREBASE (Variables de Entorno)
// ═══════════════════════════════════════════════════════════════════════════

const getFirebaseConfig = () => {
  const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN', 
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ];

  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    logger.error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
    logger.info('Crea un archivo .env con las siguientes variables:');
    requiredEnvVars.forEach(v => logger.info(`  ${v}=tu_valor_aqui`));
    throw new Error('Configuración de Firebase incompleta. Ver variables requeridas arriba.');
  }

  return {
    apiKey: process.env.FIREBASE_API_KEY!,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.FIREBASE_PROJECT_ID!,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.FIREBASE_APP_ID!,
  };
};

// Initialize Firebase con configuración segura
const firebaseConfig = getFirebaseConfig();
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
    logger.info('💰 Migrando Bancos...');
    
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
        logger.info(`📊 bancos: ${i + 1}/${bancos.length} (${progress}%)`);
      } catch (error) {
        logger.error(`Error migrando banco ${banco.id}`, error);
        this.stats.errors++;
      }
    }
    
    logger.info(`✅ ${this.stats.bancos} bancos migrados`);
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
    logger.info('📦 Migrando Ventas...');

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
          logger.info(`📊 ventas: ${migrated}/${ventas.length} (${progress}%)`);
        }
      } catch (error) {
        logger.error('Error migrando venta', error);
        this.stats.errors++;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    this.stats.ventas = migrated;
    logger.info(`✅ ${this.stats.ventas} ventas migradas`);
  }

  /**
   * Migrar órdenes de compra
   */
  async migrateOrdenesCompra(ordenes: any[]) {
    logger.info('🛒 Migrando Órdenes de Compra...');

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
        logger.error('Error migrando orden', error);
        this.stats.errors++;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    this.stats.ordenes = migrated;
    logger.info(`✅ ${this.stats.ordenes} órdenes migradas`);
  }

  /**
   * Migrar clientes
   */
  async migrateClientes(clientes: any[]) {
    logger.info('👥 Migrando Clientes...');

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
        logger.error('Error migrando cliente', error);
        this.stats.errors++;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    this.stats.clientes = migrated;
    logger.info(`✅ ${this.stats.clientes} clientes migrados`);
  }

  /**
   * Migrar distribuidores
   */
  async migrateDistribuidores(distribuidores: any[]) {
    logger.info('🚚 Migrando Distribuidores...');

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
        logger.error('Error migrando distribuidor', error);
        this.stats.errors++;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    this.stats.distribuidores = migrated;
    logger.info(`✅ ${this.stats.distribuidores} distribuidores migrados`);
  }

  /**
   * Migrar almacén
   */
  async migrateAlmacen(almacen: any[]) {
    logger.info('📦 Migrando Almacén...');

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
        logger.error('Error migrando producto', error);
        this.stats.errors++;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    this.stats.almacen = migrated;
    logger.info(`✅ ${this.stats.almacen} productos migrados`);
  }

  /**
   * Migrar métricas financieras
   */
  async migrateMetrics(metrics: any) {
    logger.info('📊 Migrando Métricas Financieras...');

    await setDoc(doc(db, 'metricas', 'financieras'), {
      ...metrics,
      updatedAt: Timestamp.now(),
    });

    logger.info('✅ Métricas migradas');
  }

  /**
   * Ejecutar migración completa
   */
  async migrateAll(dataPath: string) {
    logger.info('🚀 INICIANDO MIGRACIÓN A FIRESTORE (Web SDK)');
    logger.info('='.repeat(60));

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

      logger.info('='.repeat(60));
      logger.info('✅ MIGRACIÓN COMPLETADA');
      logger.info(`⏱️  Tiempo total: ${duration}s`);
      logger.info('📊 Resumen:', {
        bancos: this.stats.bancos,
        ventas: this.stats.ventas,
        ordenes: this.stats.ordenes,
        clientes: this.stats.clientes,
        distribuidores: this.stats.distribuidores,
        almacen: this.stats.almacen,
        errores: this.stats.errors,
      });
      logger.info('='.repeat(60));
    } catch (error) {
      logger.error('Error durante la migración', error);
      throw error;
    }
  }

  /**
   * Verificar migración contando documentos
   */
  async verify() {
    logger.info('🔍 VERIFICANDO MIGRACIÓN');
    logger.info('='.repeat(60));

    const collections = ['bancos', 'ventas', 'ordenesCompra', 'clientes', 'distribuidores', 'almacen'];
    
    for (const collName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collName));
        logger.info(`${collName}: ${snapshot.size} documentos`);
      } catch (error) {
        logger.error(`Error verificando ${collName}`, error);
      }
    }

    logger.info('='.repeat(60));
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

      logger.info('✨ PROCESO COMPLETADO EXITOSAMENTE');
      process.exit(0);
    } catch (error) {
      logger.error('Error fatal', error);
      process.exit(1);
    }
  })();
}

export default FirestoreWebMigrator;
