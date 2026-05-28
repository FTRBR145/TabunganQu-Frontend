import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatRupiah, getTodayISO } from '../utils/helpers'
import { transactionService } from '../services/transactionService'
import { wishlistService } from '../services/wishlistService'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate, Link } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorDisplay from '../components/ui/ErrorDisplay'
import Modal from '../components/ui/Modal'
import { DEBUG_MODE } from '../config/debugMode'
import { DUMMY_SUMMARY, DUMMY_CHART, DUMMY_WISHLIST } from '../data/dummyData'

const REFRESH_SEC = 30

const formatRupiahInput = (value) => {
  if (!value) return ''
  const number = value.toString().replace(/[^,\d]/g, '')
  const split = number.split(',')
  let sisa = split[0].length % 3
  let rupiah = split[0].substr(0, sisa)
  const ribuan = split[0].substr(sisa).match(/\d{3}/gi)
  if (ribuan) rupiah += (sisa ? '.' : '') + ribuan.join('.')
  return split[1] !== undefined ? rupiah + ',' + split[1] : rupiah
}
const parseRupiahToNumber = (s) => parseInt((s || '').replace(/[^,\d]/g, '')) || 0

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState({ pemasukan: 0, pengeluaran: 0, saldo: 0 })
  const [chartData, setChartData] = useState({ pemasukan: [], pengeluaran: [] })
  const [wishlists, setWishlists] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [monthlySummary, setMonthlySummary] = useState({ pemasukan: 0, pengeluaran: 0, saldo: 0 })
  const [dashSearch, setDashSearch] = useState('')
  const [activeChart, setActiveChart] = useState('pemasukan') // tab


  // Quick-add modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('pemasukan')
  const [formData, setFormData] = useState({ amount: '', description: '', date: getTodayISO() })
  const [amountDisplay, setAmountDisplay] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)

    if (DEBUG_MODE.ENABLED) {
      setTimeout(() => {
        setSummary(DUMMY_SUMMARY)
        setChartData(DUMMY_CHART)
        setWishlists(DUMMY_WISHLIST)
        setMonthlySummary({ pemasukan: DUMMY_SUMMARY.pemasukan, pengeluaran: DUMMY_SUMMARY.pengeluaran, saldo: DUMMY_SUMMARY.saldo })
        if (showLoading) setLoading(false)
      }, 500)
      return
    }

    try {
      const d = new Date()
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const [summaryRes, chartRes, wishlistRes, monthRes] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getChartData(selectedYear),
        wishlistService.getWishlists(),
        transactionService.getSummary(monthKey)
      ])
      setSummary(summaryRes.data)
      setChartData(chartRes.data)
      setWishlists(wishlistRes.data)
      setMonthlySummary(monthRes.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data dashboard')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [selectedYear])

  useEffect(() => { fetchDashboardData(true) }, [fetchDashboardData])

  // Auto-refresh + countdown
  useEffect(() => {
    const interval = setInterval(() => fetchDashboardData(false), REFRESH_SEC * 1000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  const openModal = (type) => {
    setModalType(type)
    setFormData({ amount: '', description: '', date: getTodayISO(), wishlistId: '' })
    setAmountDisplay('')
    setModalOpen(true)
  }

  const handleAmountChange = (e) => {
    const formatted = formatRupiahInput(e.target.value)
    setAmountDisplay(formatted)
    setFormData(prev => ({ ...prev, amount: parseRupiahToNumber(formatted).toString() }))
  }

  const handleQuickSubmit = async (e) => {
    e.preventDefault()
    const amount = parseInt(formData.amount, 10)
    if (!amount || amount <= 0) { toast.error('Nominal harus lebih dari 0'); return }
    if (!formData.description.trim()) { toast.error('Keterangan harus diisi'); return }
    if (modalType !== 'pemasukan' && amount > summary.saldo) { toast.error('Saldo tidak cukup!'); return }
    setSubmitLoading(true)
    try {
      await transactionService.createTransaction({
        type: modalType, amount,
        description: formData.description.trim(),
        transactionDate: formData.date,
        wishlistId: formData.wishlistId || null
      })
      toast.success(`${modalType === 'pemasukan' ? 'Pemasukan' : modalType === 'pengeluaran' ? 'Pengeluaran' : 'Alokasi Wishlist'} berhasil ditambahkan`)
      
      if (formData.wishlistId) {
        try {
          const w = wishlists.find(x => x.id === parseInt(formData.wishlistId))
          if (w) {
            const ns = w.saved_amount + amount
            await wishlistService.updateWishlist(formData.wishlistId, { name: w.name, targetAmount: w.target_amount, savedAmount: ns })
            toast.success(`Tabungan "${w.name}" diupdate: Rp ${formatRupiah(w.saved_amount)} → Rp ${formatRupiah(ns)}`)
          }
        } catch { toast.error('Gagal update wishlist, transaksi tetap tersimpan') }
      }

      setModalOpen(false)
      await fetchDashboardData(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSubmitLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="rounded-xl border border-white/10 bg-[#1a211c] px-3 py-2 text-[12px] font-semibold text-white shadow-lg">
          Rp {formatRupiah(payload[0].value)}
        </div>
      )
    }
    return null
  }

  const calcProgress = (saved, target) => !target ? 0 : Math.min(100, Math.round((saved / target) * 100))
  const avgProgress = wishlists.length
    ? Math.round(wishlists.reduce((s, w) => s + calcProgress(w.saved_amount, w.target_amount), 0) / wishlists.length)
    : 0

  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3]

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="min-h-[60vh] flex items-center justify-center"><ErrorDisplay message={error} onRetry={fetchDashboardData} /></div>

  return (
    <div className="text-white pb-10 animate-fade-in">

      {/* Greeting */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-[18px] min-[901px]:text-[20px] font-bold text-white m-0 leading-tight">
            Halo, {user?.name?.split(' ')[0] || 'Pengguna'} 👋
          </h2>
          <p className="text-[12px] text-white/45 m-0 mt-0.5">Selamat datang kembali di TabunganQu</p>
        </div>

      </div>

      {/* Quick-add buttons – hierarchy: primary / secondary / ghost */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Primary */}
        <button
          onClick={() => openModal('pemasukan')}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-[13px] font-medium text-white transition-colors active:scale-[0.98]"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah Pemasukan
        </button>
        {/* Secondary / destructive */}
        <button
          onClick={() => openModal('pengeluaran')}
          className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-[13px] font-medium text-rose-300 transition-colors active:scale-[0.98]"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah Pengeluaran
        </button>
        {/* Ghost / Info */}
        <button
          onClick={() => openModal('alokasi')}
          className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 text-[13px] font-medium text-indigo-300 transition-colors active:scale-[0.98]"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Alokasi Wishlist
        </button>
        {/* Ghost */}
        <Link
          to="/histori"
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] px-4 py-2 text-[13px] font-medium text-white/55 hover:text-white hover:border-white/20 transition-colors"
        >
          Histori →
        </Link>
      </div>

      {/* Summary cards – 4 cards, compact & muted */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
        {/* Saldo – primary green, subtle glow */}
        <div className="relative rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-2 overflow-hidden shadow-[0_4px_16px_rgba(16,185,129,0.12)] ring-1 ring-white/[0.08] bg-gradient-to-br from-emerald-700 to-teal-900 col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center">
            <span className="text-emerald-100/70 text-[10px] font-medium uppercase tracking-widest">Total Saldo</span>
            <span className="text-emerald-200/35"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={2}/><circle cx="12" cy="12" r="2" strokeWidth={2}/></svg></span>
          </div>
          <div className="text-white text-[17px] min-[901px]:text-[19px] font-semibold tracking-tight leading-none tabular-nums">
            Rp {formatRupiah(summary.saldo)}
          </div>
        </div>

        {/* Pemasukan – muted blue */}
        <div className="relative rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-2 overflow-hidden shadow-[0_4px_16px_rgba(59,130,246,0.10)] ring-1 ring-white/[0.08] bg-gradient-to-br from-sky-700/90 to-indigo-900">
          <div className="flex justify-between items-center">
            <span className="text-sky-100/70 text-[10px] font-medium uppercase tracking-widest">Pemasukan</span>
            <span className="text-sky-200/35"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeWidth={2}/><polyline points="17 6 23 6 23 12" strokeWidth={2}/></svg></span>
          </div>
          <div className="text-white text-[15px] min-[901px]:text-[17px] font-semibold tracking-tight leading-none tabular-nums">
            Rp {formatRupiah(summary.pemasukan)}
          </div>
        </div>

        {/* Pengeluaran – muted rose/slate */}
        <div className="relative rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-2 overflow-hidden shadow-[0_4px_16px_rgba(239,68,68,0.09)] ring-1 ring-white/[0.08] bg-gradient-to-br from-rose-800/80 to-slate-900">
          <div className="flex justify-between items-center">
            <span className="text-rose-100/70 text-[10px] font-medium uppercase tracking-widest">Pengeluaran</span>
            <span className="text-rose-200/35"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" strokeWidth={2}/><polyline points="17 18 23 18 23 12" strokeWidth={2}/></svg></span>
          </div>
          <div className="text-white text-[15px] min-[901px]:text-[17px] font-semibold tracking-tight leading-none tabular-nums">
            Rp {formatRupiah(summary.pengeluaran)}
          </div>
        </div>

        {/* Alokasi – muted violet/indigo */}
        <div className="relative rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-2 overflow-hidden shadow-[0_4px_16px_rgba(99,102,241,0.08)] ring-1 ring-white/[0.08] bg-gradient-to-br from-indigo-700 to-violet-900">
          <div className="flex justify-between items-center">
            <span className="text-indigo-100/70 text-[10px] font-medium uppercase tracking-widest">Alokasi Wishlist</span>
            <span className="text-indigo-200/35"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth={2}/></svg></span>
          </div>
          <div className="text-white text-[15px] min-[901px]:text-[17px] font-semibold tracking-tight leading-none tabular-nums">
            Rp {formatRupiah(summary.alokasi || 0)}
          </div>
        </div>
      </div>

      {/* Month summary + quick search */}
      <div className="tq-card mb-5 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium mb-2">Bulan berjalan</p>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-[11px] text-white/35 m-0">Pemasukan</p>
                <p className="text-[14px] font-semibold text-emerald-400 m-0 tabular-nums">Rp {formatRupiah(monthlySummary.pemasukan)}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/35 m-0">Pengeluaran</p>
                <p className="text-[14px] font-semibold text-rose-400 m-0 tabular-nums">Rp {formatRupiah(monthlySummary.pengeluaran)}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/35 m-0">Selisih</p>
                <p className={`text-[14px] font-semibold m-0 tabular-nums ${(monthlySummary.pemasukan - monthlySummary.pengeluaran) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  Rp {formatRupiah(Math.abs(monthlySummary.pemasukan - monthlySummary.pengeluaran))}
                </p>
              </div>
            </div>
          </div>
          {/* Slim search */}
          <div className="flex gap-1.5 w-full md:max-w-[220px]">
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="search"
                value={dashSearch}
                onChange={e => setDashSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && dashSearch.trim()) navigate(`/histori?search=${encodeURIComponent(dashSearch.trim())}`) }}
                placeholder="Cari..."
                className="tq-field w-full pl-7 pr-3 py-1.5 text-[12px]"
              />
            </div>
            <Link
              to={dashSearch.trim() ? `/histori?search=${encodeURIComponent(dashSearch.trim())}` : '/histori'}
              className="shrink-0 inline-flex items-center justify-center rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors"
            >
              Cari
            </Link>
          </div>
        </div>
      </div>

      {/* Charts + Wishlist */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

        {/* Chart section with tabs */}
        <div className="tq-card relative p-5">
          <div className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" aria-hidden />
          
          {/* Tab header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex rounded-xl border border-white/[0.09] overflow-hidden">
              {[
                { key: 'pemasukan', label: 'Pemasukan', color: 'emerald' },
                { key: 'pengeluaran', label: 'Pengeluaran', color: 'rose' },
                { key: 'alokasi', label: 'Alokasi', color: 'indigo' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveChart(tab.key)}
                  className={`px-4 py-1.5 text-[13px] font-medium transition ${
                    activeChart === tab.key
                      ? tab.key === 'pemasukan' ? 'bg-emerald-600/30 text-emerald-300' : tab.key === 'pengeluaran' ? 'bg-rose-600/30 text-rose-300' : 'bg-indigo-600/30 text-indigo-300'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-white/40">Tahun:</span>
              <select
                className="tq-field tq-select py-1.5 px-2.5 text-[12px] cursor-pointer"
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
              >
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={activeChart === 'pemasukan' ? chartData.pemasukan : activeChart === 'pengeluaran' ? chartData.pengeluaran : chartData.alokasi}
              margin={{ top: 5, right: 0, left: -22, bottom: 0 }}
            >
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'Inter' }} dy={8} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false}
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Inter' }}
                tickFormatter={v => { if (!v) return '0'; if (v >= 1000000) return `${v/1000000}jt`; if (v >= 1000) return `${v/1000}k`; return v }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar
                dataKey="amount"
                fill={activeChart === 'pemasukan' ? '#10b981' : activeChart === 'pengeluaran' ? '#ef4444' : '#6366f1'}
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Wishlist panel */}
        <div className="tq-card relative flex flex-col p-5 max-h-[420px] lg:max-h-none lg:h-full">
          <div className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" aria-hidden />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-white m-0">Wishlist</h3>
            <button onClick={() => navigate('/wishlist')} className="text-[12px] text-emerald-400 hover:text-emerald-300 transition">Kelola →</button>
          </div>

          {wishlists.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/40 text-[13px] gap-3">
              <p>Belum ada wishlist</p>
              <button onClick={() => navigate('/wishlist')} className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-[12px] text-white hover:bg-white/[0.09] transition">+ Tambah</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1 [scrollbar-width:thin]">
              {wishlists.slice(0, 6).map(item => {
                const prog = calcProgress(item.saved_amount, item.target_amount)
                return (
                  <div key={item.id} className="tq-card-inner p-3">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-[13px] font-semibold text-white/90 m-0 truncate pr-2">{item.name}</p>
                      <span className="text-[11px] font-bold text-white/60 shrink-0">{prog}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${prog}%` }} />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[11px] text-white/35">Rp {formatRupiah(item.saved_amount)}</span>
                      <span className="text-[11px] text-white/35">Rp {formatRupiah(item.target_amount)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Quick Add Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Tambah ${modalType === 'pemasukan' ? 'Pemasukan' : modalType === 'pengeluaran' ? 'Pengeluaran' : 'Alokasi Wishlist'}`}>
        <form onSubmit={handleQuickSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Tanggal</label>
            <input type="date" value={formData.date}
              onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
              className="tq-field w-full px-3 py-2.5 text-[13px]" required />
          </div>
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Nominal (Rp)</label>
            <input type="text" inputMode="numeric" value={amountDisplay}
              onChange={handleAmountChange} placeholder="0"
              className="tq-field w-full px-3 py-2.5 text-[13px]" required />
          </div>
          {modalType === 'alokasi' && wishlists.length > 0 && (
            <div>
              <label className="block text-[12px] text-white/50 mb-1.5">Hubungkan ke Wishlist</label>
              <select value={formData.wishlistId}
                onChange={e => setFormData(p => ({ ...p, wishlistId: e.target.value }))}
                className="tq-field tq-select w-full px-3 py-2.5 text-[13px]">
                <option value="">— Pilih Wishlist —</option>
                {wishlists.map(w => (
                  <option key={w.id} value={w.id}>{w.name} (Rp {formatRupiah(w.saved_amount)} / {formatRupiah(w.target_amount)})</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Keterangan</label>
            <textarea value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Masukkan keterangan..." rows={3}
              className="tq-field w-full px-3 py-2.5 text-[13px] resize-none" required />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] py-2.5 text-[13px] font-medium text-white transition hover:bg-white/[0.1]">
              Batal
            </button>
            <button type="submit" disabled={submitLoading}
              className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60 ${
                modalType === 'pemasukan'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                  : modalType === 'pengeluaran'
                  ? 'bg-gradient-to-r from-rose-600 to-red-700'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600'
              }`}>
              {submitLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}