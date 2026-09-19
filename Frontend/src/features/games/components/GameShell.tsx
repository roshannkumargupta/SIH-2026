import { cloneElement, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, X, Trophy, RotateCcw, Home, CloudOff, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HowToPlay } from "./HowToPlay";
import { LevelSelector } from "./LevelSelector";
import { CelebrationAnimation } from "./CelebrationAnimation";
import type { GameMetadata } from "../types/game.types";
import { GAME_INSTRUCTIONS } from "../data/gameInstructions";
import { GAME_MAP } from "../data/gameRegistry";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { gamesApi } from "@/api/games.api";
import type { AdaptiveLevelResponse } from "@/types/api";
import { formatDuration } from "../utils/gameMetrics";

export interface GameShellStat {
  label: string;
  value: string | number;
  highlight?: "sun" | "tea" | "fire" | "cream" | boolean | undefined;
  icon?: ReactNode | undefined;
}

export interface GameShellResult {
  score: number;
  accuracy: number;
  durationSeconds: number;
  synced?: boolean | undefined;
  offline?: boolean | undefined;
  maxLevel?: number | undefined;
  gameName?: string | undefined;
  metrics?: Record<string, unknown> | undefined;
}

export interface GameShellProps {
  /** Explicit game metadata or game ID string to resolve from GAME_REGISTRY */
  game?: GameMetadata | undefined;
  gameId?: string | undefined;
  children: ReactNode;
  /** Current level (1-based) */
  level: number;
  showLevelSelector?: boolean | undefined;

  /** Standardized In-Game Heads-Up Display (HUD) */
  score?: number | undefined;
  targetScore?: number | undefined;
  accuracy?: number | undefined;
  stats?: GameShellStat[] | undefined;
  feedback?: string | null | undefined;
  instructionHint?: string | undefined;

  /** End-of-Session Summary Screen */
  completed?: boolean | undefined;
  results?: GameShellResult | undefined;
  onPlayAgain?: (() => void) | undefined;
  onNextLevel?: (() => void) | undefined;
}

