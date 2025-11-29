/**
 * 🚀 SCRIPT DE MIGRACIÓN "ZERO-LOSS" - CHRONOS SYSTEM
 * 
 * Sincroniza TODOS los datos del Excel de Administración General a Firestore
 * 
 * DATOS A MIGRAR:
 * - 96 ventas (ventas.csv)
 * - 31 clientes (clientes.csv)
 * - 9 órdenes de compra (ordenes_compra.csv)
 * - 6 orígenes/distribuidores (distribuidores_clean.csv)
 * - 7 bancos con saldos iniciales
 * - Movimientos GYA (gastos_abonos.csv)
 * 
 * FÓRMULAS DEL EXCEL:
 * - Distribución 3 bancos: bovedaMonte (costo), fleteSur (flete), utilidades (ganancia)
 * - utilidad = (precioVenta - precioCompra - flete) × cantidad
 * - capitalActual = historicoIngresos - historicoGastos
 */

import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

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

interface ClienteCSV {
  cliente: string;
  actual: string;
  deuda: string;
  abonos: string;
  pendiente: string;
  observaciones: string;
}

interface OrdenCompraCSV {
  id: string;
  fecha: string;
  origen: string;
  cantidad: string;
  costoDistribuidor: string;
  costoTransporte: string;
  costoPorUnidad: string;
  stockActual: string;
  costoTotal: string;
  pagoDistribuidor: string;
  deuda: string;
}

interface GastoAbonoCSV {
  fecha: string;
  tipo: string;
  origen: string;
  valor: string;
  tc: string;
  pesos: string;
  destino: string;
  observaciones: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════

function parseCSV<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data: T[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj: Record<string, string> = {};
    
    headers.forEach((header, idx) => {
      obj[header] = values[idx]?.trim() || '';
    });
    
    data.push(obj as unknown as T);
  }
  
