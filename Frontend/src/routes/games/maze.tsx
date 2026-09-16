import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import Maze from "@/features/games/games/Maze";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/maze")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Maze | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: MazePage,
});

function MazePage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("maze")!;
  return (
    <GameShell game={game} level={level}>
      <Maze level={level} />
    </GameShell>
  );
}
