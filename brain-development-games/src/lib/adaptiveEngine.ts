import type { GameSession } from '../types/analytics'
import { getSessionHistory } from './analytics'
import { capDifficultyStep } from './reflectiveMode'

/**
 * Rule-based adaptive difficulty engine. Deliberately dependency-free
 * so it can run standalone; predictDifficulty() in mlService.ts wraps
 * this and is the seam where a real ML backend can later slot in.
 */

export interface PerformanceScore {
  score: number // 0-100 composite
  accuracyComponent: number
  speedComponent: number
  consistencyComponent: number
}

export function calculatePerformanceScore(sessions: GameSession[]): PerformanceScore {
  if (sessions.length === 0) {
    return { score: 0, accuracyComponent: 0, speedComponent: 0, consistencyComponent: 0 }
  }
  const accuracies = sessions.map((s) => s.accuracy)
  const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length

  const reactionTimes = sessions.filter((s) => typeof s.reactionTime === 'number').map((s) => s.reactionTime as number)
  // Normalize speed: faster (lower ms) => higher score. 3000ms treated as a slow baseline.
  const speedComponent = reactionTimes.length
    ? Math.max(0, Math.min(100, 100 - (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length / 30)))
    : 50

  const mean = avgAccuracy
  const variance = accuracies.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / accuracies.length
  const stdDev = Math.sqrt(variance)
  const consistencyComponent = Math.max(0, 100 - stdDev)

  const score = avgAccuracy * 0.6 + speedComponent * 0.25 + consistencyComponent * 0.15

  return {
    score: Math.round(score),
    accuracyComponent: Math.round(avgAccuracy),
    speedComponent: Math.round(speedComponent),
    consistencyComponent: Math.round(consistencyComponent)
  }
}

export type DifficultyDirection = 'increase' | 'maintain' | 'decrease'

export interface DifficultyRecommendation {
  direction: DifficultyDirection
  recommendedLevel: number
  reason: string
}

export interface RecommendNextDifficultyOptions {
  /**
   * When true (Reflective Mode / dementia-appropriate pacing):
   *  - the "slow reaction time + low accuracy -> decrease" rule is ignored
   *    entirely, so slower motor response isn't misread as cognitive decline
   *  - any recommended level change is capped to a single step, never a skip
   */
  reflectiveMode?: boolean
}

/**
 * Rules (per spec):
 * - accuracy > 90% consistently -> increase
 * - accuracy 70-90% -> maintain
 * - accuracy < 60% -> decrease
 * - high reaction time + low accuracy -> decrease (skipped in reflectiveMode)
 * - consistent improvement -> gradually increase
 */
export function recommendNextDifficulty(
  sessions: GameSession[],
  currentLevel: number,
  maxLevel = 10,
  options: RecommendNextDifficultyOptions = {}
): DifficultyRecommendation {
  const { reflectiveMode = false } = options
  const recent = sessions.slice(0, 5)
  if (recent.length === 0) {
    return { direction: 'maintain', recommendedLevel: currentLevel, reason: 'No session history yet.' }
  }

  const avgAccuracy = recent.reduce((a, s) => a + s.accuracy, 0) / recent.length
  const reactionTimes = recent.filter((s) => typeof s.reactionTime === 'number').map((s) => s.reactionTime as number)
  const avgReactionTime = reactionTimes.length ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : undefined
  // In reflectiveMode we ignore reaction time as a decline signal entirely —
  // slower motor response in elderly/memory-impaired users shouldn't read as
  // cognitive decline.
  const highReactionTime = !reflectiveMode && avgReactionTime !== undefined && avgReactionTime > 2500

  const consistentlyHigh = recent.length >= 3 && recent.every((s) => s.accuracy > 90)

  let result: DifficultyRecommendation
  if (highReactionTime && avgAccuracy < 70) {
    result = {
      direction: 'decrease',
      recommendedLevel: Math.max(1, currentLevel - 1),
      reason: 'Slow reaction time combined with lower accuracy suggests the current level is too demanding.'
    }
  } else if (avgAccuracy < 60) {
    result = {
      direction: 'decrease',
      recommendedLevel: Math.max(1, currentLevel - 1),
      reason: 'Recent accuracy is below 60%.'
    }
  } else if (consistentlyHigh || avgAccuracy > 90) {
    result = {
      direction: 'increase',
      recommendedLevel: Math.min(maxLevel, currentLevel + 1),
      reason: 'Consistently high accuracy (>90%) — ready for a greater challenge.'
    }
  } else if (avgAccuracy >= 70) {
    result = {
      direction: 'maintain',
      recommendedLevel: currentLevel,
      reason: 'Accuracy is in the healthy 70-90% training range.'
    }
  } else {
    result = {
      direction: 'maintain',
      recommendedLevel: currentLevel,
      reason: 'Performance is mixed; holding steady before adjusting.'
    }
  }

  // Belt-and-braces: even though every branch above already only ever moves
  // by one level, explicitly cap the step in reflectiveMode so future rule
  // changes can't accidentally introduce a skip.
  return { ...result, recommendedLevel: capDifficultyStep(currentLevel, result.recommendedLevel) }
}

export interface TrainingRecommendation {
  headline: string
  detail: string
}

export async function generateTrainingRecommendation(gameId: string, currentLevel: number): Promise<TrainingRecommendation> {
  const history = await getSessionHistory(gameId, 10)
  const rec = recommendNextDifficulty(history, currentLevel)
  const perf = calculatePerformanceScore(history)

  if (rec.direction === 'increase') {
    return {
      headline: `Level up to ${rec.recommendedLevel}`,
      detail: `Your performance score is ${perf.score}/100. ${rec.reason}`
    }
  }
  if (rec.direction === 'decrease') {
    return {
      headline: `Try level ${rec.recommendedLevel} next`,
      detail: `${rec.reason} Dialing back the difficulty should rebuild confidence and accuracy.`
    }
  }
  return {
    headline: `Stay at level ${currentLevel}`,
    detail: rec.reason
  }
}

/** Suggests which games/domains to focus on based on weakest domain averages. */
export async function getPersonalizedGameRecommendations(
  domainStats: { domain: string; averageAccuracy: number; sessionCount: number }[],
  gameDomainMap: Record<string, string[]>
): Promise<string[]> {
  const played = domainStats.filter((d) => d.sessionCount > 0)
  const weakest = [...played].sort((a, b) => a.averageAccuracy - b.averageAccuracy).slice(0, 2)
  const weakDomainIds = new Set(weakest.map((d) => d.domain))

  const matches = Object.entries(gameDomainMap)
    .filter(([, domains]) => domains.some((d) => weakDomainIds.has(d)))
    .map(([gameId]) => gameId)

  return matches.slice(0, 5)
}
