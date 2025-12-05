/**
 * 🔒 Authentication Context Provider - MODO LOCAL
 * 
 * ⚠️ Firebase deshabilitado - Autenticación simulada
 * Proporciona estado de autenticación a toda la app
 */

'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

// Tipo de usuario simplificado
interface User {
  id: string
  email: string
  nombre: string
  role: 'admin' | 'operator' | 'viewer'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  isAuthenticated: false,
  signIn: async () => {},
  signOut: async () => {},
})

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Por ahora, usuario demo siempre autenticado
  const [user] = useState<User | null>({
    id: 'demo-user',
    email: 'admin@chronos.mx',
    nombre: 'Administrador',
    role: 'admin',
  })
  const [loading] = useState(false)

  const signIn = async (_email: string, _password: string) => {
    // TODO: Implementar autenticación real con NextAuth
    console.log('Auth: signIn called')
  }

  const signOut = async () => {
    // TODO: Implementar cierre de sesión
    console.log('Auth: signOut called')
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: user !== null,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
