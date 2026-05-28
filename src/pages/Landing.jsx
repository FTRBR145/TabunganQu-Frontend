import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'
import dashboardImg from '../images/dashboard-preview.png'
import heroBgImg from '../images/hero-bg.png'

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="bg-[#121814] text-white font-['Inter',_sans-serif] min-h-screen overflow-x-hidden selection:bg-emerald-500/30">
      
      {/* Dynamic Navbar with Glassmorphism */}
      <nav className="flex justify-between items-center py-4 px-6 md:py-6 md:px-16 fixed top-0 left-0 right-0 z-50 bg-[#121814]/70 backdrop-blur-md border-b border-white/10 transition-all animate-fade-in">
        <div className="font-['Inter',_sans-serif] text-[28px] md:text-[32px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
          TabunganQu
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <button 
            className="hidden md:block bg-transparent border-none text-white/80 hover:text-white font-['Inter',_sans-serif] font-medium text-[15px] cursor-pointer transition-colors" 
            onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })}
          >
            About Us
          </button>
          <button 
            className="group relative inline-flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-2 px-6 md:px-8 text-white font-['Inter',_sans-serif] text-[15px] font-medium cursor-pointer transition-all duration-300 hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-0.5" 
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </div>
      </nav>

      <main className="pt-[80px]">
        {/* HERO SECTION - User Requested Image Fade */}
        <section className="relative flex flex-col items-center text-center gap-10 pt-16 pb-[100px] px-[8%] min-h-[90vh] border-b border-white/5 min-[993px]:flex-row min-[993px]:text-left min-[993px]:gap-0 min-[993px]:py-[120px] min-[993px]:justify-between overflow-hidden">
          
          {/* Background image & gradient fade overlay */}
          <div className="absolute inset-0 z-0">
            <div 
              className="absolute inset-0 bg-cover bg-center md:bg-right bg-no-repeat opacity-60 md:opacity-100"
              style={{ backgroundImage: `url(${heroBgImg})` }}
            ></div>
            {/* Soft fade gradient from left to right */}
            <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-[#121814] via-[#121814]/90 to-[#121814]/30"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center flex-1 max-w-[600px] animate-slide-in-up min-[993px]:items-start">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Sistem Keuangan Generasi Baru
            </div>
            
            <h1 className="font-['Inter',_sans-serif] font-bold text-[40px] tracking-tight leading-[1.1] m-0 mb-6 md:text-[64px]">
              Kelola Tabungan.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">Lebih Terkontrol.</span><br />
              Lebih Terarah.
            </h1>
            <p className="text-[16px] leading-[1.6] text-white/70 m-0 mb-10 md:text-[20px] max-w-[500px]">
              Sistem pengelolaan tabungan yang membantu kamu mencatat setiap pemasukan dan
              pengeluaran secara proaktif. Membangun kebiasaan
              finansial yang lebih disiplin.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 min-[993px]:justify-start w-full sm:w-auto">
              <button 
                className="group relative bg-gradient-to-r from-emerald-600 to-emerald-500 overflow-hidden text-white border-none py-4 px-8 rounded-full text-[16px] font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(16,185,129,0.4)]" 
                onClick={() => navigate('/register')}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative">Mulai Sekarang — Gratis</span>
              </button>
              <button 
                className="bg-white/5 backdrop-blur-sm text-white/90 border border-white/10 py-4 px-8 rounded-full text-[16px] font-semibold cursor-pointer transition-all duration-300 hover:bg-white/10 hover:text-white"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Pelajari Lebih Lanjut
              </button>
            </div>
          </div>
          
          <div className="relative z-10 hidden md:flex justify-center w-full flex-1 animate-fade-in [animation-delay:200ms] min-[993px]:justify-end">
             {/* 3D Floating Mockup Abstract */}
            <div className="relative w-full max-w-[450px] md:h-[350px]">
              {/* Glow Behind */}
              <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full"></div>
              
              {/* Glass Card */}
              <div className="relative h-full bg-[#1d251f]/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transform transition-transform duration-700 hover:scale-[1.02] hover:-rotate-1 animate-float flex flex-col">
                <div className="h-10 md:h-12 w-full border-b border-white/10 bg-white/5 flex items-center px-4 md:px-5 gap-2 z-10 shrink-0">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                
                {/* Abstract Data Visualization */}
                <div className="w-full h-full relative overflow-hidden bg-black/20 p-6 flex flex-col justify-end gap-5">
                  <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
                    <div>
                      <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Total Saldo</div>
                      <div className="text-white font-bold text-3xl">Rp 12.500.000</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="h-16 flex-1 bg-white/5 rounded-xl border border-white/10 p-3">
                      <div className="w-8 h-2 bg-white/20 rounded mb-2"></div>
                      <div className="w-16 h-3 bg-white/40 rounded"></div>
                    </div>
                    <div className="h-16 flex-1 bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <div className="w-8 h-2 bg-emerald-500/50 rounded mb-2"></div>
                      <div className="w-16 h-3 bg-emerald-400 rounded"></div>
                    </div>
                  </div>
                  
                  <div className="w-full h-32 bg-white/5 rounded-xl border border-white/10 p-4 flex items-end justify-between gap-3 overflow-hidden relative">
                    <div className="w-1/6 bg-emerald-500/20 rounded-t-md h-[40%]"></div>
                    <div className="w-1/6 bg-emerald-500/30 rounded-t-md h-[55%]"></div>
                    <div className="w-1/6 bg-emerald-500/40 rounded-t-md h-[35%]"></div>
                    <div className="w-1/6 bg-emerald-500/50 rounded-t-md h-[75%]"></div>
                    <div className="w-1/6 bg-emerald-500/70 rounded-t-md h-[85%] shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
                    <div className="w-1/6 bg-emerald-400 rounded-t-md h-[100%] shadow-[0_0_20px_rgba(16,185,129,0.6)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section id="features" className="py-[120px] px-[8%] bg-[#0f1411]">
          <div className="text-center mb-16 animate-slide-in-up">
            <h2 className="font-['Inter',_sans-serif] font-bold text-[36px] md:text-[48px] leading-[1.2] m-0 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
              Kendali Penuh Atas Masa Depanmu
            </h2>
            <p className="text-white/60 text-[18px] max-w-[600px] mx-auto">
              Fitur inovatif kami dirancang untuk menghilangkan stres dalam mengatur uang.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1200px] mx-auto">
            {/* Bento 1: Large Card */}
            <div className="md:col-span-2 group relative bg-[#1a211c] rounded-3xl border border-white/5 overflow-hidden transition-all duration-500 hover:border-emerald-500/30 hover:bg-[#1e2721] p-8 md:p-10 min-h-[300px] flex flex-col justify-end">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full transition-all group-hover:bg-emerald-500/20"></div>
              <svg className="w-12 h-12 text-emerald-400 mb-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              <h3 className="text-[28px] font-bold text-white mb-3 relative z-10">Pencatat Transaksi Terstruktur</h3>
              <p className="text-white/60 text-[16px] leading-[1.6] relative z-10 max-w-[400px]">
                Catat setiap setoran dan penarikan dengan sistem yang rapi dan mudah digunakan. Tidak ada lagi uang yang hilang tanpa jejak.
              </p>
            </div>
            
            {/* Bento 2: Smaller Card */}
            <div className="group relative bg-[#1a211c] rounded-3xl border border-white/5 overflow-hidden transition-all duration-500 hover:border-blue-500/30 hover:bg-[#1e2721] p-8 min-h-[300px] flex flex-col justify-end">
              <div className="absolute top-0 left-0 -ml-10 -mt-10 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full transition-all group-hover:bg-blue-500/20"></div>
              <svg className="w-12 h-12 text-blue-400 mb-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
              <h3 className="text-[22px] font-bold text-white mb-3 relative z-10">Ringkasan Real-Time</h3>
              <p className="text-white/60 text-[15px] leading-[1.6] relative z-10">
                Lihat saldo dan metrik finansialmu dalam satu tampilan tajam.
              </p>
            </div>

            {/* Bento 3: Smaller Card */}
            <div className="group relative bg-[#1a211c] rounded-3xl border border-white/5 overflow-hidden transition-all duration-500 hover:border-purple-500/30 hover:bg-[#1e2721] p-8 min-h-[300px] flex flex-col justify-end">
               <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full transition-all group-hover:bg-purple-500/20"></div>
              <svg className="w-12 h-12 text-purple-400 mb-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <h3 className="text-[22px] font-bold text-white mb-3 relative z-10">Target Terukur</h3>
              <p className="text-white/60 text-[15px] leading-[1.6] relative z-10">
                Tetapkan tujuan finansial masa depan dan capai lebih cepat.
              </p>
            </div>

            {/* Bento 4: Large Card */}
            <div className="md:col-span-2 group relative bg-[#1a211c] rounded-3xl border border-white/5 overflow-hidden transition-all duration-500 hover:border-orange-500/30 hover:bg-[#1e2721] p-8 md:p-10 min-h-[300px] flex flex-col justify-end">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20"></div>
              <svg className="w-12 h-12 text-orange-400 mb-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3 className="text-[28px] font-bold text-white mb-3 relative z-10">Riwayat Berjalan Transparan</h3>
              <p className="text-white/60 text-[16px] leading-[1.6] relative z-10 max-w-[400px]">
                Semua aktivitas transaksi tercatat otomatis seperti asisten digital pribadimu, bisa diunduh atau ditinjau ulang tanpa ribet.
              </p>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="relative flex flex-col items-center text-center gap-12 py-[120px] px-[8%] min-[993px]:flex-row min-[993px]:text-left min-[993px]:gap-[80px] bg-gradient-to-b from-[#0f1411] to-[#121814]">
          <div className="flex-1 w-full animate-fade-in relative">
            <div className="absolute -inset-10 bg-emerald-500/10 blur-3xl rounded-full"></div>
            {/* Dashboard Image Replaces the Red Manual Card */}
            <div className="flex items-center justify-center w-full bg-[#1a211c]/50 border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl relative overflow-hidden group backdrop-blur-xl p-2 md:p-5">
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <img 
                src={dashboardImg} 
                alt="TabunganQu Premium Dashboard Preview" 
                className="w-full h-auto rounded-xl relative z-10 shadow-lg transform transition-transform group-hover:scale-[1.02] duration-700 border border-white/5"
              />
            </div>
            
            {/* Overlapping badge */}
            <div className="absolute -bottom-6 -right-2 md:-bottom-8 md:-right-8 bg-[#1f2924]/90 backdrop-blur-lg border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl z-20 w-[240px] md:w-[260px] rotate-2 transition-transform hover:-rotate-1">
              <div className="text-emerald-400 font-bold text-lg md:text-xl mb-1">Modern & Otomatis</div>
              <div className="text-white/60 text-xs md:text-sm">Riwayat sempurna, saldo presisi seumur hidup.</div>
            </div>
          </div>
          
          <div className="flex-1 z-10 w-full mt-10 md:mt-0">
            <h2 className="font-['Inter',_sans-serif] font-bold text-[36px] md:text-[44px] leading-[1.2] m-0 mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
              Katakan Selamat Tinggal pada Catatan Manual
            </h2>
            <div className="flex flex-col gap-6">
              <p className="text-[16px] leading-[1.8] text-white/70 m-0 md:text-[18px]">
                Tanpa pencatatan digital yang presisi, saldo sering tidak akurat, target mustahil terpantau, dan uang terasa menguap begitu saja.
              </p>
              <div className="flex items-start gap-4 text-left">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                </div>
                <p className="text-white/90 font-medium leading-relaxed">
                  TabunganQu mengotomatisasi organisasi keuanganmu sehingga kamu menghemat ratusan jam mencatat di kertas.
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/register')}
              className="mt-10 inline-flex items-center gap-2 text-emerald-400 font-semibold hover:text-emerald-300 transition-colors group"
            >
              Ubah kebiasaan sekarang 
              <svg className="w-5 h-5 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </button>
          </div>
        </section>
      </main>

      <footer id="footer" className="w-full bg-[#0a0d0a] border-t border-white/5 pt-16 pb-8 text-center md:text-left">
        <div className="max-w-[1200px] mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          
          <div>
            <div className="font-bold text-[24px] text-white mb-4">TabunganQu</div>
            <p className="text-white/50 text-[15px] leading-relaxed max-w-[400px] mx-auto md:mx-0">
              TabunganQu adalah platform teknologi analitik yang fokus membantu publik mengatur manajemen uang cerdas dengan privasi yang aman dan dapat diandalkan.
            </p>
          </div>
          
          <div className="flex flex-col md:items-end justify-center">
            <div className="flex gap-8 mb-6 justify-center md:justify-end">
              <a href="#" className="text-white/50 hover:text-white transition-colors text-[15px] no-underline">Privacy Policy</a>
              <a href="#" className="text-white/50 hover:text-white transition-colors text-[15px] no-underline">Terms of Service</a>
              <a href="#" className="text-white/50 hover:text-white transition-colors text-[15px] no-underline">Contact Support</a>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white/40 text-[13px] inline-block">
              Not a regulated banking institution.
            </div>
          </div>
        </div>
        
        <div className="max-w-[1200px] mx-auto px-8 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-white/40 text-[14px]">
            © 2026 TabunganQu FinTech. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}