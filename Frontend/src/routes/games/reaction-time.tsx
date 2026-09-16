import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import ReactionTime from "@/features/games/games/ReactionTime";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/reaction-time")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Reaction Time | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: ReactionTimePage,
});

function ReactionTimePage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("reaction-time")!;
  return (
    <GameShell game={game} level={level}>
      <ReactionTime level={level} />
    </GameShell>
  );
}
