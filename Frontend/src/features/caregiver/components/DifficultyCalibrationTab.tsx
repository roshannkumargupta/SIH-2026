import { useEffect, useState, useMemo } from "react";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Award,
  Sparkles,
  AlertCircle,
  Brain,
  Sliders,
  Shield,
  Search,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { patientsApi } from "@/api/patients.api";
import { gamesApi } from "@/api/games.api";
import type {
  PatientCalibration,
  PatientCalibrationCreate,
  GameAbilityItem,
  GameAbilityOverviewResponse,
} from "@/types/api";

interface QuestionOption {
  id: string;
  label: string;
  weight: number;
}

interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
}

const QUESTIONS: Question[] = [
  {
    id: "Q1",
    text: "How comfortable is {name} using a mobile phone or tablet?",
    options: [
      { id: "Q1_A", label: "Very comfortable, uses it independently", weight: 3 },
      { id: "Q1_B", label: "Uses it with occasional help", weight: 2 },
      { id: "Q1_C", label: "Rarely uses one, needs guidance", weight: 1 },
    ],
  },
  {
    id: "Q2",
    text: "How would you describe their day-to-day memory for recent things?",
    options: [
      { id: "Q2_A", label: "Rarely forgets, manages fine", weight: 3 },
      { id: "Q2_B", label: "Sometimes forgets, needs occasional reminders", weight: 2 },
      { id: "Q2_C", label: "Forgets often, needs regular reminders/support", weight: 1 },
    ],
  },
  {
    id: "Q3",
    text: "How quickly do they usually pick up a new game, puzzle, or activity?",
    options: [
      { id: "Q3_A", label: "Picks it up fast, enjoys a challenge", weight: 3 },
      { id: "Q3_B", label: "Takes a little time but gets there", weight: 2 },
      { id: "Q3_C", label: "Prefers very simple, familiar activities", weight: 1 },
    ],
  },
  {
    id: "Q4",
    text: "How do they usually react when something is too difficult or confusing?",
    options: [
      { id: "Q4_A", label: "Keeps trying, doesn't get frustrated", weight: 3 },
      { id: "Q4_B", label: "Gets mildly frustrated but continues", weight: 2 },
      { id: "Q4_C", label: "Gets discouraged and stops", weight: 1 },
    ],
  },
];

function getDifficultyFromScore(totalScore: number): { difficulty: string; note: string | null } {
  if (totalScore >= 10) return { difficulty: "medium", note: null };
  if (totalScore >= 7) return { difficulty: "easy", note: null };
  return { difficulty: "easy", note: "flag_extra_simplified_content" };
}

interface DifficultyCalibrationTabProps {
  patientId: string;
  patientName: string;
}

