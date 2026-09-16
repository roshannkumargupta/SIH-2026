import { useEffect, useMemo, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
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

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, elapsed ? Math.round(10000 / Math.max(1, elapsed / 100)) : 70)}
          accuracy={100}
          durationSeconds={elapsed ? Math.round(elapsed / 1000) : 0}
          level={level}
          gameName="Schulte Table"
          synced={synced}
          offline={offline}
          onPlayAgain={reset}
        />
      </>
    );

  return (
    <div className="space-y-4 flex flex-col items-center">
      <div className="flex gap-4 text-sm font-bold text-cream/70">
        <span>
          Find: <span className="text-sun text-xl">{next}</span>
        </span>
        {elapsed !== null && (
          <span>
            Time: <span className="text-tea-confirm">{(elapsed / 1000).toFixed(2)}s</span>
          </span>
        )}
      </div>
      <p className="text-xs text-cream/40">
        Click numbers 1 → {total} in order, as fast as you can.
      </p>

      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          maxWidth: "360px",
          width: "100%",
        }}
      >
        {numbers.map((n) => (
          <button
            key={n}
            onClick={() => clickNumber(n)}
            className={`aspect-square text-xl sm:text-2xl font-black rounded-xl border-2 transition-all shadow
              ${n < next ? "bg-tea-confirm/30 border-tea-confirm/40 opacity-50 cursor-default" : "bg-ink/70 border-clay text-cream hover:border-sun hover:scale-105 active:scale-95"}`}
            disabled={n < next}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        onClick={reset}
        className="px-5 py-2 rounded-xl border border-clay text-cream/70 text-sm hover:bg-clay transition"
      >
        🔄 Reset
      </button>
    </div>
  );
}
