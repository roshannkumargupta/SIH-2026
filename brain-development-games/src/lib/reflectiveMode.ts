import { useEffect, useState } from 'react'

/**
 * Reflective Mode — dementia/elderly-appropriate pacing.
 *
 * A single global, persisted boolean setting (same storage pattern as
 * ThemeContext) that other modules read to:
 *  - disable hard countdown timers in games, replacing them with an
 *    untimed mode that still records reactionTime for analytics
 *  - cap auto-difficulty increases to one level at a time (never skip)
 *  - de-weight reaction time in adaptive-difficulty decisions, so slower
 *    motor response isn't misread as cognitive decline
 *
 * This module is intentionally storage + plain-function based (not a
 * required React context) so any game, page, or lib file can read the
 * current setting without needing a provider — while the `useReflectiveMode`
 * hook is available for components that want to react to changes.
 */

const STORAGE_KEY = 'bdg-reflective-mode'
export const REFLECTIVE_MODE_EVENT = 'reflective-mode-changed'

export function isReflectiveModeEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setReflectiveMode(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    // ignore storage failures (private browsing, etc.)
  }
  try {
    window.dispatchEvent(new CustomEvent(REFLECTIVE_MODE_EVENT, { detail: { enabled } }))
  } catch {
    // ignore
  }
}

/** React hook: subscribes to changes so any component re-renders when the setting flips. */
export function useReflectiveMode(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => isReflectiveModeEnabled())

  useEffect(() => {
    const handler = (): void => setEnabled(isReflectiveModeEnabled())
    window.addEventListener(REFLECTIVE_MODE_EVENT, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(REFLECTIVE_MODE_EVENT, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const update = (value: boolean): void => {
    setReflectiveMode(value)
    setEnabled(value)
  }

  return [enabled, update]
}

/**
 * Helper for games with hard countdown timers (QuickMath level 9+, Stroop's
 * auto-advance speed, etc). Returns `null` (untimed) when Reflective Mode is
 * on, otherwise passes the game's normal timer value through unchanged.
 * Games should still record actual reactionTime for analytics either way —
 * this only controls whether the player is *punished* for slowness.
 */
export function getEffectiveTimer(defaultMs: number | null): number | null {
  if (isReflectiveModeEnabled()) return null
  return defaultMs
}

/**
 * Ensures auto-difficulty adjustments never skip more than one level at a
 * time while Reflective Mode is on, regardless of what a caller computes as
 * an "ideal" next level.
 */
export function capDifficultyStep(currentLevel: number, proposedLevel: number): number {
  if (!isReflectiveModeEnabled()) return proposedLevel
  if (proposedLevel > currentLevel + 1) return currentLevel + 1
  if (proposedLevel < currentLevel - 1) return currentLevel - 1
  return proposedLevel
}
