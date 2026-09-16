import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
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
      const newScore = score + 1;
      setScore(newScore);
      setFeedback("✓ Correct!");
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
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
      } else {
        setTimeout(() => {
          setProblem(generateProblem(level));
          setInput("");
          setFeedback(null);
        }, 700);
      }
    } else {
      setFeedback(`✗ Answer was ${problem.answer}`);
      setTimeout(() => {
        setProblem(generateProblem(level));
        setInput("");
        setFeedback(null);
      }, 1200);
    }
  };

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((score / target) * 100))}
          accuracy={Math.min(100, Math.round((score / target) * 100))}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
          gameName="Quick Math"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            setProblem(generateProblem(level));
            setInput("");
            sessionStart.current = Date.now();
          }}
        />
      </>
    );

  return (
    <div className="space-y-6 text-center">
      <div>
        <p className="text-cream/50 text-xs uppercase font-bold mb-2">
          Score: {score}/{target}
        </p>
        <div className="mx-auto inline-block rounded-2xl border-4 border-sun bg-ink px-10 py-6 shadow-card">
          <span className="font-display text-5xl sm:text-6xl font-black text-sun">
            {problem.text} = ?
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="w-36 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-3xl font-bold py-3 focus:border-sun focus:outline-none"
          placeholder="?"
          autoFocus
        />
        <button
          onClick={submit}
          className="px-8 py-3 rounded-xl bg-sun text-ink font-extrabold text-lg hover:opacity-90 transition shadow"
        >
          Submit
        </button>
        {feedback && (
          <p
            className={`text-sm font-bold ${feedback.startsWith("✓") ? "text-tea-confirm" : "text-fire"}`}
          >
            {feedback}
          </p>
        )}
      </div>
    </div>
  );
}
