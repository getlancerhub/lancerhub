'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '@/lib/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (_email: string, _password: string) => Promise<void>
  register: (_data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  const clearError = () => setError(null)

  const checkAuth = async () => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    try {
      // eslint-disable-next-line no-undef
      const token = localStorage.getItem('accessToken')

      if (!token) {
        setLoading(false)
        return
      }

      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch {
      // Token is invalid, clear it
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-undef
        localStorage.removeItem('accessToken')
        // eslint-disable-next-line no-undef
        localStorage.removeItem('refreshToken')
      }
    } finally {
      setLoading(false)
    }
  }

  // Set client flag after mount to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check auth only after client is ready
  useEffect(() => {
    if (isClient) {
      checkAuth()
    }
  }, [isClient])

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)

      const response = await api.post('/auth/login', { email, password })
      const { user, tokens } = response.data
      const { accessToken, refreshToken } = tokens

      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-undef
        localStorage.setItem('accessToken', accessToken)
        // eslint-disable-next-line no-undef
        localStorage.setItem('refreshToken', refreshToken)
      }

      setUser(user)
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (err as any).response?.data?.message || 'Login failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    try {
      setError(null)
      setLoading(true)

      const response = await api.post('/auth/register', data)
      const { user, tokens } = response.data
      const { accessToken, refreshToken } = tokens

      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-undef
        localStorage.setItem('accessToken', accessToken)
        // eslint-disable-next-line no-undef
        localStorage.setItem('refreshToken', refreshToken)
      }
      setUser(user)
    } catch (err: unknown) {
       
      const message =
        (err as any).response?.data?.message || 'Registration failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      // Logout endpoint failed, but we'll clear local state anyway
      console.warn('Logout endpoint failed:', err)
    } finally {
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-undef
        localStorage.removeItem('accessToken')
        // eslint-disable-next-line no-undef
        localStorage.removeItem('refreshToken')
      }
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
