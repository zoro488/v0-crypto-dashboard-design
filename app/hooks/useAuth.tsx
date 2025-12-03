/**
 * Hook de autenticación - MODO LOCAL
 * @module hooks/useAuth
 * 
 * ⚠️ FIREBASE DESHABILITADO - Autenticación simulada con localStorage
 * 
 * Proporciona estado de autenticación, métodos de login/logout,
 * y protección de rutas para la aplicación.
 */

'use client'

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import { 
  signIn, 
  signOut as localSignOut, 
  signUp,
  onAuthChange, 
  resetPassword as localResetPassword,
  type User,
} from '../lib/firebase/auth'
import { logger } from '../lib/utils/logger'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer'

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

// Tipo de credencial mock (compatible con UserCredential de Firebase)
export interface UserCredential {
  user: User
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
  updateUserProfile: (data: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>>) => Promise<void>
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
   * Crear perfil de usuario desde User
   */
  const createProfile = useCallback((user: User): UserProfile => {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'admin', // Por defecto admin en modo local
      createdAt: new Date(),
      lastLogin: new Date(),
      permissions: ['read', 'write', 'admin'],
    }
  }, [])

  /**
   * Escuchar cambios de autenticación
   */
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        const profile = createProfile(user)
        setState({
          user,
          profile,
          loading: false,
          error: null,
        })
        logger.info('Usuario autenticado (LOCAL)', { 
          context: 'useAuth', 
          data: { userId: user.uid }, 
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
  }, [createProfile])

  /**
   * Iniciar sesión (LOCAL)
   */
  const login = useCallback(async (email: string, password: string): Promise<UserCredential> => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await signIn(email, password)
      if (result.error || !result.user) {
        throw new Error(result.error || 'Error de autenticación')
      }
      logger.info('Usuario autenticado (LOCAL)', { context: 'useAuth', data: { userId: result.user.uid } })
      return { user: result.user }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de autenticación'
      setState((prev) => ({ ...prev, loading: false, error: message }))
      logger.error('Error en login', error, { context: 'useAuth' })
      throw error
    }
  }, [])

  /**
   * Cerrar sesión
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await localSignOut()
      logger.info('Usuario desconectado (LOCAL)', { context: 'useAuth' })
    } catch (error) {
      logger.error('Error en logout', error, { context: 'useAuth' })
      throw error
    }
  }, [])

  /**
   * Registrar nuevo usuario (LOCAL)
   */
  const register = useCallback(async (
    email: string,
    password: string,
    displayName: string,
  ): Promise<UserCredential> => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await signUp(email, password, displayName)
      if (result.error || !result.user) {
        throw new Error(result.error || 'Error en registro')
      }
      logger.info('Usuario registrado (LOCAL)', { context: 'useAuth', data: { userId: result.user.uid } })
      return { user: result.user }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error en registro'
      setState((prev) => ({ ...prev, loading: false, error: message }))
      logger.error('Error en registro', error, { context: 'useAuth' })
      throw error
    }
  }, [])

  /**
   * Restablecer contraseña (simulado en LOCAL)
   */
  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      await localResetPassword(email)
      logger.info('Email de recuperación enviado (LOCAL - simulado)', { context: 'useAuth', data: { email } })
    } catch (error) {
      logger.error('Error en resetPassword', error, { context: 'useAuth' })
      throw error
    }
  }, [])

  /**
   * Actualizar perfil de usuario (LOCAL)
   */
  const updateUserProfile = useCallback(async (
    data: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>>,
  ): Promise<void> => {
    if (!state.user) throw new Error('No hay usuario autenticado')

    try {
      // Actualizar estado local
      setState((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...data } : null,
        profile: prev.profile ? { ...prev.profile, ...data } : null,
      }))

      // Persistir en localStorage
      if (typeof window !== 'undefined') {
        const updatedUser = { ...state.user, ...data }
        localStorage.setItem('chronos_auth_user', JSON.stringify(updatedUser))
      }

      logger.info('Perfil actualizado (LOCAL)', { context: 'useAuth' })
    } catch (error) {
      logger.error('Error actualizando perfil', error, { context: 'useAuth' })
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
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
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
  if (profile.role === 'admin') return true
  
  return profile.permissions.includes(permission)
}

/**
 * Hook para verificar si el usuario está autenticado
 */
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth()
  return !loading && user !== null
}

export default useAuth
