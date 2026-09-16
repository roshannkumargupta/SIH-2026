import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import QuickMath from "@/features/games/games/QuickMath";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/quick-math")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Quick Math | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: QuickMathPage,
});

function QuickMathPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("quick-math")!;
  return (
    <GameShell game={game} level={level}>
      <QuickMath level={level} />
    </GameShell>
  );
}
