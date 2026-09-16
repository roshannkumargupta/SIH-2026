/**
 * Core analytics/data types for the performance tracking system.
 * These types are additive and do not alter any existing game logic.
 */

export type CognitiveDomain =
  | 'memory'
  | 'attention'
  | 'processing_speed'
  | 'executive_function'
  | 'problem_solving'
  | 'spatial_reasoning'
  | 'cognitive_flexibility'

export interface GameSession {
  id: string
  userId: string
  gameId: string
  gameName: string
  cognitiveDomain: CognitiveDomain[]
  score: number
  accuracy: number
  reactionTime?: number
  completionTime?: number
  mistakes: number
  attempts: number
  difficultyLevel: number
  timestamp: string
  metadata?: Record<string, any>
  /** Offline-sync-ready flag: flips to true once a separate sync module confirms upload. Defaults to false. */
  synced: boolean
}

export interface GameStatistics {
  gameId: string
  gameName: string
  totalSessions: number
  averageScore: number
  averageAccuracy: number
  bestScore: number
  averageReactionTime?: number
  lastPlayed?: string
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data'
}

export interface DomainStatistics {
  domain: CognitiveDomain
  averageScore: number
  averageAccuracy: number
  sessionCount: number
  gamesPlayed: string[]
}
