import { useEffect, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

const COLORS = ["red", "blue", "green", "yellow"] as const;
type Color = (typeof COLORS)[number];
const COLOR_CLASSES: Record<Color, string> = {
  red: "bg-red-500 hover:bg-red-600",
  blue: "bg-blue-500 hover:bg-blue-600",
  green: "bg-green-500 hover:bg-green-600",
  yellow: "bg-yellow-400 hover:bg-yellow-500",
};

export default function SimonSays({ level }: { level: number }) {
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerSeq, setPlayerSeq] = useState<Color[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [score, setScore] = useState(0);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const seqLength = Math.min(3 + level, 15);
  const speed = Math.max(800 - level * 50, 300);
  const target = Math.max(3, Math.ceil(level * 1.5));
  const { submitResult } = useGameSession();

  useEffect(() => {
    setSequence([]);
    setPlayerSeq([]);
    setScore(0);
    setIsPlaying(false);
    setIsPlayerTurn(false);
    setFeedback(null);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  }, [level]);

  const playSequence = async (seq: Color[]) => {
    setIsPlaying(true);
    setIsPlayerTurn(false);
    for (const c of seq) {
      await new Promise((r) => setTimeout(r, speed));
      setActiveColor(c);
      await new Promise((r) => setTimeout(r, speed / 2));
      setActiveColor(null);
    }
    setIsPlaying(false);
    setIsPlayerTurn(true);
  };

  const startGame = () => {
    const newSeq: Color[] = [];
    for (let i = 0; i < seqLength; i++) {
      newSeq.push(COLORS[Math.floor(Math.random() * COLORS.length)]!);
    }
    setSequence(newSeq);
    setPlayerSeq([]);
    setFeedback(null);
    playSequence(newSeq);
  };

  const handleColorClick = (c: Color) => {
    if (!isPlayerTurn || isPlaying) return;
    const nextPlayer = [...playerSeq, c];
    setPlayerSeq(nextPlayer);

    const idx = nextPlayer.length - 1;
    if (nextPlayer[idx] !== sequence[idx]) {
      setFeedback("wrong");
      setIsPlayerTurn(false);
      setTimeout(() => {
        setPlayerSeq([]);
        setFeedback(null);
        playSequence(sequence);
      }, 1200);
      return;
    }

    if (nextPlayer.length === sequence.length) {
      setFeedback("correct");
      setIsPlayerTurn(false);
      const newScore = score + 1;
      setScore(newScore);

      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "simon-says",
          gameType: "simon_says",
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
      } else if (newScore < target) {
        setTimeout(startGame, 1500);
      }
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
    sessionStart.current = Date.now();
  };

  const feedbackText =
    feedback === "correct"
      ? "✓ Correct sequence!"
      : feedback === "wrong"
        ? "✗ Mistake! Watch the sequence again…"
        : isPlaying
          ? "👀 Watch the flashing sequence carefully…"
          : isPlayerTurn
            ? `👆 Your turn! (${playerSeq.length} / ${sequence.length})`
            : null;

  return (
    <GameShell
      gameId="simon-says"
      level={level}
      score={score}
      targetScore={target}
      stats={[
        { label: "Sequence Length", value: sequence.length || seqLength, highlight: "sun" },
        { label: "Turn", value: isPlaying ? "Watching" : isPlayerTurn ? "Your Turn" : "Ready", highlight: isPlayerTurn ? "tea" : "cream" },
      ]}
      feedback={feedbackText}
      instructionHint="Watch the colors flash, then tap them in the exact same order"
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
      <div className="space-y-6 max-w-sm mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => handleColorClick(c)}
              disabled={!isPlayerTurn || isPlaying}
              className={`h-32 rounded-3xl font-black text-xl text-white capitalize shadow-card transition-all touch-manipulation select-none ${COLOR_CLASSES[c]} ${
                activeColor === c ? "ring-8 ring-white scale-90 brightness-150 shadow-2xl" : ""
              } ${
                !isPlayerTurn || isPlaying
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:scale-105 active:scale-95 active:brightness-125"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={startGame}
            disabled={isPlaying || isPlayerTurn}
            className="px-8 py-3.5 min-h-[48px] min-w-[48px] rounded-xl bg-sun text-ink font-black text-base hover:opacity-90 active:scale-95 disabled:opacity-40 transition shadow-md touch-manipulation"
          >
            {score === 0 && sequence.length === 0 ? "🎬 Start Round" : "🔄 Replay Sequence"}
          </button>
        </div>
      </div>
    </GameShell>
  );
}
