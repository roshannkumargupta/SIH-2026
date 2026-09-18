import { useEffect, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

export type NBackProps = { level: number };

const randItem = (level: number): string => {
  const sets = ["ABC", "ABCD", "ABCDE", "ABCDEF"];
  const letters = sets[Math.min(level - 1, 3)] ?? "ABCDEF";
  return letters[Math.floor(Math.random() * letters.length)]!;
};

export default function NBack({ level }: NBackProps) {
  const n = Math.min(Math.max(1, level <= 9 ? level : 2), 10);
  const [sequence, setSequence] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saved = useRef(false);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const startTime = useRef<number>(0);
  const target = Math.max(3, level * 2);
  const { submitResult } = useGameSession();

  useEffect(() => {
    setSequence([]);
    setScore(0);
    setRunning(false);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [level]);

  const step = () => setSequence((s) => [...s, randItem(level)]);

  const start = () => {
    setSequence([]);
    setScore(0);
    setRunning(true);
    startTime.current = Date.now();
    step();
    intervalRef.current = setInterval(step, Math.max(1500 - level * 200, 400));
  };

  const stop = () => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const pressMatch = () => {
    const curIdx = sequence.length - 1;
    if (curIdx - n >= 0 && sequence[curIdx] === sequence[curIdx - n]) {
      setScore((s) => s + 1);
    } else if (level > 2) {
      setScore((s) => Math.max(0, s - 1));
    }
  };

  useEffect(() => {
    if (!saved.current && score >= target) {
      saved.current = true;
      const accuracy = Math.min(100, Math.round((score / target) * 100));
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      stop();
      submitResult({
        gameId: "n-back",
        gameType: "n_back",
        score: accuracy,
        accuracy,
        durationSeconds: Math.max(5, duration),
        level,
        difficulty: String(level),
      }).then((r) => {
        setSynced(r.success);
        setOffline(r.offline);
        setCompleted(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, target]);

  const finalAccuracy = Math.min(100, Math.round((score / target) * 100));
  const finalDuration = Math.round((Date.now() - startTime.current) / 1000);

  const resetGame = () => {
    setCompleted(false);
    saved.current = false;
    setScore(0);
    setSequence([]);
    setSynced(false);
    setOffline(false);
  };

  return (
    <GameShell
      gameId="n-back"
      level={level}
      score={score}
      targetScore={target}
      stats={[
        { label: "N-Steps", value: `${n} back`, highlight: "sun" },
        { label: "Status", value: running ? "Running" : "Paused", highlight: running ? "tea" : "cream" },
      ]}
      instructionHint={`Press "Match" when the letter matches the one shown ${n} step${n > 1 ? "s" : ""} ago`}
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
      <div className="space-y-6 max-w-md mx-auto text-center">
        <div className="mx-auto w-44 h-44 flex items-center justify-center rounded-3xl border-4 border-sun/60 bg-ink shadow-card">
          <span className="font-display text-8xl font-black text-sun animate-pulse">
            {sequence[sequence.length - 1] ?? "—"}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={start}
            disabled={running}
            className="px-6 py-3.5 min-h-[48px] min-w-[48px] rounded-xl bg-tea-confirm text-cream font-black text-lg disabled:opacity-40 hover:opacity-90 active:scale-95 active:opacity-90 transition shadow-md touch-manipulation flex items-center justify-center gap-2"
          >
            ▶ Start
          </button>
          <button
            type="button"
            onClick={stop}
            disabled={!running}
            className="px-6 py-3.5 min-h-[48px] min-w-[48px] rounded-xl bg-clay text-cream font-black text-lg disabled:opacity-40 hover:bg-clay/80 active:scale-95 active:bg-clay/60 transition shadow-md touch-manipulation flex items-center justify-center gap-2"
          >
            ⏸ Pause
          </button>
          <button
            type="button"
            onClick={pressMatch}
            disabled={!running}
            className="px-8 py-3.5 min-h-[48px] min-w-[48px] rounded-xl bg-sun text-ink font-black text-lg disabled:opacity-40 hover:opacity-90 active:scale-95 active:opacity-90 transition shadow-md touch-manipulation flex items-center justify-center gap-2"
          >
            ✨ Match!
          </button>
        </div>
      </div>
    </GameShell>
  );
}
