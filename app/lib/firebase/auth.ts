/**
 * 🔐 Firebase Authentication Service
 * 
 * Maneja autenticación de usuarios con:
 * - Email/Password
 * - Google OAuth
 * - Persistent sessions
 * - Protected routes
 */

import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'
import { logger } from '../utils/logger'

// Singleton de Auth
let authInstance: Auth | null = null

/**
 * Obtener instancia de Auth
 */
export function getAuthInstance(): Auth {
  if (!authInstance) {
    authInstance = getAuth()
    
    // Configurar persistencia
    setPersistence(authInstance, browserLocalPersistence).catch((error) => {
      logger.error('Error configurando persistencia', error, { context: 'Auth' })
    })
  }
  return authInstance
}

/**
 * Crear usuario con email/password
 */
export async function signUp(email: string, password: string, displayName?: string) {
  try {
    const auth = getAuthInstance()
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Actualizar perfil con nombre
    if (displayName) {
      await updateProfile(user, { displayName })
    }

    // Crear documento de usuario en Firestore
    if (db) {
      await setDoc(doc(db, 'usuarios', user.uid), {
        email: user.email,
        displayName: displayName || '',
        createdAt: serverTimestamp(),
        role: 'user',
        active: true,
      })
    }

    logger.info('Usuario registrado', { 
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
 * Login con email/password
 */
export async function signIn(email: string, password: string) {
  try {
    const auth = getAuthInstance()
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    logger.info('Usuario inició sesión', { 
      context: 'Auth',
      data: { userId: user.uid, email: user.email },
    })

    return { user, error: null }
  } catch (error) {
    logger.error('Error en signIn', error, { context: 'Auth' })
    
    let errorMessage = 'Error al iniciar sesión'
    if (error instanceof Error) {
      if (error.message.includes('user-not-found')) {
        errorMessage = 'Usuario no encontrado'
      } else if (error.message.includes('wrong-password')) {
        errorMessage = 'Contraseña incorrecta'
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Email inválido'
      }
    }
    
    return { user: null, error: errorMessage }
  }
}

/**
 * Login con Google OAuth
 */
export async function signInWithGoogle() {
  try {
    const auth = getAuthInstance()
    const provider = new GoogleAuthProvider()
    
    // Configurar provider
    provider.addScope('profile')
    provider.addScope('email')

    const userCredential = await signInWithPopup(auth, provider)
    const user = userCredential.user

    // Crear/actualizar documento de usuario
    if (db) {
      const userRef = doc(db, 'usuarios', user.uid)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          role: 'user',
          active: true,
          provider: 'google',
        })
      } else {
        // Actualizar última sesión
        await setDoc(userRef, {
          lastLoginAt: serverTimestamp(),
        }, { merge: true })
      }
    }

    logger.info('Usuario inició sesión con Google', { 
      context: 'Auth',
      data: { userId: user.uid, email: user.email },
    })

    return { user, error: null }
  } catch (error) {
    logger.error('Error en signInWithGoogle', error, { context: 'Auth' })
    
    let errorMessage = 'Error al iniciar sesión con Google'
    if (error instanceof Error) {
      if (error.message.includes('popup-closed')) {
        errorMessage = 'Ventana cerrada'
      } else if (error.message.includes('cancelled')) {
        errorMessage = 'Login cancelado'
      }
    }
    
    return { user: null, error: errorMessage }
  }
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  try {
    const auth = getAuthInstance()
    await firebaseSignOut(auth)

    logger.info('Usuario cerró sesión', { context: 'Auth' })

    return { error: null }
  } catch (error) {
    logger.error('Error en signOut', error, { context: 'Auth' })
    return { 
      error: error instanceof Error ? error.message : 'Error al cerrar sesión',
    }
  }
}

/**
 * Restablecer contraseña
 */
export async function resetPassword(email: string) {
  try {
    const auth = getAuthInstance()
    await sendPasswordResetEmail(auth, email)

    logger.info('Email de restablecimiento enviado', { 
      context: 'Auth',
      data: { email },
    })

    return { error: null }
  } catch (error) {
    logger.error('Error en resetPassword', error, { context: 'Auth' })
    
    let errorMessage = 'Error al enviar email'
    if (error instanceof Error) {
      if (error.message.includes('user-not-found')) {
        errorMessage = 'Usuario no encontrado'
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Email inválido'
      }
    }
    
    return { error: errorMessage }
  }
}

/**
 * Observar cambios de autenticación
 */
export function onAuthChange(callback: (user: User | null) => void) {
  const auth = getAuthInstance()
  return onAuthStateChanged(auth, callback)
}

/**
 * Obtener usuario actual
 */
export function getCurrentUser(): User | null {
  const auth = getAuthInstance()
  return auth.currentUser
}

/**
 * Verificar si hay usuario autenticado
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
