import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, duration }])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast])
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error }}>
      {children}
      
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`flex items-center gap-2 py-3 px-5 rounded-md text-white font-medium text-[14px] cursor-pointer shadow-lg min-w-[280px] max-w-[400px] animate-[toastSlideIn_300ms_ease_forwards] ${
              toast.type === 'success'
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                : 'bg-gradient-to-br from-red-500 to-red-600'
            }`}
          >
            <span className="text-lg">
              {toast.type === 'success' ? '✅' : '❌'}
            </span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}