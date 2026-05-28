import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Saldo from './pages/Saldo'
import Histori from './pages/Histori'
import Wishlist from './pages/Wishlist'
import Report from './pages/Report'
import Settings from './pages/Settings'
import AppLayout from './components/layout/AppLayout'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/saldo" element={<Saldo />} />
        <Route path="/histori" element={<Histori />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/report" element={<Report />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}