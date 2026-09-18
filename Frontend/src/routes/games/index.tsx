import { createFileRoute } from "@tanstack/react-router";
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
    <div className="px-4 sm:px-8 py-6 max-w-[1550px] w-full mx-auto">
      <GameDashboard />
    </div>
  );
}
