/**
 * Session fatigue / break reminders.
 * A suggestion only — never auto-pauses or blocks the user.
 */

const DEFAULT_TIME_THRESHOLD_MS = 15 * 60 * 1000 // 15 minutes continuous play
const DEFAULT_LEVEL_THRESHOLD = 4 // 4 consecutive levels without a pause

let sessionStartedAt: number | null = null

/** Records the start of a continuous play session (idempotent — call freely on mount). */
export function trackSessionStart(): void {
  if (sessionStartedAt === null) {
    sessionStartedAt = Date.now()
  }
}

/** Resets tracking — call when the user takes a break or dismisses-and-rests. */
export function resetSessionTracking(): void {
  sessionStartedAt = Date.now()
}

export function getSessionStartedAt(): number | null {
  return sessionStartedAt
}

export function getElapsedSinceStart(): number {
  if (sessionStartedAt === null) return 0
  return Date.now() - sessionStartedAt
}

export interface BreakThresholds {
  timeMs?: number
  levels?: number
}

/**
 * True once the player has been playing continuously past the time
 * threshold, or has completed several levels back-to-back without a pause.
 */
export function shouldSuggestBreak(elapsedMs: number, consecutiveLevels: number, thresholds: BreakThresholds = {}): boolean {
  const timeMs = thresholds.timeMs ?? DEFAULT_TIME_THRESHOLD_MS
  const levels = thresholds.levels ?? DEFAULT_LEVEL_THRESHOLD
  return elapsedMs >= timeMs || consecutiveLevels >= levels
}

const BREAK_MESSAGES = [
  "You've been playing for a while — want to take a short break?",
  "Great focus so far! A little stretch and some water might feel good right now.",
  "How about a short pause? Your progress is saved and will be right here.",
  "You're doing wonderfully. A few minutes of rest can help before the next round."
]

/** Friendly, non-alarming copy for the break-suggestion banner/modal. */
export function getBreakMessage(): string {
  return BREAK_MESSAGES[Math.floor(Math.random() * BREAK_MESSAGES.length)]
}
