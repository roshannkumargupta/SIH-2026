import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import SimonSays from "@/features/games/games/SimonSays";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/simon-says")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Simon Says | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: SimonSaysPage,
});

function SimonSaysPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("simon-says")!;
  return (
    <GameShell game={game} level={level}>
      <SimonSays level={level} />
    </GameShell>
  );
}
