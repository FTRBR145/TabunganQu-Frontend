import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import Footer from '../components/layout/Footer'

export default function Settings() {
  const { user, updateProfile: authUpdateProfile, deleteAvatar, deleteAccount: authDeleteAccount } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef(null)

  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState({ profile: false, password: false, delete: false, avatar: false })

  const compressImageToBase64 = (file, maxWH = 300, q = 0.8) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          if (width > height && width > maxWH) { height = Math.round(height * maxWH / width); width = maxWH }
          else if (height > maxWH) { width = Math.round(width * maxWH / height); height = maxWH }
          canvas.width = width; canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', q))
        }
        img.onerror = reject; img.src = e.target.result
      }
      reader.onerror = reject; reader.readAsDataURL(file)
    })

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran file maksimal 5MB'); return }
    setLoading(p => ({ ...p, avatar: true }))
    try {
      const base64 = await compressImageToBase64(file)
      const result = await authUpdateProfile({ avatar: base64 })
      result.success ? toast.success('Foto profil berhasil diperbarui 📸') : toast.error(result.message)
    } catch { toast.error('Gagal upload foto profil') }
    finally { setLoading(p => ({ ...p, avatar: false })) }
  }

  const handleDeleteAvatar = async () => {
    setLoading(p => ({ ...p, avatar: true }))
    try {
      const result = await deleteAvatar()
      result.success ? toast.success('Foto profil berhasil dihapus') : toast.error(result.message)
    } catch { toast.error('Gagal hapus foto profil') }
    finally { setLoading(p => ({ ...p, avatar: false })) }
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Nama tidak boleh kosong'); return }
    setLoading(p => ({ ...p, profile: true }))
    try {
      const result = await authUpdateProfile({ name: name.trim() })
      result.success ? toast.success('Profil berhasil diperbarui ✅') : toast.error(result.message)
    } catch { toast.error('Gagal update profil') }
    finally { setLoading(p => ({ ...p, profile: false })) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!oldPw || !newPw) { toast.error('Semua field password harus diisi'); return }
    if (newPw.length < 6) { toast.error('Password baru minimal 6 karakter'); return }
    setLoading(p => ({ ...p, password: true }))
    try {
      await api.put('/auth/password', { oldPassword: oldPw, newPassword: newPw })
      toast.success('Password berhasil diubah 🔐'); setOldPw(''); setNewPw('')
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal mengubah password') }
    finally { setLoading(p => ({ ...p, password: false })) }
  }

  const handleDeleteAccount = async () => {
    setLoading(p => ({ ...p, delete: true }))
    try {
      const result = await authDeleteAccount()
      result.success ? toast.success('Akun berhasil dihapus') : toast.error(result.message)
    } catch { toast.error('Gagal menghapus akun') }
    finally { setLoading(p => ({ ...p, delete: false })); setShowDeleteConfirm(false) }
  }

  const avatarSrc = user?.avatar
    ? (user.avatar.startsWith('http') || user.avatar.startsWith('data:')
        ? user.avatar
        : `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatar}`)
    : '/default-avatar.png'

  return (
    <div className="text-white pb-10 animate-fade-in max-w-[640px]">

      {/* Avatar */}
      <div className="tq-card p-5 mb-4 flex items-center gap-4">
        <div
          className="relative group cursor-pointer shrink-0"
          onClick={() => !loading.avatar && fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 border-2 border-white/10">
            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            {loading.avatar
              ? <span className="text-white text-[10px]">...</span>
              : <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 0 1 2-2h3.5l1.5-2h4l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/><circle cx="12" cy="13" r="4"/></svg>
            }
          </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] text-white truncate m-0">{user?.name}</p>
          <p className="text-[12px] text-white/40 m-0 mt-0.5 truncate">{user?.email}</p>
        </div>

        {user?.avatar && (
          <button onClick={handleDeleteAvatar} disabled={loading.avatar}
            className="shrink-0 text-[12px] text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-400/40 rounded-lg px-3 py-1.5 transition-colors">
            Hapus foto
          </button>
        )}
      </div>

      {/* Profile form */}
      <div className="tq-card p-5 mb-4">
        <h3 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider m-0 mb-4">Informasi Profil</h3>
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Nama Lengkap</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="tq-field w-full px-3 py-2.5 text-[13px]" required />
          </div>
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Email</label>
            <div className="relative">
              <input type="email" value={email} readOnly
                className="tq-field w-full px-3 py-2.5 text-[13px] opacity-50 cursor-not-allowed" />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={loading.profile}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60">
              {loading.profile ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {/* Password form */}
      {!user?.google_id && (
        <div className="tq-card p-5 mb-4">
          <h3 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider m-0 mb-4 flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Keamanan
          </h3>
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <div>
              <label className="block text-[12px] text-white/50 mb-1.5">Password Lama</label>
              <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)}
                placeholder="Masukkan password lama"
                className="tq-field w-full px-3 py-2.5 text-[13px]" required />
            </div>
            <div>
              <label className="block text-[12px] text-white/50 mb-1.5">Password Baru</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="tq-field w-full px-3 py-2.5 text-[13px]" required />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading.password}
                className="rounded-xl border border-white/15 bg-white/[0.07] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-white/[0.12] disabled:opacity-60">
                {loading.password ? 'Mengubah...' : 'Ubah Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-5">
        <h3 className="text-[13px] font-semibold text-red-400/80 uppercase tracking-wider m-0 mb-2 flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Zona Berbahaya
        </h3>
        <p className="text-[12px] text-white/45 leading-relaxed mb-4">
          Menghapus akun akan menghapus semua data transaksi dan wishlist secara permanen.
        </p>
        {!showDeleteConfirm
          ? (
            <button onClick={() => setShowDeleteConfirm(true)} disabled={loading.delete}
              className="border border-red-500/30 text-red-400 rounded-xl px-4 py-2 text-[12px] font-medium transition hover:bg-red-500/10">
              Hapus Akun Saya
            </button>
          )
          : (
            <div className="bg-black/20 border border-red-500/20 rounded-xl p-4 animate-scale-in">
              <p className="text-[13px] text-white font-medium mb-3">Yakin ingin menghapus akun secara permanen?</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-[12px] text-white transition hover:bg-white/[0.1]">
                  Batal
                </button>
                <button onClick={handleDeleteAccount} disabled={loading.delete}
                  className="rounded-xl bg-red-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
                  {loading.delete ? 'Menghapus...' : 'Ya, Hapus Permanen'}
                </button>
              </div>
            </div>
          )
        }
      </div>

      <Footer />
    </div>
  )
}