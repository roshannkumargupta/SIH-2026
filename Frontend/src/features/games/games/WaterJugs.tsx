import { useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

type JugConfig = { capacities: number[]; target: number };

const configForLevel = (l: number): JugConfig => {
  switch (l) {
    case 1:
      return { capacities: [3, 5], target: 4 };
    case 2:
      return { capacities: [5, 7], target: 6 };
    case 3:
      return { capacities: [3, 7], target: 5 };
    case 4:
      return { capacities: [5, 11], target: 7 };
    case 5:
      return { capacities: [7, 13], target: 5 };
    case 6:
      return { capacities: [3, 5, 8], target: 4 };
    case 7:
      return { capacities: [5, 7, 11], target: 9 };
    case 8:
      return { capacities: [3, 7, 10], target: 5 };
    case 9:
      return { capacities: [4, 9, 13], target: 6 };
    default:
      return { capacities: [5, 8, 13], target: 11 };
  }
};

export default function WaterJugs({ level }: { level: number }) {
  const cfg = useMemo(() => configForLevel(level), [level]);
  const [jugs, setJugs] = useState<number[]>(() => cfg.capacities.map(() => 0));
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const { submitResult } = useGameSession();

  const resetGame = () => {
    setJugs(cfg.capacities.map(() => 0));
    setMoves(0);
    setWon(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  };

  useEffect(() => {
    resetGame();
  }, [cfg]);

  const fill = (i: number) => {
    setJugs((j) => {
      const n = [...j];
      n[i] = cfg.capacities[i]!;
      return n;
    });
    setMoves((m) => m + 1);
  };

  const empty = (i: number) => {
    setJugs((j) => {
      const n = [...j];
      n[i] = 0;
      return n;
    });
    setMoves((m) => m + 1);
  };

  const pour = (from: number, to: number) => {
    setJugs((j) => {
      const n = [...j];
      const amount = Math.min(n[from]!, cfg.capacities[to]! - n[to]!);
      n[from]! -= amount;
      n[to]! += amount;
      return n;
    });
    setMoves((m) => m + 1);
  };

  useEffect(() => {
    if (!won && jugs.some((j) => j === cfg.target)) {
      setWon(true);
      if (!saved.current) {
        saved.current = true;
        const score = Math.max(10, Math.round(100 / Math.max(1, moves / 6)));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "water-jugs",
          gameType: "water_jugs",
          score: Math.min(100, score),
          accuracy: 100,
          durationSeconds: Math.max(5, dur),
          level,
          difficulty: String(level),
        }).then((r) => {
          setSynced(r.success);
          setOffline(r.offline);
        });
      }
    }
  }, [jugs, cfg.target, won, moves, level, submitResult]);

  const finalScore = Math.min(100, Math.max(10, Math.round(100 / Math.max(1, moves / 6))));
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);

  return (
    <GameShell
      gameId="water-jugs"
      level={level}
      stats={[
        { label: "Target", value: `${cfg.target}L`, highlight: "sun" },
        { label: "Moves", value: moves, highlight: "cream" },
      ]}
      instructionHint={`Measure exactly ${cfg.target}L into any jug using fill, empty, and pour actions.`}
      completed={won}
      results={{
        score: finalScore,
        accuracy: 100,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={resetGame}
      onNextLevel={level < 10 ? () => { window.location.href = `/games/water-jugs?level=${level + 1}`; } : undefined}
    >
      <div className="space-y-6">
        <div className="flex gap-4 justify-center flex-wrap">
          {cfg.capacities.map((cap, i) => {
            const fill_pct = (jugs[i]! / cap) * 100;
            const isTargetReached = jugs[i] === cfg.target;
            return (
              <div key={i} className="flex flex-col items-center gap-3 p-3 rounded-2xl border border-clay/60 bg-ink/30">
                <p className="text-base font-bold text-cream">
                  <span className={isTargetReached ? "text-sun font-extrabold" : "text-cream"}>
                    {jugs[i]}L
                  </span>{" "}
                  <span className="text-cream/50 text-xs">/ {cap}L</span>
                </p>
                <div className="relative w-20 h-44 rounded-b-2xl border-2 border-clay bg-ink/60 overflow-hidden shadow-inner">
                  <div
                    className={`absolute bottom-0 left-0 right-0 transition-all duration-300 rounded-b-2xl ${
                      isTargetReached ? "bg-sun/90" : "bg-sky-500/80"
                    }`}
                    style={{ height: `${fill_pct}%` }}
                  />
                  {isTargetReached && (
                    <div className="absolute inset-0 ring-4 ring-sun rounded-2xl animate-pulse" />
                  )}
                </div>

                <div className="flex flex-col gap-1.5 w-full pt-1">
                  <button
                    onClick={() => fill(i)}
                    className="min-h-[44px] text-xs font-bold px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white cursor-pointer active:scale-95 transition touch-manipulation shadow-sm"
                  >
                    Fill
                  </button>
                  <button
                    onClick={() => empty(i)}
                    className="min-h-[44px] text-xs font-bold px-3 py-2 rounded-xl bg-surface hover:bg-clay text-cream border border-clay cursor-pointer active:scale-95 transition touch-manipulation shadow-sm"
                  >
                    Empty
                  </button>
                  {cfg.capacities.map(
                    (_, j) =>
                      j !== i && (
                        <button
                          key={j}
                          onClick={() => pour(i, j)}
                          className="min-h-[44px] text-xs font-bold px-3 py-2 rounded-xl bg-sun/80 hover:bg-sun text-ink font-semibold cursor-pointer active:scale-95 transition touch-manipulation shadow-sm"
                        >
                          Pour → #{j + 1}
                        </button>
                      ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
