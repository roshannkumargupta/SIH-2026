import { useState } from "react";
import { Brain, Award, CheckCircle2, Flame, History, TrendingUp } from "lucide-react";
import { GameCard } from "./GameCard";
import { GAME_REGISTRY, getGamesByCategory, ALL_CATEGORIES } from "../data/gameRegistry";
import { CATEGORY_LABELS } from "../types/game.types";
import { useGames } from "@/hooks/use-games";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useLanguage } from "@/context/LanguageContext";
import type { GameCategory } from "../types/game.types";

type Filter = "all" | GameCategory;

export function GameDashboard() {
  const [filter, setFilter] = useState<Filter>("all");
  const { summary, sessions = [] } = useGames();
  const { progressMap } = useGameProgress();
  const { t } = useLanguage();

  const displayed = filter === "all" ? GAME_REGISTRY : getGamesByCategory(filter);

  const categoryTranslationMap: Record<GameCategory, string> = {
    memory: t("games:memoryRecall"),
    logic: t("games:logicProblemSolving"),
    attention: t("games:attentionFocus"),
    speed: t("games:speedReaction"),
    spatial: t("games:spatialVisual"),
  };

  return (
    <div className="space-y-8">
      {/* Hero Header: Dark Navy Ambient Glass Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-[#13283E] via-[#0F2032] to-[#0A1420] p-6 sm:p-9 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-[#6FAF9A]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-20 size-64 rounded-full bg-[#2DD4BF]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-[#6FAF9A] text-[#0A1420] shadow-md shrink-0">
              <Brain size={32} />
            </span>
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#E8ECEF]">
                {t("games:centerTitle")}
              </h1>
              <p className="mt-1 text-[#8A99A8] max-w-xl text-sm sm:text-base font-medium">
                {t("games:centerSubtitle")}
              </p>
            </div>
          </div>

          {/* Summary Stats with Large Prominent Numbers */}
          {summary && (
            <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-4 flex items-center gap-3.5 shadow-md">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#E0A23B]/15 text-[#E0A23B] shrink-0">
                  <Award size={22} />
                </span>
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#E8ECEF]">
                    {summary.total_sessions}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A99A8]">
                    {t("games:totalSessions")}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-4 flex items-center gap-3.5 shadow-md">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#6FAF9A]/15 text-[#6FAF9A] shrink-0">
                  <CheckCircle2 size={22} />
                </span>
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#6FAF9A]">
                    {Math.round(summary.average_accuracy)}%
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A99A8]">
                    {t("games:avgAccuracy")}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-4 flex items-center gap-3.5 shadow-md">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#4DA3E0]/15 text-[#4DA3E0] shrink-0">
                  <TrendingUp size={22} />
                </span>
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#E8ECEF]">
                    {Math.round(summary.average_score)}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A99A8]">
                    {t("games:avgScore")}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-4 flex items-center gap-3.5 shadow-md">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#E85D6B]/15 text-[#E85D6B] shrink-0">
                  <Flame size={22} />
                </span>
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#E8ECEF]">
                    {summary.total_sessions}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A99A8]">
                    {t("games:gamesTried")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            filter === "all"
              ? "bg-[#6FAF9A] text-[#0A1420] border-[#6FAF9A] shadow-md"
              : "bg-[#121D2B] text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-[#152335] border-white/8 shadow-sm"
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
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all capitalize cursor-pointer ${
                filter === cat
                  ? "bg-[#6FAF9A] text-[#0A1420] border-[#6FAF9A] shadow-md"
                  : "bg-[#121D2B] text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-[#152335] border-white/8 shadow-sm"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 text-base font-bold text-[#6FAF9A] mb-5">
            <History size={20} />
            <span className="font-display tracking-tight text-lg text-[#E8ECEF]">
              {t("games:recentSessions") && t("games:recentSessions") !== "recentSessions"
                ? t("games:recentSessions")
                : "Recent Sessions"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[#8A99A8] text-xs">
                  <th className="pb-3.5 font-bold uppercase tracking-wider">
                    {t("games:game") && t("games:game") !== "game" ? t("games:game") : "Game"}
                  </th>
                  <th className="pb-3.5 font-bold uppercase tracking-wider">
                    {t("games:level", { level: 1, maxLevel: 1 }).split(" ")[0] || "Level"}
                  </th>
                  <th className="pb-3.5 font-bold uppercase tracking-wider">
                    {t("games:score") && t("games:score") !== "score" ? t("games:score") : "Score"}
                  </th>
                  <th className="pb-3.5 font-bold uppercase tracking-wider">
                    {t("games:accuracy") && t("games:accuracy") !== "accuracy"
                      ? t("games:accuracy")
                      : "Accuracy"}
                  </th>
                  <th className="pb-3.5 font-bold uppercase tracking-wider">
                    {t("games:time") && t("games:time") !== "time" ? t("games:time") : "Time"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessions.slice(0, 8).map((s) => (
                  <tr
                    key={s.id}
                    className="text-xs sm:text-sm hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 font-bold capitalize text-[#E8ECEF]">
                      {s.game_id.replace(/-/g, " ")}
                    </td>
                    <td className="py-3.5 text-[#8A99A8]">Lv {s.level_achieved}</td>
                    <td className="py-3.5 font-bold text-[#6FAF9A]">{s.score}</td>
                    <td className="py-3.5 font-bold text-[#6FAF9A]">{Math.round(s.accuracy)}%</td>
                    <td className="py-3.5 text-[#8A99A8]">{s.duration_seconds}s</td>
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
