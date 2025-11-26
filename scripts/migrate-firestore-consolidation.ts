#!/usr/bin/env npx ts-node
/**
 * 🔄 SCRIPT DE MIGRACIÓN - CHRONOS SYSTEM
 * 
 * Este script consolida todas las colecciones fragmentadas en la estructura definitiva.
 * 
 * MIGRACIONES:
 * 1. *_ingresos, transacciones*, gya → movimientos
 * 2. ventas_local → ventas (deduplicar)
 * 3. Actualizar capitalActual en bancos
 * 
 * USO:
 *   npx ts-node scripts/migrate-firestore-consolidation.ts --dry-run    # Ver qué haría
 *   npx ts-node scripts/migrate-firestore-consolidation.ts              # Ejecutar
 *   npx ts-node scripts/migrate-firestore-consolidation.ts --cleanup    # Eliminar colecciones antiguas
 */

import * as admin from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

// ===================================================================
// CONFIGURACIÓN
// ===================================================================

const DRY_RUN = process.argv.includes('--dry-run')
const CLEANUP = process.argv.includes('--cleanup')
const BATCH_SIZE = 500

// Mapeo de nombres de colecciones legacy a bancoId normalizado
const BANCO_ID_MAP: Record<string, string> = {
  'boveda_monte_ingresos': 'boveda_monte',
  'bovedaMonte': 'boveda_monte',
  'Bóveda Monte': 'boveda_monte',
  'Boveda Monte': 'boveda_monte',
  'boveda_usa_ingresos': 'boveda_usa',
  'bovedaUsa': 'boveda_usa',
  'bovedaUSA': 'boveda_usa',
  'Bóveda USA': 'boveda_usa',
  'profit_ingresos': 'profit',
  'Profit': 'profit',
  'leftie_ingresos': 'leftie',
  'Leftie': 'leftie',
  'azteca_ingresos': 'azteca',
  'Azteca': 'azteca',
  'flete_sur_ingresos': 'flete_sur',
  'fleteSur': 'flete_sur',
  'Flete Sur': 'flete_sur',
  'utilidades_ingresos': 'utilidades',
  'Utilidades': 'utilidades',
}

// Colecciones a migrar a 'movimientos'
const COLECCIONES_MOVIMIENTOS = [
  'boveda_monte_ingresos',
  'boveda_usa_ingresos',
  'profit_ingresos',
  'leftie_ingresos',
  'azteca_ingresos',
  'flete_sur_ingresos',
  'utilidades_ingresos',
  'transaccionesBoveda',
  'transaccionesBanco',
  'transferencias',
  'gya',
]

// Colecciones a eliminar después de migración exitosa
const COLECCIONES_OBSOLETAS = [
  ...COLECCIONES_MOVIMIENTOS,
  'ordenesCompra',      // Usar ordenes_compra
  'compras',            // Duplicado
  'ventas_local',       // Migrado a ventas
  'productos',          // Usar almacen_productos
  'inventario',         // Usar almacen
  'usuarios',           // Usar user_profiles
  'dashboard',          // Usar dashboard_paneles
]

// ===================================================================
// INICIALIZACIÓN FIREBASE
// ===================================================================

let db: admin.firestore.Firestore

async function initFirebase() {
  if (admin.apps.length === 0) {
    // Usar credenciales de aplicación default (gcloud auth)
    admin.initializeApp({
      projectId: 'premium-ecosystem-1760790572'
    })
  }
  db = admin.firestore()
  console.log('✅ Firebase inicializado')
}

// ===================================================================
// UTILIDADES
// ===================================================================

function normalizeBancoId(input: string | undefined | null): string {
  if (!input) return 'sin_banco'
  
  // Buscar en el mapa
  const normalized = BANCO_ID_MAP[input]
  if (normalized) return normalized
  
  // Si ya es un ID válido, devolverlo
  const validIds = ['boveda_monte', 'boveda_usa', 'profit', 'leftie', 'azteca', 'flete_sur', 'utilidades']
  if (validIds.includes(input.toLowerCase())) {
    return input.toLowerCase()
  }
  
  // Intentar inferir del nombre
  const lower = input.toLowerCase()
  if (lower.includes('monte')) return 'boveda_monte'
  if (lower.includes('usa')) return 'boveda_usa'
  if (lower.includes('profit')) return 'profit'
  if (lower.includes('leftie')) return 'leftie'
  if (lower.includes('azteca')) return 'azteca'
  if (lower.includes('flete')) return 'flete_sur'
  if (lower.includes('utilidad')) return 'utilidades'
  
  return 'sin_banco'
}

