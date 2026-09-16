import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, RefreshCw } from "lucide-react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useLanguage } from "@/context/LanguageContext";

export interface DailyRoutineRecallProps {
  level: number;
}

interface RoutineItem {
  id: string;
  key: string;
  icon: string;
  order: number; // 0-indexed chronological position in the day
  isDistractor?: boolean;
}

// Full 8-step chronological sequence for a healthy daily routine
const ALL_ROUTINE_ITEMS: RoutineItem[] = [
  { id: "waking_up", key: "wakingUp", icon: "🌅", order: 0 },
  { id: "brushing_teeth", key: "brushingTeeth", icon: "🪥", order: 1 },
  { id: "morning_tea_pills", key: "morningTeaPills", icon: "🍵", order: 2 },
  { id: "morning_walk", key: "morningWalk", icon: "🚶", order: 3 },
  { id: "lunch", key: "lunch", icon: "🍲", order: 4 },
  { id: "afternoon_rest", key: "afternoonRest", icon: "🛋️", order: 5 },
  { id: "dinner", key: "dinner", icon: "🍽️", order: 6 },
  { id: "sleep", key: "sleep", icon: "🛏️", order: 7 },
];

// Distractor activities that do not belong in the structured daily sequence
const DISTRACTOR_ITEMS: RoutineItem[] = [
  { id: "midnight_snack", key: "distractorSnack", icon: "🥪", order: 99, isDistractor: true },
  { id: "late_night_tv", key: "distractorNews", icon: "📺", order: 99, isDistractor: true },
];

/**
 * Difficulty scaling:
 * - Levels 1-2: 4 cards with clear spread across the day
 * - Levels 3-4: 6 cards
 * - Levels 5-6: Full 8 cards
 * - Levels 7-8: 8 target slots chosen from 9 available cards (including 1 distractor)
 * - Levels 9-10: 8 target slots chosen from 10 available cards (including 2 distractors)
 */
function getLevelConfig(level: number) {
  if (level <= 2) {
    const selected = [
      ALL_ROUTINE_ITEMS[0]!, // Waking up
      ALL_ROUTINE_ITEMS[3]!, // Morning walk
      ALL_ROUTINE_ITEMS[4]!, // Lunch
      ALL_ROUTINE_ITEMS[7]!, // Sleep
    ];
    return { targetItems: selected, distractors: [] };
  }
  if (level <= 4) {
    const selected = [
      ALL_ROUTINE_ITEMS[0]!, // Waking up
      ALL_ROUTINE_ITEMS[1]!, // Brushing teeth
      ALL_ROUTINE_ITEMS[3]!, // Morning walk
      ALL_ROUTINE_ITEMS[4]!, // Lunch
      ALL_ROUTINE_ITEMS[6]!, // Dinner
      ALL_ROUTINE_ITEMS[7]!, // Sleep
    ];
    return { targetItems: selected, distractors: [] };
  }
  if (level <= 6) {
    return { targetItems: [...ALL_ROUTINE_ITEMS], distractors: [] };
  }
  if (level <= 8) {
    return {
      targetItems: [...ALL_ROUTINE_ITEMS],
      distractors: [DISTRACTOR_ITEMS[0]!],
    };
  }
  return {
    targetItems: [...ALL_ROUTINE_ITEMS],
    distractors: [...DISTRACTOR_ITEMS],
  };
}

