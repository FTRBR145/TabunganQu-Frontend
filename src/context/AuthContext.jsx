import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'
import { DEBUG_MODE } from '../config/debugMode'
import { DUMMY_USER } from '../data/dummyData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // SEMBUNYIKAN LOGIN/REGISTER: Bypass auth untuk local development
    if (DEBUG_MODE.ENABLED) {
      return DUMMY_USER
    }

    const saved = localStorage.getItem('tabunganqu_user')
    const token = localStorage.getItem('tabunganqu_token')
    return saved && token ? JSON.parse(saved) : null
  })

  const login = useCallback(async (email, password, captchaToken) => {
    try {
      const response = await api.post('/auth/login', { email, password, captchaToken })
      const { user, token } = response.data.data
      
      localStorage.setItem('tabunganqu_user', JSON.stringify(user))
      localStorage.setItem('tabunganqu_token', token)
      setUser(user)
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message)
      
      if (error.response) {
        const status = error.response.status
        const message = error.response.data?.message || 'Login gagal'
        const errors = error.response.data?.errors
        
        if (status === 401) {
          return { 
            success: false, 
            message: 'Email atau password salah' 
          }
        } else if (status === 404) {
          return { 
            success: false, 
            message: 'Email tidak terdaftar' 
          }
        } else if (errors) {
          const errorMessages = errors.map(err => err.message).join(', ')
          return { success: false, message: errorMessages }
        } else {
          return { success: false, message }
        }
      } else if (error.request) {
        return { 
          success: false, 
          message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' 
        }
      } else {
        return { 
          success: false, 
          message: 'Terjadi kesalahan. Silakan coba lagi.' 
        }
      }
    }
  }, [])

  const register = useCallback(async (name, email, password, captchaToken) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, captchaToken })
      const { user, token } = response.data.data
      
      localStorage.setItem('tabunganqu_user', JSON.stringify(user))
      localStorage.setItem('tabunganqu_token', token)
      setUser(user)
      
      return { success: true }
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message)
      
      if (error.response?.data?.errors) {
        const messages = error.response.data.errors.map(err => err.message).join(', ')
        return { success: false, message: messages }
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.' 
      }
    }
  }, [])

  const googleLogin = useCallback(async (credentialResponse, captchaToken, type = 'login') => {
    try {
      const response = await api.post('/auth/google', { 
        credential: credentialResponse.credential,
        captchaToken,
        type
      })
      const { user, token } = response.data.data

      localStorage.setItem('tabunganqu_user', JSON.stringify(user))
      localStorage.setItem('tabunganqu_token', token)
      setUser(user)

      return { success: true }
    } catch (error) {
      console.error('Google login error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Login dengan Google gagal. Silakan coba lagi.'
      }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('tabunganqu_user')
    localStorage.removeItem('tabunganqu_token')
  }, [])

  const updateProfile = useCallback(async (updates) => {
    try {
      const response = await api.put('/auth/profile', updates)
      const updatedUser = response.data.data.user
      
      localStorage.setItem('tabunganqu_user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      return { success: true }
    } catch (error) {
      console.error('Update profile error:', error.response?.data || error.message)
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Update profil gagal.' 
      }
    }
  }, [])

  const uploadAvatar = useCallback(async (formData) => {
    try {
      const response = await api.post('/auth/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      const updatedUser = response.data.data.user
      
      localStorage.setItem('tabunganqu_user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      return { success: true }
    } catch (error) {
      console.error('Upload avatar error:', error.response?.data || error.message)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Upload foto profil gagal.' 
      }
    }
  }, [])

  const deleteAvatar = useCallback(async () => {
    try {
      const response = await api.delete('/auth/profile/avatar')
      const updatedUser = response.data.data.user
      
      localStorage.setItem('tabunganqu_user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      return { success: true }
    } catch (error) {
      console.error('Delete avatar error:', error.response?.data || error.message)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Hapus foto profil gagal.' 
      }
    }
  }, [])

  const deleteAccount = useCallback(async () => {
    try {
      await api.delete('/auth/account')
      logout()
      return { success: true }
    } catch (error) {
      console.error('Delete account error:', error.response?.data || error.message)
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Hapus akun gagal.' 
      }
    }
  }, [logout])

  const value = {
    user,
    login,
    register,
    googleLogin,
    logout,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    deleteAccount
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}