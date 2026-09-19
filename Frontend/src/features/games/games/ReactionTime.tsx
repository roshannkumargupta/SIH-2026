import { useEffect, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

export type ReactionTimeProps = { level: number };

export default function ReactionTime({ level }: ReactionTimeProps) {
  const [phase, setPhase] = useState<"ready" | "wait" | "click" | "result">("ready");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const startTime = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStart = useRef(Date.now());
  const target = Math.max(3, Math.min(5, level + 2));
  const avgThreshold = Math.max(500 - level * 30, 200);
  const { submitResult } = useGameSession();

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  useEffect(() => {
    setAttempts([]);
    setCompleted(false);
    saved.current = false;
    setPhase("ready");
    sessionStart.current = Date.now();
  }, [level]);

  const startTest = () => {
    setPhase("wait");
    const delay = Math.random() * 2000 + 1000;
    timeoutRef.current = setTimeout(() => {
      startTime.current = Date.now();
      setPhase("click");
    }, delay);
  };

  const handleClick = () => {
    if (phase === "ready") {
      startTest();
      return;
    }
    if (phase === "wait") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase("ready");
      return;
    }
    if (phase === "click") {
      const time = Date.now() - startTime.current;
      setReactionTime(time);
      const newAttempts = [...attempts, time];
      setAttempts(newAttempts);
      setPhase("result");
      if (newAttempts.length >= target && !saved.current) {
        saved.current = true;
        const avg = newAttempts.reduce((a, b) => a + b, 0) / newAttempts.length;
        const score = Math.max(
          10,
          Math.min(100, Math.round((avgThreshold / Math.max(avgThreshold * 0.5, avg)) * 100)),
        );
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "reaction-time",
          gameType: "reaction_time",
          score,
          accuracy: score,
          durationSeconds: Math.max(5, dur),
          level,
          difficulty: String(level),
        }).then((r) => {
          setSynced(r.success);
          setOffline(r.offline);
          setCompleted(true);
        });
      }
    }
  };

  const avgTime =
    attempts.length > 0 ? attempts.reduce((a, b) => a + b, 0) / attempts.length : null;

  const finalScore = Math.max(
    10,
    Math.min(
      100,
      avgTime ? Math.round((avgThreshold / Math.max(avgThreshold * 0.5, avgTime)) * 100) : 60,
    ),
  );
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);

  const resetGame = () => {
    setCompleted(false);
    setAttempts([]);
    saved.current = false;
    setPhase("ready");
    setSynced(false);
    setOffline(false);
    sessionStart.current = Date.now();
  };

  const bgClass =
    phase === "ready"
      ? "bg-clay/50 hover:bg-clay"
      : phase === "wait"
        ? "bg-fire/80 animate-pulse"
        : phase === "click"
          ? "bg-tea-confirm"
          : "bg-surface";

  return (
    <GameShell
      gameId="reaction-time"
      level={level}
      stats={[
        { label: "Attempts", value: `${attempts.length} / ${target}` },
        { label: "Goal Speed", value: `<${avgThreshold}ms` },
        ...(avgTime
          ? [{ label: "Your Average", value: `${avgTime.toFixed(0)}ms`, highlight: "tea" as const }]
          : []),
      ]}
      instructionHint="Wait for the box to turn green, then click as fast as you can"
      completed={completed}
      results={{
        score: finalScore,
        accuracy: finalScore,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={resetGame}
      onNextLevel={
        level < 10
          ? () => {
              window.location.href = `/games/reaction-time?level=${level + 1}`;
            }
          : undefined
      }
    >
      <div className="space-y-6 max-w-lg mx-auto">
        <button
          type="button"
          onClick={handleClick}
          className={`w-full h-60 rounded-3xl flex flex-col items-center justify-center text-cream text-3xl font-black transition-all duration-150 shadow-card border-4 border-clay cursor-pointer touch-manipulation select-none active:scale-[0.99] active:brightness-95 ${bgClass}`}
          aria-label="Reaction target — click when green"
        >
          {phase === "ready" && (
            <>
              <span className="text-6xl mb-3">👆</span>
              <span className="font-display">Tap to Begin</span>
            </>
          )}
          {phase === "wait" && (
            <>
              <span className="text-6xl mb-3 animate-spin">⏳</span>
              <span className="font-display">Wait for Green…</span>
            </>
          )}
          {phase === "click" && (
            <>
              <span className="text-6xl mb-3 animate-bounce">🎯</span>
              <span className="font-display">CLICK NOW!</span>
            </>
          )}
          {phase === "result" && reactionTime && (
            <>
              <span className="text-5xl mb-2">⚡</span>
              <span className="text-sun font-display text-6xl font-black">{reactionTime}ms</span>
            </>
          )}
        </button>

        {phase === "result" && !completed && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setPhase("ready")}
              className="px-8 py-3.5 min-h-[48px] min-w-[48px] rounded-xl bg-sun text-ink font-black text-base hover:opacity-90 active:scale-95 active:opacity-90 transition shadow-md touch-manipulation flex items-center justify-center gap-2 cursor-pointer"
            >
              🔄 Next Attempt ({attempts.length + 1}/{target})
            </button>
          </div>
        )}

        {attempts.length > 0 && (
          <div className="flex gap-2 flex-wrap justify-center pt-2">
            {attempts.slice(-5).map((t, i) => (
              <span
                key={i}
                className="px-3.5 py-1.5 rounded-xl border border-clay bg-ink/70 text-cream/90 text-sm font-bold shadow-sm"
              >
                {t}ms
              </span>
            ))}
          </div>
        )}
      </div>
    </GameShell>
  );
}
