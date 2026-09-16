import type { GameSession, GameStatistics, DomainStatistics, CognitiveDomain } from '../types/analytics'
import { getDomainsForGame, ALL_DOMAINS } from './cognitiveDomains'

/**
 * Centralized, local-first performance tracking service.
 * Storage: IndexedDB (falls back to an in-memory array if IndexedDB is
 * unavailable, e.g. some test environments) so it works standalone with
 * no backend, per the privacy-first / local-first requirement.
 */

const DB_NAME = 'bdg-analytics'
const DB_VERSION = 1
const STORE = 'sessions'
const USER_ID_KEY = 'bdg_anonymous_user_id'

let memoryFallback: GameSession[] = []
let dbPromise: Promise<IDBDatabase | null> | null = null

function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined'
}

function openDB(): Promise<IDBDatabase | null> {
  if (!hasIndexedDB()) return Promise.resolve(null)
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('gameId', 'gameId', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
  })
  return dbPromise
}

async function putSession(session: GameSession): Promise<void> {
  const db = await openDB()
  if (!db) {
    memoryFallback.push(session)
    return
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(session)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Flips `synced: true` on the given session ids once a separate sync module
 * confirms the upload succeeded. No network code lives here — this only
 * updates the local-first record so it's sync-friendly for whichever module
 * owns connectivity.
 */
export async function markSessionsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const db = await openDB()

  if (!db) {
    memoryFallback = memoryFallback.map((s) => (idSet.has(s.id) ? { ...s, synced: true } : s))
    return
  }

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    for (const id of ids) {
      const req = store.get(id)
      req.onsuccess = () => {
        const record = req.result as GameSession | undefined
        if (record) {
          store.put({ ...record, synced: true })
        }
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getAllSessions(): Promise<GameSession[]> {
  const db = await openDB()
  if (!db) return [...memoryFallback]
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result as GameSession[])
    req.onerror = () => resolve([])
  })
}

/** Anonymous UUID persisted in localStorage — no PII collected. */
export function getAnonymousUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY)
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(USER_ID_KEY, id)
  }
  return id
}

export interface ActiveSession {
  sessionId: string
  gameId: string
  gameName: string
  startedAt: number
  difficultyLevel: number
}

let currentSession: ActiveSession | null = null

export function startSession(gameId: string, gameName: string, difficultyLevel = 1): ActiveSession {
  currentSession = {
    sessionId: crypto.randomUUID ? crypto.randomUUID() : `${gameId}-${Date.now()}`,
    gameId,
    gameName,
    startedAt: Date.now(),
    difficultyLevel
  }
  return currentSession
}

export interface PerformanceInput {
  score: number
  accuracy: number
  reactionTime?: number
  mistakes: number
  attempts: number
  metadata?: Record<string, any>
}

/**
 * Ends the active session and persists a full GameSession record.
 * Safe to call even if startSession() wasn't used — a session is
 * synthesized in that case so existing games aren't required to change
 * to get *some* tracking.
 */
export async function endSession(input: PerformanceInput, override?: Partial<ActiveSession>): Promise<GameSession> {
  const active = currentSession ?? {
    sessionId: crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`,
    gameId: override?.gameId ?? 'unknown',
    gameName: override?.gameName ?? 'Unknown Game',
    startedAt: Date.now(),
    difficultyLevel: override?.difficultyLevel ?? 1
  }
  const merged = { ...active, ...override }

  const session: GameSession = {
    id: merged.sessionId,
    userId: getAnonymousUserId(),
    gameId: merged.gameId,
    gameName: merged.gameName,
    cognitiveDomain: getDomainsForGame(merged.gameId),
    score: input.score,
    accuracy: input.accuracy,
    reactionTime: input.reactionTime,
    completionTime: Date.now() - merged.startedAt,
    mistakes: input.mistakes,
    attempts: input.attempts,
    difficultyLevel: merged.difficultyLevel,
    timestamp: new Date().toISOString(),
    metadata: input.metadata,
    synced: false
  }

  await putSession(session)
  currentSession = null
  return session
}

/** Records an in-progress performance snapshot without ending the session (e.g. for mid-game telemetry). */
export function recordPerformance(partial: Partial<PerformanceInput>): void {
  if (!currentSession) return
  ;(currentSession as any)._lastSnapshot = { ...(currentSession as any)._lastSnapshot, ...partial }
}

export async function getSessionHistory(gameId?: string, limit?: number): Promise<GameSession[]> {
  const all = await getAllSessions()
  const filtered = gameId ? all.filter((s) => s.gameId === gameId) : all
  const sorted = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return limit ? sorted.slice(0, limit) : sorted
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export async function getGameStatistics(gameId: string): Promise<GameStatistics | null> {
  const sessions = await getSessionHistory(gameId)
  if (sessions.length === 0) return null

  const scores = sessions.map((s) => s.score)
  const accuracies = sessions.map((s) => s.accuracy)
  const reactionTimes = sessions.filter((s) => typeof s.reactionTime === 'number').map((s) => s.reactionTime as number)

  // Trend: compare average of most-recent third vs earliest third of sessions (chronological).
  const chronological = [...sessions].reverse()
  let trend: GameStatistics['trend'] = 'insufficient_data'
  if (chronological.length >= 6) {
    const third = Math.floor(chronological.length / 3)
    const early = average(chronological.slice(0, third).map((s) => s.accuracy))
    const recent = average(chronological.slice(-third).map((s) => s.accuracy))
    const delta = recent - early
    trend = delta > 5 ? 'improving' : delta < -5 ? 'declining' : 'stable'
  }

  return {
    gameId,
    gameName: sessions[0].gameName,
    totalSessions: sessions.length,
    averageScore: average(scores),
    averageAccuracy: average(accuracies),
    bestScore: Math.max(...scores),
    averageReactionTime: reactionTimes.length ? average(reactionTimes) : undefined,
    lastPlayed: sessions[0].timestamp,
    trend
  }
}

export async function getDomainStatistics(): Promise<DomainStatistics[]> {
  const all = await getAllSessions()
  return ALL_DOMAINS.map((domain) => {
    const relevant = all.filter((s) => s.cognitiveDomain.includes(domain))
    return {
      domain,
      averageScore: average(relevant.map((s) => s.score)),
      averageAccuracy: average(relevant.map((s) => s.accuracy)),
      sessionCount: relevant.length,
      gamesPlayed: Array.from(new Set(relevant.map((s) => s.gameId)))
    }
  })
}

function toCSV(sessions: GameSession[]): string {
  const headers = [
    'id', 'userId', 'gameId', 'gameName', 'cognitiveDomain', 'score', 'accuracy',
    'reactionTime', 'completionTime', 'mistakes', 'attempts', 'difficultyLevel', 'timestamp'
  ]
  const rows = sessions.map((s) =>
    [
      s.id, s.userId, s.gameId, s.gameName, s.cognitiveDomain.join('|'), s.score, s.accuracy,
      s.reactionTime ?? '', s.completionTime ?? '', s.mistakes, s.attempts, s.difficultyLevel, s.timestamp
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

export async function exportDataAsCSV(): Promise<string> {
  return toCSV(await getAllSessions())
}

export async function exportDataAsJSON(): Promise<string> {
  return JSON.stringify(await getAllSessions(), null, 2)
}

/** Privacy-first: wipe all locally stored performance data. */
export async function deleteAllData(): Promise<void> {
  const db = await openDB()
  if (db) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }
  memoryFallback = []
  localStorage.removeItem(USER_ID_KEY)
}
