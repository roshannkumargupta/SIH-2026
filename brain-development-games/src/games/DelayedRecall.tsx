import React, { useEffect, useMemo, useRef, useState } from 'react'
import { markGameCompletedLevel } from '../lib/progress'
import NextLevelButton from '../components/NextLevelButton'
import CelebrationAnimation from '../components/CelebrationAnimation'
import { useReflectiveMode } from '../lib/reflectiveMode'

export type DelayedRecallProps = {
  level: number
}

const WORD_POOL = [
  'Apple', 'River', 'Chair', 'Piano', 'Garden', 'Bicycle', 'Lantern', 'Pillow',
  'Turtle', 'Umbrella', 'Compass', 'Blanket', 'Whistle', 'Harbor', 'Feather',
  'Pencil', 'Mirror', 'Basket', 'Rocket', 'Candle', 'Kettle', 'Ribbon',
  'Anchor', 'Meadow', 'Violin', 'Bracelet', 'Volcano', 'Sandal', 'Trumpet', 'Lighthouse'
]

const DECOY_POOL = [
  'Window', 'Ladder', 'Cushion', 'Marble', 'Sailboat', 'Whisker', 'Thimble',
  'Buckle', 'Cabinet', 'Firefly', 'Goblet', 'Hammock', 'Icicle', 'Jacket',
  'Kayak', 'Locket', 'Nutmeg', 'Orchard', 'Puzzle', 'Quiver', 'Sparrow',
  'Tunnel', 'Velvet', 'Wagon', 'Yarn', 'Zipper'
]

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function itemCountForLevel(level: number): number {
  return Math.min(4 + Math.floor(level / 2), 10)
}

type Phase = 'study' | 'distractor' | 'recall' | 'done'

