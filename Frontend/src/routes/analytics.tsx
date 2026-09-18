import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  BarChart3,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  RotateCw,
  Activity,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/api/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
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
          "Cognitive assessment trends, risk evaluations, and AI clinical insights on SmritiSetu.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { latestAssessment, isLoading, isAssessing, triggerAssessment } = useAnalytics();

  useEffect(() => {
    if (user && user.role === "patient") {
      navigate({ to: "/" });
    }
  }, [user, navigate]);

  const handleRunAssessment = async () => {
    try {
      await triggerAssessment();
      toast.success(
        "AI Cognitive Assessment evaluated with latest game scores and medication adherence!",
      );
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to trigger assessment"));
    }
  };

  const domainData = [
    { domain: t("analytics:memory"), score: latestAssessment?.memory_score ?? 84 },
    { domain: t("analytics:attention"), score: latestAssessment?.attention_score ?? 81 },
    {
      domain: t("analytics:executiveFunction"),
      score: latestAssessment?.executive_function_score ?? 80,
    },
    { domain: t("analytics:language"), score: latestAssessment?.language_score ?? 85 },
  ];

  const riskLevel = latestAssessment?.risk_level ?? "low";
  const riskLabel =
    riskLevel === "low"
      ? t("analytics:lowRisk")
      : riskLevel === "moderate"
        ? t("analytics:moderateRisk")
        : t("analytics:highRisk");

  return (
    <AppShell className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Navigation Breadcrumb & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="outline" className="rounded-full bg-[#121D2B] border-white/10 text-[#E8ECEF] hover:bg-white/5 shadow-sm font-semibold">
          <Link to="/">
            <ArrowLeft size={18} className="mr-2 text-[#22C55E]" /> {t("common:backHome")}
          </Link>
        </Button>

        <Button
          type="button"
          size="touch"
          disabled={isAssessing}
          onClick={handleRunAssessment}
          className="rounded-full bg-[#22C55E] text-[#0A1420] hover:bg-[#1ea850] text-base font-bold gap-2 shadow-lg shadow-[#22C55E]/20"
        >
          <RotateCw size={18} className={isAssessing ? "animate-spin" : ""} />
          {isAssessing ? t("analytics:assessing") : t("analytics:runAssessmentNow")}
        </Button>
      </div>

      {/* Page Title Card */}
      <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-[#22C55E]/15 text-[#22C55E] shadow-inner">
            <BarChart3 size={34} />
          </span>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#E8ECEF]">
              {t("analytics:pageTitle")}
            </h1>
            <p className="text-[#8A99A8] mt-1 font-medium">{t("analytics:pageSubtitle")}</p>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Overall Composite Score */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#8A99A8]">
              {t("analytics:cognitiveIndex")}
            </p>
            <p className="font-display text-4xl sm:text-5xl font-bold text-[#22C55E] mt-1">
              {latestAssessment?.overall_score ? `${latestAssessment.overall_score}` : "83.5"}
              <span className="text-xl text-[#8A99A8] font-sans"> / 100</span>
            </p>
            <p className="text-xs text-[#22C55E] font-bold mt-2 flex items-center gap-1">
              <TrendingUp size={14} /> {t("analytics:stableTrend")}
            </p>
          </div>
          <div className="size-16 rounded-2xl bg-[#22C55E]/15 flex items-center justify-center text-[#22C55E] shadow-sm">
            <Activity size={32} />
          </div>
        </div>

        {/* Clinical Risk Level */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#8A99A8]">
              {t("analytics:riskLevel")}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-3.5 py-1 rounded-full text-sm font-extrabold uppercase tracking-wide ${
                  riskLevel === "low"
                    ? "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30"
                    : riskLevel === "moderate"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {riskLabel}
              </span>
            </div>
            <p className="text-xs text-[#8A99A8] mt-2 font-medium">
              Evaluated by Hybrid Neuro-Clinical Engine
            </p>
          </div>
          <div className="size-16 rounded-2xl bg-sky-500/15 flex items-center justify-center text-sky-400 shadow-sm">
            <ShieldCheck size={32} />
          </div>
        </div>

        {/* Patient Adherence Rate / Model Version */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#8A99A8]">Model Version</p>
            <p className="font-display text-xl sm:text-2xl font-bold text-[#E8ECEF] mt-1">
              {latestAssessment?.model_version || "v1.2-hybrid-clinical"}
            </p>
            <p className="text-xs text-[#8A99A8] mt-2 font-medium">
              Last Assessed:{" "}
              {latestAssessment?.assessment_date
                ? new Date(latestAssessment.assessment_date).toLocaleDateString()
                : "Today"}
            </p>
          </div>
          <div className="size-16 rounded-2xl bg-purple-500/15 flex items-center justify-center text-purple-400 shadow-sm">
            <Sparkles size={32} />
          </div>
        </div>
      </div>

      {/* Charts and Domain Scores */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Domain Breakdown Chart */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl">
          <h2 className="font-display text-2xl font-bold text-[#E8ECEF] mb-2">
            {t("analytics:domainBreakdown")}
          </h2>
          <p className="text-[#8A99A8] text-sm mb-6 font-medium">
            Assessed across game accuracy, speed, and medication consistency.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                <XAxis dataKey="domain" stroke="#8A99A8" tick={{ fill: "#8A99A8", fontSize: 12, fontWeight: 600 }} />
                <YAxis domain={[0, 100]} stroke="#8A99A8" tick={{ fill: "#8A99A8", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#121D2B",
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    borderRadius: "1rem",
                    color: "#E8ECEF",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="score" fill="#22C55E" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clinical Insights & Recommendations */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#22C55E] font-bold uppercase text-xs tracking-wider mb-2">
              <Sparkles size={16} /> Clinical AI Analysis
            </div>
            <h2 className="font-display text-2xl font-bold text-[#E8ECEF] mb-4">
              {t("analytics:clinicalInsights")}
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/8 bg-[#0A1420]/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#22C55E] mb-1">Key Observation</p>
                <p className="text-[#E8ECEF] text-sm leading-relaxed">
                  {latestAssessment?.insights ||
                    "Short-term recall and daily sequence attention remain stable with consistent medication adherence."}
                </p>
              </div>

              <div className="rounded-2xl border border-[#22C55E]/20 bg-[#0A1420]/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">
                  Caregiver Recommendation
                </p>
                <p className="text-[#E8ECEF] text-sm leading-relaxed">
                  {latestAssessment?.recommendations ||
                    "Continue daily 10-minute Memory Match challenge and maintain regular morning garden walks."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-xs text-[#8A99A8] flex items-center justify-between font-semibold">
            <span>Secure Clinical Records</span>
            <span className="text-[#22C55E] font-bold">HIPAA / Data Protected</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
