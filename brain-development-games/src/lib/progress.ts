export type GameProgress = {
  bestLevel: number
  completedLevels: number[]
  bestScore?: number
}

export type ProgressState = Record<string, GameProgress>

const STORAGE_KEY = 'mind-arcade-progress'

const loadState = (): ProgressState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as ProgressState
  } catch (e) {
    console.error('Failed to parse progress state', e)
    return {}
  }
}

const saveState = (state: ProgressState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    // notify other parts of the app
    window.dispatchEvent(new Event('progress-updated'))
  } catch (e) {
    console.error('Failed to save progress state', e)
  }
}

export const getAllProgress = (): ProgressState => {
  return loadState()
}

export const getGameProgress = (gameId: string): GameProgress | undefined => {
  const s = loadState()
  return s[gameId]
}

import { addLeaderboardEntry } from './leaderboard'
import { endSession, getSessionHistory } from './analytics'
import { recordSessionCompletion } from './gamification'
import { GAME_REGISTRY } from './gameRegistry'
import { recommendNextDifficulty } from './adaptiveEngine'
import { trackDeclineAndMaybeEmit } from './caregiverEvents'
import { isReflectiveModeEnabled } from './reflectiveMode'

export const markGameCompletedLevel = (gameId: string, level: number, score?: number, maxScore?: number): void => {
  const s = loadState()
  const prev = s[gameId] ?? { bestLevel: 0, completedLevels: [] }
  const bestLevel = Math.max(prev.bestLevel, level)
  const completedLevels = Array.from(new Set([...prev.completedLevels, level])).sort((a, b) => a - b)
  const bestScore = score !== undefined ? Math.max(prev.bestScore ?? 0, score) : prev.bestScore
  s[gameId] = { bestLevel, completedLevels, bestScore }
  saveState(s)

  // add to leaderboard if score provided
  if (score !== undefined) {
    try {
      addLeaderboardEntry({ gameId, level, score, maxScore })
    } catch (e) {
      console.error('Could not add leaderboard entry', e)
    }
  }

  // Centralized analytics + gamification hook. Every one of the 21 games
  // already funnels completion through this single function, so this is
  // the lowest-risk integration point for session tracking — no game
  // component needs to change. Accuracy is approximated as score/maxScore
  // since per-attempt mistake/reaction-time data isn't available at this
  // shared layer; games that want richer metrics can pass them via the
  // metadata param in a future pass without touching this contract.
  if (score !== undefined) {
    const normalizedAccuracy = maxScore ? Math.min(100, Math.max(0, (score / maxScore) * 100)) : score
    const gameName = GAME_REGISTRY.find((g) => g.id === gameId)?.name ?? gameId

    endSession(
      {
        score,
        accuracy: normalizedAccuracy,
        mistakes: 0,
        attempts: 1
      },
      { gameId, gameName, difficultyLevel: level }
    )
      .then(async () => {
        // Caregiver alert hook: this is the concrete, non-alarmist trigger —
        // fire a 'decline' signal the moment the adaptive engine recommends
        // decreasing difficulty for 3 consecutive sessions on this game.
        // The game module's job stops at emitting the event; a separate
        // caregiver-monitoring module decides what to do with it.
        const history = await getSessionHistory(gameId, 5)
        const maxLevel = GAME_REGISTRY.find((g) => g.id === gameId)?.maxLevel ?? 10
        const rec = recommendNextDifficulty(history, level, maxLevel, { reflectiveMode: isReflectiveModeEnabled() })
        trackDeclineAndMaybeEmit(gameId, rec.direction)
      })
      .catch((e) => console.error('Could not record analytics session', e))

    try {
      recordSessionCompletion(score, normalizedAccuracy, level)
    } catch (e) {
      console.error('Could not record gamification progress', e)
    }
  }
}

export const resetAllProgress = (): void => {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('progress-updated'))
}
