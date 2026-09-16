import React from 'react'
import { Flame } from 'lucide-react'

export default function StreakCounter({ currentStreak, longestStreak }: { currentStreak: number; longestStreak: number }): JSX.Element {
  return (
    <div className="flex items-center gap-3 app-card p-3 sm:p-4">
      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-500 flex-shrink-0">
        <Flame size={20} />
      </div>
      <div>
        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {currentStreak} day{currentStreak === 1 ? '' : 's'}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Current streak · best {longestStreak}</div>
      </div>
    </div>
  )
}
