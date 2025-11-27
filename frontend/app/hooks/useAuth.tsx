/**
 * Hook de autenticación con Firebase Auth
 * @module hooks/useAuth
 * 
 * Proporciona estado de autenticación, métodos de login/logout,
 * y protección de rutas para la aplicación.
 */

"use client"

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react"
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  type User,
  type UserCredential,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../lib/firebase/config"
import { logger } from "../lib/utils/logger"

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export type UserRole = "admin" | "manager" | "user" | "viewer"

export interface UserProfile {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: UserRole
  createdAt: Date
  lastLogin: Date
  permissions: string[]
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<UserCredential>
  logout: () => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<UserCredential>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (data: Partial<Pick<UserProfile, "displayName" | "photoURL">>) => Promise<void>
  clearError: () => void
}

export type AuthContextType = AuthState & AuthActions

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXTO
// ═══════════════════════════════════════════════════════════════════════════

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  })

  /**
   * Obtener perfil de usuario desde Firestore
   */
  const fetchUserProfile = useCallback(async (user: User): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const data = userSnap.data()
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || data.displayName,
          photoURL: user.photoURL || data.photoURL,
          role: data.role || "user",
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || new Date(),
          permissions: data.permissions || [],
        }
      }

      // Crear perfil si no existe
      const newProfile: Omit<UserProfile, "uid"> = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: "user",
        createdAt: new Date(),
        lastLogin: new Date(),
        permissions: ["read"],
      }

      await setDoc(userRef, {
        ...newProfile,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      })

      return { uid: user.uid, ...newProfile }
    } catch (error) {
      logger.error("Error fetching user profile", error, { context: "useAuth" })
      return null
    }
  }, [])

  /**
   * Escuchar cambios de autenticación
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await fetchUserProfile(user)
        
        // Actualizar último login
        try {
          await setDoc(
            doc(db, "users", user.uid),
            { lastLogin: serverTimestamp() },
            { merge: true }
          )
        } catch (error) {
          logger.warn("No se pudo actualizar lastLogin", { context: "useAuth" })
        }

        setState({
          user,
          profile,
          loading: false,
          error: null,
        })
      } else {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        })
      }
    })

    return () => unsubscribe()
  }, [fetchUserProfile])

  /**
   * Iniciar sesión
   */
  const login = useCallback(async (email: string, password: string): Promise<UserCredential> => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      logger.info("Usuario autenticado", { context: "useAuth", data: { userId: credential.user.uid } })
      return credential
    } catch (error) {
      const message = getAuthErrorMessage(error)
      setState((prev) => ({ ...prev, loading: false, error: message }))
      logger.error("Error en login", error, { context: "useAuth" })
      throw error
    }
  }, [])

  /**
   * Cerrar sesión
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await signOut(auth)
      logger.info("Usuario desconectado", { context: "useAuth" })
    } catch (error) {
      logger.error("Error en logout", error, { context: "useAuth" })
      throw error
    }
  }, [])

  /**
   * Registrar nuevo usuario
   */
  const register = useCallback(async (
    email: string,
    password: string,
    displayName: string
  ): Promise<UserCredential> => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Actualizar perfil con nombre
      await updateProfile(credential.user, { displayName })
      
      // Crear documento en Firestore
      await setDoc(doc(db, "users", credential.user.uid), {
        email,
        displayName,
        role: "user",
        permissions: ["read"],
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      })

      logger.info("Usuario registrado", { context: "useAuth", data: { userId: credential.user.uid } })
      return credential
    } catch (error) {
      const message = getAuthErrorMessage(error)
      setState((prev) => ({ ...prev, loading: false, error: message }))
      logger.error("Error en registro", error, { context: "useAuth" })
      throw error
    }
  }, [])

  /**
   * Restablecer contraseña
   */
  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email)
      logger.info("Email de recuperación enviado", { context: "useAuth", data: { email } })
    } catch (error) {
      const message = getAuthErrorMessage(error)
      setState((prev) => ({ ...prev, error: message }))
      logger.error("Error en resetPassword", error, { context: "useAuth" })
      throw error
    }
  }, [])

  /**
   * Actualizar perfil de usuario
   */
  const updateUserProfile = useCallback(async (
    data: Partial<Pick<UserProfile, "displayName" | "photoURL">>
  ): Promise<void> => {
    if (!state.user) throw new Error("No hay usuario autenticado")

    try {
      await updateProfile(state.user, data)
      await setDoc(
        doc(db, "users", state.user.uid),
        { ...data, updatedAt: serverTimestamp() },
        { merge: true }
      )

      setState((prev) => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...data } : null,
      }))

      logger.info("Perfil actualizado", { context: "useAuth" })
    } catch (error) {
      logger.error("Error actualizando perfil", error, { context: "useAuth" })
      throw error
    }
  }, [state.user])

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    resetPassword,
    updateUserProfile,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook para acceder al contexto de autenticación
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  
  return context
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook para verificar si el usuario tiene un rol específico
 */
export function useHasRole(requiredRole: UserRole): boolean {
  const { profile } = useAuth()
  
  if (!profile) return false
  
  const roleHierarchy: Record<UserRole, number> = {
    admin: 4,
    manager: 3,
    user: 2,
    viewer: 1,
  }
  
  return roleHierarchy[profile.role] >= roleHierarchy[requiredRole]
}

/**
 * Hook para verificar si el usuario tiene un permiso específico
 */
export function useHasPermission(permission: string): boolean {
  const { profile } = useAuth()
  
  if (!profile) return false
  if (profile.role === "admin") return true
  
  return profile.permissions.includes(permission)
}

/**
 * Hook para verificar si el usuario está autenticado
 */
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth()
  return !loading && user !== null
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Traduce errores de Firebase Auth a mensajes en español
 */
function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code
    
    switch (code) {
      case "auth/invalid-email":
        return "El correo electrónico no es válido"
      case "auth/user-disabled":
        return "Esta cuenta ha sido deshabilitada"
      case "auth/user-not-found":
        return "No existe una cuenta con este correo"
      case "auth/wrong-password":
        return "Contraseña incorrecta"
      case "auth/email-already-in-use":
        return "Ya existe una cuenta con este correo"
      case "auth/weak-password":
        return "La contraseña debe tener al menos 6 caracteres"
      case "auth/too-many-requests":
        return "Demasiados intentos. Intenta más tarde"
      case "auth/network-request-failed":
        return "Error de conexión. Verifica tu internet"
      default:
        return error.message || "Error de autenticación"
    }
  }
  
  return "Error desconocido"
}

export default useAuth
