import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { GAME_REGISTRY } from '../lib/gameRegistry'
import { getAllProgress, type ProgressState } from '../lib/progress'
import { getDomainsForGame, DOMAIN_LABELS } from '../lib/cognitiveDomains'

const CATEGORY_ICON: Record<string, keyof typeof Icons> = {
  memory: 'Brain',
  logic: 'Puzzle',
  attention: 'Eye',
  speed: 'Zap',
  spatial: 'Move3d'
}

export default function AllGames(): JSX.Element {
  const navigate = useNavigate()
  const [progress, setProgress] = useState<ProgressState>(() => getAllProgress())
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const handler = (): void => setProgress(getAllProgress())
    window.addEventListener('progress-updated', handler)
    return () => window.removeEventListener('progress-updated', handler)
  }, [])

  const categories = ['all', ...Array.from(new Set(GAME_REGISTRY.map((g) => g.category)))]
  const filtered = filter === 'all' ? GAME_REGISTRY : GAME_REGISTRY.filter((g) => g.category === filter)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">All Games</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">{GAME_REGISTRY.length} cognitive training games across every domain.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
              filter === c
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((game) => {
          const Icon = Icons[CATEGORY_ICON[game.category] ?? 'Gamepad2'] as React.ComponentType<{ size?: number; className?: string }>
          const domains = getDomainsForGame(game.id)
          const gameProgress = progress[game.id]

          return (
            <button
              key={game.id}
              onClick={() => navigate(`/games/${game.id}`)}
              className="text-left bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-5 flex flex-col gap-3 border border-transparent hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                  <Icon size={20} />
                </div>
                {gameProgress && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    Level {gameProgress.bestLevel}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{game.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{game.description}</p>
              </div>
              <div className="flex flex-wrap gap-1 mt-auto">
                {domains.slice(0, 2).map((d) => (
                  <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {DOMAIN_LABELS[d]}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