  return data;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (const char of line) {
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

function cleanNumber(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[$,\s]/g, '').replace(/[()]/g, '-');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function generateId(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(4, '0')}`;
}

function toFirestoreDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  
  // Formato esperado: 2025-08-23 o similar
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).toISOString();
  }
  
  return new Date().toISOString();
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE BANCOS (7 del sistema)
// ═══════════════════════════════════════════════════════════════════════════

const BANCOS_CONFIG = {
  boveda_monte: {
    id: 'boveda_monte',
    nombre: 'Bóveda Monte',
    icon: 'building',
    color: 'from-violet-500 to-violet-700',
    tipo: 'boveda',
    moneda: 'MXN',
    descripcion: 'Bóveda principal - Recuperación de costo',
    capitalInicial: 5722280
  },
  boveda_usa: {
    id: 'boveda_usa',
    nombre: 'Bóveda USA',
    icon: 'flag',
    color: 'from-blue-500 to-blue-700',
    tipo: 'boveda',
    moneda: 'USD',
    descripcion: 'Bóveda internacional',
    capitalInicial: 128005
  },
  profit: {
    id: 'profit',
    nombre: 'Profit',
    icon: 'diamond',
    color: 'from-teal-500 to-teal-700',
    tipo: 'operativo',
    moneda: 'MXN',
    descripcion: 'Banco operativo principal',
    capitalInicial: 12577748
  },
  leftie: {
    id: 'leftie',
    nombre: 'Leftie',
    icon: 'store',
    color: 'from-indigo-500 to-indigo-700',
    tipo: 'operativo',
    moneda: 'USD',
    descripcion: 'Operaciones USD',
    capitalInicial: 45844
  },
  azteca: {
    id: 'azteca',
    nombre: 'Azteca',
    icon: 'briefcase',
    color: 'from-pink-500 to-pink-700',
    tipo: 'operativo',
    moneda: 'MXN',
    descripcion: 'Pagos de servicios',
    capitalInicial: -178714.88
  },
  flete_sur: {
    id: 'flete_sur',
    nombre: 'Flete Sur',
    icon: 'truck',
    color: 'from-amber-500 to-amber-700',
    tipo: 'gastos',
    moneda: 'MXN',
    descripcion: 'Costos de transporte - Ganancia flete',
    capitalInicial: 185792
  },
  utilidades: {
    id: 'utilidades',
    nombre: 'Utilidades',
    icon: 'trending-up',
    color: 'from-emerald-500 to-emerald-700',
    tipo: 'utilidades',
    moneda: 'MXN',
    descripcion: 'Ganancias netas del sistema',
    capitalInicial: 102658
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PROCESAMIENTO DE DATOS
// ═══════════════════════════════════════════════════════════════════════════

interface ProcessedData {
  ventas: Record<string, unknown>[];
  clientes: Record<string, unknown>[];
  ordenesCompra: Record<string, unknown>[];
  distribuidores: Record<string, unknown>[];
  bancos: Record<string, unknown>[];
  movimientos: Record<string, unknown>[];
}

function processVentas(csvPath: string): Record<string, unknown>[] {
  console.log('📊 Procesando ventas...');
  const rawData = parseCSV<VentaCSV>(csvPath);
  
  return rawData.map((row, idx) => {
    const cantidad = cleanNumber(row.cantidad);
    const precioVenta = cleanNumber(row.precioVenta);
    const bovedaMonte = cleanNumber(row.bovedaMonte);
    const fleteUtilidad = cleanNumber(row.fleteUtilidad);
    const utilidad = cleanNumber(row.utilidad);
    const ingreso = cleanNumber(row.ingreso);
    
    // Calcular precio de compra inverso (bovedaMonte / cantidad)
    const precioCompra = cantidad > 0 ? bovedaMonte / cantidad : 6300; // Default si no hay datos
    
    // Estado de pago
    const estatus = row.estatus?.toLowerCase() || 'pendiente';
    const estadoPago = estatus.includes('pagado') ? 'completo' : 
                       estatus.includes('parcial') ? 'parcial' : 'pendiente';
    
    // Monto pagado según estado
    const montoPagado = estadoPago === 'completo' ? ingreso : 
                        estadoPago === 'parcial' ? ingreso * 0.5 : 0;
    
    return {
      id: generateId('V', idx + 1),
      fecha: toFirestoreDate(row.fecha),
      ocRelacionada: row.ocRelacionada || 'OC0001',
      clienteId: row.cliente?.toLowerCase().replace(/\s+/g, '_') || 'desconocido',
      cliente: row.cliente || 'Sin cliente',
      cantidad,
      precioVenta,
      precioCompra,
      // Totales
      ingreso,
      totalVenta: ingreso,
      precioTotalVenta: ingreso,
      // Flete
      flete: row.flete === 'Aplica' ? 'Aplica' : 'NoAplica',
      fleteUtilidad,
      precioFlete: cantidad > 0 ? fleteUtilidad / cantidad : 500,
      // Utilidad
      utilidad,
      ganancia: utilidad,
      // Distribución a bancos (LÓGICA GYA)
      bovedaMonte,
      distribucion: {
        bovedaMonte,      // Recuperación de costo
        fletes: fleteUtilidad,     // Ganancia flete
        utilidades: utilidad       // Ganancia neta
      },
      // Estado de pago
      estatus: row.estatus || 'Pendiente',
      estadoPago,
      montoPagado,
      montoRestante: ingreso - montoPagado,
      adeudo: ingreso - montoPagado,
      // Auditoría
      concepto: row.concepto || '',
      keywords: [row.cliente, row.ocRelacionada, row.estatus].filter(Boolean).map(k => k.toLowerCase()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

function processClientes(csvPath: string): Record<string, unknown>[] {
  console.log('👥 Procesando clientes...');
  const rawData = parseCSV<ClienteCSV>(csvPath);
  
  return rawData.map((row, idx) => {
    const deuda = cleanNumber(row.deuda);
    const abonos = cleanNumber(row.abonos);
    const pendiente = cleanNumber(row.pendiente);
    const actual = cleanNumber(row.actual);
    
    return {
      id: row.cliente?.toLowerCase().replace(/\s+/g, '_') || generateId('CLI', idx + 1),
      nombre: row.cliente || 'Sin nombre',
      telefono: '',
      email: '',
      direccion: '',
      // Campos financieros
      actual,
      deuda,
      abonos,
      pendiente,
      totalVentas: deuda,
      totalPagado: abonos,
      deudaTotal: pendiente > 0 ? pendiente : 0,
      // Métricas
      numeroCompras: 0, // Se calculará con agregación
      // Estado
      estado: 'activo',
      observaciones: row.observaciones || '',
      keywords: [row.cliente].filter(Boolean).map(k => k.toLowerCase()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

function processOrdenesCompra(csvPath: string): { ordenes: Record<string, unknown>[], distribuidores: Record<string, unknown>[] } {
  console.log('📦 Procesando órdenes de compra...');
  const rawData = parseCSV<OrdenCompraCSV>(csvPath);
  
  const distribuidoresMap = new Map<string, Record<string, unknown>>();
  
  const ordenes = rawData.map((row) => {
    const cantidad = cleanNumber(row.cantidad);
    const costoDistribuidor = cleanNumber(row.costoDistribuidor);
    const costoTransporte = cleanNumber(row.costoTransporte);
    const costoPorUnidad = cleanNumber(row.costoPorUnidad) || costoDistribuidor + costoTransporte;
    const costoTotal = cleanNumber(row.costoTotal) || costoPorUnidad * cantidad;
    const pagoDistribuidor = cleanNumber(row.pagoDistribuidor);
    const deuda = cleanNumber(row.deuda) || costoTotal - pagoDistribuidor;
    const stockActual = cleanNumber(row.stockActual);
    
    const origen = row.origen || 'DESCONOCIDO';
    const distribuidorId = origen.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Acumular datos del distribuidor
    if (!distribuidoresMap.has(distribuidorId)) {
      distribuidoresMap.set(distribuidorId, {
        id: distribuidorId,
        nombre: origen,
        empresa: origen,
        costoTotal: 0,
        abonos: 0,
        pendiente: 0,
        numeroOrdenes: 0,
        estado: 'activo',
        keywords: [origen.toLowerCase()],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    const dist = distribuidoresMap.get(distribuidorId)!;
    dist.costoTotal = (dist.costoTotal as number) + costoTotal;
    dist.abonos = (dist.abonos as number) + pagoDistribuidor;
    dist.pendiente = (dist.pendiente as number) + deuda;
    dist.numeroOrdenes = (dist.numeroOrdenes as number) + 1;
    
    return {
      id: row.id || generateId('OC', 1),
      fecha: toFirestoreDate(row.fecha),
      distribuidorId,
      distribuidor: origen,
      origen,
      cantidad,
      costoDistribuidor,
      costoTransporte,
      costoPorUnidad,
      costoTotal,
      stockActual,
      stockInicial: cantidad,
      pagoDistribuidor,
      pagoInicial: pagoDistribuidor,
      deuda,
      bancoOrigen: 'boveda_monte',
      estado: deuda > 0 ? 'pendiente' : 'pagado',
      keywords: [row.id, origen].filter(Boolean).map(k => k.toLowerCase()),
      notas: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
  
  return {
    ordenes,
    distribuidores: Array.from(distribuidoresMap.values())
  };
}

function processBancos(): Record<string, unknown>[] {
  console.log('🏦 Configurando bancos...');
  
  return Object.values(BANCOS_CONFIG).map(banco => ({
    ...banco,
    capitalActual: banco.capitalInicial,
    historicoIngresos: banco.capitalInicial > 0 ? banco.capitalInicial : 0,
    historicoGastos: banco.capitalInicial < 0 ? Math.abs(banco.capitalInicial) : 0,
    historicoTransferencias: 0,
    estado: 'activo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

function processGastosAbonos(csvPath: string): Record<string, unknown>[] {
  console.log('💸 Procesando gastos y abonos...');
  
  if (!fs.existsSync(csvPath)) {
    console.log('   ⚠️ Archivo gastos_abonos.csv no encontrado, saltando...');
    return [];
  }
  
  const rawData = parseCSV<GastoAbonoCSV>(csvPath);
  
  return rawData.map((row, idx) => {
    const valor = cleanNumber(row.valor);
    const tc = cleanNumber(row.tc) || 1;
    const pesos = cleanNumber(row.pesos) || valor * tc;
    
    const tipo = row.tipo?.toLowerCase().includes('gasto') ? 'gasto' : 'abono';
    const tipoMovimiento = tipo === 'gasto' ? 'gasto' : 'ingreso';
    
    // Mapear destino a bancoId
    const destinoLower = (row.destino || '').toLowerCase();
    let bancoId = 'boveda_monte';
    if (destinoLower.includes('usa')) bancoId = 'boveda_usa';
    else if (destinoLower.includes('profit')) bancoId = 'profit';
    else if (destinoLower.includes('leftie')) bancoId = 'leftie';
    else if (destinoLower.includes('azteca')) bancoId = 'azteca';
    else if (destinoLower.includes('flete')) bancoId = 'flete_sur';
    else if (destinoLower.includes('utilidad')) bancoId = 'utilidades';
    
    return {
      id: generateId('MOV', idx + 1),
      bancoId,
      tipoMovimiento,
      tipo,
      fecha: toFirestoreDate(row.fecha),
      monto: pesos,
      concepto: `${tipo}: ${row.origen || 'Sin origen'}`,
      cliente: row.origen || '',
      origen: row.origen || '',
      destino: row.destino || '',
      tc,
      pesos,
      dolares: valor,
      referenciaTipo: 'manual',
      observaciones: row.observaciones || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERADOR DE MOCK DATA ACTUALIZADO
// ═══════════════════════════════════════════════════════════════════════════

function generateMockDataFile(data: ProcessedData): string {
  return `/**
 * 🔄 MOCK DATA GENERADO DESDE CSVs - CHRONOS SYSTEM
 * Generado: ${new Date().toISOString()}
 * 
 * Datos reales:
 * - ${data.ventas.length} ventas
 * - ${data.clientes.length} clientes
 * - ${data.ordenesCompra.length} órdenes de compra
 * - ${data.distribuidores.length} distribuidores
 * - ${data.bancos.length} bancos
 * - ${data.movimientos.length} movimientos
 */

export const MOCK_VENTAS = ${JSON.stringify(data.ventas.slice(0, 20), null, 2)};

export const MOCK_CLIENTES = ${JSON.stringify(data.clientes, null, 2)};

export const MOCK_ORDENES_COMPRA = ${JSON.stringify(data.ordenesCompra, null, 2)};

export const MOCK_DISTRIBUIDORES = ${JSON.stringify(data.distribuidores, null, 2)};

export const MOCK_BANCOS = ${JSON.stringify(data.bancos, null, 2)};

export const MOCK_MOVIMIENTOS = ${JSON.stringify(data.movimientos.slice(0, 50), null, 2)};

// Estadísticas calculadas
export const STATS = {
  totalVentas: ${data.ventas.reduce((sum, v) => sum + (v.ingreso as number || 0), 0)},
  totalCobrado: ${data.ventas.filter(v => v.estadoPago === 'completo').reduce((sum, v) => sum + (v.ingreso as number || 0), 0)},
  totalPendiente: ${data.ventas.filter(v => v.estadoPago !== 'completo').reduce((sum, v) => sum + (v.montoRestante as number || 0), 0)},
  ventasCount: ${data.ventas.length},
  clientesCount: ${data.clientes.length},
  ordenesCount: ${data.ordenesCompra.length},
  distribuidoresCount: ${data.distribuidores.length},
  // Distribución GYA
  totalBovedaMonte: ${data.ventas.reduce((sum, v) => sum + ((v.distribucion as Record<string, number>)?.bovedaMonte || 0), 0)},
  totalFletes: ${data.ventas.reduce((sum, v) => sum + ((v.distribucion as Record<string, number>)?.fletes || 0), 0)},
  totalUtilidades: ${data.ventas.reduce((sum, v) => sum + ((v.distribucion as Record<string, number>)?.utilidades || 0), 0)},
};
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 MIGRACIÓN ZERO-LOSS - CHRONOS SYSTEM');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  const csvDir = path.join(__dirname, '../csv');
  
  // Verificar que existen los archivos
  const requiredFiles = ['ventas.csv', 'clientes.csv', 'ordenes_compra.csv'];
  for (const file of requiredFiles) {
    const filePath = path.join(csvDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: No se encontró ${file}`);
      process.exit(1);
    }
  }
  
  // Procesar datos
  const ventas = processVentas(path.join(csvDir, 'ventas.csv'));
  const clientes = processClientes(path.join(csvDir, 'clientes.csv'));
  const { ordenes, distribuidores } = processOrdenesCompra(path.join(csvDir, 'ordenes_compra.csv'));
  const bancos = processBancos();
  const movimientos = processGastosAbonos(path.join(csvDir, 'gastos_abonos.csv'));
  
  const processedData: ProcessedData = {
    ventas,
    clientes,
    ordenesCompra: ordenes,
    distribuidores,
    bancos,
    movimientos
  };
  
  // Generar estadísticas
  console.log('');
  console.log('📊 RESUMEN DE DATOS PROCESADOS:');
  console.log('───────────────────────────────────────');
  console.log(`   ✅ Ventas: ${ventas.length}`);
  console.log(`   ✅ Clientes: ${clientes.length}`);
  console.log(`   ✅ Órdenes de Compra: ${ordenes.length}`);
  console.log(`   ✅ Distribuidores: ${distribuidores.length}`);
  console.log(`   ✅ Bancos: ${bancos.length}`);
  console.log(`   ✅ Movimientos: ${movimientos.length}`);
  console.log('');
  
  // Calcular totales GYA
  const totalVentas = ventas.reduce((sum, v) => sum + (v.ingreso as number || 0), 0);
  const totalBovedaMonte = ventas.reduce((sum, v) => sum + ((v.distribucion as Record<string, number>)?.bovedaMonte || 0), 0);
  const totalFletes = ventas.reduce((sum, v) => sum + ((v.distribucion as Record<string, number>)?.fletes || 0), 0);
  const totalUtilidades = ventas.reduce((sum, v) => sum + ((v.distribucion as Record<string, number>)?.utilidades || 0), 0);
  
  console.log('💰 DISTRIBUCIÓN GYA (Lógica del Excel):');
  console.log('───────────────────────────────────────');
  console.log(`   📈 Total Ingresos: $${totalVentas.toLocaleString('es-MX')}`);
  console.log(`   🏛️ → Bóveda Monte: $${totalBovedaMonte.toLocaleString('es-MX')} (recuperación costo)`);
  console.log(`   🚛 → Flete Sur: $${totalFletes.toLocaleString('es-MX')} (ganancia flete)`);
  console.log(`   💎 → Utilidades: $${totalUtilidades.toLocaleString('es-MX')} (ganancia neta)`);
  console.log('');
  
  // Verificación de fórmula
  const verificacion = totalBovedaMonte + totalFletes + totalUtilidades;
  console.log('🔍 VERIFICACIÓN DE FÓRMULA:');
  console.log('───────────────────────────────────────');
  console.log(`   Suma distribución: $${verificacion.toLocaleString('es-MX')}`);
  console.log(`   Total ventas: $${totalVentas.toLocaleString('es-MX')}`);
  console.log(`   Diferencia: $${(totalVentas - verificacion).toLocaleString('es-MX')}`);
  console.log('');
  
  // Generar archivo de mock data actualizado
  const mockDataContent = generateMockDataFile(processedData);
  const mockDataPath = path.join(__dirname, '../app/lib/data/mock-data-generated.ts');
  
  // Crear directorio si no existe
  const mockDataDir = path.dirname(mockDataPath);
  if (!fs.existsSync(mockDataDir)) {
    fs.mkdirSync(mockDataDir, { recursive: true });
  }
  
  fs.writeFileSync(mockDataPath, mockDataContent);
  console.log(`✅ Mock data generado: ${mockDataPath}`);
  
  // Generar JSON para importación a Firestore
  const firestoreDataPath = path.join(__dirname, '../app/lib/data/firestore-import.json');
  fs.writeFileSync(firestoreDataPath, JSON.stringify(processedData, null, 2));
  console.log(`✅ Datos Firestore generados: ${firestoreDataPath}`);
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ MIGRACIÓN COMPLETADA');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('📝 PRÓXIMOS PASOS:');
  console.log('   1. Los datos mock están en: app/lib/data/mock-data-generated.ts');
  console.log('   2. Para subir a Firestore, usa: pnpm migrate:firestore');
  console.log('   3. Verifica los datos en el panel de Firebase Console');
  console.log('');
}

main().catch(console.error);
