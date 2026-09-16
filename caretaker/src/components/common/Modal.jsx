import { X } from 'lucide-react'

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/60 p-0 md:p-4" onClick={onClose}>
      <div className="bg-surface text-ink rounded-t-2xl md:rounded-2xl border border-clay/40 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-clay/40 sticky top-0 bg-surface">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-cream rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5 text-ink/70" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}