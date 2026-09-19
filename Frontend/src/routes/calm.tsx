import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, HeartHandshake, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { SoundscapePlayer } from "@/features/wellbeing/components/SoundscapePlayer";

export const Route = createFileRoute("/calm")({
  head: () => ({
    meta: [
      { title: "Calm & Relax | SmritiSetu" },
      {
        name: "description",
        content: "Soothing natural ambient soundscapes and gentle relaxation for SmritiSetu.",
      },
    ],
  }),
  component: CalmPage,
});

function CalmPage() {
  const { t } = useLanguage();

  return (
    <AppShell className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header navigation bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="outline"
            className="rounded-full bg-[#121D2B] border-white/10 text-[#E8ECEF] hover:bg-white/5 shadow-sm font-semibold"
          >
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2 text-[#6FAF9A]" />
              <span>{t("common:backHome")}</span>
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-6 h-6 text-[#6FAF9A]" />
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[#E8ECEF]">
                {t("dashboard:calmTitle")}
              </h1>
            </div>
            <p className="text-sm text-[#8A99A8] mt-1 font-medium">{t("dashboard:calmSubtitle")}</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-[#6FAF9A]/15 border border-[#6FAF9A]/25 text-[#6FAF9A] text-xs font-bold shadow-sm">
          <Sparkles className="w-4 h-4" />
          <span>{t("dashboard:calmPeacefulCorner")}</span>
        </div>
      </div>

      {/* Ambient Soundscapes Section */}
      <SoundscapePlayer />
    </AppShell>
  );
}
