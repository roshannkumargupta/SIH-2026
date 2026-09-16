import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import MentalRotation from "@/features/games/games/MentalRotation";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/mental-rotation")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Mental Rotation | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: MentalRotationPage,
});

function MentalRotationPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("mental-rotation")!;
  return (
    <GameShell game={game} level={level}>
      <MentalRotation level={level} />
    </GameShell>
  );
}