const DelayedRecall = ({ level }: DelayedRecallProps): JSX.Element => {
  const [reflectiveMode] = useReflectiveMode()

  const itemCount = useMemo(() => itemCountForLevel(level), [level])
  const [items, setItems] = useState<string[]>([])
  const [recallPool, setRecallPool] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [phase, setPhase] = useState<Phase>('study')
  const [completed, setCompleted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const saved = useRef(false)

  const studySeconds = useMemo(() => Math.max(5, Math.round(itemCount * 1.5)) + (reflectiveMode ? 3 : 0), [itemCount, reflectiveMode])
  const distractorSeconds = useMemo(() => {
    const base = Math.min(60, Math.max(30, 30 + level * 2))
    return reflectiveMode ? Math.max(30, base - 10) : base
  }, [level, reflectiveMode])

  const [studyTimeLeft, setStudyTimeLeft] = useState(studySeconds)
  const [distractorTimeLeft, setDistractorTimeLeft] = useState(distractorSeconds)
  const [dotCount, setDotCount] = useState(0)
  const [dotAnswer, setDotAnswer] = useState('')
  const [dotFeedback, setDotFeedback] = useState<string | null>(null)

  const setupRound = (): void => {
    const chosenItems = shuffle(WORD_POOL).slice(0, itemCount)
    const decoys = shuffle(DECOY_POOL).slice(0, itemCount)
    setItems(chosenItems)
    setRecallPool(shuffle([...chosenItems, ...decoys]))
    setSelected(new Set())
    setPhase('study')
    setCompleted(false)
    setScore(null)
    saved.current = false
    setStudyTimeLeft(studySeconds)
    setDistractorTimeLeft(distractorSeconds)
    setDotCount(Math.floor(Math.random() * 11) + 5)
    setDotAnswer('')
    setDotFeedback(null)
  }

  useEffect(() => {
    setupRound()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, itemCount])

  // Study phase countdown
  useEffect(() => {
    if (phase !== 'study') return
    if (studyTimeLeft <= 0) {
      setPhase('distractor')
      return
    }
    const id = setTimeout(() => setStudyTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, studyTimeLeft])

  // Distractor phase countdown — unrelated mini attention task, never scored
  // against the player; it exists purely to create a delay before recall.
  useEffect(() => {
    if (phase !== 'distractor') return
    if (distractorTimeLeft <= 0) {
      setPhase('recall')
      return
    }
    const id = setTimeout(() => setDistractorTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, distractorTimeLeft])

  const submitDotCount = (): void => {
    const guess = Number(dotAnswer)
    setDotFeedback(guess === dotCount ? 'Nice counting!' : `It was ${dotCount} — good try!`)
    setDotCount(Math.floor(Math.random() * 11) + 5)
    setDotAnswer('')
  }

  const toggleSelected = (word: string): void => {
    if (phase !== 'recall') return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(word)) next.delete(word)
      else next.add(word)
      return next
    })
  }

  const submitRecall = (): void => {
    if (phase !== 'recall' || saved.current) return
    const correct = items.filter((w) => selected.has(w)).length
    const accuracy = Math.round((correct / items.length) * 100)
    setScore(accuracy)
    setPhase('done')
    setCompleted(true)
    saved.current = true
    markGameCompletedLevel('delayed-recall', level, accuracy, 100)
  }

  return (
    <>
      <CelebrationAnimation show={completed} />
      <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-teal-700 dark:text-teal-300 flex items-center justify-center gap-3">
            🧠 Delayed Recall
            <span className="text-2xl bg-teal-100 dark:bg-teal-900 px-4 py-1 rounded-full">Level {level}</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">
            Study the words, do a short activity, then recall as many as you can — no rush.
          </p>
          {reflectiveMode && (
            <p className="text-sm text-teal-600 dark:text-teal-400 mt-1">Reflective Mode is on — extra study time, gentler pacing.</p>
          )}
        </div>

        {phase === 'study' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border-4 border-teal-200 dark:border-teal-800 p-8">
            <p className="text-center text-slate-500 dark:text-slate-400 mb-4">Remember these words — {studyTimeLeft}s left</p>
            <div className="flex flex-wrap justify-center gap-3">
              {items.map((word) => (
                <span key={word} className="px-5 py-3 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xl font-bold rounded-xl shadow">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {phase === 'distractor' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border-4 border-cyan-200 dark:border-cyan-800 p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-2">Quick activity while we wait — {distractorTimeLeft}s left</p>
            <p className="text-slate-700 dark:text-slate-200 font-semibold mb-4">How many dots do you see?</p>
            <div className="flex flex-wrap justify-center gap-2 mb-4 max-w-md mx-auto">
              {Array.from({ length: dotCount }, (_, i) => (
                <span key={i} className="w-4 h-4 rounded-full bg-cyan-500 inline-block" />
              ))}
            </div>
            <div className="flex items-center justify-center gap-3">
              <input
                type="number"
                value={dotAnswer}
                onChange={(e) => setDotAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitDotCount()}
                className="w-24 text-center text-xl font-bold border-2 border-cyan-300 rounded-lg p-2 dark:bg-slate-800 dark:text-slate-100"
                placeholder="?"
              />
              <button
                onClick={submitDotCount}
                className="px-4 py-2 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Check
              </button>
            </div>
            {dotFeedback && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{dotFeedback}</p>}
            <p className="mt-4 text-xs text-slate-400">This part isn't scored — it's just a short pause before recall.</p>
          </div>
        )}

        {(phase === 'recall' || phase === 'done') && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border-4 border-blue-200 dark:border-blue-800 p-8">
            <p className="text-center text-slate-600 dark:text-slate-300 mb-4 font-semibold">
              Which of these words were on the original list? Take your time.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {recallPool.map((word) => {
                const isSelected = selected.has(word)
                return (
                  <button
                    key={word}
                    onClick={() => toggleSelected(word)}
                    disabled={phase === 'done'}
                    className={`px-5 py-3 text-lg font-semibold rounded-xl shadow transition-all border-2 ${
                      isSelected
                        ? 'bg-blue-500 text-white border-blue-600 scale-105'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                    } disabled:cursor-not-allowed`}
                  >
                    {word}
                  </button>
                )
              })}
            </div>
            {phase === 'recall' && (
              <div className="flex justify-center">
                <button
                  onClick={submitRecall}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  ✓ Submit Recall
                </button>
              </div>
            )}
          </div>
        )}

        {completed && score !== null && (
          <div className="mt-6 p-6 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-950 dark:to-green-950 text-emerald-800 dark:text-emerald-200 rounded-xl shadow-lg border-4 border-emerald-300 dark:border-emerald-800">
            <div className="text-2xl font-bold text-center mb-2">You recalled {Math.round((score / 100) * items.length)} of {items.length} words 🎉</div>
            <p className="text-center text-sm mb-4">Everyone's memory has good days and quieter ones — nice work either way.</p>
            <div className="flex justify-center">
              <NextLevelButton currentLevel={level} gameId="delayed-recall" />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default DelayedRecall
