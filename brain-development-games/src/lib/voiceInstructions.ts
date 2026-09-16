/**
 * Voice instruction hooks — integration point only.
 *
 * This module is deliberately minimal: a default `window.speechSynthesis`
 * fallback so "Read aloud" works out of the box, with a seam the dedicated
 * voice/i18n module can override (e.g. for higher-quality TTS voices or
 * additional languages) without any game-module changes.
 */

type VoiceOverride = (text: string, lang: string) => Promise<void>

let overrideImplementation: VoiceOverride | null = null

/**
 * Lets a future voice module swap in its own implementation
 * (e.g. a cloud TTS call) without this module's callers needing to change.
 */
export function registerVoiceImplementation(impl: VoiceOverride | null): void {
  overrideImplementation = impl
}

export function isVoiceAvailable(): boolean {
  if (overrideImplementation) return true
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Speaks `text` aloud in `lang` (BCP-47, e.g. 'en', 'es'). Falls back to a
 * no-op if no speech synthesis is available anywhere — callers should check
 * `isVoiceAvailable()` before showing a "Read aloud" control.
 */
export async function speakInstructions(text: string, lang = 'en'): Promise<void> {
  if (overrideImplementation) {
    return overrideImplementation(text, lang)
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return
  }

  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.speak(utterance)
    } catch {
      resolve()
    }
  })
}

/** Reads the user's selected language from wherever the i18n/voice module stores it, default 'en'. */
export function getCurrentLanguage(): string {
  try {
    return localStorage.getItem('bdg-language') ?? 'en'
  } catch {
    return 'en'
  }
}
