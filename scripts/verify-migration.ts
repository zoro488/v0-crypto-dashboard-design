/**
 * Script de Verificación de Migración de Datos
 * 
 * Este script valida que los datos de los archivos CSV fueron migrados
 * correctamente a Firestore, comparando:
 * - Conteo de filas vs documentos
 * - Sumas de montos monetarios
 * - Columnas clave
 * 
 * @author CHRONOS Data Engineering Team
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface CSVValidationResult {
  collection: string;
  csvPath: string;
  csvRowCount: number;
  firestoreDocCount: number;
  countMatch: boolean;
  csvMoneyTotal: number;
  firestoreMoneyTotal: number;
  moneyMatch: boolean;
  moneyDifference: number;
  missingColumns: string[];
  status: 'OK' | 'WARNING' | 'ERROR';
  details: string[];
}

interface VentaCSV {
  fecha: string;
  ocRelacionada: string;
  cantidad: string;
  cliente: string;
  bovedaMonte: string;
  precioVenta: string;
  ingreso: string;
  flete: string;
  fleteUtilidad: string;
  utilidad: string;
  estatus: string;
  concepto: string;
}

interface UtilidadCSV {
  fecha: string;
  cliente: string;
  ingreso: string;
  concepto: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGGER
// ═══════════════════════════════════════════════════════════════════════════

const logger = {
  info: (msg: string) => console.log(`ℹ️  ${msg}`),
  success: (msg: string) => console.log(`✅ ${msg}`),
  warning: (msg: string) => console.log(`⚠️  ${msg}`),
  error: (msg: string) => console.log(`❌ ${msg}`),
  critical: (msg: string) => console.log(`🔴 CRÍTICO: ${msg}`),
  table: (data: unknown) => console.table(data),
  divider: () => console.log('═'.repeat(70)),
  newline: () => console.log(''),
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

class MigrationVerifier {
  private db: FirebaseFirestore.Firestore;
  private csvBasePath: string;
  private results: CSVValidationResult[] = [];

  constructor() {
    // Inicializar Firebase Admin
    if (getApps().length === 0) {
      // Intentar cargar credenciales desde variable de entorno o archivo
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
        initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || 'premium-ecosystem-1760790572',
        });
      } else {
        // Usar emulador o proyecto por defecto
        initializeApp({
          projectId: 'premium-ecosystem-1760790572',
        });
      }
    }
    
    this.db = getFirestore();
    this.csvBasePath = path.join(__dirname, '..', 'csv');
  }

  /**
   * Parsear CSV a array de objetos
   */
  private parseCSV<T>(filePath: string): T[] {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo CSV no encontrado: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const rows: T[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });
      
      rows.push(row as T);
    }

    return rows;
  }

  /**
   * Parsear una línea CSV respetando comillas
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Parsear valor numérico de string
   */
  private parseNumber(value: string | undefined): number {
    if (!value || value.trim() === '') return 0;
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  }

  /**
   * Verificar columnas requeridas
   */
  private checkRequiredColumns(headers: string[], required: string[]): string[] {
    return required.filter(col => !headers.includes(col));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICACIÓN DE VENTAS
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyVentas(): Promise<CSVValidationResult> {
    logger.info('Verificando colección: ventas...');
    
    const csvPath = path.join(this.csvBasePath, 'ventas.csv');
    const result: CSVValidationResult = {
      collection: 'ventas',
      csvPath,
      csvRowCount: 0,
      firestoreDocCount: 0,
      countMatch: false,
      csvMoneyTotal: 0,
      firestoreMoneyTotal: 0,
      moneyMatch: false,
      moneyDifference: 0,
      missingColumns: [],
      status: 'OK',
      details: [],
    };

    try {
      // 1. Leer CSV
      const csvData = this.parseCSV<VentaCSV>(csvPath);
      result.csvRowCount = csvData.length;

      // 2. Verificar columnas requeridas
      const requiredColumns = ['ocRelacionada', 'cantidad', 'cliente', 'precioVenta', 'ingreso', 'estatus'];
      const content = fs.readFileSync(csvPath, 'utf-8');
      const headers = content.split('\n')[0].split(',').map(h => h.trim());
      result.missingColumns = this.checkRequiredColumns(headers, requiredColumns);

      if (result.missingColumns.length > 0) {
        result.status = 'ERROR';
        result.details.push(`Columnas faltantes: ${result.missingColumns.join(', ')}`);
      }

      // 3. Calcular suma de ingresos del CSV
      result.csvMoneyTotal = csvData.reduce((sum, row) => {
        return sum + this.parseNumber(row.ingreso);
      }, 0);

      // 4. Obtener datos de Firestore
      const firestoreSnapshot = await this.db.collection('ventas').get();
      result.firestoreDocCount = firestoreSnapshot.size;

      // 5. Calcular suma de ingresos de Firestore
      result.firestoreMoneyTotal = 0;
      firestoreSnapshot.forEach(doc => {
        const data = doc.data();
        result.firestoreMoneyTotal += this.parseNumber(data.ingreso?.toString() || '0');
      });

      // 6. Comparar conteos
      result.countMatch = result.csvRowCount === result.firestoreDocCount;
      if (!result.countMatch) {
        result.status = result.status === 'OK' ? 'WARNING' : result.status;
        result.details.push(`Diferencia en conteo: CSV=${result.csvRowCount}, Firestore=${result.firestoreDocCount}`);
      }

      // 7. Comparar sumas de dinero (VALIDACIÓN CRÍTICA)
      result.moneyDifference = Math.abs(result.csvMoneyTotal - result.firestoreMoneyTotal);
      result.moneyMatch = result.moneyDifference < 0.01; // Tolerancia de centavos

      if (!result.moneyMatch) {
        result.status = 'ERROR';
        result.details.push(`🔴 ALERTA CRÍTICA: Diferencia en suma de ingresos: $${result.moneyDifference.toLocaleString()}`);
        result.details.push(`   CSV Total: $${result.csvMoneyTotal.toLocaleString()}`);
        result.details.push(`   Firestore Total: $${result.firestoreMoneyTotal.toLocaleString()}`);
      }

      // Estadísticas adicionales
      const pagados = csvData.filter(v => v.estatus?.toLowerCase() === 'pagado').length;
      const pendientes = csvData.filter(v => v.estatus?.toLowerCase() === 'pendiente').length;
      result.details.push(`Ventas Pagadas: ${pagados}, Pendientes: ${pendientes}`);

    } catch (error) {
      result.status = 'ERROR';
      result.details.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    this.results.push(result);
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICACIÓN DE UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyUtilidades(): Promise<CSVValidationResult> {
    logger.info('Verificando colección: utilidades...');
    
    const csvPath = path.join(this.csvBasePath, 'utilidades.csv');
    const result: CSVValidationResult = {
      collection: 'utilidades',
      csvPath,
      csvRowCount: 0,
      firestoreDocCount: 0,
      countMatch: false,
      csvMoneyTotal: 0,
      firestoreMoneyTotal: 0,
      moneyMatch: false,
      moneyDifference: 0,
      missingColumns: [],
      status: 'OK',
      details: [],
    };

    try {
      // 1. Leer CSV
      const csvData = this.parseCSV<UtilidadCSV>(csvPath);
      result.csvRowCount = csvData.length;

      // 2. Verificar columnas requeridas
      const requiredColumns = ['fecha', 'cliente', 'ingreso', 'concepto'];
      const content = fs.readFileSync(csvPath, 'utf-8');
      const headers = content.split('\n')[0].split(',').map(h => h.trim());
      result.missingColumns = this.checkRequiredColumns(headers, requiredColumns);

      if (result.missingColumns.length > 0) {
        result.status = 'ERROR';
        result.details.push(`Columnas faltantes: ${result.missingColumns.join(', ')}`);
      }

      // 3. Calcular suma de ingresos del CSV
      result.csvMoneyTotal = csvData.reduce((sum, row) => {
        return sum + this.parseNumber(row.ingreso);
      }, 0);

      // 4. Obtener datos de Firestore (buscar en subcolección de banco utilidades o colección principal)
      let firestoreSnapshot = await this.db.collection('utilidades').get();
      
      // Si no hay documentos en colección principal, buscar en subcolección del banco
      if (firestoreSnapshot.empty) {
        const bankUtilSnapshot = await this.db
          .collection('bancos')
          .doc('utilidades')
          .collection('ingresos')
          .get();
        
        if (!bankUtilSnapshot.empty) {
          firestoreSnapshot = bankUtilSnapshot;
          result.details.push('Datos encontrados en bancos/utilidades/ingresos');
        }
      }

      result.firestoreDocCount = firestoreSnapshot.size;

      // 5. Calcular suma de ingresos de Firestore
      result.firestoreMoneyTotal = 0;
      firestoreSnapshot.forEach(doc => {
        const data = doc.data();
        const monto = data.ingreso || data.monto || data.cantidad || 0;
        result.firestoreMoneyTotal += this.parseNumber(monto.toString());
      });

      // 6. Comparar conteos
      result.countMatch = result.csvRowCount === result.firestoreDocCount;
      if (!result.countMatch) {
        result.status = result.status === 'OK' ? 'WARNING' : result.status;
        result.details.push(`Diferencia en conteo: CSV=${result.csvRowCount}, Firestore=${result.firestoreDocCount}`);
      }

      // 7. Comparar sumas
      result.moneyDifference = Math.abs(result.csvMoneyTotal - result.firestoreMoneyTotal);
      result.moneyMatch = result.moneyDifference < 0.01;

      if (!result.moneyMatch) {
        result.status = 'ERROR';
        result.details.push(`🔴 ALERTA: Diferencia en suma de utilidades: $${result.moneyDifference.toLocaleString()}`);
      }

      // Clientes únicos
      const clientesUnicos = new Set(csvData.map(u => u.cliente).filter(c => c));
      result.details.push(`Clientes únicos: ${clientesUnicos.size}`);

    } catch (error) {
      result.status = 'ERROR';
      result.details.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    this.results.push(result);
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICACIÓN DE OTRAS COLECCIONES
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyGenericCSV(csvFileName: string, collection: string, moneyField?: string): Promise<CSVValidationResult> {
    logger.info(`Verificando colección: ${collection}...`);
    
    const csvPath = path.join(this.csvBasePath, csvFileName);
    const result: CSVValidationResult = {
      collection,
      csvPath,
      csvRowCount: 0,
      firestoreDocCount: 0,
      countMatch: false,
      csvMoneyTotal: 0,
      firestoreMoneyTotal: 0,
      moneyMatch: true,
      moneyDifference: 0,
      missingColumns: [],
      status: 'OK',
      details: [],
    };

    try {
      if (!fs.existsSync(csvPath)) {
        result.status = 'WARNING';
        result.details.push(`Archivo CSV no encontrado: ${csvFileName}`);
        this.results.push(result);
        return result;
      }

      // Leer CSV
      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      result.csvRowCount = lines.length - 1; // Excluir header

      // Obtener de Firestore
      const snapshot = await this.db.collection(collection).get();
      result.firestoreDocCount = snapshot.size;

      // Comparar
      result.countMatch = result.csvRowCount === result.firestoreDocCount;
      if (!result.countMatch) {
        result.status = 'WARNING';
        result.details.push(`Diferencia: CSV=${result.csvRowCount}, Firestore=${result.firestoreDocCount}`);
      }

      // Si hay campo de dinero, calcular suma
      if (moneyField) {
        const csvData = this.parseCSV<Record<string, string>>(csvPath);
        result.csvMoneyTotal = csvData.reduce((sum, row) => sum + this.parseNumber(row[moneyField]), 0);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          result.firestoreMoneyTotal += this.parseNumber(data[moneyField]?.toString() || '0');
        });

        result.moneyDifference = Math.abs(result.csvMoneyTotal - result.firestoreMoneyTotal);
        result.moneyMatch = result.moneyDifference < 0.01;

        if (!result.moneyMatch) {
          result.status = 'ERROR';
          result.details.push(`Diferencia monetaria: $${result.moneyDifference.toLocaleString()}`);
        }
      }

    } catch (error) {
      result.status = 'ERROR';
      result.details.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    this.results.push(result);
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTE FINAL
  // ═══════════════════════════════════════════════════════════════════════════

  printReport(): void {
    logger.newline();
    logger.divider();
    console.log('📊 REPORTE FINAL DE VERIFICACIÓN DE MIGRACIÓN');
    logger.divider();
    logger.newline();

    // Tabla resumen
    const tableData = this.results.map(r => ({
      'Colección': r.collection,
      'CSV Filas': r.csvRowCount,
      'Firestore Docs': r.firestoreDocCount,
      'Conteo OK': r.countMatch ? '✅' : '❌',
      'CSV $': `$${r.csvMoneyTotal.toLocaleString()}`,
      'Firestore $': `$${r.firestoreMoneyTotal.toLocaleString()}`,
      'Dinero OK': r.moneyMatch ? '✅' : '❌',
      'Estado': r.status === 'OK' ? '✅ OK' : r.status === 'WARNING' ? '⚠️ WARN' : '❌ ERROR',
    }));

    logger.table(tableData);

    logger.newline();
    logger.divider();
    console.log('📋 DETALLES POR COLECCIÓN');
    logger.divider();

    for (const result of this.results) {
      logger.newline();
      const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${icon} ${result.collection.toUpperCase()}`);
      
      if (result.missingColumns.length > 0) {
        logger.warning(`   Columnas faltantes: ${result.missingColumns.join(', ')}`);
      }

      for (const detail of result.details) {
        console.log(`   ${detail}`);
      }

      if (result.status === 'OK') {
        logger.success(`   Verificación exitosa`);
      }
    }

    // Resumen ejecutivo
    logger.newline();
    logger.divider();
    console.log('📈 RESUMEN EJECUTIVO');
    logger.divider();

    const totalCSVRows = this.results.reduce((sum, r) => sum + r.csvRowCount, 0);
    const totalFirestoreDocs = this.results.reduce((sum, r) => sum + r.firestoreDocCount, 0);
    const totalCSVMoney = this.results.reduce((sum, r) => sum + r.csvMoneyTotal, 0);
    const totalFirestoreMoney = this.results.reduce((sum, r) => sum + r.firestoreMoneyTotal, 0);
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;

    console.log(`   Total filas CSV: ${totalCSVRows.toLocaleString()}`);
    console.log(`   Total documentos Firestore: ${totalFirestoreDocs.toLocaleString()}`);
    console.log(`   Total dinero CSV: $${totalCSVMoney.toLocaleString()}`);
    console.log(`   Total dinero Firestore: $${totalFirestoreMoney.toLocaleString()}`);
    console.log(`   Diferencia total: $${Math.abs(totalCSVMoney - totalFirestoreMoney).toLocaleString()}`);
    logger.newline();

    if (errors > 0) {
      logger.critical(`Se encontraron ${errors} ERRORES críticos que requieren atención inmediata.`);
    } else if (warnings > 0) {
      logger.warning(`Se encontraron ${warnings} advertencias. Revisar antes de producción.`);
    } else {
      logger.success('✨ MIGRACIÓN VERIFICADA EXITOSAMENTE - NO SE PERDIÓ NI UN PESO');
    }

    logger.newline();
    logger.divider();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EJECUTAR TODAS LAS VERIFICACIONES
  // ═══════════════════════════════════════════════════════════════════════════

  async runAllVerifications(): Promise<void> {
    logger.newline();
    logger.divider();
    console.log('🔍 INICIANDO VERIFICACIÓN DE MIGRACIÓN DE DATOS');
    logger.divider();
    logger.newline();

    const startTime = Date.now();

    // Verificaciones críticas
    await this.verifyVentas();
    await this.verifyUtilidades();

    // Verificaciones de otras colecciones
    await this.verifyGenericCSV('clientes.csv', 'clientes');
    await this.verifyGenericCSV('ordenes_compra.csv', 'ordenesCompra', 'costoTotal');
    await this.verifyGenericCSV('almacen.csv', 'almacen');
    await this.verifyGenericCSV('distribuidores.csv', 'distribuidores');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.newline();
    logger.info(`Verificación completada en ${duration}s`);

    // Imprimir reporte
    this.printReport();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUNTO DE ENTRADA
// ═══════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  try {
    const verifier = new MigrationVerifier();
    await verifier.runAllVerifications();
    
    // Exit code basado en resultados
    const hasErrors = verifier['results'].some(r => r.status === 'ERROR');
    process.exit(hasErrors ? 1 : 0);
  } catch (error) {
    logger.error(`Error fatal: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Ejecutar si es el módulo principal
if (require.main === module) {
  main();
}

export { MigrationVerifier, CSVValidationResult };
