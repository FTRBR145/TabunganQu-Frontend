export default function ErrorDisplay({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="text-5xl mb-4">😕</div>
      <h3 className="text-white text-lg font-semibold mb-2">Oops! Ada kesalahan</h3>
      <p className="text-white/60 text-sm mb-4 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition"
        >
          Coba Lagi
        </button>
      )}
    </div>
  )
}