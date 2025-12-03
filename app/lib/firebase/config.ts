/**
 * 🔥 Firebase Configuration - CHRONOS SYSTEM
 * 
 * ⚠️ MODO LOCAL ACTIVADO - Firebase deshabilitado
 * Todos los datos se almacenan en localStorage
 * 
 * Para reactivar Firebase, cambiar FORCE_LOCAL_MODE a false
 */

import { logger } from '../utils/logger'

// ============================================================
// 🚨 FORZAR MODO LOCAL - Sin Firebase
// ============================================================
const FORCE_LOCAL_MODE = true

// Flag para saber si Firebase está configurado correctamente
// SIEMPRE false cuando FORCE_LOCAL_MODE está activo
export const isFirebaseConfigured = false

// Exportar nulls - todo funciona con localStorage
export const db = null
export const auth = null
export default null

/**
 * Verificar si Firestore está disponible
 * SIEMPRE retorna false en modo local
 */
export function isFirestoreAvailable(): boolean {
  return false
}

/**
 * Verificar si la persistencia offline está habilitada
 */
export function isOfflinePersistenceEnabled(): boolean {
  return false
}

// Log de inicialización
if (typeof window !== 'undefined') {
  logger.info('📦 [CHRONOS] Modo LOCAL activado - Datos en localStorage', { context: 'FirebaseConfig' })
}
