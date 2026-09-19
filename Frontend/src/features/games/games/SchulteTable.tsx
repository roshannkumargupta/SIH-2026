import { useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

const sizeForLevel = (l: number) => (l === 1 ? 3 : l === 2 ? 4 : l >= 8 ? 7 : 5);

export default function SchulteTable({ level }: { level: number }) {
  const size = useMemo(() => sizeForLevel(level), [level]);
  const total = size * size;
  const numbers = useMemo(() => {
    const arr = Array.from({ length: total }, (_, i) => i + 1);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
  }, [size, total]);

  const [next, setNext] = useState(1);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const { submitResult } = useGameSession();

  useEffect(() => {
    setNext(1);
    setStartTime(null);
    setElapsed(null);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
  }, [level]);

  const clickNumber = (n: number) => {
    if (startTime === null) setStartTime(Date.now());
    if (n !== next) return;
    if (next === total) {
      const t = Date.now() - (startTime ?? Date.now());
      setElapsed(t);
      if (!saved.current) {
        saved.current = true;
        const score = Math.min(100, Math.max(10, Math.round(10000 / Math.max(1, t / 100))));
        submitResult({
          gameId: "schulte-table",
          gameType: "schulte_table",
          score,
          accuracy: score,
          durationSeconds: Math.max(1, Math.round(t / 1000)),
          level,
          difficulty: String(level),
        }).then((r) => {
          setSynced(r.success);
          setOffline(r.offline);
          setCompleted(true);
        });
      }
    } else {
      setNext((s) => s + 1);
    }
  };

  const reset = () => {
    setNext(1);
    setStartTime(null);
    setElapsed(null);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
  };

  const finalScore = Math.min(100, elapsed ? Math.round(10000 / Math.max(1, elapsed / 100)) : 70);
  const finalDuration = elapsed ? Math.round(elapsed / 1000) : 0;

  return (
    <GameShell
      gameId="schulte-table"
      level={level}
      stats={[
        { label: "Target Number", value: next <= total ? next : "Done!", highlight: "sun" },
        { label: "Remaining", value: Math.max(0, total - next + 1) },
        ...(elapsed !== null
          ? [{ label: "Time", value: `${(elapsed / 1000).toFixed(1)}s`, highlight: "tea" as const }]
          : []),
      ]}
      instructionHint={`Tap numbers 1 to ${total} in sequence as quickly as possible`}
      completed={completed}
      results={{
        score: finalScore,
        accuracy: finalScore,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={reset}
    >
      <div className="space-y-6 flex flex-col items-center">
        <div
          className="grid gap-2.5 p-2 rounded-2xl border-2 border-clay bg-ink/50 shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(44px, 1fr))`,
            maxWidth: "380px",
            width: "100%",
          }}
        >
          {numbers.map((n) => (
            <button
              key={n}
              onClick={() => clickNumber(n)}
              className={`aspect-square min-w-[44px] min-h-[44px] text-xl sm:text-2xl font-black rounded-xl border-2 transition-all shadow touch-manipulation select-none
                ${
                  n < next
                    ? "bg-tea-confirm/20 border-tea-confirm/40 text-tea-confirm/60 opacity-60 cursor-default"
                    : "bg-ink/80 border-clay text-cream hover:border-sun hover:scale-105 active:scale-90 shadow-sm"
                }`}
              disabled={n < next}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="pt-2">
          <button
            onClick={reset}
            className="px-6 py-2.5 min-h-[48px] min-w-[48px] rounded-xl border border-clay text-cream/90 text-sm font-bold hover:bg-clay active:scale-95 transition touch-manipulation flex items-center justify-center gap-2 shadow-sm"
          >
            🔄 Reset Table
          </button>
        </div>
      </div>
    </GameShell>
  );
}
