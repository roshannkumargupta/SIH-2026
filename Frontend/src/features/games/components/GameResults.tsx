import { Trophy, RotateCcw, Home, CloudOff, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { formatDuration } from "../utils/gameMetrics";
import { useLanguage } from "@/context/LanguageContext";

interface GameResultsProps {
  score: number;
  accuracy: number;
  durationSeconds: number;
  level: number;
  maxLevel?: number;
  gameName: string;
  synced: boolean;
  offline: boolean;
  onPlayAgain: () => void;
  onNextLevel?: () => void;
}

export function GameResults({
  score,
  accuracy,
  durationSeconds,
  level,
  maxLevel = 10,
  gameName,
  synced,
  offline,
  onPlayAgain,
  onNextLevel,
}: GameResultsProps) {
  const { t } = useLanguage();
  const isWon = accuracy >= 60 || score >= 50;
  const hasNextLevel = isWon && level < maxLevel;

  const grade =
    score >= 90
      ? t("games:outstanding")
      : score >= 70
        ? t("games:greatJob")
        : score >= 50
          ? t("games:goodEffort")
          : t("games:goodEffort");

  const handleNextLevel = () => {
    if (onNextLevel) {
      onNextLevel();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set("level", String(level + 1));
      window.location.href = url.toString();
    }
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 rounded-2xl border border-clay bg-surface p-8 shadow-card flex flex-col items-center text-center max-w-md mx-auto">
      <div className="flex size-20 items-center justify-center rounded-full bg-sun text-ink mb-5 shadow-md">
        <Trophy size={44} />
      </div>

      <h2 className="font-display text-3xl sm:text-4xl font-bold text-cream mb-1">{grade}</h2>
      <p className="text-cream/70 mb-6 text-sm">
        {gameName} · {t("games:level", { level, maxLevel })}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 w-full mb-6">
        <div className="rounded-xl border border-clay bg-ink/60 py-4 px-2">
          <p className="text-xs font-bold uppercase text-cream/50 mb-1">{t("games:score")}</p>
          <p className="font-display text-3xl font-bold text-sun">{score}</p>
        </div>
        <div className="rounded-xl border border-clay bg-ink/60 py-4 px-2">
          <p className="text-xs font-bold uppercase text-cream/50 mb-1">{t("games:accuracy")}</p>
          <p className="font-display text-3xl font-bold text-tea-confirm">
            {Math.round(accuracy)}%
          </p>
        </div>
        <div className="rounded-xl border border-clay bg-ink/60 py-4 px-2">
          <p className="text-xs font-bold uppercase text-cream/50 mb-1">{t("games:time")}</p>
          <p className="font-display text-3xl font-bold text-cream">
            {formatDuration(durationSeconds)}
          </p>
        </div>
      </div>

      {/* Sync Status */}
      {offline ? (
        <div className="flex items-center gap-2 rounded-lg border border-fire/40 bg-fire/10 px-4 py-2 text-sm text-cream/80 mb-5 w-full">
          <CloudOff size={16} className="text-fire shrink-0" />
          <span>{t("games:resultSavedLocally")}</span>
        </div>
      ) : synced ? (
        <div className="flex items-center gap-2 rounded-lg border border-tea-confirm/40 bg-tea-confirm/10 px-4 py-2 text-sm text-cream/80 mb-5 w-full">
          <CheckCircle2 size={16} className="text-tea-confirm shrink-0" />
          <span>{t("games:performanceRecorded")}</span>
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full">
        {hasNextLevel && (
          <Button
            onClick={handleNextLevel}
            variant="sun"
            size="touch"
            className="w-full text-base font-extrabold shadow-md bg-sun text-ink hover:bg-sun/90"
          >
            {t("games:nextLevel", { next: level + 1 })} <ArrowRight size={18} className="ml-2" />
          </Button>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            onClick={onPlayAgain}
            variant="cream"
            size="touch"
            className="flex-1 text-sm font-extrabold"
          >
            <RotateCcw size={16} className="mr-2" /> {t("games:playAgain")}
          </Button>
          <Button
            asChild
            variant="ghost"
            size="touch"
            className="flex-1 border border-clay text-cream hover:bg-clay text-sm"
          >
            <Link to="/games">
              <Home size={16} className="mr-2" /> {t("common:allGames")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
