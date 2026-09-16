import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import VisualSearch from "@/features/games/games/VisualSearch";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/visual-search")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Visual Search | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: VisualSearchPage,
});

function VisualSearchPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("visual-search")!;
  return (
    <GameShell game={game} level={level}>
      <VisualSearch level={level} />
    </GameShell>
  );
}
