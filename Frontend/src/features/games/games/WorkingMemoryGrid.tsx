import { useEffect, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

const gridSize = (l: number) => (l <= 2 ? 3 : l <= 5 ? 5 : 7);
const itemCount = (l: number) => Math.min(3 + Math.floor(l / 2), 8);

export default function WorkingMemoryGrid({ level }: { level: number }) {
  const size = gridSize(level);
  const count = itemCount(level);
  const [positions, setPositions] = useState<number[]>([]);
  const [phase, setPhase] = useState<"show" | "recall" | "feedback">("show");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(level * 1.5));
  const displayTime = Math.max(2000 - level * 100, 800);
  const { submitResult } = useGameSession();

  const startRound = () => {
    const total = size * size;
    const newPos: number[] = [];
    while (newPos.length < count) {
      const p = Math.floor(Math.random() * total);
      if (!newPos.includes(p)) newPos.push(p);
    }
    setPositions(newPos);
    setPhase("show");
    setSelected(new Set());
    setTimeout(() => setPhase("recall"), displayTime);
  };

  const resetGame = () => {
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    setLastResult(null);
    sessionStart.current = Date.now();
    startRound();
  };

  useEffect(() => {
    resetGame();
  }, [level, size, count]);

  const toggleCell = (idx: number) => {
    if (phase !== "recall") return;
    setSelected((prev) => {
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
    const correct = positions.filter((p) => selected.has(p)).length;
    const wrong = [...selected].filter((s) => !positions.includes(s)).length;
    const perfect = correct === count && wrong === 0;
    setLastResult(perfect ? "correct" : "wrong");
    setPhase("feedback");
    if (perfect) {
      const newScore = score + 1;
      setScore(newScore);
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = 100;
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "working-memory-grid",
          gameType: "working_memory_grid",
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
    setTimeout(startRound, 1000);
  };

  const finalScore = Math.min(100, Math.round((score / target) * 100));
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);

  return (
    <GameShell
      gameId="working-memory-grid"
      level={level}
      score={score}
      targetScore={target}
      stats={[
        {
          label: "Phase",
          value: phase === "show" ? "Memorise" : phase === "recall" ? "Recall" : "Result",
          highlight: phase === "show" ? "sun" : "tea",
        },
        { label: "Selected", value: `${selected.size}/${count}` },
      ]}
      feedback={
        lastResult && phase === "feedback"
          ? lastResult === "correct"
            ? "✓ Excellent memory!"
            : "✗ Missed some squares!"
          : null
      }
      instructionHint={
        phase === "show"
          ? `Memorise the ${count} highlighted tiles before they disappear.`
          : `Tap the ${count} tiles that were highlighted, then tap Submit.`
      }
      completed={completed}
      results={{
        score: finalScore,
        accuracy: 100,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={resetGame}
      onNextLevel={level < 10 ? () => { window.location.href = `/games/working-memory-grid?level=${level + 1}`; } : undefined}
    >
      <div className="flex flex-col items-center space-y-6">
        <div
          className="grid gap-2 p-3 bg-ink/40 rounded-2xl border border-clay"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            maxWidth: "380px",
            width: "100%",
          }}
        >
          {Array.from({ length: size * size }).map((_, idx) => {
            const isActive = positions.includes(idx);
            const isSelected = selected.has(idx);
            const showFeedback = phase === "feedback";
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleCell(idx)}
                disabled={phase !== "recall"}
                className={`aspect-square min-w-[44px] min-h-[44px] rounded-xl border-2 transition-all touch-manipulation select-none cursor-pointer active:scale-95 shadow-sm
                  ${phase === "show" && isActive ? "bg-sun border-sun shadow-lg shadow-sun/30 scale-105" : ""}
                  ${phase === "show" && !isActive ? "bg-ink/60 border-clay" : ""}
                  ${phase === "recall" && isSelected ? "bg-sun/90 border-sun ring-2 ring-sun/40 text-ink" : ""}
                  ${phase === "recall" && !isSelected ? "bg-surface/50 border-clay hover:border-sun/40 hover:bg-surface" : ""}
                  ${showFeedback && isActive ? "bg-tea-confirm/60 border-tea-confirm shadow-lg shadow-tea-confirm/30" : ""}
                  ${showFeedback && !isActive && isSelected ? "bg-fire/40 border-fire" : ""}
                  ${showFeedback && !isActive && !isSelected ? "bg-ink/60 border-clay opacity-60" : ""}`}
                aria-label={`Cell ${idx + 1}`}
              />
            );
          })}
        </div>

        {phase === "recall" && (
          <button
            onClick={checkAnswer}
            disabled={selected.size === 0}
            className="px-8 py-3.5 min-h-[48px] rounded-xl bg-sun text-ink font-black text-lg hover:opacity-95 active:scale-95 transition shadow-lg touch-manipulation cursor-pointer disabled:opacity-40"
          >
            ✓ Submit Answer ({selected.size}/{count})
          </button>
        )}
      </div>
    </GameShell>
  );
}
