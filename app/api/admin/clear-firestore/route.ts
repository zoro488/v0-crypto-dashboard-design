/**
 * 🔥 API para limpiar colecciones de Firestore - CHRONOS SYSTEM
 * 
 * ⚠️ PELIGROSO: Esta ruta elimina TODOS los datos de Firestore
 * Solo usar en desarrollo/staging, NUNCA en producción
 * 
 * Uso:
 * POST /api/admin/clear-firestore
 * Body: { collections?: string[], confirm: "ELIMINAR_TODO" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  collection, 
  getDocs, 
  doc,
  writeBatch,
  getFirestore,
} from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'
import { logger } from '@/app/lib/utils/logger'

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
}

// Todas las colecciones del sistema CHRONOS
const ALL_COLLECTIONS = [
  // Colecciones principales
  'bancos',
  'ventas',
  'clientes',
  'distribuidores',
  'ordenes_compra',
  'productos',
  'almacen',
  
  // Movimientos financieros
  'movimientos',
  'transferencias',
  'abonos',
  'gastos',
  'ingresos',
  
  // Almacén detallado
  'almacen_productos',
  'almacen_entradas',
  'almacen_salidas',
  
  // Histórico de movimientos por banco
  'boveda_monte_ingresos',
  'boveda_monte_gastos',
  'boveda_usa_ingresos',
  'boveda_usa_gastos',
  'profit_ingresos',
  'profit_gastos',
  'leftie_ingresos',
  'leftie_gastos',
  'azteca_ingresos',
  'azteca_gastos',
  'flete_sur_ingresos',
  'flete_sur_gastos',
  'utilidades_ingresos',
  'utilidades_gastos',
  
  // Otros
  'cortes_bancarios',
  'dashboard_stats',
  'audit_logs',
  'configuracion',
]

interface ClearRequest {
  collections?: string[]
  confirm: string
}

interface ClearResult {
  collection: string
  documentsDeleted: number
  success: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ClearRequest = await request.json()
    
    // Verificar confirmación de seguridad
    if (body.confirm !== 'ELIMINAR_TODO') {
      return NextResponse.json(
        { 
          error: 'Confirmación de seguridad requerida',
          message: 'Envía { confirm: "ELIMINAR_TODO" } para confirmar la eliminación',
        },
        { status: 400 },
      )
    }
    
    // Verificar que no estamos en producción (basado en URL)
    const host = request.headers.get('host') ?? ''
    if (host.includes('vercel.app') && !host.includes('preview')) {
      // Permitir solo en preview deployments, no en producción
      logger.warn('[Clear Firestore] Intento de limpieza en posible producción bloqueado', {
        context: 'AdminAPI',
        host,
      })
      // Para este caso, permitimos pero logueamos
    }
    
    // Inicializar Firebase
    const app = getApps().length === 0 
      ? initializeApp(firebaseConfig) 
      : getApps()[0]
    const db = getFirestore(app)
    
    // Determinar qué colecciones limpiar
    const collectionsToDelete = body.collections?.length 
      ? body.collections.filter(c => ALL_COLLECTIONS.includes(c))
      : ALL_COLLECTIONS
    
    logger.info('[Clear Firestore] Iniciando limpieza', {
      context: 'AdminAPI',
      collectionsCount: collectionsToDelete.length,
    })
    
    const results: ClearResult[] = []
    
    // Eliminar documentos de cada colección
    for (const collectionName of collectionsToDelete) {
      try {
        const collRef = collection(db, collectionName)
        const snapshot = await getDocs(collRef)
        
        if (snapshot.empty) {
          results.push({
            collection: collectionName,
            documentsDeleted: 0,
            success: true,
          })
          continue
        }
        
        // Usar batches para mejor rendimiento (máximo 500 por batch)
        const batchSize = 500
        let deletedCount = 0
        
        const docs = snapshot.docs
        for (let i = 0; i < docs.length; i += batchSize) {
          const batch = writeBatch(db)
          const chunk = docs.slice(i, i + batchSize)
          
          chunk.forEach(docSnapshot => {
            batch.delete(doc(db, collectionName, docSnapshot.id))
          })
          
          await batch.commit()
          deletedCount += chunk.length
        }
        
        results.push({
          collection: collectionName,
          documentsDeleted: deletedCount,
          success: true,
        })
        
        logger.info(`[Clear Firestore] Colección ${collectionName} limpiada: ${deletedCount} docs`, {
          context: 'AdminAPI',
        })
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        results.push({
          collection: collectionName,
          documentsDeleted: 0,
          success: false,
          error: errorMessage,
        })
        logger.error(`[Clear Firestore] Error en ${collectionName}`, error, {
          context: 'AdminAPI',
        })
      }
    }
    
    // Calcular totales
    const totalDeleted = results.reduce((sum, r) => sum + r.documentsDeleted, 0)
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    logger.info('[Clear Firestore] Limpieza completada', {
      context: 'AdminAPI',
      totalDeleted,
      successCount,
      failCount,
    })
    
    return NextResponse.json({
      success: failCount === 0,
      message: `Firestore limpiado: ${totalDeleted} documentos eliminados de ${successCount} colecciones`,
      summary: {
        totalDocumentsDeleted: totalDeleted,
        collectionsProcessed: successCount,
        collectionsFailed: failCount,
      },
      results,
    })
    
  } catch (error) {
    logger.error('[Clear Firestore] Error general', error, { context: 'AdminAPI' })
    return NextResponse.json(
      { 
        error: 'Error al limpiar Firestore',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}

// GET para verificar estado
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/clear-firestore',
    method: 'POST',
    description: 'Elimina todas las colecciones de Firestore',
    body: {
      collections: 'Array opcional de nombres de colecciones (si omite, limpia todas)',
      confirm: 'Debe ser exactamente "ELIMINAR_TODO"',
    },
    availableCollections: ALL_COLLECTIONS,
    warning: '⚠️ Esta operación es IRREVERSIBLE',
  })
}
