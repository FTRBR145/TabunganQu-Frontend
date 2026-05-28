import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { transactionService } from '../../services/transactionService'
import { formatRupiah, formatDate } from '../../utils/helpers'

// ─── SVG icons ────────────────────────────────────────────────────────────────
const IconHome = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IconHistory = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconTransaction = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const IconWishlist = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const IconReport = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const IconSettings = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',   Icon: IconHome },
  { to: '/saldo',      label: 'Transaksi',    Icon: IconTransaction },
  { to: '/wishlist',   label: 'Wishlist',     Icon: IconWishlist },
  { to: '/histori',    label: 'Histori',      Icon: IconHistory },
  { to: '/report',     label: 'Laporan',      Icon: IconReport },
]

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [allTransactions, setAllTransactions] = useState([])
  const [hasFetched, setHasFetched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    if (searchQuery.trim().length > 0 && !hasFetched) {
      setIsLoading(true)
      setHasFetched(true)
      transactionService.getTransactions()
        .then(res => setAllTransactions(res.data || []))
        .catch(err => console.error('Gagal mengambil data transaksi:', err))
        .finally(() => setIsLoading(false))
    }
  }, [searchQuery, hasFetched])

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchResults = allTransactions
    .filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5)

  function handleSettingsClick() { navigate('/settings'); onClose() }
  function handleLogoutClick() { logout(); navigate('/'); onClose() }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[89] min-[901px]:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-[240px] flex-shrink-0 flex flex-col z-[90] overflow-hidden
          border-r border-white/[0.07] transition-transform duration-300
          shadow-[10px_0_40px_rgba(0,0,0,0.5)]
          min-[901px]:relative min-[901px]:translate-x-0 min-[901px]:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Sidebar background */}
        <div className="absolute inset-0 z-[1]"
          style={{ background: 'linear-gradient(180deg, #111c14 0%, #1a241c 100%)' }}
        />
        {/* Green glow top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent z-[2]" />

        <div className="relative z-[3] flex flex-col h-full py-5">

          {/* Logo */}
          <div
            className="flex items-center gap-2.5 px-5 mb-6 cursor-pointer"
            onClick={() => navigate('/')}
          >
            {/* Logo image */}
            <img src="/logo.png" alt="TabunganQu" className="w-[56px] h-[56px] object-cover -ml-2 rounded-full border border-white/10" />
            <span className="text-white font-bold text-[20px] tracking-tight font-['Inter',sans-serif]">
              TabunganQu
            </span>
          </div>

          {/* Mobile header */}
          <div className="flex items-center justify-between px-5 pb-4 mb-1 border-b border-white/[0.07] min-[901px]:hidden">
            <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Menu</span>
            <button className="text-white/50 hover:text-white transition-colors p-1" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="px-4 mb-4" ref={searchRef}>
            <div className="relative">
              <form
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.07] border border-white/[0.08] text-white/60"
                onSubmit={e => e.preventDefault()}
              >
                <IconSearch />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full bg-transparent border-none text-white text-[12px] outline-none placeholder:text-white/35"
                />
              </form>

              {showDropdown && searchQuery.trim().length > 0 && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-[#1e2b21] rounded-xl shadow-2xl border border-white/[0.09] overflow-hidden z-20 flex flex-col max-h-[260px] overflow-y-auto">
                  {isLoading ? (
                    <div className="px-4 py-3 text-[12px] text-white/40 text-center">Memuat...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(trans => (
                      <div
                        key={trans.id}
                        className="px-3 py-2.5 border-b border-white/[0.06] hover:bg-white/[0.05] cursor-pointer transition-colors"
                        onClick={() => { navigate('/histori'); setShowDropdown(false); setSearchQuery(''); onClose() }}
                      >
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="text-[10px] text-white/40">{formatDate(trans.transaction_date)}</span>
                          <span className={`text-[12px] font-mono font-bold ${trans.type === 'pemasukan' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trans.type === 'pemasukan' ? '+' : '-'} Rp {formatRupiah(trans.amount)}
                          </span>
                        </div>
                        <p className="text-[12px] text-white/80 line-clamp-1">{trans.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[12px] text-white/40 text-center">Tidak ada hasil</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section label */}
          <div className="px-5 mb-2">
            <span className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">Navigasi</span>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-0.5 px-3 flex-1">
            {NAV_ITEMS.map(({ to, label, Icon }) => {
              const isActive = location.pathname === to
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-lg font-['Inter',sans-serif] text-[13px] font-medium no-underline transition-all duration-150
                    ${isActive
                      ? 'bg-white/[0.07] text-white border border-white/[0.08]'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'}`}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-emerald-400/80' : 'text-white/30 group-hover:text-white/60'} transition-colors`}>
                    <Icon />
                  </span>
                  <span>{label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Bottom actions */}
          <div className="px-3 mt-4 pt-4 border-t border-white/[0.07] flex flex-col gap-1">
            <button
              onClick={handleSettingsClick}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-150"
            >
              <span className="text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0">
                <IconSettings />
              </span>
              <span>Pengaturan</span>
            </button>

            <button
              onClick={handleLogoutClick}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-400/70 hover:text-red-300 hover:bg-red-500/[0.08] transition-all duration-150"
            >
              <span className="flex-shrink-0"><IconLogout /></span>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}