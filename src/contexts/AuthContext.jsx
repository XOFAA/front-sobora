import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchMe, loginWithCode, requestLoginCode, registerUser, updateMe } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadMe = async () => {
    try {
      const data = await fetchMe()
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('sobora_token')
    if (token) {
      loadMe()
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (identifier, code) => {
    const data = await loginWithCode(identifier, code)
    if (data?.access_token) {
      localStorage.setItem('sobora_token', data.access_token)
      setUser(data.user)
    }
    return data
  }

  const requestCode = async (identifier) => {
    return requestLoginCode(identifier)
  }

  const register = async (payload) => {
    return registerUser(payload)
  }

  const updateProfile = async (payload) => {
    const data = await updateMe(payload)
    setUser((prev) => ({ ...(prev || {}), ...data }))
    return data
  }

  const logout = () => {
    localStorage.removeItem('sobora_token')
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, login, requestCode, register, updateProfile, logout, reload: loadMe }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
