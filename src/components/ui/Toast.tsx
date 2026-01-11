'use client'

import { useStore } from '@/store/useStore'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-600',
  info: 'bg-blue-600',
}

export function ToastContainer() {
  const { toasts, removeToast } = useStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-2 md:left-auto md:right-4 md:max-w-sm">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-white shadow-lg animate-slide-in',
              styles[toast.type]
            )}
            role="alert"
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
