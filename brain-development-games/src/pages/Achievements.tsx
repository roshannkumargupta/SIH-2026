import React, { useEffect, useState } from 'react'
import AchievementBadge from '../components/AchievementBadge'
import StreakCounter from '../components/StreakCounter'
import XPProgressBar from '../components/XPProgressBar'
import { getAllBadges, loadGamificationState, type Badge, type GamificationState } from '../lib/gamification'

export default function Achievements(): JSX.Element {
  const [state, setState] = useState<GamificationState>(() => loadGamificationState())
  const [badges, setBadges] = useState<Badge[]>(() => getAllBadges())

  useEffect(() => {
    const handler = (): void => {
      setState(loadGamificationState())
      setBadges(getAllBadges())
    }
    window.addEventListener('gamification-updated', handler)
    return () => window.removeEventListener('gamification-updated', handler)
  }, [])

  const earnedCount = badges.filter((b) => b.earnedAt).length

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Achievements</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <XPProgressBar xp={state.xp} level={state.level} />
        <StreakCounter currentStreak={state.currentStreak} longestStreak={state.longestStreak} />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Badges</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {earnedCount} / {badges.length} earned
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {badges.map((badge) => (
            <AchievementBadge key={badge.id} badge={badge} />
          ))}
        </div>
      </div>
    </div>
  )
}
