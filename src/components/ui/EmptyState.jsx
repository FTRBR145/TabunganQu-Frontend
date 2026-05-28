export default function EmptyState({ icon = '🌱', message, subMessage, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-[60px] px-6 text-center animate-fade-in">
      <div className="text-[56px] mb-4">{icon}</div>
      
      <p className="text-[18px] font-semibold text-gray-700 mb-2">
        {message}
      </p>
      
      {subMessage && (
        <p className="text-[14px] text-gray-500 max-w-[320px] mb-5">
          {subMessage}
        </p>
      )}
      
      {actionLabel && onAction && (
        <button 
          className="py-[10px] px-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded-md font-semibold text-[14px] transition-all duration-200 shadow-md hover:-translate-y-[2px] hover:shadow-lg cursor-pointer" 
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}