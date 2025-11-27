/**
 * Firestore Migration Script
 * Migra datos limpios a Firestore con estructura optimizada
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Logger simple para scripts CLI (diferente del logger de la aplicación)
const scriptLogger = {
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.info(`ℹ️  ${message}`, ...args);
    }
  },
  success: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`✅ ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`⚠️  ${message}`, ...args);
    }
  },
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`❌ ${message}`, error || '');
    }
  },
  progress: (message: string) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(message);
    }
  },
};

interface MigrationProgress {
  collection: string;
  total: number;
  processed: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}

class FirestoreMigrator {
  private db: FirebaseFirestore.Firestore;
  private progress: Map<string, MigrationProgress> = new Map();

  constructor() {
    // Inicializar Firebase Admin
    if (getApps().length === 0) {
      initializeApp({
        projectId: 'premium-ecosystem-1760790572',
      });
    }
    this.db = getFirestore();
  }

  /**
   * Inicializar progreso de migración
   */
  private initProgress(collection: string, total: number) {
    this.progress.set(collection, {
      collection,
      total,
      processed: 0,
      errors: 0,
      startTime: new Date(),
    });
  }

  /**
   * Actualizar progreso
   */
  private updateProgress(collection: string, success: boolean = true) {
    const prog = this.progress.get(collection);
    if (prog) {
      prog.processed++;
      if (!success) prog.errors++;
      
      const percent = ((prog.processed / prog.total) * 100).toFixed(1);
      process.stdout.write(
        `\r   📊 ${collection}: ${prog.processed}/${prog.total} (${percent}%) - Errores: ${prog.errors}`
      );
    }
  }

  /**
   * Finalizar progreso
   */
  private finalizeProgress(collection: string) {
    const prog = this.progress.get(collection);
    if (prog) {
      prog.endTime = new Date();
      const duration = (prog.endTime.getTime() - prog.startTime.getTime()) / 1000;
      scriptLogger.success(`${collection}: Completado en ${duration.toFixed(2)}s`);
    }
  }

  /**
   * 1. Migrar Bancos (7 documentos + 28 subcolecciones)
   */
  async migrateBancos(bancos: any) {
    scriptLogger.progress('\n💰 Migrando Bancos...');
    const bankIds = Object.keys(bancos);
    this.initProgress('bancos', bankIds.length);

    const batch = this.db.batch();
    let operationCount = 0;

    for (const bankId of bankIds) {
      try {
        const bank = bancos[bankId];
        const bankRef = this.db.collection('bancos').doc(bankId);

        // Documento principal del banco
        batch.set(bankRef, {
          id: bankId,
          nombre: bank.nombre || bankId,
          tipo: bank.tipo || 'operativo',
          capitalInicial: bank.capitalInicial || 0,
          capitalActual: bank.capitalActual || 0,
          historicoIngresos: bank.historicoIngresos || 0,
          historicoGastos: bank.historicoGastos || 0,
          historicoTransferencias: bank.historicoTransferencias || 0,
          estado: bank.estado || 'activo',
          color: bank.color || '#667eea',
          icon: bank.icon || '🏦',
          descripcion: bank.descripcion || '',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        operationCount++;

        // Commit batch cada 450 operaciones (límite Firestore: 500)
        if (operationCount >= 450) {
          await batch.commit();
          operationCount = 0;
        }

        // Migrar subcolecciones (ingresos, gastos, transferencias, cortes)
        await this.migrateBankSubcollections(bankId, bank);

        this.updateProgress('bancos');
      } catch (error) {
        scriptLogger.error(`Error migrando banco ${bankId}`, error);
        this.updateProgress('bancos', false);
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    this.finalizeProgress('bancos');
  }

  /**
   * Migrar subcolecciones de bancos
   */
  private async migrateBankSubcollections(bankId: string, bank: any) {
    const collections = ['ingresos', 'gastos', 'transferencias', 'cortes'];
    
    for (const collName of collections) {
      const data = bank[collName] || [];
      if (data.length === 0) continue;

      const batch = this.db.batch();
      let count = 0;

      data.forEach((item: any) => {
        const docRef = this.db
          .collection('bancos')
          .doc(bankId)
          .collection(collName)
          .doc();

        batch.set(docRef, {
          ...item,
          createdAt: item.fecha ? Timestamp.fromDate(new Date(item.fecha)) : Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        count++;
      });

      if (count > 0) {
        await batch.commit();
      }
    }
  }

  /**
   * 2. Migrar Ventas
   */
  async migrateVentas(ventas: any[]) {
    scriptLogger.progress('\n💰 Migrando Ventas...');
    this.initProgress('ventas', ventas.length);

    const batchSize = 450;
    for (let i = 0; i < ventas.length; i += batchSize) {
      const batch = this.db.batch();
      const chunk = ventas.slice(i, i + batchSize);

      chunk.forEach(venta => {
        try {
          const docRef = this.db.collection('ventas').doc(venta.id || `VENTA-${Date.now()}`);
          
          batch.set(docRef, {
            ...venta,
            fecha: venta.fecha ? Timestamp.fromDate(new Date(venta.fecha)) : Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          this.updateProgress('ventas');
        } catch (error) {
          scriptLogger.error(`Error en venta ${venta.id}`, error);
          this.updateProgress('ventas', false);
        }
      });

      await batch.commit();
    }

    this.finalizeProgress('ventas');
  }

  /**
   * 3. Migrar Órdenes de Compra
   */
  async migrateOrdenesCompra(compras: any[]) {
    scriptLogger.progress('\n📦 Migrando Órdenes de Compra...');
    this.initProgress('ordenesCompra', compras.length);

    const batch = this.db.batch();

    compras.forEach(compra => {
      try {
        const docRef = this.db.collection('ordenesCompra').doc(compra.id || `OC-${Date.now()}`);
        
        batch.set(docRef, {
          ...compra,
          fecha: compra.fecha ? Timestamp.fromDate(new Date(compra.fecha)) : Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        this.updateProgress('ordenesCompra');
      } catch (error) {
        scriptLogger.error(`Error en orden ${compra.id}`, error);
        this.updateProgress('ordenesCompra', false);
      }
    });

    await batch.commit();
    this.finalizeProgress('ordenesCompra');
  }

  /**
   * 4. Migrar Clientes
   */
  async migrateClientes(clientes: any[]) {
    scriptLogger.progress('\n👥 Migrando Clientes...');
    this.initProgress('clientes', clientes.length);

    const batch = this.db.batch();

    clientes.forEach(cliente => {
      try {
        const docRef = this.db.collection('clientes').doc(cliente.id || `CLI-${Date.now()}`);
        
        batch.set(docRef, {
          ...cliente,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        this.updateProgress('clientes');
      } catch (error) {
        scriptLogger.error(`Error en cliente ${cliente.nombre}`, error);
        this.updateProgress('clientes', false);
      }
    });

    await batch.commit();
    this.finalizeProgress('clientes');
  }

  /**
   * 5. Migrar Distribuidores
   */
  async migrateDistribuidores(distribuidores: any[]) {
    scriptLogger.progress('\n🚚 Migrando Distribuidores...');
    this.initProgress('distribuidores', distribuidores.length);

    const batch = this.db.batch();

    distribuidores.forEach(dist => {
      try {
        const docRef = this.db.collection('distribuidores').doc(dist.id || `DIST-${Date.now()}`);
        
        batch.set(docRef, {
          ...dist,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        this.updateProgress('distribuidores');
      } catch (error) {
        scriptLogger.error(`Error en distribuidor ${dist.nombre}`, error);
        this.updateProgress('distribuidores', false);
      }
    });

    await batch.commit();
    this.finalizeProgress('distribuidores');
  }

  /**
   * 6. Migrar Almacén
   */
  async migrateAlmacen(almacen: any) {
    scriptLogger.progress('\n📦 Migrando Almacén...');
    
    // Documento principal de almacén
    await this.db.collection('almacen').doc('stock').set({
      stockActual: almacen.stockActual || 0,
      totalEntradas: almacen.totalEntradas || 0,
      totalSalidas: almacen.totalSalidas || 0,
      updatedAt: Timestamp.now(),
    });

    // Migrar movimientos
    if (almacen.movimientos && almacen.movimientos.length > 0) {
      this.initProgress('almacen_movimientos', almacen.movimientos.length);
      
      const batch = this.db.batch();
      almacen.movimientos.forEach((mov: any) => {
        const docRef = this.db.collection('almacen').doc('stock').collection('movimientos').doc();
        batch.set(docRef, {
          ...mov,
          fecha: mov.fecha ? Timestamp.fromDate(new Date(mov.fecha)) : Timestamp.now(),
        });
        this.updateProgress('almacen_movimientos');
      });

      await batch.commit();
      this.finalizeProgress('almacen_movimientos');
    }

    scriptLogger.success('Almacén migrado');
  }

  /**
   * 7. Migrar Métricas Financieras
   */
  async migrateMetrics(metrics: any) {
    scriptLogger.progress('\n📊 Migrando Métricas Financieras...');

    await this.db.collection('metricas').doc('financieras').set({
      ...metrics,
      updatedAt: Timestamp.now(),
    });

    scriptLogger.success('Métricas migradas');
  }

  /**
   * Ejecutar migración completa
   */
  async migrateAll(dataPath: string) {
    scriptLogger.progress('\n🚀 INICIANDO MIGRACIÓN A FIRESTORE\n');
    scriptLogger.progress('='.repeat(60));

    try {
      // Cargar datos limpios - ajustar ruta relativa
      const absolutePath = path.isAbsolute(dataPath) 
        ? dataPath 
        : path.join(process.cwd(), '..', dataPath);
      
      const rawData = fs.readFileSync(absolutePath, 'utf-8');
      const data = JSON.parse(rawData);

      const startTime = Date.now();

      // Ejecutar migraciones en orden
      await this.migrateBancos(data.bancos);
      await this.migrateVentas(data.ventas);
      await this.migrateOrdenesCompra(data.compras);
      await this.migrateClientes(data.clientes);
      await this.migrateDistribuidores(data.distribuidores);
      await this.migrateAlmacen(data.almacen);
      await this.migrateMetrics(data.metricasFinancieras);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      scriptLogger.progress('\n' + '='.repeat(60));
      scriptLogger.success(`MIGRACIÓN COMPLETADA EN ${duration}s`);

      // Resumen
      this.printSummary();
    } catch (error) {
      scriptLogger.error('Error durante la migración', error);
      throw error;
    }
  }

  /**
   * Imprimir resumen de migración
   */
  private printSummary() {
    scriptLogger.progress('\n📋 RESUMEN DE MIGRACIÓN:\n');
    
    let totalProcessed = 0;
    let totalErrors = 0;

    this.progress.forEach(prog => {
      totalProcessed += prog.processed;
      totalErrors += prog.errors;
      
      const successRate = ((prog.processed - prog.errors) / prog.total * 100).toFixed(1);
      scriptLogger.progress(`   ${prog.collection}:`);
      scriptLogger.progress(`      Total: ${prog.total}`);
      scriptLogger.progress(`      Exitosos: ${prog.processed - prog.errors} (${successRate}%)`);
      scriptLogger.progress(`      Errores: ${prog.errors}`);
    });

    scriptLogger.progress(`\n   TOTAL: ${totalProcessed} documentos`);
    scriptLogger.progress(`   Errores: ${totalErrors}`);
    scriptLogger.progress(`   Tasa de éxito: ${((totalProcessed - totalErrors) / totalProcessed * 100).toFixed(1)}%`);
  }

  /**
   * Verificar migración
   */
  async verify() {
    scriptLogger.progress('\n🔍 Verificando migración...\n');

    const collections = [
      'bancos',
      'ventas',
      'ordenesCompra',
      'clientes',
      'distribuidores',
      'almacen',
      'metricas'
    ];

    for (const coll of collections) {
      const snapshot = await this.db.collection(coll).count().get();
      scriptLogger.progress(`   ${coll}: ${snapshot.data().count} documentos`);
    }

    scriptLogger.success('Verificación completada');
  }
}

// Ejecutar script
if (require.main === module) {
  const dataPath = path.join(process.cwd(), '..', 'BASE_DATOS_CLEANED.json');

  (async () => {
    try {
      const migrator = new FirestoreMigrator();
      await migrator.migrateAll(dataPath);
      await migrator.verify();

      scriptLogger.success('\n✨ PROCESO COMPLETADO EXITOSAMENTE\n');
      process.exit(0);
    } catch (error) {
      scriptLogger.error('Error fatal', error);
      process.exit(1);
    }
  })();
}

export default FirestoreMigrator;
