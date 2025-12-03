/**
 * 🔐 Authentication Service - MODO LOCAL
 * 
 * ⚠️ FIREBASE DESHABILITADO - Autenticación simulada
 * Todos los datos se almacenan en localStorage
 * 
 * Simula autenticación para desarrollo sin Firebase
 */

import { logger } from '../utils/logger'

// ============================================================
// 🚨 MODO LOCAL - Sin Firebase Auth
// ============================================================

// Tipo de usuario local (compatible con Firebase User)
export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

// Usuario mock para desarrollo
const MOCK_USER: User = {
  uid: 'local-user-001',
  email: 'admin@chronos.local',
  displayName: 'Admin CHRONOS',
  photoURL: null,
}

// Estado de autenticación local
let currentUser: User | null = null
let authListeners: Array<(user: User | null) => void> = []

// Cargar usuario de localStorage al iniciar
if (typeof window !== 'undefined') {
  const savedUser = localStorage.getItem('chronos_auth_user')
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser)
    } catch {
      currentUser = null
    }
  }
}

/**
 * Notificar a todos los listeners
 */
function notifyAuthListeners() {
  authListeners.forEach((callback) => callback(currentUser))
}

/**
 * Obtener instancia de Auth (mock)
 */
export function getAuthInstance() {
  return {
    currentUser,
  }
}

/**
 * Crear usuario (mock - desarrollo local)
 */
export async function signUp(email: string, password: string, displayName?: string) {
  try {
    const user: User = {
      uid: `local-${Date.now()}`,
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: null,
    }

    currentUser = user
    if (typeof window !== 'undefined') {
      localStorage.setItem('chronos_auth_user', JSON.stringify(user))
    }
    notifyAuthListeners()

    logger.info('Usuario registrado (LOCAL)', { 
      context: 'Auth',
      data: { userId: user.uid, email: user.email },
    })

    return { user, error: null }
  } catch (error) {
    logger.error('Error en signUp', error, { context: 'Auth' })
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Error al crear usuario',
    }
  }
}

/**
 * Login (mock - desarrollo local)
 * Acepta cualquier credencial para desarrollo
 */
export async function signIn(email: string, _password: string) {
  try {
    const user: User = {
      uid: `local-${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      photoURL: null,
    }

    currentUser = user
    if (typeof window !== 'undefined') {
      localStorage.setItem('chronos_auth_user', JSON.stringify(user))
    }
    notifyAuthListeners()

    logger.info('Usuario inició sesión (LOCAL)', { 
      context: 'Auth',
      data: { userId: user.uid, email: user.email },
    })

    return { user, error: null }
  } catch (error) {
    logger.error('Error en signIn', error, { context: 'Auth' })
    return { user: null, error: 'Error al iniciar sesión' }
  }
}

/**
 * Login con Google (mock - desarrollo local)
 */
export async function signInWithGoogle() {
  try {
    currentUser = MOCK_USER
    if (typeof window !== 'undefined') {
      localStorage.setItem('chronos_auth_user', JSON.stringify(MOCK_USER))
    }
    notifyAuthListeners()

    logger.info('Usuario inició sesión con Google (LOCAL)', { 
      context: 'Auth',
      data: { userId: MOCK_USER.uid, email: MOCK_USER.email },
    })

    return { user: MOCK_USER, error: null }
  } catch (error) {
    logger.error('Error en signInWithGoogle', error, { context: 'Auth' })
    return { user: null, error: 'Error al iniciar sesión con Google' }
  }
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  try {
    currentUser = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chronos_auth_user')
    }
    notifyAuthListeners()

    logger.info('Usuario cerró sesión (LOCAL)', { context: 'Auth' })

    return { error: null }
  } catch (error) {
    logger.error('Error en signOut', error, { context: 'Auth' })
    return { 
      error: error instanceof Error ? error.message : 'Error al cerrar sesión',
    }
  }
}

/**
 * Restablecer contraseña (mock)
 */
export async function resetPassword(email: string) {
  logger.info('Email de restablecimiento enviado (LOCAL - simulado)', { 
    context: 'Auth',
    data: { email },
  })
  return { error: null }
}

/**
 * Observar cambios de autenticación
 */
export function onAuthChange(callback: (user: User | null) => void) {
  authListeners.push(callback)
  
  // Llamar inmediatamente con el estado actual
  callback(currentUser)
  
  // Retornar función de cleanup
  return () => {
    authListeners = authListeners.filter((cb) => cb !== callback)
  }
}

/**
 * Obtener usuario actual
 */
export function getCurrentUser(): User | null {
  return currentUser
}

/**
 * Verificar si hay usuario autenticado
 */
export function isAuthenticated(): boolean {
  return currentUser !== null
}

/**
 * Auto-login para desarrollo (usar en desarrollo)
 */
export function autoLoginForDevelopment() {
  if (typeof window !== 'undefined' && !currentUser) {
    currentUser = MOCK_USER
    localStorage.setItem('chronos_auth_user', JSON.stringify(MOCK_USER))
    notifyAuthListeners()
    logger.info('Auto-login para desarrollo activado', { context: 'Auth' })
  }
}
