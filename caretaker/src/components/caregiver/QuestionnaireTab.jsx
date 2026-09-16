import { useState } from 'react'
import { Check, ArrowRight, ArrowLeft, RefreshCw, Award } from 'lucide-react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { patientData } from '../../mockData/patientData'

const QUESTIONS = [
  {
    id: 'Q1',
    text: 'How comfortable is {name} using a mobile phone or tablet?',
    options: [
      { id: 'Q1_A', label: 'Very comfortable, uses it independently', weight: 3 },
      { id: 'Q1_B', label: 'Uses it with occasional help', weight: 2 },
      { id: 'Q1_C', label: 'Rarely uses one, needs guidance', weight: 1 },
    ],
  },
  {
    id: 'Q2',
    text: 'How would you describe their day-to-day memory for recent things?',
    options: [
      { id: 'Q2_A', label: 'Rarely forgets, manages fine', weight: 3 },
      { id: 'Q2_B', label: 'Sometimes forgets, needs occasional reminders', weight: 2 },
      { id: 'Q2_C', label: 'Forgets often, needs regular reminders/support', weight: 1 },
    ],
  },
  {
    id: 'Q3',
    text: 'How quickly do they usually pick up a new game, puzzle, or activity?',
    options: [
      { id: 'Q3_A', label: 'Picks it up fast, enjoys a challenge', weight: 3 },
      { id: 'Q3_B', label: 'Takes a little time but gets there', weight: 2 },
      { id: 'Q3_C', label: 'Prefers very simple, familiar activities', weight: 1 },
    ],
  },
  {
    id: 'Q4',
    text: 'How do they usually react when something is too difficult or confusing?',
    options: [
      { id: 'Q4_A', label: "Keeps trying, doesn't get frustrated", weight: 3 },
      { id: 'Q4_B', label: 'Gets mildly frustrated but continues', weight: 2 },
      { id: 'Q4_C', label: 'Gets discouraged and stops', weight: 1 },
    ],
  },
]

function getDifficultyFromScore(totalScore) {
  if (totalScore >= 10) return { difficulty: 'medium', note: null }
  if (totalScore >= 7) return { difficulty: 'easy', note: null }
  return { difficulty: 'easy', note: 'flag_extra_simplified_content' }
}

