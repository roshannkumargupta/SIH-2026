import { useEffect, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

type Shape = { points: string; mirrored: boolean; rotation: number };

const POLYGON_SETS = [
  "50,10 90,80 10,80", // triangle
  "50,10 90,50 50,90 10,50", // diamond
  "20,20 80,20 80,80 20,80", // square
  "50,10 80,35 70,80 30,80 20,35", // pentagon
];

const generateShape = (level: number): Shape => {
  const basePoints =
    POLYGON_SETS[Math.floor(Math.random() * Math.min(level + 1, POLYGON_SETS.length))]!;
  const rotation = Math.floor(Math.random() * 360);
  const mirrored = Math.random() > 0.5;
  return { points: basePoints, mirrored, rotation };
};

export default function MentalRotation({ level }: { level: number }) {
  const [shape, setShape] = useState<Shape>(() => generateShape(level));
  const [displayRotation] = useState(() => Math.floor(Math.random() * 360));
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(level * 1.5));
  const { submitResult } = useGameSession();

  useEffect(() => {
    setShape(generateShape(level));
    setScore(0);
    setFeedback("");
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  }, [level]);

  const answer = (userSaysMirrored: boolean) => {
    const correct = userSaysMirrored === shape.mirrored;
    if (correct) {
      const newScore = score + 1;
      setScore(newScore);
      setFeedback("✓ Correct!");
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "mental-rotation",
          gameType: "mental_rotation",
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
    } else {
      setFeedback(`✗ It was ${shape.mirrored ? "mirrored" : "not mirrored"}`);
    }
    setTimeout(() => {
      setShape(generateShape(level));
      setFeedback("");
    }, 900);
  };

  const finalAccuracy = Math.min(100, Math.round((score / target) * 100));
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);

  const resetGame = () => {
    setCompleted(false);
    setScore(0);
    saved.current = false;
    setSynced(false);
    setOffline(false);
    setShape(generateShape(level));
    sessionStart.current = Date.now();
  };

  return (
    <GameShell
      gameId="mental-rotation"
      level={level}
      score={score}
      targetScore={target}
      feedback={feedback}
      instructionHint="Is the right shape identical (rotated) or mirrored?"
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
      <div className="space-y-8 text-center max-w-xl mx-auto">
        <div className="flex items-center justify-center gap-8 sm:gap-12">
          {/* Reference shape */}
          <div className="flex flex-col items-center gap-2.5">
            <span className="text-xs text-cream/60 font-bold uppercase tracking-wider">
              Reference
            </span>
            <svg
              width="120"
              height="120"
              viewBox="0 0 100 100"
              className="rounded-2xl border-2 border-clay bg-ink/60 shadow-card"
            >
              <polygon
                points={shape.points}
                fill="#e9c46a"
                stroke="#e9c46a"
                strokeWidth="2"
                opacity="0.9"
              />
            </svg>
          </div>

          <span className="text-2xl font-bold text-cream/40">vs</span>

          {/* Rotated/mirrored shape */}
          <div className="flex flex-col items-center gap-2.5">
            <span className="text-xs text-cream/60 font-bold uppercase tracking-wider">
              Compare
            </span>
            <svg
              width="120"
              height="120"
              viewBox="0 0 100 100"
              className="rounded-2xl border-2 border-clay bg-ink/60 shadow-card"
            >
              <g
                transform={`rotate(${displayRotation}, 50, 50) ${shape.mirrored ? "scale(-1,1) translate(-100,0)" : ""}`}
              >
                <polygon
                  points={shape.points}
                  fill="#52b788"
                  stroke="#52b788"
                  strokeWidth="2"
                  opacity="0.9"
                />
              </g>
            </svg>
          </div>
        </div>

        <div className="flex gap-4 justify-center flex-wrap pt-2">
          <button
            type="button"
            onClick={() => answer(false)}
            className="px-7 py-3.5 min-h-[48px] min-w-[48px] rounded-xl bg-tea-confirm text-cream font-extrabold text-base hover:opacity-90 active:scale-95 active:opacity-90 transition shadow-md touch-manipulation flex items-center justify-center gap-2"
          >
            <span>🔄 Same (Rotated)</span>
          </button>
          <button
            type="button"
            onClick={() => answer(true)}
            className="px-7 py-3.5 min-h-[48px] min-w-[48px] rounded-xl bg-fire text-cream font-extrabold text-base hover:opacity-90 active:scale-95 active:opacity-90 transition shadow-md touch-manipulation flex items-center justify-center gap-2"
          >
            <span>🪞 Mirrored</span>
          </button>
        </div>
      </div>
    </GameShell>
  );
}
