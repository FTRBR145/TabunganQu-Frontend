import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import './index.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
if (!googleClientId) {
  console.error('VITE_GOOGLE_CLIENT_ID is not set. Google Login will not work.')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
)
