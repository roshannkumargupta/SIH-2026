import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import LogicPuzzles from "@/features/games/games/LogicPuzzles";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/logic-puzzles")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Logic Puzzles | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: LogicPuzzlesPage,
});

function LogicPuzzlesPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("logic-puzzles")!;
  return (
    <GameShell game={game} level={level}>
      <LogicPuzzles level={level} />
    </GameShell>
  );
}
