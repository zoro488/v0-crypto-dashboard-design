/**
 * Data Cleaner Script
 * Limpia las 25 inconsistencias detectadas en BASE_DATOS_excel_data.json
 */

import fs from 'fs';
import path from 'path';

interface Venta {
  id: string;
  cliente: string | number;
  fecha: string;
  cantidad: number;
  totalVenta: number;
  totalFletes: number;
  estadoPago: string;
  adeudo: number;
  montoPagado: number;
  productos: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>;
}

interface Cliente {
  id: string;
  nombre: string;
  adeudo: number;
  contacto?: string;
  totalCompras?: number;
}

interface Distribuidor {
  id: string;
  nombre: string;
  adeudo: number;
  contacto: string;
}

interface DataExcel {
  ventas: Venta[];
  clientes: Cliente[];
  distribuidores: Distribuidor[];
  compras: any[];
  bancos: any;
  almacen: any;
  metricasFinancieras: any;
}

class DataCleaner {
  private data: DataExcel;
  private issues: string[] = [];
  private fixes: string[] = [];

  constructor(filePath: string) {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    this.data = JSON.parse(rawData);
  }

  /**
   * 1. Corregir clientes numéricos
   */
  fixNumericClients() {
    console.log('🔍 Buscando clientes numéricos...');
    let fixed = 0;

    this.data.ventas = this.data.ventas.map(venta => {
      if (typeof venta.cliente === 'number') {
        const oldCliente = venta.cliente;
        venta.cliente = `Cliente-${venta.cliente}`;
        this.fixes.push(`✅ Venta ${venta.id}: Cliente ${oldCliente} → ${venta.cliente}`);
        fixed++;
      }
      return venta;
    });

    console.log(`✅ ${fixed} clientes numéricos corregidos`);
  }

  /**
   * 2. Corregir adeudos negativos (representan pagos adelantados)
   */
  fixNegativeDebts() {
    console.log('🔍 Analizando adeudos negativos...');
    let fixed = 0;

    this.data.clientes = this.data.clientes.map(cliente => {
      if (cliente.adeudo < 0) {
        const creditoFavor = Math.abs(cliente.adeudo);
        this.fixes.push(
          `✅ Cliente "${cliente.nombre}": Adeudo ${cliente.adeudo} → 0 (Crédito a favor: $${creditoFavor.toLocaleString()})`
        );
        
        // Guardar crédito a favor en nueva propiedad
        (cliente as any).creditoFavor = creditoFavor;
        cliente.adeudo = 0;
        fixed++;
      }
      return cliente;
    });

    this.data.distribuidores = this.data.distribuidores.map(dist => {
      if (dist.adeudo < 0) {
        const creditoFavor = Math.abs(dist.adeudo);
        this.fixes.push(
          `✅ Distribuidor "${dist.nombre}": Adeudo ${dist.adeudo} → 0 (Crédito a favor: $${creditoFavor.toLocaleString()})`
        );
        
        (dist as any).creditoFavor = creditoFavor;
        dist.adeudo = 0;
        fixed++;
      }
      return dist;
    });

    console.log(`✅ ${fixed} adeudos negativos convertidos a créditos a favor`);
  }

  /**
   * 3. Corregir precios en cero (trámites)
   */
  fixZeroPrices() {
    console.log('🔍 Corrigiendo precios en cero...');
    let fixed = 0;
    const DEFAULT_TRAMITE_PRICE = 500; // Precio por defecto para trámites

    this.data.ventas = this.data.ventas.map(venta => {
      const clienteStr = String(venta.cliente);
      
      if (clienteStr.toLowerCase().includes('trámite') || 
          clienteStr.toLowerCase().includes('tramite')) {
        
        // Si el precio es 0, asignar precio por defecto
        venta.productos = venta.productos.map(prod => {
          if (prod.precio === 0) {
            prod.precio = DEFAULT_TRAMITE_PRICE;
            prod.subtotal = prod.cantidad * DEFAULT_TRAMITE_PRICE;
            fixed++;
          }
          return prod;
        });

        // Recalcular totales
        venta.totalVenta = venta.productos.reduce((sum, p) => sum + p.subtotal, 0);
        
        this.fixes.push(
          `✅ Venta ${venta.id}: Precio trámite 0 → $${DEFAULT_TRAMITE_PRICE}`
        );
      }
      return venta;
    });

    console.log(`✅ ${fixed} precios de trámites corregidos`);
  }

