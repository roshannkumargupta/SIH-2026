import { useCallback, useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
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

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((pairCount / Math.max(pairCount, moves)) * 100))}
          accuracy={Math.min(100, Math.round((pairCount / Math.max(pairCount, moves)) * 100))}
          durationSeconds={endSecs.current}
          level={level}
          gameName="Card Matching"
          synced={synced}
          offline={offline}
          onPlayAgain={initializeGame}
        />
      </>
    );

  return (
    <div className="space-y-4">
      <div className="flex gap-4 justify-center text-sm font-bold text-cream/80">
        <span>
          Moves: <span className="text-sun">{moves}</span>
        </span>
        <span>
          Matched:{" "}
          <span className="text-tea-confirm">
            {matches}/{pairCount}
          </span>
        </span>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleCardClick(card.id)}
            disabled={card.isMatched || flippedCards.length === 2}
            className={`aspect-square rounded-xl text-2xl sm:text-3xl font-bold transition-all duration-300 border-2 shadow flex items-center justify-center
              ${
                card.isMatched
                  ? "border-tea-confirm bg-tea-confirm/20 opacity-60 scale-95"
                  : card.isFlipped
                    ? "border-sun bg-cream text-ink"
                    : "border-clay bg-ink/70 text-cream hover:border-sun/50 hover:scale-105 active:scale-95"
              }`}
            aria-label={card.isFlipped || card.isMatched ? card.value : `Card ${card.id + 1}`}
          >
            {card.isFlipped || card.isMatched ? card.value : "✦"}
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={initializeGame}
          className="px-5 py-2 rounded-xl border border-clay text-cream/80 text-sm hover:bg-clay transition"
        >
          🔄 New Game
        </button>
      </div>
    </div>
  );
}
