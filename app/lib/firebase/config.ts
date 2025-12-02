/**
 * 🔥 Firebase Configuration - CHRONOS SYSTEM
 * 
 * ⚠️ IMPORTANTE: Las credenciales deben estar en variables de entorno (.env.local)
 * NO hardcodear credenciales reales en el código.
 * 
 * Variables requeridas en .env.local:
 * - NEXT_PUBLIC_FIREBASE_API_KEY
 * - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - NEXT_PUBLIC_FIREBASE_APP_ID
 * 
 * Características:
 * - Persistencia offline con IndexedDB
 * - Sincronización automática al recuperar conexión
 * - Cache local para operaciones offline
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { 
  getFirestore, 
  type Firestore,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'
import { logger } from '../utils/logger'

// Validar que las variables de entorno estén configuradas
const validateEnvVars = (): boolean => {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ]
  
  const missingVars = requiredVars.filter(
    varName => !process.env[varName],
  )
  
  if (missingVars.length > 0 && typeof window !== 'undefined') {
    logger.warn(
      `[Firebase] Variables de entorno faltantes: ${missingVars.join(', ')}. ` +
      'El sistema funcionará en modo mock.',
      { context: 'FirebaseConfig' },
    )
    return false
  }
  
  return true
}

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
}

// Flag para saber si Firebase está configurado correctamente
export const isFirebaseConfigured = validateEnvVars()

// Flag para saber si la persistencia offline está habilitada
let offlinePersistenceEnabled = false

// Inicializar Firebase solo si hay configuración válida
let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

/**
 * Habilitar persistencia offline con IndexedDB
 * Permite que la app funcione sin conexión a internet
 */
async function enableOfflinePersistence(firestore: Firestore): Promise<void> {
  if (typeof window === 'undefined' || offlinePersistenceEnabled) return

  try {
    // Intentar multi-tab primero (permite múltiples pestañas)
    await enableMultiTabIndexedDbPersistence(firestore)
    offlinePersistenceEnabled = true
    logger.info('[Firebase] ✅ Persistencia offline multi-tab habilitada', { context: 'FirebaseConfig' })
  } catch (err) {
    const error = err as { code?: string }
    if (error.code === 'failed-precondition') {
      // Múltiples pestañas abiertas, solo una puede tener persistencia
      logger.warn('[Firebase] ⚠️ Otra pestaña tiene persistencia activa', { context: 'FirebaseConfig' })
      
      // Intentar persistencia de una sola pestaña como fallback
      try {
        await enableIndexedDbPersistence(firestore)
        offlinePersistenceEnabled = true
        logger.info('[Firebase] ✅ Persistencia offline single-tab habilitada', { context: 'FirebaseConfig' })
      } catch {
        logger.warn('[Firebase] ⚠️ No se pudo habilitar persistencia offline', { context: 'FirebaseConfig' })
      }
    } else if (error.code === 'unimplemented') {
      // El navegador no soporta IndexedDB
      logger.warn('[Firebase] ⚠️ El navegador no soporta persistencia offline', { context: 'FirebaseConfig' })
    } else {
      logger.error('[Firebase] Error habilitando persistencia offline', err, { context: 'FirebaseConfig' })
    }
  }
}

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    
    // Inicializar Firestore con configuración optimizada para offline
    if (typeof window !== 'undefined') {
      // En cliente: usar persistencia local
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
            cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          }),
        })
        offlinePersistenceEnabled = true
        logger.info('[Firebase] ✅ Firestore con persistencia offline (nueva API)', { context: 'FirebaseConfig' })
      } catch {
        // Fallback a getFirestore si initializeFirestore falla
        db = getFirestore(app)
        // Intentar habilitar persistencia con API legacy
        enableOfflinePersistence(db).catch(() => {
          // Silently fail - ya se logueó el error
        })
      }
    } else {
      // En servidor: sin persistencia
      db = getFirestore(app)
    }
    
    auth = getAuth(app)
    
    if (typeof window !== 'undefined') {
      logger.info('[Firebase] ✅ Inicializado correctamente', { 
        context: 'FirebaseConfig',
        data: { offlinePersistence: offlinePersistenceEnabled },
      })
    }
  } else {
    if (typeof window !== 'undefined') {
      logger.warn(
        '[Firebase] ⚠️ Sin configuración - usando modo mock',
        { context: 'FirebaseConfig' },
      )
    }
  }
} catch (error) {
  logger.error('[Firebase] Error de inicialización', error, { context: 'FirebaseConfig' })
}

// Exportar con valores por defecto para evitar errores en modo mock
export { db, auth }
export default app

/**
 * Obtener instancia de Firestore garantizada (no null)
 * Lanza error si Firestore no está disponible
 * Usar solo cuando se necesita garantía de conexión
 */
export function getFirestoreInstance(): Firestore {
  if (!db) {
    throw new Error('Firestore no está configurado. Verifica las variables de entorno.')
  }
  return db
}

/**
 * Verificar si Firestore está disponible sin lanzar error
 * Retorna true si db no es null
 */
export function isFirestoreAvailable(): boolean {
  return db !== null && isFirebaseConfigured
}

/**
 * Verificar si la persistencia offline está habilitada
 */
export function isOfflinePersistenceEnabled(): boolean {
  return offlinePersistenceEnabled
}
