import React, { useEffect, useMemo, useState } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'
import type { GameSession, DomainStatistics } from '../types/analytics'
import { getSessionHistory, getDomainStatistics, getGameStatistics } from '../lib/analytics'
import { calculatePerformanceScore, getPersonalizedGameRecommendations } from '../lib/adaptiveEngine'
import { generateMLRecommendations, type MLRecommendation } from '../lib/mlService'
import { DOMAIN_LABELS, GAME_DOMAIN_MAP } from '../lib/cognitiveDomains'
import { GAME_REGISTRY } from '../lib/gameRegistry'
import { useNavigate } from 'react-router-dom'

interface PersonalBest {
  gameId: string
  gameName: string
  bestScore: number
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }): JSX.Element {
  return (
    <div className="bg-white p-4 sm:p-5 rounded shadow flex flex-col gap-1">
      <span className="text-xs sm:text-sm text-slate-500">{label}</span>
      <span className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  )
}

export default function Dashboard(): JSX.Element {
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [domainStats, setDomainStats] = useState<DomainStatistics[]>([])
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([])
  const [recommendations, setRecommendations] = useState<MLRecommendation[]>([])
  const [recommendedGameIds, setRecommendedGameIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      const [allSessions, domains] = await Promise.all([getSessionHistory(), getDomainStatistics()])
      if (cancelled) return
      setSessions(allSessions)
      setDomainStats(domains)

      const bests = (
        await Promise.all(
          GAME_REGISTRY.map(async (g) => {
            const stats = await getGameStatistics(g.id)
            return stats ? { gameId: g.id, gameName: g.name, bestScore: stats.bestScore } : null
          })
        )
      ).filter((b): b is PersonalBest => b !== null)
      if (cancelled) return
      setPersonalBests(bests.sort((a, b) => b.bestScore - a.bestScore).slice(0, 5))

      const recs = await generateMLRecommendations(allSessions)
      if (cancelled) return
      setRecommendations(recs)

      const gameIds = await getPersonalizedGameRecommendations(domains, GAME_DOMAIN_MAP)
      if (cancelled) return
      setRecommendedGameIds(gameIds)

      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const overallScore = useMemo(() => calculatePerformanceScore(sessions).score, [sessions])

  const weeklyScore = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const weekSessions = sessions.filter((s) => new Date(s.timestamp).getTime() >= oneWeekAgo)
    return calculatePerformanceScore(weekSessions).score
  }, [sessions])

  const radarData = useMemo(
    () => domainStats.map((d) => ({ domain: DOMAIN_LABELS[d.domain], score: Math.round(d.averageAccuracy) })),
    [domainStats]
  )

  const trendData = useMemo(() => {
    const chronological = [...sessions].reverse().slice(-20)
    return chronological.map((s, i) => ({
      index: i + 1,
      accuracy: Math.round(s.accuracy),
      date: new Date(s.timestamp).toLocaleDateString()
    }))
  }, [sessions])

  const accuracyByGame = useMemo(() => {
    const byGame = new Map<string, { total: number; count: number; name: string }>()
    for (const s of sessions) {
      const entry = byGame.get(s.gameId) ?? { total: 0, count: 0, name: s.gameName }
      entry.total += s.accuracy
      entry.count += 1
      byGame.set(s.gameId, entry)
    }
    return Array.from(byGame.values())
      .map((v) => ({ name: v.name, accuracy: Math.round(v.total / v.count) }))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 8)
  }, [sessions])

  const recentSessions = sessions.slice(0, 8)

  if (loading) {
    return <div className="bg-white p-6 rounded shadow text-slate-600">Loading your progress…</div>
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded shadow text-center space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">
          No session data yet. Play a game and your Cognitive Score, trends, and personalized recommendations will show up here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Overall Cognitive Score" value={`${overallScore}`} sub="out of 100" />
        <StatCard label="Weekly Performance" value={`${weeklyScore}`} sub="last 7 days" />
        <StatCard label="Sessions Played" value={`${sessions.length}`} />
        <StatCard label="Games Tried" value={`${new Set(sessions.map((s) => s.gameId)).size} / ${GAME_REGISTRY.length}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Domain radar */}
        <div className="bg-white p-4 sm:p-6 rounded shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Cognitive Domain Radar</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid />
              <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Accuracy" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance trend */}
        <div className="bg-white p-4 sm:p-6 rounded shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Performance Trend (Accuracy)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" tick={{ fontSize: 11 }} label={{ value: 'Session #', position: 'insideBottom', offset: -3, fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(i) => `Session ${i}`} formatter={(v) => [`${v}%`, 'Accuracy']} />
              <Line type="monotone" dataKey="accuracy" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accuracy by game */}
      <div className="bg-white p-4 sm:p-6 rounded shadow">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Average Accuracy by Game</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={accuracyByGame}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v}%`, 'Accuracy']} />
            <Bar dataKey="accuracy" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent sessions table */}
        <div className="bg-white p-4 sm:p-6 rounded shadow overflow-x-auto">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent Sessions</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-2">Game</th>
                <th className="py-2 pr-2">Score</th>
                <th className="py-2 pr-2">Accuracy</th>
                <th className="py-2 pr-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 pr-2 text-slate-800">{s.gameName}</td>
                  <td className="py-2 pr-2 text-slate-800">{s.score}</td>
                  <td className="py-2 pr-2 text-slate-800">{Math.round(s.accuracy)}%</td>
                  <td className="py-2 pr-2 text-slate-500">{new Date(s.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Personal bests */}
        <div className="bg-white p-4 sm:p-6 rounded shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Personal Best Scores</h2>
          <ul className="space-y-2">
            {personalBests.map((b) => (
              <li key={b.gameId} className="flex justify-between items-center border-b last:border-0 pb-2">
                <span className="text-slate-800">{b.gameName}</span>
                <span className="font-semibold text-indigo-600">{b.bestScore}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI recommendations */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 sm:p-6 rounded shadow">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">AI Recommendations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommendations.map((r, i) => (
            <div key={i} className="bg-white p-3 sm:p-4 rounded shadow-sm">
              <div className="font-medium text-indigo-700">{r.title}</div>
              <div className="text-sm text-slate-600 mt-1">{r.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended games, targeting weakest domains */}
      {recommendedGameIds.length > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Recommended For You</h2>
          <p className="text-sm text-slate-500 mb-3">Games that target the cognitive domains where you have the most room to grow.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {recommendedGameIds.map((gameId) => {
              const game = GAME_REGISTRY.find((g) => g.id === gameId)
              if (!game) return null
              return (
                <button
                  key={gameId}
                  onClick={() => navigate(`/games/${gameId}`)}
                  className="text-left p-3 rounded-md border border-slate-200 hover:border-indigo-300 hover:shadow transition-all"
                >
                  <div className="text-sm font-medium text-slate-800">{game.name}</div>
                  <div className="text-xs text-indigo-600 mt-1">Play now →</div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
