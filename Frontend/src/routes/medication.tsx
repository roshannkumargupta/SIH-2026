import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Pill, ArrowLeft, Check, Clock, FileText, Calendar, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMedications } from "@/hooks/use-medications";
import { useLanguage } from "@/context/LanguageContext";
import type { MedicationLogStatus } from "@/types/api";
import { formatApiError } from "../api/client";

export const Route = createFileRoute("/medication")({
  head: () => ({
    meta: [
      { title: "Medication & Reminders | SmritiSetu" },
      {
        name: "description",
        content: "Clear daily medication schedules and dosage logs on SmritiSetu.",
      },
    ],
  }),
  component: MedicationPage,
});

function MedicationPage() {
  const { todaySchedules, todayLogs, prescriptions, updateLogStatus, isLoading } = useMedications();
  const [activeTab, setActiveTab] = useState<"today" | "prescriptions">("today");
  const { t } = useLanguage();

  const totalLogs = todayLogs.length || 1;
  const takenCount = todayLogs.filter((l) => l.status === "taken").length;
  const adherence = Math.round((takenCount / totalLogs) * 100);

  const handleStatusChange = async (logId: string, status: MedicationLogStatus) => {
    try {
      await updateLogStatus({ logId, status });
      toast.success(
        status === "taken"
          ? t("medication:markedTaken")
          : status === "skipped"
            ? t("medication:markedSkipped")
            : t("medication:statusUpdated"),
      );
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to update medication status"));
    }
  };

  return (
    <AppShell progress={adherence}>
      <div className="px-4 sm:px-8 py-6 max-w-[1550px] w-full mx-auto space-y-7">
        {/* Navigation Breadcrumb & Tab Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button asChild variant="outline" className="rounded-full bg-[#121D2B] border-white/8 text-[#E8ECEF] hover:bg-[#152335] shadow-sm font-semibold">
            <Link to="/">
              <ArrowLeft size={18} className="mr-2 text-[#22C55E]" /> {t("common:backHome")}
            </Link>
          </Button>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 bg-[#121D2B] p-1.5 rounded-full border border-white/8 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("today")}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                activeTab === "today"
                  ? "bg-[#22C55E] text-[#0A1420] shadow-md"
                  : "text-[#8A99A8] hover:text-[#E8ECEF]"
              }`}
            >
              {t("medication:todaysDoses")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("prescriptions")}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                activeTab === "prescriptions"
                  ? "bg-[#22C55E] text-[#0A1420] shadow-md"
                  : "text-[#8A99A8] hover:text-[#E8ECEF]"
              }`}
            >
              {t("medication:doctorsPrescriptions")} ({prescriptions.length})
            </button>
          </div>
        </div>

        {/* Page Header & Adherence Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-[#13283E] via-[#0F2032] to-[#0A1420] p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-[#22C55E]/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-[#22C55E] text-[#0A1420] shadow-md shrink-0">
                <Pill size={34} />
              </span>
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#E8ECEF]">
                  {t("medication:pageTitle")}
                </h1>
                <p className="text-[#8A99A8] mt-1 font-medium text-sm sm:text-base">{t("medication:pageSubtitle")}</p>
              </div>
            </div>

            {/* Adherence progress badge */}
            <div className="w-full sm:w-64 bg-[#121D2B]/85 border border-white/8 p-4 rounded-2xl shadow-md">
              <div className="flex justify-between text-sm font-bold text-[#E8ECEF] mb-2">
                <span>{t("medication:todaysAdherence")}</span>
                <span className="text-[#22C55E] font-extrabold">{adherence}%</span>
              </div>
              <Progress value={adherence} className="h-2 bg-white/10 [&>div]:bg-[#22C55E] rounded-full" />
              <p className="mt-2 text-xs text-[#8A99A8] font-semibold text-right">
                {takenCount} {t("dashboard:completedOf")} {todayLogs.length}
              </p>
            </div>
          </div>
        </div>

        {activeTab === "today" ? (
          /* Today's Medication Logs Timeline */
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground text-lg">{t("common:loading")}</div>
            ) : todayLogs.length === 0 ? (
              <div className="rounded-3xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-12 text-center shadow-md">
                <Pill size={48} className="mx-auto text-[#22C55E]/40 mb-4" />
                <h2 className="font-display text-2xl font-bold text-[#E8ECEF]">
                  {t("dashboard:noMedsAssigned")}
                </h2>
                <p className="text-[#8A99A8] mt-2">{t("dashboard:noMedsSubtext")}</p>
              </div>
            ) : (
              todayLogs.map((log) => {
                const schedule = todaySchedules.find((s) => s.id === log.schedule_id);
                const isTaken = log.status === "taken";
                const isSkipped = log.status === "skipped";

                return (
                  <article
                    key={log.id}
                    className={`rounded-2xl border p-6 sm:p-7 transition shadow-md backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
                      isTaken
                        ? "border-[#22C55E]/30 bg-[#121D2B]/90 text-[#E8ECEF]"
                        : isSkipped
                          ? "border-white/5 bg-white/5 text-[#8A99A8] opacity-70"
                          : "border-white/8 bg-[#121D2B]/85 text-[#E8ECEF] hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`flex size-13 shrink-0 items-center justify-center rounded-2xl transition ${
                          isTaken
                            ? "bg-[#22C55E] text-[#0A1420] shadow-sm"
                            : isSkipped
                              ? "bg-white/5 text-[#8A99A8] border border-white/10"
                              : "bg-[#E0A23B]/15 text-[#E0A23B] border border-[#E0A23B]/30"
                        }`}
                      >
                        {isTaken ? (
                          <Check size={26} strokeWidth={3} />
                        ) : isSkipped ? (
                          <XCircle size={26} />
                        ) : (
                          <Clock size={26} />
                        )}
                      </span>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-display text-xl sm:text-2xl font-bold text-[#E8ECEF]">
                            {schedule?.medicine_name || "Prescribed Medicine"}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                              isTaken
                                ? "bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30"
                                : isSkipped
                                  ? "bg-white/5 text-[#8A99A8] border border-white/10"
                                  : "bg-[#E0A23B]/15 text-[#E0A23B] border border-[#E0A23B]/30"
                            }`}
                          >
                            {isTaken
                              ? t("medication:takenBadge")
                              : isSkipped
                                ? t("medication:skippedBadge")
                                : t("medication:dueBadge")}
                          </span>
                        </div>

                        <p className="text-[#22C55E] font-bold mt-1 text-base sm:text-lg">
                          {schedule?.scheduled_time
                            ? schedule.scheduled_time.slice(0, 5)
                            : "10:00 AM"}{" "}
                          · {schedule?.dosage || "1 tablet"}
                        </p>

                        <p className="text-[#8A99A8] text-sm mt-1">
                          {schedule?.instructions || t("medication:instructions")}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {isTaken ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(log.id, "scheduled")}
                          className="rounded-full border-white/10 bg-[#0A1420] text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5 w-full sm:w-auto"
                        >
                          {t("dashboard:markNotTaken")}
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            size="touch"
                            onClick={() => handleStatusChange(log.id, "taken")}
                            className="rounded-full bg-[#22C55E] text-[#0A1420] hover:bg-[#1ea850] font-bold shadow-md w-full sm:w-auto text-base"
                          >
                            <Check size={18} className="mr-2" /> {t("dashboard:takeMedicine")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="touch"
                            onClick={() => handleStatusChange(log.id, "skipped")}
                            className="rounded-full border-white/10 bg-[#0A1420] text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5"
                          >
                            {t("medication:skippedBadge")}
                          </Button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        ) : (
          /* Prescriptions List Tab */
          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <div className="rounded-3xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-12 text-center text-[#8A99A8] shadow-md">
                <FileText size={48} className="mx-auto text-[#22C55E]/40 mb-4" />
                <h2 className="font-display text-2xl font-bold text-[#E8ECEF]">
                  {t("medication:noPrescriptionsFound")}
                </h2>
                <p className="text-[#8A99A8] mt-2">{t("dashboard:noMedsSubtext")}</p>
              </div>
            ) : (
              prescriptions.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-6 sm:p-8 shadow-md flex flex-col sm:flex-row justify-between gap-6"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-[#4DA3E0]/15 text-[#4DA3E0] border border-[#4DA3E0]/30">
                      <FileText size={24} />
                    </span>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-2xl font-bold text-[#E8ECEF]">
                          {p.medicine_name}
                        </h3>
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[#22C55E] font-bold mt-1 text-base">
                        {t("medication:dosage")}: {p.dosage} ({p.route || "Oral"})
                      </p>
                      {p.instructions && (
                        <p className="text-[#8A99A8] text-sm mt-2 max-w-xl">
                          <span className="font-bold text-[#E8ECEF]">
                            {t("medication:instructions")}:
                          </span>{" "}
                          {p.instructions}
                        </p>
                      )}
                      <p className="text-xs text-[#8A99A8] mt-2 flex items-center gap-1.5 font-medium">
                        <Calendar size={14} /> {p.start_date}
                        {p.end_date ? ` · ${p.end_date}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
