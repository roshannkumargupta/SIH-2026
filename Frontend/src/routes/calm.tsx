import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, HeartHandshake, Sparkles } from "lucide-react";
import { NavigationHeader } from "@/components/navigation-header";
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
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-background to-background dark:from-slate-950 dark:via-background dark:to-background">
      <NavigationHeader />

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header navigation bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800"
                aria-label="Back to home"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t("dashboard:calmTitle")}
                </h1>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {t("dashboard:calmSubtitle")}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/60 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{t("dashboard:calmPeacefulCorner")}</span>
          </div>
        </div>

        {/* Ambient Soundscapes Section */}
        <SoundscapePlayer />
      </main>
    </div>
  );
}
