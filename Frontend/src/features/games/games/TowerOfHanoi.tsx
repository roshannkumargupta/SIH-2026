import { useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
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

  const resetGame = () => {
    setRods(initialRods);
    setSelected(null);
    setMoves(0);
    setWon(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  };

  useEffect(() => {
    resetGame();
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
  }, [rods, diskCount, level, won, moves, optimalMoves, submitResult]);

  const finalScore = Math.max(10, Math.round((optimalMoves / Math.max(moves, optimalMoves)) * 100));
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);

  return (
    <GameShell
      gameId="tower-of-hanoi"
      level={level}
      stats={[
        { label: "Moves", value: moves, highlight: "cream" },
        { label: "Optimal", value: optimalMoves },
        { label: "Disks", value: diskCount },
      ]}
      instructionHint="Tap a tower to select its top disk, then tap another tower to move it. A larger disk cannot be placed on a smaller disk."
      completed={won}
      results={{
        score: finalScore,
        accuracy: finalScore,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={resetGame}
      onNextLevel={
        level < 10
          ? () => {
              window.location.href = `/games/tower-of-hanoi?level=${level + 1}`;
            }
          : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex gap-4 justify-center">
          {rods.map((rod, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleRodClick(idx)}
              className={`flex-1 min-h-[220px] rounded-2xl border-2 transition-all flex flex-col justify-end items-center p-3 relative cursor-pointer touch-manipulation select-none active:scale-[0.98]
                ${selected === idx ? "border-[#E0A23B] ring-2 ring-[#E0A23B]/50 bg-[#E0A23B]/10 shadow-lg shadow-[#E0A23B]/10" : "border-white/10 bg-[#0A1420]/70 hover:border-white/20 active:border-[#E0A23B]/60 shadow-inner"}`}
              aria-label={`Tower ${idx + 1}${selected === idx ? " (selected)" : ""}`}
            >
              {/* Target indicator */}
              {(level === 9 ? idx === 0 : idx === 2) && (
                <span className="absolute top-2 text-[10px] uppercase font-bold tracking-wider text-[#E0A23B] bg-[#E0A23B]/15 border border-[#E0A23B]/30 px-2.5 py-0.5 rounded-full shadow-xs">
                  Target
                </span>
              )}
              {/* Pole */}
              <div className="absolute top-8 bottom-6 w-2.5 bg-white/20 rounded-full left-1/2 -translate-x-1/2 shadow-xs" />
              {/* Disks */}
              <div className="relative z-10 w-full flex flex-col gap-1.5 items-center">
                {[...rod].reverse().map((disk) => (
                  <div
                    key={disk}
                    className={`h-6 rounded-full ${DISK_COLORS[(disk - 1) % DISK_COLORS.length]} text-white text-xs font-bold flex items-center justify-center shadow-md`}
                    style={{ width: `${Math.max(32, 40 + disk * 8)}%` }}
                  >
                    {disk}
                  </div>
                ))}
              </div>
              <span className="text-xs text-[#E8ECEF]/80 mt-3 font-bold tracking-wide">
                Tower {idx + 1}
              </span>
            </button>
          ))}
        </div>

        {selected !== null ? (
          <p className="text-sm text-[#E0A23B] text-center font-bold animate-pulse">
            Tower {selected + 1} selected — tap destination tower to move disk
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-[#8A99A8] text-center font-medium">
            Tap a tower to pick up its top disk
          </p>
        )}
      </div>
    </GameShell>
  );
}
