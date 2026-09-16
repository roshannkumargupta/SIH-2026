import { useCallback, useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";

type Tube = string[];
type LevelConfig = { colors: string[]; tubesCount: number; ballsPerTube: number };

const getLevelConfig = (l: number): LevelConfig => {
  switch (l) {
    case 1:
      return { colors: ["red", "blue"], tubesCount: 3, ballsPerTube: 3 };
    case 2:
      return { colors: ["red", "blue", "green"], tubesCount: 4, ballsPerTube: 3 };
    case 3:
      return { colors: ["red", "blue", "green"], tubesCount: 5, ballsPerTube: 4 };
    case 4:
      return { colors: ["red", "blue", "green", "yellow"], tubesCount: 5, ballsPerTube: 4 };
    case 5:
      return { colors: ["red", "blue", "green", "yellow"], tubesCount: 6, ballsPerTube: 4 };
    case 6:
      return {
        colors: ["red", "blue", "green", "yellow", "purple"],
        tubesCount: 6,
        ballsPerTube: 4,
      };
    case 7:
      return {
        colors: ["red", "blue", "green", "yellow", "purple"],
        tubesCount: 7,
        ballsPerTube: 4,
      };
    case 8:
      return {
        colors: ["red", "blue", "green", "yellow", "purple", "orange"],
        tubesCount: 7,
        ballsPerTube: 4,
      };
    case 9:
      return {
        colors: ["red", "blue", "green", "yellow", "purple", "orange"],
        tubesCount: 8,
        ballsPerTube: 5,
      };
    default:
      return {
        colors: ["red", "blue", "green", "yellow", "purple", "orange", "pink"],
        tubesCount: 9,
        ballsPerTube: 5,
      };
  }
};

const COLOR_MAP: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
};

const shuffle = <T,>(a: T[]): T[] => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
};

const generateTubes = (cfg: LevelConfig): Tube[] => {
  const balls = shuffle(cfg.colors.flatMap((c) => Array(cfg.ballsPerTube).fill(c)));
  const tubes: Tube[] = cfg.colors.map((_, i) =>
    balls.slice(i * cfg.ballsPerTube, (i + 1) * cfg.ballsPerTube),
  );
  for (let i = cfg.colors.length; i < cfg.tubesCount; i++) tubes.push([]);
  return tubes;
};

const isSolved = (tubes: Tube[], cfg: LevelConfig) =>
  tubes.every(
    (t) => t.length === 0 || (t.length === cfg.ballsPerTube && t.every((b) => b === t[0])),
  );

export default function BallSort({ level }: { level: number }) {
  const cfg = getLevelConfig(level);
  const [tubes, setTubes] = useState<Tube[]>(() => generateTubes(cfg));
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const { submitResult } = useGameSession();

  const reset = useCallback(() => {
    setTubes(generateTubes(getLevelConfig(level)));
    setSelected(null);
    setMoves(0);
    setWon(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  }, [level]);

  useEffect(() => {
    reset();
  }, [level, reset]);

  const handleTubeClick = (idx: number) => {
    if (won) return;
    if (selected === null) {
      if (tubes[idx]!.length === 0) return;
      setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    const src = tubes[selected]!;
    const dst = tubes[idx]!;
    const topBall = src[src.length - 1];
    const dstTop = dst[dst.length - 1];
    if (dst.length >= cfg.ballsPerTube || (dstTop !== undefined && dstTop !== topBall)) {
      setSelected(null);
      return;
    }
    setTubes((prev) => {
      const next = prev.map((t) => [...t]);
      const ball = next[selected]!.pop()!;
      next[idx]!.push(ball);
      return next;
    });
    setMoves((m) => m + 1);
    setSelected(null);
  };

  useEffect(() => {
    if (!won && isSolved(tubes, cfg)) {
      setWon(true);
      if (!saved.current) {
        saved.current = true;
        const score = Math.max(10, Math.min(100, 100 - moves + cfg.colors.length * 5));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "ball-sort",
          gameType: "ball_sort",
          score,
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
  }, [tubes, won, moves, cfg]);

  if (won)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.max(10, Math.min(100, 100 - moves + cfg.colors.length * 5))}
          accuracy={100}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
          gameName="Ball Sort"
          synced={synced}
          offline={offline}
          onPlayAgain={reset}
        />
      </>
    );

  return (
    <div className="space-y-4">
      <div className="flex gap-4 justify-center text-sm font-bold text-cream/70">
        <span>
          Moves: <span className="text-sun">{moves}</span>
        </span>
        <span className="text-cream/40">Sort each color into its own tube</span>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {tubes.map((tube, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleTubeClick(idx)}
            className={`flex flex-col-reverse items-center justify-start gap-0.5 w-14 min-h-[140px] rounded-xl border-2 p-1.5 transition-all
              ${selected === idx ? "border-sun ring-2 ring-sun/40" : "border-clay hover:border-clay/60"}
              bg-ink/40`}
            aria-label={`Tube ${idx + 1}${selected === idx ? " (selected)" : ""}`}
          >
            {tube.map((ball, bi) => (
              <div
                key={bi}
                className={`w-8 h-8 rounded-full shadow ${COLOR_MAP[ball] ?? "bg-clay"} border border-white/20`}
              />
            ))}
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={reset}
          className="px-5 py-2 rounded-xl border border-clay text-cream/70 text-sm hover:bg-clay transition"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
}