function normalizeTipoMovimiento(data: Record<string, unknown>, coleccionOrigen: string): string {
  const tipo = (data.tipo as string || '').toLowerCase()
  const tipoMov = (data.tipoMovimiento as string || '').toLowerCase()
  
  // Si ya tiene tipoMovimiento válido
  if (['ingreso', 'gasto', 'transferencia_entrada', 'transferencia_salida'].includes(tipoMov)) {
    return tipoMov
  }
  
  // Inferir de colección origen
  if (coleccionOrigen.includes('_ingresos')) return 'ingreso'
  if (coleccionOrigen === 'transferencias') {
    // Determinar si es entrada o salida basado en otros campos
    const monto = Number(data.monto || 0)
    return monto >= 0 ? 'transferencia_entrada' : 'transferencia_salida'
  }
  
  // Inferir de campo tipo
  if (tipo === 'ingreso' || tipo === 'abono') return 'ingreso'
  if (tipo === 'gasto' || tipo === 'egreso') return 'gasto'
  
  // Default
  return tipo || 'gasto'
}

function parseDate(value: unknown): Timestamp {
  if (!value) return Timestamp.now()
  
  if (value instanceof Timestamp) return value
  if (value instanceof Date) return Timestamp.fromDate(value)
  
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    if ('_seconds' in obj && '_nanoseconds' in obj) {
      return new Timestamp(obj._seconds as number, obj._nanoseconds as number)
    }
    if ('seconds' in obj && 'nanoseconds' in obj) {
      return new Timestamp(obj.seconds as number, obj.nanoseconds as number)
    }
  }
  
  if (typeof value === 'string') {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return Timestamp.fromDate(date)
    }
  }
  
  return Timestamp.now()
}

function parseMonto(value: unknown): number {
  if (typeof value === 'number') return Math.abs(value)
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/[,$]/g, ''))
    return isNaN(num) ? 0 : Math.abs(num)
  }
  return 0
}

// ===================================================================
// MIGRACIÓN DE MOVIMIENTOS
// ===================================================================

interface MovimientoNormalizado {
  id: string
  bancoId: string
  tipoMovimiento: string
  monto: number
  fecha: Timestamp
  concepto: string
  cliente?: string
  destino?: string
  origen?: string
  observaciones?: string
  coleccionOrigen: string
  idOriginal: string
  createdAt: Timestamp
  updatedAt: Timestamp
  migratedAt: Timestamp
}

async function migrarMovimientos(): Promise<number> {
  console.log('\n📊 FASE 1: Migración de Movimientos')
  console.log('=' .repeat(50))
  
  let totalMigrados = 0
  const movimientosDestino = db.collection('movimientos')
  
  for (const coleccion of COLECCIONES_MOVIMIENTOS) {
    console.log(`\n📁 Procesando: ${coleccion}`)
    
    try {
      const snapshot = await db.collection(coleccion).get()
      
      if (snapshot.empty) {
        console.log(`   ⚪ Vacía - saltando`)
        continue
      }
      
      console.log(`   📄 ${snapshot.size} documentos encontrados`)
      
      const movimientos: MovimientoNormalizado[] = []
      
      for (const doc of snapshot.docs) {
        const data = doc.data()
        
        // Determinar bancoId
        let bancoId = normalizeBancoId(
          data.bancoId || data.panel || data.destino || coleccion
        )
        
        // Para colecciones específicas de banco, usar el nombre de la colección
        if (coleccion.endsWith('_ingresos')) {
          bancoId = normalizeBancoId(coleccion)
        }
        
        const mov: MovimientoNormalizado = {
          id: `MOV-${coleccion.substring(0, 4).toUpperCase()}-${doc.id}`,
          bancoId,
          tipoMovimiento: normalizeTipoMovimiento(data, coleccion),
          monto: parseMonto(data.monto || data.Ingreso || data.Gasto || data.valor || data.cantidad || 0),
          fecha: parseDate(data.fecha || data.Fecha || data.createdAt),
          concepto: String(data.concepto || data.Concepto || data.observaciones || ''),
          cliente: data.cliente || data.Cliente || undefined,
          destino: data.destino || data.Destino || undefined,
          origen: data.origen || data.Origen || data['Origen del Gastos o Abono'] || undefined,
          observaciones: data.observaciones || data.Observaciones || undefined,
          coleccionOrigen: coleccion,
          idOriginal: doc.id,
          createdAt: parseDate(data.createdAt),
          updatedAt: parseDate(data.updatedAt || data.createdAt),
          migratedAt: Timestamp.now(),
        }
        
        movimientos.push(mov)
      }
      
      // Guardar en batches
      if (!DRY_RUN) {
        let batch = db.batch()
        let batchCount = 0
        
        for (const mov of movimientos) {
          const docRef = movimientosDestino.doc(mov.id)
          batch.set(docRef, mov, { merge: true })
          batchCount++
          
          if (batchCount >= BATCH_SIZE) {
            await batch.commit()
            batch = db.batch()
            batchCount = 0
            console.log(`   ✅ Batch de ${BATCH_SIZE} guardado`)
          }
        }
        
        if (batchCount > 0) {
          await batch.commit()
        }
      }
      
      console.log(`   ✅ ${movimientos.length} movimientos ${DRY_RUN ? '(dry-run)' : 'migrados'}`)
      totalMigrados += movimientos.length
      
    } catch (error) {
      console.error(`   ❌ Error en ${coleccion}:`, error)
    }
  }
  
  console.log(`\n📊 Total movimientos: ${totalMigrados}`)
  return totalMigrados
}

