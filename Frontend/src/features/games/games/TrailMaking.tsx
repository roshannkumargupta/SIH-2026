import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

// Trail Making: connect circles in order (numbers, or alternating number-letter)
type Circle = { label: string; x: number; y: number; done: boolean };

const generateCircles = (level: number): Circle[] => {
  const useLetters = level >= 5;
  const count = Math.min(5 + level, 20);
  const circles: Circle[] = [];
  const letters = "ABCDEFGHIJ".split("");
  for (let i = 0; i < count; i++) {
    const label = useLetters
      ? i % 2 === 0
        ? String(Math.floor(i / 2) + 1)
        : letters[Math.floor(i / 2)]!
      : String(i + 1);
    circles.push({ label, x: 10 + Math.random() * 80, y: 10 + Math.random() * 80, done: false });
  }
  return circles;
};

export default function TrailMaking({ level }: { level: number }) {
  const [circles, setCircles] = useState<Circle[]>(() => generateCircles(level));
  const [nextIdx, setNextIdx] = useState(0);
  const [errors, setErrors] = useState(0);
  const [won, setWon] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const svgRef = useRef<SVGSVGElement>(null);
  const { submitResult } = useGameSession();

  const reset = useCallback(() => {
    setCircles(generateCircles(level));
    setNextIdx(0);
    setErrors(0);
    setWon(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  }, [level]);

  useEffect(() => {
    reset();
  }, [level, reset]);

  const handleClick = (idx: number) => {
    if (won || circles[idx]?.done) return;
    if (idx === nextIdx) {
      setCircles((prev) => prev.map((c, i) => (i === idx ? { ...c, done: true } : c)));
      const newNext = nextIdx + 1;
      setNextIdx(newNext);
      if (newNext >= circles.length && !saved.current) {
        saved.current = true;
        const acc = Math.max(
          10,
          Math.min(
            100,
            Math.round((100 * circles.length) / Math.max(circles.length, circles.length + errors)),
          ),
        );
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "trail-making",
          gameType: "trail_making",
          score: acc,
          accuracy: acc,
          durationSeconds: Math.max(5, dur),
          level,
          difficulty: String(level),
        }).then((r) => {
          setSynced(r.success);
          setOffline(r.offline);
          setWon(true);
        });
      }
    } else {
      setErrors((e) => e + 1);
    }
  };

  const finalScore = Math.max(
    10,
    Math.min(
      100,
      Math.round(
        (100 * circles.length) / Math.max(circles.length, circles.length + errors),
      ),
    ),
  );
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);
  const doneCircles = circles.filter((c) => c.done);

  return (
    <GameShell
      gameId="trail-making"
      level={level}
      stats={[
        { label: "Next Target", value: circles[nextIdx]?.label ?? "—", highlight: "sun" },
        { label: "Errors", value: errors, highlight: errors > 0 ? "fire" : undefined },
        { label: "Progress", value: `${nextIdx}/${circles.length}` },
      ]}
      instructionHint={
        level >= 5
          ? "Connect alternating numbers and letters in sequence: 1 → A → 2 → B → 3..."
          : "Connect numbers in ascending numerical sequence: 1 → 2 → 3..."
      }
      completed={won}
      results={{
        score: finalScore,
        accuracy: finalScore,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={reset}
      onNextLevel={level < 10 ? () => { window.location.href = `/games/trail-making?level=${level + 1}`; } : undefined}
    >
      <div className="space-y-4">
        <p className="text-xs text-cream/60 text-center font-medium">
          Order to connect: {circles.map((c) => c.label).join(" → ")}
        </p>

        <div className="relative w-full aspect-square max-w-sm mx-auto rounded-2xl border-2 border-clay bg-ink/30 overflow-hidden touch-manipulation select-none">
          <svg ref={svgRef} viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ touchAction: "manipulation" }}>
            {/* Trail lines */}
            {doneCircles.map((c, i) => {
              const next = doneCircles[i + 1];
              if (!next) return null;
              return (
                <line
                  key={i}
                  x1={c.x}
                  y1={c.y}
                  x2={next.x}
                  y2={next.y}
                  stroke="#e9c46a"
                  strokeWidth="0.8"
                  opacity="0.6"
                />
              );
            })}
            {/* Circles */}
            {circles.map((c, idx) => (
              <g key={idx} onClick={() => handleClick(idx)} className="cursor-pointer">
                {/* Invisible hit target for touch — ensures ~56px tap area on mobile */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="8"
                  fill="transparent"
                  pointerEvents="all"
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="5"
                  fill={c.done ? "#52b788" : idx === nextIdx ? "#e9c46a" : "#2a2a3e"}
                  stroke={c.done ? "#52b788" : idx === nextIdx ? "#e9c46a" : "#6b7280"}
                  strokeWidth="0.8"
                />
                <text
                  x={c.x}
                  y={c.y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="3.5"
                  fill={c.done ? "#1a1a2e" : "#f5f0e8"}
                  fontWeight="bold"
                >
                  {c.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 min-h-[44px] min-w-[44px] rounded-xl border border-clay text-cream/70 text-sm hover:bg-clay active:scale-95 transition touch-manipulation cursor-pointer"
          >
            🔄 Reset Trail
          </button>
        </div>
      </div>
    </GameShell>
  );
}
