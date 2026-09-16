import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import Stroop from "@/features/games/games/Stroop";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/stroop")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Stroop | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: StroopPage,
});

function StroopPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("stroop")!;
  return (
    <GameShell game={game} level={level}>
      <Stroop level={level} />
    </GameShell>
  );
}
