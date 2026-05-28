export default function LoadingSpinner({ size = 'medium' }) {
  const sizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} border-4 border-white/20 border-t-emerald-500 rounded-full animate-spin`}></div>
      <p className="text-white/60 text-sm mt-3">Memuat data...</p>
    </div>
  )
}