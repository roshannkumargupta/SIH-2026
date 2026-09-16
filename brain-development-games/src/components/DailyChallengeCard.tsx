import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { GAME_REGISTRY, type GameMetadata } from '../lib/gameRegistry'

/** Deterministic "random" pick so every visitor sees the same challenge on a given day. */
export function getDailyChallengeGame(date: Date = new Date()): GameMetadata {
  const dayString = date.toISOString().slice(0, 10)
  let hash = 0
  for (let i = 0; i < dayString.length; i++) {
    hash = (hash * 31 + dayString.charCodeAt(i)) >>> 0
  }
  return GAME_REGISTRY[hash % GAME_REGISTRY.length]
}

export default function DailyChallengeCard(): JSX.Element {
  const navigate = useNavigate()
  const game = getDailyChallengeGame()

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white rounded-2xl shadow-lg shadow-indigo-500/25 p-4 sm:p-6 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-indigo-100 text-sm font-medium">
        <Sparkles size={16} />
        <span>Today's Challenge</span>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold">{game.name}</h3>
      <p className="text-indigo-100 text-sm">{game.description}</p>
      <button
        onClick={() => navigate(`/games/${game.id}`)}
        className="mt-2 self-start bg-white text-indigo-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-50 hover:-translate-y-0.5 shadow-md transition-all"
      >
        Start Challenge
      </button>
    </div>
  )
}