// ===================================================================
// MIGRACIÓN DE VENTAS_LOCAL
// ===================================================================

async function migrarVentasLocal(): Promise<number> {
  console.log('\n📊 FASE 2: Migración de ventas_local → ventas')
  console.log('=' .repeat(50))
  
  try {
    const ventasLocalSnapshot = await db.collection('ventas_local').get()
    
    if (ventasLocalSnapshot.empty) {
      console.log('⚪ ventas_local está vacía - saltando')
      return 0
    }
    
    console.log(`📄 ${ventasLocalSnapshot.size} documentos en ventas_local`)
    
    // Obtener IDs existentes en ventas para deduplicar
    const ventasExistentes = await db.collection('ventas').get()
    const idsExistentes = new Set(ventasExistentes.docs.map(d => d.id))
    
    let migradas = 0
    let duplicadas = 0
    
    if (!DRY_RUN) {
      let batch = db.batch()
      let batchCount = 0
      
      for (const doc of ventasLocalSnapshot.docs) {
        const data = doc.data()
        
        // Verificar duplicado
        if (idsExistentes.has(doc.id)) {
          duplicadas++
          continue
        }
        
        const docRef = db.collection('ventas').doc(doc.id)
        batch.set(docRef, {
          ...data,
          migratedFrom: 'ventas_local',
          migratedAt: Timestamp.now(),
        }, { merge: true })
        
        batchCount++
        migradas++
        
        if (batchCount >= BATCH_SIZE) {
          await batch.commit()
          batch = db.batch()
          batchCount = 0
        }
      }
      
      if (batchCount > 0) {
        await batch.commit()
      }
    } else {
      // Dry run - solo contar
      for (const doc of ventasLocalSnapshot.docs) {
        if (idsExistentes.has(doc.id)) {
          duplicadas++
        } else {
          migradas++
        }
      }
    }
    
    console.log(`✅ ${migradas} ventas migradas ${DRY_RUN ? '(dry-run)' : ''}`)
    console.log(`⚠️  ${duplicadas} duplicadas ignoradas`)
    
    return migradas
    
  } catch (error) {
    console.error('❌ Error migrando ventas_local:', error)
    return 0
  }
}

// ===================================================================
// ACTUALIZAR CAPITALES DE BANCOS
// ===================================================================

