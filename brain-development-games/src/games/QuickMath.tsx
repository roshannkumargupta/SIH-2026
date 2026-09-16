import React, { useEffect, useState, useRef } from 'react'
import { markGameCompletedLevel } from '../lib/progress'
import NextLevelButton from '../components/NextLevelButton'
import CelebrationAnimation from '../components/CelebrationAnimation'
import GentleFeedback from '../components/GentleFeedback'
import { getWrongAnswerMessage } from '../lib/gentleFeedback'
import { useReflectiveMode, getEffectiveTimer } from '../lib/reflectiveMode'

export type QuickMathProps = {
  level: number
}

type Problem = { text: string; answer: number }

const generateProblem = (level: number): Problem => {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  if (level <= 1) return { text: `${a} + ${b}`, answer: a + b }
  if (level <= 3) return Math.random() > 0.5 ? { text: `${a} + ${b}`, answer: a + b } : { text: `${a} - ${b}`, answer: a - b }
  if (level <= 4) return { text: `${a} * ${b}`, answer: a * b }
  if (level <= 7) return { text: `${a} + ${b}`, answer: a + b }
  // level 8: two-step
  if (level === 8) return { text: `(${a} + ${b}) * 2`, answer: (a + b) * 2 }
  // levels 9-10: quick operations with timer
  return { text: `${a} * ${b}`, answer: a * b }
}

const QuickMath = ({ level }: QuickMathProps): JSX.Element => {
  const [reflectiveMode] = useReflectiveMode()
  // Hard countdown only ever applies at level 9+, and only when Reflective
  // Mode is off. When on, this becomes untimed — reactionTime is still
  // recorded below for analytics, it just never penalizes the player.
  const baseTimer = level >= 9 ? 2000 : null
  const effectiveTimer = getEffectiveTimer(baseTimer)

  const [problem, setProblem] = useState<Problem>(() => generateProblem(level))
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(effectiveTimer)
  const [completed, setCompleted] = useState(false)
  const [consecutiveMisses, setConsecutiveMisses] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [problemStartedAt, setProblemStartedAt] = useState<number>(() => Date.now())
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const saved = useRef(false)
  const target = Math.max(3, Math.ceil(level / 2))

  useEffect(() => {
    setProblem(generateProblem(level))
    setInput('')
    setScore(0)
    setTimeLeft(effectiveTimer)
    setCompleted(false)
    setConsecutiveMisses(0)
    setFeedback(null)
    setReactionTimes([])
    setProblemStartedAt(Date.now())
    saved.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, reflectiveMode])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) return
    const id = setInterval(() => setTimeLeft((t) => (t === null ? null : t - 100)), 100)
    return () => clearInterval(id)
  }, [timeLeft])

  const submit = (): void => {
    if (completed) return // Don't allow submissions after completion

    const val = Number(input)
    const isCorrect = val === problem.answer
    const rt = Date.now() - problemStartedAt
    const nextReactionTimes = [...reactionTimes, rt]
    setReactionTimes(nextReactionTimes)

    // Non-punitive: a wrong answer simply doesn't increment the score. It
    // never goes backward, so streaks/confidence aren't undermined.
    const newScore = isCorrect ? score + 1 : score
    if (isCorrect) {
      setScore(newScore)
      setConsecutiveMisses(0)
      setFeedback(null)
    } else {
      const nextMisses = consecutiveMisses + 1
      setConsecutiveMisses(nextMisses)
      setFeedback(getWrongAnswerMessage(nextMisses))
    }

    // Check if target reached
    if (isCorrect && !saved.current && newScore >= target) {
      const percentageScore = Math.min(100, Math.round((newScore / target) * 100))
      markGameCompletedLevel('quick-math', level, percentageScore, 100)
      saved.current = true
      setCompleted(true)
      return // Stop here, don't generate new problem
    }

    // Only generate new problem if not completed
    setProblem(generateProblem(level))
    setInput('')
    setProblemStartedAt(Date.now())
    if (effectiveTimer !== null) setTimeLeft(effectiveTimer)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit()
    }
  }

  return (
    <>
      <CelebrationAnimation show={completed} />
      <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-orange-700 flex items-center justify-center gap-3">
            🧮 Quick Math Challenge
            <span className="text-2xl bg-orange-100 px-4 py-1 rounded-full">Level {level}</span>
          </h2>
          <p className="text-lg text-slate-600 mt-2">Solve as fast as you can! ⚡</p>
          {reflectiveMode && baseTimer !== null && (
            <p className="text-sm text-teal-600 mt-1">Reflective Mode is on — no countdown, take your time.</p>
          )}
        </div>

        <div className="mb-8 p-12 bg-white rounded-2xl shadow-lg border-4 border-orange-200">
          <div className="text-7xl font-black text-center text-orange-600 mb-4">
            {problem.text} = ?
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-center mb-6">
          <input
            className="text-2xl sm:text-4xl font-bold text-center border-4 border-blue-400 p-3 sm:p-4 rounded-xl w-full sm:w-48 focus:ring-4 focus:ring-blue-300 focus:outline-none shadow-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="?"
            autoFocus
            disabled={completed}
          />
          <button
            onClick={submit}
            disabled={completed}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-400 to-green-500 text-white text-xl sm:text-2xl font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            ✓ Submit
          </button>
        </div>

        {timeLeft !== null && (
          <div className="mb-6 text-center">
            <div className="inline-block bg-red-100 px-8 py-4 rounded-xl shadow-md border-2 border-red-300">
              <span className="text-2xl font-bold text-red-700">⏱️ Time: </span>
              <span className="text-4xl font-black text-red-600">{(timeLeft / 1000).toFixed(2)}s</span>
            </div>
          </div>
        )}

        <div className="text-center mb-2">
          <div className="inline-block bg-white px-8 py-4 rounded-xl shadow-md">
            <span className="text-2xl font-bold text-blue-700">Score: </span>
            <span className="text-4xl font-black text-green-600">{score}</span>
            <span className="text-2xl font-bold text-slate-500"> / {target}</span>
          </div>
        </div>

        {feedback && !completed && (
          <p className="text-center text-slate-500 mb-4">{feedback}</p>
        )}

        <GentleFeedback
          consecutiveMisses={consecutiveMisses}
          onDismiss={() => setConsecutiveMisses(0)}
        />

        {completed && (
          <div className="mt-6 p-6 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 rounded-xl shadow-lg border-4 border-emerald-300">
            <div className="text-3xl font-bold text-center mb-4">🎉 Brilliant! Level {level} completed! 🎉</div>
            <div className="flex justify-center">
              <NextLevelButton currentLevel={level} gameId="quick-math" />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default QuickMath
