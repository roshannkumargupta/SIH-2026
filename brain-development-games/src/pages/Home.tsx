import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Brain, Zap, Target, ArrowRight, Gauge, TrendingUp, ShieldCheck } from 'lucide-react'
import { getAllProgress, resetAllProgress, type ProgressState } from '../lib/progress'
import { GAME_REGISTRY, getTotalGames, getMaxLevel, type GameMetadata } from '../lib/gameRegistry'

const CATEGORY_META: Record<GameMetadata['category'], { label: string; classes: string }> = {
  memory: { label: 'Memory', classes: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
  logic: { label: 'Logic', classes: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
  attention: { label: 'Attention', classes: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  speed: { label: 'Speed', classes: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  spatial: { label: 'Spatial', classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' }
}

export default function Home(): JSX.Element {
  const [selected, setSelected] = useState<string>(GAME_REGISTRY[0].id)
  const navigate = useNavigate()
  const [progress, setProgress] = useState<ProgressState>(() => getAllProgress())

  // lazy import the leaderboard component to avoid adding it to every page bundle
  const LeaderboardComponent = React.lazy(() => import('../components/LeaderBoard'))

  useEffect(() => {
    const handler = () => setProgress(getAllProgress())
    window.addEventListener('progress-updated', handler)
    return () => window.removeEventListener('progress-updated', handler)
  }, [])

  const startGame = (): void => {
    navigate(`/games/${selected}`)
  }

  const handleReset = (): void => {
    if (confirm('This clears all saved progress on this device. Continue?')) {
      resetAllProgress()
      setProgress({})
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden app-card p-5 sm:p-8 lg:p-10"
        aria-label="Game selection"
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-indigo-400/20 to-fuchsia-400/20 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 bg-gradient-to-tr from-violet-400/15 to-cyan-400/15 rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="flex-1 w-full">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 mb-4">
              <Sparkles size={13} /> AI-adaptive difficulty, built in
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight text-slate-900 dark:text-white">
              Welcome to <span className="text-gradient-brand">The Mind Arcade</span>
            </h1>
            <p className="text-sm sm:text-base font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
              {getTotalGames()} science-inspired brain training games
            </p>
            <p className="mb-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
              Every game improves <strong className="text-slate-900 dark:text-white">memory</strong>, <strong className="text-slate-900 dark:text-white">attention</strong>, or <strong className="text-slate-900 dark:text-white">problem-solving</strong>. Our engine watches your accuracy, speed and consistency and quietly tunes the difficulty for you across {getMaxLevel()} levels — no guesswork, no grinding.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3 rounded-xl flex-1 text-base shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {GAME_REGISTRY.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <button
                onClick={startGame}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-xl text-base sm:text-lg font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto"
              >
                Play <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="text-left lg:text-right w-full lg:w-auto mt-2 lg:mt-0 lg:min-w-[200px]">
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2">Progress is saved locally on this device.</div>
            <button className="text-xs sm:text-sm text-red-600 dark:text-red-400 underline hover:text-red-800 dark:hover:text-red-300" onClick={handleReset}>
              Reset Progress
            </button>
          </div>
        </div>
      </section>

      {/* AI Adaptive Engine highlight */}
      <section className="app-card p-5 sm:p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-1.5">
          <Gauge size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-white">How the difficulty AI works</h2>
        </div>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-5 max-w-3xl">
          Instead of always bumping you up one level, every session is scored and fed into an adaptive engine that decides what comes next.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900">
            <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400 mb-2" />
            <h3 className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">Consistently &gt;90% accurate</h3>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">Difficulty increases to keep you challenged.</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900">
            <ShieldCheck size={18} className="text-amber-600 dark:text-amber-400 mb-2" />
            <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-300">70–90% accurate</h3>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">Level holds steady while skills solidify.</p>
          </div>
          <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900">
            <Target size={18} className="text-sky-600 dark:text-sky-400 mb-2" />
            <h3 className="font-semibold text-sm text-sky-800 dark:text-sky-300">Below 60%, or slow &amp; inaccurate</h3>
            <p className="text-xs text-sky-700/80 dark:text-sky-400/80 mt-1">Difficulty eases back to rebuild confidence.</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="app-card p-5 sm:p-6 lg:p-8 bg-gradient-to-br from-indigo-50/60 to-fuchsia-50/40 dark:from-indigo-950/40 dark:to-fuchsia-950/20">
        <h2 className="text-xl sm:text-2xl font-display font-bold mb-4 text-slate-900 dark:text-white">Why play brain training games?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <Brain size={20} className="text-indigo-600 dark:text-indigo-400 mb-2" />
            <h3 className="font-semibold text-base mb-1 text-indigo-700 dark:text-indigo-300">Improve memory</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Enhance working memory, visual memory, and sequential recall through scientifically-designed exercises.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <Zap size={20} className="text-violet-600 dark:text-violet-400 mb-2" />
            <h3 className="font-semibold text-base mb-1 text-violet-700 dark:text-violet-300">Boost attention</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Train selective attention, focus, and cognitive control with engaging challenges.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <Target size={20} className="text-pink-600 dark:text-pink-400 mb-2" />
            <h3 className="font-semibold text-base mb-1 text-pink-700 dark:text-pink-300">Enhance problem-solving</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Develop logical reasoning, strategic planning, and analytical thinking skills.</p>
          </div>
        </div>
      </section>

      {/* Games List Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-3" role="list" aria-label="Available brain training games">
          {GAME_REGISTRY.map((g) => {
            const cat = CATEGORY_META[g.category]
            return (
              <article
                key={g.id}
                className="app-card p-4 sm:p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                role="listitem"
                onClick={() => navigate(`/games/${g.id}`)}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">{g.name}</h3>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cat.classes}`}>{cat.label}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{g.description}</p>
                  </div>

                  <div className="w-full sm:w-auto flex-shrink-0">
                    {progress[g.id]?.bestLevel ? (
                      <div className="text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full whitespace-nowrap">
                        Best: Lv {progress[g.id].bestLevel}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">Not started</div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/games/${g.id}`)
                    }}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    Open <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        <aside aria-label="Leaderboard and progress tracking" className="lg:sticky lg:top-6">
          <div className="app-card p-4 sm:p-5">
            <h2 className="text-xl sm:text-2xl font-display font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white">Leaderboard</h2>
            <React.Suspense fallback={<div className="text-slate-500 dark:text-slate-400 text-sm">Loading leaderboard…</div>}>
              <LeaderboardComponent />
            </React.Suspense>
          </div>
        </aside>
      </section>
    </div>
  )
}
