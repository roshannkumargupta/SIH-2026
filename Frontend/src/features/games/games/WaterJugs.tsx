import { useEffect, useMemo, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
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

  useEffect(() => {
    setJugs(cfg.capacities.map(() => 0));
    setMoves(0);
    setWon(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
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
  }, [jugs, cfg.target, won, moves]);

  if (won)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.max(10, Math.round(100 / Math.max(1, moves / 6))))}
          accuracy={100}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
          gameName="Water Jugs"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setJugs(cfg.capacities.map(() => 0));
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
    <div className="space-y-5">
      <div className="flex gap-4 justify-center text-sm font-bold text-cream/70">
        <span>
          Target: <span className="text-sun">{cfg.target}L</span>
        </span>
        <span>
          Moves: <span className="text-cream">{moves}</span>
        </span>
      </div>

      <div className="flex gap-4 justify-center flex-wrap">
        {cfg.capacities.map((cap, i) => {
          const fill_pct = (jugs[i]! / cap) * 100;
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <p className="text-sm font-bold text-cream">
                {jugs[i]}L / {cap}L
              </p>
              <div className="relative w-16 h-40 rounded-b-xl border-2 border-clay bg-ink/60 overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-blue-500/80 transition-all duration-300 rounded-b-xl"
                  style={{ height: `${fill_pct}%` }}
                />
                {jugs[i] === cfg.target && (
                  <div className="absolute inset-0 ring-4 ring-sun rounded-xl animate-pulse" />
                )}
              </div>
              <div className="flex flex-col gap-1 w-full">
                <button
                  onClick={() => fill(i)}
                  className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:opacity-80 transition"
                >
                  Fill
                </button>
                <button
                  onClick={() => empty(i)}
                  className="text-xs px-2 py-1 rounded bg-clay text-cream hover:opacity-80 transition"
                >
                  Empty
                </button>
                {cfg.capacities.map(
                  (_, j) =>
                    j !== i && (
                      <button
                        key={j}
                        onClick={() => pour(i, j)}
                        className="text-xs px-2 py-1 rounded bg-sun/80 text-ink hover:opacity-80 transition"
                      >
                        → {j + 1}
                      </button>
                    ),
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-cream/40">
        Fill, empty, or pour between jugs to get exactly{" "}
        <span className="text-sun">{cfg.target}L</span> in any jug.
      </p>
    </div>
  );
}