async function actualizarCapitalesBancos(): Promise<void> {
  console.log('\n📊 FASE 3: Actualizar capitales de bancos')
  console.log('=' .repeat(50))
  
  const bancosIds = ['boveda_monte', 'boveda_usa', 'profit', 'leftie', 'azteca', 'flete_sur', 'utilidades']
  
  for (const bancoId of bancosIds) {
    try {
      // Obtener todos los movimientos del banco
      const movimientos = await db.collection('movimientos')
        .where('bancoId', '==', bancoId)
        .get()
      
      let ingresos = 0
      let gastos = 0
      
      for (const doc of movimientos.docs) {
        const data = doc.data()
        const monto = Number(data.monto) || 0
        const tipo = data.tipoMovimiento || ''
        
        if (tipo === 'ingreso' || tipo === 'transferencia_entrada') {
          ingresos += monto
        } else if (tipo === 'gasto' || tipo === 'transferencia_salida') {
          gastos += monto
        }
      }
      
      const capitalActual = ingresos - gastos
      
      console.log(`💰 ${bancoId}: Ingresos=$${ingresos.toLocaleString()}, Gastos=$${gastos.toLocaleString()}, Capital=$${capitalActual.toLocaleString()}`)
      
      if (!DRY_RUN) {
        // Actualizar o crear documento del banco
        await db.collection('bancos').doc(bancoId).set({
          id: bancoId,
          capitalActual,
          historicoIngresos: ingresos,
          historicoGastos: gastos,
          totalMovimientos: movimientos.size,
          updatedAt: Timestamp.now(),
        }, { merge: true })
      }
      
    } catch (error) {
      console.error(`❌ Error actualizando ${bancoId}:`, error)
    }
  }
  
  console.log(`\n✅ Capitales actualizados ${DRY_RUN ? '(dry-run)' : ''}`)
}

// ===================================================================
// LIMPIEZA DE COLECCIONES OBSOLETAS
// ===================================================================

async function limpiarColeccionesObsoletas(): Promise<void> {
  if (!CLEANUP) {
    console.log('\n⚠️  Para eliminar colecciones obsoletas, ejecuta con --cleanup')
    return
  }
  
  console.log('\n🗑️  FASE 4: Limpieza de colecciones obsoletas')
  console.log('=' .repeat(50))
  console.log('⚠️  ADVERTENCIA: Esta operación es IRREVERSIBLE')
  
  for (const coleccion of COLECCIONES_OBSOLETAS) {
    try {
      const snapshot = await db.collection(coleccion).limit(1).get()
      
      if (snapshot.empty) {
        console.log(`⚪ ${coleccion}: Ya vacía`)
        continue
      }
      
      if (DRY_RUN) {
        console.log(`🔴 ${coleccion}: Se eliminaría (dry-run)`)
        continue
      }
      
      // Eliminar en batches
      const allDocs = await db.collection(coleccion).get()
      let batch = db.batch()
      let count = 0
      
      for (const doc of allDocs.docs) {
        batch.delete(doc.ref)
        count++
        
        if (count >= BATCH_SIZE) {
          await batch.commit()
          batch = db.batch()
          count = 0
        }
      }
      
      if (count > 0) {
        await batch.commit()
      }
      
      console.log(`✅ ${coleccion}: ${allDocs.size} documentos eliminados`)
      
    } catch (error) {
      console.error(`❌ Error eliminando ${coleccion}:`, error)
    }
  }
}

// ===================================================================
// REPORTE FINAL
// ===================================================================

async function generarReporte(): Promise<void> {
  console.log('\n📊 REPORTE FINAL')
  console.log('=' .repeat(50))
  
  const colecciones = [
    'movimientos',
    'ventas',
    'clientes',
    'distribuidores',
    'ordenes_compra',
    'bancos',
    'almacen_productos',
    'cortes_bancarios',
  ]
  
  for (const col of colecciones) {
    try {
      const snapshot = await db.collection(col).get()
      console.log(`📁 ${col}: ${snapshot.size} documentos`)
    } catch (error) {
      console.log(`📁 ${col}: Error al leer`)
    }
  }
}

// ===================================================================
// MAIN
// ===================================================================

async function main() {
  console.log('🔄 MIGRACIÓN FIRESTORE - CHRONOS SYSTEM')
  console.log('=' .repeat(50))
  
  if (DRY_RUN) {
    console.log('🔍 MODO: Dry-run (solo simulación)')
  } else if (CLEANUP) {
    console.log('🗑️  MODO: Limpieza de colecciones')
  } else {
    console.log('🚀 MODO: Migración real')
  }
  
  await initFirebase()
  
  // Ejecutar fases
  const movimientosMigrados = await migrarMovimientos()
  const ventasMigradas = await migrarVentasLocal()
  await actualizarCapitalesBancos()
  
  if (CLEANUP) {
    await limpiarColeccionesObsoletas()
  }
  
  await generarReporte()
  
  console.log('\n✅ MIGRACIÓN COMPLETADA')
  console.log(`   📊 Movimientos: ${movimientosMigrados}`)
  console.log(`   📦 Ventas: ${ventasMigradas}`)
  
  process.exit(0)
}

main().catch(error => {
  console.error('❌ Error fatal:', error)
  process.exit(1)
})
