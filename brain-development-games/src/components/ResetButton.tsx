import React from 'react'

interface ResetButtonProps {
  onReset: () => void
  resetCount?: number
}

export default function ResetButton({ onReset, resetCount = 0 }: ResetButtonProps): JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onReset}
        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-lg hover:-translate-y-0.5 text-white px-4 py-2 rounded-xl font-semibold shadow-md shadow-orange-500/20 transition-all"
      >
        🔄 Reset Game
      </button>
      {resetCount > 0 && (
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Resets: {resetCount}
        </span>
      )}
    </div>
  )
}

// Made with Bob
