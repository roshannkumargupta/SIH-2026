import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import BallSort from "@/features/games/games/BallSort";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/ball-sort")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Ball Sort | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: BallSortPage,
});

function BallSortPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("ball-sort")!;
  return (
    <GameShell game={game} level={level}>
      <BallSort level={level} />
    </GameShell>
  );
}
