import { Link } from "@tanstack/react-router";
import { Play, Clock, Star } from "lucide-react";
import type { GameMetadata, GameCategory } from "../types/game.types";
import { CATEGORY_LABELS, DOMAIN_LABELS } from "../types/game.types";
import { useLanguage } from "@/context/LanguageContext";

interface GameCardProps {
  game: GameMetadata;
  bestLevel?: number;
  bestScore?: number;
  lastPlayed?: string;
}

const CATEGORY_GRADIENTS: Record<GameCategory, string> = {
  memory: "from-[#1b2f48] via-[#142337] to-[#0e1826]",
  logic: "from-[#352549] via-[#241733] to-[#150d1e]",
  attention: "from-[#173a2e] via-[#102920] to-[#0a1b14]",
  speed: "from-[#3d2c16] via-[#2a1d0d] to-[#181006]",
  spatial: "from-[#1c3344] via-[#132330] to-[#0c1720]",
};

export function GameCard({ game, bestLevel, lastPlayed }: GameCardProps) {
  const { t, language } = useLanguage();
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

  // Difficulty pill per spec: Easy=green, Medium=amber, Hard=red
  const difficultyLabel = targetLevel <= 3 ? "Easy" : targetLevel <= 6 ? "Medium" : "Hard";
  const difficultyStyle =
    targetLevel <= 3
      ? "bg-[#6FAF9A]/15 text-[#6FAF9A] border-[#6FAF9A]/30"
      : targetLevel <= 6
        ? "bg-[#E0A23B]/15 text-[#E0A23B] border-[#E0A23B]/30"
        : "bg-[#E85D6B]/15 text-[#E85D6B] border-[#E85D6B]/30";

  const gradient = CATEGORY_GRADIENTS[game.category] || "from-[#1b2f48] to-[#0e1826]";

  return (
    <Link
      to={`/games/${game.id}` as never}
      search={{ level: String(targetLevel) } as never}
      className="group flex flex-col justify-between rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-5 sm:p-6 shadow-md hover:border-white/15 hover:bg-[#152335] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FAF9A] relative overflow-hidden"
      aria-label={`Play ${game.name}`}
    >
      <div>
        {/* Tall illustrated top banner (140-180px height per spec) */}
        <div
          className={`w-full h-40 sm:h-44 rounded-xl bg-gradient-to-br ${gradient} border border-white/5 flex items-center justify-center relative overflow-hidden mb-4`}
        >
          {/* Subtle glowing center aura */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-24 rounded-full bg-white/5 blur-xl group-hover:scale-125 transition-transform" />
          </div>

          <span className="text-5xl sm:text-6xl filter drop-shadow-lg group-hover:scale-110 transition-transform relative z-10 select-none">
            {game.icon}
          </span>

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#0A1420]/80 backdrop-blur-md border border-white/10 text-[#8A99A8] font-bold uppercase tracking-wider">
              {categoryText}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${difficultyStyle}`}
            >
              {difficultyLabel}
            </span>
          </div>

          {bestLevel !== undefined && bestLevel > 0 && (
            <div className="absolute bottom-2.5 left-3 z-10">
              <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-[#6FAF9A]/15 text-[#6FAF9A] border border-[#6FAF9A]/30 font-bold backdrop-blur-md">
                <Star size={11} fill="currentColor" /> Lv {bestLevel}
              </span>
            </div>
          )}
        </div>

        {/* Game title + description */}
        <div className="space-y-1.5 flex-1">
          <h3 className="font-display text-lg sm:text-xl font-bold text-[#E8ECEF] group-hover:text-[#6FAF9A] transition">
            {game.name}
          </h3>
          <p className="text-sm text-[#8A99A8] leading-relaxed line-clamp-2">{game.description}</p>
        </div>

        {/* Cognitive domains */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {game.cognitiveDomains.slice(0, 2).map((d) => (
            <span
              key={d}
              className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 text-[#8A99A8] border border-white/8 font-medium"
            >
              {DOMAIN_LABELS[d]}
            </span>
          ))}
        </div>
      </div>

      {/* Footer: duration + last played + CTA */}
      <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-4 mt-4">
        <div className="flex items-center gap-2.5 text-xs text-[#8A99A8]">
          <span className="flex items-center gap-1">
            <Clock size={13} /> ~{game.estimatedMinutes}m
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

        {/* Clearly visible circular play button bottom-right with primary teal-green */}
        <span className="flex size-10 items-center justify-center rounded-full bg-[#6FAF9A] text-[#0A1420] shadow-md group-hover:scale-105 transition-transform shrink-0">
          <Play size={16} className="fill-current ml-0.5" />
        </span>
      </div>
    </Link>
  );
}
