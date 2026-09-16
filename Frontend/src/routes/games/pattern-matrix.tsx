import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import PatternMatrix from "@/features/games/games/PatternMatrix";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/pattern-matrix")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Pattern Matrix | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: PatternMatrixPage,
});

function PatternMatrixPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("pattern-matrix")!;
  return (
    <GameShell game={game} level={level}>
      <PatternMatrix level={level} />
    </GameShell>
  );
}
