import React from 'react'
import DailyChallengeCard from '../components/DailyChallengeCard'
import { getDailyChallengeGame } from '../components/DailyChallengeCard'
import { getDomainsForGame, DOMAIN_LABELS } from '../lib/cognitiveDomains'

export default function DailyChallenge(): JSX.Element {
  const game = getDailyChallengeGame()
  const domains = getDomainsForGame(game.id)

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Daily Challenge</h1>
      <p className="text-slate-600 dark:text-slate-400">
        A new challenge is featured every day. Everyone sees the same one — compare notes with friends.
      </p>
      <DailyChallengeCard />
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-5">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Domains trained today</h2>
        <div className="flex flex-wrap gap-2">
          {domains.map((d) => (
            <span key={d} className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {DOMAIN_LABELS[d]}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
