import { useState, useEffect, useMemo } from 'react'
import { useToast } from '../context/ToastContext'
import { transactionService } from '../services/transactionService'
import { wishlistService } from '../services/wishlistService'
import { DEBUG_MODE } from '../config/debugMode'
import { DUMMY_SUMMARY, DUMMY_PEMASUKAN, DUMMY_PENGELUARAN, DUMMY_WISHLIST } from '../data/dummyData'
import { formatRupiah, formatDate, getTodayISO } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import Footer from '../components/layout/Footer'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/* ─── Helpers ─────────────────────────────────────────── */
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

const getMonthFilterOptions = () => {
  const opts = [{ value: '', label: 'Semua bulan' }]
  for (let i = 0; i < 12; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    opts.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d)
    })
  }
  return opts
}

function buildRunningBalance(transactions) {
  const sorted = [...transactions].sort((a, b) => {
    const da = new Date(a.transaction_date).getTime(), db = new Date(b.transaction_date).getTime()
    return da !== db ? da - db : (a.id ?? 0) - (b.id ?? 0)
  })
  let bal = 0; const map = new Map()
  for (const t of sorted) {
    if (t.type === 'pemasukan') bal += t.amount
    else if (t.type === 'pengeluaran') bal -= t.amount
    map.set(t.id, bal)
  }
  return map
}

const paginate = (data, page, rpp) => data.slice((page - 1) * rpp, page * rpp)

