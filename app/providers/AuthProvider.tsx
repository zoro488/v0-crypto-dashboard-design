/**
 * 🔒 Authentication Context Provider
 * 
 * Proporciona estado de autenticación a toda la app
 */

'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { User } from 'firebase/auth'
import { onAuthChange, getCurrentUser } from '@/app/lib/firebase/auth'
import { logger } from '@/app/lib/utils/logger'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar usuario actual al montar
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setLoading(false)
    }

    // Suscribirse a cambios de auth
    const unsubscribe = onAuthChange((newUser) => {
      setUser(newUser)
      setLoading(false)

      if (newUser) {
        logger.info('Usuario autenticado', {
          context: 'AuthProvider',
          data: {
            userId: newUser.uid,
            email: newUser.email,
          },
        })
      } else {
        logger.info('Usuario no autenticado', { context: 'AuthProvider' })
      }
    })

    return () => unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: user !== null,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
