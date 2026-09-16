import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { getSessionHistory } from '../lib/analytics'
import { recommendNextDifficulty, type DifficultyRecommendation } from '../lib/adaptiveEngine'
import { getGameProgress } from '../lib/progress'
import { GAME_REGISTRY } from '../lib/gameRegistry'

function extractGameIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/games\/([a-z0-9-]+)/)
  return match ? match[1] : null
}

/**
 * Shared by all 21 game pages. In addition to manual level selection,
 * this now surfaces the AI adaptive-difficulty recommendation
 * (adaptiveEngine.recommendNextDifficulty) for the current game and,
 * on a genuinely fresh visit only (no ?level= in the URL yet), applies
 * it automatically. A manually chosen or link-shared level is never
 * overridden — the recommendation is only ever offered via the banner.
 */
export default function LevelSelector(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const [search] = useSearchParams()
  const hasExplicitLevel = search.has('level')
  const current = Number(search.get('level') ?? '1')

  const gameId = useMemo(() => extractGameIdFromPath(location.pathname), [location.pathname])
  const maxLevel = GAME_REGISTRY.find((g) => g.id === gameId)?.maxLevel ?? 10

  const [recommendation, setRecommendation] = useState<DifficultyRecommendation | null>(null)
  const autoAppliedRef = useRef(false)

  useEffect(() => {
    if (!gameId) return
    let cancelled = false

    async function loadRecommendation(): Promise<void> {
      const history = await getSessionHistory(gameId as string, 10)
      if (cancelled) return

      const baseline = getGameProgress(gameId as string)?.bestLevel || 1
      const rec = recommendNextDifficulty(history, baseline, maxLevel)
      setRecommendation(rec)

      // Auto-apply once, only on a genuinely fresh visit (no level in the
      // URL at all) and only when there is real history to base it on —
      // first-time players still start at level 1 as before.
      if (!hasExplicitLevel && !autoAppliedRef.current && history.length > 0 && rec.recommendedLevel !== current) {
        autoAppliedRef.current = true
        const params = new URLSearchParams(search)
        params.set('level', String(rec.recommendedLevel))
        navigate(`?${params.toString()}`, { replace: true })
      }
    }

    loadRecommendation()
    return () => {
      cancelled = true
    }
    // Intentionally re-run only when the game changes, not on every
    // search-param change, so it doesn't fight the user's manual picks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  const setLevel = (l: number): void => {
    const params = new URLSearchParams(search)
    params.set('level', String(l))
    navigate(`?${params.toString()}`, { replace: true })
  }

  const showBanner = recommendation && recommendation.direction !== 'maintain' && recommendation.recommendedLevel !== current

  return (
    <div className="mb-4 space-y-2.5">
      <div className="flex items-center gap-2.5">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Level</label>
        <select
          value={current}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        >
          {Array.from({ length: maxLevel }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {showBanner && recommendation && (
        <div className="flex flex-wrap items-center gap-2 text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 px-3 py-2 rounded-xl w-fit">
          <Sparkles size={13} />
          <span>
            AI suggests Level {recommendation.recommendedLevel} — {recommendation.reason}
          </span>
          <button onClick={() => setLevel(recommendation.recommendedLevel)} className="underline font-semibold hover:text-indigo-900 dark:hover:text-indigo-100">
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
