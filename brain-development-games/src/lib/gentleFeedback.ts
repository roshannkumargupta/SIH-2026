/**
 * Non-punitive, encouraging feedback copy.
 * Used by GentleFeedback.tsx and any game that wants warm, non-judgmental
 * in-line messages instead of "Wrong" / a red ✗.
 */

const WRONG_ANSWER_MESSAGES = [
  'Not quite — try again!',
  'So close! Give it another go.',
  'Almost there — one more try!',
  'Good effort — let’s try that again.',
  'That’s okay, take your time and try again.'
]

/** Rotates through a small pool so single-wrong-answer feedback doesn't feel robotic. */
export function getWrongAnswerMessage(seed = 0): string {
  const idx = Math.abs(seed) % WRONG_ANSWER_MESSAGES.length
  return WRONG_ANSWER_MESSAGES[idx]
}

const ENCOURAGEMENT_MESSAGES = [
  "You're doing great — want to try an easier level, or take a short break?",
  "This one's tricky! A quick breather or a gentler level might help.",
  "No rush at all. A short break or an easier level is always a good option.",
  "Everyone has a tougher round now and then. Take a breath — you're doing fine.",
  "Let's take it easy for a moment. A break or a simpler level can help reset."
]

/**
 * Returns a warm, non-clinical nudge for repeated misses. `consecutiveMisses`
 * below the threshold returns an empty string so callers can decide whether
 * to render anything.
 */
export function getEncouragementMessage(consecutiveMisses: number): string {
  if (consecutiveMisses < 3) return ''
  const idx = consecutiveMisses % ENCOURAGEMENT_MESSAGES.length
  return ENCOURAGEMENT_MESSAGES[idx]
}
