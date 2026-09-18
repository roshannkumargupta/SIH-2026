import { useEffect, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

export type StroopProps = { level: number };

const ALL_COLORS = ["Red", "Blue", "Green", "Yellow"];

const COLOR_HEX: Record<string, string> = {
  red: "#e63946",
  blue: "#457b9d",
  green: "#52b788",
  yellow: "#e9c46a",
};
const BTN_STYLE: Record<string, string> = {
  Red: "bg-red-500 hover:bg-red-600",
  Blue: "bg-blue-500 hover:bg-blue-600",
  Green: "bg-green-500 hover:bg-green-600",
  Yellow: "bg-yellow-400 hover:bg-yellow-500",
};

export default function Stroop({ level }: StroopProps) {
  const [word, setWord] = useState({ text: "RED", color: "red" });
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const startTime = useRef(Date.now());
  const target = Math.max(3, level * 2);
  const { submitResult } = useGameSession();

  const speed = level <= 1 ? 3000 : level <= 3 ? 2000 : level <= 5 ? 1500 : level <= 7 ? 1000 : 700;

  useEffect(() => {
    setCompleted(false);
    setScore(0);
    setFeedback(null);
    saved.current = false;
    startTime.current = Date.now();
  }, [level]);

  useEffect(() => {
    const t = setInterval(() => {
      const color = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]!.toLowerCase();
      const text = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]!.toUpperCase();
      setWord({ text, color });
    }, speed);
    return () => clearInterval(t);
  }, [speed]);

  const press = (color: string) => {
    if (color.toLowerCase() === word.color) {
      setScore((s) => {
        const next = s + 1;
        if (!saved.current && next >= target) {
          saved.current = true;
          const acc = Math.min(100, Math.round((next / target) * 100));
          const dur = Math.round((Date.now() - startTime.current) / 1000);
          submitResult({
            gameId: "stroop",
            gameType: "stroop",
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
        }
        return next;
      });
      setFeedback("✓ Correct!");
    } else {
      setFeedback("Focus on the ink color, not the word.");
    }
    setTimeout(() => setFeedback(null), 900);
  };

  const finalAccuracy = Math.min(100, Math.round((score / target) * 100));
  const finalDuration = Math.round((Date.now() - startTime.current) / 1000);

  const resetGame = () => {
    setCompleted(false);
    saved.current = false;
    setScore(0);
    setSynced(false);
    setOffline(false);
    startTime.current = Date.now();
  };

  return (
    <GameShell
      gameId="stroop"
      level={level}
      score={score}
      targetScore={target}
      feedback={feedback}
      instructionHint="Click the COLOR of the ink — ignore what the word says!"
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
      <div className="space-y-8">
        <div className="text-center">
          <div className="mx-auto rounded-2xl border-4 border-clay bg-ink p-8 inline-block shadow-card">
            <span
              className="font-display text-6xl sm:text-7xl font-black"
              style={{ color: COLOR_HEX[word.color] ?? "#fff" }}
            >
              {word.text}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {ALL_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => press(c)}
              className={`px-8 py-4 min-h-[48px] min-w-[48px] rounded-xl text-white text-lg font-extrabold shadow-md transition-all touch-manipulation select-none hover:scale-105 active:scale-95 ${BTN_STYLE[c]}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
