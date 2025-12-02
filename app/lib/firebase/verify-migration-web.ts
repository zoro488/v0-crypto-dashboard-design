/**
 * Script de Verificación de Migración usando Firebase Web SDK
 * 
 * Este script puede ejecutarse desde el navegador para verificar
 * la integridad de los datos en Firestore.
 * 
 * @author CHRONOS Data Engineering Team
 */

import { collection, getDocs, query } from 'firebase/firestore'
import { db } from './config'
import { logger } from '../utils/logger'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface CollectionStats {
  name: string
  documentCount: number
  totalMoney: number
  moneyField: string
  sampleDoc: Record<string, unknown> | null
  status: 'OK' | 'EMPTY' | 'ERROR'
  error?: string
}

interface VerificationReport {
  timestamp: Date
  collections: CollectionStats[]
  totalDocuments: number
  totalMoney: number
  errors: string[]
}

// ═══════════════════════════════════════════════════════════════════════════
// COLECCIONES A VERIFICAR
// ═══════════════════════════════════════════════════════════════════════════

const COLLECTIONS_TO_VERIFY = [
  { name: 'ventas', moneyField: 'ingreso' },
  { name: 'utilidades', moneyField: 'ingreso' },
  { name: 'clientes', moneyField: 'totalVentas' },
  { name: 'ordenesCompra', moneyField: 'costoTotal' },
  { name: 'distribuidores', moneyField: 'totalOrdenesCompra' },
  { name: 'bancos', moneyField: 'capitalActual' },
  { name: 'almacen', moneyField: 'stockActual' },
]

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE VERIFICACIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verificar una colección específica
 */
export async function verifyCollection(
  collectionName: string,
  moneyField: string,
): Promise<CollectionStats> {
  const stats: CollectionStats = {
    name: collectionName,
    documentCount: 0,
    totalMoney: 0,
    moneyField,
    sampleDoc: null,
    status: 'OK',
  }

  try {
    const q = query(collection(db!, collectionName))
    const snapshot = await getDocs(q)

    stats.documentCount = snapshot.size

    if (snapshot.empty) {
      stats.status = 'EMPTY'
      return stats
    }

    // Calcular suma de dinero y obtener muestra
    let index = 0
    snapshot.forEach((doc) => {
      const data = doc.data()
      
      if (index === 0) {
        stats.sampleDoc = { id: doc.id, ...data }
      }

      const moneyValue = parseFloat(data[moneyField]?.toString() || '0')
      if (!isNaN(moneyValue)) {
        stats.totalMoney += moneyValue
      }
      index++
    })

  } catch (error) {
    stats.status = 'ERROR'
    stats.error = error instanceof Error ? error.message : String(error)
  }

  return stats
}

/**
 * Verificar todas las colecciones
 */
export async function verifyAllCollections(): Promise<VerificationReport> {
  const report: VerificationReport = {
    timestamp: new Date(),
    collections: [],
    totalDocuments: 0,
    totalMoney: 0,
    errors: [],
  }

  for (const { name, moneyField } of COLLECTIONS_TO_VERIFY) {
    const stats = await verifyCollection(name, moneyField)
    report.collections.push(stats)
    report.totalDocuments += stats.documentCount

    if (stats.status === 'ERROR' && stats.error) {
      report.errors.push(`${name}: ${stats.error}`)
    }

    // Solo sumar dinero de colecciones financieras
    if (['ventas', 'utilidades', 'ordenesCompra'].includes(name)) {
      report.totalMoney += stats.totalMoney
    }
  }

  return report
}

/**
 * Verificar integridad de ventas
 * Valida que las columnas clave existan
 */
export async function verifyVentasIntegrity(): Promise<{
  valid: boolean
  issues: string[]
  stats: {
    total: number
    pagadas: number
    pendientes: number
    parciales: number
    sumaIngresos: number
  }
}> {
  const result = {
    valid: true,
    issues: [] as string[],
    stats: {
      total: 0,
      pagadas: 0,
      pendientes: 0,
      parciales: 0,
      sumaIngresos: 0,
    },
  }

  try {
    const q = query(collection(db!, 'ventas'))
    const snapshot = await getDocs(q)

    const requiredFields = ['cliente', 'cantidad', 'precioVentaUnidad', 'estadoPago']

    snapshot.forEach((doc) => {
      const data = doc.data()
      result.stats.total++

      // Verificar campos requeridos
      for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null) {
          result.issues.push(`Venta ${doc.id} falta campo: ${field}`)
          result.valid = false
        }
      }

      // Contar por estado
      const estado = data.estadoPago?.toLowerCase()
      if (estado === 'completo' || estado === 'pagado') {
        result.stats.pagadas++
      } else if (estado === 'pendiente') {
        result.stats.pendientes++
      } else if (estado === 'parcial') {
        result.stats.parciales++
      }

      // Sumar ingresos
      const ingreso = parseFloat(data.ingreso?.toString() || data.precioTotalVenta?.toString() || '0')
      if (!isNaN(ingreso)) {
        result.stats.sumaIngresos += ingreso
      }
    })

  } catch (error) {
    result.valid = false
    result.issues.push(`Error al verificar ventas: ${error instanceof Error ? error.message : String(error)}`)
  }

  return result
}