export function DifficultyCalibrationTab({
  patientId,
  patientName,
}: DifficultyCalibrationTabProps) {
  const [calibration, setCalibration] = useState<PatientCalibration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Questionnaire Wizard state
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [aiEnabled, setAiEnabled] = useState(true);

  const patientFirstName = patientName.split(" ")[0] || "the patient";

  // Fetch existing calibration from backend
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    patientsApi
      .getCalibration(patientId)
      .then((data) => {
        if (!isMounted) return;
        setCalibration(data);
        setAiEnabled(data.ai_difficulty_enabled);
      })
      .catch(() => {
        // No existing calibration found; remains in fill mode
        if (isMounted) setCalibration(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  // Toggle AI difficulty preference
  const handleToggleAi = async (enabled: boolean) => {
    setAiEnabled(enabled);
    try {
      await patientsApi.setAIDifficulty(patientId, enabled);
      toast.success(
        enabled
          ? "AI difficulty auto-adjustment enabled"
          : "AI difficulty will now show as suggestion only",
      );
      if (calibration) {
        setCalibration({ ...calibration, ai_difficulty_enabled: enabled });
      }
    } catch {
      toast.error("Failed to update AI difficulty preference");
      setAiEnabled(!enabled); // revert
    }
  };

  // Bayesian psychometric abilities state
  const [abilitiesOverview, setAbilitiesOverview] = useState<GameAbilityOverviewResponse | null>(
    null,
  );
  const [loadingAbilities, setLoadingAbilities] = useState(true);
  const [updatingGameId, setUpdatingGameId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");

  const loadAbilities = (mountedRef = { current: true }) => {
    setLoadingAbilities(true);
    gamesApi
      .getPatientAbilities(patientId)
      .then((data) => {
        if (mountedRef.current) {
          setAbilitiesOverview(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load patient game abilities:", err);
      })
      .finally(() => {
        if (mountedRef.current) {
          setLoadingAbilities(false);
        }
      });
  };

  useEffect(() => {
    const mounted = { current: true };
    loadAbilities(mounted);
    return () => {
      mounted.current = false;
    };
  }, [patientId]);

  const handleOverrideChange = async (gameId: string, level: number | null) => {
    setUpdatingGameId(gameId);
    try {
      const updated = await gamesApi.setAbilityOverride(patientId, gameId, level);
      toast.success(
        level !== null
          ? `Manual override set to Level ${level} for ${updated.game_name}`
          : `Automatic AI difficulty resumed for ${updated.game_name}`,
      );
      setAbilitiesOverview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          abilities: prev.abilities.map((a) => (a.game_id === gameId ? updated : a)),
        };
      });
    } catch {
      toast.error("Failed to update difficulty override");
    } finally {
      setUpdatingGameId(null);
    }
  };

  const filteredAbilities = useMemo(() => {
    if (!abilitiesOverview?.abilities) return [];
    return abilitiesOverview.abilities.filter((item) => {
      const matchesSearch =
        item.game_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.game_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDomain =
        selectedDomain === "all" ||
        item.cognitive_domains.some(
          (d) =>
            d.toLowerCase().replace(/[\s_]+/g, "") ===
            selectedDomain.toLowerCase().replace(/[\s_]+/g, ""),
        );
      return matchesSearch && matchesDomain;
    });
  }, [abilitiesOverview, searchQuery, selectedDomain]);

  const handleSelect = (optionId: string) => {
    const q = QUESTIONS[currentQ];
    if (q) {
      setAnswers((prev) => ({ ...prev, [q.id]: optionId }));
    }
  };

  const handleNext = async () => {
    const question = QUESTIONS[currentQ];
    if (!question || !answers[question.id]) return;

    const isLast = currentQ === QUESTIONS.length - 1;

    if (isLast) {
      setIsSaving(true);
      const totalScore = QUESTIONS.reduce((sum, q) => {
        const selId = answers[q.id];
        const option = q.options.find((o) => o.id === selId);
        return sum + (option?.weight || 0);
      }, 0);

      const { difficulty, note } = getDifficultyFromScore(totalScore);

      const payload: PatientCalibrationCreate = {
        total_score: totalScore,
        initial_difficulty: difficulty,
        note,
        answers: QUESTIONS.map((q) => ({
          question_id: q.id,
          selected_option_id: answers[q.id] || "",
        })),
        ai_difficulty_enabled: aiEnabled,
      };

      try {
        const saved = await patientsApi.saveCalibration(patientId, payload);
        setCalibration(saved);
        toast.success("Baseline calibration saved successfully!");
      } catch {
        toast.error("Could not save calibration to server");
      } finally {
        setIsSaving(false);
      }
    } else {
      setCurrentQ((q) => q + 1);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ((q) => q - 1);
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-cream/70 text-lg">
        Loading cognitive calibration profile…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* AI Difficulty Auto-Adjust Settings Card */}
      <div className="rounded-2xl border border-clay bg-surface p-5 sm:p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-base font-bold text-cream">
              <Sparkles size={20} className="text-sun" />
              Let AI adjust difficulty automatically
            </div>
            <p className="text-xs sm:text-sm text-cream/70 max-w-xl">
              When enabled, SmritiSetu automatically sets the optimal starting game level based on
              performance, accuracy trends, and fatigue. When disabled, the AI level is shown only
              as a suggestion for the patient or caregiver to accept.
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={aiEnabled}
            onClick={() => handleToggleAi(!aiEnabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sun/50 ${
              aiEnabled ? "bg-sun" : "bg-clay"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-ink shadow-lg ring-0 transition duration-200 ease-in-out ${
                aiEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────
          VIEW MODE — Calibration Completed
          ───────────────────────────────── */}
      {calibration ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-clay bg-surface p-6 shadow-card">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-sun/20 text-sun flex items-center justify-center">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cream">Baseline Calibration Complete</h3>
                  <p className="text-xs text-cream/60">
                    Recorded on{" "}
                    {new Date(calibration.updated_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  calibration.initial_difficulty === "medium"
                    ? "bg-sun/20 text-sun border border-sun/40"
                    : "bg-tea-confirm/20 text-tea-confirm border border-tea-confirm/40"
                }`}
              >
                Initial {calibration.initial_difficulty} Level
              </span>
            </div>

            <div className="bg-ink/70 rounded-xl p-5 border border-clay/50 mb-5">
              <p className="text-xs text-cream/60 font-medium mb-1">Baseline Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-sun">{calibration.total_score}</span>
                <span className="text-sm font-semibold text-cream/50">/ 12</span>
              </div>
              <p className="text-xs text-cream/70 mt-2">
                Seeded Starting Level:{" "}
                <strong className="capitalize text-sun">
                  {calibration.initial_difficulty === "medium" ? "Level 3" : "Level 1-2"}
                </strong>
              </p>
            </div>

            {/* Answered Questions Breakdown */}
            <div className="space-y-3">
              {QUESTIONS.map((q, idx) => {
                const answer = calibration.answers?.find((a) => a.question_id === q.id);
                const selectedOption = q.options.find((o) => o.id === answer?.selected_option_id);
                return (
                  <div key={q.id} className="bg-ink/40 rounded-xl p-4 border border-clay/40">
                    <p className="text-[11px] text-cream/50 font-semibold mb-1">
                      Question {idx + 1} of 4
                    </p>
                    <p className="text-sm text-cream font-medium mb-2">
                      {q.text.replace("{name}", patientFirstName)}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-semibold text-sun bg-sun/10 p-2.5 rounded-lg border border-sun/20">
                      <Check size={14} className="text-sun shrink-0" />
                      <span>{selectedOption?.label || "Answer recorded"}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {calibration.note && (
              <div className="bg-sun/15 border border-sun/40 rounded-xl p-4 mt-5 flex items-start gap-2.5">
                <AlertCircle size={18} className="text-sun shrink-0 mt-0.5" />
                <p className="text-xs text-cream/90 font-medium">
                  Note: Extra-simplified activity pacing is active to maximize patient comfort and
                  engagement.
                </p>
              </div>
            )}
          </div>

          <Button
            variant="cream"
            onClick={() => {
              setCalibration(null);
              setCurrentQ(0);
              setAnswers({});
            }}
            className="w-full flex items-center justify-center py-3 min-h-[48px] rounded-xl cursor-pointer"
          >
            <RefreshCw size={16} className="mr-2" />
            Redo Calibration Questionnaire
          </Button>
        </div>
      ) : (
        /* ─────────────────────────────────
           FILL MODE — 4-Step Wizard
           ───────────────────────────────── */
        <div className="space-y-6">
          <div className="rounded-2xl border border-clay bg-surface p-6 shadow-card space-y-6">
            <div>
              <h3 className="text-xl font-bold text-cream">Tell us about {patientFirstName}</h3>
              <p className="text-xs sm:text-sm text-cream/60 mt-1">
                These 4 questions calibrate starting game difficulties to match the patient's
                current baseline.
              </p>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-cream/70">
                  Question {currentQ + 1} of {QUESTIONS.length}
                </span>
                <span className="text-xs text-sun font-bold">
                  {Math.round(((currentQ + 1) / QUESTIONS.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-ink/70 rounded-full overflow-hidden border border-clay/40">
                <div
                  className="h-full bg-sun transition-all duration-300 rounded-full"
                  style={{ width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Question */}
            {QUESTIONS[currentQ] && (
              <div className="space-y-4">
                <p className="text-base sm:text-lg font-bold text-cream leading-relaxed">
                  {QUESTIONS[currentQ]!.text.replace("{name}", patientFirstName)}
                </p>

                <div className="space-y-2.5">
                  {QUESTIONS[currentQ]!.options.map((option) => {
                    const isSelected = answers[QUESTIONS[currentQ]!.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelect(option.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "border-sun bg-sun/15 shadow-sm"
                            : "border-clay bg-ink/60 hover:border-sun/50 hover:bg-clay/20"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 flex-1 pr-2">
                          <div
                            className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? "border-sun bg-sun text-ink" : "border-clay"
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span
                            className={`text-sm ${
                              isSelected ? "text-cream font-bold" : "text-cream/80"
                            }`}
                          >
                            {option.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-4 pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentQ === 0 || isSaving}
                className="flex-1 min-h-[48px] rounded-xl border-clay text-cream hover:bg-clay"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              <Button
                variant="cream"
                onClick={handleNext}
                disabled={!answers[QUESTIONS[currentQ]!.id] || isSaving}
                className="flex-1 min-h-[48px] rounded-xl font-bold bg-sun text-ink hover:opacity-90"
              >
                {currentQ === QUESTIONS.length - 1 ? (isSaving ? "Saving…" : "Finish") : "Continue"}
                {currentQ !== QUESTIONS.length - 1 && <ArrowRight size={16} className="ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          BAYESIAN ABILITY CONTROLLER & PER-GAME OVERRIDES PANEL
          ───────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-clay bg-surface p-5 sm:p-6 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-clay/40 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-sun/20 text-sun flex items-center justify-center">
                <Brain size={20} />
              </div>
              <h3 className="text-lg font-bold text-cream">
                Adaptive Game Abilities & Difficulty Overrides
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-cream/70 mt-1 max-w-2xl">
              Grounded in Item Response Theory (IRT). Tracks latent capability (θ) and uncertainty
              (σ) per game to sustain the patient in their optimal{" "}
              <strong>75%–80% challenge zone</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sun/15 text-sun border border-sun/30 flex items-center gap-1.5">
              <Zap size={13} />
              Target: 75%–80% Accuracy
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-tea-confirm/15 text-tea-confirm border border-tea-confirm/30 flex items-center gap-1.5">
              <Shield size={13} />
              30m Cooldown Guard
            </span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/40"
            />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-ink/60 border border-clay/60 rounded-xl text-xs sm:text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:border-sun"
            />
          </div>

          {/* Domain Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {["all", "Memory", "Attention", "Executive Function", "Language", "Visuospatial"].map(
              (dom) => (
                <button
                  key={dom}
                  type="button"
                  onClick={() => setSelectedDomain(dom)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedDomain === dom
                      ? "bg-sun text-ink"
                      : "bg-ink/50 text-cream/70 hover:bg-clay/40 hover:text-cream border border-clay/40"
                  }`}
                >
                  {dom === "all" ? "All Domains" : dom}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Loading State or Cards Grid */}
        {loadingAbilities ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-cream/50">
            <RefreshCw size={24} className="animate-spin text-sun" />
            <span className="text-xs">Computing latent ability distributions…</span>
          </div>
        ) : filteredAbilities.length === 0 ? (
          <div className="py-8 text-center text-cream/50 text-xs">
            No games found matching your filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAbilities.map((item) => {
              const isUpdating = updatingGameId === item.game_id;
              const hasOverride = item.manual_override_level !== null;

              return (
                <div
                  key={item.game_id}
                  className={`rounded-xl border p-4 transition-all ${
                    hasOverride
                      ? "bg-indigo-950/20 border-indigo-500/40 shadow-sm"
                      : "bg-ink/50 border-clay/50 hover:border-clay"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <h4 className="text-sm font-bold text-cream">{item.game_name}</h4>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {item.cognitive_domains.map((dom) => (
                          <span
                            key={dom}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-clay/30 text-cream/80 border border-clay/40"
                          >
                            {dom}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Latent θ Ability Badge */}
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-sun">
                        θ = {item.theta.toFixed(1)}
                      </span>
                      <p className="text-[10px] text-cream/50">±{item.sigma.toFixed(2)} σ</p>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 bg-ink/70 rounded-lg p-2.5 my-3 border border-clay/30 text-center">
                    <div>
                      <span className="text-[10px] text-cream/50 block">Current Lvl</span>
                      <span className="text-xs font-bold text-cream">Lvl {item.current_level}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-cream/50 block">Recommended</span>
                      <span className="text-xs font-bold text-sun">
                        Lvl {item.recommended_level}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-cream/50 block">Confidence</span>
                      <span
                        className={`text-xs font-bold capitalize ${
                          item.confidence === "high"
                            ? "text-tea-confirm"
                            : item.confidence === "medium"
                              ? "text-sun"
                              : "text-cream/50"
                        }`}
                      >
                        {item.confidence}
                      </span>
                    </div>
                  </div>

                  {/* Cooldown or Override Warning */}
                  {item.cooldown_active && (
                    <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-[11px] text-amber-200">
                      <Shield size={12} className="shrink-0 text-amber-400" />
                      <span>Step-down cooldown active (upward shift held)</span>
                    </div>
                  )}

                  {/* Override Selector */}
                  <div className="flex items-center gap-2 pt-1 border-t border-clay/30">
                    <label
                      htmlFor={`override-${item.game_id}`}
                      className="text-xs text-cream/70 whitespace-nowrap flex items-center gap-1.5"
                    >
                      <Sliders size={13} className="text-cream/50" />
                      Override:
                    </label>

                    <div className="relative flex-1">
                      <select
                        id={`override-${item.game_id}`}
                        disabled={isUpdating}
                        value={item.manual_override_level ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : Number(e.target.value);
                          handleOverrideChange(item.game_id, val);
                        }}
                        className="w-full bg-surface border border-clay rounded-lg px-2.5 py-1.5 text-xs text-cream focus:outline-none focus:border-sun cursor-pointer disabled:opacity-50"
                      >
                        <option value="">Auto (AI Rec: Level {item.recommended_level})</option>
                        {Array.from({ length: item.max_level }, (_, i) => i + 1).map((lvl) => (
                          <option key={lvl} value={lvl}>
                            Lock at Level {lvl}{" "}
                            {lvl === item.manual_override_level ? "★ (Active)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {hasOverride && (
                      <button
                        type="button"
                        onClick={() => handleOverrideChange(item.game_id, null)}
                        disabled={isUpdating}
                        className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-clay/30 hover:bg-clay/50 text-cream/80 hover:text-cream border border-clay/40 transition-colors cursor-pointer shrink-0"
                        title="Reset to automatic statistical recommendation"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
