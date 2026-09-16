import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, ArrowRight, TrendingUp, TrendingDown, Minus, Home as HomeIcon } from 'lucide-react'
import { getSessionHistory } from '../lib/analytics'
import { predictDifficulty } from '../lib/mlService'
import type { DifficultyRecommendation } from '../lib/adaptiveEngine'

export type NextLevelButtonProps = {
  currentLevel: number
  maxLevel?: number
  /** When provided, the AI adaptive-difficulty engine decides the next
   *  level instead of a blind +1 — see src/lib/adaptiveEngine.ts. */
  gameId?: string
}

const DIRECTION_META: Record<DifficultyRecommendation['direction'], { icon: typeof TrendingUp; label: string; classes: string }> = {
  increase: { icon: TrendingUp, label: 'AI leveled you up', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
  maintain: { icon: Minus, label: 'AI says: keep practicing here', classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' },
  decrease: { icon: TrendingDown, label: 'AI eased the difficulty', classes: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800' }
}

export default function NextLevelButton({ currentLevel, maxLevel = 10, gameId }: NextLevelButtonProps): JSX.Element {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const [rec, setRec] = useState<DifficultyRecommendation | null>(null)
  const [loading, setLoading] = useState(Boolean(gameId))

  useEffect(() => {
    if (!gameId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    // Give the just-finished session a moment to persist before reading history.
    const timer = setTimeout(async () => {
      const history = await getSessionHistory(gameId, 10)
      const recommendation = await predictDifficulty(history, currentLevel, maxLevel)
      if (!cancelled) {
        setRec(recommendation)
        setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, currentLevel])

  const nextLevel = rec ? rec.recommendedLevel : Math.min(maxLevel, currentLevel + 1)
  const isMaxed = currentLevel >= maxLevel && (!rec || rec.direction !== 'decrease')

  const goToLevel = (level: number): void => {
    const params = new URLSearchParams(search)
    params.set('level', String(level))
    navigate(`?${params.toString()}`, { replace: true })
  }

  const goHome = (): void => navigate('/')

  if (isMaxed) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-md shadow-emerald-500/20">
          🎉 All levels completed!
        </div>
        <button
          onClick={goHome}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-md shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-lg transition-all"
        >
          <HomeIcon size={16} /> Back to Home
        </button>
      </div>
    )
  }

  const meta = rec ? DIRECTION_META[rec.direction] : null
  const Icon = meta?.icon ?? Sparkles

  const buttonLabel =
    !rec || rec.direction === 'increase'
      ? `Level ${nextLevel} →`
      : rec.direction === 'maintain'
      ? `Practice Level ${nextLevel} again`
      : `Try Level ${nextLevel} (easier)`

  return (
    <div className="flex flex-col items-center gap-3">
      {gameId && (
        <div
          className={`flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 rounded-full border font-medium transition-opacity ${
            loading ? 'opacity-0' : 'opacity-100'
          } ${meta?.classes ?? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800'}`}
        >
          <Icon size={14} />
          <span>{meta?.label ?? 'AI adaptive difficulty'}{rec ? ` — ${rec.reason}` : ''}</span>
        </div>
      )}
      <button
        onClick={() => goToLevel(nextLevel)}
        disabled={loading}
        className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-wait disabled:hover:translate-y-0"
      >
        {buttonLabel}
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  )
}

// Made with Bob
