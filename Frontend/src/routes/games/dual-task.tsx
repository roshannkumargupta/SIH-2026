import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import DualTask from "@/features/games/games/DualTask";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/dual-task")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Dual Task | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: DualTaskPage,
});

function DualTaskPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("dual-task")!;
  return (
    <GameShell game={game} level={level}>
      <DualTask level={level} />
    </GameShell>
  );
}
