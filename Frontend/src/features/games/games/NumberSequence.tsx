import { useEffect, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

type Sequence = { numbers: number[]; answer: number; type: string };

const generateSequence = (level: number): Sequence => {
  if (level <= 2) {
    const s = Math.floor(Math.random() * 10) + 1,
      d = Math.floor(Math.random() * 5) + 1;
    return { numbers: [s, s + d, s + d * 2, s + d * 3], answer: s + d * 4, type: "arithmetic" };
  }
  if (level <= 4) {
    const s = Math.floor(Math.random() * 3) + 2,
      r = Math.floor(Math.random() * 2) + 2;
    return {
      numbers: [s, s * r, s * r * r, s * r * r * r],
      answer: s * Math.pow(r, 4),
      type: "geometric",
    };
  }
  if (level <= 6) {
    const a = Math.floor(Math.random() * 5) + 1,
      b = Math.floor(Math.random() * 5) + 1;
    return {
      numbers: [a, b, a + b, a + 2 * b, 2 * a + 3 * b],
      answer: 3 * a + 5 * b,
      type: "fibonacci",
    };
  }
  const base = Math.floor(Math.random() * 5) + 2;
  return {
    numbers: [base, base * 2, base * 2 + 1, base * 4 + 1, base * 4 + 2],
    answer: base * 8 + 2,
    type: "complex",
  };
};

export default function NumberSequence({ level }: { level: number }) {
  const [seq, setSeq] = useState<Sequence>(() => generateSequence(level));
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(level * 1.5));
  const { submitResult } = useGameSession();

  useEffect(() => {
    setSeq(generateSequence(level));
    setInput("");
    setScore(0);
    setFeedback("");
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  }, [level]);

  const handleSubmit = () => {
    const val = parseInt(input, 10);
    if (isNaN(val)) return;

    if (val === seq.answer) {
      const newScore = score + 1;
      setScore(newScore);
      setFeedback("✓ Correct!");

      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "number-sequence",
          gameType: "number_sequence",
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
        setSeq(generateSequence(level));
        setInput("");
        setFeedback("");
      }, 800);
    } else {
      setFeedback(`✗ Answer was ${seq.answer}`);
      setTimeout(() => {
        setSeq(generateSequence(level));
        setInput("");
        setFeedback("");
      }, 1500);
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
    setSeq(generateSequence(level));
    setInput("");
    sessionStart.current = Date.now();
  };

  return (
    <GameShell
      gameId="number-sequence"
      level={level}
      score={score}
      targetScore={target}
      feedback={feedback}
      instructionHint="Study the sequence and enter the next number"
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
      <div className="space-y-8 text-center max-w-xl mx-auto">
        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap p-3">
          {seq.numbers.map((n, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-3">
              <span className="px-5 py-3.5 rounded-2xl bg-sun/15 border-2 border-sun/40 font-display text-2xl sm:text-3xl font-black text-sun shadow-sm">
                {n}
              </span>
              <span className="text-cream/40 font-bold text-xl">→</span>
            </div>
          ))}
          <span className="px-6 py-3.5 rounded-2xl bg-fire/20 border-2 border-fire font-display text-2xl sm:text-3xl font-black text-fire animate-pulse shadow-sm">
            ?
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-2">
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            className="w-36 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-3xl font-bold py-3 px-4 focus:border-sun focus:outline-none min-h-[48px]"
            placeholder="?"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="px-7 py-3 min-h-[48px] min-w-[48px] rounded-xl bg-sun text-ink font-black text-base hover:opacity-90 active:scale-95 active:opacity-90 transition shadow-md touch-manipulation flex items-center justify-center"
          >
            Submit Number
          </button>
        </div>
      </div>
    </GameShell>
  );
}
