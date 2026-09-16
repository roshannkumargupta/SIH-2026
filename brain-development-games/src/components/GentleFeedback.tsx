import React from 'react'
import { Heart, Coffee } from 'lucide-react'
import { getEncouragementMessage } from '../lib/gentleFeedback'

export interface GentleFeedbackProps {
  /** Number of wrong answers in a row. Nothing renders below 3. */
  consecutiveMisses: number
  /** Called when the player chooses to drop to an easier level. */
  onTryEasier?: () => void
  /** Called when the player dismisses the nudge to keep playing as-is. */
  onDismiss?: () => void
}

/**
 * Warm, non-clinical nudge shown after 3+ consecutive misses, suggesting a
 * short break or an easier level. Never blocks play — always dismissible.
 */
export default function GentleFeedback({ consecutiveMisses, onTryEasier, onDismiss }: GentleFeedbackProps): JSX.Element | null {
  const message = getEncouragementMessage(consecutiveMisses)
  if (!message) return null

  return (
    <div className="mt-4 p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 flex flex-wrap items-center gap-3">
      <Heart size={20} className="text-rose-500 flex-shrink-0" />
      <p className="text-sm text-rose-800 dark:text-rose-200 flex-1 min-w-[180px]">{message}</p>
      <div className="flex gap-2">
        {onTryEasier && (
          <button
            onClick={onTryEasier}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
          >
            <Coffee size={14} /> Try an easier level
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
          >
            Keep going
          </button>
        )}
      </div>
    </div>
  )
}
