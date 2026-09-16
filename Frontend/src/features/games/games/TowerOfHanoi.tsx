import { useEffect, useMemo, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";

const disksForLevel = (l: number) => (l <= 8 ? 2 + l : l === 9 ? 5 : 6);

const DISK_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-400",
  "bg-green-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-teal-500",
];

export default function TowerOfHanoi({ level }: { level: number }) {
  const diskCount = useMemo(() => disksForLevel(level), [level]);
  const optimalMoves = Math.pow(2, diskCount) - 1;

  const initialRods: number[][] = useMemo(() => {
    if (level === 9) {
      const disks = Array.from({ length: diskCount }, (_, i) => diskCount - i);
      const rods: number[][] = [[], [], []];
      disks.forEach((d) => rods[Math.floor(Math.random() * 3)]!.push(d));
      return rods;
    }
    return [Array.from({ length: diskCount }, (_, i) => diskCount - i), [], []];
  }, [diskCount, level]);

  const [rods, setRods] = useState<number[][]>(initialRods);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const { submitResult } = useGameSession();

  useEffect(() => {
    setRods(initialRods);
    setSelected(null);
    setMoves(0);
    setWon(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  }, [initialRods]);

  const handleRodClick = (idx: number) => {
    if (won) return;
    if (selected === null) {
      if (rods[idx]?.length === 0) return;
      setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    const src = rods[selected]!;
    const dst = rods[idx]!;
    const disk = src[src.length - 1];
    const dstTop = dst[dst.length - 1];
    if (disk === undefined || (dstTop !== undefined && disk > dstTop)) {
      setSelected(null);
      return;
    }
    setRods((prev) => {
      const copy = prev.map((r) => [...r]);
      const d = copy[selected]!.pop()!;
      copy[idx]!.push(d);
      return copy;
    });
    setMoves((m) => m + 1);
    setSelected(null);
  };

  useEffect(() => {
    const targetRod = level === 9 ? 0 : 2;
    if (rods[targetRod]?.length === diskCount && !won) {
      setWon(true);
      if (!saved.current) {
        saved.current = true;
        const score = Math.max(
          10,
          Math.round((optimalMoves / Math.max(moves, optimalMoves)) * 100),
        );
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "tower-of-hanoi",
          gameType: "tower_of_hanoi",
          score,
          accuracy: score,
          durationSeconds: Math.max(5, dur),
          level,
          difficulty: String(level),
        }).then((r) => {
          setSynced(r.success);
          setOffline(r.offline);
        });
      }
    }
  }, [rods, diskCount, level, won, moves, optimalMoves]);

  if (won)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.max(10, Math.round((optimalMoves / Math.max(moves, optimalMoves)) * 100))}
          accuracy={100}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
          gameName="Tower of Hanoi"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setRods(initialRods);
            setSelected(null);
            setMoves(0);
            setWon(false);
            setSynced(false);
            setOffline(false);
            saved.current = false;
            sessionStart.current = Date.now();
          }}
        />
      </>
    );

  return (
    <div className="space-y-4">
      <div className="flex gap-4 justify-center text-sm font-bold text-cream/70">
        <span>
          Disks: <span className="text-sun">{diskCount}</span>
        </span>
        <span>
          Moves: <span className="text-cream">{moves}</span>
        </span>
        <span>
          Optimal: <span className="text-cream/50">{optimalMoves}</span>
        </span>
      </div>

      <div className="flex gap-3 justify-center">
        {rods.map((rod, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleRodClick(idx)}
            className={`flex-1 min-h-[200px] rounded-2xl border-2 transition-all flex flex-col justify-end items-center p-2 relative cursor-pointer
              ${selected === idx ? "border-sun ring-2 ring-sun/50 bg-sun/5" : "border-clay bg-ink/40 hover:border-clay/80"}`}
            aria-label={`Tower ${idx + 1}${selected === idx ? " (selected)" : ""}`}
          >
            {/* Pole */}
            <div className="absolute top-4 bottom-5 w-2 bg-clay/60 rounded-full left-1/2 -translate-x-1/2" />
            {/* Disks */}
            <div className="relative z-10 w-full flex flex-col gap-1 items-center">
              {[...rod].reverse().map((disk) => (
                <div
                  key={disk}
                  className={`h-5 rounded-full ${DISK_COLORS[(disk - 1) % DISK_COLORS.length]} text-white text-xs font-bold flex items-center justify-center`}
                  style={{ width: `${Math.max(30, 40 + disk * 8)}%` }}
                >
                  {disk}
                </div>
              ))}
            </div>
            <span className="text-xs text-cream/40 mt-2 font-bold">{idx + 1}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-cream/50 text-center">
        Click a tower to select top disk, then click another to move it.
      </p>
      {selected !== null && (
        <p className="text-xs text-sun text-center font-bold">
          Tower {selected + 1} selected — click destination tower
        </p>
      )}
    </div>
  );
}
