import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import CardMatching from "@/features/games/games/CardMatching";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/card-matching")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Card Matching | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: CardMatchingPage,
});

function CardMatchingPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("card-matching")!;
  return (
    <GameShell game={game} level={level}>
      <CardMatching level={level} />
    </GameShell>
  );
}
