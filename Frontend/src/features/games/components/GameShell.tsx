import { cloneElement, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, X } from "lucide-react";
import { NavigationHeader } from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { HowToPlay } from "./HowToPlay";
import { LevelSelector } from "./LevelSelector";
import type { GameMetadata } from "../types/game.types";
import { GAME_INSTRUCTIONS } from "../data/gameInstructions";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { gamesApi } from "@/api/games.api";
import type { AdaptiveLevelResponse } from "@/types/api";

interface GameShellProps {
  game: GameMetadata;
  children: ReactNode;
  /** Current level (1-based) */
  level: number;
  showLevelSelector?: boolean;
}

export function GameShell({ game, children, level, showLevelSelector = true }: GameShellProps) {
  const instructions = GAME_INSTRUCTIONS[game.id];
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [adaptiveInfo, setAdaptiveInfo] = useState<AdaptiveLevelResponse | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const autoAppliedRef = useRef(false);

  // Fetch adaptive difficulty recommendation on mount
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    gamesApi
      .getAdaptiveLevel(user.id, game.id)
      .then((res) => {
        if (!isMounted) return;
        setAdaptiveInfo(res);

        // Auto-apply if caregiver enabled AI difficulty and not yet applied
        if (
          res.ai_difficulty_enabled &&
          !autoAppliedRef.current &&
          res.recommended_level !== level &&
          res.recommended_level >= 1 &&
          res.recommended_level <= game.maxLevel
        ) {
          autoAppliedRef.current = true;
          void navigate({
            to: `/games/${game.id}` as never,
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
  }, [user?.id, game.id, game.maxLevel, level, navigate]);

  const applySuggestedLevel = (targetLevel: number) => {
    void navigate({
      to: `/games/${game.id}` as never,
      search: { level: String(targetLevel) } as never,
      replace: true,
    });
    setIsDismissed(true);
  };

  // Determine which level to pass down to children (guarantees dynamic scaling)
  const effectiveLevel = level;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavigationHeader />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-10 space-y-5">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="cream" size="touch">
            <Link to="/games">
              <ArrowLeft size={18} className="mr-2" /> {t("common:allGames")}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            {/* AI Adjusted or Suggestion Badge */}
            {adaptiveInfo && !isDismissed && (
              <>
                {adaptiveInfo.ai_difficulty_enabled && adaptiveInfo.recommended_level === level ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sun/50 bg-sun/15 text-sun text-xs font-semibold shadow-sm animate-fadeIn">
                    <Sparkles size={14} className="text-sun shrink-0" />
                    <span>✨ AI Adjusted for You: {adaptiveInfo.rationale}</span>
                    <button
                      type="button"
                      onClick={() => setIsDismissed(true)}
                      className="ml-1 text-sun/70 hover:text-sun transition"
                      title="Dismiss notice"
                      aria-label="Dismiss notice"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : adaptiveInfo.recommended_level !== level ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-tea-confirm/50 bg-tea-confirm/15 text-tea-confirm text-xs font-semibold shadow-sm animate-fadeIn">
                    <Sparkles size={14} className="text-tea-confirm shrink-0" />
                    <span>
                      AI Suggests Level {adaptiveInfo.recommended_level}: {adaptiveInfo.rationale}
                    </span>
                    <button
                      type="button"
                      onClick={() => applySuggestedLevel(adaptiveInfo.recommended_level)}
                      className="ml-1.5 px-2.5 py-0.5 rounded-md bg-tea-confirm text-ink text-[11px] font-extrabold hover:opacity-90 transition cursor-pointer"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDismissed(true)}
                      className="ml-0.5 text-tea-confirm/70 hover:text-tea-confirm transition"
                      title="Dismiss suggestion"
                      aria-label="Dismiss suggestion"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : null}
              </>
            )}

            {showLevelSelector && <LevelSelector gameId={game.id} maxLevel={game.maxLevel} />}
          </div>
        </div>

        {/* Game Header */}
        <div className="rounded-2xl border border-clay bg-surface p-5 sm:p-7 shadow-card flex items-center gap-5">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-sun/20 text-4xl shrink-0">
            {game.icon}
          </span>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-cream">{game.name}</h1>
            <p className="text-cream/70 text-sm mt-1 max-w-lg">{game.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {game.cognitiveDomains.slice(0, 3).map((d) => (
                <span
                  key={d}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-clay bg-clay/30 text-cream/70 font-semibold capitalize"
                >
                  {d.replace(/_/g, " ")}
                </span>
              ))}
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-sun/40 bg-sun/10 text-sun font-semibold">
                {t("games:level", { level: effectiveLevel, maxLevel: game.maxLevel })}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {instructions && (
          <HowToPlay
            title={instructions.title}
            instructions={instructions.instructions}
            {...(instructions.tips ? { tips: instructions.tips } : {})}
          />
        )}

        {/* Game Area — clone element with effectiveLevel to ensure dynamic scaling */}
        <div className="rounded-2xl border border-clay bg-surface shadow-card overflow-hidden">
          <div className="p-4 sm:p-8">
            {isValidElement(children)
              ? cloneElement(children as React.ReactElement<{ level?: number }>, {
                  level: effectiveLevel,
                })
              : children}
          </div>
        </div>
      </main>
    </div>
  );
}
