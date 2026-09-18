import { useEffect, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

type Shape = "circle" | "square" | "triangle";
type Item = { shape: Shape; color: string; isTarget: boolean; found: boolean };

const COLORS = ["#e9c46a", "#e63946", "#52b788", "#457b9d", "#f4a261", "#a8dadc", "#6a4c93"];
const SHAPES: Shape[] = ["circle", "square", "triangle"];

const ShapeSVG = ({ shape, color, size = 40 }: { shape: Shape; color: string; size?: number }) => {
  if (shape === "circle")
    return <circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill={color} />;
  if (shape === "square")
    return <rect x="2" y="2" width={size - 4} height={size - 4} rx="3" fill={color} />;
  return <polygon points={`${size / 2},2 ${size - 2},${size - 2} 2,${size - 2}`} fill={color} />;
};

const generateProblem = (level: number): { items: Item[]; target: Shape } => {
  const count = Math.min(8 + level * 2, 30);
  const target = SHAPES[Math.floor(Math.random() * SHAPES.length)]!;
  const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)]!;
  const items: Item[] = [];
  const targetCount = Math.floor(Math.random() * Math.min(5, level + 1)) + 1;
  for (let i = 0; i < targetCount; i++)
    items.push({ shape: target, color: targetColor, isTarget: true, found: false });
  for (let i = targetCount; i < count; i++) {
    let s: Shape;
    do {
      s = SHAPES[Math.floor(Math.random() * SHAPES.length)]!;
    } while (s === target);
    items.push({
      shape: s,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      isTarget: false,
      found: false,
    });
  }
  return { items: items.sort(() => Math.random() - 0.5), target };
};

export default function VisualSearch({ level }: { level: number }) {
  const [{ items, target }, setProblem] = useState(() => generateProblem(level));
  const [found, setFound] = useState<Set<number>>(new Set());
  const [wrongClicks, setWrongClicks] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const targetCount = items.filter((i) => i.isTarget).length;
  const gameTarget = Math.max(3, Math.ceil(level / 2));
  const { submitResult } = useGameSession();

  const resetGame = () => {
    const p = generateProblem(level);
    setProblem(p);
    setFound(new Set());
    setWrongClicks(0);
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  };

  useEffect(() => {
    resetGame();
  }, [level]);

  const handleClick = (idx: number) => {
    if (found.has(idx) || completed) return;
    if (items[idx]!.isTarget) {
      const newFound = new Set(found);
      newFound.add(idx);
      setFound(newFound);
      if (newFound.size === targetCount) {
        const newScore = score + 1;
        setScore(newScore);
        const acc = Math.max(
          10,
          Math.min(100, Math.round((100 * targetCount) / Math.max(1, targetCount + wrongClicks))),
        );
        if (newScore >= gameTarget && !saved.current) {
          saved.current = true;
          const dur = Math.round((Date.now() - sessionStart.current) / 1000);
          submitResult({
            gameId: "visual-search",
            gameType: "visual_search",
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
        } else {
          setTimeout(() => {
            const p = generateProblem(level);
            setProblem(p);
            setFound(new Set());
            setWrongClicks(0);
          }, 800);
        }
      }
    } else {
      setWrongClicks((w) => w + 1);
    }
  };

  const finalAcc = Math.max(
    10,
    Math.min(100, Math.round((100 * targetCount) / Math.max(1, targetCount + wrongClicks))),
  );
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);
  const size = 48;

  return (
    <GameShell
      gameId="visual-search"
      level={level}
      score={score}
      targetScore={gameTarget}
      stats={[
        { label: "Found", value: `${found.size}/${targetCount}`, highlight: "sun" },
        { label: "Misses", value: wrongClicks, highlight: wrongClicks > 0 ? "fire" : undefined },
      ]}
      instructionHint={`Find and tap every ${target} in the grid.`}
      completed={completed}
      results={{
        score: finalAcc,
        accuracy: finalAcc,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={resetGame}
      onNextLevel={level < 10 ? () => { window.location.href = `/games/visual-search?level=${level + 1}`; } : undefined}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-center gap-3 p-3 bg-surface/60 rounded-xl border border-clay/60 max-w-xs mx-auto">
          <span className="text-sm font-bold text-cream/70">Target Shape:</span>
          <div className="p-1 border-2 border-sun rounded-xl bg-sun/10">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <ShapeSVG shape={target} color="#e9c46a" size={size} />
            </svg>
          </div>
          <span className="text-xs uppercase tracking-wider text-sun font-bold">{target}</span>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 p-4 rounded-2xl border border-clay bg-ink/30 max-w-lg mx-auto">
          {items.map((item, idx) => {
            const isFound = found.has(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleClick(idx)}
                disabled={isFound || completed}
                aria-label={`${item.shape} ${item.color}${isFound ? " (found)" : ""}`}
                className={`rounded-xl border-2 transition-all p-1 min-w-[52px] min-h-[52px] flex items-center justify-center touch-manipulation cursor-pointer select-none active:scale-95 ${
                  isFound
                    ? "border-tea-confirm bg-tea-confirm/15 opacity-40 scale-95"
                    : "border-clay bg-surface/40 hover:border-sun/60 hover:bg-surface/80"
                }`}
              >
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                  <ShapeSVG shape={item.shape} color={item.color} size={size} />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
