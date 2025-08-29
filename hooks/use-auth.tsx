'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authService, type User } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize auth state from storage
    const initAuth = () => {
      const currentUser = authService.getUser()
      const authenticated = authService.isAuthenticated()
      
      setUser(currentUser)
      setIsAuthenticated(authenticated)
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { authApi } = await import('@/lib/api')
      await authApi.login(email, password)
      
      // Update state after successful login
      const currentUser = authService.getUser()
      const authenticated = authService.isAuthenticated()
      
      setUser(currentUser)
      setIsAuthenticated(authenticated)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      const { authApi } = await import('@/lib/api')
      await authApi.logout()
    } finally {
      // Always update state regardless of API response
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
