import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  Check,
  Pill,
  Sparkles,
  RefreshCw,
  Heart,
  Droplets,
  Play,
  Activity,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import { useTasks } from "@/hooks/use-tasks";
import { useMedications } from "@/hooks/use-medications";
import { useMemories } from "@/hooks/use-memories";
import { useGames } from "@/hooks/use-games";
import { useHydration } from "@/hooks/use-hydration";
import { useMood } from "@/hooks/use-mood";
import { useGameProgress } from "@/hooks/useGameProgress";
import type { MoodType } from "@/types/api";
import { formatApiError } from "@/api/client";
import { GAME_MAP } from "@/features/games/data/gameRegistry";
import defaultProfilePhoto from "@/assets/default-avatar.svg";

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
  const { todayLogs, todaySchedules, updateLogStatus } = useMedications();
  const { memories } = useMemories();
  const { summary: gameSummary } = useGames();
  const { summary: hydrationSummary, glassCount, logWater, isLogging } = useHydration();
  const { logMood, isLogging: isMoodLogging } = useMood();
  const { getTargetLevel } = useGameProgress();
  const [moodNote, setMoodNote] = useState("");
  const [showMoodNote, setShowMoodNote] = useState(false);
  const [recentMoodAcknowledged, setRecentMoodAcknowledged] = useState<MoodType | null>(null);

  const handleTapMood = async (mood: MoodType) => {
    try {
      await logMood({
        mood,
        ...(moodNote.trim() ? { note: moodNote.trim() } : {}),
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
        ...(newStatus === "taken" ? { notes: "Confirmed taken by patient on home screen" } : {}),
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

  // Rotating Badge Palette for cards and reminders
  const badgePalette = ["#E85D6B", "#4DA3E0", "#9B7FE0", "#2DD4BF", "#E0A23B"];

  // 4 Featured Cognitive Games — levels computed from real progress
  const featuredGameIds = ["water-jugs", "tower-of-hanoi", "ball-sort", "n-back"];
  const featuredGames = [
    {
      id: "water-jugs",
      title: "Water Jugs",
      desc: "Measure exact water using logic and careful planning.",
      difficulty: "Medium",
      diffColor: "bg-[#E0A23B]/15 text-[#E0A23B] border-[#E0A23B]/30",
      icon: "🪣",
      gradient: "from-[#1a3854] to-[#122435]",
    },
    {
      id: "tower-of-hanoi",
      title: "Tower of Hanoi",
      desc: "Move disks following rules to build recursive agility.",
      difficulty: "Medium",
      diffColor: "bg-[#E0A23B]/15 text-[#E0A23B] border-[#E0A23B]/30",
      icon: "🗼",
      gradient: "from-[#222e4d] to-[#121c32]",
    },
    {
      id: "ball-sort",
      title: "Ball Sort Puzzle",
      desc: "Sort vibrant balls into matching tubes with clarity.",
      difficulty: "Easy",
      diffColor: "bg-[#6FAF9A]/15 text-[#6FAF9A] border-[#6FAF9A]/30",
      icon: "🎱",
      gradient: "from-[#1d3a3d] to-[#112426]",
    },
    {
      id: "n-back",
      title: "N-Back Recall",
      desc: "Remember items from N steps back to boost working memory.",
      difficulty: "Hard",
      diffColor: "bg-[#E85D6B]/15 text-[#E85D6B] border-[#E85D6B]/30",
      icon: "🧠",
      gradient: "from-[#352549] to-[#1a1426]",
    },
  ];

  // Resolve maxLevel for each featured game from GAME_MAP (falls back to 10)
  const getFeaturedMaxLevel = (gameId: string): number => GAME_MAP?.get(gameId)?.maxLevel ?? 10;

  return (
    <AppShell progress={progress}>
      <div className="px-4 sm:px-8 py-6 max-w-[1550px] w-full mx-auto space-y-7">
        {/* Responsive 2-Column Grid: Left Main Area + Right Sidebar Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_370px] gap-6 items-start">
          {/* === LEFT MAIN COLUMN === */}
          <div className="space-y-6 min-w-0">
            {/* Hero Greeting Banner */}
            <section
              aria-label="Welcome Hero Banner"
              className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-[#13283E] via-[#0F2032] to-[#0A1420] p-6 sm:p-8 shadow-2xl"
            >
              {/* Subtle ambient decorative gradient glows & emblem watermark */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-[#6FAF9A]/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 -mb-20 size-64 rounded-full bg-[#2DD4BF]/10 blur-3xl pointer-events-none" />
              <div className="hidden sm:block absolute -right-4 -bottom-4 size-44 md:size-52 opacity-20 pointer-events-none select-none">
                <img
                  src="/assets/brain-logo.png"
                  alt=""
                  className="w-full h-full object-contain filter drop-shadow-[0_0_25px_rgba(229,169,60,0.6)]"
                />
              </div>

              <div className="relative z-10 space-y-6">
                {/* Top user avatar and greeting */}
                <div className="flex items-start gap-4">
                  <img
                    src={user?.avatar_url || defaultProfilePhoto}
                    alt={patientName}
                    className="size-14 sm:size-16 rounded-full border-2 border-[#6FAF9A]/60 object-cover shadow-lg shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-0.5 text-xs font-semibold text-[#8A99A8]">
                        <Sparkles size={12} className="text-[#6FAF9A]" /> {todayFormatted}
                      </span>
                    </div>
                    <h1 className="font-serif text-4xl sm:text-5xl lg:text-5xl font-bold tracking-tight text-[#E8ECEF]">
                      {t(greetingKey, { name: patientName })} <span aria-hidden="true">👋</span>
                    </h1>
                    <p className="text-base sm:text-lg text-[#8A99A8] font-medium leading-relaxed max-w-xl">
                      {t("dashboard:subGreetingGentle")}
                    </p>
                  </div>
                </div>

                {/* "Continue where you left off" Slim Featured Card */}
                <div className="rounded-2xl border border-white/8 bg-[#121D2B]/90 backdrop-blur-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6FAF9A]">
                      Featured Cognitive Exercise
                    </span>
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#E8ECEF]">
                      {t("dashboard:memoryMatch")} · {t("dashboard:brainChallenge")}
                    </h3>
                    <p className="text-xs text-[#8A99A8] line-clamp-1">
                      {t("dashboard:memoryMatchDesc")}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="default"
                    size="default"
                    className="rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] font-extrabold px-6 shrink-0 shadow-md"
                  >
                    <Link to="/games">
                      <Play size={16} className="fill-current mr-1.5" />
                      <span>{t("common:playNow")}</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </section>

            {/* Quick Actions Row: 5 Soft Rounded Dark Cards with Rotating Badges */}
            <section aria-label="Quick Actions" className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#E8ECEF]">
                  Quick Care Shortcuts
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {[
                  {
                    to: "/medication",
                    title: t("nav.medicine"),
                    status: matchingSchedule
                      ? `${matchingSchedule.medicine_name}`
                      : "Check Schedule",
                    icon: Pill,
                    color: badgePalette[0],
                  },
                  {
                    to: "/routine",
                    title: "Hydration",
                    status: `${hydrationSummary.total_ml} / ${hydrationSummary.goal_ml} ml`,
                    icon: Droplets,
                    color: badgePalette[1],
                  },
                  {
                    to: "/routine",
                    title: t("nav.routine"),
                    status: `${completedTasksCount}/${totalTasksCount} tasks done`,
                    icon: CalendarDays,
                    color: badgePalette[2],
                  },
                  {
                    to: "/calm",
                    title: t("nav.calm"),
                    status: "Breathwork & Sounds",
                    icon: Sparkles,
                    color: badgePalette[3],
                  },
                  {
                    to: "/memories",
                    title: t("nav.memories"),
                    status: `${memories.length} memories saved`,
                    icon: Heart,
                    color: badgePalette[4],
                  },
                ].map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <Link
                      key={idx}
                      to={act.to}
                      className="group flex flex-col justify-between p-5 rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md hover:border-white/15 hover:bg-[#152335] transition duration-200 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="flex size-12 items-center justify-center rounded-2xl text-white shadow-sm"
                          style={{ backgroundColor: act.color }}
                        >
                          <Icon size={24} />
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-[#8A99A8] group-hover:text-[#E8ECEF] group-hover:translate-x-0.5 transition"
                        />
                      </div>
                      <div className="mt-4">
                        <h3 className="text-sm sm:text-base font-bold text-[#E8ECEF] tracking-tight">
                          {act.title}
                        </h3>
                        <p className="text-xs text-[#8A99A8] truncate mt-1 font-medium">
                          {act.status}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Cognitive Games Featured Cards Section */}
            <section aria-labelledby="games-section-title" className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    id="games-section-title"
                    className="font-display text-xl sm:text-2xl font-bold text-[#E8ECEF]"
                  >
                    {t("dashboard:cognitiveCenter")}
                  </h2>
                  <p className="text-xs text-[#8A99A8] mt-0.5">
                    Engaging brain exercises to stimulate memory, logic, and attention
                  </p>
                </div>
                <Link
                  to="/games"
                  className="flex items-center gap-1 text-xs font-bold text-[#6FAF9A] hover:underline"
                >
                  <span>View All (22)</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {featuredGames.map((game) => {
                  const targetLevel = getTargetLevel(game.id, getFeaturedMaxLevel(game.id));
                  return (
                    <Link
                      key={game.id}
                      to={`/games/${game.id}` as any}
                      search={{ level: String(targetLevel) } as any}
                      className="group flex flex-col justify-between rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-5 sm:p-6 hover:border-white/15 hover:bg-[#152335] transition duration-200 shadow-md relative overflow-hidden"
                    >
                      {/* Tall Illustrated Top Banner (140-180px height per spec) */}
                      <div
                        className={`w-full h-40 sm:h-44 rounded-xl bg-gradient-to-br ${game.gradient} border border-white/5 flex items-center justify-center relative overflow-hidden mb-4`}
                      >
                        <span className="text-5xl sm:text-6xl filter drop-shadow-lg group-hover:scale-110 transition-transform">
                          {game.icon}
                        </span>
                        <span
                          className={`absolute top-3 right-3 px-3 py-1 rounded-full border text-xs font-bold ${game.diffColor}`}
                        >
                          {game.difficulty}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <h3 className="font-display text-lg sm:text-xl font-bold text-[#E8ECEF] group-hover:text-[#6FAF9A] transition">
                          {game.title}
                        </h3>
                        <p className="text-sm text-[#8A99A8] line-clamp-2 leading-relaxed">
                          {game.desc}
                        </p>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#8A99A8]">
                          {targetLevel > 1
                            ? `Continue at Level ${targetLevel}`
                            : "Start at Level 1"}
                        </span>
                        {/* Prominent Teal-green circular play button */}
                        <span className="flex size-10 items-center justify-center rounded-full bg-[#6FAF9A] text-[#0A1420] shadow-md group-hover:scale-105 transition-transform">
                          <Play size={16} className="fill-current ml-0.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* 1-Tap Emotional Mood Check-in Card */}
            <section
              className="rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-5 sm:p-6 shadow-md space-y-4"
              aria-label="Daily Mood Check-in"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6FAF9A]">
                    <Heart size={14} aria-hidden="true" />
                    <span>{t("dashboard:moodSectionTitle")}</span>
                  </div>
                  <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#E8ECEF]">
                    {t("dashboard:moodPrompt")}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMoodNote(!showMoodNote)}
                  className="text-xs font-bold text-[#6FAF9A] hover:underline self-start sm:self-auto cursor-pointer"
                >
                  {showMoodNote ? t("dashboard:moodHideNote") : t("dashboard:moodAddNote")}
                </button>
              </div>

              {showMoodNote && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={moodNote}
                    onChange={(e) => setMoodNote(e.target.value)}
                    placeholder={t("dashboard:moodNotePlaceholder")}
                    maxLength={200}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[#E8ECEF] text-xs focus:outline-none focus:border-[#6FAF9A] placeholder:text-[#8A99A8]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    type: "happy" as MoodType,
                    emoji: "😊",
                    labelKey: "dashboard:moodHappy",
                    border: "border-[#E0A23B]/30 hover:border-[#E0A23B]",
                    bg: "bg-[#E0A23B]/10 hover:bg-[#E0A23B]/15",
                    text: "text-[#E0A23B]",
                  },
                  {
                    type: "calm" as MoodType,
                    emoji: "😌",
                    labelKey: "dashboard:moodCalm",
                    border: "border-[#6FAF9A]/30 hover:border-[#6FAF9A]",
                    bg: "bg-[#6FAF9A]/10 hover:bg-[#6FAF9A]/15",
                    text: "text-[#6FAF9A]",
                  },
                  {
                    type: "confused" as MoodType,
                    emoji: "🤔",
                    labelKey: "dashboard:moodConfused",
                    border: "border-[#9B7FE0]/30 hover:border-[#9B7FE0]",
                    bg: "bg-[#9B7FE0]/10 hover:bg-[#9B7FE0]/15",
                    text: "text-[#9B7FE0]",
                  },
                  {
                    type: "anxious" as MoodType,
                    emoji: "😟",
                    labelKey: "dashboard:moodAnxious",
                    border: "border-[#E85D6B]/30 hover:border-[#E85D6B]",
                    bg: "bg-[#E85D6B]/10 hover:bg-[#E85D6B]/15",
                    text: "text-[#E85D6B]",
                  },
                ].map((item) => {
                  const isAcknowledged = recentMoodAcknowledged === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleTapMood(item.type)}
                      disabled={isMoodLogging}
                      className={`group relative flex flex-col items-center justify-center p-3.5 rounded-xl border ${item.border} ${item.bg} transition duration-200 text-center min-h-[95px] shadow-sm cursor-pointer`}
                    >
                      <span className="text-3xl transition-transform group-hover:scale-110">
                        {item.emoji}
                      </span>
                      <span className={`mt-2 font-display text-xs font-bold ${item.text}`}>
                        {t(item.labelKey)}
                      </span>
                      {isAcknowledged && (
                        <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-[#6FAF9A] text-[#0A1420] shadow-sm">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {recentMoodAcknowledged && (
                <div className="p-3 rounded-xl bg-[#6FAF9A]/10 border border-[#6FAF9A]/30 text-[#E8ECEF] text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <Check size={16} className="text-[#6FAF9A] shrink-0" />
                  <span>{t("dashboard:moodAcknowledged")}</span>
                </div>
              )}
            </section>

            {/* Family Memories Showcase Card */}
            <section aria-labelledby="memories-title">
              <Link
                to="/memories"
                className="group flex flex-col sm:flex-row items-center justify-between rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-5 hover:border-white/15 hover:bg-[#152335] transition duration-200 shadow-md gap-4 overflow-hidden"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9B7FE0]">
                    <Heart size={14} />
                    <span>{t("dashboard:myMemories")}</span>
                  </div>
                  <h3 id="memories-title" className="font-display text-lg font-bold text-[#E8ECEF]">
                    {hasMemories && latestMemory
                      ? latestMemory.title
                      : t("dashboard:memoriesSubtext")}
                  </h3>
                  <p className="text-xs text-[#8A99A8] line-clamp-1">
                    {latestMemory?.description || t("dashboard:memoriesEmptyDesc")}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#6FAF9A] pt-1">
                    <span>
                      {hasMemories
                        ? t("dashboard:exploreMemories")
                        : t("dashboard:createFirstMemory")}
                    </span>
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </span>
                </div>

                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={latestMemory?.title || "Family photo"}
                    className="size-20 sm:size-24 rounded-xl object-cover border border-white/10 shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="size-20 sm:size-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Heart size={28} className="text-[#9B7FE0]" />
                  </div>
                )}
              </Link>
            </section>
          </div>

          {/* === RIGHT SIDEBAR PANEL === */}
          <div className="space-y-6">
            {/* Card 1: Your Progress with Circular Percentage Ring */}
            <section
              aria-label="Progress Summary"
              className="rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-5 sm:p-6 shadow-md space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#E8ECEF]">
                  {t("nav.today")} Progress
                </h3>
                <span className="text-[11px] font-bold text-[#6FAF9A] px-2 py-0.5 rounded-full bg-[#6FAF9A]/10">
                  Daily Score
                </span>
              </div>

              {/* Circular Percentage Ring */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative flex size-32 items-center justify-center">
                  <svg className="size-32 -rotate-90" viewBox="0 0 120 120">
                    {/* Background circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeWidth="10"
                    />
                    {/* Active progress stroke */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#6FAF9A"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - Math.min(progress, 100) / 100)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-display text-3xl font-black text-[#E8ECEF]">
                      {progress}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#8A99A8] tracking-wider">
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              {/* 2x2 Grid of Stat Tiles with Prominent Font Sizes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/5 p-3.5 text-left">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[#E0A23B]/15 text-[#E0A23B] mb-2">
                    <Trophy size={16} />
                  </span>
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#E8ECEF]">
                    {gameSummary?.total_sessions || 0}
                  </p>
                  <p className="text-[11px] text-[#8A99A8] font-bold uppercase tracking-wider mt-1">
                    Games Played
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/5 p-3.5 text-left">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[#6FAF9A]/15 text-[#6FAF9A] mb-2">
                    <Brain size={16} />
                  </span>
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#6FAF9A]">
                    {Math.round(gameSummary?.average_accuracy || 0)}%
                  </p>
                  <p className="text-[11px] text-[#8A99A8] font-bold uppercase tracking-wider mt-1">
                    Avg Accuracy
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/5 p-3.5 text-left">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[#9B7FE0]/15 text-[#9B7FE0] mb-2">
                    <CalendarDays size={16} />
                  </span>
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#E8ECEF]">
                    {completedTasksCount}/{totalTasksCount}
                  </p>
                  <p className="text-[11px] text-[#8A99A8] font-bold uppercase tracking-wider mt-1">
                    Tasks Done
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/5 p-3.5 text-left">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[#4DA3E0]/15 text-[#4DA3E0] mb-2">
                    <Droplets size={16} />
                  </span>
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#4DA3E0]">
                    {glassCount}
                  </p>
                  <p className="text-[11px] text-[#8A99A8] font-bold uppercase tracking-wider mt-1">
                    Glasses Water
                  </p>
                </div>
              </div>
            </section>

            {/* Card 2: Today's Reminders List */}
            <section
              aria-label="Today's Reminders"
              className="rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-5 sm:p-6 shadow-md space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <h3 className="font-display text-base font-bold text-[#E8ECEF]">
                    {t("dashboard:todaysRoutine")}
                  </h3>
                  <p className="text-[11px] text-[#8A99A8]">Medicine and daily activities</p>
                </div>
                <Link to="/routine" className="text-xs font-bold text-[#6FAF9A] hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-2.5">
                {/* Next Medication Item if exists */}
                {hasMedication && matchingSchedule && (
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                      isMedicineTaken
                        ? "border-white/5 bg-white/5 text-[#8A99A8]"
                        : "border-[#E85D6B]/30 bg-[#E85D6B]/5 text-[#E8ECEF]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E85D6B] text-white shadow-sm">
                        <Pill size={15} />
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold truncate ${isMedicineTaken ? "line-through opacity-70" : ""}`}
                        >
                          {matchingSchedule.medicine_name}
                        </p>
                        <p className="text-[10px] text-[#8A99A8] truncate">
                          {matchingSchedule.dosage} · {matchingSchedule.scheduled_time.slice(0, 5)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleMedicine}
                      className={`size-7 shrink-0 flex items-center justify-center rounded-lg transition cursor-pointer ${
                        isMedicineTaken
                          ? "bg-[#6FAF9A] text-[#0A1420]"
                          : "border border-white/20 hover:border-[#6FAF9A] text-transparent"
                      }`}
                      title={isMedicineTaken ? "Marked taken" : "Mark as taken"}
                    >
                      <Check
                        size={14}
                        strokeWidth={3}
                        className={isMedicineTaken ? "text-[#0A1420]" : "opacity-0"}
                      />
                    </button>
                  </div>
                )}

                {/* Tasks List */}
                {todayTasks.slice(0, 4).map((task, idx) => {
                  const isDone = task.status === "completed";
                  const color = badgePalette[(idx + 1) % badgePalette.length];
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                        isDone
                          ? "border-white/5 bg-white/5 text-[#8A99A8]"
                          : "border-white/8 bg-white/5 text-[#E8ECEF]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm text-xs"
                          style={{ backgroundColor: color }}
                        >
                          <CalendarDays size={14} />
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${isDone ? "line-through opacity-70" : ""}`}
                          >
                            {task.title}
                          </p>
                          <p className="text-[10px] text-[#8A99A8] truncate">
                            {task.scheduled_time.slice(0, 5)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className={`size-7 shrink-0 flex items-center justify-center rounded-lg transition cursor-pointer ${
                          isDone
                            ? "bg-[#6FAF9A] text-[#0A1420]"
                            : "border border-white/20 hover:border-[#6FAF9A] text-transparent"
                        }`}
                        title={isDone ? "Completed" : "Mark complete"}
                      >
                        <Check
                          size={14}
                          strokeWidth={3}
                          className={isDone ? "text-[#0A1420]" : "opacity-0"}
                        />
                      </button>
                    </div>
                  );
                })}

                {todayTasks.length === 0 && !hasMedication && (
                  <p className="text-center py-6 text-xs text-[#8A99A8]">
                    {t("dashboard:noRoutineScheduled")}
                  </p>
                )}
              </div>
            </section>

            {/* Card 3: Quick Hydration Action */}
            <section
              aria-label="Hydration Quick Tracker"
              className="rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-5 shadow-md flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#4DA3E0]/15 text-[#4DA3E0] shrink-0">
                  <Droplets size={20} />
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#E8ECEF]">Stay Hydrated</h4>
                  <p className="text-[11px] text-[#8A99A8] truncate">
                    {hydrationSummary.total_ml} ml of {hydrationSummary.goal_ml} ml goal
                  </p>
                </div>
              </div>

              {user ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLogging}
                  onClick={async () => {
                    try {
                      await logWater({ amount_ml: 250 });
                      toast.success("💧 Glass logged! Keep hydrating.");
                    } catch (err: unknown) {
                      toast.error(formatApiError(err, "Could not log water"));
                    }
                  }}
                  className="rounded-full text-xs font-bold border-white/10 hover:border-[#4DA3E0] hover:bg-[#4DA3E0]/10 text-[#4DA3E0] shrink-0"
                >
                  + 1 Glass 💧
                </Button>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
