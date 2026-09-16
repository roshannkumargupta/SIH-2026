import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
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
    const seq: Color[] = Array.from(
      { length: seqLength },
      () => COLORS[Math.floor(Math.random() * COLORS.length)]!,
    );
    setSequence(seq);
    setPlayerSeq([]);
    setFeedback(null);
    void playSequence(seq);
  };

  const handleColorClick = (color: Color) => {
    if (!isPlayerTurn || isPlaying) return;
    const newSeq = [...playerSeq, color];
    setPlayerSeq(newSeq);
    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 200);

    const idx = newSeq.length - 1;
    if (newSeq[idx] !== sequence[idx]) {
      setIsPlayerTurn(false);
      setPlayerSeq([]);
      setFeedback("wrong");
      setTimeout(() => {
        setFeedback(null);
        void playSequence(sequence);
      }, 1500);
      return;
    }
    if (newSeq.length === sequence.length) {
      const newScore = score + 1;
      setScore(newScore);
      setIsPlayerTurn(false);
      setPlayerSeq([]);
      setFeedback("correct");
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

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((score / target) * 100))}
          accuracy={Math.min(100, Math.round((score / target) * 100))}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
          gameName="Simon Says"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            sessionStart.current = Date.now();
          }}
        />
      </>
    );

  return (
    <div className="space-y-5">
      <div className="flex gap-4 justify-center text-sm font-bold text-cream/70">
        <span>
          Round:{" "}
          <span className="text-sun">
            {score}/{target}
          </span>
        </span>
        <span>
          Sequence length: <span className="text-cream">{seqLength}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => handleColorClick(c)}
            disabled={!isPlayerTurn || isPlaying}
            className={`h-28 rounded-2xl font-bold text-lg text-white capitalize shadow-card transition-all ${COLOR_CLASSES[c]} ${activeColor === c ? "ring-8 ring-white scale-90 brightness-150" : ""} ${!isPlayerTurn || isPlaying ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {isPlaying && (
        <p className="text-center text-cream/70 text-sm animate-pulse">👀 Watch the sequence…</p>
      )}
      {isPlayerTurn && (
        <p className="text-center text-sun text-sm font-bold">
          👆 Your turn! ({playerSeq.length}/{sequence.length})
        </p>
      )}
      {feedback && (
        <p
          className={`text-center text-sm font-bold ${feedback === "correct" ? "text-tea-confirm" : "text-fire"}`}
        >
          {feedback === "correct" ? "✅ Perfect! Next round…" : "❌ Wrong! Watch again…"}
        </p>
      )}

      <div className="flex justify-center">
        <button
          onClick={startGame}
          disabled={isPlaying || isPlayerTurn}
          className="px-6 py-3 rounded-xl bg-sun text-ink font-bold hover:opacity-90 disabled:opacity-40 transition"
        >
          {score === 0 ? "🎬 Start Game" : "🔄 New Round"}
        </button>
      </div>
    </div>
  );
}
