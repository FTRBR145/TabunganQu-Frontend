import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { wishlistService } from '../services/wishlistService'
import { transactionService } from '../services/transactionService'
import { DEBUG_MODE } from '../config/debugMode'
import { DUMMY_SUMMARY, DUMMY_WISHLIST } from '../data/dummyData'
import { formatRupiah } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import Footer from '../components/layout/Footer'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/* ─── Helpers ─────────────────────────────────────────── */
const formatRupiahInput = (v) => {
  if (!v) return ''
  const n = v.toString().replace(/[^,\d]/g, ''), s = n.split(',')
  let sisa = s[0].length % 3, r = s[0].substr(0, sisa)
  const rib = s[0].substr(sisa).match(/\d{3}/gi)
  if (rib) r += (sisa ? '.' : '') + rib.join('.')
  return s[1] !== undefined ? r + ',' + s[1] : r
}
const parseNum = (s) => parseInt((s || '').replace(/[^,\d]/g, '')) || 0



export default function Wishlist() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [wishlists, setWishlists] = useState([])
  const [summary, setSummary] = useState({ saldo: 0 })
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formData, setFormData] = useState({ name: '', targetAmount: '', savedAmount: '0' })
  const [targetDisplay, setTargetDisplay] = useState('')
  const [savedDisplay, setSavedDisplay] = useState('')

  useEffect(() => { fetchAllData() }, [])

  const fetchAllData = async () => {
    setLoading(true)
    if (DEBUG_MODE.ENABLED) {
      setTimeout(() => {
        setSummary({ saldo: DUMMY_SUMMARY.saldo }); setWishlists(DUMMY_WISHLIST); setLoading(false)
      }, 500)
      return
    }
    try {
      const [sr, wr] = await Promise.all([transactionService.getSummary(), wishlistService.getWishlists()])
      setSummary(sr.data); setWishlists(wr.data)
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }

  const openAddModal = () => {
    setEditItem(null); setFormData({ name: '', targetAmount: '', savedAmount: '0' })
    setTargetDisplay(''); setSavedDisplay(''); setModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditItem(item)
    setFormData({ name: item.name, targetAmount: item.target_amount.toString(), savedAmount: item.saved_amount.toString() })
    setTargetDisplay(formatRupiahInput(item.target_amount.toString()))
    setSavedDisplay(formatRupiahInput(item.saved_amount.toString()))
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const target = parseInt(formData.targetAmount), saved = parseInt(formData.savedAmount) || 0
    if (!formData.name.trim()) { toast.error('Nama wishlist harus diisi'); return }
    if (!target || target <= 0) { toast.error('Target nominal harus lebih dari 0'); return }
    setLoading(true)
    try {
      const data = { name: formData.name.trim(), targetAmount: target, savedAmount: saved }
      if (editItem) { await wishlistService.updateWishlist(editItem.id, data); toast.success('Wishlist berhasil diupdate') }
      else { await wishlistService.createWishlist(data); toast.success('Wishlist berhasil ditambahkan') }
      setModalOpen(false); await fetchAllData()
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus wishlist ini?')) return
    setLoading(true)
    try {
      await wishlistService.deleteWishlist(id); toast.success('Wishlist berhasil dihapus')
      await fetchAllData()
    } catch { toast.error('Gagal menghapus wishlist') }
    finally { setLoading(false) }
  }

  const calcProgress = (s, t) => !t ? 0 : Math.min(100, Math.round((s / t) * 100))

  const filtered = wishlists
    .filter(w => !search || w.name.toLowerCase().includes(search.toLowerCase()))

  // Aggregate stats
  const totalTarget = wishlists.reduce((s, w) => s + w.target_amount, 0)
  const totalSaved = wishlists.reduce((s, w) => s + w.saved_amount, 0)
  const avgProgress = wishlists.length ? Math.round(wishlists.reduce((s, w) => s + calcProgress(w.saved_amount, w.target_amount), 0) / wishlists.length) : 0

  if (loading && !modalOpen) return <LoadingSpinner />

  return (
    <div className="text-white pb-10 animate-fade-in">

      {/* Overview strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 bg-gradient-to-br from-emerald-700 to-teal-900 ring-1 ring-white/[0.08] shadow-[0_4px_16px_rgba(16,185,129,0.12)]">
          <p className="text-[10px] text-emerald-100/70 uppercase tracking-widest font-medium">Saldo Tersedia</p>
          <p className="text-[17px] font-semibold leading-tight tabular-nums">Rp {formatRupiah(summary.saldo)}</p>
        </div>
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 bg-gradient-to-br from-slate-700 to-slate-900 ring-1 ring-white/[0.08] shadow-[0_4px_16px_rgba(99,102,241,0.08)]">
          <p className="text-[10px] text-slate-300/70 uppercase tracking-widest font-medium">Total Target</p>
          <p className="text-[17px] font-semibold leading-tight tabular-nums">Rp {formatRupiah(totalTarget)}</p>
        </div>
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 tq-card ring-1 ring-white/[0.08]">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Rata-rata Progress</p>
          <div className="flex items-end gap-2">
            <p className="text-[17px] font-semibold leading-tight">{avgProgress}<span className="text-[12px] font-normal text-white/40">%</span></p>
            <p className="text-[10px] text-white/35 mb-0.5">{wishlists.length} wishlist</p>
          </div>
          <div className="h-1 w-full rounded-full bg-white/[0.08] mt-0.5">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${avgProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <input type="text" placeholder="Cari wishlist..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="tq-field px-3 py-1.5 text-[12px] w-40 sm:w-52" />
        <button onClick={openAddModal}
          className="sm:self-auto self-stretch flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium text-[13px] transition-colors active:scale-[0.98]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah Wishlist
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[13px] text-white/30 border border-dashed border-white/[0.09] rounded-2xl">
            {wishlists.length === 0 ? 'Belum ada wishlist. Yuk buat wishlist pertama!' : 'Tidak ada wishlist yang cocok.'}
          </div>
        ) : (
          filtered.map(item => {
            const prog = calcProgress(item.saved_amount, item.target_amount)
            const sisa = Math.max(0, item.target_amount - item.saved_amount)
            return (
              <div key={item.id} className="tq-card p-5 flex flex-col gap-0 hover:shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-200">
                {/* Card header */}
                <div className="mb-3">
                  <h3 className="text-[14px] font-bold text-white m-0 truncate">{item.name}</h3>
                </div>

                {/* Stats */}
                <div className="space-y-1.5 text-[12px] mb-4">
                  <div className="flex justify-between"><span className="text-white/40">Target</span><span className="font-semibold text-white/85">Rp {formatRupiah(item.target_amount)}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Terkumpul</span><span className="font-semibold text-emerald-400">Rp {formatRupiah(item.saved_amount)}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Sisa</span><span className="font-semibold text-white/55">Rp {formatRupiah(sisa)}</span></div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-white/25 uppercase tracking-wider font-semibold">Progress</span>
                    <span className={`font-bold ${prog >= 100 ? 'text-emerald-400' : 'text-white/60'}`}>{prog}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 bg-emerald-500" style={{ width: `${prog}%` }} />
                  </div>
                  {prog >= 100 && <p className="text-[11px] text-emerald-400 mt-1 font-medium">🎉 Target tercapai!</p>}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 mt-auto pt-3 border-t border-white/[0.07]">
                  <button onClick={() => openEditModal(item)} className="text-[12px] font-medium text-blue-400 hover:text-blue-300 transition">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-[12px] font-medium text-red-400 hover:text-red-300 transition">Hapus</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Wishlist' : 'Tambah Wishlist'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Nama Wishlist</label>
            <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              className="tq-field w-full px-3 py-2.5 text-[13px]" placeholder="Contoh: Laptop Baru" required />
          </div>

          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Target Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-white/40">Rp</span>
              <input type="text" inputMode="numeric" value={targetDisplay}
                onChange={e => { const f = formatRupiahInput(e.target.value); setTargetDisplay(f); setFormData(p => ({ ...p, targetAmount: parseNum(f).toString() })) }}
                placeholder="0" className="tq-field w-full pl-8 pr-3 py-2.5 text-[13px]" required />
            </div>
          </div>
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Sudah Terkumpul (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-white/40">Rp</span>
              <input type="text" inputMode="numeric" value={savedDisplay}
                onChange={e => { const f = formatRupiahInput(e.target.value); setSavedDisplay(f); setFormData(p => ({ ...p, savedAmount: parseNum(f).toString() })) }}
                placeholder="0" className="tq-field w-full pl-8 pr-3 py-2.5 text-[13px]" />
            </div>
            <p className="text-[11px] text-white/30 mt-1">* Kosongi atau isi 0 jika belum ada tabungan</p>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] py-2.5 text-[13px] font-medium text-white transition hover:bg-white/[0.1]">Batal</button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  )
}