/**
 * Verificar integridad de utilidades
 */
export async function verifyUtilidadesIntegrity(): Promise<{
  valid: boolean
  issues: string[]
  stats: {
    total: number
    clientesUnicos: number
    sumaIngresos: number
  }
}> {
  const result = {
    valid: true,
    issues: [] as string[],
    stats: {
      total: 0,
      clientesUnicos: 0,
      sumaIngresos: 0,
    },
  }

  try {
    const q = query(collection(db!, 'utilidades'))
    const snapshot = await getDocs(q)

    const clientes = new Set<string>()
    const requiredFields = ['ingreso']

    snapshot.forEach((doc) => {
      const data = doc.data()
      result.stats.total++

      // Verificar campos requeridos
      for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null) {
          result.issues.push(`Utilidad ${doc.id} falta campo: ${field}`)
          result.valid = false
        }
      }

      // Contar clientes únicos
      if (data.cliente) {
        clientes.add(data.cliente)
      }

      // Sumar ingresos
      const ingreso = parseFloat(data.ingreso?.toString() || '0')
      if (!isNaN(ingreso)) {
        result.stats.sumaIngresos += ingreso
      }
    })

    result.stats.clientesUnicos = clientes.size

  } catch (error) {
    result.valid = false
    result.issues.push(`Error al verificar utilidades: ${error instanceof Error ? error.message : String(error)}`)
  }

  return result
}

/**
 * Generar reporte completo de verificación
 */
export async function generateFullReport(): Promise<void> {
  logger.info('═'.repeat(70), { context: 'VerifyMigration' })
  logger.info('🔍 REPORTE DE VERIFICACIÓN DE DATOS EN FIRESTORE', { context: 'VerifyMigration' })
  logger.info('═'.repeat(70), { context: 'VerifyMigration' })
  logger.info(`📅 Fecha: ${new Date().toLocaleString('es-MX')}`, { context: 'VerifyMigration' })

  // Verificar todas las colecciones
  const report = await verifyAllCollections()

  logger.info('📊 RESUMEN DE COLECCIONES:', { 
    context: 'VerifyMigration',
    data: report.collections.map(c => ({
      Colección: c.name,
      Documentos: c.documentCount,
      Total: `$${c.totalMoney.toLocaleString()}`,
      Estado: c.status,
    })),
  })

  // Verificar integridad de ventas
  const ventasIntegrity = await verifyVentasIntegrity()
  logger.info('📋 INTEGRIDAD DE VENTAS:', { 
    context: 'VerifyMigration',
    data: {
      total: ventasIntegrity.stats.total,
      pagadas: ventasIntegrity.stats.pagadas,
      pendientes: ventasIntegrity.stats.pendientes,
      parciales: ventasIntegrity.stats.parciales,
      sumaIngresos: `$${ventasIntegrity.stats.sumaIngresos.toLocaleString()}`,
      integridad: ventasIntegrity.valid ? '✅ OK' : '❌ Problemas encontrados',
      problemas: ventasIntegrity.issues.slice(0, 5),
    },
  })

  // Verificar integridad de utilidades
  const utilIntegrity = await verifyUtilidadesIntegrity()
  logger.info('📋 INTEGRIDAD DE UTILIDADES:', { 
    context: 'VerifyMigration',
    data: {
      total: utilIntegrity.stats.total,
      clientesUnicos: utilIntegrity.stats.clientesUnicos,
      sumaIngresos: `$${utilIntegrity.stats.sumaIngresos.toLocaleString()}`,
      integridad: utilIntegrity.valid ? '✅ OK' : '❌ Problemas encontrados',
    },
  })

  // Resumen final
  logger.info('📈 RESUMEN EJECUTIVO', {
    context: 'VerifyMigration',
    data: {
      totalDocumentos: report.totalDocuments,
      totalDinero: `$${report.totalMoney.toLocaleString()}`,
      errores: report.errors.length,
      estado: report.errors.length === 0 && ventasIntegrity.valid && utilIntegrity.valid
        ? '✨ TODOS LOS DATOS VERIFICADOS CORRECTAMENTE'
        : '⚠️ SE ENCONTRARON PROBLEMAS QUE REQUIEREN ATENCIÓN',
    },
  })
}

// Exportar para uso en componentes
export default {
  verifyCollection,
  verifyAllCollections,
  verifyVentasIntegrity,
  verifyUtilidadesIntegrity,
  generateFullReport,
}
