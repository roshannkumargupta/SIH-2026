import { useState } from "react";
import { Brain, Award, CheckCircle2, Flame, History, TrendingUp } from "lucide-react";
import { GameCard } from "./GameCard";
import { GAME_REGISTRY, getGamesByCategory, ALL_CATEGORIES } from "../data/gameRegistry";
import { CATEGORY_LABELS } from "../types/game.types";
import { useGames } from "@/hooks/use-games";
import { useLanguage } from "@/context/LanguageContext";
import type { GameCategory } from "../types/game.types";

type Filter = "all" | GameCategory;

export function GameDashboard() {
  const [filter, setFilter] = useState<Filter>("all");
  const { summary, sessions } = useGames();
  const { t } = useLanguage();

  const displayed = filter === "all" ? GAME_REGISTRY : getGamesByCategory(filter);

  // Build per-game progress from sessions
  const progressMap = new Map<string, { bestLevel: number; lastPlayed: string }>();
  for (const s of sessions) {
    const existing = progressMap.get(s.game_id);
    if (!existing || s.level_achieved > existing.bestLevel) {
      progressMap.set(s.game_id, {
        bestLevel: s.level_achieved,
        lastPlayed: s.completed_at,
      });
    }
  }

  const categoryTranslationMap: Record<GameCategory, string> = {
    memory: t("games:memoryRecall"),
    logic: t("games:logicProblemSolving"),
    attention: t("games:attentionFocus"),
    speed: t("games:speedReaction"),
    spatial: t("games:spatialVisual"),
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="rounded-2xl border border-clay bg-surface p-6 sm:p-10 shadow-card">
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex size-16 sm:size-20 items-center justify-center rounded-2xl bg-sun text-ink shadow-sm shrink-0">
            <Brain size={40} />
          </span>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream">
              {t("games:centerTitle")}
            </h1>
            <p className="mt-1 text-cream/70 max-w-xl text-sm sm:text-base">
              {t("games:centerSubtitle")}
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-clay bg-ink/60 px-4 py-3 flex items-center gap-3">
              <Award size={22} className="text-sun shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase text-cream/50">
                  {t("games:totalSessions")}
                </p>
                <p className="font-display text-2xl font-bold text-cream">
                  {summary.total_sessions}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-clay bg-ink/60 px-4 py-3 flex items-center gap-3">
              <CheckCircle2 size={22} className="text-tea-confirm shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase text-cream/50">
                  {t("games:avgAccuracy")}
                </p>
                <p className="font-display text-2xl font-bold text-cream">
                  {Math.round(summary.average_accuracy)}%
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-clay bg-ink/60 px-4 py-3 flex items-center gap-3">
              <TrendingUp size={22} className="text-fire shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase text-cream/50">{t("games:avgScore")}</p>
                <p className="font-display text-2xl font-bold text-cream">
                  {Math.round(summary.average_score)}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-clay bg-ink/60 px-4 py-3 flex items-center gap-3">
              <Flame size={22} className="text-fire shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase text-cream/50">{t("games:gamesTried")}</p>
                <p className="font-display text-2xl font-bold text-cream">
                  {summary.total_sessions}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${
            filter === "all"
              ? "bg-sun text-ink border-sun"
              : "bg-surface text-cream border-clay hover:border-sun/50"
          }`}
        >
          {t("games:all")} ({GAME_REGISTRY.length})
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const count = getGamesByCategory(cat).length;
          const label = categoryTranslationMap[cat] || CATEGORY_LABELS[cat];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors capitalize ${
                filter === cat
                  ? "bg-sun text-ink border-sun"
                  : "bg-surface text-cream border-clay hover:border-sun/50"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayed.map((game) => {
          const prog = progressMap.get(game.id);
          return (
            <GameCard
              key={game.id}
              game={game}
              {...(prog?.bestLevel ? { bestLevel: prog.bestLevel } : {})}
              {...(prog?.lastPlayed ? { lastPlayed: prog.lastPlayed } : {})}
            />
          );
        })}
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="rounded-2xl border border-clay bg-surface p-6 sm:p-8 shadow-card">
          <div className="flex items-center gap-2 text-lg font-bold text-sun mb-4">
            <History size={20} /> {t("games:recentSessions", undefined) || "Recent Sessions"}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-clay text-cream/60">
                  <th className="pb-3 font-bold uppercase text-xs">
                    {t("games:game", undefined) || "Game"}
                  </th>
                  <th className="pb-3 font-bold uppercase text-xs">
                    {t("games:level", { level: 1, maxLevel: 1 }).split(" ")[0] || "Level"}
                  </th>
                  <th className="pb-3 font-bold uppercase text-xs">{t("games:score")}</th>
                  <th className="pb-3 font-bold uppercase text-xs">{t("games:accuracy")}</th>
                  <th className="pb-3 font-bold uppercase text-xs">{t("games:time")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clay/40">
                {sessions.slice(0, 8).map((s) => (
                  <tr key={s.id} className="text-cream">
                    <td className="py-3 font-bold capitalize">{s.game_id.replace(/-/g, " ")}</td>
                    <td className="py-3 text-cream/70">Lv {s.level_achieved}</td>
                    <td className="py-3 font-bold text-sun">{s.score}</td>
                    <td className="py-3 font-bold text-tea-confirm">{Math.round(s.accuracy)}%</td>
                    <td className="py-3 text-cream/70">{s.duration_seconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
