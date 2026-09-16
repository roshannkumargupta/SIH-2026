import React from 'react'
import { xpForLevel } from '../lib/gamification'

export default function XPProgressBar({ xp, level }: { xp: number; level: number }): JSX.Element {
  const prevThreshold = level > 1 ? xpForLevel(level - 1) : 0
  const nextThreshold = xpForLevel(level)
  const span = Math.max(1, nextThreshold - prevThreshold)
  const progress = Math.min(100, Math.round(((xp - prevThreshold) / span) * 100))

  return (
    <div className="app-card p-3 sm:p-4">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Level {level}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {xp} / {nextThreshold} XP
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
