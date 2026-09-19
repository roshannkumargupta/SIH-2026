import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  RotateCw,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Info,
  Pill,
  CheckSquare,
  Brain,
  Layers,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/api/client";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "AI Cognitive Analytics | SmritiSetu" },
      {
        name: "description",
        content:
          "Longitudinal cognitive assessment trends, 5-domain evaluations, and telemetry insights on SmritiSetu.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function parseList(raw: string[] | string | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "string") return [parsed];
  } catch {
    // raw is a plain string
  }
  return [raw];
}

function AnalyticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [trendDays] = useState<number>(90);
  const [selectedDomainView, setSelectedDomainView] = useState<string>("all");

  const { latestAssessment, trends, isLoading, isAssessing, triggerAssessment } =
    useAnalytics(undefined, trendDays);

  useEffect(() => {
    if (user && user.role === "patient") {
      navigate({ to: "/" });
    }
  }, [user, navigate]);

  const handleRunAssessment = async () => {
    try {
      await triggerAssessment();
      toast.success(
        "AI Cognitive Assessment recalculated using latest gameplay telemetry across all 5 domains!",
      );
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to trigger assessment"));
    }
  };

  const domainScores = useMemo(() => {
    return [
      {
        key: "memory",
        name: t("analytics:memory", { defaultValue: "Memory" }),
        score: latestAssessment?.memory_score ?? null,
        description: "Recall, sequence retention, and working memory",
        recommendedGames: "N-Back, Card Matching, Simon Says, Delayed Recall",
      },
      {
        key: "attention",
        name: t("analytics:attention", { defaultValue: "Attention" }),
        score: latestAssessment?.attention_score ?? null,
        description: "Selective focus, response inhibition, and processing speed",
        recommendedGames: "Stroop, Schulte Table, Reaction Time, Visual Search",
      },
      {
        key: "executive_function",
        name: t("analytics:executiveFunction", { defaultValue: "Executive Function" }),
        score: latestAssessment?.executive_function_score ?? null,
        description: "Problem solving, planning, rule shifting, and logic",
        recommendedGames: "Water Jugs, Tower of Hanoi, Ball Sort, Trail Making",
      },
      {
        key: "language",
        name: t("analytics:language", { defaultValue: "Language" }),
        score: latestAssessment?.language_score ?? null,
        description: "Verbal fluency, semantic naming, and lexical access",
        recommendedGames: "Word Scramble, Anagram Solver, Cultural Recognition",
      },
      {
        key: "visuospatial",
        name: t("analytics:visuospatial", { defaultValue: "Visuospatial" }),
        score: latestAssessment?.visuospatial_score ?? null,
        description: "Spatial orientation, rotation, and pattern perception",
        recommendedGames: "Mental Rotation, Maze, Pattern Matrix",
      },
    ];
  }, [latestAssessment, t]);

  // Radar chart data (null values mapped to 0 with flag)
  const radarData = useMemo(() => {
    return domainScores.map((d) => ({
      domain: d.name,
      score: d.score !== null ? Math.round(d.score) : 0,
      fullMark: 100,
      hasData: d.score !== null,
    }));
  }, [domainScores]);

  // 90-day trend data
  const trendPoints = useMemo(() => {
    const list = trends?.trends || trends?.data_points || [];
    return list.map((item) => ({
      date: item.date,
      overall: item.overall_score != null ? Math.round(item.overall_score) : null,
      memory: item.memory_score != null ? Math.round(item.memory_score) : null,
      attention: item.attention_score != null ? Math.round(item.attention_score) : null,
      executive:
        item.executive_function_score != null
          ? Math.round(item.executive_function_score)
          : null,
      language: item.language_score != null ? Math.round(item.language_score) : null,
      visuospatial:
        item.visuospatial_score != null
          ? Math.round(item.visuospatial_score)
          : null,
    }));
  }, [trends]);

  const riskLevel = latestAssessment?.risk_level ?? "unassessable";
  const riskBadgeConfig = {
    low: {
      bg: "bg-[#6FAF9A]/20 text-[#6FAF9A] border-[#6FAF9A]/30",
      label: t("analytics:lowRisk", { defaultValue: "Low Risk" }),
    },
    moderate: {
      bg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      label: t("analytics:moderateRisk", { defaultValue: "Moderate Risk" }),
    },
    high: {
      bg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      label: t("analytics:highRisk", { defaultValue: "High Risk" }),
    },
    critical: {
      bg: "bg-red-700/30 text-red-300 border-red-500/40",
      label: t("analytics:criticalRisk", { defaultValue: "Critical Alert" }),
    },
    unassessable: {
      bg: "bg-slate-700/30 text-slate-300 border-slate-600/30",
      label: t("analytics:unassessableRisk", { defaultValue: "Insufficient Data" }),
    },
  }[riskLevel] || {
    bg: "bg-slate-700/30 text-slate-300 border-slate-600/30",
    label: "Insufficient Data",
  };

  const insightsList = parseList(latestAssessment?.insights);
  const recommendationsList = parseList(latestAssessment?.recommendations);

  const declineAlertActive = Boolean(trends?.decline_alert_active);
  const declineDomains = trends?.decline_domains || [];

  return (
    <AppShell className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Navigation Breadcrumb & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          asChild
          variant="outline"
          className="rounded-full bg-[#121D2B] border-white/10 text-[#E8ECEF] hover:bg-white/5 shadow-sm font-semibold"
        >
          <Link to="/">
            <ArrowLeft size={18} className="mr-2 text-[#6FAF9A]" /> {t("common:backHome")}
          </Link>
        </Button>

        <Button
          type="button"
          size="touch"
          disabled={isAssessing || isLoading}
          onClick={handleRunAssessment}
          className="rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] text-base font-bold gap-2 shadow-lg shadow-[#6FAF9A]/20"
        >
          <RotateCw size={18} className={isAssessing ? "animate-spin" : ""} />
          {isAssessing ? t("analytics:assessing") : t("analytics:runAssessmentNow")}
        </Button>
      </div>

      {/* Non-Diagnostic Disclaimer Banner */}
      <div className="rounded-2xl border border-sky-500/20 bg-sky-950/30 p-4 sm:p-5 flex items-start gap-3.5 shadow-md">
        <Info className="size-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-sky-100/90 leading-relaxed space-y-1">
          <span className="font-semibold text-sky-300 uppercase tracking-wide mr-1.5">
            Heuristic Estimation Notice:
          </span>
          These cognitive scores are heuristic telemetry estimates derived from interactive
          gameplay accuracy and difficulty progression. They are intended for caregiver
          tracking and <strong>do not constitute a formal clinical diagnosis</strong>. Please
          consult a qualified neurologist or physician for clinical medical evaluations.
        </div>
      </div>

      {/* Sustained Cognitive Decline Alert Banner */}
      {declineAlertActive && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-5 flex items-start gap-4 shadow-xl">
          <AlertTriangle className="size-6 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1 text-sm text-rose-100">
            <h3 className="font-bold text-base text-rose-300">
              Cognitive Decline Alert Triggered
            </h3>
            <p className="leading-relaxed">
              Sustained downward performance detected across{" "}
              <strong>{declineDomains.length} domains</strong> (
              {declineDomains.map((d) => d.replace("_", " ")).join(", ")}) over 14+
              consecutive days. A professional clinical review with the primary healthcare
              provider is strongly recommended.
            </p>
          </div>
        </div>
      )}

      {/* Page Title Card */}
      <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-[#6FAF9A]/15 text-[#6FAF9A] shadow-inner">
            <BarChart3 size={34} />
          </span>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#E8ECEF]">
              {t("analytics:pageTitle")}
            </h1>
            <p className="text-[#8A99A8] mt-1 font-medium text-sm sm:text-base">
              Comprehensive 5-domain cognitive progression, recency-weighted telemetry, and
              decoupled adherence analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Top Metric Cards (4 Grid items) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Composite Cognitive Index */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8A99A8]">
              {t("analytics:cognitiveIndex")}
            </p>
            <div className="size-10 rounded-xl bg-[#6FAF9A]/15 flex items-center justify-center text-[#6FAF9A]">
              <Brain size={20} />
            </div>
          </div>
          <div className="my-4">
            {latestAssessment?.overall_score !== null &&
            latestAssessment?.overall_score !== undefined ? (
              <p className="font-display text-4xl sm:text-5xl font-bold text-[#6FAF9A]">
                {Math.round(latestAssessment.overall_score)}
                <span className="text-lg text-[#8A99A8] font-sans"> / 100</span>
              </p>
            ) : (
              <div>
                <p className="font-display text-2xl font-bold text-amber-300">
                  Insufficient Data
                </p>
                <p className="text-xs text-[#8A99A8] mt-1">Play games across ≥3 domains</p>
              </div>
            )}
          </div>
          <div className="text-xs font-bold flex items-center gap-1.5 pt-2 border-t border-white/5">
            {trends?.trend_direction === "improving" ? (
              <span className="text-[#6FAF9A] flex items-center gap-1">
                <TrendingUp size={14} /> Improving Trend
              </span>
            ) : trends?.trend_direction === "declining" ? (
              <span className="text-rose-400 flex items-center gap-1">
                <TrendingDown size={14} /> Declining Trend
              </span>
            ) : trends?.trend_direction === "stable" ? (
              <span className="text-sky-400 flex items-center gap-1">
                <Minus size={14} /> Stable Baseline
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <Minus size={14} /> Gathering Telemetry
              </span>
            )}
          </div>
        </div>

        {/* Clinical Risk Level */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8A99A8]">
              {t("analytics:riskLevel")}
            </p>
            <div className="size-10 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="my-4">
            <span
              className={`inline-block px-3.5 py-1.5 rounded-full text-sm font-extrabold uppercase tracking-wide border ${riskBadgeConfig.bg}`}
            >
              {riskBadgeConfig.label}
            </span>
          </div>
          <p className="text-xs text-[#8A99A8] pt-2 border-t border-white/5 font-medium">
            Threshold evaluated against active gameplay telemetry
          </p>
        </div>

        {/* Separate Adherence Telemetry Card */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8A99A8]">
              Patient Adherence
            </p>
            <div className="size-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
              <Pill size={20} />
            </div>
          </div>
          <div className="my-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#8A99A8] flex items-center gap-1.5">
                <Pill size={14} className="text-purple-400" /> Medications:
              </span>
              <span className="font-bold text-[#E8ECEF]">
                {latestAssessment?.adherence?.medication_rate !== null &&
                latestAssessment?.adherence?.medication_rate !== undefined
                  ? `${Math.round(latestAssessment.adherence.medication_rate)}%`
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#8A99A8] flex items-center gap-1.5">
                <CheckSquare size={14} className="text-[#6FAF9A]" /> Daily Tasks:
              </span>
              <span className="font-bold text-[#E8ECEF]">
                {latestAssessment?.adherence?.task_rate !== null &&
                latestAssessment?.adherence?.task_rate !== undefined
                  ? `${Math.round(latestAssessment.adherence.task_rate)}%`
                  : "N/A"}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#8A99A8] pt-2 border-t border-white/5 font-medium leading-tight">
            Decoupled from cognitive scoring
          </p>
        </div>

        {/* Scoring Engine & Version */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8A99A8]">
              Engine Version
            </p>
            <div className="size-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="my-4">
            <p className="font-display text-xl font-bold text-[#E8ECEF]">
              {latestAssessment?.model_version || "2.0-heuristic"}
            </p>
            <p className="text-xs text-[#8A99A8] mt-1 font-medium">
              5-Domain Recency-Weighted Heuristic
            </p>
          </div>
          <p className="text-xs text-[#8A99A8] pt-2 border-t border-white/5 font-medium">
            Assessed:{" "}
            {latestAssessment?.assessment_date
              ? new Date(latestAssessment.assessment_date).toLocaleDateString()
              : "Pending"}
          </p>
        </div>
      </div>

      {/* 5-Domain Radar Chart + Domain Detailed Cards */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Radar Chart (5 columns) */}
        <div className="lg:col-span-5 rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-2xl font-bold text-[#E8ECEF]">
                5-Domain Cognitive Radar
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-[#8A99A8] font-bold">
                Clinical Domains
              </span>
            </div>
            <p className="text-[#8A99A8] text-sm mb-6 font-medium">
              Balanced spatial representation across Memory, Attention, Executive Function,
              Language, and Visuospatial domains.
            </p>

            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
                  <PolarAngleAxis
                    dataKey="domain"
                    tick={{ fill: "#A0AEC0", fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="#4A5568"
                    tick={{ fill: "#718096", fontSize: 10 }}
                  />
                  <Radar
                    name="Domain Score"
                    dataKey="score"
                    stroke="#6FAF9A"
                    fill="#6FAF9A"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#121D2B",
                      borderColor: "rgba(255, 255, 255, 0.15)",
                      borderRadius: "0.75rem",
                      color: "#E8ECEF",
                    }}
                    formatter={(value: any, _name: any, item: any) => {
                      if (!item.payload.hasData) return ["Insufficient Data (Play games)", "Score"];
                      return [`${value} / 100`, "Score"];
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-xs text-[#8A99A8] flex items-center justify-between font-medium">
            <span>Null domains displayed at origin</span>
            <span className="text-[#6FAF9A] font-semibold">Normalized [0 - 100]</span>
          </div>
        </div>

        {/* Domain Detailed Breakdown List (7 columns) */}
        <div className="lg:col-span-7 rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl">
          <h2 className="font-display text-2xl font-bold text-[#E8ECEF] mb-2">
            Domain Telemetry Breakdown
          </h2>
          <p className="text-[#8A99A8] text-sm mb-6 font-medium">
            Actual gameplay performance mapping. Domains without recent sessions indicate
            insufficient data.
          </p>

          <div className="space-y-4">
            {domainScores.map((domain) => {
              const slope = trends?.domain_slopes?.[domain.key];
              return (
                <div
                  key={domain.key}
                  className="rounded-2xl border border-white/5 bg-[#0A1420]/70 p-4 transition-all hover:border-white/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="font-bold text-base text-[#E8ECEF] mr-2">
                        {domain.name}
                      </span>
                      <span className="text-xs text-[#8A99A8]">{domain.description}</span>
                    </div>
                    {domain.score !== null ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-display font-bold text-[#6FAF9A]">
                          {Math.round(domain.score)}
                          <span className="text-xs text-[#8A99A8] font-sans"> / 100</span>
                        </span>
                        {slope?.declining && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            14d Decline
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Insufficient Data
                      </span>
                    )}
                  </div>

                  {/* Progress bar or fallback hint */}
                  {domain.score !== null ? (
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#6FAF9A] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, domain.score))}%` }}
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic bg-white/2 rounded-lg p-2 mt-1">
                      No gameplay sessions recorded in this domain. Recommended games:{" "}
                      <span className="text-sky-300 not-italic font-medium">
                        {domain.recommendedGames}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 90-Day Longitudinal Cognitive Trends Line Chart */}
      <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#E8ECEF]">
              90-Day Longitudinal Trajectory
            </h2>
            <p className="text-[#8A99A8] text-sm mt-1 font-medium">
              Historical progression and multi-domain regression trends across daily snapshots.
            </p>
          </div>

          {/* Domain Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-[#0A1420] rounded-xl border border-white/5">
            {[
              { id: "all", label: "All Domains" },
              { id: "overall", label: "Composite Index" },
              { id: "memory", label: "Memory" },
              { id: "attention", label: "Attention" },
              { id: "executive", label: "Executive" },
              { id: "language", label: "Language" },
              { id: "visuospatial", label: "Visuospatial" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDomainView(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDomainView === tab.id
                    ? "bg-[#6FAF9A] text-[#0A1420] shadow-md"
                    : "text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {trendPoints.length > 0 ? (
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#8A99A8"
                  tick={{ fill: "#8A99A8", fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#8A99A8"
                  tick={{ fill: "#8A99A8", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#121D2B",
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    borderRadius: "1rem",
                    color: "#E8ECEF",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />

                {(selectedDomainView === "all" || selectedDomainView === "overall") && (
                  <Line
                    type="monotone"
                    dataKey="overall"
                    name="Composite Index"
                    stroke="#6FAF9A"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#6FAF9A" }}
                    connectNulls
                  />
                )}
                {(selectedDomainView === "all" || selectedDomainView === "memory") && (
                  <Line
                    type="monotone"
                    dataKey="memory"
                    name="Memory"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                )}
                {(selectedDomainView === "all" || selectedDomainView === "attention") && (
                  <Line
                    type="monotone"
                    dataKey="attention"
                    name="Attention"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                )}
                {(selectedDomainView === "all" || selectedDomainView === "executive") && (
                  <Line
                    type="monotone"
                    dataKey="executive"
                    name="Executive Function"
                    stroke="#A855F7"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                )}
                {(selectedDomainView === "all" || selectedDomainView === "language") && (
                  <Line
                    type="monotone"
                    dataKey="language"
                    name="Language"
                    stroke="#EC4899"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                )}
                {(selectedDomainView === "all" || selectedDomainView === "visuospatial") && (
                  <Line
                    type="monotone"
                    dataKey="visuospatial"
                    name="Visuospatial"
                    stroke="#14B8A6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-16 text-center text-[#8A99A8] bg-[#0A1420]/50 rounded-2xl border border-white/5">
            <Layers className="size-10 mx-auto text-slate-500 mb-3" />
            <p className="font-semibold text-base text-[#E8ECEF]">
              Longitudinal Baseline Initializing
            </p>
            <p className="text-sm max-w-md mx-auto mt-1">
              As regular cognitive gameplay sessions are completed over time, 90-day trajectory
              curves and trend slopes will populate here.
            </p>
          </div>
        )}
      </div>

      {/* Clinical Observations & Caregiver Insights */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Observations Card */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#6FAF9A] font-bold uppercase text-xs tracking-wider mb-2">
              <Sparkles size={16} /> Automated Telemetry Observations
            </div>
            <h2 className="font-display text-2xl font-bold text-[#E8ECEF] mb-4">
              Clinical Insights
            </h2>

            <div className="space-y-3">
              {insightsList.length > 0 ? (
                insightsList.map((insight, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/8 bg-[#0A1420]/80 p-4 text-sm text-[#E8ECEF] leading-relaxed flex items-start gap-2.5"
                  >
                    <span className="size-1.5 rounded-full bg-[#6FAF9A] mt-2 shrink-0" />
                    <span>{insight}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/8 bg-[#0A1420]/80 p-4 text-sm text-[#8A99A8]">
                  Play games across clinical domains to generate automated insights.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-xs text-[#8A99A8] flex items-center justify-between font-semibold">
            <span>Algorithm: Exponential Recency Decay (λ=0.099/day)</span>
            <span className="text-[#6FAF9A]">Validated Scoring Map</span>
          </div>
        </div>

        {/* Caregiver Recommendations & Methodology Card */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-wider mb-2">
              <Compass size={16} /> Caregiver Guidance
            </div>
            <h2 className="font-display text-2xl font-bold text-[#E8ECEF] mb-4">
              Targeted Recommendations
            </h2>

            <div className="space-y-3">
              {recommendationsList.length > 0 ? (
                recommendationsList.map((rec, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-sky-500/20 bg-[#0A1420]/80 p-4 text-sm text-[#E8ECEF] leading-relaxed flex items-start gap-2.5"
                  >
                    <span className="size-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/8 bg-[#0A1420]/80 p-4 text-sm text-[#8A99A8]">
                  Recommendations will be personalized once baseline exercises are established.
                </div>
              )}
            </div>
          </div>

          {/* Engine Methodology Disclosure */}
          <div className="mt-6 pt-4 border-t border-white/10 text-xs text-[#8A99A8]">
            <p className="font-medium">
              <span className="text-white/80 font-bold">Methodology: </span>
              {latestAssessment?.method_description ||
                "Exponential recency-weighting (7-day half-life) applied to actual gameplay accuracy and difficulty progression across 24 cognitive games. Adherence telemetry is strictly decoupled."}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