/* ─── Main component ──────────────────────────────────── */
export default function Saldo() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [allTransactions, setAllTransactions] = useState([])
  const [summary, setSummary] = useState({ saldo: 0, pemasukan: 0, pengeluaran: 0, alokasi: 0 })
  const [wishlists, setWishlists] = useState([])

  const [filterMonth, setFilterMonth] = useState('')
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rpp, setRpp] = useState(10)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('pemasukan')
  const [editItem, setEditItem] = useState(null)
  const [formData, setFormData] = useState({ date: getTodayISO(), amount: '', description: '', wishlistId: '' })
  const [amountDisplay, setAmountDisplay] = useState('')

  useEffect(() => { fetchAllData() }, [])
  useEffect(() => { setPage(1) }, [filterMonth, filterType, search])

  const balMap = useMemo(() => buildRunningBalance(allTransactions), [allTransactions])

  const displayedRows = useMemo(() => {
    let rows = [...allTransactions]
    if (filterMonth) rows = rows.filter(t => t.transaction_date?.startsWith(filterMonth))
    if (filterType) rows = rows.filter(t => t.type === filterType)
    if (search.trim()) { const q = search.toLowerCase(); rows = rows.filter(t => t.description.toLowerCase().includes(q)) }
    rows.sort((a, b) => {
      const d = new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      return d !== 0 ? d : (b.id ?? 0) - (a.id ?? 0)
    })
    return rows
  }, [allTransactions, filterMonth, filterType, search])

  const totalPages = Math.max(1, Math.ceil(displayedRows.length / rpp))
  const paginatedRows = useMemo(() => paginate(displayedRows, page, rpp), [displayedRows, page, rpp])

  const fetchAllData = async () => {
    setLoading(true)
    if (DEBUG_MODE.ENABLED) {
      setTimeout(() => {
        setSummary(DUMMY_SUMMARY)
        setAllTransactions([...DUMMY_PEMASUKAN, ...DUMMY_PENGELUARAN])
        setWishlists(DUMMY_WISHLIST)
        setLoading(false)
      }, 500)
      return
    }
    try {
      const [sumRes, trRes, wRes] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getTransactions({}),
        wishlistService.getWishlists()
      ])
      setSummary(sumRes.data)
      setAllTransactions(trRes.data || [])
      setWishlists(wRes.data || [])
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }

  const openAddModal = (type) => {
    setModalType(type); setEditItem(null)
    setFormData({ date: getTodayISO(), amount: '', description: '', wishlistId: '' })
    setAmountDisplay(''); setModalOpen(true)
  }
  const openEditModal = (item) => {
    setModalType(item.type); setEditItem(item)
    setFormData({ date: item.transaction_date, amount: item.amount.toString(), description: item.description, wishlistId: '' })
    setAmountDisplay(formatRupiahInput(item.amount.toString())); setModalOpen(true)
  }

  const handleAmountChange = (e) => {
    const f = formatRupiahInput(e.target.value)
    setAmountDisplay(f); setFormData(p => ({ ...p, amount: parseRupiahToNumber(f).toString() }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = parseInt(formData.amount)
    if (!amount || amount <= 0) { toast.error('Nominal harus lebih dari 0'); return }
    if (!formData.description.trim()) { toast.error('Keterangan harus diisi'); return }
    if (modalType !== 'pemasukan' && !editItem && amount > summary.saldo) { toast.error('Saldo tidak cukup!'); return }

    setLoading(true)
    try {
      const data = { type: modalType, amount, description: formData.description.trim(), transactionDate: formData.date, wishlistId: formData.wishlistId || null }
      if (editItem) {
        await transactionService.updateTransaction(editItem.id, data)
        toast.success(`${modalType} berhasil diupdate`)
      } else {
        await transactionService.createTransaction(data)
        toast.success(`${modalType} berhasil ditambahkan`)
        if (formData.wishlistId) {
          try {
            const w = wishlists.find(x => x.id === parseInt(formData.wishlistId))
            if (w) {
              const ns = w.saved_amount + amount
              await wishlistService.updateWishlist(formData.wishlistId, { name: w.name, targetAmount: w.target_amount, savedAmount: ns })
              toast.success(`Tabungan "${w.name}" diperbarui: Rp ${formatRupiah(w.saved_amount)} → Rp ${formatRupiah(ns)}`)
            }
          } catch { toast.error('Gagal update wishlist, transaksi tetap tersimpan') }
        }
      }
      setModalOpen(false)
      await fetchAllData()
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini?')) return
    setLoading(true)
    try {
      await transactionService.deleteTransaction(id)
      toast.success('Transaksi berhasil dihapus')
      await fetchAllData()
    } catch { toast.error('Gagal menghapus transaksi') }
    finally { setLoading(false) }
  }

  if (loading && !modalOpen) return <LoadingSpinner />

  return (
    <div className="text-white pb-10 animate-fade-in">

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 bg-gradient-to-br from-emerald-700 to-teal-900 shadow-[0_4px_16px_rgba(16,185,129,0.12)] ring-1 ring-white/[0.08]">
          <p className="text-[10px] text-emerald-100/70 uppercase tracking-widest font-medium">Total Saldo</p>
          <p className="text-[15px] font-semibold text-white leading-tight tabular-nums">Rp {formatRupiah(summary.saldo)}</p>
        </div>
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 bg-gradient-to-br from-sky-700/90 to-indigo-900 shadow-[0_4px_16px_rgba(59,130,246,0.10)] ring-1 ring-white/[0.08]">
          <p className="text-[10px] text-sky-100/70 uppercase tracking-widest font-medium">Total Pemasukan</p>
          <p className="text-[15px] font-semibold text-white leading-tight tabular-nums">Rp {formatRupiah(summary.pemasukan)}</p>
        </div>
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 bg-gradient-to-br from-rose-800/80 to-slate-900 shadow-[0_4px_16px_rgba(239,68,68,0.09)] ring-1 ring-white/[0.08]">
          <p className="text-[10px] text-rose-100/70 uppercase tracking-widest font-medium">Total Pengeluaran</p>
          <p className="text-[15px] font-semibold text-white leading-tight tabular-nums">Rp {formatRupiah(summary.pengeluaran)}</p>
        </div>
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 bg-gradient-to-br from-indigo-700 to-violet-900 shadow-[0_4px_16px_rgba(99,102,241,0.12)] ring-1 ring-white/[0.08]">
          <p className="text-[10px] text-indigo-100/70 uppercase tracking-widest font-medium">Alokasi Wishlist</p>
          <p className="text-[15px] font-semibold text-white leading-tight tabular-nums">Rp {formatRupiah(summary.alokasi || 0)}</p>
        </div>
      </div>

      {/* Unified transaction table */}
      <div className="tq-card p-4 min-[901px]:p-5">

        {/* Header with add buttons */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="m-0 text-[14px] font-semibold">Detail Transaksi</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openAddModal('pemasukan')}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-[12px] font-medium transition-colors">
                + Pemasukan
              </button>
              <button onClick={() => openAddModal('pengeluaran')}
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 px-3 py-1.5 text-[12px] font-medium transition-colors">
                + Pengeluaran
              </button>
              <button onClick={() => openAddModal('alokasi')}
                className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-3 py-1.5 text-[12px] font-medium transition-colors">
                + Alokasi Wishlist
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-2 items-center">
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
              className="tq-field tq-select py-2 px-3 text-[12px]">
              {getMonthFilterOptions().map(o => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
            </select>

            <div className="flex rounded-lg border border-white/[0.09] overflow-hidden text-[12px] font-medium">
              {[
                { v: '', l: 'Semua' },
                { v: 'pemasukan', l: 'Masuk' },
                { v: 'pengeluaran', l: 'Keluar' },
                { v: 'alokasi', l: 'Alokasi' }
              ].map(o => (
                <button key={o.v} onClick={() => setFilterType(o.v)}
                  className={`px-3 py-1.5 transition ${filterType === o.v
                    ? o.v === 'pemasukan' ? 'bg-emerald-600 text-white' : o.v === 'pengeluaran' ? 'bg-rose-600 text-white' : o.v === 'alokasi' ? 'bg-indigo-600 text-white' : 'bg-white/[0.12] text-white'
                    : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.07] hover:text-white'}`}>
                  {o.l}
                </button>
              ))}
            </div>

            <input type="text" placeholder="Cari keterangan..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="tq-field flex-1 min-w-[180px] px-3 py-2 text-[12px]" />
          </div>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col gap-2.5 md:hidden">
          {paginatedRows.length === 0
            ? <div className="py-10 text-center text-[13px] text-white/35">Tidak ada transaksi</div>
            : paginatedRows.map(item => (
              <div key={item.id} className="tq-card-inner p-3.5">
                <div className="flex justify-between text-[11px] text-white/40 mb-1.5">
                  <span>{formatDate(item.transaction_date)}</span>
                  <span className="text-white/50">Saldo: Rp {formatRupiah(balMap.get(item.id) ?? 0)}</span>
                </div>
                <p className="text-[13px] text-white/85 mb-2">{item.description}</p>
                {item.wishlist_name && (
                  <div className="mb-2.5">
                    <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                      Target: {item.wishlist_name}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-y-1 text-[11px] mb-2.5">
                  <span className="text-white/40">Jenis</span>
                  <span className={`text-right font-medium ${item.type === 'pemasukan' ? 'text-emerald-400' : item.type === 'pengeluaran' ? 'text-red-400' : 'text-sky-400'}`}>
                    {item.type === 'pemasukan' ? 'Pemasukan' : item.type === 'pengeluaran' ? 'Pengeluaran' : 'Alokasi'}
                  </span>
                  <span className="text-white/40">Nominal</span>
                  <span className={`text-right font-mono ${item.type === 'pemasukan' ? 'text-emerald-400' : item.type === 'pengeluaran' ? 'text-red-400' : 'text-sky-400'}`}>
                    {item.type === 'pemasukan' ? '+' : item.type === 'pengeluaran' ? '-' : '•'} Rp {formatRupiah(item.amount)}
                  </span>
                </div>
              </div>
            ))
          }
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-white/[0.07]">
          <table className="w-full min-w-[780px]">
            <thead className="bg-white/[0.04]">
              <tr>
                {['Tanggal', 'Keterangan', 'Jenis', 'Wishlist', 'Pengeluaran', 'Pemasukan', 'Alokasi', 'Saldo Berjal.'].map(h => (
                  <th key={h} className={`px-3 py-2.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider ${['Pengeluaran','Pemasukan','Alokasi','Saldo Berjal.'].includes(h) ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {paginatedRows.length === 0
                ? <tr><td colSpan={8} className="py-10 text-center text-[13px] text-white/35">Tidak ada transaksi</td></tr>
                : paginatedRows.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-3 py-3 text-[12px] text-white/60 whitespace-nowrap">{formatDate(item.transaction_date)}</td>
                    <td className="px-3 py-3 text-[13px] text-white/85 max-w-[200px] truncate">{item.description}</td>
                    <td className="px-3 py-3">
                      <span className={`tq-badge ${item.type === 'pemasukan' ? 'tq-badge-income' : item.type === 'pengeluaran' ? 'tq-badge-expense' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'}`}>
                        {item.type === 'pemasukan' ? 'Masuk' : item.type === 'pengeluaran' ? 'Keluar' : 'Alokasi'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[12px] text-white/60">
                      {item.wishlist_name ? (
                        <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20 max-w-[120px] truncate">
                          {item.wishlist_name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[12px] text-red-400">
                      {item.type === 'pengeluaran' ? `Rp ${formatRupiah(item.amount)}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[12px] text-emerald-400">
                      {item.type === 'pemasukan' ? `Rp ${formatRupiah(item.amount)}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[12px] text-sky-400">
                      {item.type === 'alokasi' ? `Rp ${formatRupiah(item.amount)}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[12px] text-white/55">
                      Rp {formatRupiah(balMap.get(item.id) ?? 0)}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {displayedRows.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-4 border-t border-white/[0.07]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/40">Baris:</span>
              <select value={rpp} onChange={e => { setRpp(Number(e.target.value)); setPage(1) }} className="tq-field tq-select py-1 px-2 text-[11px]">
                <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              {[['«', 1], ['‹', page - 1]].map(([l, t]) => (
                <button key={l} onClick={() => setPage(t)} disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.05] text-[12px] disabled:opacity-30 hover:bg-white/[0.09] transition">{l}</button>
              ))}
              <span className="text-[11px] text-white/40 px-2">{page}/{totalPages}</span>
              {[['›', page + 1], ['»', totalPages]].map(([l, t]) => (
                <button key={l} onClick={() => setPage(t)} disabled={page === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.05] text-[12px] disabled:opacity-30 hover:bg-white/[0.09] transition">{l}</button>
              ))}
            </div>
            <span className="text-[11px] text-white/35">{(page-1)*rpp+1}–{Math.min(page*rpp,displayedRows.length)} dari {displayedRows.length}</span>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={`${editItem ? 'Edit' : 'Tambah'} ${modalType === 'pemasukan' ? 'Pemasukan' : modalType === 'pengeluaran' ? 'Pengeluaran' : 'Alokasi Wishlist'}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Tanggal</label>
            <input type="date" value={formData.date}
              onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
              className="tq-field w-full px-3 py-2.5 text-[13px]" required />
          </div>
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-white/40">Rp</span>
              <input type="text" inputMode="numeric" value={amountDisplay}
                onChange={handleAmountChange} placeholder="0"
                className="tq-field w-full pl-8 pr-3 py-2.5 text-[13px]" required />
            </div>
          </div>
          {!editItem && modalType === 'alokasi' && wishlists.length > 0 && (
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
              className="tq-field w-full px-3 py-2.5 text-[13px] resize-none" rows={3}
              placeholder="Contoh: Nabung buat Laptop" required />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] py-2.5 text-[13px] font-medium text-white transition hover:bg-white/[0.1]">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60 ${
                modalType === 'pemasukan' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 
                modalType === 'pengeluaran' ? 'bg-gradient-to-r from-rose-600 to-red-700' :
                'bg-gradient-to-r from-indigo-600 to-violet-600'
              }`}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  )
}