export function GameShell({
  game,
  gameId,
  children,
  level,
  showLevelSelector = true,
  score,
  targetScore,
  accuracy,
  stats,
  feedback,
  instructionHint,
  completed = false,
  results,
  onPlayAgain,
  onNextLevel,
}: GameShellProps) {
  const resolvedGame: GameMetadata =
    game ??
    (gameId ? GAME_MAP.get(gameId) : undefined) ?? {
      id: gameId ?? "game",
      name: "Cognitive Game",
      description: "Cognitive stimulation exercise.",
      category: "memory",
      maxLevel: 10,
      estimatedMinutes: 4,
      cognitiveDomains: ["memory"],
      clinicalDomains: ["memory"],
      icon: "🧠",
    };

  const instructions = GAME_INSTRUCTIONS[resolvedGame.id];
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [adaptiveInfo, setAdaptiveInfo] = useState<AdaptiveLevelResponse | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const autoAppliedRef = useRef(false);

  // Fetch adaptive difficulty recommendation on mount
  useEffect(() => {
    if (!user?.id || !resolvedGame.id) return;

    let isMounted = true;
    gamesApi
      .getAdaptiveLevel(user.id, resolvedGame.id)
      .then((res) => {
        if (!isMounted) return;
        setAdaptiveInfo(res);

        // Auto-apply if caregiver enabled AI difficulty and not yet applied
        if (
          res.ai_difficulty_enabled &&
          !autoAppliedRef.current &&
          res.recommended_level !== level &&
          res.recommended_level >= 1 &&
          res.recommended_level <= resolvedGame.maxLevel
        ) {
          autoAppliedRef.current = true;
          void navigate({
            to: `/games/${resolvedGame.id}` as never,
            search: { level: String(res.recommended_level) } as never,
            replace: true,
          });
        }
      })
      .catch(() => {
        // Graceful fallback: manual level remains intact
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, resolvedGame.id, resolvedGame.maxLevel, level, navigate]);

  const applySuggestedLevel = (targetLevel: number) => {
    void navigate({
      to: `/games/${resolvedGame.id}` as never,
      search: { level: String(targetLevel) } as never,
      replace: true,
    });
    setIsDismissed(true);
  };

  const effectiveLevel = level;
  const maxLevel = results?.maxLevel ?? resolvedGame.maxLevel;
  const isWon = (results?.accuracy ?? accuracy ?? 0) >= 60 || (results?.score ?? score ?? 0) >= 50;
  const hasNextLevel = isWon && level < maxLevel;

  const handleNextLevelClick = () => {
    if (onNextLevel) {
      onNextLevel();
    } else {
      void navigate({
        to: `/games/${resolvedGame.id}` as never,
        search: { level: String(level + 1) } as never,
        replace: true,
      });
    }
  };

  // Encouragement text for elderly users
  const getEncouragement = (acc: number, sc: number) => {
    if (acc >= 90 || sc >= 90) {
      return {
        title: t("games:outstanding", { defaultValue: "Outstanding!" }),
        message: "Brilliant mental agility and focus! Your brain is in top gear.",
      };
    }
    if (acc >= 70 || sc >= 70) {
      return {
        title: t("games:greatJob", { defaultValue: "Great Job!" }),
        message: "You are making wonderful progress. Excellent cognitive recall!",
      };
    }
    if (acc >= 50 || sc >= 50) {
      return {
        title: t("games:goodEffort", { defaultValue: "Good Effort!" }),
        message: "Consistent practice every day helps keep your mind sharp and active.",
      };
    }
    return {
      title: t("games:wellTried", { defaultValue: "Well Tried!" }),
      message: "Every exercise strengthens your neural connections. Let's try again!",
    };
  };

  const currentResult = results ?? (completed ? {
    score: score ?? 0,
    accuracy: accuracy ?? 100,
    durationSeconds: 30,
    synced: false,
    offline: false,
  } : undefined);

  const encouragement = currentResult ? getEncouragement(currentResult.accuracy, currentResult.score) : null;
  const hasHud = score !== undefined || accuracy !== undefined || (stats && stats.length > 0) || instructionHint || feedback;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:px-8 sm:py-8 space-y-5 font-sans">
      {/* Top bar with Standardized, Elderly-Accessible Exit Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          asChild
          variant="outline"
          size="touch"
          className="min-h-[46px] px-5 text-sm font-bold text-[#E8ECEF] bg-[#121D2B] border border-white/8 hover:bg-[#152335] active:scale-95 shadow-sm touch-manipulation rounded-full flex items-center gap-2.5"
        >
          <Link to="/games">
            <ArrowLeft size={18} className="stroke-[2.5] text-[#6FAF9A]" />
            <span>{t("common:allGames", { defaultValue: "Exit to Games" })}</span>
          </Link>
        </Button>

          <div className="flex flex-wrap items-center gap-3">
            {/* AI Adjusted or Suggestion Badge */}
            {adaptiveInfo && !isDismissed && (
              <>
                {adaptiveInfo.ai_difficulty_enabled && adaptiveInfo.recommended_level === level ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-300 text-xs font-semibold shadow-xs animate-fadeIn">
                    <Sparkles size={14} className="text-amber-400 shrink-0" />
                    <span>✨ AI Adjusted for You: {adaptiveInfo.rationale}</span>
                    <button
                      type="button"
                      onClick={() => setIsDismissed(true)}
                      className="ml-1 text-amber-300 hover:text-amber-100 transition p-1 min-h-[44px] min-w-[44px] inline-flex items-center justify-center touch-manipulation"
                      title="Dismiss notice"
                      aria-label="Dismiss notice"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : adaptiveInfo.recommended_level !== level ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#6FAF9A]/30 bg-[#6FAF9A]/15 text-[#6FAF9A] text-xs font-semibold shadow-xs animate-fadeIn">
                    <Sparkles size={14} className="text-[#6FAF9A] shrink-0" />
                    <span>
                      AI Suggests Level {adaptiveInfo.recommended_level}: {adaptiveInfo.rationale}
                    </span>
                    <button
                      type="button"
                      onClick={() => applySuggestedLevel(adaptiveInfo.recommended_level)}
                      className="ml-1.5 px-3 py-1 rounded-full bg-[#6FAF9A] text-[#0A1420] text-xs font-bold hover:bg-[#5E9E8A] active:scale-95 transition cursor-pointer touch-manipulation min-h-[44px] inline-flex items-center justify-center shadow-xs"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDismissed(true)}
                      className="ml-0.5 text-[#6FAF9A] hover:text-white transition p-1 min-h-[44px] min-w-[44px] inline-flex items-center justify-center touch-manipulation"
                      title="Dismiss suggestion"
                      aria-label="Dismiss suggestion"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : null}
              </>
            )}

            {showLevelSelector && (
              <LevelSelector gameId={resolvedGame.id} maxLevel={resolvedGame.maxLevel} />
            )}
          </div>
        </div>

      {/* Standardized Game Identity Header */}
      <div className="p-5 sm:p-7 rounded-3xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md shadow-md flex items-center gap-5">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-white/5 text-4xl shrink-0 border border-white/8 shadow-xs">
          {resolvedGame.icon}
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#E8ECEF] truncate">
            {resolvedGame.name}
          </h1>
          <p className="text-[#8A99A8] text-sm mt-1 max-w-xl">
            {resolvedGame.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {resolvedGame.cognitiveDomains.slice(0, 3).map((d) => (
              <span
                key={d}
                className="text-[11px] px-2.5 py-0.5 rounded-full border border-white/8 bg-white/5 text-[#8A99A8] font-semibold capitalize"
              >
                {d.replace(/_/g, " ")}
              </span>
            ))}
            <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-[#6FAF9A]/30 bg-[#6FAF9A]/15 text-[#6FAF9A] font-bold">
              {t("games:level", { level: effectiveLevel, maxLevel: resolvedGame.maxLevel })}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Instructions */}
      {instructions && !completed && (
        <HowToPlay
          title={instructions.title}
          instructions={instructions.instructions}
          {...(instructions.tips ? { tips: instructions.tips } : {})}
        />
      )}

      {/* Main Game Stage Card */}
      <div className="rounded-3xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md shadow-md overflow-hidden">
        {/* Standardized In-Game Status HUD Bar */}
        {!completed && hasHud && (
          <div className="border-b border-white/8 bg-[#0A1420]/80 px-5 py-3.5 sm:px-7 flex flex-wrap items-center justify-between gap-3 font-sans">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                {/* Standard Score Badge */}
                {score !== undefined && (
                  <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-[#121D2B] px-3.5 py-1.5 shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A99A8]">
                      {t("games:score", { defaultValue: "Score" })}
                    </span>
                    <span className="font-display text-xl sm:text-2xl font-black text-[#E0A23B]">
                      {score}
                      {targetScore !== undefined && (
                        <span className="text-[#8A99A8] text-base font-normal"> / {targetScore}</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Standard Accuracy Badge */}
                {accuracy !== undefined && (
                  <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-[#121D2B] px-3.5 py-1.5 shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A99A8]">
                      {t("games:accuracy", { defaultValue: "Accuracy" })}
                    </span>
                    <span className="font-display text-xl sm:text-2xl font-black text-[#6FAF9A]">
                      {Math.round(accuracy)}%
                    </span>
                  </div>
                )}

                {/* Dynamic Game-Specific Stats Badges */}
                {stats?.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-2xl border border-white/8 bg-[#121D2B] px-3.5 py-1.5 shadow-xs"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A99A8]">
                      {st.label}
                    </span>
                    <span
                      className={`font-display text-lg sm:text-xl font-black ${
                        st.highlight === "tea"
                          ? "text-[#6FAF9A]"
                          : st.highlight === "fire"
                            ? "text-[#E85D6B]"
                            : st.highlight === "sun"
                              ? "text-[#E0A23B]"
                              : "text-[#E8ECEF]"
                      }`}
                    >
                      {st.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Feedback and instruction status */}
              <div className="flex items-center gap-2 ml-auto">
                {feedback && (
                  <div
                    className={`text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-full border animate-fadeIn flex items-center gap-1.5 ${
                      feedback.startsWith("✓") ||
                      feedback.toLowerCase().includes("correct") ||
                      feedback.toLowerCase().includes("great")
                        ? "bg-[#6FAF9A]/20 border-[#6FAF9A]/40 text-[#6FAF9A]"
                        : "bg-[#E85D6B]/20 border-[#E85D6B]/40 text-[#E85D6B]"
                    }`}
                  >
                    {feedback}
                  </div>
                )}
                {instructionHint && !feedback && (
                  <span className="text-xs sm:text-sm text-[#E8ECEF] font-medium hidden sm:inline-block bg-white/5 border border-white/10 px-3.5 py-1 rounded-full shadow-xs">
                    {instructionHint}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Game Canvas OR Unified End-of-Session Summary Screen */}
          <div className="p-4 sm:p-8">
            {completed && currentResult ? (
              <>
                <CelebrationAnimation show={currentResult.accuracy >= 60 || currentResult.score >= 50} />
                <div className="animate-in fade-in zoom-in-95 duration-300 rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center max-w-lg mx-auto text-[#E8ECEF]">
                  <div className="flex size-20 items-center justify-center rounded-full bg-[#E0A23B]/15 text-[#E0A23B] mb-4 shadow-sm">
                    <Trophy size={40} />
                  </div>

                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#E8ECEF] mb-1">
                    {encouragement?.title ?? t("games:greatJob", { defaultValue: "Great Job!" })}
                  </h2>
                  <p className="text-[#8A99A8] text-sm max-w-sm mb-2 font-medium">
                    {encouragement?.message}
                  </p>
                  <p className="text-[#8A99A8] text-xs mb-6">
                    {currentResult.gameName ?? resolvedGame.name} · {t("games:level", { level, maxLevel })}
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 w-full mb-6">
                    <div className="rounded-2xl border border-white/8 bg-[#0A1420] py-4 px-2 shadow-xs">
                      <p className="text-xs font-bold uppercase text-[#8A99A8] mb-1">
                        {t("games:score", { defaultValue: "Score" })}
                      </p>
                      <p className="font-display text-3xl font-bold text-[#E0A23B]">
                        {currentResult.score}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-[#0A1420] py-4 px-2 shadow-xs">
                      <p className="text-xs font-bold uppercase text-[#8A99A8] mb-1">
                        {t("games:accuracy", { defaultValue: "Accuracy" })}
                      </p>
                      <p className="font-display text-3xl font-bold text-[#6FAF9A]">
                        {Math.round(currentResult.accuracy)}%
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-[#0A1420] py-4 px-2 shadow-xs">
                      <p className="text-xs font-bold uppercase text-[#8A99A8] mb-1">
                        {t("games:time", { defaultValue: "Time" })}
                      </p>
                      <p className="font-display text-3xl font-bold text-[#E8ECEF]">
                        {formatDuration(currentResult.durationSeconds)}
                      </p>
                    </div>
                  </div>

                  {/* Sync Status Badge */}
                  {currentResult.offline ? (
                    <div className="flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800 mb-5 w-full justify-center">
                      <CloudOff size={16} className="text-rose-600 shrink-0" />
                      <span>{t("games:resultSavedLocally", { defaultValue: "Saved locally (will sync online)" })}</span>
                    </div>
                  ) : currentResult.synced ? (
                    <div className="flex items-center gap-2 rounded-full border border-[#6FAF9A]/30 bg-[#6FAF9A]/10 text-[#6FAF9A] px-4 py-2 text-sm text-emerald-800 mb-5 w-full justify-center">
                      <CheckCircle2 size={16} className="text-[#6FAF9A] shrink-0" />
                      <span>{t("games:performanceRecorded", { defaultValue: "Performance securely recorded" })}</span>
                    </div>
                  ) : null}

                  {/* Large Accessible Action Buttons */}
                  <div className="flex flex-col gap-3 w-full">
                    {hasNextLevel && (
                      <Button
                        onClick={handleNextLevelClick}
                        variant="default"
                        size="touch"
                        className="w-full min-h-[50px] text-base font-bold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 touch-manipulation rounded-full flex items-center justify-center gap-2"
                      >
                        <span>{t("games:nextLevel", { next: level + 1, defaultValue: `Next Level (${level + 1})` })}</span>
                        <ArrowRight size={20} className="stroke-[2.5]" />
                      </Button>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      {onPlayAgain && (
                        <Button
                          onClick={onPlayAgain}
                          variant="outline"
                          size="touch"
                          className="flex-1 min-h-[48px] text-sm font-semibold text-[#E8ECEF] bg-[#0A1420] border-white/10 hover:bg-white/5 active:scale-95 touch-manipulation rounded-full flex items-center justify-center gap-2"
                        >
                          <RotateCcw size={18} className="stroke-[2.5]" />
                          <span>{t("games:playAgain", { defaultValue: "Play Again" })}</span>
                        </Button>
                      )}
                      <Button
                        asChild
                        variant="ghost"
                        size="touch"
                        className="flex-1 min-h-[48px] border border-white/10 bg-[#0A1420] text-[#E8ECEF] hover:bg-white/5 active:scale-95 touch-manipulation text-sm font-semibold rounded-full flex items-center justify-center gap-2"
                      >
                        <Link to="/games">
                          <Home size={18} className="stroke-[2.5]" />
                          <span>{t("common:allGames", { defaultValue: "All Games" })}</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : isValidElement(children) ? (
              cloneElement(children as React.ReactElement<{ level?: number }>, {
                level: effectiveLevel,
              })
            ) : (
              children
            )}
          </div>
        </div>
    </div>
  );
}
