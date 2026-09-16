import { Link } from "@tanstack/react-router";
import { Play, Clock, Star } from "lucide-react";
import type { GameMetadata } from "../types/game.types";
import { CATEGORY_LABELS, CATEGORY_COLORS, DOMAIN_LABELS } from "../types/game.types";
import { useLanguage } from "@/context/LanguageContext";

interface GameCardProps {
  game: GameMetadata;
  bestLevel?: number;
  bestScore?: number;
  lastPlayed?: string;
}

export function GameCard({ game, bestLevel, bestScore, lastPlayed }: GameCardProps) {
  const { t, language } = useLanguage();
  const categoryStyle = CATEGORY_COLORS[game.category] ?? "bg-clay/30 text-cream/70 border-clay";
  const targetLevel = Math.min(
    game.maxLevel,
    bestLevel !== undefined && bestLevel > 0 ? bestLevel + 1 : 1,
  );

  const categoryTranslationMap: Record<string, string> = {
    memory: t("games:memoryRecall"),
    logic: t("games:logicProblemSolving"),
    attention: t("games:attentionFocus"),
    speed: t("games:speedReaction"),
    spatial: t("games:spatialVisual"),
  };

  const categoryText = categoryTranslationMap[game.category] || CATEGORY_LABELS[game.category];

  return (
    <Link
      to={`/games/${game.id}` as never}
      search={{ level: String(targetLevel) } as never}
      className="group flex flex-col gap-4 rounded-2xl border border-clay bg-surface p-5 shadow-card transition-all duration-200 hover:border-sun/50 hover:shadow-card-active hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
      aria-label={`Play ${game.name}`}
    >
      {/* Top row: icon + category + best level badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-12 items-center justify-center rounded-xl bg-ink/70 text-2xl border border-clay shrink-0">
          {game.icon}
        </span>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${categoryStyle}`}
          >
            {categoryText}
          </span>
          {bestLevel !== undefined && bestLevel > 0 && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-tea-confirm/20 text-tea-confirm border border-tea-confirm/40 font-bold">
              <Star size={9} /> Lv {bestLevel}
            </span>
          )}
        </div>
      </div>

      {/* Game title + description */}
      <div className="flex-1">
        <h3 className="font-display text-lg font-bold text-cream leading-tight">{game.name}</h3>
        <p className="mt-1.5 text-xs text-cream/60 leading-relaxed line-clamp-2">
          {game.description}
        </p>
      </div>

      {/* Cognitive domains */}
      <div className="flex flex-wrap gap-1">
        {game.cognitiveDomains.slice(0, 2).map((d) => (
          <span
            key={d}
            className="text-[10px] px-2 py-0.5 rounded-full bg-clay/40 text-cream/60 border border-clay/60 font-medium"
          >
            {DOMAIN_LABELS[d]}
          </span>
        ))}
      </div>

      {/* Footer: duration + last played + CTA */}
      <div className="flex items-center justify-between gap-2 border-t border-clay/60 pt-3">
        <div className="flex items-center gap-3 text-xs text-cream/50">
          <span className="flex items-center gap-1">
            <Clock size={11} /> ~{game.estimatedMinutes}m
          </span>
          {lastPlayed && (
            <span>
              {new Date(lastPlayed).toLocaleDateString(language || "en-IN", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1.5 rounded-lg bg-sun px-3 py-1.5 text-xs font-extrabold text-ink group-hover:bg-sun/90 transition shrink-0">
          <Play size={11} fill="currentColor" /> {t("games:playGame")}
        </span>
      </div>
    </Link>
  );
}
