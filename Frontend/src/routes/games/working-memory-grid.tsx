import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import WorkingMemoryGrid from "@/features/games/games/WorkingMemoryGrid";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/working-memory-grid")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Working Memory Grid | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: WorkingMemoryGridPage,
});

function WorkingMemoryGridPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("working-memory-grid")!;
  return (
    <GameShell game={game} level={level}>
      <WorkingMemoryGrid level={level} />
    </GameShell>
  );
}
