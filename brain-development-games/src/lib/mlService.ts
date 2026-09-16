import type { GameSession } from '../types/analytics'
import { calculatePerformanceScore, recommendNextDifficulty, type DifficultyRecommendation } from './adaptiveEngine'

/**
 * ML-ready seam. Today every function falls back to the rule-based
 * adaptiveEngine so the app needs zero backend to run. When a real
 * model is available, point ML_ENDPOINT at it — each function will
 * try the network call first and silently fall back on any failure.
 */

const ML_ENDPOINT: string | null = null // e.g. 'https://your-inference-api.example.com'

async function tryRemote<T>(path: string, body: unknown): Promise<T | null> {
  if (!ML_ENDPOINT) return null
  try {
    const res = await fetch(`${ML_ENDPOINT}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function predictDifficulty(sessions: GameSession[], currentLevel: number, maxLevel = 10): Promise<DifficultyRecommendation> {
  const remote = await tryRemote<DifficultyRecommendation>('/predict-difficulty', { sessions, currentLevel, maxLevel })
  return remote ?? recommendNextDifficulty(sessions, currentLevel, maxLevel)
}

export interface CognitivePerformancePrediction {
  predictedScore: number
  confidence: number
  source: 'model' | 'heuristic'
}

export async function predictCognitivePerformance(sessions: GameSession[]): Promise<CognitivePerformancePrediction> {
  const remote = await tryRemote<CognitivePerformancePrediction>('/predict-performance', { sessions })
  if (remote) return remote

  const { score } = calculatePerformanceScore(sessions)
  return { predictedScore: score, confidence: sessions.length >= 5 ? 0.6 : 0.3, source: 'heuristic' }
}

export interface MLRecommendation {
  title: string
  description: string
}

export async function generateMLRecommendations(sessions: GameSession[]): Promise<MLRecommendation[]> {
  const remote = await tryRemote<MLRecommendation[]>('/recommendations', { sessions })
  if (remote) return remote

  const { score, accuracyComponent, speedComponent } = calculatePerformanceScore(sessions)
  const recs: MLRecommendation[] = []
  if (accuracyComponent < 70) {
    recs.push({ title: 'Focus on accuracy', description: 'Try a lower difficulty for a few sessions to rebuild consistency before pushing speed.' })
  }
  if (speedComponent < 50) {
    recs.push({ title: 'Build reaction speed', description: 'Short, frequent sessions on Reaction Time or Schulte Table tend to help most.' })
  }
  if (score >= 80) {
    recs.push({ title: "You're ready for a challenge", description: 'Consider increasing difficulty or trying a game outside your strongest domain.' })
  }
  if (recs.length === 0) {
    recs.push({ title: 'Keep a steady routine', description: 'Consistent daily practice is the biggest driver of cognitive gains.' })
  }
  return recs
}
