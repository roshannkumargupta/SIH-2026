import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
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

  useEffect(() => {
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

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.max(
            10,
            Math.min(100, Math.round((100 * targetCount) / Math.max(1, targetCount + wrongClicks))),
          )}
          accuracy={Math.max(
            10,
            Math.min(100, Math.round((100 * targetCount) / Math.max(1, targetCount + wrongClicks))),
          )}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
          gameName="Visual Search"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
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
          }}
        />
      </>
    );

  const size = 40;
  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-sm text-cream/60 font-bold">Find all:</p>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="border border-sun rounded-lg"
          >
            <ShapeSVG shape={target} color="#e9c46a" size={size} />
          </svg>
        </div>
        <p className="text-sm text-cream/60">
          Found:{" "}
          <span className="text-sun font-bold">
            {found.size}/{targetCount}
          </span>
        </p>
        <p className="text-sm text-cream/60">
          Round:{" "}
          <span className="text-cream font-bold">
            {score}/{gameTarget}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-clay bg-ink/30">
        {items.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleClick(idx)}
            disabled={found.has(idx) || completed}
            className={`rounded-lg border transition-all ${found.has(idx) ? "border-tea-confirm opacity-40" : "border-clay hover:border-sun/50 hover:scale-110"}`}
          >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <ShapeSVG shape={item.shape} color={item.color} size={size} />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
