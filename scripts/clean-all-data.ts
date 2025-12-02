#!/usr/bin/env node

/**
 * 🧹 SCRIPT DE LIMPIEZA TOTAL - CHRONOS SYSTEM
 * Elimina TODOS los datos de Firestore y localStorage
 * 
 * Uso:
 *   npx tsx scripts/clean-all-data.ts
 *   # o
 *   pnpm clean:data
 */

import * as admin from 'firebase-admin'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ============================================================
// CONFIGURACIÓN
// ============================================================

// Colecciones a limpiar en Firestore
const COLECCIONES = [
  'ventas',
  'clientes',
  'distribuidores',
  'ordenes_compra',
  'productos',
  'almacen',
  'almacen_entradas',
  'almacen_salidas',
  'movimientos',
  'transferencias',
  'ingresos',
  'gastos',
  'abonos',
  'dashboard_totales',
  'dashboard_paneles',
  // Colecciones específicas de bancos
  'bancos',
  'boveda_monte',
  'boveda_monte_ingresos',
  'boveda_monte_gastos',
  'boveda_monte_cortes',
  'boveda_usa',
  'boveda_usa_ingresos',
  'boveda_usa_gastos',
  'boveda_usa_cortes',
  'utilidades',
  'utilidades_ingresos',
  'utilidades_gastos',
  'utilidades_cortes',
  'flete_sur',
  'flete_sur_ingresos',
  'flete_sur_gastos',
  'flete_sur_cortes',
  'azteca',
  'azteca_ingresos',
  'azteca_gastos',
  'azteca_cortes',
  'leftie',
  'leftie_ingresos',
  'leftie_gastos',
  'leftie_cortes',
  'profit',
  'profit_ingresos',
  'profit_gastos',
  'profit_cortes',
]

// Keys de localStorage a limpiar (para uso en browser)
const LOCAL_STORAGE_KEYS = [
  'chronos_bancos',
  'chronos_ordenes_compra',
  'chronos_ventas',
  'chronos_distribuidores',
  'chronos_clientes',
  'chronos_productos',
  'chronos_movimientos',
  'chronos_transferencias',
  'chronos_abonos',
  'chronos_ingresos',
  'chronos_gastos',
]

// ============================================================
// FUNCIONES DE LIMPIEZA
// ============================================================

async function initializeFirebase(): Promise<admin.firestore.Firestore | null> {
  // Buscar service account
  const possiblePaths = [
    resolve(process.cwd(), 'serviceAccountKey.json'),
    resolve(process.cwd(), 'firebase-admin-key.json'),
    resolve(process.cwd(), 'service-account.json'),
  ]

  let serviceAccountPath: string | null = null
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      serviceAccountPath = p
      break
    }
  }

  if (!serviceAccountPath) {
    console.log('⚠️  No se encontró archivo de credenciales de Firebase Admin')
    console.log('   Coloca un archivo serviceAccountKey.json en la raíz del proyecto')
    console.log('   Puedes descargarlo desde: Firebase Console > Project Settings > Service Accounts')
    return null
  }

  try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
    }
    
    return admin.firestore()
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error)
    return null
  }
}

async function limpiarColeccion(db: admin.firestore.Firestore, coleccion: string): Promise<number> {
  try {
    const snapshot = await db.collection(coleccion).get()
    
    if (snapshot.empty) {
      return 0
    }

    const batch = db.batch()
    let count = 0

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
      count++
    })

    await batch.commit()
    return count
  } catch (error) {
    // Ignorar errores de colecciones que no existen
    return 0
  }
}

async function limpiarFirestore(): Promise<void> {
  console.log('\n🔥 LIMPIEZA DE FIRESTORE')
  console.log('========================\n')

  const db = await initializeFirebase()
  
  if (!db) {
    console.log('⚠️  Firestore no disponible - saltando limpieza de Firestore\n')
    return
  }

  let totalEliminados = 0

  for (const coleccion of COLECCIONES) {
    const eliminados = await limpiarColeccion(db, coleccion)
    if (eliminados > 0) {
      console.log(`   ✓ ${coleccion}: ${eliminados} documentos eliminados`)
      totalEliminados += eliminados
    }
  }

  if (totalEliminados === 0) {
    console.log('   ℹ️  Firestore ya estaba vacío')
  } else {
    console.log(`\n   ✅ Total: ${totalEliminados} documentos eliminados de Firestore`)
  }
}

function generarScriptLimpiezaLocalStorage(): void {
  console.log('\n💾 SCRIPT PARA LIMPIAR localStorage')
  console.log('====================================\n')
  console.log('Ejecuta este código en la consola del navegador:\n')
  console.log('```javascript')
  console.log(`// Limpiar datos de CHRONOS en localStorage
${LOCAL_STORAGE_KEYS.map(key => `localStorage.removeItem('${key}');`).join('\n')}
console.log('✅ localStorage limpiado');
location.reload();`)
  console.log('```\n')
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('\n')
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║        🧹 CHRONOS SYSTEM - LIMPIEZA TOTAL DE DATOS          ║')
  console.log('║                                                              ║')
  console.log('║  Este script elimina TODOS los datos del sistema:           ║')
  console.log('║  - Firestore (todas las colecciones)                        ║')
  console.log('║  - localStorage (datos locales del navegador)               ║')
  console.log('║                                                              ║')
  console.log('║  ⚠️  ESTA ACCIÓN ES IRREVERSIBLE                             ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log('\n')

  // Limpiar Firestore
  await limpiarFirestore()

  // Generar script para localStorage
  generarScriptLimpiezaLocalStorage()

  console.log('\n🎉 LIMPIEZA COMPLETADA')
  console.log('=======================\n')
  console.log('El sistema está ahora limpio y listo para pruebas.\n')
  console.log('Para reiniciar la aplicación:')
  console.log('   pnpm dev\n')
}

main().catch(console.error)
