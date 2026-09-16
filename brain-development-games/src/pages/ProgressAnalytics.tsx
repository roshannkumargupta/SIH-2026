import React, { useEffect, useState } from 'react'
import { getDomainStatistics, getGameStatistics } from '../lib/analytics'
import type { DomainStatistics, GameStatistics } from '../types/analytics'
import { DOMAIN_LABELS } from '../lib/cognitiveDomains'
import { GAME_REGISTRY } from '../lib/gameRegistry'

const TREND_STYLE: Record<GameStatistics['trend'], string> = {
  improving: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300',
  declining: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-300',
  stable: 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300',
  insufficient_data: 'text-slate-400 bg-slate-50 dark:bg-slate-800 dark:text-slate-500'
}

const TREND_LABEL: Record<GameStatistics['trend'], string> = {
  improving: 'Improving',
  declining: 'Declining',
  stable: 'Stable',
  insufficient_data: 'Not enough data'
}

export default function ProgressAnalytics(): JSX.Element {
  const [domainStats, setDomainStats] = useState<DomainStatistics[]>([])
  const [gameStats, setGameStats] = useState<GameStatistics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      const domains = await getDomainStatistics()
      const games = (
        await Promise.all(GAME_REGISTRY.map((g) => getGameStatistics(g.id)))
      ).filter((g): g is GameStatistics => g !== null)
      if (cancelled) return
      setDomainStats(domains)
      setGameStats(games.sort((a, b) => b.totalSessions - a.totalSessions))
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <div className="bg-white dark:bg-slate-800 p-6 rounded shadow text-slate-600 dark:text-slate-300">Loading…</div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Progress Analytics</h1>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">By Cognitive Domain</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">
              <th className="py-2 pr-2">Domain</th>
              <th className="py-2 pr-2">Sessions</th>
              <th className="py-2 pr-2">Avg. Accuracy</th>
              <th className="py-2 pr-2">Avg. Score</th>
            </tr>
          </thead>
          <tbody>
            {domainStats.map((d) => (
              <tr key={d.domain} className="border-b dark:border-slate-700 last:border-0">
                <td className="py-2 pr-2 text-slate-800 dark:text-slate-100">{DOMAIN_LABELS[d.domain]}</td>
                <td className="py-2 pr-2 text-slate-600 dark:text-slate-300">{d.sessionCount}</td>
                <td className="py-2 pr-2 text-slate-600 dark:text-slate-300">{d.sessionCount ? `${Math.round(d.averageAccuracy)}%` : '—'}</td>
                <td className="py-2 pr-2 text-slate-600 dark:text-slate-300">{d.sessionCount ? Math.round(d.averageScore) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">By Game</h2>
        {gameStats.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">No games played yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">
                <th className="py-2 pr-2">Game</th>
                <th className="py-2 pr-2">Sessions</th>
                <th className="py-2 pr-2">Best Score</th>
                <th className="py-2 pr-2">Avg. Accuracy</th>
                <th className="py-2 pr-2">Trend</th>
              </tr>
            </thead>
            <tbody>
              {gameStats.map((g) => (
                <tr key={g.gameId} className="border-b dark:border-slate-700 last:border-0">
                  <td className="py-2 pr-2 text-slate-800 dark:text-slate-100">{g.gameName}</td>
                  <td className="py-2 pr-2 text-slate-600 dark:text-slate-300">{g.totalSessions}</td>
                  <td className="py-2 pr-2 text-slate-600 dark:text-slate-300">{g.bestScore}</td>
                  <td className="py-2 pr-2 text-slate-600 dark:text-slate-300">{Math.round(g.averageAccuracy)}%</td>
                  <td className="py-2 pr-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TREND_STYLE[g.trend]}`}>{TREND_LABEL[g.trend]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
