import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

export type CardMatchingProps = { level: number };

type Card = { id: number; value: string; isFlipped: boolean; isMatched: boolean };

const SYMBOLS = [
  "🎮",
  "🎯",
  "🎨",
  "🎭",
  "🎪",
  "🎬",
  "🎵",
  "🎸",
  "🎹",
  "🎺",
  "🎻",
  "🎲",
  "🎰",
  "🎳",
  "⚽",
  "🏀",
  "🏈",
  "⚾",
  "🎾",
  "🏐",
];
const gridSize = (l: number) => (l <= 2 ? 4 : l <= 5 ? 6 : 8);

export default function CardMatching({ level }: CardMatchingProps) {
  const size = gridSize(level);
  const pairCount = (size * size) / 2;
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const startTime = useRef(Date.now());
  const endSecs = useRef(0);
  const { submitResult } = useGameSession();

  const initializeGame = useCallback(() => {
    const symbols = SYMBOLS.slice(0, pairCount);
    const shuffled = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    setCards(shuffled.map((value, id) => ({ id, value, isFlipped: false, isMatched: false })));
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    startTime.current = Date.now();
  }, [pairCount]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards[id]?.isFlipped || cards[id]?.isMatched) return;
    const newFlipped = [...flippedCards, id];
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)));
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newFlipped as [number, number];
      if (cards[first]?.value === cards[second]?.value) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === first || c.id === second ? { ...c, isMatched: true } : c)),
          );
          setMatches((m) => {
            const next = m + 1;
            if (next === pairCount && !saved.current) {
              saved.current = true;
              endSecs.current = Math.round((Date.now() - startTime.current) / 1000);
              const scoreVal = Math.max(
                10,
                Math.round(100000 / (endSecs.current * 1000 + (moves + 1) * 1000)),
              );
              const acc = Math.min(
                100,
                Math.round((pairCount / Math.max(pairCount, moves + 1)) * 100),
              );
              submitResult({
                gameId: "card-matching",
                gameType: "card_matching",
                score: Math.min(100, scoreVal),
                accuracy: acc,
                durationSeconds: Math.max(5, endSecs.current),
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
          setFlippedCards([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === first || c.id === second ? { ...c, isFlipped: false } : c)),
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const finalScore = Math.min(100, Math.round((pairCount / Math.max(pairCount, moves || 1)) * 100));
  const finalAccuracy = finalScore;
  const finalDuration = endSecs.current || Math.round((Date.now() - startTime.current) / 1000);

  return (
    <GameShell
      gameId="card-matching"
      level={level}
      stats={[
        { label: "Moves", value: moves },
        { label: "Matched", value: `${matches} / ${pairCount}`, highlight: "tea" },
      ]}
      instructionHint="Tap cards to flip them and find matching pairs"
      completed={completed}
      results={{
        score: finalScore,
        accuracy: finalAccuracy,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={initializeGame}
    >
      <div className="space-y-6">
        <div
          className="grid gap-2 overflow-x-auto p-1 max-w-lg mx-auto"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(44px, 1fr))` }}
        >
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(card.id)}
              disabled={card.isMatched || flippedCards.length === 2}
              className={`aspect-square min-w-[44px] min-h-[44px] rounded-xl text-2xl sm:text-3xl font-bold transition-all duration-200 border-2 shadow flex items-center justify-center touch-manipulation select-none
                ${
                  card.isMatched
                    ? "border-tea-confirm bg-tea-confirm/20 opacity-60 scale-95"
                    : card.isFlipped
                      ? "border-sun bg-cream text-ink"
                      : "border-clay bg-ink/70 text-cream hover:border-sun/50 hover:scale-105 active:scale-90 active:border-sun"
                }`}
              aria-label={card.isFlipped || card.isMatched ? card.value : `Card ${card.id + 1}`}
            >
              {card.isFlipped || card.isMatched ? card.value : "✦"}
            </button>
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={initializeGame}
            className="min-h-[48px] min-w-[48px] px-6 py-2.5 rounded-xl border border-clay text-cream/90 text-sm font-bold hover:bg-clay active:scale-95 active:bg-clay/50 transition touch-manipulation flex items-center justify-center gap-2 shadow-sm"
          >
            <span>🔄 New Deal</span>
          </button>
        </div>
      </div>
    </GameShell>
  );
}
