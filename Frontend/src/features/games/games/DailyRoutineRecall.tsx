import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, RefreshCw } from "lucide-react";
import { GameShell } from "../components/GameShell";
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
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragStartPos = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const hasDragged = useRef<boolean>(false);

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
    setActiveDragIndex(null);
    setDragOverIndex(null);
    dragStartPos.current = null;
    hasDragged.current = false;
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

  // Touch-compatible Pointer Event Drag and Drop handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    if (submitted) return;
    dragStartPos.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    hasDragged.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    if (submitted || !dragStartPos.current || dragStartPos.current.pointerId !== e.pointerId)
      return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      if (!hasDragged.current) {
        hasDragged.current = true;
        setActiveDragIndex(index);
      }

      // Check which routine card is under pointer point
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const card = el?.closest("[data-routine-idx]");
      if (card) {
        const over = Number(card.getAttribute("data-routine-idx"));
        if (!isNaN(over) && over >= 0 && over < items.length) {
          setDragOverIndex(over);
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    if (!dragStartPos.current || dragStartPos.current.pointerId !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (
      hasDragged.current &&
      activeDragIndex !== null &&
      dragOverIndex !== null &&
      activeDragIndex !== dragOverIndex
    ) {
      const next = [...items];
      const moved = next.splice(activeDragIndex, 1)[0];
      if (moved) {
        next.splice(dragOverIndex, 0, moved);
        setItems(next);
        setMoves((m) => m + 1);
      }
    } else if (!hasDragged.current) {
      // Clean tap/click without dragging motion
      handleCardClick(index);
    }

    setActiveDragIndex(null);
    setDragOverIndex(null);
    dragStartPos.current = null;
    hasDragged.current = false;
  };

  const handlePointerCancel = () => {
    setActiveDragIndex(null);
    setDragOverIndex(null);
    dragStartPos.current = null;
    hasDragged.current = false;
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

  return (
    <GameShell
      gameId="daily-routine-recall"
      level={level}
      stats={[
        { label: "Moves", value: moves },
        { label: "Items", value: targetItems.length, highlight: "tea" },
      ]}
      instructionHint="Drag or tap cards to arrange activities in chronological order"
      completed={completed}
      results={{
        score: accuracy,
        accuracy: accuracy,
        durationSeconds: Math.round((Date.now() - startTime.current) / 1000),
        synced,
        offline,
      }}
      onPlayAgain={initGame}
    >
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
            const isBeingDragged = activeDragIndex === idx;
            const isDragTarget =
              dragOverIndex === idx && activeDragIndex !== null && activeDragIndex !== idx;
            const isCorrectPosition = submitted && targetItems[idx]?.id === item.id;
            const isWrongPosition = submitted && targetItems[idx]?.id !== item.id;

            return (
              <div
                key={item.id}
                data-routine-idx={idx}
                onPointerDown={(e) => handlePointerDown(e, idx)}
                onPointerMove={(e) => handlePointerMove(e, idx)}
                onPointerUp={(e) => handlePointerUp(e, idx)}
                onPointerCancel={handlePointerCancel}
                style={{ touchAction: activeDragIndex !== null ? "none" : "manipulation" }}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-grab active:cursor-grabbing select-none shadow-sm touch-manipulation active:scale-[0.99] ${
                  isBeingDragged
                    ? "border-sun bg-sun/30 ring-4 ring-sun/40 shadow-xl scale-[1.02] opacity-80 z-20"
                    : isDragTarget
                      ? "border-sun bg-sun/15 ring-2 ring-sun/60 scale-[1.01]"
                      : isSelected
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

                {/* Accessible Earlier/Later nudge buttons (min 44x44px elderly accessibility) */}
                {!submitted && (
                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveCard(idx, -1);
                      }}
                      disabled={idx === 0}
                      className="size-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-clay bg-ink hover:bg-clay/40 text-cream/80 disabled:opacity-30 disabled:cursor-not-allowed transition touch-manipulation active:scale-90"
                      title={t("games:moveEarlier")}
                      aria-label={t("games:moveEarlier")}
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveCard(idx, 1);
                      }}
                      disabled={idx === items.length - 1}
                      className="size-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-clay bg-ink hover:bg-clay/40 text-cream/80 disabled:opacity-30 disabled:cursor-not-allowed transition touch-manipulation active:scale-90"
                      title={t("games:moveLater")}
                      aria-label={t("games:moveLater")}
                    >
                      <ArrowRight size={18} />
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
                    className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl border transition touch-manipulation active:scale-95 ${
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
            className="flex items-center gap-2 px-4 py-3 min-h-[44px] min-w-[44px] rounded-xl border border-clay text-cream/70 hover:text-cream hover:bg-clay/30 transition text-sm font-semibold touch-manipulation active:scale-95"
          >
            <RefreshCw size={16} />
            Reset
          </button>

          <button
            type="button"
            onClick={checkSequence}
            disabled={submitted}
            className="px-7 py-3 min-h-[44px] rounded-xl bg-sun text-ink font-extrabold text-base hover:opacity-90 active:scale-95 transition shadow-card flex items-center gap-2 touch-manipulation"
          >
            ✓ {t("games:checkOrder")}
          </button>
        </div>
      </div>
    </GameShell>
  );
}
