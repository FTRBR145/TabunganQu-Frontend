import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { transactionService } from '../services/transactionService'
import { wishlistService } from '../services/wishlistService'
import { formatRupiah, formatDateFull, getMonthName } from '../utils/helpers'
import Footer from '../components/layout/Footer'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { DEBUG_MODE } from '../config/debugMode'
import { DUMMY_SUMMARY, DUMMY_ALL_TRANSACTIONS, DUMMY_CHART } from '../data/dummyData'

/* ─── Date range presets ─────────────────────────── */
const getPreset = (key) => {
  const now = new Date()
  const iso = (d) => d.toISOString().split('T')[0]
  switch (key) {
    case 'this_week': {
      const day = now.getDay() || 7
      const mon = new Date(now); mon.setDate(now.getDate() - day + 1)
      return { start: iso(mon), end: iso(now) }
    }
    case 'last_week': {
      const day = now.getDay() || 7
      const mon = new Date(now); mon.setDate(now.getDate() - day - 6)
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      return { start: iso(mon), end: iso(sun) }
    }
    case 'this_month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: iso(s), end: iso(now) }
    }
    case 'last_month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: iso(s), end: iso(e) }
    }
    case 'this_year': {
      return { start: `${now.getFullYear()}-01-01`, end: iso(now) }
    }
    default: return null
  }
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']

