import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import AnagramSolver from "@/features/games/games/AnagramSolver";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/anagram-solver")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Anagram Solver | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: AnagramSolverPage,
});

function AnagramSolverPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("anagram-solver")!;
  return (
    <GameShell game={game} level={level}>
      <AnagramSolver level={level} />
    </GameShell>
  );
}
