export function formatRupiah(amount) {
  if (amount === undefined || amount === null) return '0'
  
  const abs = Math.abs(amount)
  const formatted = new Intl.NumberFormat('id-ID').format(abs)
  return formatted
}

export function formatRupiahWithSymbol(amount) {
  if (amount === undefined || amount === null) return 'Rp 0'
  
  const abs = Math.abs(amount)
  const formatted = new Intl.NumberFormat('id-ID').format(abs)
  const prefix = amount < 0 ? '-Rp ' : 'Rp '
  return prefix + formatted
}

export function formatRupiahCompact(amount) {
  if (amount === undefined || amount === null) return 'Rp 0'
  
  const abs = Math.abs(amount)
  let formatted
  
  if (abs >= 1_000_000_000) {
    formatted = (abs / 1_000_000_000).toFixed(1) + 'M'
  } else if (abs >= 1_000_000) {
    formatted = (abs / 1_000_000).toFixed(1) + 'jt'
  } else if (abs >= 1_000) {
    formatted = (abs / 1_000).toFixed(0) + 'K'
  } else {
    formatted = new Intl.NumberFormat('id-ID').format(abs)
  }
  
  const prefix = amount < 0 ? '-Rp ' : 'Rp '
  return prefix + formatted
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function formatDateFull(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

export function getMonthName(monthIndex) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return months[monthIndex]
}

export function getMonthOptions(year) {
  const months = []
  for (let i = 0; i < 12; i++) {
    months.push({
      value: `${year}-${String(i + 1).padStart(2, '0')}`,
      label: `${getMonthName(i)} ${year}`,
    })
  }
  return months
}

export function getTodayISO() {
  return new Date().toISOString().split('T')[0]
}