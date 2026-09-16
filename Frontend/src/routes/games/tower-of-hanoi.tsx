import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import TowerOfHanoi from "@/features/games/games/TowerOfHanoi";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/tower-of-hanoi")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Tower Of Hanoi | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: TowerOfHanoiPage,
});

function TowerOfHanoiPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("tower-of-hanoi")!;
  return (
    <GameShell game={game} level={level}>
      <TowerOfHanoi level={level} />
    </GameShell>
  );
}
