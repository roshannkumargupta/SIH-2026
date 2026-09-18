import { useEffect, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

type Problem = { text: string; answer: number };

const generateProblem = (level: number): Problem => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  if (level <= 1) return { text: `${a} + ${b}`, answer: a + b };
  if (level <= 3)
    return Math.random() > 0.5
      ? { text: `${a} + ${b}`, answer: a + b }
      : { text: `${a} - ${b}`, answer: a - b };
  if (level <= 7) return { text: `${a} × ${b}`, answer: a * b };
  if (level === 8) return { text: `(${a} + ${b}) × 2`, answer: (a + b) * 2 };
  return { text: `${a} × ${b}`, answer: a * b };
};

export default function QuickMath({ level }: { level: number }) {
  const [problem, setProblem] = useState<Problem>(() => generateProblem(level));
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(level / 2));
  const { submitResult } = useGameSession();

  useEffect(() => {
    setProblem(generateProblem(level));
    setInput("");
    setScore(0);
    setFeedback(null);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  }, [level]);

  const submit = () => {
    const val = parseInt(input, 10);
    if (isNaN(val)) {
      setFeedback("Enter a number");
      return;
    }

    if (val === problem.answer) {
      const nextScore = score + 1;
      setScore(nextScore);
      setFeedback("✓ Correct!");

      if (nextScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((nextScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "quick-math",
          gameType: "quick_math",
          score: acc,
          accuracy: acc,
          durationSeconds: Math.max(5, dur),
          level,
          difficulty: String(level),
        }).then((r) => {
          setSynced(r.success);
          setOffline(r.offline);
          setCompleted(true);
        });
        return;
      }
      setTimeout(() => {
        setProblem(generateProblem(level));
        setInput("");
        setFeedback(null);
      }, 800);
    } else {
      setFeedback(`✗ Answer was ${problem.answer}`);
      setTimeout(() => {
        setProblem(generateProblem(level));
        setInput("");
        setFeedback(null);
      }, 1200);
    }
  };

  const finalAccuracy = Math.min(100, Math.round((score / target) * 100));
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);

  const resetGame = () => {
    setCompleted(false);
    setScore(0);
    saved.current = false;
    setSynced(false);
    setOffline(false);
    setProblem(generateProblem(level));
    setInput("");
    sessionStart.current = Date.now();
  };

  return (
    <GameShell
      gameId="quick-math"
      level={level}
      score={score}
      targetScore={target}
      feedback={feedback}
      instructionHint="Calculate the result as fast as you can"
      completed={completed}
      results={{
        score: finalAccuracy,
        accuracy: finalAccuracy,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={resetGame}
    >
      <div className="space-y-8 text-center max-w-md mx-auto">
        <div className="mx-auto inline-block rounded-3xl border-4 border-sun/60 bg-ink px-10 py-7 shadow-card">
          <span className="font-display text-5xl sm:text-6xl font-black text-sun">
            {problem.text} = ?
          </span>
        </div>

        <div className="flex flex-col items-center gap-3.5">
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            className="w-40 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-4xl font-bold py-3 focus:border-sun focus:outline-none min-h-[48px]"
            placeholder="?"
            autoFocus
          />
          <button
            type="button"
            onClick={submit}
            className="px-8 py-3.5 min-h-[48px] min-w-[48px] rounded-xl bg-sun text-ink font-black text-lg hover:opacity-90 active:scale-95 active:opacity-90 transition shadow-md touch-manipulation flex items-center justify-center"
          >
            Submit Answer
          </button>
        </div>
      </div>
    </GameShell>
  );
}
