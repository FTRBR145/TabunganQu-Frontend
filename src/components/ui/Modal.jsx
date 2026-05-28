import { createPortal } from 'react-dom'

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-5" 
      onClick={onClose}
    >
      <div 
        className="bg-[#3a3a3a] rounded-[20px] border border-white/10 w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-scale-in" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pt-6 px-6 pb-[10px]">
          <h3 className="m-0 font-['Inter',_sans-serif] text-[18px] font-medium text-white">
            {title}
          </h3>
          <button 
            className="bg-transparent border-none cursor-pointer opacity-80 transition-opacity duration-200 p-0 flex hover:opacity-100" 
            onClick={onClose}
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
             </svg>
          </button>
        </div>
        <div className="pt-[10px] px-[30px] pb-[30px]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}