export default function DailyRoutineRecall({ level }: DailyRoutineRecallProps) {
  const { t } = useLanguage();
  const { submitResult } = useGameSession();

  // Target items that belong in the solution in chronological order
  const [targetItems, setTargetItems] = useState<RoutineItem[]>([]);
  // Currently arranged items in the sequencing tray
  const [items, setItems] = useState<RoutineItem[]>([]);
  // Spare cards not yet placed (for levels with distractors / extra cards)
  const [poolItems, setPoolItems] = useState<RoutineItem[]>([]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);

  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);

  const saved = useRef(false);
  const startTime = useRef(Date.now());
  const dragItemIndex = useRef<number | null>(null);

  const initGame = useCallback(() => {
    const { targetItems: targets, distractors } = getLevelConfig(level);
    setTargetItems(targets);

    if (distractors.length === 0) {
      // Shuffled standard cards
      let shuffled = [...targets].sort(() => Math.random() - 0.5);
      // Ensure it doesn't start in perfectly sorted order
      if (shuffled.every((item, idx) => item.id === targets[idx]?.id)) {
        shuffled = [shuffled[1]!, shuffled[0]!, ...shuffled.slice(2)];
      }
      setItems(shuffled);
      setPoolItems([]);
    } else {
      // With distractors: place all cards in pool or partial tray
      const allPool = [...targets, ...distractors].sort(() => Math.random() - 0.5);
      // Initially place first N in tray, remainder in spare pool
      setItems(allPool.slice(0, targets.length));
      setPoolItems(allPool.slice(targets.length));
    }

    setSelectedIndex(null);
    setSelectedPoolId(null);
    setMoves(0);
    setSubmitted(false);
    setCompleted(false);
    setAccuracy(0);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    startTime.current = Date.now();
  }, [level]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Tap-based card swap or tray selection
  const handleCardClick = (index: number) => {
    if (submitted) return;

    // If a pool item was selected, swap it with this tray position
    if (selectedPoolId) {
      const poolItem = poolItems.find((p) => p.id === selectedPoolId);
      if (poolItem) {
        const currentTrayItem = items[index];
        if (currentTrayItem) {
          const nextItems = [...items];
          nextItems[index] = poolItem;
          setItems(nextItems);

          const nextPool = poolItems.map((p) => (p.id === selectedPoolId ? currentTrayItem : p));
          setPoolItems(nextPool);
          setMoves((m) => m + 1);
        }
      }
      setSelectedPoolId(null);
      setSelectedIndex(null);
      return;
    }

    // Standard card-to-card swap in tray
    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      // Swap positions
      const next = [...items];
      const temp = next[selectedIndex]!;
      next[selectedIndex] = next[index]!;
      next[index] = temp;
      setItems(next);
      setSelectedIndex(null);
      setMoves((m) => m + 1);
    }
  };

  const handlePoolCardClick = (poolItem: RoutineItem) => {
    if (submitted) return;

    if (selectedIndex !== null) {
      // Swap tray item at selectedIndex with this pool item
      const trayItem = items[selectedIndex];
      if (trayItem) {
        const nextItems = [...items];
        nextItems[selectedIndex] = poolItem;
        setItems(nextItems);

        const nextPool = poolItems.map((p) => (p.id === poolItem.id ? trayItem : p));
        setPoolItems(nextPool);
        setMoves((m) => m + 1);
      }
      setSelectedIndex(null);
      setSelectedPoolId(null);
    } else {
      setSelectedPoolId((prev) => (prev === poolItem.id ? null : poolItem.id));
    }
  };

  // Step-by-step reordering buttons (Earlier / Later)
  const moveCard = (index: number, direction: -1 | 1) => {
    if (submitted) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const next = [...items];
    const temp = next[index]!;
    next[index] = next[targetIdx]!;
    next[targetIdx] = temp;
    setItems(next);
    setSelectedIndex(null);
    setMoves((m) => m + 1);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    if (submitted) return;
    dragItemIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (submitted || dragItemIndex.current === null) return;
    const dragIdx = dragItemIndex.current;
    if (dragIdx === dropIndex) return;

    const next = [...items];
    const item = next.splice(dragIdx, 1)[0]!;
    next.splice(dropIndex, 0, item);
    setItems(next);
    dragItemIndex.current = null;
    setSelectedIndex(null);
    setMoves((m) => m + 1);
  };

  // Evaluation and submission
  const checkSequence = () => {
    if (submitted || saved.current) return;
    setSubmitted(true);

    const total = targetItems.length;
    let correct = 0;

    // Check each position in the user's arranged sequence
    items.forEach((item, idx) => {
      const expected = targetItems[idx];
      if (expected && item.id === expected.id) {
        correct += 1;
      }
    });

    const acc = Math.round((correct / total) * 100);
    const scoreVal = acc;
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    setAccuracy(acc);

    saved.current = true;
    submitResult({
      gameId: "daily-routine-recall",
      gameType: "daily_routine_recall",
      score: scoreVal,
      accuracy: acc,
      durationSeconds: Math.max(5, duration),
      level,
      difficulty: String(level),
      metrics: {
        correctCount: correct,
        totalItems: total,
        moves,
      },
    }).then((res) => {
      setSynced(res.success);
      setOffline(res.offline);
      setCompleted(true);
    });
  };

  if (completed) {
    const total = targetItems.length;
    const correct = Math.round((accuracy / 100) * total);
    return (
      <>
        <CelebrationAnimation show={accuracy >= 60} />
        <GameResults
          score={accuracy}
          accuracy={accuracy}
          durationSeconds={Math.round((Date.now() - startTime.current) / 1000)}
          level={level}
          gameName={t("games:dailyRoutineRecallTitle")}
          synced={synced}
          offline={offline}
          onPlayAgain={initGame}
        />
      </>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header and prompt */}
      <div className="text-center space-y-1">
        <p className="text-cream/80 text-sm font-medium">{t("games:swapTip")}</p>
        <p className="text-xs text-cream/50">🌅 Morning ➔ ☀️ Midday ➔ 🌙 Bedtime</p>
      </div>

      {/* Target sequencing tray */}
      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrectPosition = submitted && targetItems[idx]?.id === item.id;
          const isWrongPosition = submitted && targetItems[idx]?.id !== item.id;

          return (
            <div
              key={item.id}
              draggable={!submitted}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
              onClick={() => handleCardClick(idx)}
              className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer select-none shadow-sm ${
                isSelected
                  ? "border-sun bg-sun/20 shadow-md ring-2 ring-sun/30 scale-[1.01]"
                  : isCorrectPosition
                    ? "border-tea-confirm bg-tea-confirm/15"
                    : isWrongPosition
                      ? "border-fire/60 bg-fire/10"
                      : "border-clay bg-ink/60 hover:border-sun/40 hover:bg-clay/20"
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(idx);
                }
              }}
              aria-label={`Step ${idx + 1}: ${t(`games:${item.key}`)}`}
            >
              {/* Order badge & emoji & name */}
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="flex size-8 items-center justify-center rounded-xl bg-clay/50 text-cream/80 font-bold text-sm shrink-0">
                  {idx + 1}
                </span>
                <span className="text-2xl sm:text-3xl shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
                <div className="truncate">
                  <p className="font-bold text-cream text-base sm:text-lg truncate">
                    {t(`games:${item.key}`)}
                  </p>
                  {isSelected && (
                    <span className="text-[11px] text-sun font-semibold">
                      ● {t("games:selectedCard")} — tap another card to swap
                    </span>
                  )}
                  {isCorrectPosition && (
                    <span className="text-[11px] text-tea-confirm font-semibold flex items-center gap-1">
                      <CheckCircle size={12} /> Correct spot
                    </span>
                  )}
                </div>
              </div>

              {/* Accessible Earlier/Later nudge buttons */}
              {!submitted && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCard(idx, -1);
                    }}
                    disabled={idx === 0}
                    className="p-2 rounded-xl border border-clay bg-ink hover:bg-clay/40 text-cream/80 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title={t("games:moveEarlier")}
                    aria-label={t("games:moveEarlier")}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCard(idx, 1);
                    }}
                    disabled={idx === items.length - 1}
                    className="p-2 rounded-xl border border-clay bg-ink hover:bg-clay/40 text-cream/80 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title={t("games:moveLater")}
                    aria-label={t("games:moveLater")}
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Spare Cards Pool (for higher difficulty levels with distractors) */}
      {poolItems.length > 0 && (
        <div className="rounded-2xl border border-clay/60 bg-ink/40 p-4 space-y-2">
          <p className="text-xs font-semibold text-cream/60">
            Available Extras (tap to swap into your daily sequence):
          </p>
          <div className="flex flex-wrap gap-2">
            {poolItems.map((poolItem) => {
              const isSelected = selectedPoolId === poolItem.id;
              return (
                <button
                  key={poolItem.id}
                  type="button"
                  onClick={() => handlePoolCardClick(poolItem)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition ${
                    isSelected
                      ? "border-sun bg-sun/20 text-sun font-bold"
                      : "border-clay bg-ink text-cream/80 hover:border-sun/40"
                  }`}
                >
                  <span className="text-xl">{poolItem.icon}</span>
                  <span className="text-sm font-medium">{t(`games:${poolItem.key}`)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={initGame}
          disabled={submitted}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-clay text-cream/70 hover:text-cream hover:bg-clay/30 transition text-sm font-semibold"
        >
          <RefreshCw size={16} />
          Reset
        </button>

        <button
          type="button"
          onClick={checkSequence}
          disabled={submitted}
          className="px-7 py-3 rounded-xl bg-sun text-ink font-extrabold text-base hover:opacity-90 active:scale-95 transition shadow-card flex items-center gap-2"
        >
          ✓ {t("games:checkOrder")}
        </button>
      </div>
    </div>
  );
}
