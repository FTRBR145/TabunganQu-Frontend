import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { transactionService } from '../services/transactionService'
import { wishlistService } from '../services/wishlistService'
import { DEBUG_MODE } from '../config/debugMode'
import { DUMMY_SUMMARY, DUMMY_PEMASUKAN, DUMMY_PENGELUARAN, DUMMY_WISHLIST } from '../data/dummyData'
import { formatRupiah, formatDate } from '../utils/helpers'
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

function buildRunningBalance(transactions) {
  const sorted = [...transactions].sort((a, b) => {
    const da = new Date(a.transaction_date).getTime(), db = new Date(b.transaction_date).getTime()
    return da !== db ? da - db : (a.id ?? 0) - (b.id ?? 0)
  })
  let bal = 0; const map = new Map()
  for (const t of sorted) { 
    if (t.type === 'pemasukan') bal += t.amount; 
    else if (t.type === 'pengeluaran') bal -= t.amount; 
    // Type 'alokasi' does not affect saldo/running balance
    map.set(t.id, bal) 
  }
  return map
}

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

const paginate = (data, page, rpp) => data.slice((page - 1) * rpp, page * rpp)

/* ─── Main ─────────────────────────────────────────────── */
export default function Histori() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [allTransactions, setAllTransactions] = useState([])
  const [summary, setSummary] = useState({ saldo: 0, pemasukan: 0, pengeluaran: 0 })
  const [wishlists, setWishlists] = useState([])

  const [filterMonth, setFilterMonth] = useState('')
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rpp, setRpp] = useState(10)



  useEffect(() => { const q = searchParams.get('search'); if (q) setSearch(q) }, [searchParams])
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
      }, 400)
      return
    }
    try {
      const [sr, tr, wr] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getTransactions({}),
        wishlistService.getWishlists()
      ])
      setSummary(sr.data)
      setAllTransactions(tr.data || [])
      setWishlists(wr.data || [])
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }



  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fade-in text-white pb-10">

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 bg-gradient-to-br from-emerald-700 to-teal-900 ring-1 ring-white/[0.08] shadow-[0_4px_16px_rgba(16,185,129,0.12)]">
          <p className="text-[10px] text-emerald-100/70 uppercase tracking-widest font-medium">Total Saldo</p>
          <p className="text-[15px] font-semibold leading-tight tabular-nums">Rp {formatRupiah(summary.saldo)}</p>
        </div>
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 bg-gradient-to-br from-sky-700/90 to-indigo-900 ring-1 ring-white/[0.08] shadow-[0_4px_16px_rgba(59,130,246,0.10)]">
          <p className="text-[10px] text-sky-100/70 uppercase tracking-widest font-medium">Total Pemasukan</p>
          <p className="text-[15px] font-semibold leading-tight tabular-nums">Rp {formatRupiah(summary.pemasukan)}</p>
        </div>
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 bg-gradient-to-br from-rose-800/80 to-slate-900 ring-1 ring-white/[0.08] shadow-[0_4px_16px_rgba(239,68,68,0.09)]">
          <p className="text-[10px] text-rose-100/70 uppercase tracking-widest font-medium">Total Pengeluaran</p>
          <p className="text-[15px] font-semibold leading-tight tabular-nums">Rp {formatRupiah(summary.pengeluaran)}</p>
        </div>
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 bg-gradient-to-br from-indigo-700 to-violet-900 ring-1 ring-white/[0.08] shadow-[0_4px_16px_rgba(99,102,241,0.12)]">
          <p className="text-[10px] text-indigo-100/70 uppercase tracking-widest font-medium">Alokasi Wishlist</p>
          <p className="text-[15px] font-semibold leading-tight tabular-nums">Rp {formatRupiah(summary.alokasi || 0)}</p>
        </div>
      </div>

      {/* Wishlist snip */}
      {wishlists.length > 0 && (
        <div className="tq-card mb-5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="m-0 text-[13px] font-semibold">Wishlist</h3>
            <span className="text-[11px] text-white/35">Cuplikan target tabungan</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {wishlists.slice(0, 5).map(w => {
              const prog = !w.target_amount ? 0 : Math.min(100, Math.round((w.saved_amount / w.target_amount) * 100))
              return (
                <div key={w.id} className="tq-card-inner px-3 py-2.5 text-[12px] min-w-[160px] flex-1">
                  <div className="font-semibold text-white/90 mb-1 truncate">{w.name}</div>
                  <div className="h-1 w-full rounded-full bg-white/[0.08] mb-1.5">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${prog}%` }} />
                  </div>
                  <div className="text-white/40 text-[11px]">{prog}% · Rp {formatRupiah(w.saved_amount)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Transaction table */}
      <div className="tq-card p-4 min-[901px]:p-5">

        {/* Controls */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="m-0 text-[14px] font-semibold">Detail Transaksi</h3>
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

            <div className="flex-1 min-w-[180px] flex gap-2 items-center">
              <input type="text" placeholder="Cari keterangan..." value={search}
                onChange={e => { setSearch(e.target.value); if (searchParams.get('search')) setSearchParams({}) }}
                className="tq-field flex-1 px-3 py-2 text-[12px]" />
              {searchParams.get('search') && (
                <button onClick={() => { setSearchParams({}); setSearch('') }} className="text-[11px] text-emerald-400 hover:text-emerald-300 whitespace-nowrap">✕ Filter</button>
              )}
            </div>
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
                  <span className={`text-right font-medium ${item.type === 'pemasukan' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {item.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
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



      <Footer />
    </div>
  )
}
