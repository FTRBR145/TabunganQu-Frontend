import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard': return { title: 'Dashboard', sub: 'Ringkasan keuangan Anda' }
      case '/histori':   return { title: 'Histori',   sub: 'Riwayat lengkap transaksi' }
      case '/saldo':     return { title: 'Transaksi', sub: 'Manajemen pemasukan & pengeluaran' }
      case '/wishlist':  return { title: 'Wishlist',  sub: 'Target & tabungan impian' }
      case '/report':    return { title: 'Laporan',   sub: 'Analisis & ekspor keuangan' }
      case '/settings':  return { title: 'Pengaturan', sub: 'Akun & preferensi' }
      default:           return { title: 'TabunganQu', sub: '' }
    }
  }

  const { title, sub } = getPageInfo()

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full px-4 py-3 min-[901px]:px-7 min-[901px]:py-4 border-b border-white/[0.07]"
      style={{ background: 'rgba(26,33,28,0.92)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger (mobile only) */}
        <button
          className="flex bg-transparent border-none text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.07] transition min-[901px]:hidden"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div>
          <h1 className="m-0 text-white font-['Inter',sans-serif] text-[17px] min-[901px]:text-[19px] font-semibold leading-tight tracking-tight">
            {title}
          </h1>
          {sub && (
            <p className="m-0 text-[11px] text-white/35 leading-none mt-0.5 hidden min-[901px]:block">{sub}</p>
          )}
        </div>
      </div>

      {/* Avatar + dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-white/[0.07] transition-colors"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="flex items-center justify-center shrink-0 bg-[#f3f4f6] rounded-full w-[32px] h-[32px] min-[901px]:w-[36px] min-[901px]:h-[36px] overflow-hidden border-2 border-white/10">
            <img
              src={user?.avatar
                ? (user.avatar.startsWith('http') || user.avatar.startsWith('data:')
                    ? user.avatar
                    : `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatar}`)
                : '/default-avatar.png'}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden min-[901px]:block text-left">
            <p className="text-[13px] font-semibold text-white leading-tight">{user?.name?.split(' ')[0]}</p>
          </div>
          <svg className="hidden min-[901px]:block" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute top-[calc(100%+8px)] right-0 w-[230px] bg-white rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] overflow-hidden z-[100] animate-scale-in">
            {/* User info */}
            <div className="flex items-center gap-3 p-4 border-b border-black/[0.08]">
              <div className="flex items-center justify-center shrink-0 w-10 h-10 bg-[#f3f4f6] rounded-full overflow-hidden">
                <img
                  src={user?.avatar
                    ? (user.avatar.startsWith('http') || user.avatar.startsWith('data:')
                        ? user.avatar
                        : `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatar}`)
                    : '/default-avatar.png'}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-black truncate leading-tight">{user?.name}</p>
                <p className="text-[11px] text-[#666] truncate mt-0.5">{user?.email}</p>
              </div>
            </div>

            <button
              className="flex items-center gap-2.5 w-full py-2.5 px-4 bg-transparent border-none text-[13px] text-[#333] cursor-pointer transition-colors hover:bg-[#f5f5f5]"
              onClick={() => { navigate('/settings'); setDropdownOpen(false) }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Pengaturan
            </button>

            <button
              className="flex items-center gap-2.5 w-full py-2.5 px-4 bg-transparent border-none text-[13px] text-[#333] cursor-pointer transition-colors hover:bg-[#fff0f0] hover:text-[#d32f2f]"
              onClick={() => { logout(); navigate('/') }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  )
}