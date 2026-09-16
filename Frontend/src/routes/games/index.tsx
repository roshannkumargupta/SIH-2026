import { createFileRoute } from "@tanstack/react-router";
import { NavigationHeader } from "@/components/navigation-header";
import { GameDashboard } from "@/features/games/components/GameDashboard";

export const Route = createFileRoute("/games/")({
  head: () => ({
    meta: [
      { title: "Cognitive Training Centre | SmritiSetu" },
      {
        name: "description",
        content:
          "Train memory, attention, focus, reaction speed, and problem-solving through 24 interactive cognitive exercises designed for elderly care and brain health.",
      },
    ],
  }),
  component: CognitiveGamesPage,
});

function CognitiveGamesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavigationHeader />
      <main className="flex-1 mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12 w-full">
        <GameDashboard />
      </main>
    </div>
  );
}
