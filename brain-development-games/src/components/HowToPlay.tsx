import React, { useState } from 'react'
import { speakInstructions, isVoiceAvailable, getCurrentLanguage } from '../lib/voiceInstructions'

interface HowToPlayProps {
  title: string
  instructions: string[]
  tips?: string[]
}

export default function HowToPlay({ title, instructions, tips }: HowToPlayProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const voiceAvailable = isVoiceAvailable()

  const readAloud = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    if (speaking) return
    setSpeaking(true)
    const fullText = [title, ...instructions, ...(tips ?? [])].join('. ')
    try {
      await speakInstructions(fullText, getCurrentLanguage())
    } finally {
      setSpeaking(false)
    }
  }

  return (
    <div className="mb-4 app-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-indigo-50/70 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-950 px-4 py-3 text-left font-semibold text-indigo-900 dark:text-indigo-200 flex items-center justify-between transition-colors"
      >
        <span className="flex items-center gap-2">
          📖 How to Play: {title}
          {voiceAvailable && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Read instructions aloud"
              onClick={readAloud}
              onKeyDown={(e) => e.key === 'Enter' && readAloud(e as unknown as React.MouseEvent)}
              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-base hover:bg-indigo-200/70 dark:hover:bg-indigo-900 transition-colors ${speaking ? 'animate-pulse' : ''}`}
            >
              🔊
            </span>
          )}
        </span>
        <span className="text-xl leading-none">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <div className="bg-white dark:bg-slate-900 p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="mb-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              {instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>

          {tips && tips.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">💡 Tips:</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                {tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Made with Bob