  /**
   * 4. Validar integridad de referencias (clientes en ventas)
   */
  validateReferences() {
    console.log('🔍 Validando referencias cliente-ventas...');
    
    const clientesSet = new Set(this.data.clientes.map(c => c.nombre));
    const clientesFaltantes = new Set<string>();

    this.data.ventas.forEach(venta => {
      if (!clientesSet.has(String(venta.cliente))) {
        clientesFaltantes.add(String(venta.cliente));
      }
    });

    if (clientesFaltantes.size > 0) {
      console.log(`⚠️  ${clientesFaltantes.size} clientes faltantes en base de datos`);
      
      // Crear clientes faltantes
      clientesFaltantes.forEach(nombre => {
        const ventasCliente = this.data.ventas.filter(v => v.cliente === nombre);
        const totalAdeudo = ventasCliente.reduce((sum, v) => sum + v.adeudo, 0);
        const totalCompras = ventasCliente.reduce((sum, v) => sum + v.totalVenta, 0);

        this.data.clientes.push({
          id: `CLI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          nombre: nombre,
          adeudo: totalAdeudo,
          totalCompras: totalCompras,
          contacto: 'Por definir',
        });

        this.fixes.push(`✅ Cliente creado: "${nombre}" (Adeudo: $${totalAdeudo.toLocaleString()})`);
      });
    }

    console.log(`✅ Referencias validadas y corregidas`);
  }

  /**
   * 5. Inicializar capitales bancarios
   */
  initializeBankCapitals() {
    console.log('🔍 Inicializando capitales bancarios...');

    const bankIds = Object.keys(this.data.bancos);
    
    bankIds.forEach(bankId => {
      const bank = this.data.bancos[bankId];
      
      // Calcular capital inicial basado en transacciones
      if (!bank.capitalInicial || bank.capitalInicial === 0) {
        const ingresos = bank.ingresos?.reduce((sum: number, i: any) => sum + (i.monto || 0), 0) || 0;
        const gastos = bank.gastos?.reduce((sum: number, g: any) => sum + (g.monto || 0), 0) || 0;
        
        bank.capitalInicial = ingresos - gastos;
        bank.capitalActual = bank.capitalInicial;
        
        this.fixes.push(
          `✅ Banco "${bankId}": Capital inicializado → $${bank.capitalInicial.toLocaleString()}`
        );
      }
    });

    console.log('✅ Capitales bancarios inicializados');
  }

  /**
   * 6. Recalcular métricas financieras globales
   */
  recalculateMetrics() {
    console.log('🔍 Recalculando métricas financieras...');

    const metrics: any = {
      ventasTotales: this.data.ventas.reduce((sum, v) => sum + v.totalVenta, 0),
      comprasTotales: this.data.compras.reduce((sum, c) => sum + (c.costoTotal || 0), 0),
      carteraPorCobrar: this.data.clientes.reduce((sum, c) => sum + c.adeudo, 0),
      cuentasPorPagar: this.data.distribuidores.reduce((sum, d) => sum + d.adeudo, 0),
      capitalTotal: Object.values(this.data.bancos).reduce(
        (sum: number, b: any) => sum + (b.capitalActual || 0), 
        0
      ),
    };

    metrics.utilidadTotal = metrics.ventasTotales - metrics.comprasTotales;

    this.data.metricasFinancieras = {
      ...this.data.metricasFinancieras,
      ...metrics,
      fechaActualizacion: new Date().toISOString(),
    };

    console.log('✅ Métricas financieras recalculadas:');
    console.log(`   💰 Ventas Totales: $${metrics.ventasTotales.toLocaleString()}`);
    console.log(`   📦 Compras Totales: $${metrics.comprasTotales.toLocaleString()}`);
    console.log(`   📊 Utilidad Total: $${metrics.utilidadTotal.toLocaleString()}`);
    console.log(`   💵 Capital Total: $${metrics.capitalTotal.toLocaleString()}`);
  }

  /**
   * Ejecutar todas las correcciones
   */
  cleanAll() {
    console.log('\n🚀 INICIANDO LIMPIEZA DE DATOS\n');
    console.log('='.repeat(60));

    this.fixNumericClients();
    this.fixNegativeDebts();
    this.fixZeroPrices();
    this.validateReferences();
    this.initializeBankCapitals();
    this.recalculateMetrics();

    console.log('\n' + '='.repeat(60));
    console.log('✅ LIMPIEZA COMPLETADA\n');
  }

  /**
   * Generar reporte de correcciones
   */
  generateReport() {
    const report = {
      fecha: new Date().toISOString(),
      totalFixes: this.fixes.length,
      totalIssues: this.issues.length,
      fixes: this.fixes,
      issues: this.issues,
      resumenDatos: {
        ventas: this.data.ventas.length,
        clientes: this.data.clientes.length,
        distribuidores: this.data.distribuidores.length,
        compras: this.data.compras.length,
        bancos: Object.keys(this.data.bancos).length,
      },
      metricasFinancieras: this.data.metricasFinancieras,
    };

    return report;
  }

  /**
   * Guardar datos limpios
   */
  save(outputPath: string) {
    fs.writeFileSync(
      outputPath,
      JSON.stringify(this.data, null, 2),
      'utf-8'
    );
    console.log(`💾 Datos limpios guardados en: ${outputPath}`);
  }

  /**
   * Guardar reporte
   */
  saveReport(reportPath: string) {
    const report = this.generateReport();
    fs.writeFileSync(
      reportPath,
      JSON.stringify(report, null, 2),
      'utf-8'
    );
    console.log(`📄 Reporte guardado en: ${reportPath}`);
  }

  getData() {
    return this.data;
  }
}

// Ejecutar script
if (require.main === module) {
  const inputPath = path.join(process.cwd(), '..', 'BASE_DATOS_excel_data.json');
  const outputPath = path.join(process.cwd(), '..', 'BASE_DATOS_CLEANED.json');
  const reportPath = path.join(process.cwd(), '..', 'CLEANING_REPORT.json');

  try {
    const cleaner = new DataCleaner(inputPath);
    cleaner.cleanAll();
    cleaner.save(outputPath);
    cleaner.saveReport(reportPath);

    console.log('\n✨ PROCESO COMPLETADO EXITOSAMENTE\n');
    console.log('📋 Archivos generados:');
    console.log(`   1. ${outputPath}`);
    console.log(`   2. ${reportPath}`);
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

export default DataCleaner;
