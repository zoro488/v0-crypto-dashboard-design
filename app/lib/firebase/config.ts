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
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
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

// Inicializar Firebase solo si hay configuración válida
let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    db = getFirestore(app)
    auth = getAuth(app)
    
    if (typeof window !== 'undefined') {
      logger.info('[Firebase] ✅ Inicializado correctamente', { context: 'FirebaseConfig' })
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
