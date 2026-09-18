import { useEffect, useRef, useState, type ReactNode } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

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
  const [problem, setProblem] = useState(() => generateProblem(level));
  const [shapeInput, setShapeInput] = useState("");
  const [mathInput, setMathInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const target = Math.max(3, Math.min(8, level + 2));
  const { submitResult } = useGameSession();

  useEffect(() => {
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    setProblem(generateProblem(level));
    setShapeInput("");
    setMathInput("");
    setFeedback("");
  }, [level]);

  const submit = () => {
    const sAns = parseInt(shapeInput, 10);
    const mAns = parseInt(mathInput, 10);
    const correct = sAns === problem.shapeCount && mAns === problem.mathAnswer;

    if (correct) {
      setScore((s) => {
        const next = s + 1;
        if (!saved.current && next >= target) {
          saved.current = true;
          const acc = Math.min(100, Math.round((next / target) * 100));
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
        }
        return next;
      });
      setFeedback("✓ Both correct!");
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

  const finalAccuracy = Math.min(100, Math.round((score / target) * 100));
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);

  const resetGame = () => {
    setCompleted(false);
    setScore(0);
    saved.current = false;
    setSynced(false);
    setOffline(false);
    setProblem(generateProblem(level));
    sessionStart.current = Date.now();
  };

  return (
    <GameShell
      gameId="dual-task"
      level={level}
      score={score}
      targetScore={target}
      feedback={feedback}
      instructionHint="Count the target shapes AND solve the arithmetic question"
      completed={completed}
      results={{
        score: finalAccuracy,
        accuracy: finalAccuracy,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={resetGame}
    >
      <div className="space-y-6 max-w-xl mx-auto">
        {/* Shapes area */}
        <div className="rounded-2xl border-2 border-clay bg-ink/50 p-5 shadow-sm">
          <p className="text-sm text-cream/80 mb-3 font-bold">
            Count the <span className="text-sun capitalize font-black text-base">{problem.targetShape}s</span>:
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
            {problem.shapes.map((item, i) => (
              <svg key={i} width="44" height="44" viewBox="0 0 40 40" className="drop-shadow-sm">
                {SHAPE_SVG[item.shape](item.color)}
              </svg>
            ))}
          </div>
        </div>

        {/* Math area */}
        <div className="rounded-2xl border-2 border-clay bg-ink/50 p-5 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-cream/50 mb-1">Solve the calculation:</p>
          <span className="font-display text-4xl sm:text-5xl font-black text-fire">{problem.math} = ?</span>
        </div>

        {/* Inputs */}
        <div className="flex gap-4 flex-wrap justify-center items-end pt-1">
          <div className="flex flex-col items-center gap-1.5">
            <label className="text-xs text-sun font-bold uppercase tracking-wider">Shape Count</label>
            <input
              type="number"
              value={shapeInput}
              onChange={(e) => setShapeInput(e.target.value)}
              className="w-24 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-2xl py-2.5 focus:border-sun focus:outline-none min-h-[48px]"
              placeholder="?"
            />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <label className="text-xs text-fire font-bold uppercase tracking-wider">Math Answer</label>
            <input
              type="number"
              value={mathInput}
              onChange={(e) => setMathInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              className="w-24 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-2xl py-2.5 focus:border-sun focus:outline-none min-h-[48px]"
              placeholder="?"
            />
          </div>
          <button
            onClick={submit}
            className="px-7 py-3 min-h-[48px] min-w-[48px] rounded-xl bg-sun text-ink font-extrabold hover:opacity-90 active:scale-95 active:opacity-90 transition shadow-md touch-manipulation flex items-center justify-center text-base"
          >
            Submit Both
          </button>
        </div>
      </div>
    </GameShell>
  );
}
