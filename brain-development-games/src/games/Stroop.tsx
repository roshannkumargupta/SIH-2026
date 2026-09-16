import React, { useEffect, useState, useRef } from 'react'
import { markGameCompletedLevel } from '../lib/progress'
import NextLevelButton from '../components/NextLevelButton'
import CelebrationAnimation from '../components/CelebrationAnimation'
import GentleFeedback from '../components/GentleFeedback'
import { getWrongAnswerMessage } from '../lib/gentleFeedback'
import { useReflectiveMode } from '../lib/reflectiveMode'

export type StroopProps = {
  level: number
}

const COLORS = ['Red', 'Blue', 'Green', 'Yellow']
// Slowest, most forgiving auto-advance speed — used as a floor whenever
// Reflective Mode is on, regardless of level, so the word never cycles
// away from the player faster than they can comfortably respond.
const REFLECTIVE_MODE_MAX_SPEED = 3000

const Stroop = ({ level }: StroopProps): JSX.Element => {
  const [reflectiveMode] = useReflectiveMode()
  const [word, setWord] = useState({ text: 'RED', color: 'red' })
  const [speed, setSpeed] = useState(2000)
  const [score, setScore] = useState(0)
  const [swapButtons, setSwapButtons] = useState(false)
  const [consecutiveMisses, setConsecutiveMisses] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    // level-based modifications — Reflective Mode floors the speed at the
    // slowest setting so the "timer" driving word changes never punishes a
    // slower response the way a hard countdown would.
    let levelSpeed: number
    if (level <= 1) levelSpeed = 3000
    else if (level <= 3) levelSpeed = 2000
    else if (level <= 5) levelSpeed = 1500
    else if (level <= 7) levelSpeed = 1000
    else levelSpeed = 700

    setSpeed(reflectiveMode ? Math.max(levelSpeed, REFLECTIVE_MODE_MAX_SPEED) : levelSpeed)

    // Button-order swapping is a mild cognitive-flexibility challenge at
    // higher levels; skip it in Reflective Mode to keep the interface
    // predictable for elderly/memory-impaired users.
    setSwapButtons(!reflectiveMode && level >= 5)
  }, [level, reflectiveMode])

  useEffect(() => {
    const t = setInterval(() => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const text = COLORS[Math.floor(Math.random() * COLORS.length)].toUpperCase()
      setWord({ text, color: color.toLowerCase() })
    }, speed)
    return () => clearInterval(t)
  }, [speed])

  const saved = useRef(false)
  const [completed, setCompleted] = useState(false)
  const target = Math.max(3, level * 2)

  // Reset state when level changes
  useEffect(() => {
    setCompleted(false)
    setScore(0)
    setConsecutiveMisses(0)
    setFeedback(null)
    saved.current = false
  }, [level])

  const press = (color: string): void => {
    const isCorrect = color.toLowerCase() === word.color
    // Non-punitive: a wrong answer never reduces score, it simply doesn't
    // increment it. Score can only go up or stay the same.
    if (isCorrect) {
      setScore((s) => s + 1)
      setConsecutiveMisses(0)
      setFeedback(null)
    } else {
      setConsecutiveMisses((m) => {
        const next = m + 1
        setFeedback(getWrongAnswerMessage(next))
        return next
      })
    }
    // swap buttons if level 5+ and Reflective Mode is off (simple approach)
    if (swapButtons) {
      // trivial: randomize button order by shuffling COLORS copy
      const idx = Math.floor(Math.random() * 4)
      const c = COLORS.splice(idx, 1)[0]
      COLORS.push(c)
    }
  }

  useEffect(() => {
    if (!saved.current && score >= target) {
      const percentageScore = Math.min(100, Math.round((score / target) * 100))
      markGameCompletedLevel('stroop', level, percentageScore, 100)
      saved.current = true
      setCompleted(true)
    }
  }, [score, level, target])

  const colorButtonStyles: Record<string, string> = {
    Red: 'bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600',
    Blue: 'bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600',
    Green: 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600',
    Yellow: 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600'
  }

  return (
    <>
      <CelebrationAnimation show={completed} />
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-indigo-700 flex items-center justify-center gap-3">
            🎨 Color Challenge
            <span className="text-2xl bg-indigo-100 px-4 py-1 rounded-full">Level {level}</span>
          </h2>
          <p className="text-lg text-slate-600 mt-2">Click the COLOR of the word, not what it says! 🧠</p>
          {reflectiveMode && (
            <p className="text-sm text-teal-600 mt-1">Reflective Mode is on — words change at a gentler, steady pace.</p>
          )}
        </div>

        <div className="mb-8 p-8 bg-white rounded-2xl shadow-lg border-4 border-indigo-200">
          <div className="text-7xl font-black text-center animate-pulse" style={{ color: word.color, textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
            {word.text}
          </div>
        </div>

        <div className="flex gap-4 mb-6 justify-center flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => press(c)}
              className={`px-8 py-4 ${colorButtonStyles[c]} text-white text-xl font-bold rounded-xl shadow-lg transform hover:scale-110 transition-all duration-200`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="text-center mb-2">
          <div className="inline-block bg-white px-8 py-4 rounded-xl shadow-md">
            <span className="text-2xl font-bold text-indigo-700">Score: </span>
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
            <div className="text-3xl font-bold text-center mb-4">🎉 Fantastic! Level {level} completed! 🎉</div>
            <div className="flex justify-center">
              <NextLevelButton currentLevel={level} gameId="stroop" />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Stroop
