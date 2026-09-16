import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";

import type { ReactNode } from "react";

const SHAPES = ["circle", "square", "triangle", "star", "diamond"] as const;
type Shape = (typeof SHAPES)[number];
const SHAPE_SVG: Record<Shape, (color: string) => ReactNode> = {
  circle: (c) => <circle cx="20" cy="20" r="16" fill={c} />,
  square: (c) => <rect x="4" y="4" width="32" height="32" rx="4" fill={c} />,
  triangle: (c) => <polygon points="20,4 36,36 4,36" fill={c} />,
  star: (c) => (
    <polygon points="20,4 23,16 36,16 26,24 29,36 20,28 11,36 14,24 4,16 17,16" fill={c} />
  ),
  diamond: (c) => <polygon points="20,4 36,20 20,36 4,20" fill={c} />,
};

const COLORS = ["#e9c46a", "#e63946", "#52b788", "#457b9d", "#f4a261"];

type DualTaskProblem = {
  targetShape: Shape;
  shapeCount: number;
  shapes: Array<{ shape: Shape; color: string }>;
  math: string;
  mathAnswer: number;
};

const generateProblem = (level: number): DualTaskProblem => {
  const targetShape = SHAPES[Math.floor(Math.random() * SHAPES.length)]!;
  const itemCount = Math.min(6 + level, 16);
  const targetCount = Math.floor(Math.random() * 4) + 1;
  const items: Array<{ shape: Shape; color: string }> = [];
  for (let i = 0; i < targetCount; i++)
    items.push({ shape: targetShape, color: COLORS[Math.floor(Math.random() * COLORS.length)]! });
  for (let i = targetCount; i < itemCount; i++) {
    let s: Shape;
    do {
      s = SHAPES[Math.floor(Math.random() * SHAPES.length)]!;
    } while (s === targetShape);
    items.push({ shape: s, color: COLORS[Math.floor(Math.random() * COLORS.length)]! });
  }
  items.sort(() => Math.random() - 0.5);
  const a = Math.floor(Math.random() * (5 * level)) + 1,
    b = Math.floor(Math.random() * 10) + 1;
  const ops = level <= 3 ? ["+", "-"] : ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)]!;
  const mathAnswer = op === "+" ? a + b : op === "-" ? a - b : a * b;
  return {
    targetShape,
    shapeCount: targetCount,
    shapes: items,
    math: `${a} ${op} ${b}`,
    mathAnswer,
  };
};

export default function DualTask({ level }: { level: number }) {
  const [problem, setProblem] = useState<DualTaskProblem>(() => generateProblem(level));
  const [shapeInput, setShapeInput] = useState("");
  const [mathInput, setMathInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(level / 2));
  const { submitResult } = useGameSession();

  useEffect(() => {
    setProblem(generateProblem(level));
    setScore(0);
    setFeedback("");
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  }, [level]);

  const submit = () => {
    const shapeOk = parseInt(shapeInput, 10) === problem.shapeCount;
    const mathOk = parseInt(mathInput, 10) === problem.mathAnswer;
    if (shapeOk && mathOk) {
      const newScore = score + 1;
      setScore(newScore);
      setFeedback("✓ Both correct!");
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "dual-task",
          gameType: "dual_task",
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
      setTimeout(() => {
        setProblem(generateProblem(level));
        setShapeInput("");
        setMathInput("");
        setFeedback("");
      }, 900);
    } else {
      setFeedback(`✗ Shapes: ${problem.shapeCount}, Math: ${problem.mathAnswer}`);
      setTimeout(() => {
        setProblem(generateProblem(level));
        setShapeInput("");
        setMathInput("");
        setFeedback("");
      }, 1500);
    }
  };

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((score / target) * 100))}
          accuracy={Math.min(100, Math.round((score / target) * 100))}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
          gameName="Dual Task Challenge"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            setProblem(generateProblem(level));
            sessionStart.current = Date.now();
          }}
        />
      </>
    );

  return (
    <div className="space-y-5">
      <p className="text-center text-cream/50 text-xs uppercase font-bold">
        Score: {score}/{target} · Do both tasks simultaneously!
      </p>

      {/* Shapes area */}
      <div className="rounded-xl border border-clay bg-ink/40 p-4">
        <p className="text-xs text-cream/60 mb-2 font-bold">
          Count the <span className="text-sun capitalize">{problem.targetShape}s</span>:
        </p>
        <div className="flex flex-wrap gap-2">
          {problem.shapes.map((item, i) => (
            <svg key={i} width="40" height="40" viewBox="0 0 40 40">
              {SHAPE_SVG[item.shape](item.color)}
            </svg>
          ))}
        </div>
      </div>

      {/* Math area */}
      <div className="rounded-xl border border-clay bg-ink/40 p-4 text-center">
        <p className="text-xs text-cream/60 mb-2 font-bold">Solve the math:</p>
        <span className="font-display text-3xl font-black text-fire">{problem.math} = ?</span>
      </div>

      {/* Answers */}
      <div className="flex gap-3 flex-wrap justify-center">
        <div className="flex flex-col items-center gap-1">
          <label className="text-xs text-sun font-bold">Shape count</label>
          <input
            type="number"
            value={shapeInput}
            onChange={(e) => setShapeInput(e.target.value)}
            className="w-20 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-xl py-2 focus:border-sun focus:outline-none"
            placeholder="?"
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <label className="text-xs text-fire font-bold">Math answer</label>
          <input
            type="number"
            value={mathInput}
            onChange={(e) => setMathInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            className="w-20 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-xl py-2 focus:border-sun focus:outline-none"
            placeholder="?"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={submit}
            className="px-5 py-2.5 rounded-xl bg-sun text-ink font-extrabold hover:opacity-90 transition shadow"
          >
            Submit Both
          </button>
        </div>
      </div>
      {feedback && (
        <p
          className={`text-center text-sm font-bold ${feedback.startsWith("✓") ? "text-tea-confirm" : "text-fire"}`}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
