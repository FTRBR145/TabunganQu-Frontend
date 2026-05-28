export default function Footer() {
  return (
    <footer className="mt-10 pt-6 border-t border-white/[0.07]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-white/25">
        <span>© 2026 TabunganQu · Platform manajemen keuangan pribadi</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white/50 transition-colors no-underline text-white/25">Kebijakan Privasi</a>
          <a href="#" className="hover:text-white/50 transition-colors no-underline text-white/25">Syarat Penggunaan</a>
        </div>
      </div>
    </footer>
  )
}