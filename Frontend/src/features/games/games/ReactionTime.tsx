import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
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
  const target = Math.max(5, level + 2);
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
    const delay = Math.random() * 3000 + 1000;
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
      if (newAttempts.length >= target) {
        const avg = newAttempts.reduce((a, b) => a + b, 0) / newAttempts.length;
        if (!saved.current && avg <= avgThreshold) {
          saved.current = true;
          const score = Math.min(100, Math.round((avgThreshold / avg) * 50));
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
    }
  };

  const avgTime =
    attempts.length > 0 ? attempts.reduce((a, b) => a + b, 0) / attempts.length : null;

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, avgTime ? Math.round((avgThreshold / avgTime) * 50) : 60)}
          accuracy={Math.min(100, avgTime ? Math.round((avgThreshold / avgTime) * 50) : 60)}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
          gameName="Reaction Time"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setAttempts([]);
            saved.current = false;
            setPhase("ready");
            setSynced(false);
            setOffline(false);
            sessionStart.current = Date.now();
          }}
        />
      </>
    );

  const bgClass =
    phase === "ready"
      ? "bg-clay/50 hover:bg-clay"
      : phase === "wait"
        ? "bg-fire/80 animate-pulse"
        : phase === "click"
          ? "bg-tea-confirm"
          : "bg-surface";

  return (
    <div className="space-y-5">
      <div className="flex gap-3 justify-center text-sm font-bold text-cream/70 flex-wrap">
        <span>
          Attempts:{" "}
          <span className="text-sun">
            {attempts.length}/{target}
          </span>
        </span>
        <span>Target: &lt;{avgThreshold}ms</span>
        {avgTime && (
          <span>
            Your Avg: <span className="text-tea-confirm">{avgTime.toFixed(0)}ms</span>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleClick}
        className={`w-full h-56 rounded-2xl flex flex-col items-center justify-center text-cream text-3xl font-black transition-all duration-150 shadow-card border-4 border-clay cursor-pointer ${bgClass}`}
        aria-label="Reaction target — click when green"
      >
        {phase === "ready" && (
          <>
            <span className="text-5xl mb-3">👆</span>
            <span>Click to Start</span>
          </>
        )}
        {phase === "wait" && (
          <>
            <span className="text-5xl mb-3">⏳</span>
            <span>Wait for it…</span>
          </>
        )}
        {phase === "click" && (
          <>
            <span className="text-5xl mb-3 animate-bounce">🎯</span>
            <span>CLICK NOW!</span>
          </>
        )}
        {phase === "result" && reactionTime && (
          <>
            <span className="text-5xl mb-3">⚡</span>
            <span className="text-sun font-display text-5xl">{reactionTime}ms</span>
          </>
        )}
      </button>

      {phase === "result" && !completed && (
        <div className="flex justify-center">
          <button
            onClick={() => setPhase("ready")}
            className="px-6 py-3 rounded-xl bg-sun text-ink font-bold hover:opacity-90 transition"
          >
            {attempts.length < target ? "🔄 Next Round" : "🔄 Try Again"}
          </button>
        </div>
      )}

      {attempts.length >= target && !completed && (
        <div className="rounded-xl border border-clay bg-ink/60 p-4 text-center text-cream text-sm">
          Average: <span className="font-bold text-sun">{avgTime?.toFixed(0)}ms</span>
          {avgTime && avgTime > avgThreshold && (
            <p className="mt-1 text-cream/60">Target: &lt;{avgThreshold}ms — keep practising!</p>
          )}
        </div>
      )}

      {attempts.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center">
          {attempts.slice(-5).map((t, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-lg border border-clay bg-ink/60 text-cream/80 text-sm font-bold"
            >
              {t}ms
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
