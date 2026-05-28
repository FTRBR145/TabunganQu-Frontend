export default function ProgressBar({ percent, height = 10, animated = true }) {
  const clampedPercent = Math.min(100, Math.max(0, percent))

  return (
    <div 
      className="w-full bg-gray-200 rounded-[100px] overflow-hidden" 
      style={{ height }}
    >
      <div
        className="rounded-[100px] bg-gradient-to-r from-emerald-400 to-emerald-500 [transition:width_400ms_ease]"
        style={{
          width: `${clampedPercent}%`,
          height,
          animation: animated ? 'progressFill 800ms ease forwards' : 'none',
        }}
      />
    </div>
  )
}