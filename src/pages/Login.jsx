import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import ReCAPTCHA from 'react-google-recaptcha'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import authBgImg from '../images/auth-bg.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  
  const recaptchaRef = useRef(null)
  
  const { login, googleLogin } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Email dan password harus diisi')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Format email tidak valid')
      return
    }

    if (!captchaToken) {
      toast.error('Tolong selesaikan verifikasi reCAPTCHA terlebih dahulu')
      return
    }

    setIsLoading(true)
    
    try {
      const result = await login(email, password, captchaToken)
      
      if (result.success) {
        toast.success('Login berhasil! Selamat datang 👋')
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1000)
      } else {
        toast.error(result.message)
        recaptchaRef.current?.reset()
        setCaptchaToken(null)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('Terjadi kesalahan yang tidak terduga')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    // Cek captcha untuk Google Login juga
    if (!captchaToken) {
      toast.error('Tolong selesaikan verifikasi reCAPTCHA terlebih dahulu')
      return
    }
    
    setIsGoogleLoading(true)
    try {
      const result = await googleLogin(credentialResponse, captchaToken, 'login')
      if (result.success) {
        toast.success('Login dengan Google berhasil! 👋')
        setTimeout(() => navigate('/dashboard', { replace: true }), 500)
      } else {
        toast.error(result.message)
        recaptchaRef.current?.reset()
        setCaptchaToken(null)
      }
    } catch (error) {
      console.error('Google login error:', error)
      toast.error('Terjadi kesalahan saat login dengan Google')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#101010] overflow-hidden font-['Inter',_sans-serif]">
      
      <div 
        className="absolute inset-0 z-[1] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authBgImg})` }}
      ></div>

      <div className="absolute inset-0 z-[2] backdrop-blur-[2px] bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(140,255,0,0.1)_100%),linear-gradient(to_left,rgba(16,16,16,0.8),rgba(16,16,16,0.8))]"></div>
      <div className="absolute inset-0 z-[3] bg-[radial-gradient(closest-side,rgba(255,255,255,0.1)_10%,rgba(255,255,255,0)_100%)]"></div>

      <div className="relative z-10 w-full max-w-[92%] min-[577px]:max-w-[400px] bg-[#1a1a1a]/90 rounded-[28px] py-6 px-8 min-[577px]:px-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-[20px] border border-white/10 animate-scale-in">
        
        <button 
          onClick={() => navigate('/')}
          className="absolute top-5 right-5 text-white/20 hover:text-white transition-colors p-1"
          title="Kembali ke Beranda"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="text-center mb-4">
          <h1 
            className="font-bold text-[36px] min-[577px]:text-[48px] text-white m-0 mb-0.5 leading-tight cursor-pointer hover:text-emerald-400 transition-colors tracking-tight" 
            onClick={() => navigate('/')}
          >
            TabunganQu
          </h1>
          <p className="text-white/40 text-[14px] leading-relaxed max-w-[85%] mx-auto">
            Selamat datang menuju finansial teratur.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="relative w-full mb-2">
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-transparent border-none text-white text-[16px] py-2 outline-none placeholder:text-white/30"
            />
            <div className="h-px bg-white/10 w-full"></div>
          </div>

          <div className="relative w-full mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-transparent border-none text-white text-[16px] py-2 pr-10 outline-none placeholder:text-white/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-2 text-white/30 hover:text-white transition-colors"
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
            <div className="h-px bg-white/10 w-full"></div>
          </div>

          <div className="mt-8 mb-2 flex justify-center w-full overflow-hidden">
            <div className="scale-[0.85] sm:scale-100 origin-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-4 bg-emerald-600 text-white border-none py-3.5 px-4 text-[16px] font-bold rounded-xl cursor-pointer transition-all duration-300 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Masuk...' : 'LOGIN'}
          </button>
        </form>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative z-10 bg-[#1a1a1a] px-3 text-[10px] text-white/20 uppercase tracking-widest font-bold">Atau</span>
        </div>

        <div className="flex justify-center w-full mb-4">
          <div className="w-full max-w-[280px] sm:max-w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                console.error('Google Login Error: Origin mismatch or initialization failed.');
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  toast.error('Gagal: Tambahkan URL localhost ke Google Cloud Console (Authorized JavaScript origins).');
                } else {
                  toast.error('Login dengan Google gagal. Silakan coba lagi.');
                }
              }}
              theme="filled_blue"
              size="large"
              text="continue_with"
              shape="pill"
              width="280"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 text-white text-[12px] border-t border-white/5 pt-5 mb-2">
          <Link to="/register" className="text-[#00b2ff] no-underline hover:underline font-medium">
            Belum punya akun? Register
          </Link>
          
          <Link to="/" className="text-white/60 hover:text-white transition-colors flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="font-medium">Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
