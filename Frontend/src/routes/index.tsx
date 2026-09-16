import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  Check,
  Pill,
  Volume2,
  Sparkles,
  RefreshCw,
  Heart,
  Droplets,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { NavigationHeader } from "@/components/navigation-header";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import { useTasks } from "@/hooks/use-tasks";
import { useMedications } from "@/hooks/use-medications";
import { useMemories } from "@/hooks/use-memories";
import { useGames } from "@/hooks/use-games";
import { useHydration } from "@/hooks/use-hydration";
import { useMood } from "@/hooks/use-mood";
import type { MoodType } from "@/types/api";
import { formatApiError } from "@/api/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home | SmritiSetu" },
      {
        name: "description",
        content:
          "Accessible daily home for memory games, medicine, personal memories, and routines.",
      },
      { property: "og:title", content: "Home | SmritiSetu" },
      {
        property: "og:description",
        content: "A warm daily companion for memory games, medicine, and routines.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { todayTasks, completeTask, isLoading: tasksLoading } = useTasks();
  const { todayLogs, todaySchedules, updateLogStatus, isLoading: medsLoading } = useMedications();
  const { memories } = useMemories();
  const { summary: gameSummary } = useGames();
  const { summary: hydrationSummary, glassCount, logWater, isLogging } = useHydration();
  const { logMood, isLogging: isMoodLogging } = useMood();
  const [moodNote, setMoodNote] = useState("");
  const [showMoodNote, setShowMoodNote] = useState(false);
  const [recentMoodAcknowledged, setRecentMoodAcknowledged] = useState<MoodType | null>(null);

  const handleTapMood = async (mood: MoodType) => {
    try {
      await logMood({
        mood,
        note: moodNote.trim() || undefined,
      });
      setRecentMoodAcknowledged(mood);
      setMoodNote("");
      setShowMoodNote(false);
      toast.success(t("dashboard.mood.acknowledged"));
      setTimeout(() => setRecentMoodAcknowledged(null), 6000);
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Could not save mood check-in"));
    }
  };

  // Dynamic Memories Cover & Content
  const memoryWithImage = memories.find((m) => !!m.image_url);
  const latestMemory = memories[0];
  const coverImage = memoryWithImage?.image_url || latestMemory?.image_url;
  const hasMemories = memories.length > 0;

  // Next scheduled medication
  const nextScheduledLog = todayLogs.find((l) => l.status === "scheduled") || todayLogs[0];
  const matchingSchedule = nextScheduledLog
    ? todaySchedules.find((s) => s.id === nextScheduledLog.schedule_id)
    : todaySchedules[0];

  const hasMedication = !!nextScheduledLog && !!matchingSchedule;
  const isMedicineTaken = nextScheduledLog ? nextScheduledLog.status === "taken" : false;

  // Real Progress Calculation
  const totalTasksCount = todayTasks.length;
  const completedTasksCount = todayTasks.filter((t) => t.status === "completed").length;
  const totalMedsCount = todayLogs.length;
  const completedMedsCount = todayLogs.filter((l) => l.status === "taken").length;

  const totalItems = totalTasksCount + totalMedsCount;
  const completedItems = completedTasksCount + completedMedsCount;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Localized date string using active language code
  const todayFormatted = (() => {
    try {
      return new Intl.DateTimeFormat(language || "en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date());
    } catch {
      return new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date());
    }
  })();

  const currentHour = new Date().getHours();
  const greetingKey =
    currentHour < 12
      ? "dashboard:greetingMorning"
      : currentHour < 17
        ? "dashboard:greetingAfternoon"
        : "dashboard:greetingEvening";

  const patientName = user?.name?.split(" ")[0] || "Friend";

  const handleToggleMedicine = async () => {
    if (!nextScheduledLog) {
      toast.info(t("dashboard:noMedsAssigned"));
      return;
    }
    const newStatus = isMedicineTaken ? "scheduled" : "taken";
    try {
      await updateLogStatus({
        logId: nextScheduledLog.id,
        status: newStatus,
        notes: newStatus === "taken" ? "Confirmed taken by patient on home screen" : undefined,
      });
      toast.success(
        newStatus === "taken" ? t("dashboard:medTakenSubtext") : t("dashboard:dueToday"),
      );
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to update medication status"));
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to update task"));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Central Accessible Navigation Header */}
      <NavigationHeader progress={progress} />

      <main className="flex-1 mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12 w-full">
        {/* Reassuring Greeting */}
        <p className="text-xl font-extrabold uppercase tracking-wider text-sun">{todayFormatted}</p>
        <h1 className="mt-3 font-display text-5xl font-bold leading-tight text-cream sm:text-7xl">
          {t(greetingKey, { name: patientName })} <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-3 text-2xl text-cream/80 max-w-2xl">{t("dashboard:subGreetingGentle")}</p>

        {/* 1-Tap Emotional Mood Check-in */}
        <section
          className="mt-8 rounded-2xl border border-clay bg-surface p-6 sm:p-8 shadow-card"
          aria-label="Daily Mood Check-in"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-sun">
                <Heart size={18} aria-hidden="true" />
                <span>{t("dashboard:moodSectionTitle")}</span>
              </div>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-cream">
                {t("dashboard:moodPrompt")}
              </h2>
            </div>

            {/* Optional Note toggle */}
            <button
              type="button"
              onClick={() => setShowMoodNote(!showMoodNote)}
              className="text-xs sm:text-sm font-bold text-sun hover:underline flex items-center gap-1 self-start md:self-auto"
            >
              {showMoodNote ? t("dashboard:moodHideNote") : t("dashboard:moodAddNote")}
            </button>
          </div>

          {/* Optional Collapsed Note Input */}
          {showMoodNote && (
            <div className="mt-4">
              <input
                type="text"
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                placeholder={t("dashboard:moodNotePlaceholder")}
                maxLength={200}
                className="w-full px-4 py-2.5 rounded-xl bg-ink/80 border border-clay text-cream text-sm focus:outline-none focus:border-sun placeholder:text-cream/40"
              />
            </div>
          )}

          {/* 4 Large 1-Tap Mood Buttons */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                type: "happy" as MoodType,
                emoji: "😊",
                labelKey: "dashboard:moodHappy",
                descKey: "dashboard:moodHappyDesc",
                border: "border-amber-400/40 hover:border-amber-400",
                bg: "bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30",
                text: "text-amber-300",
              },
              {
                type: "calm" as MoodType,
                emoji: "😌",
                labelKey: "dashboard:moodCalm",
                descKey: "dashboard:moodCalmDesc",
                border: "border-teal-400/40 hover:border-teal-400",
                bg: "bg-teal-500/10 hover:bg-teal-500/20 active:bg-teal-500/30",
                text: "text-teal-300",
              },
              {
                type: "confused" as MoodType,
                emoji: "🤔",
                labelKey: "dashboard:moodConfused",
                descKey: "dashboard:moodConfusedDesc",
                border: "border-indigo-400/40 hover:border-indigo-400",
                bg: "bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30",
                text: "text-indigo-300",
              },
              {
                type: "anxious" as MoodType,
                emoji: "😟",
                labelKey: "dashboard:moodAnxious",
                descKey: "dashboard:moodAnxiousDesc",
                border: "border-rose-400/40 hover:border-rose-400",
                bg: "bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30",
                text: "text-rose-300",
              },
            ].map((item) => {
              const isAcknowledged = recentMoodAcknowledged === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleTapMood(item.type)}
                  disabled={isMoodLogging}
                  className={`group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border ${item.border} ${item.bg} transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-center min-h-[110px] sm:min-h-[130px]`}
                >
                  <span
                    className="text-3xl sm:text-4xl transition-transform group-hover:scale-110"
                    role="img"
                    aria-hidden="true"
                  >
                    {item.emoji}
                  </span>
                  <span className={`mt-2 font-display text-base sm:text-lg font-bold ${item.text}`}>
                    {t(item.labelKey)}
                  </span>
                  <span className="text-[11px] sm:text-xs text-cream/60 line-clamp-1 mt-0.5">
                    {t(item.descKey)}
                  </span>
                  {isAcknowledged && (
                    <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-tea-confirm text-ink">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Warm acknowledgment message banner if recently clicked */}
          {recentMoodAcknowledged && (
            <div className="mt-4 p-3.5 rounded-xl bg-tea-confirm/15 border border-tea-confirm/40 text-tea-confirm text-sm font-medium flex items-center gap-2">
              <Check size={18} className="shrink-0" />
              <span>{t("dashboard:moodAcknowledged")}</span>
            </div>
          )}
        </section>

        {/* Cognitive Games Highlight Card */}
        <section className="mt-10" aria-labelledby="games-title">
          <Link
            to="/games"
            className="group grid min-h-96 overflow-hidden rounded-2xl bg-sun text-ink shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-active active:translate-y-0 lg:grid-cols-[1.05fr_.95fr]"
          >
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
              <div className="flex items-center gap-3 text-xl font-extrabold uppercase">
                <Brain size={32} aria-hidden="true" /> {t("dashboard:cognitiveCenter")}
              </div>
              <p className="mt-6 text-xl font-bold uppercase tracking-wider">
                {t("dashboard:brainChallenge")}
              </p>
              <h2 id="games-title" className="mt-2 font-display text-5xl font-bold sm:text-6xl">
                {t("dashboard:memoryMatch")}
              </h2>
              <p className="mt-4 max-w-xl text-xl leading-relaxed opacity-90">
                {gameSummary && gameSummary.total_sessions > 0
                  ? t("dashboard:memoryMatchStats", {
                      sessions: gameSummary.total_sessions,
                      accuracy: Math.round(gameSummary.average_accuracy),
                    })
                  : t("dashboard:memoryMatchDesc")}
              </p>
              <span className="mt-8 inline-flex min-h-16 w-fit items-center gap-3 rounded-xl bg-ink px-8 text-xl font-extrabold text-cream shadow-md transition group-hover:bg-surface">
                {t("common:playNow")} <ArrowRight size={24} aria-hidden="true" />
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-ink/10 p-7 sm:p-10 items-center">
              {["☕", "🌼", "🔑", "☕"].map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="flex min-h-32 items-center justify-center rounded-2xl border-4 border-ink/15 bg-cream text-6xl shadow-md transition-transform group-hover:animate-gentle-float"
                  style={{ animationDelay: `${index * 140}ms` }}
                >
                  {item}
                </span>
              ))}
            </div>
          </Link>
        </section>

        {/* 2-Column Grid: Medication Card & Memories Card */}
        <div className="mt-8 grid gap-7 lg:grid-cols-2">
          {/* Real Backend Medication Card */}
          <article
            className={`relative flex min-h-96 flex-col justify-between rounded-2xl p-7 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-active sm:p-10 ${
              !hasMedication
                ? "bg-surface text-cream border border-clay"
                : isMedicineTaken
                  ? "bg-tea-confirm text-cream"
                  : "bg-fire text-ink"
            }`}
          >
            <Link
              to="/medication"
              className="absolute inset-0 rounded-2xl z-0"
              aria-label="Open detailed medication page"
            />

            <div className="relative z-10 pointer-events-none flex items-center justify-between">
              <div className="flex items-center gap-3 text-xl font-extrabold uppercase">
                <Pill size={32} aria-hidden="true" /> {t("dashboard:medication")}
              </div>
              <span className="text-sm font-bold opacity-80 uppercase tracking-wider">
                {!hasMedication
                  ? t("dashboard:noPrescriptions")
                  : isMedicineTaken
                    ? t("dashboard:completed")
                    : t("dashboard:dueToday")}
              </span>
            </div>

            {!hasMedication ? (
              <div className="relative z-10 pointer-events-none flex flex-1 flex-col items-center justify-center text-center py-6">
                <span className="flex size-20 items-center justify-center rounded-full bg-clay/50 text-cream/70 mb-4">
                  <Pill size={40} />
                </span>
                <h2 className="text-2xl font-bold">{t("dashboard:noMedsAssigned")}</h2>
                <p className="mt-2 text-lg text-cream/70 max-w-sm">
                  {t("dashboard:noMedsSubtext")}
                </p>
              </div>
            ) : isMedicineTaken ? (
              <div className="relative z-10 pointer-events-none flex flex-1 flex-col items-center justify-center text-center py-6">
                <span className="flex size-24 items-center justify-center rounded-full bg-cream text-tea-confirm shadow-inner">
                  <Check size={58} strokeWidth={3} aria-hidden="true" />
                </span>
                <h2 className="mt-5 font-display text-5xl font-bold">{t("dashboard:medTaken")}</h2>
                <p className="mt-2 text-xl max-w-sm">{t("dashboard:medTakenSubtext")}</p>
              </div>
            ) : (
              <div className="relative z-10 pointer-events-none flex flex-1 flex-col justify-end py-6">
                <p className="font-display text-6xl font-bold sm:text-7xl">
                  {matchingSchedule?.scheduled_time
                    ? matchingSchedule.scheduled_time.slice(0, 5)
                    : "10:00 AM"}
                </p>
                <h2 className="mt-2 text-3xl font-bold">
                  {matchingSchedule?.medicine_name} {t("dashboard:dueToday")}
                </h2>
                <p className="mt-2 text-xl opacity-90">
                  {matchingSchedule?.dosage} ·{" "}
                  {matchingSchedule?.instructions || "Take as prescribed"}
                </p>
              </div>
            )}

            {hasMedication ? (
              <Button
                type="button"
                variant="cream"
                size="touch"
                className="relative z-20 mt-4 w-full text-xl font-extrabold"
                onClick={handleToggleMedicine}
              >
                {isMedicineTaken ? (
                  <>
                    <RefreshCw size={20} className="mr-2" /> {t("dashboard:markNotTaken")}
                  </>
                ) : (
                  <>
                    {t("dashboard:takeMedicine")} <ArrowRight size={24} aria-hidden="true" />
                  </>
                )}
              </Button>
            ) : (
              <Link
                to="/medication"
                className="relative z-20 mt-4 inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-cream text-ink text-lg font-bold hover:bg-cream/90 transition text-center"
              >
                {t("dashboard:viewMedSchedule")} <ArrowRight size={20} />
              </Link>
            )}
          </article>

          {/* Real Database-Backed Memories Card */}
          <Link
            to="/memories"
            className="group min-h-96 overflow-hidden rounded-2xl bg-surface text-cream shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-active flex flex-col justify-between border border-clay"
          >
            <div className="p-7 pb-4 sm:p-10 sm:pb-5">
              <div className="flex items-center gap-3 text-xl font-extrabold uppercase text-sun">
                <Heart size={32} aria-hidden="true" /> {t("dashboard:myMemories")}
              </div>
              <h2 className="mt-4 font-display text-4xl font-bold">
                {hasMemories && latestMemory ? latestMemory.title : t("dashboard:memoriesSubtext")}
              </h2>
              {hasMemories && latestMemory && (
                <p className="mt-2 text-cream/70 text-base line-clamp-1">
                  {latestMemory.description}
                </p>
              )}
            </div>

            {hasMemories && coverImage ? (
              <img
                src={coverImage}
                alt={latestMemory?.title || "Family memory photo"}
                loading="lazy"
                className="h-44 w-full object-cover border-y border-clay/60"
              />
            ) : hasMemories ? (
              <div className="h-44 w-full bg-ink/60 border-y border-clay/60 flex items-center justify-center text-center p-4">
                <p className="text-cream/70 text-sm max-w-xs">
                  {latestMemory?.description || t("dashboard:memoriesSubtext")}
                </p>
              </div>
            ) : (
              <div className="h-44 w-full bg-ink/40 border-y border-clay/50 flex flex-col items-center justify-center text-center p-4">
                <span className="flex size-12 items-center justify-center rounded-full bg-clay/50 text-cream/60 mb-2">
                  <Heart size={24} />
                </span>
                <p className="text-cream/80 font-bold text-base">
                  {t("dashboard:memoriesEmptyTitle")}
                </p>
                <p className="text-cream/60 text-xs mt-0.5">{t("dashboard:memoriesEmptyDesc")}</p>
              </div>
            )}

            <div className="flex min-h-20 items-center justify-between px-7 text-xl font-extrabold text-sun sm:px-10 border-t border-clay/50">
              <span>
                {hasMemories ? t("dashboard:exploreMemories") : t("dashboard:createFirstMemory")}
              </span>
              <ArrowRight
                className="transition-transform group-hover:translate-x-2"
                aria-hidden="true"
              />
            </div>
          </Link>
        </div>

        {/* 💧 Drink Water / Hydration Card */}
        <section className="mt-8" aria-labelledby="hydration-title">
          <article className="rounded-2xl border border-clay bg-surface p-7 shadow-card sm:p-10 transition duration-300 hover:-translate-y-1 hover:shadow-card-active">
            <div className="flex flex-wrap items-center justify-between gap-6">
              {/* Left: Progress Ring + Info */}
              <div className="flex items-center gap-6">
                {/* Circular Progress Ring */}
                <div className="relative flex size-28 shrink-0 items-center justify-center">
                  <svg className="size-28 -rotate-90" viewBox="0 0 112 112">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-clay/50"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className="text-sky-400 transition-all duration-700 ease-out"
                      strokeDasharray={`${2 * Math.PI * 48}`}
                      strokeDashoffset={`${2 * Math.PI * 48 * (1 - Math.min(hydrationSummary.percent, 100) / 100)}`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-cream leading-none">
                      {Math.min(Math.round(hydrationSummary.percent), 999)}
                    </span>
                    <span className="text-xs font-bold text-sky-400 mt-0.5">%</span>
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-3 text-xl font-extrabold uppercase text-sky-400">
                    <Droplets size={28} aria-hidden="true" /> Stay Hydrated
                  </div>
                  <h2
                    id="hydration-title"
                    className="mt-2 font-display text-3xl font-bold text-cream sm:text-4xl"
                  >
                    {hydrationSummary.total_ml}{" "}
                    <span className="text-xl font-bold text-cream/60">
                      / {hydrationSummary.goal_ml} ml
                    </span>
                  </h2>
                  <p className="mt-1 text-cream/70 text-base">
                    {glassCount} {glassCount === 1 ? "glass" : "glasses"} today ·{" "}
                    {hydrationSummary.logs.length}{" "}
                    {hydrationSummary.logs.length === 1 ? "log" : "logs"}
                  </p>
                </div>
              </div>

              {/* Right: Log Button */}
              {user ? (
                <Button
                  type="button"
                  variant="cream"
                  size="touch"
                  className="text-xl font-extrabold min-w-[200px]"
                  disabled={isLogging}
                  onClick={async () => {
                    try {
                      await logWater({ amount_ml: 250 });
                      toast.success("💧 Glass logged! Keep hydrating.");
                    } catch (err: unknown) {
                      toast.error(formatApiError(err, "Could not log water"));
                    }
                  }}
                >
                  {isLogging ? "Logging…" : "Log a Glass 💧"}
                </Button>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-cream text-ink px-6 text-lg font-bold hover:bg-cream/90 transition"
                >
                  Sign in to track 💧
                </Link>
              )}
            </div>
          </article>
        </section>

        {/* Real Backend Daily Routine Section */}
        <section
          className="mt-8 rounded-2xl bg-surface p-7 shadow-card sm:p-10 border border-clay"
          aria-labelledby="routine-title"
        >
          <div className="flex flex-wrap items-end justify-between gap-5 pb-4 border-b border-clay/60">
            <div>
              <div className="flex items-center gap-3 text-xl font-extrabold uppercase text-sun">
                <CalendarDays size={32} aria-hidden="true" /> {t("dashboard:yourDay")}
              </div>
              <h2 id="routine-title" className="mt-2 font-display text-4xl font-bold sm:text-5xl">
                {t("dashboard:todaysRoutine")}
              </h2>
            </div>
            <Link
              to="/routine"
              className="flex min-h-14 items-center gap-2 rounded-xl px-4 text-lg font-extrabold text-sun hover:bg-clay transition"
            >
              {t("dashboard:viewFullSchedule")} <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {tasksLoading ? (
              <p className="col-span-full py-8 text-center text-cream/70 text-lg">
                {t("dashboard:loadingSchedule")}
              </p>
            ) : todayTasks.length === 0 ? (
              <p className="col-span-full py-8 text-center text-cream/70 text-lg">
                {t("dashboard:noRoutineScheduled")}
              </p>
            ) : (
              todayTasks.map((task) => {
                const isDone = task.status === "completed";
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    aria-pressed={isDone}
                    className={`min-h-28 h-auto whitespace-normal rounded-xl border-2 p-4 text-left transition duration-200 ${
                      isDone
                        ? "border-tea-confirm bg-tea-confirm text-cream shadow-sm"
                        : "border-clay bg-ink text-cream hover:border-sun/60"
                    }`}
                  >
                    <span className="flex w-full items-start gap-3">
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          isDone
                            ? "border-cream bg-cream text-tea-confirm"
                            : "border-cream/80 text-cream"
                        }`}
                      >
                        {isDone ? (
                          <Check size={22} strokeWidth={3} />
                        ) : (
                          <span className="size-2 rounded-full bg-cream" />
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span
                          className={`block text-lg font-bold truncate ${isDone ? "line-through opacity-85" : ""}`}
                        >
                          {task.title}
                        </span>
                        <span className="mt-1 block text-sm opacity-80 font-medium">
                          {task.scheduled_time.slice(0, 5)}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
