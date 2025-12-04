/**
 * 🔥 Firebase Configuration - CHRONOS SYSTEM
 * 
 * Configuración dual: Firebase real o modo local (localStorage)
 * 
 * Para usar Firebase real:
 * 1. Configurar variables de entorno en .env.local
 * 2. Cambiar FORCE_LOCAL_MODE a false
 * 
 * Variables necesarias:
 * - NEXT_PUBLIC_FIREBASE_API_KEY
 * - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - NEXT_PUBLIC_FIREBASE_APP_ID
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore, enableMultiTabIndexedDbPersistence, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'
import { logger } from '../utils/logger'

// ============================================================
// 🚨 MODO DE OPERACIÓN
// ============================================================
// Cambiar a false para usar Firebase real (requiere .env.local)
const FORCE_LOCAL_MODE = process.env.NEXT_PUBLIC_FORCE_LOCAL_MODE === 'true' || 
                         !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

// ============================================================
// FIREBASE CONFIG
// ============================================================
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null
let isFirebaseConfigured = false
let offlinePersistenceEnabled = false

// Solo inicializar si no estamos en modo local
if (!FORCE_LOCAL_MODE && firebaseConfig.projectId) {
  try {
    // Verificar si ya existe una app
    const existingApps = getApps()
    if (existingApps.length > 0) {
      app = existingApps[0]
    } else {
      app = initializeApp(firebaseConfig)
    }
    
    // Inicializar servicios
    db = getFirestore(app)
    auth = getAuth(app)
    isFirebaseConfigured = true
    
    // Habilitar persistencia offline (solo en cliente)
    if (typeof window !== 'undefined') {
      enableMultiTabIndexedDbPersistence(db)
        .then(() => {
          offlinePersistenceEnabled = true
          logger.info('🔥 [Firebase] Persistencia offline habilitada', { context: 'FirebaseConfig' })
        })
        .catch((err) => {
          // Si falla porque ya está habilitada, ignorar
          if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
            logger.warn('⚠️ [Firebase] Error habilitando persistencia offline', { context: 'FirebaseConfig' })
          }
        })
    }
    
    logger.info('🔥 [Firebase] Conectado exitosamente', {
      context: 'FirebaseConfig',
      data: { projectId: firebaseConfig.projectId },
    })
    
  } catch (error) {
    logger.error('❌ [Firebase] Error de inicialización', error as Error, { context: 'FirebaseConfig' })
    // Fallback a modo local
    db = null
    auth = null
    isFirebaseConfigured = false
  }
} else {
  // Modo local
  if (typeof window !== 'undefined') {
    logger.info('📦 [CHRONOS] Modo LOCAL activado - Datos en localStorage', { context: 'FirebaseConfig' })
  }
}

// ============================================================
// EXPORTS
// ============================================================

export { db, auth, isFirebaseConfigured }
export default app

/**
 * Verificar si Firestore está disponible
 */
export function isFirestoreAvailable(): boolean {
  return isFirebaseConfigured && db !== null
}

/**
 * Verificar si la persistencia offline está habilitada
 */
export function isOfflinePersistenceEnabled(): boolean {
  return offlinePersistenceEnabled
}

/**
 * Verificar si estamos en modo local
 */
export function isLocalMode(): boolean {
  return FORCE_LOCAL_MODE || !isFirebaseConfigured
}
