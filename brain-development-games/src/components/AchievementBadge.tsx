import React from 'react'
import * as Icons from 'lucide-react'
import type { Badge } from '../lib/gamification'

const FALLBACK_ICON = 'Award'

export default function AchievementBadge({ badge }: { badge: Badge }): JSX.Element {
  const earned = Boolean(badge.earnedAt)
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[badge.icon] ??
    (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[FALLBACK_ICON]

  return (
    <div
      className={`flex flex-col items-center text-center p-3 sm:p-4 rounded-lg border transition-colors ${
        earned
          ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800'
          : 'bg-slate-50 border-slate-200 opacity-50 dark:bg-slate-900 dark:border-slate-700'
      }`}
      title={badge.description}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
          earned ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-500 dark:bg-slate-700'
        }`}
      >
        <IconComponent size={22} />
      </div>
      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100">{badge.name}</span>
      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{badge.description}</span>
    </div>
  )
}
