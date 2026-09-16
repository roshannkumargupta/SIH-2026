import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";

// Simple SVG shape generation for mental rotation
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

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((score / target) * 100))}
          accuracy={Math.min(100, Math.round((score / target) * 100))}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
          gameName="Mental Rotation"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            setShape(generateShape(level));
            sessionStart.current = Date.now();
          }}
        />
      </>
    );

  return (
    <div className="space-y-6 text-center">
      <p className="text-cream/50 text-xs uppercase font-bold">
        Score: {score}/{target}
      </p>
      <p className="text-cream/60 text-sm">
        Are these two shapes the same (just rotated) or is the right one mirrored?
      </p>

      <div className="flex items-center justify-center gap-8">
        {/* Reference shape */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-cream/50 font-bold">Reference</p>
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            className="rounded-xl border border-clay bg-ink/40"
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

        <span className="text-2xl text-cream/40">vs</span>

        {/* Rotated/mirrored shape */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-cream/50 font-bold">Compare</p>
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            className="rounded-xl border border-clay bg-ink/40"
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

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => answer(false)}
          className="px-6 py-3 rounded-xl bg-tea-confirm/80 text-cream font-bold text-lg hover:opacity-90 transition shadow"
        >
          🔄 Same (Rotated)
        </button>
        <button
          onClick={() => answer(true)}
          className="px-6 py-3 rounded-xl bg-fire/80 text-cream font-bold text-lg hover:opacity-90 transition shadow"
        >
          🪞 Mirrored
        </button>
      </div>
      {feedback && (
        <p
          className={`text-sm font-bold ${feedback.startsWith("✓") ? "text-tea-confirm" : "text-fire"}`}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
