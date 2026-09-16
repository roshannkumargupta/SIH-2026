import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
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

  if (completed) {
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((score / target) * 100))}
          accuracy={Math.min(100, Math.round((score / target) * 100))}
          durationSeconds={Math.round((Date.now() - startTime.current) / 1000)}
          level={level}
          gameName="N-Back"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            saved.current = false;
            setScore(0);
            setSequence([]);
            setSynced(false);
            setOffline(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-cream/70 text-sm">
          {level === 10 ? "🎯 Dual N-Back Mode!" : `Remember ${n} step${n > 1 ? "s" : ""} back!`}
        </p>
        <div className="mt-4 mx-auto w-40 h-40 flex items-center justify-center rounded-2xl border-4 border-sun bg-ink shadow-card">
          <span className="font-display text-8xl font-black text-sun animate-pulse">
            {sequence[sequence.length - 1] ?? "—"}
          </span>
        </div>
        <div className="mt-4 text-cream/70 text-sm font-semibold">
          Score: <span className="text-sun font-bold text-xl">{score}</span> / {target}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={start}
          disabled={running}
          className="px-6 py-3 rounded-xl bg-tea-confirm text-cream font-bold text-lg disabled:opacity-40 hover:opacity-90 transition shadow"
        >
          ▶ Start
        </button>
        <button
          onClick={stop}
          disabled={!running}
          className="px-6 py-3 rounded-xl bg-clay text-cream font-bold text-lg disabled:opacity-40 hover:bg-clay/80 transition shadow"
        >
          ⏸ Stop
        </button>
        <button
          onClick={pressMatch}
          className="px-6 py-3 rounded-xl bg-sun text-ink font-bold text-lg hover:opacity-90 transition shadow"
        >
          ✨ Match!
        </button>
      </div>

      <div className="rounded-xl border border-sun/30 bg-sun/10 px-4 py-3 text-center text-sm text-sun font-semibold">
        Press "Match" when the current letter matches the one shown {n} step{n > 1 ? "s" : ""} ago.
      </div>
    </div>
  );
}
