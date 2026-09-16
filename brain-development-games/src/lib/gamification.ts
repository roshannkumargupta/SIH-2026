/**
 * Local-first gamification system. Pure localStorage, no PII.
 * Deliberately decoupled from analytics.ts so it works even if
 * IndexedDB is unavailable.
 */

export interface Badge {
  id: string
  name: string
  description: string
  icon: string // lucide icon name, resolved by the consuming component
  earnedAt?: string
}

export interface GamificationState {
  xp: number
  level: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null // yyyy-mm-dd
  earnedBadgeIds: string[]
  totalSessionsCompleted: number
}

const STORAGE_KEY = 'bdg-gamification'

const DEFAULT_STATE: GamificationState = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  earnedBadgeIds: [],
  totalSessionsCompleted: 0
}

export const BADGE_CATALOG: Omit<Badge, 'earnedAt'>[] = [
  { id: 'first-session', name: 'First Steps', description: 'Complete your first training session.', icon: 'Footprints' },
  { id: 'sessions-10', name: 'Getting Warmed Up', description: 'Complete 10 sessions.', icon: 'Flame' },
  { id: 'sessions-50', name: 'Dedicated Trainer', description: 'Complete 50 sessions.', icon: 'Trophy' },
  { id: 'sessions-100', name: 'Centurion', description: 'Complete 100 sessions.', icon: 'Crown' },
  { id: 'streak-3', name: '3-Day Streak', description: 'Train 3 days in a row.', icon: 'CalendarCheck' },
  { id: 'streak-7', name: 'Weekly Warrior', description: 'Train 7 days in a row.', icon: 'CalendarClock' },
  { id: 'streak-30', name: 'Habit Formed', description: 'Train 30 days in a row.', icon: 'CalendarHeart' },
  { id: 'level-5', name: 'Rising Mind', description: 'Reach level 5.', icon: 'TrendingUp' },
  { id: 'level-10', name: 'Cognitive Athlete', description: 'Reach level 10.', icon: 'Medal' },
  { id: 'perfect-score', name: 'Flawless', description: 'Score 100% accuracy in a session.', icon: 'Star' }
]

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay)
}

export function loadGamificationState(): GamificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    return { ...DEFAULT_STATE, ...(JSON.parse(raw) as GamificationState) }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

function saveGamificationState(state: GamificationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    window.dispatchEvent(new Event('gamification-updated'))
  } catch {
    // ignore
  }
}

/** XP curve: level N requires N * 100 cumulative XP (simple, tunable). */
export function xpForLevel(level: number): number {
  return level * 100
}

export function levelFromXP(xp: number): number {
  let level = 1
  while (xp >= xpForLevel(level)) {
    level += 1
  }
  return level
}

/** Simple XP formula from a completed session's score/accuracy. */
export function calculateSessionXP(score: number, accuracy: number, difficultyLevel: number): number {
  const base = 10
  const scoreBonus = Math.round(score / 10)
  const accuracyBonus = accuracy >= 90 ? 15 : accuracy >= 70 ? 8 : 0
  const difficultyBonus = difficultyLevel * 2
  return base + scoreBonus + accuracyBonus + difficultyBonus
}

export interface SessionCompletionResult {
  state: GamificationState
  newlyEarnedBadges: Badge[]
  xpGained: number
  leveledUp: boolean
}

/**
 * Call once per completed game session. Updates XP, streak, level,
 * and unlocks any newly-earned badges.
 */
export function recordSessionCompletion(score: number, accuracy: number, difficultyLevel: number): SessionCompletionResult {
  const state = loadGamificationState()
  const previousLevel = state.level

  const xpGained = calculateSessionXP(score, accuracy, difficultyLevel)
  state.xp += xpGained
  state.level = levelFromXP(state.xp)
  state.totalSessionsCompleted += 1

  const today = todayISO()
  if (state.lastActiveDate === null) {
    state.currentStreak = 1
  } else {
    const gap = daysBetween(state.lastActiveDate, today)
    if (gap === 0) {
      // same day, streak unchanged
    } else if (gap === 1) {
      state.currentStreak += 1
    } else if (gap > 1) {
      state.currentStreak = 1
    }
  }
  state.lastActiveDate = today
  state.longestStreak = Math.max(state.longestStreak, state.currentStreak)

  const newlyEarnedBadges: Badge[] = []
  const earn = (id: string): void => {
    if (!state.earnedBadgeIds.includes(id)) {
      state.earnedBadgeIds.push(id)
      const def = BADGE_CATALOG.find((b) => b.id === id)
      if (def) newlyEarnedBadges.push({ ...def, earnedAt: new Date().toISOString() })
    }
  }

  if (state.totalSessionsCompleted >= 1) earn('first-session')
  if (state.totalSessionsCompleted >= 10) earn('sessions-10')
  if (state.totalSessionsCompleted >= 50) earn('sessions-50')
  if (state.totalSessionsCompleted >= 100) earn('sessions-100')
  if (state.currentStreak >= 3) earn('streak-3')
  if (state.currentStreak >= 7) earn('streak-7')
  if (state.currentStreak >= 30) earn('streak-30')
  if (state.level >= 5) earn('level-5')
  if (state.level >= 10) earn('level-10')
  if (accuracy >= 100) earn('perfect-score')

  saveGamificationState(state)

  return { state, newlyEarnedBadges, xpGained, leveledUp: state.level > previousLevel }
}

export function getAllBadges(): Badge[] {
  const state = loadGamificationState()
  return BADGE_CATALOG.map((def) => ({
    ...def,
    earnedAt: state.earnedBadgeIds.includes(def.id) ? new Date().toISOString() : undefined
  }))
}

export function resetGamification(): void {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('gamification-updated'))
}