export function QuestionnaireTab({ onComplete }) {
  const [saved, setSaved] = useState(() => {
    const raw = localStorage.getItem('nermemorycare_onboarding')
    return raw ? JSON.parse(raw) : null
  })
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})

  const patientFirstName = (patientData?.name || 'the patient').split(' ')[0]

  // ─────────────────────────────────
  // VIEW MODE — already filled
  // ─────────────────────────────────
  if (saved) {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sun/20 text-ink flex items-center justify-center">
                <Award className="w-5 h-5 text-ink" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink">Questionnaire Completed</h3>
                <p className="text-xs text-ink/60">
                  Completed on {new Date(saved.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <Badge variant={saved.initialDifficulty === 'medium' ? 'warning' : 'success'}>
              {saved.initialDifficulty === 'medium' ? 'Medium Level' : 'Easy Level'}
            </Badge>
          </div>

          <div className="bg-cream/60 rounded-xl p-5 border border-clay/40 mb-5">
            <p className="text-xs text-ink/60 font-medium mb-1">Total Assessment Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-fire">{saved.totalScore}</span>
              <span className="text-sm font-semibold text-ink/60">/ 12</span>
            </div>
            <p className="text-xs text-ink/70 mt-2">
              Assigned Level: <span className="font-semibold capitalize text-ink">{saved.initialDifficulty}</span>
            </p>
          </div>

          <div className="space-y-3.5">
            {QUESTIONS.map((q, idx) => {
              const answer = saved.answers?.find((a) => a.questionId === q.id)
              const selectedOption = q.options.find((o) => o.id === answer?.selectedOptionId)
              return (
                <div key={q.id} className="bg-surface rounded-xl p-4 border border-clay/40 shadow-sm">
                  <p className="text-xs text-ink/60 font-semibold mb-1">Question {idx + 1} of 4</p>
                  <p className="text-sm text-ink font-medium mb-2.5">
                    {q.text.replace('{name}', patientFirstName)}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-fire bg-fire/10 p-2.5 rounded-lg border border-fire/20">
                    <Check className="w-4 h-4 text-fire flex-shrink-0" />
                    <span>{selectedOption?.label || 'Option recorded'}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {saved.note && (
            <div className="bg-sun/15 border border-sun/40 rounded-xl p-4 mt-5">
              <p className="text-xs text-ink font-medium">
                ⚠️ Note: This patient has been flagged for extra-simplified content to maximize comfort and engagement.
              </p>
            </div>
          )}
        </Card>

        <Button
          variant="secondary"
          onClick={() => {
            localStorage.removeItem('nermemorycare_onboarding')
            setSaved(null)
            setCurrentQ(0)
            setAnswers({})
          }}
          className="w-full flex items-center justify-center py-3 min-h-[48px] rounded-xl cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Redo Questionnaire
        </Button>
      </div>
    )
  }

  // ─────────────────────────────────
  // FILL MODE — wizard
  // ─────────────────────────────────
  const question = QUESTIONS[currentQ]
  const totalQuestions = QUESTIONS.length
  const progress = ((currentQ + 1) / totalQuestions) * 100
  const isLast = currentQ === totalQuestions - 1
  const selectedOptionId = answers[question.id]
  const questionText = question.text.replace('{name}', patientFirstName)

  const handleSelect = (optionId) => {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }))
  }

  const handleNext = () => {
    if (!selectedOptionId) return

    if (isLast) {
      const totalScore = QUESTIONS.reduce((sum, q) => {
        const selId = answers[q.id]
        const option = q.options.find((o) => o.id === selId)
        return sum + (option?.weight || 0)
      }, 0)

      const { difficulty, note } = getDifficultyFromScore(totalScore)

      const result = {
        questionnaireId: 'onboarding_difficulty_v1',
        patientId: patientData.id || 'p1',
        answers: QUESTIONS.map((q) => ({
          questionId: q.id,
          selectedOptionId: answers[q.id],
        })),
        totalScore,
        initialDifficulty: difficulty,
        note,
        completedAt: new Date().toISOString(),
        appliesUntil: 'first_game_session_completed',
      }

      localStorage.setItem('nermemorycare_onboarding', JSON.stringify(result))
      setSaved(result)
      if (onComplete) onComplete(result)
    } else {
      setCurrentQ((q) => q + 1)
    }
  }

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ((q) => q - 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-ink">
          Tell us about {patientFirstName}
        </h3>
        <p className="text-xs text-ink/60 mt-1">
          These answers help personalize game difficulty and cognitive support.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-ink/70">
            Question {currentQ + 1} of {totalQuestions}
          </span>
          <span className="text-xs text-fire font-bold">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2.5 bg-clay/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-fire transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card className="shadow-sm">
        <p className="text-base font-semibold text-ink leading-relaxed mb-5">
          {questionText}
        </p>

        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = selectedOptionId === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer min-h-[52px] flex items-center justify-between ${
                  isSelected
                    ? 'border-fire bg-fire/10 shadow-sm'
                    : 'border-clay/40 bg-surface hover:border-fire/50 hover:bg-cream/30'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 pr-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-fire bg-fire text-white' : 'border-clay'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className={`text-sm leading-snug ${isSelected ? 'text-ink font-semibold' : 'text-ink/80'}`}>
                    {option.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="flex gap-4">
        <Button
          variant="secondary"
          onClick={handleBack}
          className="flex-1 min-h-[48px] rounded-xl"
          disabled={currentQ === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 min-h-[48px] rounded-xl font-semibold"
          disabled={!selectedOptionId}
        >
          {isLast ? 'Finish' : 'Continue'}
          {!isLast && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  )
}