export default function Report() {
  const { user } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())
  const [dateMode, setDateMode] = useState('month') // 'month' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [activePreset, setActivePreset] = useState('')
  const [txSearch, setTxSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  const [summary, setSummary] = useState({ pemasukan: 0, pengeluaran: 0, saldo: 0, total_transactions_pemasukan: 0, total_transactions_pengeluaran: 0 })
  const [transactions, setTransactions] = useState([])
  const [wishlists, setWishlists] = useState([])
  const [chartData, setChartData] = useState([])
  const [yearlyData, setYearlyData] = useState(null)

  const pickerRef = useRef(null)

  useEffect(() => {
    function h(e) { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowMonthPicker(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => { fetchReport() }, [selectedMonth, customStart, customEnd, dateMode, activePreset])

  const fetchReport = async () => {
    setLoading(true)
    if (DEBUG_MODE.ENABLED) {
      setTimeout(() => {
        setSummary({ ...DUMMY_SUMMARY, total_transactions_pemasukan: 2, total_transactions_pengeluaran: 2 })
        setTransactions(DUMMY_ALL_TRANSACTIONS)
        setChartData([{ day: 1, pemasukan: 5000000, pengeluaran: 0 }, { day: 5, pemasukan: 0, pengeluaran: 1500000 }, { day: 10, pemasukan: 10000000, pengeluaran: 0 }])
        setYearlyData(Array.from({ length: 12 }, (_, i) => ({
          month: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][i],
          pemasukan: 5000000, pengeluaran: 2000000,
          isCurrentMonth: i + 1 === parseInt(selectedMonth.split('-')[1])
        })))
        setLoading(false)
      }, 400)
      return
    }

    try {
      let startDate, endDate
      if (dateMode === 'custom' && customStart && customEnd) {
        startDate = customStart; endDate = customEnd
      } else {
        startDate = `${selectedMonth}-01`
        const [y, m] = selectedMonth.split('-')
        endDate = `${selectedMonth}-${new Date(Number(y), Number(m), 0).getDate()}`
      }

      const summaryRes = await transactionService.getSummary(dateMode === 'month' ? selectedMonth : undefined)
      setSummary(summaryRes.data)

      const txRes = await transactionService.getTransactions({ startDate, endDate })
      const sorted = txRes.data.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      setTransactions(sorted)

      const wRes = await wishlistService.getWishlists()
      setWishlists(wRes.data || [])

      // Daily chart
      const dailyMap = new Map()
      const daysInMonth = new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) dailyMap.set(i, { pemasukan: 0, pengeluaran: 0, alokasi: 0 });

      sorted.forEach(t => {
        const day = new Date(t.transaction_date).getDate()
        const cur = dailyMap.get(day) || { pemasukan: 0, pengeluaran: 0, alokasi: 0 }
        if (t.type === 'pemasukan') cur.pemasukan += t.amount; 
        else if (t.type === 'pengeluaran') cur.pengeluaran += t.amount;
        else if (t.type === 'alokasi') cur.alokasi += t.amount;
        dailyMap.set(day, cur)
      })
      setChartData([...dailyMap.entries()].sort((a, b) => a[0] - b[0]).map(([day, d]) => ({ day, ...d })))

      // Yearly chart
      const year = selectedMonth.split('-')[0]
      const yearlyRes = await transactionService.getTransactions({ startDate: `${year}-01-01`, endDate: `${year}-12-31` })
      const monthMap = new Map()
      yearlyRes.data.forEach(t => {
        const mo = new Date(t.transaction_date).getMonth() + 1
        const cur = monthMap.get(mo) || { pemasukan: 0, pengeluaran: 0, alokasi: 0 }
        if (t.type === 'pemasukan') cur.pemasukan += t.amount; 
        else if (t.type === 'pengeluaran') cur.pengeluaran += t.amount;
        else if (t.type === 'alokasi') cur.alokasi += t.amount;
        monthMap.set(mo, cur)
      })
      setYearlyData(Array.from({ length: 12 }, (_, i) => {
        const d = monthMap.get(i + 1) || { pemasukan: 0, pengeluaran: 0, alokasi: 0 }
        return { month: getMonthName(i), ...d, isCurrentMonth: i + 1 === parseInt(selectedMonth.split('-')[1]) }
      }))
    } catch { toast.error('Gagal memuat laporan') }
    finally { setLoading(false) }
  }

  const applyPreset = (key) => {
    const range = getPreset(key)
    if (!range) return
    setActivePreset(key); setDateMode('custom'); setCustomStart(range.start); setCustomEnd(range.end)
  }

  const getCategoryData = () => {
    const map = new Map()
    transactions.forEach(t => { if (t.type === 'pengeluaran') map.set(t.description, (map.get(t.description) || 0) + t.amount) })
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)
  }

  const displayedTx = useMemo(() => {
    let rows = [...transactions]
    if (filterType) rows = rows.filter(t => t.type === filterType)
    if (txSearch.trim()) { const q = txSearch.toLowerCase(); rows = rows.filter(t => t.description.toLowerCase().includes(q)) }
    return rows
  }, [transactions, filterType, txSearch])

  // Membuat label periode sesuai mode yang dipilih user
  const getReportLabel = () => {
    if (dateMode === 'custom' && (customStart || customEnd)) {
      const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '?'
      if (activePreset) {
        const presetLabel = PRESETS.find(p => p.key === activePreset)?.label || ''
        return { title: `Laporan Keuangan – ${presetLabel}`, file: presetLabel.replace(/\s+/g, '_') }
      }
      return { title: `Laporan Keuangan ${fmt(customStart)} – ${fmt(customEnd)}`, file: `${customStart}_sd_${customEnd}` }
    }
    // Mode bulan
    const mn = getMonthName(parseInt(selectedMonth.split('-')[1]) - 1)
    const yr = selectedMonth.split('-')[0]
    return { title: `Laporan Keuangan ${mn} ${yr}`, file: `${mn}_${yr}` }
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const { title, file } = getReportLabel()
      doc.setFontSize(18); doc.text(title, 14, 20)
      doc.setFontSize(10); doc.setTextColor(100, 100, 100)
      doc.text(`Nama: ${user?.name || '-'} | Email: ${user?.email || '-'} | Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 30)
      autoTable(doc, { 
        startY: 36, 
        head: [['Deskripsi', 'Nilai']],
        body: [['Total Pemasukan', formatRupiah(summary.pemasukan)], ['Total Pengeluaran', formatRupiah(summary.pengeluaran)], ['Saldo', formatRupiah(summary.saldo)]],
        theme: 'grid', 
        styles: { fontSize: 9 }, 
        headStyles: { fillColor: [16, 185, 129] },
        columnStyles: { 1: { halign: 'right' } },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            doc.setFontSize(8);
            doc.text('Rp', data.cell.x + 2, data.cell.y + data.cell.height / 2 + 1.5);
          }
        }
      })
      if (wishlists.length > 0) {
        autoTable(doc, {
          startY: (doc.lastAutoTable?.finalY || 50) + 8,
          head: [['Nama Wishlist', 'Target', 'Terkumpul', '%', 'Status']],
          body: wishlists.map(w => {
            const prog = Math.min(100, Math.round((w.saved_amount / w.target_amount) * 100))
            return [w.name, formatRupiah(w.target_amount), formatRupiah(w.saved_amount), `${prog}%`, prog >= 100 ? 'Tercapai' : 'Proses']
          }),
          theme: 'grid', 
          styles: { fontSize: 8 }, 
          headStyles: { fillColor: [79, 70, 229] },
          columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
          didDrawCell: (data) => {
            if (data.section === 'body' && (data.column.index === 1 || data.column.index === 2)) {
              doc.setFontSize(7);
              doc.text('Rp', data.cell.x + 1.5, data.cell.y + data.cell.height / 2 + 1.2);
            }
          }
        })
      }
      if (transactions.length > 0) {
        autoTable(doc, {
          startY: (doc.lastAutoTable?.finalY || 50) + 8,
          head: [['Tanggal', 'Keterangan', 'Tipe', 'Wishlist', 'Nominal']],
          body: transactions.map(t => [
            formatDateFull(t.transaction_date), 
            t.description, 
            t.type === 'pemasukan' ? 'Pemasukan' : t.type === 'pengeluaran' ? 'Pengeluaran' : 'Alokasi',
            t.wishlist_name || '-',
            formatRupiah(t.amount)
          ]),
          theme: 'grid', 
          styles: { fontSize: 8 }, 
          headStyles: { fillColor: [34, 197, 94] },
          columnStyles: { 4: { halign: 'right' } },
          didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 4) {
              doc.setFontSize(7);
              doc.text('Rp', data.cell.x + 1.5, data.cell.y + data.cell.height / 2 + 1.2);
            }
          }
        })
      }
      doc.save(`Laporan_${file}.pdf`)
      toast.success('PDF berhasil diexport!')
    } catch { toast.error('Gagal export PDF') }
  }

  const exportToExcel = async () => {
    try {
      const { title, file } = getReportLabel()
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Laporan')

      // Set default row height and column widths
      ws.properties.defaultRowHeight = 22
      ws.columns = [
        { width: 22 }, // A - Tanggal / Deskripsi
        { width: 35 }, // B - Keterangan / Nama Wishlist
        { width: 17 }, // C - Tipe / Target
        { width: 17 }, // D - Wishlist / Terkumpul
        { width: 20 }, // E - Nominal / Status
      ]

      // Helper: Style for Table Headers
      const styleHeaderRow = (row) => {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } } // Emerald 500
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
          }
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        })
      }

      // Helper: Style for Data Rows
      const styleDataRow = (row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
          }
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
        })
      }

      // Format uang rata kiri-kanan (Accounting format Excel)
      const accountingFmt = '_("Rp"* #,##0_);_("Rp"* \\(#,##0\\);_("Rp"* "-"_);_(@_)'

      // Title & Info
      ws.addRow(['LAPORAN KEUANGAN']).font = { bold: true, size: 14 }
      ws.addRow([title])
      ws.addRow([])
      ws.addRow(['INFORMASI PENGGUNA']).font = { bold: true, size: 11 }
      ws.addRow(['Nama', user?.name || '-'])
      ws.addRow(['Email', user?.email || '-'])
      ws.addRow(['Dicetak', new Date().toLocaleDateString('id-ID')])
      ws.addRow([])

      // --- SECTION 1: RINGKASAN SALDO ---
      ws.addRow(['RINGKASAN SALDO']).font = { bold: true, size: 12 }
      const headerSummary = ws.addRow(['Deskripsi', 'Nilai'])
      styleHeaderRow(headerSummary)

      const sumData = [
        ['Total Pemasukan', Number(summary.pemasukan)],
        ['Total Pengeluaran', Number(summary.pengeluaran)],
        ['Saldo Utama', Number(summary.saldo)]
      ]

      sumData.forEach(data => {
        const row = ws.addRow(data)
        styleDataRow(row)
        row.getCell(2).numFmt = accountingFmt
      })
      ws.addRow([])

      // --- SECTION 2: STATUS WISHLIST ---
      if (wishlists.length > 0) {
        ws.addRow(['STATUS WISHLIST']).font = { bold: true, size: 12 }
        const headerWishlist = ws.addRow(['Nama Wishlist', 'Target', 'Terkumpul', 'Persentase', 'Status'])
        styleHeaderRow(headerWishlist)

        wishlists.forEach(w => {
          const prog = Math.min(100, Math.round((w.saved_amount / w.target_amount) * 100))
          const row = ws.addRow([
            w.name, 
            Number(w.target_amount), 
            Number(w.saved_amount), 
            `${prog}%`, 
            prog >= 100 ? 'Tercapai' : 'Proses'
          ])
          styleDataRow(row)
          row.getCell(2).numFmt = accountingFmt
          row.getCell(3).numFmt = accountingFmt
          row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }
          row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' }
        })
        ws.addRow([])
      }

      // --- SECTION 3: DETAIL TRANSAKSI ---
      if (transactions.length > 0) {
        ws.addRow(['DETAIL TRANSAKSI']).font = { bold: true, size: 12 }
        const headerTrans = ws.addRow(['Tanggal', 'Keterangan', 'Tipe', 'Wishlist', 'Nominal'])
        styleHeaderRow(headerTrans)

        transactions.forEach(t => {
          const row = ws.addRow([
            formatDateFull(t.transaction_date), 
            t.description, 
            t.type === 'pemasukan' ? 'Masuk' : t.type === 'pengeluaran' ? 'Keluar' : 'Alokasi', 
            t.wishlist_name || '-',
            Number(t.amount)
          ])
          styleDataRow(row)
          row.getCell(5).numFmt = accountingFmt
          row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }
          row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }
        })
      }

      // Download file
      const buffer = await wb.xlsx.writeBuffer()
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Laporan_${file}.xlsx`)
      toast.success('Excel berhasil diexport!')
    } catch (err) { 
      console.error(err)
      toast.error('Gagal export Excel') 
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div className="bg-[#1e2b21] border border-white/[0.09] py-2 px-3 rounded-xl shadow-xl text-[12px] text-white">
        <p className="font-semibold mb-1 text-white/60">{label}</p>
        {payload.map((e, i) => (
          <p key={i} style={{ color: e.color }} className="font-mono">{e.name}: Rp {formatRupiah(e.value)}</p>
        ))}
      </div>
    )
    return null
  }

  const selectedDate = new Date(selectedMonth.split('-')[0], parseInt(selectedMonth.split('-')[1]) - 1)
  const monthName = getMonthName(selectedDate.getMonth())
  const year = selectedDate.getFullYear()
  const categoryData = getCategoryData()

  const PRESETS = [
    { key: 'this_week', label: 'Minggu ini' },
    { key: 'last_week', label: 'Minggu lalu' },
    { key: 'this_month', label: 'Bulan ini' },
    { key: 'last_month', label: 'Bulan lalu' },
    { key: 'this_year', label: 'Tahun ini' },
  ]

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner /></div>

  return (
    <div className="text-white pb-10 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-[12px] text-white/40 mt-0.5">Analisis keuangan & ekspor laporan</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportToPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/25 bg-red-500/[0.07] text-red-300/80 hover:bg-red-500/[0.14] transition-colors text-[12px] font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export PDF
          </button>
          <button onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-300/80 hover:bg-emerald-500/[0.14] transition-colors text-[12px] font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* Date filter section */}
      <div className="tq-card p-4 mb-5 relative z-10">
        <p className="text-[11px] text-white/35 uppercase tracking-wider font-semibold mb-3">Filter Periode</p>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => applyPreset(p.key)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition ${activePreset === p.key && dateMode === 'custom' ? 'bg-emerald-600 text-white' : 'border border-white/[0.09] text-white/55 hover:text-white hover:border-white/20'}`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex rounded-xl border border-white/[0.09] overflow-hidden text-[12px]">
            <button onClick={() => { setDateMode('month'); setActivePreset('') }}
              className={`px-3 py-1.5 font-medium transition ${dateMode === 'month' ? 'bg-white/[0.12] text-white' : 'text-white/45 hover:text-white hover:bg-white/[0.06]'}`}>
              Pilih Bulan
            </button>
            <button onClick={() => { setDateMode('custom'); setActivePreset('') }}
              className={`px-3 py-1.5 font-medium transition ${dateMode === 'custom' && !activePreset ? 'bg-white/[0.12] text-white' : 'text-white/45 hover:text-white hover:bg-white/[0.06]'}`}>
              Rentang Tanggal
            </button>
          </div>

          {dateMode === 'month' && (
            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => { setShowMonthPicker(!showMonthPicker); setPickerYear(parseInt(selectedMonth.split('-')[0])) }}
                className="flex items-center gap-2 tq-field px-3 py-2 text-[13px]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {getMonthName(parseInt(selectedMonth.split('-')[1]) - 1)} {selectedMonth.split('-')[0]}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showMonthPicker && (
                <div className="absolute left-0 top-[calc(100%+6px)] z-50 bg-[#1e2b21] border border-white/[0.09] rounded-xl shadow-2xl p-4 w-[260px]">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setPickerYear(y => y - 1)} className="text-white/50 hover:text-white p-1 rounded transition">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <span className="text-[13px] font-semibold text-white">{pickerYear}</span>
                    <button onClick={() => setPickerYear(y => y + 1)} className="text-white/50 hover:text-white p-1 rounded transition">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'].map((m, i) => {
                      const val = `${pickerYear}-${String(i + 1).padStart(2, '0')}`
                      const isSel = val === selectedMonth
                      return (
                        <button key={i} onClick={() => { setSelectedMonth(val); setShowMonthPicker(false) }}
                          className={`py-1.5 rounded-lg text-[12px] font-medium transition ${isSel ? 'bg-emerald-600 text-white' : 'text-white/60 hover:bg-white/[0.09] hover:text-white'}`}>
                          {m}
                        </button>
                      )
                    })}
                  </div>
                  <button onClick={() => { const n = new Date(); setSelectedMonth(`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`); setShowMonthPicker(false) }}
                    className="mt-3 w-full text-center text-[12px] text-emerald-400 hover:text-emerald-300 transition">
                    Bulan ini
                  </button>
                </div>
              )}
            </div>
          )}

          {(dateMode === 'custom') && (
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={customStart} onChange={e => { setCustomStart(e.target.value); setActivePreset('') }}
                className="tq-field px-3 py-2 text-[12px]" />
              <span className="text-[12px] text-white/30">s/d</span>
              <input type="date" value={customEnd} onChange={e => { setCustomEnd(e.target.value); setActivePreset('') }}
                className="tq-field px-3 py-2 text-[12px]" />
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
        {[
          { label: 'Saldo', val: summary.saldo, from: 'from-emerald-700', to: 'to-teal-900', shadow: 'shadow-[0_4px_16px_rgba(16,185,129,0.12)]', sub: null },
          { label: 'Pemasukan', val: summary.pemasukan, from: 'from-sky-700/90', to: 'to-indigo-900', shadow: 'shadow-[0_4px_16px_rgba(59,130,246,0.10)]', sub: `${summary.total_transactions_pemasukan} transaksi` },
          { label: 'Pengeluaran', val: summary.pengeluaran, from: 'from-rose-800/80', to: 'to-slate-900', shadow: 'shadow-[0_4px_16px_rgba(239,68,68,0.09)]', sub: `${summary.total_transactions_pengeluaran} transaksi` },
          { label: 'Alokasi Wishlist', val: summary.alokasi || 0, from: 'from-indigo-700', to: 'to-violet-900', shadow: 'shadow-[0_4px_16px_rgba(99,102,241,0.12)]', sub: `${summary.total_transactions_alokasi || 0} alokasi` },
        ].map(({ label, val, from, to, shadow, sub }) => (
          <div key={label} className={`rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1 bg-gradient-to-br ${from} ${to} ring-1 ring-white/[0.08] ${shadow}`}>
            <p className="text-[10px] opacity-70 uppercase tracking-widest font-medium">{label}</p>
            <p className="text-[14px] min-[901px]:text-[16px] font-semibold leading-tight tabular-nums">Rp {formatRupiah(val)}</p>
            {sub && <p className="text-[10px] opacity-50">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Daily chart */}
        <div className="tq-card p-5">
          <h3 className="text-[13px] font-semibold text-white mb-4">Grafik Harian – {monthName} {year}</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false}
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                tickFormatter={v => { if (!v) return '0'; if (v >= 1000000) return `${v/1000000}jt`; if (v >= 1000) return `${v/1000}k`; return v }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="pemasukan" fill="#10b981" radius={[3,3,0,0]} barSize={10} name="Pemasukan" />
              <Bar dataKey="pengeluaran" fill="#ef4444" radius={[3,3,0,0]} barSize={10} name="Pengeluaran" />
              <Bar dataKey="alokasi" fill="#6366f1" radius={[3,3,0,0]} barSize={10} name="Alokasi" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense pie chart */}
        <div className="tq-card p-5">
          <h3 className="text-[13px] font-semibold text-white mb-4">Kategori Pengeluaran</h3>
          {categoryData.length === 0
            ? <div className="flex items-center justify-center h-[200px] text-[13px] text-white/30">Belum ada data pengeluaran</div>
            : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={65} dataKey="value">
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `Rp ${formatRupiah(v)}`} contentStyle={{ background: '#1e2b21', border: 'none', borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {categoryData.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-white/70 truncate max-w-[140px]">{c.name}</span>
                      </div>
                      <span className="font-mono text-white/60">Rp {formatRupiah(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </div>
      </div>

      {/* Yearly comparison */}
      {yearlyData && (
        <div className="tq-card p-5 mb-5">
          <h3 className="text-[13px] font-semibold text-white mb-4">Perbandingan Bulanan – {year}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yearlyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false}
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                tickFormatter={v => { if (!v) return '0'; if (v >= 1000000) return `${v/1000000}jt`; if (v >= 1000) return `${v/1000}k`; return v }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="pemasukan" fill="#10b981" radius={[3,3,0,0]} barSize={10} name="Pemasukan" />
              <Bar dataKey="pengeluaran" fill="#ef4444" radius={[3,3,0,0]} barSize={10} name="Pengeluaran" />
              <Bar dataKey="alokasi" fill="#6366f1" radius={[3,3,0,0]} barSize={10} name="Alokasi" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transaction list */}
      <div className="tq-card p-4 min-[901px]:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="m-0 text-[14px] font-semibold">Detail Transaksi</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex rounded-lg border border-white/[0.09] overflow-hidden text-[12px]">
              {[
                { v: '', l: 'Semua' }, 
                { v: 'pemasukan', l: 'Masuk' }, 
                { v: 'pengeluaran', l: 'Keluar' },
                { v: 'alokasi', l: 'Alokasi' }
              ].map(o => (
                <button key={o.v} onClick={() => setFilterType(o.v)}
                  className={`px-3 py-1.5 font-medium transition ${filterType === o.v
                    ? o.v === 'pemasukan' ? 'bg-emerald-600 text-white' : o.v === 'pengeluaran' ? 'bg-rose-600 text-white' : o.v === 'alokasi' ? 'bg-indigo-600 text-white' : 'bg-white/[0.12] text-white'
                    : 'text-white/45 hover:text-white hover:bg-white/[0.06]'}`}>
                  {o.l}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Cari keterangan..." value={txSearch}
              onChange={e => setTxSearch(e.target.value)} className="tq-field px-3 py-1.5 text-[12px] w-40 sm:w-52" />
          </div>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col gap-2.5 md:hidden">
          {displayedTx.length === 0
            ? <div className="py-10 text-center text-[13px] text-white/30">Belum ada transaksi</div>
            : displayedTx.map(t => (
              <div key={t.id} className="tq-card-inner p-3.5">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[11px] text-white/40">{formatDateFull(t.transaction_date)}</span>
                  <span className={`font-mono font-bold text-[13px] ${t.type === 'pemasukan' ? 'text-emerald-400' : t.type === 'pengeluaran' ? 'text-red-400' : 'text-sky-400'}`}>
                    {t.type === 'pemasukan' ? '+' : t.type === 'pengeluaran' ? '-' : '•'} Rp {formatRupiah(t.amount)}
                  </span>
                </div>
                <p className="text-[13px] text-white/80">{t.description}</p>
              </div>
            ))
          }
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-white/[0.07]">
          <table className="w-full min-w-[500px]">
            <thead className="bg-white/[0.04]">
              <tr>
                {['Tanggal', 'Keterangan', 'Tipe', 'Nominal'].map(h => (
                  <th key={h} className={`px-3 py-2.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider ${h === 'Nominal' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {displayedTx.length === 0
                ? <tr><td colSpan={4} className="py-10 text-center text-[13px] text-white/30">Belum ada transaksi</td></tr>
                : displayedTx.map(t => (
                  <tr key={t.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-3 py-2.5 text-[12px] text-white/60 whitespace-nowrap">{formatDateFull(t.transaction_date)}</td>
                    <td className="px-3 py-2.5 text-[13px] text-white/80 max-w-[240px] truncate">{t.description}</td>
                    <td className="px-3 py-2.5">
                      <span className={`tq-badge ${t.type === 'pemasukan' ? 'tq-badge-income' : t.type === 'pengeluaran' ? 'tq-badge-expense' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'}`}>
                        {t.type === 'pemasukan' ? 'Masuk' : t.type === 'pengeluaran' ? 'Keluar' : 'Alokasi'}
                      </span>
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono text-[12px] ${t.type === 'pemasukan' ? 'text-emerald-400' : t.type === 'pengeluaran' ? 'text-red-400' : 'text-sky-400'}`}>
                      {t.type === 'pemasukan' ? '+' : t.type === 'pengeluaran' ? '-' : '•'} Rp {formatRupiah(t.amount)}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </div>
  )
}