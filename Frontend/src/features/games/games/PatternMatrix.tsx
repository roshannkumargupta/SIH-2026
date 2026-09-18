import { useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

const gridSize = (l: number) => (l <= 1 ? 3 : l <= 4 ? 5 : 8);

export default function PatternMatrix({ level }: { level: number }) {
  const size = useMemo(() => gridSize(level), [level]);
  const total = size * size;
  const [pattern, setPattern] = useState<number[]>([]);
  const [attempt, setAttempt] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<"show" | "recreate" | "done">("show");
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(level / 2));
  const { submitResult } = useGameSession();

  const generateNewPattern = () => {
    const k = Math.min(3 + Math.floor(level / 2), Math.floor(total / 2));
    const indices = new Set<number>();
    while (indices.size < k) indices.add(Math.floor(Math.random() * total));
    setPattern(Array.from(indices));
    setPhase("show");
    setAttempt(new Set());
    setTimeout(() => setPhase("recreate"), Math.max(800, 1200 - level * 80));
  };

  useEffect(() => {
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    generateNewPattern();
  }, [level, total]);

  const toggle = (idx: number) => {
    if (phase !== "recreate") return;
    setAttempt((prev) => {
      const updated = new Set(prev);
      if (updated.has(idx)) {
        updated.delete(idx);
      } else {
        updated.add(idx);
      }
      return updated;
    });
  };

  const checkAnswer = () => {
    const correct = pattern.filter((p) => attempt.has(p)).length;
    const wrong = [...attempt].filter((a) => !pattern.includes(a)).length;
    const acc = Math.max(0, Math.round(((correct - wrong) / pattern.length) * 100));
    if (acc >= 70) {
      const newScore = score + 1;
      setScore(newScore);
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "pattern-matrix",
          gameType: "pattern_matrix",
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
    }
    setTimeout(generateNewPattern, 800);
  };

  const finalAccuracy = Math.min(100, Math.round((score / target) * 100));
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);

  const resetGame = () => {
    setCompleted(false);
    setScore(0);
    saved.current = false;
    setSynced(false);
    setOffline(false);
    sessionStart.current = Date.now();
    generateNewPattern();
  };

  return (
    <GameShell
      gameId="pattern-matrix"
      level={level}
      score={score}
      targetScore={target}
      stats={[
        {
          label: "Phase",
          value: phase === "show" ? "Memorise Pattern" : "Recreate Pattern",
          highlight: phase === "recreate" ? "tea" : "sun",
        },
      ]}
      instructionHint={
        phase === "show"
          ? "Memorise the highlighted pattern before it disappears"
          : "Tap cells to recreate the pattern, then tap Submit"
      }
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
      <div className="space-y-6 flex flex-col items-center">
        <div
          className="grid gap-2 overflow-x-auto p-2 rounded-2xl border-2 border-clay bg-ink/50 shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(44px, 1fr))`,
            maxWidth: "380px",
            width: "100%",
          }}
        >
          {Array.from({ length: total }).map((_, idx) => {
            const isPattern = pattern.includes(idx);
            const isSelected = attempt.has(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggle(idx)}
                className={`aspect-square min-w-[44px] min-h-[44px] rounded-xl border-2 transition-all duration-200 touch-manipulation select-none active:scale-90 shadow-sm
                  ${phase === "show" && isPattern ? "bg-sun border-sun scale-95 shadow-md" : ""}
                  ${phase === "recreate" && isSelected ? "bg-sun border-sun shadow-md" : ""}
                  ${phase === "recreate" && !isSelected ? "bg-ink/70 border-clay hover:border-sun/50 active:bg-sun/30" : ""}
                  ${phase === "show" && !isPattern ? "bg-ink/70 border-clay" : ""}`}
                disabled={phase !== "recreate"}
                aria-label={`Cell ${idx + 1}`}
              />
            );
          })}
        </div>

        {phase === "recreate" && (
          <button
            type="button"
            onClick={checkAnswer}
            className="px-8 py-3.5 min-h-[48px] min-w-[48px] rounded-xl bg-sun text-ink font-black text-base hover:opacity-90 active:scale-95 active:opacity-90 transition shadow-md touch-manipulation flex items-center justify-center gap-2"
          >
            ✓ Submit Pattern
          </button>
        )}
      </div>
    </GameShell>
  );
}
