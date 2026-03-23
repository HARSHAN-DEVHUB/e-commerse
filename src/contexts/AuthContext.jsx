import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api.jsx'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token with backend
      verifyToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async (token) => {
    try {
      localStorage.setItem('token', token)
      const response = await api.get('/auth/verify')
      setUser(response.data)
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', response.data.token)
      setUser(response.data.user)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      localStorage.setItem('token', response.data.token)
      setUser(response.data.user)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout', {})
    } catch (_error) {
      // Ignore logout API errors and clear local session anyway.
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData)
      setUser(response.data.user)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || 'Profile update failed' }
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 