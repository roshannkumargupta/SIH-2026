/**
 * Caregiver alert hook — event emission only.
 *
 * The game module's entire responsibility here is firing a well-formed
 * `caregiver-signal` CustomEvent on `window` at the right moment. A separate
 * caregiver-monitoring module (out of scope here) subscribes to it and
 * decides what, if anything, to notify a caregiver about. No network calls,
 * no notifications, no patient PII are handled in this module.
 */

export type CaregiverEventType = 'decline' | 'improvement' | 'missed_sessions'

export interface CaregiverPerformanceEvent {
  gameId: string
  type: CaregiverEventType
  detail: string
}

export const CAREGIVER_SIGNAL_EVENT = 'caregiver-signal'

export function emitPerformanceEvent(event: CaregiverPerformanceEvent): void {
  try {
    window.dispatchEvent(new CustomEvent(CAREGIVER_SIGNAL_EVENT, { detail: event }))
  } catch {
    // window/CustomEvent unavailable (e.g. some test environments) — no-op.
  }
}

/**
 * Tracks consecutive 'decrease' adaptive-difficulty recommendations per
 * game in localStorage, and emits a 'decline' caregiver signal the moment a
 * game hits 3 in a row. Resets the streak on any non-decrease result so the
 * signal only fires for a genuine sustained pattern, not a single off day.
 */
const STREAK_STORAGE_KEY = 'bdg-decline-streaks'
const DECLINE_THRESHOLD = 3

function loadStreaks(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function saveStreaks(streaks: Record<string, number>): void {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streaks))
  } catch {
    // ignore storage failures
  }
}

export function trackDeclineAndMaybeEmit(gameId: string, direction: 'increase' | 'maintain' | 'decrease'): void {
  const streaks = loadStreaks()
  if (direction === 'decrease') {
    streaks[gameId] = (streaks[gameId] ?? 0) + 1
  } else {
    streaks[gameId] = 0
  }
  saveStreaks(streaks)

  if (streaks[gameId] >= DECLINE_THRESHOLD) {
    emitPerformanceEvent({
      gameId,
      type: 'decline',
      detail: `Adaptive difficulty has recommended a decrease for ${streaks[gameId]} consecutive sessions on ${gameId}.`
    })
    // Reset after emitting so this fires again only after a fresh streak,
    // not on every session past the threshold.
    streaks[gameId] = 0
    saveStreaks(streaks)
  }
}
